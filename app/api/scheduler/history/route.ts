import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const memberId = req.nextUrl.searchParams.get('memberId')
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

    const supabase = createServerClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('member_id', memberId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('History GET error:', err)
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 })
  }
}
