import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function checkAdmin() {
  return cookies().get('admin_authed')?.value === 'true'
}

export async function GET() {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data: config } = await supabase.from('freedom_fund_config').select('*').order('created_at', { ascending: false }).limit(1).single()
  if (!config) return NextResponse.json({ error: 'No active draw' }, { status: 404 })

  const [membersRes, claimsRes, finalistsRes, votesRes] = await Promise.all([
    supabase.from('member_credits').select('member_id, member_name, tier, entries'),
    supabase.from('freedom_fund_claims').select('member_id, entries_awarded').eq('draw_id', config.id),
    supabase.from('freedom_fund_finalists').select('id, member_id, member_name, member_tier, idea_title, draw_number, entries').eq('draw_id', config.id).order('draw_number'),
    supabase.from('freedom_fund_votes').select('finalist_id').eq('draw_id', config.id),
  ])

  const members = membersRes.data || []
  const claims = claimsRes.data || []
  const finalists = finalistsRes.data || []
  const votes = votesRes.data || []

  const bonusMap: Record<string, number> = {}
  claims.forEach(c => { bonusMap[c.member_id] = (bonusMap[c.member_id] || 0) + (c.entries_awarded || 0) })

  const drawnIds = new Set(finalists.map(f => f.member_id))
  const totalEntries = members.reduce((s, m) => s + (m.entries || 0) + (bonusMap[m.member_id] || 0), 0)

  const voteCounts: Record<string, number> = {}
  votes.forEach(v => { voteCounts[v.finalist_id] = (voteCounts[v.finalist_id] || 0) + 1 })

  return NextResponse.json({
    drawId: config.id,
    phase: config.phase,
    totalMembers: members.length,
    totalEntries,
    finalistsDrawn: finalists.length,
    submissionsReceived: finalists.filter(f => f.idea_title).length,
    totalVotes: votes.length,
    finalistVotes: finalists.map(f => ({
      id: f.id,
      memberId: f.member_id,
      memberName: f.member_name,
      memberTier: f.member_tier,
      ideaTitle: f.idea_title,
      drawNumber: f.draw_number,
      entries: f.entries,
      voteCount: voteCounts[f.id] || 0,
      votePct: votes.length > 0 ? Math.round((voteCounts[f.id] || 0) / votes.length * 100) : 0,
    })),
    members: members.map(m => ({
      memberId: m.member_id,
      memberName: m.member_name || m.member_id,
      tier: m.tier,
      baseEntries: m.entries || 0,
      bonusEntries: bonusMap[m.member_id] || 0,
      totalEntries: (m.entries || 0) + (bonusMap[m.member_id] || 0),
      drawn: drawnIds.has(m.member_id),
    })),
  })
}
