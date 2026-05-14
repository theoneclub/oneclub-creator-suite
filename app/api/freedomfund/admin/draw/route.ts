import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function checkAdmin() {
  return cookies().get('admin_authed')?.value === 'true'
}

export async function POST(req: NextRequest) {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { drawId } = await req.json()
  if (!drawId) return NextResponse.json({ error: 'Missing drawId' }, { status: 400 })

  const supabase = createServerClient()

  const { data: existing } = await supabase.from('freedom_fund_finalists').select('member_id, draw_number').eq('draw_id', drawId)
  if ((existing?.length || 0) >= 5) return NextResponse.json({ error: 'Already 5 finalists drawn' }, { status: 400 })

  const drawnIds = new Set(existing?.map(f => f.member_id) || [])
  const nextNum = (existing?.length || 0) + 1

  const [{ data: members }, { data: claims }] = await Promise.all([
    supabase.from('member_credits').select('member_id, member_name, tier, entries'),
    supabase.from('freedom_fund_claims').select('member_id, entries_awarded').eq('draw_id', drawId),
  ])

  if (!members?.length) return NextResponse.json({ error: 'No members found' }, { status: 400 })

  const bonusMap: Record<string, number> = {}
  claims?.forEach(c => { bonusMap[c.member_id] = (bonusMap[c.member_id] || 0) + (c.entries_awarded || 0) })

  const eligible = members
    .filter(m => !drawnIds.has(m.member_id))
    .map(m => ({ ...m, totalEntries: Math.max(1, (m.entries || 0) + (bonusMap[m.member_id] || 0)) }))

  if (!eligible.length) return NextResponse.json({ error: 'No eligible members' }, { status: 400 })

  // Weighted random selection
  const totalWeight = eligible.reduce((s, m) => s + m.totalEntries, 0)
  let rand = Math.random() * totalWeight
  let drawn = eligible[0]
  for (const m of eligible) {
    rand -= m.totalEntries
    if (rand <= 0) { drawn = m; break }
  }

  const { data: finalist, error } = await supabase
    .from('freedom_fund_finalists')
    .insert({ draw_id: drawId, member_id: drawn.member_id, member_name: drawn.member_name || drawn.member_id, member_tier: drawn.tier || 'starter', entries: drawn.totalEntries, draw_number: nextNum })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    finalist: {
      id: finalist.id,
      memberId: drawn.member_id,
      memberName: drawn.member_name || drawn.member_id,
      memberTier: drawn.tier || 'starter',
      entries: drawn.totalEntries,
      drawNumber: nextNum,
    },
  })
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { drawId } = await req.json()
  const supabase = createServerClient()
  await supabase.from('freedom_fund_finalists').delete().eq('draw_id', drawId)
  return NextResponse.json({ success: true })
}
