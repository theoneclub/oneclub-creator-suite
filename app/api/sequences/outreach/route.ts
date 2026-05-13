import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { buildOutreachPrompt } from '@/lib/prompts'
import { buildBrainContext } from '@/lib/brain'
import { checkRateLimit, logUsage } from '@/lib/rateLimit'
import { createServerClient } from '@/lib/supabase-server'
import { OutreachMessage } from '@/types'

export const dynamic = 'force-dynamic'

function parseOutreach(raw: string): OutreachMessage {
  const get = (key: string) => raw.match(new RegExp(`${key}:\\s*([^\\n]+)`, 'i'))?.[1]?.trim() ?? ''
  const bodyMatch = raw.match(/MESSAGE:\s*\n?([\s\S]*?)(?=\nPURPOSE:|$)/i)
  return {
    body: bodyMatch?.[1]?.trim() ?? raw.slice(0, 500),
    purpose: get('PURPOSE'),
    sendDelay: get('SEND DELAY'),
    personalisationNotes: get('PERSONALISATION NOTES'),
    approved: false,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memberId, platform, targetDescription, goal, messageNumber, previousMessages, mode } = body

    if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { allowed } = await checkRateLimit(memberId, 'outreach')
    if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 429 })

    const supabase = createServerClient()
    const { data: credits } = await supabase.from('member_credits').select('credits_remaining').eq('member_id', memberId).single()
    if (credits && credits.credits_remaining <= 0) return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })

    const brainContext = await buildBrainContext(memberId, true, true)
    const prevText = (previousMessages as OutreachMessage[] ?? [])
      .map((m, i) => `Message ${i + 1} (${m.purpose}):\n${m.body}`)
      .join('\n\n---\n\n')

    const systemPrompt = buildOutreachPrompt(platform, targetDescription, goal, messageNumber, mode, prevText, brainContext)
    const raw = await callClaude(systemPrompt, `Write outreach message ${messageNumber} targeting: ${targetDescription}`, 800)
    const msg = parseOutreach(raw)

    if (credits) {
      await supabase
        .from('member_credits')
        .update({ credits_remaining: credits.credits_remaining - 1, updated_at: new Date().toISOString() })
        .eq('member_id', memberId)
    }
    await logUsage(memberId, 'outreach')

    return NextResponse.json(msg)
  } catch (err) {
    console.error('Outreach generation error:', err)
    return NextResponse.json({ error: 'Generation failed.' }, { status: 500 })
  }
}
