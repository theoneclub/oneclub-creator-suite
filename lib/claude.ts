import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048,
  model = 'claude-haiku-4-5-20251001'
): Promise<string> {
  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}

export async function callClaudeWithImage(
  systemPrompt: string,
  userMessage: string,
  imageBase64: string,
  imageMediaType: string,
  maxTokens = 2048,
  model = 'claude-sonnet-4-6'
): Promise<string> {
  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageMediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: imageBase64,
          },
        },
        { type: 'text', text: userMessage },
      ],
    }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}
