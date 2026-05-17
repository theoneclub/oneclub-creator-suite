import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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
        max_tokens: 1024,
        mcp_servers: [
          {
            type: 'url',
            url: process.env.BUFFER_MCP_URL,
            name: 'buffer',
            authorization_token: process.env.BUFFER_ACCESS_TOKEN,
          },
        ],
        system: 'You are a Buffer assistant. Use the buffer:list_channels tool to get channels and return the result as JSON only. No other text.',
        messages: [
          {
            role: 'user',
            content: `Use buffer:list_channels with organization_id "${process.env.BUFFER_ORG_ID}" and return the channels as a JSON array with fields: id, name, service, avatar. Return ONLY the JSON array, nothing else.`,
          },
        ],
      }),
    })

    const data = await res.json()

    let channels: { id: string; name: string; service: string; avatar: string }[] = []
    for (const block of data.content ?? []) {
      if (block.type === 'text') {
        try {
          const jsonMatch = block.text.match(/\[[\s\S]*\]/)
          if (jsonMatch) channels = JSON.parse(jsonMatch[0])
        } catch {}
      }
    }

    return NextResponse.json(channels)
  } catch (err) {
    console.error('Channels fetch error:', err)
    return NextResponse.json([], { status: 200 })
  }
}
