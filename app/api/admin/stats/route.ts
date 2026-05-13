import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_authed')?.value === 'true'
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = createServerClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)

  const [todayLogs, weekLogs, brainCount, tierData] = await Promise.all([
    supabase.from('usage_log').select('member_id, action').gte('created_at', todayStart.toISOString()),
    supabase.from('usage_log').select('member_id, action').gte('created_at', weekStart.toISOString()),
    supabase.from('global_brain').select('id', { count: 'exact', head: true }),
    supabase.from('member_credits').select('tier'),
  ])

  const todayData = todayLogs.data ?? []
  const weekData = weekLogs.data ?? []

  const uniqueMembersToday = new Set(todayData.map(r => r.member_id)).size
  const uniqueMembersWeek = new Set(weekData.map(r => r.member_id)).size

  const featureCounts: Record<string, number> = {}
  todayData.forEach(r => { featureCounts[r.action] = (featureCounts[r.action] ?? 0) + 1 })
  const total = todayData.length || 1
  const featureBreakdown = Object.entries(featureCounts).map(([feature, count]) => ({
    feature,
    count,
    pct: Math.round((count / total) * 100),
  }))

  const tierCounts: Record<string, number> = {}
  ;(tierData.data ?? []).forEach(r => { tierCounts[r.tier] = (tierCounts[r.tier] ?? 0) + 1 })
  const tierBreakdown = Object.entries(tierCounts).map(([tier, count]) => ({ tier, count }))

  return NextResponse.json({
    totalMembersToday: uniqueMembersToday,
    totalMembersWeek: uniqueMembersWeek,
    generationsToday: todayData.length,
    generationsWeek: weekData.length,
    featureBreakdown,
    tierBreakdown,
    globalBrainCount: brainCount.count ?? 0,
  })
}
