import crypto from 'crypto'

// Encrypts member-supplied email-provider API keys before they touch the
// database (member_email_integrations.api_key_encrypted). Generate a real
// secret with `openssl rand -hex 32` and set it as EMAIL_INTEGRATION_ENC_KEY
// in your deployment env — never commit it.
function getKey(): Buffer {
  const secret = process.env.EMAIL_INTEGRATION_ENC_KEY
  if (!secret) throw new Error('EMAIL_INTEGRATION_ENC_KEY not configured')
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':')
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(':')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed encrypted payload')
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
  return decrypted.toString('utf8')
}
