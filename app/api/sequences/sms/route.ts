import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { buildSMSPrompt } from '@/lib/prompts'
import { buildBrainContext } from '@/lib/brain'
import { checkRateLimit, logUsage } from '@/lib/rateLimit'
import { createServerClient } from '@/lib/supabase-server'
import { SMSMessage } from '@/types'

export const dynamic = 'force-dynamic'

function parseSMS(raw: string): SMSMessage {
  const get = (key: string) => raw.match(new RegExp(`${key}:\\s*([^\\n]+)`, 'i'))?.[1]?.trim() ?? ''
  const body = get('MESSAGE')
  const charCount = parseInt(get('CHAR COUNT') || String(body.length))
  return {
    body: body.slice(0, 160),
    charCount: Math.min(charCount, 160),
    sendDay: get('SEND DAY'),
    purpose: get('PURPOSE'),
    approved: false,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memberId, campaignName, messageNumber, totalMessages, previousMessages, offer, mode } = body

    if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { allowed } = await checkRateLimit(memberId, 'sms')
    if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 429 })

    const supabase = createServerClient()
    const { data: credits } = await supabase.from('member_credits').select('credits_remaining').eq('member_id', memberId).single()
    if (credits && credits.credits_remaining <= 0) return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })

    const brainContext = await buildBrainContext(memberId, true, true)
    const prevText = (previousMessages as SMSMessage[] ?? [])
      .map((m, i) => `Msg ${i + 1}: ${m.body}`)
      .join('\n')

    const systemPrompt = buildSMSPrompt(mode, offer, messageNumber, totalMessages, prevText, brainContext)
    const raw = await callClaude(systemPrompt, `Write SMS message ${messageNumber} of ${totalMessages} for: ${campaignName}`, 400)
    const sms = parseSMS(raw)

    if (credits) {
      await supabase
        .from('member_credits')
        .update({ credits_remaining: credits.credits_remaining - 1, updated_at: new Date().toISOString() })
        .eq('member_id', memberId)
    }
    await logUsage(memberId, 'sms')

    return NextResponse.json(sms)
  } catch (err) {
    console.error('SMS generation error:', err)
    return NextResponse.json({ error: 'Generation failed.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { data } = await supabase.from('sms_campaigns').select('*').eq('member_id', memberId).order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function PUT(req: NextRequest) {
  const { memberId, campaignId, name, mode, totalMessages, messages, status } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  if (campaignId && campaignId !== 'new') {
    const { data } = await supabase
      .from('sms_campaigns')
      .update({ name, mode, total_messages: totalMessages, messages, status })
      .eq('id', campaignId)
      .eq('member_id', memberId)
      .select()
      .single()
    return NextResponse.json(data)
  }

  const { data } = await supabase
    .from('sms_campaigns')
    .insert({ member_id: memberId, name, mode, total_messages: totalMessages, messages, status })
    .select()
    .single()
  return NextResponse.json(data)
}
