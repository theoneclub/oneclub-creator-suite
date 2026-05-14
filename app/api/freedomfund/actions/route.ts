import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createServerClient()
  const { data } = await supabase.from('freedom_fund_actions').select('id, icon, label, entries, url, active').eq('active', true).order('sort_order')
  return NextResponse.json(data || [])
}
