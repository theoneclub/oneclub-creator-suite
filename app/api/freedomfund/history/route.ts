import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('freedom_fund_history')
    .select('*')
    .order('draw_date', { ascending: false })

  return NextResponse.json(data || [])
}
