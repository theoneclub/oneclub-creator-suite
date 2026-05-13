import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { buildBrainContext } from '@/lib/brain'
import { buildContentPrompt } from '@/lib/prompts'
import { checkRateLimit, logUsage } from '@/lib/rateLimit'
import { createServerClient } from '@/lib/supabase-server'
import { AvatarSettings, GeneratedContent, ScriptContent } from '@/types'

export const dynamic = 'force-dynamic'

function parseContent(raw: string): GeneratedContent {
  const get = (key: string) => {
    const regex = new RegExp(`${key}:\\s*\\n([\\s\\S]*?)(?=\\n[A-Z \\-]+:|$)`, 'i')
    return raw.match(regex)?.[1]?.trim() ?? ''
  }

  const script: ScriptContent = {
    intro: get('INTRO'),
    point1: get('BODY - POINT 1'),
    point2: get('BODY - POINT 2'),
    point3: get('BODY - POINT 3'),
    cta: '',
  }

  const ctaMatch = raw.match(/^CTA:\s*\n([\s\S]*?)(?=\nTITLE:|$)/im)
  script.cta = ctaMatch?.[1]?.trim() ?? ''

  const hashtagsRaw = get('HASHTAGS')
  const hashtags = hashtagsRaw.split(/\s+/).filter(h => h.startsWith('#'))

  const hookRatingMatch = raw.match(/HOOK RATING:\s*(.+)/i)
  const seoScoreMatch = raw.match(/SEO SCORE:\s*(.+)/i)

  return {
    hook: get('HOOK'),
    title: get('TITLE'),
    caption: get('CAPTION'),
    hashtags,
    script,
    cta: script.cta,
    hookRating: hookRatingMatch?.[1]?.trim() ?? '',
    seoScore: seoScoreMatch?.[1]?.trim() ?? '',
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, hookType, memberId, avatarSettings, useGlobalBrain, useMemberBrain, mode, sectionToRegen } = body

    if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { allowed } = await checkRateLimit(memberId, 'content')
    if (!allowed) return NextResponse.json({ error: 'Daily limit reached. Resets at midnight.' }, { status: 429 })

    // Check credits
    const supabase = createServerClient()
    const { data: credits } = await supabase.from('member_credits').select('*').eq('member_id', memberId).single()
    if (credits && credits.credits_remaining <= 0) {
      return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })
    }

    const brainContext = await buildBrainContext(memberId, useGlobalBrain ?? true, useMemberBrain ?? true)
    const avatar: AvatarSettings = avatarSettings ?? {}

    const systemPrompt = buildContentPrompt(avatar, brainContext, mode ?? 'oneclub', hookType ?? 'Confrontational')

    let userMessage = `Generate content for the following topic: ${topic}`
    if (sectionToRegen) userMessage = `Regenerate only the ${sectionToRegen} section for topic: ${topic}`

    const raw = await callClaude(systemPrompt, userMessage, 2048)
    const result = parseContent(raw)

    // Deduct credit
    if (credits) {
      await supabase
        .from('member_credits')
        .update({ credits_remaining: credits.credits_remaining - 1, updated_at: new Date().toISOString() })
        .eq('member_id', memberId)
    }

    await logUsage(memberId, 'content')

    return NextResponse.json(result)
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Generation failed. Try again in a moment.' }, { status: 500 })
  }
}
