import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

function checkAdmin() {
  return cookies().get('admin_authed')?.value === 'true'
}

export async function GET() {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServerClient()
  const { data } = await supabase.from('freedom_fund_actions').select('*').order('sort_order')
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const supabase = createServerClient()

  if (body.id) {
    await supabase.from('freedom_fund_actions').update({ active: body.active }).eq('id', body.id)
  } else {
    const { data: last } = await supabase.from('freedom_fund_actions').select('sort_order').order('sort_order', { ascending: false }).limit(1).single()
    await supabase.from('freedom_fund_actions').insert({ icon: body.icon, label: body.label, entries: body.entries, url: body.url, sort_order: (last?.sort_order || 0) + 1 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await createServerClient().from('freedom_fund_actions').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
