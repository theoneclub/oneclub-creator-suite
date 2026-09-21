'use client'
import { useState } from 'react'
import { EmailProvider, OutreachLead } from '@/types'

interface LeadMessageSheetProps {
  lead: OutreachLead
  emailProvider: EmailProvider | null
  canSendEmail: boolean
  onClose: () => void
  onToggleContacted: (leadId: string, contacted: boolean) => void
  onSendEmail: (leadId: string) => Promise<void>
  onCopied: (msg: string) => void
}

const TABS = [
  { id: 'dm', label: 'DM' },
  { id: 'email', label: 'EMAIL' },
  { id: 'followup', label: 'FOLLOW-UP' },
] as const

export default function LeadMessageSheet({
  lead, emailProvider, canSendEmail, onClose, onToggleContacted, onSendEmail, onCopied,
}: LeadMessageSheetProps) {
  const [tab, setTab] = useState<typeof TABS[number]['id']>('dm')
  const [sending, setSending] = useState(false)

  const text = lead.draft_message?.[tab] ?? ''

  const copy = () => {
    navigator.clipboard.writeText(text)
    onCopied('📋 Message copied!')
  }

  const send = async () => {
    setSending(true)
    try {
      await onSendEmail(lead.id)
      onCopied(`✅ Sent via ${emailProvider}!`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', padding: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#fff' }}>
            @{lead.handle} {lead.first_name ? `· ${lead.first_name}` : ''}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        {lead.needs_enrichment && (
          <div style={{ background: '#2b1a0d', border: '1px solid #F97316', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontFamily: 'monospace', fontSize: 11, color: '#F97316' }}>
            ⚠️ Limited data on this lead — worth a manual look before reaching out.
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, background: '#0d0d0d', borderRadius: 999, padding: 3, marginBottom: 14 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: tab === t.id ? '#4ade80' : 'transparent', color: tab === t.id ? '#000' : '#9CA3AF',
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 13,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 12, padding: 14, fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#e5e7eb', whiteSpace: 'pre-wrap', minHeight: 100, marginBottom: 14 }}>
          {text || '—'}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={copy} style={{ flex: 1, background: '#FFD700', border: 'none', borderRadius: 999, padding: '12px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, cursor: 'pointer' }}>
            📋 COPY
          </button>
          {tab === 'email' && lead.email && (
            canSendEmail ? (
              <button onClick={send} disabled={sending} style={{ flex: 1, background: '#3B82F6', border: 'none', borderRadius: 999, padding: '12px 0', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, cursor: sending ? 'default' : 'pointer' }}>
                {sending ? 'Sending…' : `SEND VIA ${(emailProvider ?? '').toUpperCase()}`}
              </button>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 10, color: '#6b7280', textAlign: 'center' }}>
                Connect email automation to send directly
              </div>
            )
          )}
        </div>

        <button
          onClick={() => onToggleContacted(lead.id, !lead.contacted)}
          style={{
            width: '100%', background: lead.contacted ? '#0d2b0d' : 'transparent', border: `1px solid ${lead.contacted ? '#4ade80' : '#1f2937'}`,
            color: lead.contacted ? '#4ade80' : '#9CA3AF', borderRadius: 999, padding: '12px 0', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, cursor: 'pointer',
          }}
        >
          {lead.contacted ? '✓ CONTACTED — TAP TO UNDO' : 'MARK CONTACTED'}
        </button>
      </div>
    </div>
  )
}
