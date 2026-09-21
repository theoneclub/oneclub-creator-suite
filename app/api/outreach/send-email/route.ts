import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { decryptSecret } from '@/lib/crypto'
import { sendTransactionalEmail } from '@/lib/emailProviders'
import { providerSupportsSend } from '@/lib/outreachConfig'
import { EmailProvider, OutreachLead } from '@/types'

export const dynamic = 'force-dynamic'

function splitSubjectAndBody(emailDraft: string): { subject: string; body: string } {
  const lines = emailDraft.split('\n').filter(l => l.trim().length > 0)
  const subject = lines[0]?.slice(0, 120) || 'A quick note from The One Club'
  const body = lines.slice(1).join('\n').trim() || emailDraft
  return { subject, body }
}

export async function POST(req: NextRequest) {
  try {
    const { memberId, leadId } = await req.json()
    if (!memberId || !leadId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()

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

    if (!integration) return NextResponse.json({ error: 'NO_EMAIL_INTEGRATION' }, { status: 400 })
    if (!providerSupportsSend(integration.provider as EmailProvider)) {
      return NextResponse.json({ error: 'PROVIDER_DOES_NOT_SUPPORT_SEND' }, { status: 400 })
    }

    const leadRow = lead as OutreachLead | null
    if (!leadRow?.email) return NextResponse.json({ error: 'LEAD_HAS_NO_EMAIL' }, { status: 400 })
    if (!leadRow.draft_message?.email) return NextResponse.json({ error: 'NO_DRAFT_MESSAGE' }, { status: 400 })

    const { subject, body } = splitSubjectAndBody(leadRow.draft_message.email)
    const apiKey = decryptSecret(integration.api_key_encrypted)

    await sendTransactionalEmail({
      provider: integration.provider as EmailProvider,
      apiKey,
      fromName: integration.from_name,
      fromEmail: integration.from_email,
      toEmail: leadRow.email,
      toName: leadRow.first_name,
      subject,
      body,
    })

    const { data: updated, error } = await supabase.rpc('outreach_toggle_contacted', {
      p_member_id: memberId,
      p_lead_id: leadId,
      p_contacted: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Outreach send-email error:', err)
    return NextResponse.json({ error: 'Send failed. Try again in a moment.' }, { status: 500 })
  }
}
