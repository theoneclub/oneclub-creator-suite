import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { buildEmailPrompt } from '@/lib/prompts'
import { buildBrainContext } from '@/lib/brain'
import { checkRateLimit, logUsage } from '@/lib/rateLimit'
import { createServerClient } from '@/lib/supabase-server'
import { EmailItem } from '@/types'

export const dynamic = 'force-dynamic'

function parseEmail(raw: string): EmailItem {
  const get = (key: string) => {
    const regex = new RegExp(`${key}:\\s*([^\\n]+)`, 'i')
    return raw.match(regex)?.[1]?.trim() ?? ''
  }
  const bodyMatch = raw.match(/BODY:\s*\n([\s\S]*?)(?=\nCTA:|$)/i)
  return {
    subject: get('SUBJECT'),
    preview: get('PREVIEW'),
    body: bodyMatch?.[1]?.trim() ?? raw,
    cta: get('CTA'),
    sendDay: get('SEND DAY'),
    purpose: get('PURPOSE'),
    approved: false,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memberId, sequenceName, sequenceType, emailNumber, totalEmails, previousEmails, offer, audience, mode } = body

    if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { allowed } = await checkRateLimit(memberId, 'email')
    if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 429 })

    const supabase = createServerClient()
    const { data: credits } = await supabase.from('member_credits').select('credits_remaining').eq('member_id', memberId).single()
    if (credits && credits.credits_remaining <= 0) return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })

    const brainContext = await buildBrainContext(memberId, true, true)
    const prevText = (previousEmails as EmailItem[] ?? [])
      .map((e, i) => `Email ${i + 1} â€” Subject: ${e.subject}\n${e.body.slice(0, 200)}`)
      .join('\n\n---\n\n')

    const systemPrompt = buildEmailPrompt(mode, sequenceType, emailNumber, totalEmails, offer, audience, prevText, brainContext)
    const raw = await callClaude(systemPrompt, `Write email ${emailNumber} of ${totalEmails} for: ${sequenceName}`, 1500)
    const email = parseEmail(raw)

    if (credits) {
      await supabase
        .from('member_credits')
        .update({ credits_remaining: credits.credits_remaining - 1, updated_at: new Date().toISOString() })
        .eq('member_id', memberId)
    }
    await logUsage(memberId, 'email')

    return NextResponse.json(email)
  } catch (err) {
    console.error('Email generation error:', err)
    return NextResponse.json({ error: 'Generation failed.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data } = await supabase.from('email_sequences').select('*').eq('member_id', memberId).order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function PUT(req: NextRequest) {
  const { memberId, sequenceId, name, type, mode, totalEmails, emails, status } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  if (sequenceId && sequenceId !== 'new') {
    const { data } = await supabase
      .from('email_sequences')
      .update({ name, type, mode, total_emails: totalEmails, emails, status, updated_at: new Date().toISOString() })
      .eq('id', sequenceId)
      .eq('member_id', memberId)
      .select()
      .single()
    return NextResponse.json(data)
  }

  const { data } = await supabase
    .from('email_sequences')
    .insert({ member_id: memberId, name, type, mode, total_emails: totalEmails, emails, status })
    .select()
    .single()
  return NextResponse.json(data)
}
