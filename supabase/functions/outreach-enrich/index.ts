import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleOptions, json } from '../_shared/cors.ts'
import { ADD_LEAD_CREDIT_COST, checkRateLimit, isOutreachTierAllowed, logUsage } from '../_shared/config.ts'
import { fetchInstagramProfile, fetchTiktokProfile } from '../_shared/apify.ts'
import { extractHandle, firstNameFrom } from '../_shared/utils.ts'
import { buildOutreachDraftPrompt, parseDraftMessages } from '../_shared/prompts.ts'
import { callClaude } from '../_shared/claude.ts'

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const { memberId, audience, platform, profileInput, niche, manualFirstName } = await req.json()

    if (!memberId) return json({ error: 'Unauthorized' }, 401)
    if (!audience || !platform || !profileInput) {
      return json({ error: 'Missing audience, platform, or profile input.' }, 400)
    }

    const allowed = await checkRateLimit(supabase, memberId, 'outreach_enrich')
    if (!allowed) return json({ error: 'Daily limit reached. Resets at midnight.' }, 429)

    const { data: credits } = await supabase
      .from('member_credits')
      .select('tier, credits_remaining')
      .eq('member_id', memberId)
      .single()

    if (!isOutreachTierAllowed(credits?.tier)) return json({ error: 'TIER_NOT_ALLOWED' }, 403)
    if (!credits || credits.credits_remaining < ADD_LEAD_CREDIT_COST) return json({ error: 'NO_CREDITS' }, 402)

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
      if (error.message?.includes('NO_CREDITS')) return json({ error: 'NO_CREDITS' }, 402)
      return json({ error: error.message }, 500)
    }

    await logUsage(supabase, memberId, 'outreach_enrich')

    return json(lead)
  } catch (err) {
    console.error('outreach-enrich error:', err)
    return json({ error: 'Enrichment failed. Try again in a moment.' }, 500)
  }
})
