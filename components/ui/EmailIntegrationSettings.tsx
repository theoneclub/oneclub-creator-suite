'use client'
import { useCallback, useEffect, useState } from 'react'
import Spinner from '@/components/Spinner'
import { EmailProvider, MemberEmailIntegration } from '@/types'

interface EmailIntegrationSettingsProps {
  memberId: string
  onClose: () => void
  onConnected: (integration: MemberEmailIntegration | null) => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}

const PROVIDERS: { id: EmailProvider; label: string; sendSupported: boolean }[] = [
  { id: 'brevo', label: 'Brevo', sendSupported: true },
  { id: 'mailchimp', label: 'Mailchimp Transactional', sendSupported: true },
  { id: 'convertkit', label: 'ConvertKit', sendSupported: false },
  { id: 'other', label: 'Other (API key)', sendSupported: false },
]

export default function EmailIntegrationSettings({ memberId, onClose, onConnected, onToast }: EmailIntegrationSettingsProps) {
  const [integration, setIntegration] = useState<MemberEmailIntegration | null>(null)
  const [links, setLinks] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [fromName, setFromName] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingLink, setEditingLink] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const [intRes, linksRes] = await Promise.all([
      fetch(`/api/outreach/email-integration?memberId=${memberId}`).then(r => r.json()),
      fetch(`/api/outreach/affiliate-links?memberId=${memberId}`).then(r => r.json()),
    ])
    setIntegration(intRes.integration ?? null)
    setLinks(linksRes.links ?? {})
    setLoading(false)
  }, [memberId])

  useEffect(() => { load() }, [load])

  const connect = async () => {
    if (!selectedProvider || !apiKey.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/outreach/email-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, provider: selectedProvider, apiKey, fromName, fromEmail }),
      })
      if (!res.ok) { onToast('Connection failed.', 'error'); return }
      onToast('✅ Email automation connected!')
      setApiKey('')
      await load()
      onConnected({ member_id: memberId, provider: selectedProvider, from_name: fromName || null, from_email: fromEmail || null, connected_at: new Date().toISOString() })
    } finally {
      setSaving(false)
    }
  }

  const disconnect = async () => {
    await fetch(`/api/outreach/email-integration?memberId=${memberId}`, { method: 'DELETE' })
    setIntegration(null)
    onConnected(null)
    onToast('Email automation disconnected.')
  }

  const saveAffiliateLink = async (provider: string) => {
    const url = editingLink[provider]?.trim()
    if (!url) return
    const res = await fetch('/api/outreach/affiliate-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, provider, affiliateUrl: url }),
    })
    if (!res.ok) { onToast('Could not save that link — check it’s a valid URL.', 'error'); return }
    onToast('Affiliate link saved.')
    await load()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#fff' }}>EMAIL AUTOMATION</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spinner /></div>
        ) : integration ? (
          <div style={{ background: '#0d2b0d', border: '1px solid #4ade80', borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#4ade80', marginBottom: 4 }}>
              ✓ Connected: {integration.provider.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
              Leads with a captured email now show &quot;Send via {integration.provider}&quot;.
            </div>
            <button onClick={disconnect} style={{ background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 8, padding: '6px 14px', fontFamily: 'monospace', fontSize: 11, cursor: 'pointer' }}>
              Disconnect
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>
              Bring your own provider account (your API key never leaves your integration). Without one, Email still works as copy-paste.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  style={{
                    padding: '12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                    border: `1px solid ${selectedProvider === p.id ? '#4ade80' : '#1f2937'}`,
                    background: selectedProvider === p.id ? '#0d2b0d' : '#0d0d0d',
                  }}
                >
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#fff' }}>{p.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#6b7280' }}>
                    {p.sendSupported ? 'Send supported' : 'Copy-paste only'}
                  </div>
                  {links[p.id] && (
                    <a href={links[p.id]} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'inline-block', marginTop: 6, fontFamily: 'monospace', fontSize: 10, color: '#4ade80' }}>
                      Get {p.label} →
                    </a>
                  )}
                </button>
              ))}
            </div>

            {selectedProvider && (
              <div style={{ background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 12, padding: 14 }}>
                <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API key" type="password" style={inputStyle} />
                <input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="From name (optional)" style={inputStyle} />
                <input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="From email (optional)" style={{ ...inputStyle, marginBottom: 0 }} />
                <button onClick={connect} disabled={saving || !apiKey.trim()} style={{ width: '100%', marginTop: 10, background: '#4ade80', border: 'none', borderRadius: 999, padding: '10px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, cursor: 'pointer' }}>
                  {saving ? 'Connecting…' : 'CONNECT'}
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#9CA3AF', marginBottom: 8 }}>MY AFFILIATE LINKS</div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b7280', marginBottom: 10 }}>
          Set your own affiliate link per provider — used everywhere a &quot;Get [tool]&quot; button appears. Left blank, it falls back to the default link.
        </div>
        {PROVIDERS.filter(p => p.id !== 'other').map(p => (
          <div key={p.id} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              defaultValue={links[p.id] ?? ''}
              onChange={e => setEditingLink(prev => ({ ...prev, [p.id]: e.target.value }))}
              placeholder={`Your ${p.label} affiliate link`}
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            />
            <button onClick={() => saveAffiliateLink(p.id)} style={{ background: '#1f2937', border: 'none', borderRadius: 8, padding: '0 14px', color: '#fff', fontFamily: 'monospace', fontSize: 11, cursor: 'pointer' }}>
              Save
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 8, padding: '10px 12px',
  color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, marginBottom: 8, boxSizing: 'border-box',
}
