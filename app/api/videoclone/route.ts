import { NextRequest, NextResponse } from 'next/server'
import { callClaude, callClaudeWithImage } from '@/lib/claude'
import { buildBrainContext } from '@/lib/brain'
import { buildVideoCloneSystemPrompt, buildBluprintPrompt, buildBlueprintFromVisualPrompt, buildClonePrompt } from '@/lib/prompts'
import { createServerClient } from '@/lib/supabase-server'
import { VideoCloneResult } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SONNET = 'claude-sonnet-4-6'
const CREDITS_COST = 2

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

async function fetchImageAsBase64(url: string): Promise<{ data: string; mediaType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' },
    })
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const mediaType = contentType.split(';')[0].trim()
    return { data: base64, mediaType }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memberId, transcript, platform, pillar, thumbnailUrl, videoTitle } = body

    if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const hasTranscript = !!transcript?.trim()
    const hasThumbnail = !!thumbnailUrl?.trim()
    const hasTitle = !!videoTitle?.trim()

    if (!hasTranscript && !hasThumbnail && !hasTitle) {
      return NextResponse.json({ error: 'No video content provided' }, { status: 400 })
    }
    if (!pillar) return NextResponse.json({ error: 'No content pillar selected' }, { status: 400 })

    // Check credits
    const supabase = createServerClient()
    const { data: credits } = await supabase
      .from('member_credits')
      .select('*')
      .eq('member_id', memberId)
      .single()

    if (credits && credits.credits_remaining < CREDITS_COST) {
      return NextResponse.json({ error: 'NO_CREDITS' }, { status: 402 })
    }

    const brainContext = await buildBrainContext(memberId, true, true)
    const systemPrompt = buildVideoCloneSystemPrompt(brainContext)

    // ── PASS 1: Extract structural blueprint ──────────────────────────────────
    let blueprint: string

    if (hasTranscript) {
      // Full transcript available — standard flow
      const blueprintPrompt = buildBluprintPrompt(transcript, platform ?? 'Social Media')

      if (hasThumbnail) {
        // Enhance with thumbnail vision
        const img = await fetchImageAsBase64(thumbnailUrl)
        if (img) {
          blueprint = await callClaudeWithImage(systemPrompt, blueprintPrompt, img.data, img.mediaType, 2000, SONNET)
        } else {
          blueprint = await callClaude(systemPrompt, blueprintPrompt, 2000, SONNET)
        }
      } else {
        blueprint = await callClaude(systemPrompt, blueprintPrompt, 2000, SONNET)
      }
    } else {
      // No transcript — use visual + title/caption analysis
      const title = videoTitle ?? ''
      const caption = transcript ?? ''
      const blueprintPrompt = buildBlueprintFromVisualPrompt(title, caption, platform ?? 'Social Media')

      if (hasThumbnail) {
        const img = await fetchImageAsBase64(thumbnailUrl)
        if (img) {
          blueprint = await callClaudeWithImage(systemPrompt, blueprintPrompt, img.data, img.mediaType, 2000, SONNET)
        } else {
          // Fall back to text-only with whatever title/caption we have
          blueprint = await callClaude(systemPrompt, blueprintPrompt, 2000, SONNET)
        }
      } else {
        blueprint = await callClaude(systemPrompt, blueprintPrompt, 2000, SONNET)
      }
    }

    // ── PASS 2: Generate cloned content from blueprint ────────────────────────
    const clonePrompt = buildClonePrompt(blueprint, pillar, platform ?? 'Social Media')
    const raw = await callClaude(systemPrompt, clonePrompt, 4000, SONNET)

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
