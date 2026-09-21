import { Tier } from '@/types'

// Confirmed with the platform owner (2026-09-20): every tier gets access to
// the Outreach Leads tool. Credits are the real throttle, not tier.
export const OUTREACH_ALLOWED_TIERS: Tier[] = ['starter', 'premium', 'elite', 'founding']

export function isOutreachTierAllowed(tier: string | null | undefined): boolean {
  return OUTREACH_ALLOWED_TIERS.includes((tier ?? 'starter') as Tier)
}

// Credit costs — confirmed against the build doc's defaults, priced for
// comfortable margin over Apify's real per-lookup cost (~0.05-0.26 cents).
export const ADD_LEAD_CREDIT_COST = 8
export const GENERATE_LEAD_CREDIT_COST = 2

// Hard per-click ceiling on a single "Generate leads" request. This is a
// reliability limit, not a revenue cap: the flow is fully synchronous
// (Apify call -> a Claude draft call per lead -> DB writes, all in one
// request), so an unbounded batch risks the serverless function timing out
// mid-run. A member can click "Generate" again immediately for more.
export const GENERATE_BATCH_CAP = 25

export const FOLLOWER_TIERS: Record<string, { label: string; min: number; max: number }> = {
  nano:  { label: 'Nano (1K-10K)',    min: 1_000,   max: 10_000 },
  micro: { label: 'Micro (10K-100K)', min: 10_000,  max: 100_000 },
  macro: { label: 'Macro (100K-1M)',  min: 100_000, max: 1_000_000 },
}

export type FollowerTierKey = keyof typeof FOLLOWER_TIERS

// Which BYOK email providers support a direct "Send via [provider]" action
// vs. copy-paste only. Kept here (not in lib/emailProviders.ts) so client
// components can check it without bundling the server-only send logic.
export function providerSupportsSend(provider: string): boolean {
  return provider === 'brevo' || provider === 'mailchimp'
}

// Your own affiliate link per provider, used as the fallback when a member
// hasn't set their own in "My affiliate links". Set these via env vars —
// falls back to the plain (non-affiliate) homepage if unset, never a dead
// link. Fill in DEFAULT_AFFILIATE_LINK_* in your deployment env.
export const DEFAULT_AFFILIATE_LINKS: Record<string, string> = {
  brevo: process.env.DEFAULT_AFFILIATE_LINK_BREVO || 'https://www.brevo.com/',
  mailchimp: process.env.DEFAULT_AFFILIATE_LINK_MAILCHIMP || 'https://mailchimp.com/',
  convertkit: process.env.DEFAULT_AFFILIATE_LINK_CONVERTKIT || 'https://convertkit.com/',
}
