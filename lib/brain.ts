import { createServerClient } from './supabase-server'

export async function buildBrainContext(
  memberId: string,
  useGlobal: boolean,
  useMember: boolean
): Promise<string> {
  const supabase = createServerClient()
  const sources: { tag: string; title: string; summary?: string; from: string }[] = []

  if (useGlobal) {
    const { data } = await supabase
      .from('global_brain')
      .select('tag, title, summary')
      .eq('active', true)
      .limit(6)
    if (data) sources.push(...data.map((s) => ({ ...s, from: 'GLOBAL' })))
  }

  if (useMember) {
    const { data } = await supabase
      .from('member_brain')
      .select('tag, title, summary')
      .eq('member_id', memberId)
      .limit(4)
    if (data) sources.push(...data.map((s) => ({ ...s, from: 'PERSONAL' })))
  }

  if (!sources.length) return ''

  return `KNOWLEDGE BASE — use these sources to ground your output. Draw on the frameworks, angles, and patterns naturally. Do not copy verbatim.

${sources
  .map(
    (s) => `[${s.from} | ${s.tag}]
${s.summary?.slice(0, 400) ?? ''}`
  )
  .join('\n\n---\n\n')}`
}
