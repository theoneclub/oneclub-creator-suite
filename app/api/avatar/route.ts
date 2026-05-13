import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data } = await supabase.from('member_avatar').select('settings').eq('member_id', memberId).single()
  return NextResponse.json(data?.settings ?? {})
}

export async function POST(req: NextRequest) {
  const { memberId, settings } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { error } = await supabase
    .from('member_avatar')
    .upsert({ member_id: memberId, settings, updated_at: new Date().toISOString() }, { onConflict: 'member_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
