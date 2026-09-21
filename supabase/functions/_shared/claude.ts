// Plain HTTPS call to the Anthropic Messages API — a normal backend-to-vendor
// call, not a Claude session or MCP tool call.
export async function callClaude(systemPrompt: string, userMessage: string, maxTokens = 800): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_NOT_CONFIGURED')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`ANTHROPIC_CALL_FAILED: ${res.status} ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  const block = data.content?.[0]
  if (!block || block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}
