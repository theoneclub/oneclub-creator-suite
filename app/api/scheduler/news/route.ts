import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  try {
    const supabase = createServerClient()

    // Return cached news if less than 2 hours old
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data: cached } = await supabase
      .from('news_cache')
      .select('*')
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      return NextResponse.json({
        headline: cached.headline,
        summary: cached.summary,
        sourceUrl: cached.source_url,
        angle: cached.angle,
      })
    }

    // Fetch fresh news using Claude with web search
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
      messages: [
        {
          role: 'user',
          content: `Search for today's top trending news about: "AI tools online business" OR "financial freedom" OR "remote work" OR "passive income AI" OR "creator economy".

Find the most relevant and timely story from the last 24 hours that would resonate with people trying to escape the 9-5 and build income online using AI.

Return your answer in exactly this format:
HEADLINE: [the headline]
SUMMARY: [2-3 sentence summary of the story]
SOURCE_URL: [the URL]
ANGLE: [one of: opportunity | threat | validation | trend]`,
        },
      ],
    })

    // Extract the final text response
    let raw = ''
    for (const block of message.content) {
      if (block.type === 'text') raw += block.text
    }

    const headline = raw.match(/HEADLINE:\s*(.+)/)?.[1]?.trim() ?? ''
    const summary = raw.match(/SUMMARY:\s*([\s\S]+?)(?=SOURCE_URL:|$)/)?.[1]?.trim() ?? ''
    const sourceUrl = raw.match(/SOURCE_URL:\s*(.+)/)?.[1]?.trim() ?? ''
    const angle = raw.match(/ANGLE:\s*(.+)/)?.[1]?.trim() ?? 'trend'

    if (headline) {
      await supabase.from('news_cache').insert({ headline, summary, source_url: sourceUrl, angle })
    }

    return NextResponse.json({ headline, summary, sourceUrl, angle })
  } catch (err) {
    console.error('News fetch error:', err)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
