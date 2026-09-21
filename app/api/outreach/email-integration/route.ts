import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { encryptSecret } from '@/lib/crypto'
import { EmailProvider } from '@/types'

export const dynamic = 'force-dynamic'

const VALID_PROVIDERS: EmailProvider[] = ['brevo', 'mailchimp', 'convertkit', 'other']

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data } = await supabase
    .from('member_email_integrations')
    .select('member_id, provider, from_name, from_email, connected_at')
    .eq('member_id', memberId)
    .single()

  return NextResponse.json({ integration: data ?? null })
}

export async function POST(req: NextRequest) {
  const { memberId, provider, apiKey, fromName, fromEmail } = await req.json()
  if (!memberId || !provider || !apiKey) {
    return NextResponse.json({ error: 'Missing memberId, provider, or apiKey.' }, { status: 400 })
  }
  if (!VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: 'Unknown provider.' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('member_email_integrations').upsert({
    member_id: memberId,
    provider,
    api_key_encrypted: encryptSecret(apiKey),
    from_name: fromName ?? null,
    from_email: fromEmail ?? null,
    connected_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { error } = await supabase.from('member_email_integrations').delete().eq('member_id', memberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
