'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import MatrixRain from '@/components/MatrixRain'
import Spinner from '@/components/Spinner'
import Toast from '@/components/Toast'
import { BrainSource } from '@/types'

const TAG_OPTIONS = ['NICHE RESEARCH', 'COMPETITOR', 'MY CONTENT', 'INSPIRATION', 'BOOK', 'OTHER']
const TAG_COLORS: Record<string, string> = {
  HOOKS: '#4ade80', COPYWRITING: '#3B82F6', ONE_CLUB: '#A855F7', VOICE: '#EC4899',
  RESEARCH: '#F97316', OTHER: '#9CA3AF',
  'NICHE RESEARCH': '#4ade80', COMPETITOR: '#3B82F6', 'MY CONTENT': '#FFD700',
  INSPIRATION: '#EC4899', BOOK: '#F97316',
}

interface BrainScreenProps { memberId: string }

export default function BrainScreen({ memberId }: BrainScreenProps) {
  const [tab, setTab] = useState<'global' | 'member'>('global')
  const [globalSources, setGlobalSources] = useState<BrainSource[]>([])
  const [memberSources, setMemberSources] = useState<BrainSource[]>([])
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState('')
  const [tag, setTag] = useState('NICHE RESEARCH')
  const [manualMode, setManualMode] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualContent, setManualContent] = useState('')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadGlobal = useCallback(async () => {
    const res = await fetch('/api/brain/global')
    const data = await res.json()
    setGlobalSources(data)
  }, [])

  const loadMember = useCallback(async () => {
    const res = await fetch(`/api/brain/member?memberId=${memberId}`)
    const data = await res.json()
    setMemberSources(data)
  }, [memberId])

  useEffect(() => { loadGlobal(); loadMember() }, [loadGlobal, loadMember])

  const handleFeed = async () => {
    if (!url && !manualContent) return
    setLoading(true)
    try {
      const res = await fetch('/api/brain/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: manualMode ? undefined : url, tag, memberId, scope: 'member', manualTitle, manualContent: manualMode ? manualContent : undefined }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setToast({ msg: '✅ Source added to your Brain!', type: 'success' })
      setUrl(''); setManualTitle(''); setManualContent('')
      loadMember()
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : "Couldn't fetch URL", type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    setUploadLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('tag', tag)
      form.append('memberId', memberId)
      const res = await fetch('/api/brain/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error((await res.json()).error)
      setToast({ msg: '✅ File added to your Brain!', type: 'success' })
      setPendingFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadMember()
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : 'Upload failed', type: 'error' })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/brain/member', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, memberId }) })
    loadMember()
  }

  const activeSources = globalSources.filter(s => s.active !== false)

  return (
    <div style={{ paddingBottom: 20 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 16px 16px', background: '#0d2b0d', marginBottom: 16 }}>
        <MatrixRain />
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#4ade80', margin: 0, position: 'relative', zIndex: 1 }}>
          🧠 BRAND BRAIN
        </h1>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#4ADE80', margin: '4px 0 0', position: 'relative', zIndex: 1 }}>
          {activeSources.length} GLOBAL + {memberSources.length} PERSONAL sources loaded
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px', marginBottom: 16 }}>
        {(['global', 'member'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0', borderRadius: 999, border: `1px solid ${tab === t ? '#4ade80' : '#1f2937'}`,
            background: tab === t ? '#4ade80' : 'transparent', color: tab === t ? '#000' : '#9CA3AF',
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, cursor: 'pointer',
          }}>
            {t === 'global' ? '🌐 GLOBAL LIBRARY' : '👤 MY LIBRARY'}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        {tab === 'global' ? (
          <div>
            <div style={{ background: '#0d2b0d', border: '1px solid #4ade80', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#4ade80' }}>
                ● {activeSources.length} sources active — all tools drawing from Morphe&apos;s library
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {['HOOKS', 'COPYWRITING', 'ONE CLUB', 'VOICE', 'RESEARCH'].map(cat => (
                <span key={cat} style={{ padding: '3px 10px', borderRadius: 999, border: `1px solid ${TAG_COLORS[cat] ?? '#9CA3AF'}`, color: TAG_COLORS[cat] ?? '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11 }}>
                  {cat}
                </span>
              ))}
            </div>

            {globalSources.map((s, i) => (
              <div key={s.id} style={{
                background: '#111', border: `1px solid ${['#4ade80','#3B82F6','#EC4899','#A855F7','#F97316','#FFD700'][i % 6]}`,
                borderRadius: 12, padding: 14, marginBottom: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{s.type === 'youtube' ? '▶️' : s.type === 'pdf' || s.type === 'docx' || s.type === 'txt' ? '📄' : '🔗'}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 999, background: TAG_COLORS[s.tag] ?? '#9CA3AF', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 10 }}>{s.tag}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#9CA3AF' }}>████████████████████</span>
                  </div>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: '#4ade80' }}>ACTIVE ✓</span>
                </div>
              </div>
            ))}

            <div style={{ textAlign: 'center', padding: '12px 0', fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#9CA3AF' }}>
              🔒 Managed by Morphe — updated regularly — content not publicly visible
            </div>
          </div>
        ) : (
          <div>
            {/* Tag selector */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
              {TAG_OPTIONS.map(t => (
                <button key={t} onClick={() => setTag(t)} style={{
                  flexShrink: 0, padding: '4px 12px', borderRadius: 999,
                  border: `1px solid ${tag === t ? '#4ade80' : '#1f2937'}`,
                  background: tag === t ? '#4ade80' : 'transparent',
                  color: tag === t ? '#000' : '#9CA3AF',
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setManualMode(false)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${!manualMode ? '#FFD700' : '#1f2937'}`, background: !manualMode ? '#FFD700' : 'transparent', color: !manualMode ? '#000' : '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, cursor: 'pointer' }}>
                🔗 URL
              </button>
              <button onClick={() => setManualMode(true)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${manualMode ? '#FFD700' : '#1f2937'}`, background: manualMode ? '#FFD700' : 'transparent', color: manualMode ? '#000' : '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, cursor: 'pointer' }}>
                ✏️ MANUAL PASTE
              </button>
            </div>

            {!manualMode ? (
              <div style={{ marginBottom: 16 }}>
                {/* URL row */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="Paste YouTube, article, PDF URL..."
                    style={{ flex: 1, background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12 }}
                  />
                  <button onClick={handleFeed} disabled={loading || !url} style={{ padding: '10px 16px', background: loading ? '#1f2937' : '#FFD700', border: 'none', borderRadius: 8, color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {loading ? <Spinner size={14} /> : '⚡ FEED IN'}
                  </button>
                </div>

                {/* File upload row — full width, separate from URL input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null
                    setPendingFile(f)
                    if (f) handleUpload(f)
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadLoading}
                  style={{ width: '100%', padding: '12px 0', background: uploadLoading ? '#1f2937' : '#4ade80', border: 'none', borderRadius: 8, color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, cursor: uploadLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {uploadLoading ? <><Spinner size={16} /><span>PROCESSING {pendingFile?.name}…</span></> : '📎 UPLOAD FILE'}
                </button>

                {uploadLoading && (
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#4ade80', marginTop: 6, textAlign: 'center' }}>
                    ⏳ Extracting &amp; summarising — this takes a few seconds…
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <input
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  placeholder="Title..."
                  style={{ width: '100%', background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 8, padding: '8px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, marginBottom: 8, boxSizing: 'border-box' }}
                />
                <textarea
                  value={manualContent}
                  onChange={e => setManualContent(e.target.value)}
                  placeholder="Paste content here..."
                  rows={6}
                  style={{ width: '100%', background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 8, padding: '8px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
                />
                <button onClick={handleFeed} disabled={loading || !manualContent} style={{ width: '100%', marginTop: 8, padding: '12px', background: loading ? '#1f2937' : '#FFD700', border: 'none', borderRadius: 8, color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, cursor: 'pointer' }}>
                  {loading ? '⏳ Analysing...' : '⚡ FEED IN'}
                </button>
              </div>
            )}

            {memberSources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#9CA3AF', fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
                No personal sources yet.<br />Drop a URL to start feeding your Brain.
              </div>
            ) : (
              memberSources.map((s, i) => (
                <div key={s.id} style={{ background: '#111', border: `1px solid ${['#4ade80','#3B82F6','#EC4899','#A855F7','#F97316','#FFD700'][i % 6]}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 14 }}>{s.type === 'youtube' ? '▶️' : s.type === 'pdf' || s.type === 'docx' || s.type === 'txt' ? '📄' : '🔗'}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 999, background: TAG_COLORS[s.tag] ?? '#9CA3AF', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 10 }}>{s.tag}</span>
                      </div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#fff', marginBottom: 4 }}>{s.title}</div>
                      {s.summary && (
                        <details>
                          <summary style={{ fontFamily: 'monospace', fontSize: 10, color: '#9CA3AF', cursor: 'pointer' }}>View summary</summary>
                          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', marginTop: 6, whiteSpace: 'pre-wrap' }}>{s.summary.slice(0, 400)}</div>
                        </details>
                      )}
                    </div>
                    <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>🗑️</button>
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
