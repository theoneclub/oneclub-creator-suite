import { createServerClient } from './supabase-server'
import { DEFAULT_AFFILIATE_LINKS } from './outreachConfig'

// Shared, platform-wide lookup: any "Get [tool]" / "Connect [provider]"
// button should call this first, falling back to your own default link if
// the member hasn't set their own in "My affiliate links".
export async function getAffiliateLink(memberId: string, provider: string): Promise<string> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('member_affiliate_links')
    .select('affiliate_url')
    .eq('member_id', memberId)
    .eq('provider', provider)
    .single()

  return data?.affiliate_url || DEFAULT_AFFILIATE_LINKS[provider] || '#'
}

export async function getAllAffiliateLinks(memberId: string): Promise<{ links: Record<string, string>; ownProviders: string[] }> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('member_affiliate_links')
    .select('provider, affiliate_url')
    .eq('member_id', memberId)

  const own: Record<string, string> = {}
  for (const row of data ?? []) own[row.provider] = row.affiliate_url

  return { links: { ...DEFAULT_AFFILIATE_LINKS, ...own }, ownProviders: Object.keys(own) }
}
