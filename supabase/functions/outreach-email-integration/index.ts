import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleOptions, json } from '../_shared/cors.ts'
import { encryptSecret } from '../_shared/crypto.ts'

const VALID_PROVIDERS = ['brevo', 'mailchimp', 'convertkit', 'other']

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    if (req.method === 'GET') {
      const memberId = new URL(req.url).searchParams.get('memberId')
      if (!memberId) return json({ error: 'Unauthorized' }, 401)

      const { data } = await supabase
        .from('member_email_integrations')
        .select('member_id, provider, from_name, from_email, connected_at')
        .eq('member_id', memberId)
        .single()

      return json({ integration: data ?? null })
    }

    if (req.method === 'POST') {
      const { memberId, provider, apiKey, fromName, fromEmail } = await req.json()
      if (!memberId || !provider || !apiKey) {
        return json({ error: 'Missing memberId, provider, or apiKey.' }, 400)
      }
      if (!VALID_PROVIDERS.includes(provider)) return json({ error: 'Unknown provider.' }, 400)

      const { error } = await supabase.from('member_email_integrations').upsert({
        member_id: memberId,
        provider,
        api_key_encrypted: await encryptSecret(apiKey),
        from_name: fromName ?? null,
        from_email: fromEmail ?? null,
        connected_at: new Date().toISOString(),
      })

      if (error) return json({ error: error.message }, 500)
      return json({ success: true })
    }

    if (req.method === 'DELETE') {
      const memberId = new URL(req.url).searchParams.get('memberId')
      if (!memberId) return json({ error: 'Unauthorized' }, 401)

      const { error } = await supabase.from('member_email_integrations').delete().eq('member_id', memberId)
      if (error) return json({ error: error.message }, 500)
      return json({ success: true })
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('outreach-email-integration error:', err)
    return json({ error: 'Request failed.' }, 500)
  }
})
