import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { memberId, drawId, finalistId, title, description } = await req.json()
  if (!memberId || !drawId || !finalistId || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = createServerClient()

  const { data: config } = await supabase.from('freedom_fund_config').select('phase, draw_date, submission_hours').eq('id', drawId).single()

  if (!config || config.phase !== 'submissions') return NextResponse.json({ error: 'Not in submissions phase' }, { status: 400 })

  const submissionDeadline = new Date(new Date(config.draw_date).getTime() + config.submission_hours * 3600000)
  if (new Date() > submissionDeadline) return NextResponse.json({ error: 'Submission window closed' }, { status: 400 })

  const { data: finalist } = await supabase
    .from('freedom_fund_finalists')
    .select('id, idea_title')
    .eq('id', finalistId)
    .eq('draw_id', drawId)
    .eq('member_id', memberId)
    .single()

  if (!finalist) return NextResponse.json({ error: 'Not a finalist' }, { status: 403 })
  if (finalist.idea_title) return NextResponse.json({ error: 'Already submitted' }, { status: 400 })

  await supabase
    .from('freedom_fund_finalists')
    .update({ idea_title: title, idea_description: description, submitted_at: new Date().toISOString() })
    .eq('id', finalistId)

  return NextResponse.json({ success: true })
}
