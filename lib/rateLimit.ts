import { createServerClient } from './supabase-server'

const DAILY_LIMITS: Record<string, number> = {
  content: 50,
  email: 30,
  sms: 30,
  outreach: 30,
  brain: 20,
}

export async function checkRateLimit(
  memberId: string,
  action: string
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createServerClient()
  const limit = DAILY_LIMITS[action] ?? 20

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('action', action)
    .gte('created_at', todayStart.toISOString())

  const used = count ?? 0
  return { allowed: used < limit, remaining: Math.max(0, limit - used) }
}

export async function logUsage(memberId: string, action: string): Promise<void> {
  const supabase = createServerClient()
  await supabase.from('usage_log').insert({ member_id: memberId, action })
}
