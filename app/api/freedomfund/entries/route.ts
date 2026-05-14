import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const TIER_CONFIG: Record<string, { bonusUnlocked: boolean; baseEntries: number }> = {
  bronze:   { bonusUnlocked: false, baseEntries: 1  },
  silver:   { bonusUnlocked: false, baseEntries: 10 },
  gold:     { bonusUnlocked: false, baseEntries: 50 },
  starter:  { bonusUnlocked: true,  baseEntries: 10 },
  premium:  { bonusUnlocked: true,  baseEntries: 20 },
  elite:    { bonusUnlocked: true,  baseEntries: 50 },
  founding: { bonusUnlocked: true,  baseEntries: 50 },
}

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Missing memberId' }, { status: 400 })

  const supabase = createServerClient()

  const [{ data: config }, { data: member }] = await Promise.all([
    supabase.from('freedom_fund_config').select('id').order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('member_credits').select('tier, entries').eq('member_id', memberId).single(),
  ])

  const tier = (member?.tier || 'starter').toLowerCase()
  const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG.starter
  const baseEntries = member?.entries ?? tierConfig.baseEntries

  if (!config) {
    return NextResponse.json({ baseEntries, bonusEntries: 0, totalEntries: baseEntries, tier, bonusUnlocked: tierConfig.bonusUnlocked, completedActions: [], hasVoted: false, votedForId: null })
  }

  const [{ data: claims }, { data: vote }] = await Promise.all([
    supabase.from('freedom_fund_claims').select('action_id, entries_awarded').eq('member_id', memberId).eq('draw_id', config.id),
    supabase.from('freedom_fund_votes').select('finalist_id').eq('draw_id', config.id).eq('voter_member_id', memberId).single(),
  ])

  const bonusEntries = claims?.reduce((s, c) => s + (c.entries_awarded || 0), 0) || 0
  const completedActions = claims?.map(c => c.action_id) || []

  return NextResponse.json({
    baseEntries,
    bonusEntries,
    totalEntries: baseEntries + bonusEntries,
    tier,
    bonusUnlocked: tierConfig.bonusUnlocked,
    completedActions,
    hasVoted: !!vote,
    votedForId: vote?.finalist_id || null,
    drawId: config.id,
  })
}
