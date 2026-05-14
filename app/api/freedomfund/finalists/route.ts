import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const drawId = req.nextUrl.searchParams.get('drawId')
  if (!drawId) return NextResponse.json({ error: 'Missing drawId' }, { status: 400 })

  const supabase = createServerClient()

  const [{ data: config }, { data: finalists }] = await Promise.all([
    supabase.from('freedom_fund_config').select('phase').eq('id', drawId).single(),
    supabase.from('freedom_fund_finalists').select('id, member_id, member_name, member_tier, idea_title, idea_description, draw_number').eq('draw_id', drawId).order('draw_number'),
  ])

  if (!finalists) return NextResponse.json([])

  if (config?.phase === 'results') {
    const { data: votes } = await supabase.from('freedom_fund_votes').select('finalist_id').eq('draw_id', drawId)
    const totalVotes = votes?.length || 0
    const voteCounts: Record<string, number> = {}
    votes?.forEach(v => { voteCounts[v.finalist_id] = (voteCounts[v.finalist_id] || 0) + 1 })

    return NextResponse.json(finalists.map(f => ({
      id: f.id,
      memberId: f.member_id,
      memberName: f.member_name,
      memberTier: f.member_tier,
      ideaTitle: f.idea_title,
      ideaDescription: f.idea_description,
      drawNumber: f.draw_number,
      votePct: totalVotes > 0 ? Math.round((voteCounts[f.id] || 0) / totalVotes * 100) : 0,
    })))
  }

  return NextResponse.json(finalists.map(f => ({
    id: f.id,
    memberId: f.member_id,
    memberName: f.member_name,
    memberTier: f.member_tier,
    ideaTitle: f.idea_title,
    ideaDescription: f.idea_description,
    drawNumber: f.draw_number,
  })))
}
