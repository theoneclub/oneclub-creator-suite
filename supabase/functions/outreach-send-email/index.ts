import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleOptions, json } from '../_shared/cors.ts'
import { decryptSecret } from '../_shared/crypto.ts'
import { sendTransactionalEmail, EmailProvider } from '../_shared/emailProviders.ts'
import { providerSupportsSend } from '../_shared/config.ts'

function splitSubjectAndBody(emailDraft: string): { subject: string; body: string } {
  const lines = emailDraft.split('\n').filter(l => l.trim().length > 0)
  const subject = lines[0]?.slice(0, 120) || 'A quick note from The One Club'
  const body = lines.slice(1).join('\n').trim() || emailDraft
  return { subject, body }
}

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    const { memberId, leadId } = await req.json()
    if (!memberId || !leadId) return json({ error: 'Unauthorized' }, 401)

    const [{ data: integration }, { data: lead }] = await Promise.all([
      supabase
        .from('member_email_integrations')
        .select('provider, api_key_encrypted, from_name, from_email')
        .eq('member_id', memberId)
        .single(),
      supabase
        .from('outreach_leads')
        .select('*')
        .eq('id', leadId)
        .eq('member_id', memberId)
        .single(),
    ])

    if (!integration) return json({ error: 'NO_EMAIL_INTEGRATION' }, 400)
    if (!providerSupportsSend(integration.provider)) return json({ error: 'PROVIDER_DOES_NOT_SUPPORT_SEND' }, 400)
    if (!lead?.email) return json({ error: 'LEAD_HAS_NO_EMAIL' }, 400)
    if (!lead.draft_message?.email) return json({ error: 'NO_DRAFT_MESSAGE' }, 400)

    const { subject, body } = splitSubjectAndBody(lead.draft_message.email)
    const apiKey = await decryptSecret(integration.api_key_encrypted)

    await sendTransactionalEmail({
      provider: integration.provider as EmailProvider,
      apiKey,
      fromName: integration.from_name,
      fromEmail: integration.from_email,
      toEmail: lead.email,
      toName: lead.first_name,
      subject,
      body,
    })

    const { data: updated, error } = await supabase.rpc('outreach_toggle_contacted', {
      p_member_id: memberId,
      p_lead_id: leadId,
      p_contacted: true,
    })
    if (error) return json({ error: error.message }, 500)

    return json(updated)
  } catch (err) {
    console.error('outreach-send-email error:', err)
    return json({ error: 'Send failed. Try again in a moment.' }, 500)
  }
})
