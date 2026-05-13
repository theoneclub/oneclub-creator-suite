'use client'
import { useState } from 'react'
import MatrixRain from '@/components/MatrixRain'
import Toast from '@/components/Toast'
import SequenceBuilder, { SequenceItem } from '@/components/ui/SequenceBuilder'
import UpgradeModal from '@/components/ui/UpgradeModal'
import { AvatarSettings } from '@/types'

const PLATFORMS = [
  { id: 'instagram', label: '📸 Instagram DM', note: '300 chars · no links msg 1' },
  { id: 'tiktok', label: '🎵 TikTok DM', note: 'conversational · no links msg 1' },
  { id: 'linkedin', label: '💼 LinkedIn', note: 'professional · ref their work' },
  { id: 'email', label: '📧 Cold Email', note: 'subject required · one CTA' },
]
const TARGET_TYPES = ['Influencer', 'Prospect', 'Partner', 'Affiliate']

interface OutreachScreenProps { memberId: string; avatarSettings: AvatarSettings }

export default function OutreachScreen({ memberId, avatarSettings }: OutreachScreenProps) {
  const [mode, setMode] = useState<'oneclub' | 'member'>('oneclub')
  const [platform, setPlatform] = useState('instagram')
  const [targetType, setTargetType] = useState('Influencer')
  const [targetDescription, setTargetDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState<SequenceItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const generateMessage = async (index: number, currentMessages: SequenceItem[]) => {
    setLoading(true)
    try {
      const res = await fetch('/api/sequences/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId, platform, targetType, targetDescription, goal,
          messageNumber: index + 1, previousMessages: currentMessages.filter(m => m.approved), mode, avatarSettings,
        }),
      })
      const data = await res.json()
      if (data.error === 'NO_CREDITS') { setShowUpgrade(true); return }
      if (!res.ok) { setToast({ msg: data.error ?? 'Generation failed.', type: 'error' }); return }

      setMessages(prev => {
        const next = [...prev]
        next[index] = { ...data, approved: false }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  const startSequence = async () => {
    if (!targetDescription || !goal) return
    const initial: SequenceItem[] = Array(4).fill(null).map(() => ({ body: '', purpose: '', sendDelay: '', personalisationNotes: '', approved: false }))
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
    if (nextIndex < 4) {
      setCurrentIndex(nextIndex)
      await generateMessage(nextIndex, updated)
    }
  }

  const handleEdit = (index: number, field: string, value: string) => {
    setMessages(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m))
  }

  const exportSequence = () => {
    const text = messages.map((m, i) => `MESSAGE ${i + 1} — ${m.purpose}\n${m.sendDelay ? `Send: ${m.sendDelay}\n` : ''}${m.body}\n\n${m.personalisationNotes ? `📱 Notes: ${m.personalisationNotes}` : ''}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    setToast({ msg: '📋 Sequence copied!', type: 'success' })
  }

  const allApproved = messages.length > 0 && messages.every(m => m.approved)

  return (
    <div style={{ paddingBottom: 20 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 16px 16px', background: '#0d2b0d', marginBottom: 16 }}>
        <MatrixRain />
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#4ade80', margin: 0, position: 'relative', zIndex: 1 }}>🤝 OUTREACH</h1>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#111', border: '1px solid #1f2937', borderRadius: 999, padding: 3, marginBottom: 16 }}>
          {(['oneclub', 'member'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px 0', borderRadius: 999, background: mode === m ? '#4ade80' : 'transparent', color: mode === m ? '#000' : '#9CA3AF', border: 'none', fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, cursor: 'pointer' }}>
              {m === 'oneclub' ? 'ONE CLUB' : 'MY OFFER'}
            </button>
          ))}
        </div>

        {!started ? (
          <>
            {/* Platform grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setPlatform(p.id)} style={{
                  padding: '14px 12px', borderRadius: 12,
                  border: `1px solid ${platform === p.id ? '#4ade80' : '#1f2937'}`,
                  background: platform === p.id ? '#0d2b0d' : '#111',
                  textAlign: 'left', cursor: 'pointer',
                }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: platform === p.id ? '#4ade80' : '#fff' }}>{p.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9CA3AF', marginTop: 2 }}>{p.note}</div>
                </button>
              ))}
            </div>

            {/* Target type */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {TARGET_TYPES.map(t => (
                <button key={t} onClick={() => setTargetType(t)} style={{ flex: 1, padding: '7px 0', borderRadius: 999, border: `1px solid ${targetType === t ? '#FFD700' : '#1f2937'}`, background: targetType === t ? '#FFD700' : 'transparent', color: targetType === t ? '#000' : '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, cursor: 'pointer' }}>
                  {t}
                </button>
              ))}
            </div>

            <input value={targetDescription} onChange={e => setTargetDescription(e.target.value)} placeholder="Who are you reaching out to?" style={inputStyle} />
            <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="What's the goal?" style={{ ...inputStyle, marginBottom: 16 }} />

            <button onClick={startSequence} disabled={!targetDescription || !goal} style={{ width: '100%', background: '#FFD700', border: 'none', borderRadius: 999, padding: '16px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, cursor: 'pointer' }}>
              🚀 BUILD SEQUENCE
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#9CA3AF' }}>
                {PLATFORMS.find(p => p.id === platform)?.label} → {targetType}
              </div>
              <button onClick={() => { setStarted(false); setMessages([]); setCurrentIndex(0) }} style={{ background: 'none', border: '1px solid #1f2937', color: '#9CA3AF', fontFamily: 'monospace', fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
                ↺ RESET
              </button>
            </div>

            <SequenceBuilder items={messages} currentIndex={currentIndex} loading={loading} onEdit={handleEdit} onRegen={handleRegen} onApprove={handleApprove} type="outreach" />

            {allApproved && (
              <button onClick={exportSequence} style={{ width: '100%', background: '#4ade80', border: 'none', borderRadius: 999, padding: '14px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, cursor: 'pointer', marginTop: 8 }}>
                📋 EXPORT FULL SEQUENCE
              </button>
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
