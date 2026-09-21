import { LeadPlatform } from '@/types'

// Accepts either a raw @handle or a full profile URL and returns the bare
// handle, per platform.
export function extractHandle(platform: LeadPlatform, input: string): string {
  const trimmed = input.trim().replace(/^@/, '')
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.includes('/')) return trimmed

  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
    const segments = url.pathname.split('/').filter(Boolean)
    if (platform === 'linkedin') {
      // linkedin.com/in/<handle>
      const idx = segments.indexOf('in')
      return (idx >= 0 ? segments[idx + 1] : segments[segments.length - 1]) ?? trimmed
    }
    // instagram.com/<handle>  |  tiktok.com/@<handle>
    return (segments[0] ?? trimmed).replace(/^@/, '')
  } catch {
    return trimmed
  }
}

export function firstNameFrom(displayName: string | null): string | null {
  if (!displayName) return null
  const first = displayName.trim().split(/\s+/)[0]
  return first || null
}
