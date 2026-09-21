// Encrypts member-supplied email-provider API keys before they touch the
// database. Uses Web Crypto (SubtleCrypto) — no Node-specific APIs, so this
// runs on Deno without any compat assumptions.
async function getKey(): Promise<CryptoKey> {
  const secret = Deno.env.get('EMAIL_INTEGRATION_ENC_KEY')
  if (!secret) throw new Error('EMAIL_INTEGRATION_ENC_KEY not configured')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  return `${toBase64(iv.buffer)}:${toBase64(encrypted)}`
}

export async function decryptSecret(payload: string): Promise<string> {
  const [ivB64, dataB64] = payload.split(':')
  if (!ivB64 || !dataB64) throw new Error('Malformed encrypted payload')
  const key = await getKey()
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(ivB64) },
    key,
    fromBase64(dataB64)
  )
  return new TextDecoder().decode(decrypted)
}
