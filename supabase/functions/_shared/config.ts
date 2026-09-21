export const OUTREACH_ALLOWED_TIERS = ['starter', 'premium', 'elite', 'founding']

export function isOutreachTierAllowed(tier: string | null | undefined): boolean {
  return OUTREACH_ALLOWED_TIERS.includes(tier ?? 'starter')
}

export const ADD_LEAD_CREDIT_COST = 8
export const GENERATE_LEAD_CREDIT_COST = 2

// Hard per-click ceiling on a single "Generate leads" request — a
// reliability limit (bounded function execution time), not a revenue cap.
export const GENERATE_BATCH_CAP = 25

export const FOLLOWER_TIERS: Record<string, { min: number; max: number }> = {
  nano: { min: 1_000, max: 10_000 },
  micro: { min: 10_000, max: 100_000 },
  macro: { min: 100_000, max: 1_000_000 },
}

export function withinFollowerTiers(followers: number | null, tierKeys: string[]): boolean {
  if (tierKeys.length === 0) return true
  if (followers == null) return false
  return tierKeys.some(key => {
    const band = FOLLOWER_TIERS[key]
    return band && followers >= band.min && followers <= band.max
  })
}

export const DEFAULT_AFFILIATE_LINKS: Record<string, string> = {
  brevo: Deno.env.get('DEFAULT_AFFILIATE_LINK_BREVO') || 'https://www.brevo.com/',
  mailchimp: Deno.env.get('DEFAULT_AFFILIATE_LINK_MAILCHIMP') || 'https://mailchimp.com/',
  convertkit: Deno.env.get('DEFAULT_AFFILIATE_LINK_CONVERTKIT') || 'https://convertkit.com/',
}

export function providerSupportsSend(provider: string): boolean {
  return provider === 'brevo' || provider === 'mailchimp'
}

const DAILY_LIMITS: Record<string, number> = {
  outreach_enrich: 60,
  outreach_discover: 15,
}

export async function checkRateLimit(
  supabase: { from: (t: string) => any },
  memberId: string,
  action: string
): Promise<boolean> {
  const limit = DAILY_LIMITS[action] ?? 20
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('action', action)
    .gte('created_at', todayStart.toISOString())

  return (count ?? 0) < limit
}

export async function logUsage(supabase: { from: (t: string) => any }, memberId: string, action: string): Promise<void> {
  await supabase.from('usage_log').insert({ member_id: memberId, action })
}
