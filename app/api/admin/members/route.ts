import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_authed')?.value === 'true'
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('member_credits')
    .select('member_id, tier, credits_remaining, credits_total, entries, updated_at')
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { memberId, credits_remaining, entries } = await req.json()
  const supabase = createServerClient()
  const updates: Record<string, number> = {}
  if (credits_remaining !== undefined) updates.credits_remaining = credits_remaining
  if (entries !== undefined) updates.entries = entries
  const { error } = await supabase.from('member_credits').update(updates).eq('member_id', memberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
