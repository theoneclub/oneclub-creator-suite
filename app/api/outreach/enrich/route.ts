import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { buildOutreachDraftPrompt, parseDraftMessages } from '@/lib/outreachPrompts'
import { checkRateLimit, logUsage } from '@/lib/rateLimit'
import { createServerClient } from '@/lib/supabase-server'
import { fetchInstagramProfile, fetchTiktokProfile } from '@/lib/apify'
import { extractHandle, firstNameFrom } from '@/lib/outreachUtils'
import { ADD_LEAD_CREDIT_COST, isOutreachTierAllowed } from '@/lib/outreachConfig'
import { LeadAudience, LeadPlatform } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      memberId,
      audience,
      platform,
      profileInput,
      niche,
      manualFirstName,
    }: {
      memberId?: string
      audience?: LeadAudience
      platform?: LeadPlatform
      profileInput?: string
      niche?: string
      manualFirstName?: string
    } = body

    if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!audience || !platform || !profileInput) {
      return NextResponse.json({ error: 'Missing audience, platform, or profile input.' }, { status: 400 })
    }

    const { allowed } = await checkRateLimit(memberId, 'outreach_enrich')
    if (!allowed) return NextResponse.json({ error: 'Daily limit reached. Resets at midnight.' }, { status: 429 })

    const supabase = createServerClient()
    const { data: credits } = await supabase
      .from('member_credits')
      .select('tier, credits_remaining')
      .eq('member_id', memberId)
      .single()

    if (!isOutreachTierAllowed(credits?.tier)) {
      return NextResponse.json({ error: 'TIER_NOT_ALLOWED' }, { status: 403 })
    }
    if (!credits || credits.credits_remaining < ADD_LEAD_CREDIT_COST) {
      return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })
    }

    const handle = extractHandle(platform, profileInput)

    let profile: { displayName: string | null; bio: string | null; followers: number | null; email: string | null } | null = null
    let needsEnrichment = false

    if (platform === 'linkedin') {
      // LinkedIn scraping is unreliable/high-risk on Apify — permanent
      // no-enrichment fallback, not a v1 gap.
      needsEnrichment = true
    } else {
      try {
        profile = platform === 'instagram' ? await fetchInstagramProfile(handle) : await fetchTiktokProfile(handle)
        if (!profile) needsEnrichment = true
      } catch (err) {
        console.error('Apify enrichment failed:', err)
        needsEnrichment = true
      }
    }

    const firstName = manualFirstName?.trim() || firstNameFrom(profile?.displayName ?? null)

    const draftPrompt = buildOutreachDraftPrompt({
      audience,
      platform,
      firstName: firstName || null,
      handle,
      bio: profile?.bio ?? null,
      followers: profile?.followers ?? null,
      niche: niche ?? null,
    })
    const raw = await callClaude(draftPrompt, `Draft outreach messages for @${handle}.`, 800)
    const draftMessage = parseDraftMessages(raw)

    const { data: lead, error } = await supabase.rpc('outreach_add_lead', {
      p_member_id: memberId,
      p_cost: ADD_LEAD_CREDIT_COST,
      p_lead: {
        audience,
        platform,
        handle,
        first_name: firstName || null,
        followers: profile?.followers ?? null,
        niche: niche ?? null,
        notes: null,
        email: profile?.email ?? null,
        draft_message: draftMessage,
        needs_enrichment: needsEnrichment,
      },
    })

    if (error) {
      if (error.message?.includes('NO_CREDITS')) return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logUsage(memberId, 'outreach_enrich')

    return NextResponse.json(lead)
  } catch (err) {
    console.error('Outreach enrich error:', err)
    return NextResponse.json({ error: 'Enrichment failed. Try again in a moment.' }, { status: 500 })
  }
}
