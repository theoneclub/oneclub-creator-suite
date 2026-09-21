import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleOptions, json } from '../_shared/cors.ts'
import {
  GENERATE_BATCH_CAP,
  GENERATE_LEAD_CREDIT_COST,
  checkRateLimit,
  isOutreachTierAllowed,
  logUsage,
  withinFollowerTiers,
} from '../_shared/config.ts'
import { searchInstagramByHashtags, searchTiktokByKeywords, ScrapedPost } from '../_shared/apify.ts'
import { firstNameFrom } from '../_shared/utils.ts'
import { buildOutreachDraftPrompt, parseDraftMessages } from '../_shared/prompts.ts'
import { callClaude } from '../_shared/claude.ts'

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const { memberId, audience, platform, keywords, quantity, followerTiers } = await req.json()

    if (!memberId) return json({ error: 'Unauthorized' }, 401)
    if (!audience || !platform) return json({ error: 'Missing audience or platform.' }, 400)
    if (!keywords || keywords.length === 0) {
      return json({ error: 'At least one keyword is required to search.' }, 400)
    }

    const allowed = await checkRateLimit(supabase, memberId, 'outreach_discover')
    if (!allowed) return json({ error: 'Daily limit reached. Resets at midnight.' }, 429)

    const requested = Math.max(1, Math.min(Number(quantity) || 10, GENERATE_BATCH_CAP))

    const { data: credits } = await supabase
      .from('member_credits')
      .select('tier, credits_remaining')
      .eq('member_id', memberId)
      .single()

    if (!isOutreachTierAllowed(credits?.tier)) return json({ error: 'TIER_NOT_ALLOWED' }, 403)
    const estimatedCost = requested * GENERATE_LEAD_CREDIT_COST
    if (!credits || credits.credits_remaining < estimatedCost) return json({ error: 'NO_CREDITS' }, 402)

    const searchLimit = requested * 3
    let posts: ScrapedPost[] = []
    try {
      posts = platform === 'instagram'
        ? await searchInstagramByHashtags(keywords, searchLimit)
        : await searchTiktokByKeywords(keywords, searchLimit)
    } catch (err) {
      console.error('Apify discovery failed:', err)
      return json({ error: 'Lead discovery failed. Try again in a moment.' }, 502)
    }

    const tierKeys = audience === 'influencer' ? (followerTiers ?? []) : []
    const filtered = posts.filter(p => withinFollowerTiers(p.followers, tierKeys)).slice(0, requested)

    if (filtered.length === 0) {
      return json({ leads: [], message: 'No matching accounts found for those keywords. Try different or broader keywords.' })
    }

    const niche = keywords.join(', ')
    const drafted = await Promise.all(
      filtered.map(async post => {
        const firstName = firstNameFrom(post.displayName)
        try {
          const draftPrompt = buildOutreachDraftPrompt({
            audience, platform, firstName, handle: post.handle, bio: post.bio, followers: post.followers, niche,
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
      needs_enrichment: true,
    }))

    const { data: leads, error } = await supabase.rpc('outreach_add_leads_batch', {
      p_member_id: memberId,
      p_cost_per_lead: GENERATE_LEAD_CREDIT_COST,
      p_leads: leadsPayload,
    })

    if (error) {
      if (error.message?.includes('NO_CREDITS')) return json({ error: 'NO_CREDITS' }, 402)
      return json({ error: error.message }, 500)
    }

    await logUsage(supabase, memberId, 'outreach_discover')

    return json({ leads: leads ?? [] })
  } catch (err) {
    console.error('outreach-discover error:', err)
    return json({ error: 'Discovery failed. Try again in a moment.' }, 500)
  }
})
