import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

function getContentForPlatform(post: Record<string, string | null>, platform: string): string {
  switch (platform) {
    case 'twitter': return post.twitter_post ?? ''
    case 'threads': return post.threads_post ?? ''
    case 'facebook': return post.facebook_post ?? ''
    case 'instagram': return post.instagram_caption ?? ''
    default: return post.short_form_script ?? ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { postId, memberId, platforms, scheduledFor } = body as {
      postId: string
      memberId: string
      platforms: string[]
      scheduledFor: string
    }

    const supabase = createServerClient()

    // Fetch the post content
    const { data: post, error: fetchErr } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .eq('member_id', memberId)
      .single()

    if (fetchErr || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Call Claude Haiku with Buffer MCP to schedule posts
    const postsText = platforms
      .map(p => `${p.toUpperCase()}: ${getContentForPlatform(post, p)}`)
      .join('\n\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'mcp-client-2025-04-04',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        mcp_servers: [
          {
            type: 'url',
            url: process.env.BUFFER_MCP_URL,
            name: 'buffer',
            authorization_token: process.env.BUFFER_ACCESS_TOKEN,
          },
        ],
        system: 'You are a scheduling assistant. Use the Buffer MCP tools to schedule posts. After scheduling all posts, return a JSON object with the created post IDs like: {"instagram": "post_id", "twitter": "post_id"}',
        messages: [
          {
            role: 'user',
            content: `Schedule these posts to Buffer:

Organization ID: ${process.env.BUFFER_ORG_ID}
Scheduled time: ${scheduledFor}
Timezone: Australia/Sydney

Posts to schedule:
${postsText}

Steps:
1. Use buffer:list_channels to get channel IDs for: ${platforms.join(', ')}
2. For each platform, use buffer:create_post to schedule the post at the specified time
3. Return a JSON object with the Buffer post IDs created, keyed by platform name`,
          },
        ],
      }),
    })

    const mcpData = await res.json()

    // Extract Buffer post IDs from response
    let bufferPostIds: Record<string, string> = {}
    for (const block of mcpData.content ?? []) {
      if (block.type === 'text') {
        try {
          const jsonMatch = block.text.match(/\{[\s\S]*\}/)
          if (jsonMatch) bufferPostIds = JSON.parse(jsonMatch[0])
        } catch {}
      }
    }

    const status = Object.keys(bufferPostIds).length > 0 ? 'scheduled' : 'failed'

    // Update the post record
    await supabase
      .from('scheduled_posts')
      .update({
        buffer_post_ids: bufferPostIds,
        status,
        scheduled_for: scheduledFor,
      })
      .eq('id', postId)

    return NextResponse.json({ success: status === 'scheduled', bufferPostIds })
  } catch (err) {
    console.error('Schedule error:', err)
    // Mark as failed in DB if we have the postId
    return NextResponse.json({ error: 'Scheduling failed' }, { status: 500 })
  }
}
