'use client'
import { useState } from 'react'
import MatrixRain from '@/components/MatrixRain'
import Toast from '@/components/Toast'
import SequenceBuilder, { SequenceItem } from '@/components/ui/SequenceBuilder'
import UpgradeModal from '@/components/ui/UpgradeModal'
import { AvatarSettings, EmailItem } from '@/types'

const SEQ_TYPES = ['Welcome', 'Nurture', 'Launch', 'Re-engagement', 'Affiliate Promo']
const EMAIL_COUNTS = [3, 5, 7, 10]

interface EmailScreenProps { memberId: string; avatarSettings: AvatarSettings }

function emailToSequenceItem(e: EmailItem): SequenceItem {
  return { body: e.body, purpose: e.purpose, subject: e.subject, preview: e.preview, cta: e.cta, sendDay: e.sendDay, approved: e.approved ?? false }
}

export default function EmailScreen({ memberId, avatarSettings }: EmailScreenProps) {
  const [mode, setMode] = useState<'oneclub' | 'member'>('oneclub')
  const [started, setStarted] = useState(false)
  const [sequenceName, setSequenceName] = useState('')
  const [sequenceType, setSequenceType] = useState('Welcome')
  const [totalEmails, setTotalEmails] = useState(5)
  const [offer, setOffer] = useState('')
  const [audience, setAudience] = useState('')
  const [emails, setEmails] = useState<SequenceItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const generateEmail = async (index: number, currentEmails: SequenceItem[]) => {
    setLoading(true)
    try {
      const res = await fetch('/api/sequences/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId, sequenceName, sequenceType, emailNumber: index + 1, totalEmails,
          previousEmails: currentEmails.filter(e => e.approved).map(e => ({ subject: e.subject, body: e.body, preview: e.preview, cta: e.cta, sendDay: e.sendDay, purpose: e.purpose })),
          offer, audience, mode, avatarSettings,
        }),
      })
      const data = await res.json()
      if (data.error === 'NO_CREDITS') { setShowUpgrade(true); return }
      if (!res.ok) { setToast({ msg: data.error ?? 'Generation failed.', type: 'error' }); return }

      setEmails(prev => {
        const next = [...prev]
        next[index] = { ...emailToSequenceItem(data), approved: false }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  const startBuilding = async () => {
    if (!sequenceName || !offer) return
    const initial: SequenceItem[] = Array(totalEmails).fill(null).map(() => ({ body: '', purpose: '', subject: '', preview: '', cta: '', sendDay: '', approved: false }))
    setEmails(initial)
    setCurrentIndex(0)
    setStarted(true)
    await generateEmail(0, initial)
  }

  const handleRegen = (index: number) => generateEmail(index, emails)

  const handleApprove = async (index: number) => {
    const updated = emails.map((e, i) => i === index ? { ...e, approved: true } : e)
    setEmails(updated)
    const nextIndex = index + 1
    if (nextIndex < totalEmails) {
      setCurrentIndex(nextIndex)
      await generateEmail(nextIndex, updated)
    }
    // Auto-save
    await saveSequence(updated, nextIndex >= totalEmails ? 'complete' : 'draft')
  }

  const handleEdit = (index: number, field: string, value: string) => {
    setEmails(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  const saveSequence = async (currentEmails: SequenceItem[], status: string) => {
    const res = await fetch('/api/sequences/email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, sequenceId: savedId ?? 'new', name: sequenceName, type: sequenceType, mode, totalEmails, emails: currentEmails, status }),
    })
    const data = await res.json()
    if (data?.id) setSavedId(data.id)
  }

  const copyFull = () => {
    const text = emails.map((e, i) => [
      `EMAIL ${i + 1} — ${e.subject}`,
      `Preview: ${e.preview}`,
      `Send: ${e.sendDay}`,
      ``,
      e.body,
      ``,
      `CTA: ${e.cta}`,
    ].join('\n')).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    setToast({ msg: '📋 Sequence copied!', type: 'success' })
  }

  const exportCSV = () => {
    const rows = [
      ['Email #', 'Subject', 'Preview', 'Body', 'CTA', 'Send Day', 'Purpose'],
      ...emails.map((e, i) => [String(i + 1), e.subject ?? '', e.preview ?? '', e.body, e.cta ?? '', e.sendDay ?? '', e.purpose]),
    ]
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${sequenceName}-sequence.csv`; a.click()
  }

  const allApproved = emails.length > 0 && emails.every(e => e.approved)

  return (
    <div style={{ paddingBottom: 20 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 16px 16px', background: '#0d2b0d', marginBottom: 16 }}>
        <MatrixRain />
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#4ade80', margin: 0, position: 'relative', zIndex: 1 }}>📧 EMAIL</h1>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', background: '#111', border: '1px solid #1f2937', borderRadius: 999, padding: 3, marginBottom: 16 }}>
          {(['oneclub', 'member'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px 0', borderRadius: 999, background: mode === m ? '#4ade80' : 'transparent', color: mode === m ? '#000' : '#9CA3AF', border: 'none', fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, cursor: 'pointer' }}>
              {m === 'oneclub' ? 'ONE CLUB' : 'MY OFFER'}
            </button>
          ))}
        </div>

        {!started ? (
          <div>
            <input value={sequenceName} onChange={e => setSequenceName(e.target.value)} placeholder="Sequence name..." style={inputStyle} />

            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>SEQUENCE TYPE</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
              {SEQ_TYPES.map(t => (
                <button key={t} onClick={() => setSequenceType(t)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 999, border: `1px solid ${sequenceType === t ? '#4ade80' : '#1f2937'}`, background: sequenceType === t ? '#4ade80' : 'transparent', color: sequenceType === t ? '#000' : '#9CA3AF', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer' }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>NUMBER OF EMAILS</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {EMAIL_COUNTS.map(n => (
                <button key={n} onClick={() => setTotalEmails(n)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${totalEmails === n ? '#FFD700' : '#1f2937'}`, background: totalEmails === n ? '#FFD700' : 'transparent', color: totalEmails === n ? '#000' : '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, cursor: 'pointer' }}>
                  {n}
                </button>
              ))}
            </div>

            <input value={offer} onChange={e => setOffer(e.target.value)} placeholder="What are you offering?" style={inputStyle} />
            <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Who is the audience?" style={{ ...inputStyle, marginBottom: 20 }} />

            <button onClick={startBuilding} disabled={!sequenceName || !offer} style={{ width: '100%', background: '#FFD700', border: 'none', borderRadius: 999, padding: '16px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, cursor: 'pointer' }}>
              🚀 START BUILDING
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#9CA3AF' }}>{sequenceName} · {sequenceType}</div>
              <button onClick={() => { setStarted(false); setEmails([]); setSavedId(null) }} style={{ background: 'none', border: '1px solid #1f2937', color: '#9CA3AF', fontFamily: 'monospace', fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
                ↺ RESET
              </button>
            </div>

            <SequenceBuilder items={emails} currentIndex={currentIndex} loading={loading} onEdit={handleEdit} onRegen={handleRegen} onApprove={handleApprove} type="email" />

            {allApproved && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <button onClick={copyFull} style={{ width: '100%', background: '#4ade80', border: 'none', borderRadius: 999, padding: '14px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, cursor: 'pointer' }}>
                  📋 COPY FULL SEQUENCE
                </button>
                <button onClick={exportCSV} style={{ width: '100%', background: 'transparent', border: '1px solid #4ade80', borderRadius: 999, padding: '12px 0', color: '#4ade80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, cursor: 'pointer' }}>
                  📤 EXPORT CSV
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 10,
  padding: '12px 14px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12,
  marginBottom: 10, boxSizing: 'border-box',
}
