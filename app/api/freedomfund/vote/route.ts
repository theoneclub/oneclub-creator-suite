import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { memberId, drawId, finalistId } = await req.json()
  if (!memberId || !drawId || !finalistId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = createServerClient()

  const { data: config } = await supabase.from('freedom_fund_config').select('phase, draw_date, submission_hours, voting_hours').eq('id', drawId).single()

  if (!config || config.phase !== 'voting') return NextResponse.json({ error: 'Not in voting phase' }, { status: 400 })

  const submissionDeadline = new Date(new Date(config.draw_date).getTime() + config.submission_hours * 3600000)
  const votingDeadline = new Date(submissionDeadline.getTime() + config.voting_hours * 3600000)
  if (new Date() > votingDeadline) return NextResponse.json({ error: 'Voting window closed' }, { status: 400 })

  const { data: finalist } = await supabase.from('freedom_fund_finalists').select('member_id').eq('id', finalistId).single()
  if (finalist?.member_id === memberId) return NextResponse.json({ error: 'Cannot vote for yourself' }, { status: 400 })

  const { data: existingVote } = await supabase
    .from('freedom_fund_votes')
    .select('id')
    .eq('draw_id', drawId)
    .eq('voter_member_id', memberId)
    .single()

  if (existingVote) return NextResponse.json({ error: 'Already voted' }, { status: 400 })

  const { error } = await supabase.from('freedom_fund_votes').insert({ draw_id: drawId, voter_member_id: memberId, finalist_id: finalistId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
