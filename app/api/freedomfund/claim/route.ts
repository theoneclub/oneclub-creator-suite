import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const BONUS_UNLOCKED_TIERS = new Set(['starter', 'premium', 'elite', 'founding'])

export async function POST(req: NextRequest) {
  const { memberId, actionId, drawId } = await req.json()
  if (!memberId || !actionId || !drawId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = createServerClient()

  const [{ data: member }, { data: config }, { data: action }] = await Promise.all([
    supabase.from('member_credits').select('tier, entries').eq('member_id', memberId).single(),
    supabase.from('freedom_fund_config').select('phase').eq('id', drawId).single(),
    supabase.from('freedom_fund_actions').select('entries, active').eq('id', actionId).single(),
  ])

  const tier = (member?.tier || 'starter').toLowerCase()
  if (!BONUS_UNLOCKED_TIERS.has(tier)) return NextResponse.json({ error: 'Upgrade required for bonus entries' }, { status: 403 })
  if (!config || config.phase !== 'draw') return NextResponse.json({ error: 'Bonus entries can only be claimed before the draw' }, { status: 400 })
  if (!action || !action.active) return NextResponse.json({ error: 'Action not available' }, { status: 404 })

  const { data: existing } = await supabase
    .from('freedom_fund_claims')
    .select('id')
    .eq('member_id', memberId)
    .eq('action_id', actionId)
    .eq('draw_id', drawId)
    .single()

  if (existing) return NextResponse.json({ error: 'Already claimed' }, { status: 400 })

  const { error } = await supabase.from('freedom_fund_claims').insert({
    member_id: memberId,
    action_id: actionId,
    draw_id: drawId,
    entries_awarded: action.entries,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: allClaims } = await supabase.from('freedom_fund_claims').select('entries_awarded').eq('member_id', memberId).eq('draw_id', drawId)
  const bonusTotal = allClaims?.reduce((s, c) => s + (c.entries_awarded || 0), 0) || 0
  const newTotal = (member?.entries || 0) + bonusTotal

  return NextResponse.json({ success: true, entriesAwarded: action.entries, newTotal })
}
