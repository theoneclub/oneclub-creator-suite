'use client'
import { useState, useCallback } from 'react'
import Spinner from '@/components/Spinner'
import Toast from '@/components/Toast'
import OutputCard from '@/components/ui/OutputCard'
import UpgradeModal from '@/components/ui/UpgradeModal'
import { GeneratedContent, AvatarSettings, SavedItem } from '@/types'

const HOOK_TYPES = ['Confrontational', 'Curiosity Gap', 'Pattern Interrupt', 'Statistic', 'Story Opener', 'Call-out', 'Warning', 'Relatable']
const CARD_COLORS = ['#4ade80', '#3B82F6', '#EC4899', '#A855F7', '#F97316', '#FFD700']

interface ContentScreenProps { memberId: string; avatarSettings: AvatarSettings }

export default function ContentScreen({ memberId, avatarSettings }: ContentScreenProps) {
  const [mode, setMode] = useState<'oneclub' | 'member'>('oneclub')
  const [topic, setTopic] = useState('')
  const [hookType, setHookType] = useState('Confrontational')
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [regenSection, setRegenSection] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [savedHooks, setSavedHooks] = useState<SavedItem[]>([])
  const [showSwipeFile, setShowSwipeFile] = useState(false)

  const generate = useCallback(async (section?: string) => {
    if (!topic.trim()) return
    if (section) setRegenSection(section)
    else setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: section ?? 'all', topic, hookType, memberId, avatarSettings, useGlobalBrain: true, useMemberBrain: true, mode, sectionToRegen: section }),
      })
      const data = await res.json()
      if (data.error === 'NO_CREDITS') { setShowUpgrade(true); return }
      if (!res.ok) { setToast({ msg: data.error ?? 'Generation failed.', type: 'error' }); return }
      setContent(prev => ({ ...prev, ...data }))
    } finally {
      setLoading(false)
      setRegenSection(null)
    }
  }, [topic, hookType, memberId, avatarSettings, mode])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setToast({ msg: '📋 Copied!', type: 'success' })
  }

  const copyAll = () => {
    if (!content) return
    const text = [
      `HOOK:\n${content.hook}`,
      `TITLE:\n${content.title}`,
      `CAPTION:\n${content.caption}`,
      `HASHTAGS:\n${content.hashtags?.join(' ')}`,
      `SCRIPT:\nINTRO: ${content.script?.intro}\nPOINT 1: ${content.script?.point1}\nPOINT 2: ${content.script?.point2}\nPOINT 3: ${content.script?.point3}\nCTA: ${content.script?.cta}`,
      `CTA:\n${content.cta}`,
    ].join('\n\n---\n\n')
    copy(text)
  }

  const saveHook = async () => {
    if (!content?.hook) return
    const res = await fetch('/api/saved', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, type: 'hook', title: topic.slice(0, 60), content: content.hook }),
    })
    const saved = await res.json()
    setSavedHooks(prev => [saved, ...prev])
    setToast({ msg: '⭐ Saved to swipe file!', type: 'success' })
  }

  const deleteHook = async (id: string) => {
    await fetch('/api/saved', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, memberId }) })
    setSavedHooks(prev => prev.filter(h => h.id !== id))
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Header */}
      

      <div style={{ padding: '0 16px' }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 999, padding: 3, marginBottom: 16 }}>
          {(['oneclub', 'member'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '8px 0', borderRadius: 999,
              background: mode === m ? '#4ade80' : 'transparent',
              color: mode === m ? '#000' : '#9CA3AF',
              border: 'none', fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, cursor: 'pointer',
            }}>
              {m === 'oneclub' ? 'ONE CLUB MODE' : 'MY BUSINESS'}
            </button>
          ))}
        </div>

        {/* Topic input */}
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="WHAT'S TODAY'S TOPIC?"
          style={{ width: '100%', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 14, marginBottom: 14, boxSizing: 'border-box' }}
        />

        {/* Hook type pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
          {HOOK_TYPES.map(h => (
            <button key={h} onClick={() => setHookType(h)} style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 999,
              border: `1px solid ${hookType === h ? '#FFD700' : '#1f2937'}`,
              background: hookType === h ? '#FFD700' : 'transparent',
              color: hookType === h ? '#000' : '#9CA3AF',
              fontFamily: "'Space Mono', monospace", fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{h}</button>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={() => generate()}
          disabled={loading || !topic.trim()}
          style={{ width: '100%', background: loading ? '#1f2937' : '#FFD700', border: 'none', borderRadius: 999, padding: '16px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading ? <><Spinner size={18} /><span>GENERATING...</span></> : '⚡ GENERATE ALL CONTENT'}
        </button>

        {/* Output cards */}
        {content && (
          <>
            <OutputCard emoji="🪝" label="VIRAL HOOK" color={CARD_COLORS[0]} content={content.hook ?? ''} loading={regenSection === 'HOOK'} onRegen={() => generate('HOOK')} onCopy={() => copy(content.hook ?? '')} onSave={saveHook}>
              {content.hookRating && <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 10, color: '#9CA3AF' }}>📊 {content.hookRating}</div>}
            </OutputCard>

            <OutputCard emoji="📝" label="TITLE" color={CARD_COLORS[1]} content={content.title ?? ''} loading={regenSection === 'TITLE'} onRegen={() => generate('TITLE')} onCopy={() => copy(content.title ?? '')}>
              {content.seoScore && <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 10, color: '#9CA3AF' }}>🔍 {content.seoScore}</div>}
            </OutputCard>

            <OutputCard emoji="💬" label="CAPTION" color={CARD_COLORS[2]} content={content.caption ?? ''} loading={regenSection === 'CAPTION'} onRegen={() => generate('CAPTION')} onCopy={() => copy(content.caption ?? '')} />

            <OutputCard emoji="#️⒣" label="HASHTAGS" color={CARD_COLORS[3]} content={(content.hashtags ?? []).join(' ')} loading={regenSection === 'HASHTAGS'} onRegen={() => generate('HASHTAGS')} onCopy={() => copy((content.hashtags ?? []).join(' '))} />

            {/* Script card */}
            {content.script && (
              <div style={{ background: '#161616', border: `1px solid ${CARD_COLORS[4]}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: CARD_COLORS[4], marginBottom: 12 }}>🎬 FULL SCRIPT</div>
                {(['intro', 'point1', 'point2', 'point3', 'cta'] as const).map(key => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, color: '#9CA3AF' }}>
                        {key === 'intro' ? 'INTRO' : key === 'cta' ? 'CTA' : `POINT ${key.slice(-1)}`}
                      </span>
                      <button onClick={() => generate(`BODY - ${key.toUpperCase()}`)} style={{ background: 'transparent', border: `1px solid ${CARD_COLORS[4]}`, color: CARD_COLORS[4], fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, padding: '2px 8px', borderRadius: 6, cursor: 'pointer' }}>
                        ↺ REGEN
                      </button>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#fff' }}>{content.script![key]}</div>
                  </div>
                ))}
              </div>
            )}

            <OutputCard emoji="🎯" label="CTA" color={CARD_COLORS[5]} content={content.cta ?? ''} loading={regenSection === 'CTA'} onRegen={() => generate('CTA')} onCopy={() => copy(content.cta ?? '')} />

            <button onClick={copyAll} style={{ width: '100%', background: 'transparent', border: '1px solid #4ade80', color: '#4ade80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, padding: '12px 0', borderRadius: 999, cursor: 'pointer', marginBottom: 16 }}>
              📋 COPY FULL CONTENT PACK
            </button>
          </>
        )}

        {/* Swipe file */}
        <button onClick={() => setShowSwipeFile(!showSwipeFile)} style={{ width: '100%', background: 'transparent', border: '1px solid #FFD700', color: '#FFD700', fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, padding: '10px 0', borderRadius: 12, cursor: 'pointer', marginBottom: 8 }}>
          ⭐ SWIPE FILE {showSwipeFile ? '▲' : '▼'}
        </button>
        {showSwipeFile && (
          <div>
            {savedHooks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#9CA3AF', fontFamily: 'monospace', fontSize: 11 }}>No saved hooks yet.</div>
            ) : (
              savedHooks.map(h => (
                <div key={h.id} style={{ background: '#161616', border: '1px solid #FFD700', borderRadius: 10, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#fff', flex: 1 }}>{h.content}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => copy(h.content)} style={{ background: 'none', border: '1px solid #9CA3AF', borderRadius: 6, color: '#9CA3AF', fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}>📋</button>
                    <button onClick={() => deleteHook(h.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
