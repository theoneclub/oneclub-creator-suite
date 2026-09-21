import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getAllAffiliateLinks } from '@/lib/affiliateLinks'

export const dynamic = 'force-dynamic'

// Generic, platform-wide pattern (not outreach-specific): any member's own
// affiliate links, keyed by provider, with your default as fallback. Other
// tool-recommendation surfaces on the platform should reuse this same
// table/endpoint (and lib/affiliateLinks.ts) rather than building their own.

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await getAllAffiliateLinks(memberId)
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { memberId, provider, affiliateUrl } = await req.json()
  if (!memberId || !provider || !affiliateUrl) {
    return NextResponse.json({ error: 'Missing memberId, provider, or affiliateUrl.' }, { status: 400 })
  }

  try {
    new URL(affiliateUrl)
  } catch {
    return NextResponse.json({ error: 'affiliateUrl must be a valid URL.' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from('member_affiliate_links')
    .upsert({ member_id: memberId, provider, affiliate_url: affiliateUrl, updated_at: new Date().toISOString() }, { onConflict: 'member_id,provider' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
