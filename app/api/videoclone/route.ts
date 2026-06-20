import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { buildBrainContext } from '@/lib/brain'
import { buildVideoCloneSystemPrompt, buildBluprintPrompt, buildClonePrompt } from '@/lib/prompts'
import { createServerClient } from '@/lib/supabase-server'
import { VideoCloneResult } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SONNET = 'claude-sonnet-4-6'
const CREDITS_COST = 2 // Two-pass with Sonnet — premium feature

function extractSection(text: string, start: string, end?: string): string {
  const marker = `=== ${start} ===`
  const si = text.indexOf(marker)
  if (si === -1) return ''
  const after = text.slice(si + marker.length).trimStart()
  if (!end) return after.trim()
  const endMarker = `=== ${end} ===`
  const ei = after.indexOf(endMarker)
  return (ei === -1 ? after : after.slice(0, ei)).trim()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memberId, transcript, platform, pillar } = body

    if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!transcript?.trim()) return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    if (!pillar) return NextResponse.json({ error: 'No content pillar selected' }, { status: 400 })

    // Check credits (costs 2)
    const supabase = createServerClient()
    const { data: credits } = await supabase
      .from('member_credits')
      .select('*')
      .eq('member_id', memberId)
      .single()

    if (credits && credits.credits_remaining < CREDITS_COST) {
      return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })
    }

    // Build brain context
    const brainContext = await buildBrainContext(memberId, true, true)
    const systemPrompt = buildVideoCloneSystemPrompt(brainContext)

    // ── PASS 1: Extract structural blueprint ──────────────────────────────────
    const blueprintPrompt = buildBluprintPrompt(transcript, platform ?? 'Social Media')
    const blueprint = await callClaude(systemPrompt, blueprintPrompt, 2000, SONNET)

    // ── PASS 2: Generate cloned content from blueprint ────────────────────────
    const clonePrompt = buildClonePrompt(blueprint, pillar, platform ?? 'Social Media')
    const raw = await callClaude(systemPrompt, clonePrompt, 4000, SONNET)

    // Parse sections from Pass 2 output
    const result: VideoCloneResult = {
      blueprint,
      script:     extractSection(raw, 'SCRIPT', 'HOOKS'),
      hooks:      extractSection(raw, 'HOOKS', 'CTAs'),
      ctas:       extractSection(raw, 'CTAs', 'HIGGSFIELD'),
      higgsfield: extractSection(raw, 'HIGGSFIELD', 'CAPTIONS'),
      captions:   extractSection(raw, 'CAPTIONS'),
    }

    // Deduct credits
    if (credits) {
      await supabase
        .from('member_credits')
        .update({
          credits_remaining: Math.max(0, credits.credits_remaining - CREDITS_COST),
          updated_at: new Date().toISOString(),
        })
        .eq('member_id', memberId)
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Video clone error:', err)
    return NextResponse.json({ error: 'Clone failed. Try again in a moment.' }, { status: 500 })
  }
}
