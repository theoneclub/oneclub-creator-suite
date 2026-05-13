'use client'
import { useState } from 'react'
import MatrixRain from '@/components/MatrixRain'
import Toast from '@/components/Toast'
import SequenceBuilder, { SequenceItem } from '@/components/ui/SequenceBuilder'
import UpgradeModal from '@/components/ui/UpgradeModal'
import { AvatarSettings } from '@/types'

const MSG_COUNTS = [3, 5, 7, 10]

interface SMSScreenProps { memberId: string; avatarSettings: AvatarSettings }

export default function SMSScreen({ memberId, avatarSettings }: SMSScreenProps) {
  const [mode, setMode] = useState<'oneclub' | 'member'>('oneclub')
  const [started, setStarted] = useState(false)
  const [campaignName, setCampaignName] = useState('')
  const [totalMessages, setTotalMessages] = useState(5)
  const [offer, setOffer] = useState('')
  const [messages, setMessages] = useState<SequenceItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const generateMessage = async (index: number, currentMessages: SequenceItem[]) => {
    setLoading(true)
    try {
      const res = await fetch('/api/sequences/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId, campaignName, messageNumber: index + 1, totalMessages,
          previousMessages: currentMessages.filter(m => m.approved).map(m => ({ body: m.body, charCount: m.charCount, sendDay: m.sendDay, purpose: m.purpose })),
          offer, mode, avatarSettings,
        }),
      })
      const data = await res.json()
      if (data.error === 'NO_CREDITS') { setShowUpgrade(true); return }
      if (!res.ok) { setToast({ msg: data.error ?? 'Generation failed.', type: 'error' }); return }

      const item: SequenceItem = { body: data.body, purpose: data.purpose, sendDay: data.sendDay, charCount: data.charCount, approved: false }
      setMessages(prev => { const next = [...prev]; next[index] = item; return next })
    } finally {
      setLoading(false)
    }
  }

  const startCampaign = async () => {
    if (!campaignName || !offer) return
    const initial: SequenceItem[] = Array(totalMessages).fill(null).map(() => ({ body: '', purpose: '', sendDay: '', charCount: 0, approved: false }))
    setMessages(initial)
    setCurrentIndex(0)
    setStarted(true)
    await generateMessage(0, initial)
  }

  const handleRegen = (index: number) => generateMessage(index, messages)

  const handleApprove = async (index: number) => {
    const updated = messages.map((m, i) => i === index ? { ...m, approved: true } : m)
    setMessages(updated)
    const nextIndex = index + 1
    if (nextIndex < totalMessages) {
      setCurrentIndex(nextIndex)
      await generateMessage(nextIndex, updated)
    }
  }

  const handleEdit = (index: number, field: string, value: string) => {
    setMessages(prev => prev.map((m, i) => {
      if (i !== index) return m
      const updated = { ...m, [field]: value }
      if (field === 'body') updated.charCount = value.length
      return updated
    }))
  }

  const copyFull = () => {
    const text = messages.map((m, i) => `SMS ${i + 1} (${m.purpose}) — ${m.sendDay}\n${m.body}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    setToast({ msg: '📋 Campaign copied!', type: 'success' })
  }

  const exportCSV = () => {
    const rows = [['#', 'Body', 'Chars', 'Send Day', 'Purpose'], ...messages.map((m, i) => [String(i + 1), m.body, String(m.charCount ?? 0), m.sendDay ?? '', m.purpose])]
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${campaignName}-sms.csv`; a.click()
  }

  const allApproved = messages.length > 0 && messages.every(m => m.approved)

  return (
    <div style={{ paddingBottom: 20 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 16px 16px', background: '#0d2b0d', marginBottom: 16 }}>
        <MatrixRain />
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#4ade80', margin: 0, position: 'relative', zIndex: 1 }}>📱 SMS</h1>
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
            <input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Campaign name..." style={inputStyle} />

            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>NUMBER OF MESSAGES</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {MSG_COUNTS.map(n => (
                <button key={n} onClick={() => setTotalMessages(n)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${totalMessages === n ? '#FFD700' : '#1f2937'}`, background: totalMessages === n ? '#FFD700' : 'transparent', color: totalMessages === n ? '#000' : '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, cursor: 'pointer' }}>
                  {n}
                </button>
              ))}
            </div>

            <input value={offer} onChange={e => setOffer(e.target.value)} placeholder="What are you promoting?" style={{ ...inputStyle, marginBottom: 20 }} />

            <button onClick={startCampaign} disabled={!campaignName || !offer} style={{ width: '100%', background: '#FFD700', border: 'none', borderRadius: 999, padding: '16px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, cursor: 'pointer' }}>
              🚀 BUILD CAMPAIGN
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#9CA3AF' }}>{campaignName}</div>
              <button onClick={() => { setStarted(false); setMessages([]) }} style={{ background: 'none', border: '1px solid #1f2937', color: '#9CA3AF', fontFamily: 'monospace', fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
                ↺ RESET
              </button>
            </div>

            <SequenceBuilder items={messages} currentIndex={currentIndex} loading={loading} onEdit={handleEdit} onRegen={handleRegen} onApprove={handleApprove} type="sms" />

            {allApproved && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <button onClick={copyFull} style={{ width: '100%', background: '#4ade80', border: 'none', borderRadius: 999, padding: '14px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, cursor: 'pointer' }}>
                  📋 COPY FULL CAMPAIGN
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
