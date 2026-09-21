import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleOptions, json } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    if (req.method === 'GET') {
      const memberId = new URL(req.url).searchParams.get('memberId')
      if (!memberId) return json({ error: 'Unauthorized' }, 401)

      const { data, error } = await supabase
        .from('outreach_leads')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })

      if (error) return json({ error: error.message }, 500)
      return json(data ?? [])
    }

    if (req.method === 'PATCH') {
      const { memberId, leadId, contacted } = await req.json()
      if (!memberId || !leadId) return json({ error: 'Unauthorized' }, 401)

      const { data, error } = await supabase.rpc('outreach_toggle_contacted', {
        p_member_id: memberId,
        p_lead_id: leadId,
        p_contacted: !!contacted,
      })

      if (error) return json({ error: error.message }, 500)
      return json(data)
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (err) {
    console.error('outreach-leads error:', err)
    return json({ error: 'Request failed.' }, 500)
  }
})
