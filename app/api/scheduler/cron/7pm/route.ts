import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { AvatarSettings } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function getScheduledFor(hour: number): string {
  const now = new Date()
  const aest = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }))
  aest.setHours(hour, 0, 0, 0)
  return aest.toISOString()
}

async function generateAndSchedule(
  memberId: string,
  angle: 'pain' | 'prize' | 'news',
  scheduledFor: string,
  baseUrl: string,
  avatarSettings: AvatarSettings,
  platforms: string[]
) {
  const genRes = await fetch(`${baseUrl}/api/scheduler/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId, angle, avatarSettings, useBrandBrain: true }),
  })
  if (!genRes.ok) throw new Error('Generation failed')
  const { post } = await genRes.json()

  const schedRes = await fetch(`${baseUrl}/api/scheduler/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId: post.id, memberId, platforms, scheduledFor }),
  })
  if (!schedRes.ok) throw new Error('Scheduling failed')

  return post.id
}

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const baseUrl = req.nextUrl.origin

  const { data: settings } = await supabase
    .from('scheduler_settings')
    .select('*')
    .eq('enabled', true)
    .eq('time_7pm', true)

  if (!settings?.length) return NextResponse.json({ success: true, postsScheduled: 0, errors: 0 })

  const scheduledFor = getScheduledFor(19)
  let postsScheduled = 0
  let errors = 0

  for (const s of settings) {
    try {
      const avatarRes = await fetch(`${baseUrl}/api/avatar?memberId=${s.member_id}`)
      const avatarSettings: AvatarSettings = avatarRes.ok ? await avatarRes.json() : {}

      const platforms = Object.entries(s.platforms as Record<string, boolean>)
        .filter(([, v]) => v)
        .map(([k]) => k)

      await generateAndSchedule(s.member_id, 'news', scheduledFor, baseUrl, avatarSettings, platforms)
      postsScheduled++
    } catch (err) {
      console.error(`Cron 7pm failed for ${s.member_id}:`, err)
      errors++
    }
  }

  return NextResponse.json({ success: true, postsScheduled, errors })
}
