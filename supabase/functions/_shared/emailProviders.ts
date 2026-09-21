export type EmailProvider = 'brevo' | 'mailchimp' | 'convertkit' | 'other'

export interface SendEmailInput {
  provider: EmailProvider
  apiKey: string
  fromName: string | null
  fromEmail: string | null
  toEmail: string
  toName: string | null
  subject: string
  body: string
}

function toHtml(body: string): string {
  return body
    .split('\n')
    .map(line => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'))
    .join('<br>')
}

async function sendViaBrevo(input: SendEmailInput): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': input.apiKey },
    body: JSON.stringify({
      sender: { name: input.fromName ?? 'The One Club', email: input.fromEmail ?? undefined },
      to: [{ email: input.toEmail, name: input.toName ?? undefined }],
      subject: input.subject,
      htmlContent: toHtml(input.body),
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`BREVO_SEND_FAILED: ${res.status} ${text.slice(0, 300)}`)
  }
}

async function sendViaMailchimpTransactional(input: SendEmailInput): Promise<void> {
  const res = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: input.apiKey,
      message: {
        html: toHtml(input.body),
        subject: input.subject,
        from_email: input.fromEmail ?? undefined,
        from_name: input.fromName ?? 'The One Club',
        to: [{ email: input.toEmail, name: input.toName ?? undefined, type: 'to' }],
      },
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`MAILCHIMP_SEND_FAILED: ${res.status} ${text.slice(0, 300)}`)
  }
  const data = await res.json().catch(() => null)
  const rejected = Array.isArray(data) && data[0]?.status === 'rejected'
  if (rejected) throw new Error(`MAILCHIMP_SEND_REJECTED: ${data[0]?.reject_reason}`)
}

// ConvertKit and "Other" have no equivalent one-off transactional send —
// they fall back to copy-paste in the UI rather than silently no-op.
export async function sendTransactionalEmail(input: SendEmailInput): Promise<void> {
  switch (input.provider) {
    case 'brevo':
      return sendViaBrevo(input)
    case 'mailchimp':
      return sendViaMailchimpTransactional(input)
    case 'convertkit':
    case 'other':
      throw new Error(`SEND_NOT_SUPPORTED: ${input.provider}`)
  }
}
