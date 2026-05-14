import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('freedom_fund_config')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return NextResponse.json({ error: 'No active draw' }, { status: 404 })

  const drawDate = new Date(data.draw_date)
  const submissionDeadline = new Date(drawDate.getTime() + data.submission_hours * 3600000)
  const votingDeadline = new Date(submissionDeadline.getTime() + data.voting_hours * 3600000)

  return NextResponse.json({
    id: data.id,
    drawDate: data.draw_date,
    submissionDeadline: submissionDeadline.toISOString(),
    votingDeadline: votingDeadline.toISOString(),
    prizeAmount: data.prize_amount,
    phase: data.phase,
    message: data.message,
  })
}
