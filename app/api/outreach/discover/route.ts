import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { buildOutreachDraftPrompt, parseDraftMessages } from '@/lib/outreachPrompts'
import { checkRateLimit, logUsage } from '@/lib/rateLimit'
import { createServerClient } from '@/lib/supabase-server'
import { searchInstagramByHashtags, searchTiktokByKeywords, ScrapedPost } from '@/lib/apify'
import { firstNameFrom } from '@/lib/outreachUtils'
import {
  FOLLOWER_TIERS,
  FollowerTierKey,
  GENERATE_BATCH_CAP,
  GENERATE_LEAD_CREDIT_COST,
  isOutreachTierAllowed,
} from '@/lib/outreachConfig'
import { LeadAudience } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function withinFollowerTiers(followers: number | null, tierKeys: FollowerTierKey[]): boolean {
  if (tierKeys.length === 0) return true
  if (followers == null) return false
  return tierKeys.some(key => {
    const band = FOLLOWER_TIERS[key]
    return band && followers >= band.min && followers <= band.max
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      memberId,
      audience,
      platform,
      keywords,
      quantity,
      followerTiers,
    }: {
      memberId?: string
      audience?: LeadAudience
      platform?: 'instagram' | 'tiktok'
      keywords?: string[]
      quantity?: number
      followerTiers?: FollowerTierKey[]
    } = body

    if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!audience || !platform) return NextResponse.json({ error: 'Missing audience or platform.' }, { status: 400 })
    if (!keywords || keywords.length === 0) {
      // Apify's keyword/hashtag search actors require at least one search
      // term for both audiences — there's no vendor-side "outlier scan"
      // equivalent without a keyword, unlike the vidIQ-based prototype.
      return NextResponse.json({ error: 'At least one keyword is required to search.' }, { status: 400 })
    }

    const { allowed } = await checkRateLimit(memberId, 'outreach_discover')
    if (!allowed) return NextResponse.json({ error: 'Daily limit reached. Resets at midnight.' }, { status: 429 })

    const requested = Math.max(1, Math.min(Number(quantity) || 10, GENERATE_BATCH_CAP))

    const supabase = createServerClient()
    const { data: credits } = await supabase
      .from('member_credits')
      .select('tier, credits_remaining')
      .eq('member_id', memberId)
      .single()

    if (!isOutreachTierAllowed(credits?.tier)) {
      return NextResponse.json({ error: 'TIER_NOT_ALLOWED' }, { status: 403 })
    }
    const estimatedCost = requested * GENERATE_LEAD_CREDIT_COST
    if (!credits || credits.credits_remaining < estimatedCost) {
      return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })
    }

    const searchLimit = requested * 3 // headroom for follower-tier filtering + dedupe
    let posts: ScrapedPost[] = []
    try {
      posts = platform === 'instagram'
        ? await searchInstagramByHashtags(keywords, searchLimit)
        : await searchTiktokByKeywords(keywords, searchLimit)
    } catch (err) {
      console.error('Apify discovery failed:', err)
      return NextResponse.json({ error: 'Lead discovery failed. Try again in a moment.' }, { status: 502 })
    }

    const tierKeys = audience === 'influencer' ? (followerTiers ?? []) : []
    const filtered = posts.filter(p => withinFollowerTiers(p.followers, tierKeys)).slice(0, requested)

    if (filtered.length === 0) {
      return NextResponse.json({ leads: [], message: 'No matching accounts found for those keywords. Try different or broader keywords.' })
    }

    const niche = keywords.join(', ')
    const drafted = await Promise.all(
      filtered.map(async post => {
        const firstName = firstNameFrom(post.displayName)
        try {
          const draftPrompt = buildOutreachDraftPrompt({
            audience,
            platform,
            firstName,
            handle: post.handle,
            bio: post.bio,
            followers: post.followers,
            niche,
          })
          const raw = await callClaude(draftPrompt, `Draft outreach messages for @${post.handle}.`, 800)
          return { post, firstName, draftMessage: parseDraftMessages(raw) }
        } catch (err) {
          console.error('Draft generation failed for', post.handle, err)
          return { post, firstName, draftMessage: null }
        }
      })
    )

    const leadsPayload = drafted.map(({ post, firstName, draftMessage }) => ({
      audience,
      platform,
      handle: post.handle,
      first_name: firstName,
      followers: post.followers,
      niche,
      notes: null,
      email: null,
      draft_message: draftMessage,
      needs_enrichment: true, // discovery only yields handle/followers — a human still needs to vet before contacting
    }))

    const { data: leads, error } = await supabase.rpc('outreach_add_leads_batch', {
      p_member_id: memberId,
      p_cost_per_lead: GENERATE_LEAD_CREDIT_COST,
      p_leads: leadsPayload,
    })

    if (error) {
      if (error.message?.includes('NO_CREDITS')) return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logUsage(memberId, 'outreach_discover')

    return NextResponse.json({ leads: leads ?? [] })
  } catch (err) {
    console.error('Outreach discover error:', err)
    return NextResponse.json({ error: 'Discovery failed. Try again in a moment.' }, { status: 500 })
  }
}
