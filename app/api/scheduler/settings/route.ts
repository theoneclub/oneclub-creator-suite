import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { SchedulerSettings } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const memberId = req.nextUrl.searchParams.get('memberId')
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

    const supabase = createServerClient()
    const { data } = await supabase
      .from('scheduler_settings')
      .select('*')
      .eq('member_id', memberId)
      .single()

    if (!data) {
      // Return defaults
      return NextResponse.json({
        member_id: memberId,
        enabled: false,
        time_8am: true,
        time_1pm: true,
        time_7pm: true,
        timezone: 'Australia/Sydney',
        platforms: { instagram: true, facebook: true, twitter: true, threads: true },
        use_brand_brain: true,
      } as SchedulerSettings)
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Settings GET error:', err)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memberId, ...settings } = body

    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('scheduler_settings')
      .upsert({ member_id: memberId, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'member_id' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('Settings POST error:', err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
