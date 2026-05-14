import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function checkAdmin() {
  return cookies().get('admin_authed')?.value === 'true'
}

export async function POST(req: NextRequest) {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { drawId, drawDate, submissionHours, votingHours, prizeAmount, message, phase } = await req.json()
  const supabase = createServerClient()

  if (drawId) {
    const { data: current } = await supabase.from('freedom_fund_config').select('phase, draw_date, prize_amount').eq('id', drawId).single()

    await supabase.from('freedom_fund_config').update({
      draw_date: drawDate,
      submission_hours: submissionHours,
      voting_hours: votingHours,
      prize_amount: prizeAmount,
      message,
      phase,
      updated_at: new Date().toISOString(),
    }).eq('id', drawId)

    if (phase === 'results' && current?.phase !== 'results') {
      const { data: votes } = await supabase.from('freedom_fund_votes').select('finalist_id').eq('draw_id', drawId)
      const totalVotes = votes?.length || 0
      const voteCounts: Record<string, number> = {}
      votes?.forEach(v => { voteCounts[v.finalist_id] = (voteCounts[v.finalist_id] || 0) + 1 })

      let winnerId = '', maxVotes = 0
      Object.entries(voteCounts).forEach(([id, count]) => { if (count > maxVotes) { maxVotes = count; winnerId = id } })

      if (winnerId) {
        const { data: winner } = await supabase.from('freedom_fund_finalists').select('member_name, member_tier, idea_title, idea_description').eq('id', winnerId).single()
        const { data: claims } = await supabase.from('freedom_fund_claims').select('entries_awarded').eq('draw_id', drawId)
        const totalBonus = claims?.reduce((s, c) => s + (c.entries_awarded || 0), 0) || 0

        await supabase.from('freedom_fund_history').insert({
          draw_date: current?.draw_date,
          winner_name: winner?.member_name,
          winner_tier: winner?.member_tier,
          winner_idea_title: winner?.idea_title,
          winner_idea_description: winner?.idea_description,
          winner_vote_pct: totalVotes > 0 ? Math.round(maxVotes / totalVotes * 100) : 0,
          prize_amount: prizeAmount || current?.prize_amount,
          total_entries: totalBonus,
          total_votes: totalVotes,
        })
      }
    }
  } else {
    await supabase.from('freedom_fund_config').insert({
      draw_date: drawDate,
      submission_hours: submissionHours || 72,
      voting_hours: votingHours || 72,
      prize_amount: prizeAmount || 10000,
      message: message || '',
      phase: phase || 'draw',
    })
  }

  return NextResponse.json({ success: true })
}
