import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/claude'
import { BRAIN_SUMMARISE_PROMPT } from '@/lib/prompts'
import { checkRateLimit, logUsage } from '@/lib/rateLimit'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function detectType(url: string): 'youtube' | 'webpage' | 'pdf' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.endsWith('.pdf')) return 'pdf'
  return 'webpage'
}

const ALLORIGINS_PREFIX = 'https://api.allorigins.win/raw?url='

async function fetchWithFallback(url: string): Promise<string> {
  // Try direct fetch first; on failure fall back to allorigins proxy
  const attempts = [
    () => fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OneClubBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    }),
    () => fetch(`${ALLORIGINS_PREFIX}${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(15000),
    }),
  ]

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      const res = await attempt()
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

async function fetchContent(url: string, type: string): Promise<{ title: string; content: string }> {
  let html: string
  try {
    html = await fetchWithFallback(url)
  } catch (err) {
    console.error('fetchContent failed for', url, err)
    // Return a graceful fallback so the brain entry can still be created manually
    return {
      title: url,
      content: `[Could not fetch content from ${url}. Add a summary manually.]`,
    }
  }

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch?.[1]?.trim().replace(/\s+/g, ' ') ?? url

  if (type === 'youtube') {
    // Extract meta description for YouTube
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/i)
    const desc = descMatch?.[1] ?? ''
    return { title, content: `${title}\n\n${desc}` }
  }

  // Strip HTML tags and scripts
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 6000)

  return { title, content: text }
}

export async function POST(req: NextRequest) {
  try {
    const { url, tag, memberId, scope, manualTitle, manualContent } = await req.json()

    if (!memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { allowed } = await checkRateLimit(memberId, 'brain')
    if (!allowed) return NextResponse.json({ error: 'Daily limit reached.' }, { status: 429 })

    const supabase = createServerClient()
    let title = manualTitle ?? ''
    let summary = ''
    let type: string = 'manual'

    if (manualContent) {
      summary = await callClaude(BRAIN_SUMMARISE_PROMPT, manualContent.slice(0, 6000), 1024)
    } else if (url) {
      type = detectType(url)
      const { title: fetchedTitle, content } = await fetchContent(url, type)
      title = fetchedTitle
      summary = await callClaude(BRAIN_SUMMARISE_PROMPT, content, 1024)
    } else {
      return NextResponse.json({ error: 'Provide URL or content' }, { status: 400 })
    }

    const table = scope === 'global' ? 'global_brain' : 'member_brain'
    const record: Record<string, unknown> = { url, type, title, tag, summary }
    if (scope !== 'global') record.member_id = memberId

    const { data, error } = await supabase.from(table).insert(record).select().single()
    if (error) throw error

    await logUsage(memberId, 'brain_add')

    return NextResponse.json(data)
  } catch (err) {
    console.error('Brain fetch error:', err)
    return NextResponse.json({ error: "Couldn't fetch that URL. Try pasting the content manually." }, { status: 500 })
  }
}
