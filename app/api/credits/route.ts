import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const TIER_DEFAULTS = {
  starter:  { credits: 10,   entries: 10 },
  premium:  { credits: 500,  entries: 20 },
  elite:    { credits: 2000, entries: 50 },
  founding: { credits: 500,  entries: 50 },
}

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  let { data } = await supabase.from('member_credits').select('*').eq('member_id', memberId).single()

  if (!data) {
    const defaults = TIER_DEFAULTS.starter
    const { data: created } = await supabase
      .from('member_credits')
      .insert({
        member_id: memberId,
        tier: 'starter',
        credits_remaining: defaults.credits,
        credits_total: defaults.credits,
        entries: defaults.entries,
        reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()
    data = created
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { memberId, action } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (action !== 'deduct') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const supabase = createServerClient()
  const { data } = await supabase.from('member_credits').select('credits_remaining').eq('member_id', memberId).single()
  if (!data || data.credits_remaining <= 0) return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })

  await supabase
    .from('member_credits')
    .update({ credits_remaining: data.credits_remaining - 1, updated_at: new Date().toISOString() })
    .eq('member_id', memberId)

  return NextResponse.json({ success: true, remaining: data.credits_remaining - 1 })
}
