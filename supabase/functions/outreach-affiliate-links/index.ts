import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleOptions, json } from '../_shared/cors.ts'
import { DEFAULT_AFFILIATE_LINKS } from '../_shared/config.ts'

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    if (req.method === 'GET') {
      const memberId = new URL(req.url).searchParams.get('memberId')
      if (!memberId) return json({ error: 'Unauthorized' }, 401)

      const { data, error } = await supabase
        .from('member_affiliate_links')
        .select('provider, affiliate_url')
        .eq('member_id', memberId)

      if (error) return json({ error: error.message }, 500)

      const own: Record<string, string> = {}
      for (const row of data ?? []) own[row.provider] = row.affiliate_url

      return json({ links: { ...DEFAULT_AFFILIATE_LINKS, ...own }, ownProviders: Object.keys(own) })
    }

    if (req.method === 'POST') {
      const { memberId, provider, affiliateUrl } = await req.json()
      if (!memberId || !provider || !affiliateUrl) {
        return json({ error: 'Missing memberId, provider, or affiliateUrl.' }, 400)
      }

      try {
        new URL(affiliateUrl)
      } catch {
        return json({ error: 'affiliateUrl must be a valid URL.' }, 400)
      }

      const { error } = await supabase
        .from('member_affiliate_links')
        .upsert(
          { member_id: memberId, provider, affiliate_url: affiliateUrl, updated_at: new Date().toISOString() },
          { onConflict: 'member_id,provider' }
        )

      if (error) return json({ error: error.message }, 500)
      return json({ success: true })
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('outreach-affiliate-links error:', err)
    return json({ error: 'Request failed.' }, 500)
  }
})
