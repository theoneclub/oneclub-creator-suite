'use client'
import { useState, useCallback, useRef } from 'react'
import Spinner from '@/components/Spinner'
import Toast from '@/components/Toast'
import UpgradeModal from '@/components/ui/UpgradeModal'
import { VideoCloneResult, CLONE_PILLARS, ClonePillar } from '@/types'

// ── Constants ──────────────────────────────────────────────────────────────
const PLATFORMS = ['TikTok', 'Instagram Reels', 'YouTube', 'YouTube Shorts', 'X / Twitter', 'Facebook', 'Threads']

type OutputTab = 'blueprint' | 'script' | 'hooks' | 'ctas' | 'higgsfield' | 'captions'

const OUTPUT_TABS: { id: OutputTab; label: string; emoji: string }[] = [
  { id: 'blueprint', label: 'ANALYSIS', emoji: '🔍' },
  { id: 'script',    label: 'SCRIPT',   emoji: '📝' },
  { id: 'hooks',     label: 'HOOKS',    emoji: '🪝' },
  { id: 'ctas',      label: 'CTAs',     emoji: '🎯' },
  { id: 'higgsfield',label: 'HIGGS',    emoji: '🎬' },
  { id: 'captions',  label: 'CAPTIONS', emoji: '💬' },
]

const HOOK_COLORS = ['#4ade80', '#3B82F6', '#EC4899', '#A855F7', '#F97316', '#FFD700']
const CTA_COLORS  = ['#4ade80', '#FFD700', '#3B82F6', '#EC4899', '#F97316', '#A855F7']

// ── Helpers ────────────────────────────────────────────────────────────────
function detectPlatformFromUrl(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('tiktok.com'))  return 'TikTok'
  if (u.includes('instagram.com')) return 'Instagram Reels'
  if (u.includes('youtube.com/shorts') || u.includes('youtu.be')) return 'YouTube Shorts'
  if (u.includes('youtube.com')) return 'YouTube'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'X / Twitter'
  if (u.includes('facebook.com')) return 'Facebook'
  if (u.includes('threads.net')) return 'Threads'
  return ''
}

function parseHooks(raw: string): { label: string; text: string; color: string }[] {
  const labelMatches = raw.match(/\[H\d+[^\]]*\]/g) || []
  const blocks = raw.split(/\[H\d+[^\]]*\]/)
  return labelMatches.map((label, i) => ({
    label: label.replace(/\[|\]/g, ''),
    text: blocks[i + 1]?.trim() || '',
    color: HOOK_COLORS[i % HOOK_COLORS.length],
  })).filter(h => h.text)
}

function parseCTAs(raw: string): { label: string; text: string; color: string }[] {
  const labelMatches = raw.match(/\[CTA\d+[^\]]*\]/g) || []
  const blocks = raw.split(/\[CTA\d+[^\]]*\]/)
  return labelMatches.map((label, i) => ({
    label: label.replace(/\[|\]/g, ''),
    text: blocks[i + 1]?.trim() || '',
    color: CTA_COLORS[i % CTA_COLORS.length],
  })).filter(c => c.text)
}

// ── Component ──────────────────────────────────────────────────────────────
interface Props { memberId: string }

export default function VideoCloneScreen({ memberId }: Props) {
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState('TikTok')
  const [pillar, setPillar] = useState<ClonePillar>(CLONE_PILLARS[0])
  const [transcript, setTranscript] = useState('')
  const [transcriptNote, setTranscriptNote] = useState('')
  const [fetchingTranscript, setFetchingTranscript] = useState(false)

  // Metadata from non-YouTube platforms
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [analysisType, setAnalysisType] = useState<'transcript' | 'metadata' | 'none' | ''>('')

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<string | null>(null)
  const [result, setResult] = useState<VideoCloneResult | null>(null)
  const [activeTab, setActiveTab] = useState<OutputTab>('script')

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const urlRef = useRef<HTMLInputElement>(null)

  const hasContent = transcript.trim() || thumbnailUrl || videoTitle

  // Auto-detect platform and try transcript/metadata when URL is pasted
  const handleUrlChange = useCallback(async (val: string) => {
    setUrl(val)
    const detected = detectPlatformFromUrl(val)
    if (detected) setPlatform(detected)

    // Reset metadata
    setThumbnailUrl('')
    setVideoTitle('')
    setAnalysisType('')

    if (!val.trim()) { setTranscriptNote(''); return }

    setFetchingTranscript(true)
    setTranscriptNote('Analyzing video…')

    try {
      const res = await fetch('/api/videoclone/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: val }),
      })
      const data = await res.json()

      if (data.thumbnailUrl) setThumbnailUrl(data.thumbnailUrl)
      if (data.videoTitle)   setVideoTitle(data.videoTitle)
      if (data.analysisType) setAnalysisType(data.analysisType)

      if (data.transcript) {
        setTranscript(data.transcript)
        setTranscriptNote(data.note)
      } else {
        setTranscriptNote(data.note)
      }
    } catch {
      setTranscriptNote('Could not analyze — paste caption/transcript below')
    } finally {
      setFetchingTranscript(false)
    }
  }, [])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    setToast({ msg: '📋 Copied!', type: 'success' })
  }

  const clone = useCallback(async () => {
    if (!hasContent) {
      setToast({ msg: 'Paste a URL or caption first ↑', type: 'error' })
      return
    }

    setLoading(true)
    setStep('Pass 1 — analyzing structure…')
    setResult(null)

    try {
      const res = await fetch('/api/videoclone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, transcript, platform, pillar, thumbnailUrl, videoTitle }),
      })

      setStep('Pass 2 — cloning content…')
      const data = await res.json()

      if (data.error === 'NO_CREDITS') { setShowUpgrade(true); return }
      if (!res.ok) { setToast({ msg: data.error ?? 'Clone failed', type: 'error' }); return }

      setResult(data)
      setActiveTab('script')
      setTimeout(() => {
        document.getElementById('clone-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
      setToast({ msg: '✓ Clone complete — 2 credits used', type: 'success' })
    } finally {
      setLoading(false)
      setStep(null)
    }
  }, [memberId, transcript, platform, pillar, thumbnailUrl, videoTitle, hasContent])

  // ── Active tab content ───────────────────────────────────────────────────
  const renderTabContent = () => {
    if (!result) return null
    const baseStyle: React.CSSProperties = { fontFamily: 'monospace', fontSize: 13, color: '#e5e7eb', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }

    switch (activeTab) {
      case 'blueprint':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={() => copy(result.blueprint)} style={copyBtnStyle('#4ade80')}>📋 COPY</button>
            </div>
            <div style={{ ...baseStyle, fontSize: 12, color: '#9CA3AF', background: '#0f0f0f', padding: 14, borderRadius: 10 }}>
              {result.blueprint}
            </div>
          </div>
        )

      case 'script':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={() => copy(result.script)} style={copyBtnStyle('#4ade80')}>📋 COPY SCRIPT</button>
            </div>
            <div style={{ ...baseStyle, background: '#161616', padding: 16, borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)' }}>
              {result.script}
            </div>
          </div>
        )

      case 'hooks': {
        const hooks = parseHooks(result.hooks)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hooks.length === 0
              ? <div style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: 12, padding: 12 }}>No hooks parsed — check Analysis tab.</div>
              : hooks.map((h, i) => (
                <div key={i} style={{ background: '#161616', border: `1px solid ${h.color}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: h.color, marginBottom: 6, letterSpacing: 1 }}>{h.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff', lineHeight: 1.6 }}>{h.text}</div>
                  <button onClick={() => copy(h.text)} style={{ ...copyBtnStyle(h.color), marginTop: 8 }}>📋 COPY</button>
                </div>
              ))
            }
          </div>
        )
      }

      case 'ctas': {
        const ctas = parseCTAs(result.ctas)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ctas.length === 0
              ? <div style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: 12, padding: 12 }}>No CTAs parsed — check Analysis tab.</div>
              : ctas.map((c, i) => (
                <div key={i} style={{ background: '#161616', border: `1px solid ${c.color}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: c.color, marginBottom: 6, letterSpacing: 1 }}>{c.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff', lineHeight: 1.6 }}>{c.text}</div>
                  <button onClick={() => copy(c.text)} style={{ ...copyBtnStyle(c.color), marginTop: 8 }}>📋 COPY</button>
                </div>
              ))
            }
          </div>
        )
      }

      case 'higgsfield':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={() => copy(result.higgsfield)} style={copyBtnStyle('#EC4899')}>📋 COPY PROMPT</button>
            </div>
            <div style={{ ...baseStyle, background: '#1a0a14', padding: 16, borderRadius: 12, border: '1px solid #831843' }}>
              {result.higgsfield}
            </div>
          </div>
        )

      case 'captions':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={() => copy(result.captions)} style={copyBtnStyle('#FFD700')}>📋 COPY ALL</button>
            </div>
            <div style={{ ...baseStyle, background: '#1a1400', padding: 16, borderRadius: 12, border: '1px solid #92400e' }}>
              {result.captions}
            </div>
          </div>
        )
    }
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 16px 16px', background: '#0d1a2b', marginBottom: 16 }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#3B82F6', margin: 0, position: 'relative', zIndex: 1 }}>🎬 VIDEO CLONE</h1>
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', margin: '4px 0 0', position: 'relative', zIndex: 1 }}>
          Paste any viral video URL → AI watches it → clones the exact format for your brand
        </p>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Cost badge */}
        <div style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>Two-pass AI analysis</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#FFD700' }}>2 CREDITS / RUN</span>
        </div>

        {/* URL input */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            ref={urlRef}
            value={url}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="PASTE VIDEO URL (YouTube, TikTok, Instagram, Facebook…)"
            style={{ width: '100%', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 44px 14px 16px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 13, boxSizing: 'border-box' }}
          />
          {fetchingTranscript && (
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <Spinner size={14} />
            </div>
          )}
        </div>

        {/* Transcript fetch note */}
        {transcriptNote && (
          <div style={{
            fontFamily: 'monospace', fontSize: 10,
            color: transcriptNote.startsWith('✓') ? '#4ade80' : '#9CA3AF',
            marginBottom: 12, padding: '6px 12px',
            background: '#0f0f0f', borderRadius: 8,
            border: `1px solid ${transcriptNote.startsWith('✓') ? '#166534' : '#1f2937'}`,
          }}>
            {transcriptNote}
          </div>
        )}

        {/* Thumbnail preview — shown when we have visual metadata */}
        {thumbnailUrl && analysisType === 'metadata' && (
          <div style={{ marginBottom: 14, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(59,130,246,0.3)', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
              padding: '20px 12px 10px',
              fontFamily: 'monospace', fontSize: 9, color: '#4ade80',
              letterSpacing: 1,
            }}>
              👁 AI WILL ANALYZE THIS THUMBNAIL
            </div>
          </div>
        )}

        {/* Platform + Pillar row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            style={{ flex: 1, background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, cursor: 'pointer' }}
          >
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={pillar}
            onChange={e => setPillar(e.target.value as ClonePillar)}
            style={{ flex: 1, background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, cursor: 'pointer' }}
          >
            {CLONE_PILLARS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </div>

        {/* Caption / Transcript textarea */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, color: '#9CA3AF', marginBottom: 6, letterSpacing: 1 }}>
            {analysisType === 'metadata'
              ? `CAPTION ${transcript ? `(${transcript.split(/\s+/).length} words — auto-fetched)` : '— auto-fetched above'}`
              : `TRANSCRIPT ${transcript ? `(${transcript.split(/\s+/).length} words)` : '— paste or auto-fetched above'}`
            }
          </div>
          <textarea
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            placeholder={
              analysisType === 'metadata'
                ? 'Caption auto-fetched — you can add more context here or leave it as-is'
                : 'Paste the video transcript/caption here, or it will auto-fill above…'
            }
            rows={analysisType === 'metadata' && thumbnailUrl ? 3 : 6}
            style={{ width: '100%', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontFamily: 'monospace', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
          />
        </div>

        {/* Clone button */}
        <button
          onClick={clone}
          disabled={loading}
          style={{
            width: '100%', borderRadius: 999, padding: '16px 0', border: 'none',
            background: loading
              ? '#1f2937'
              : !hasContent
                ? 'rgba(59,130,246,0.35)'
                : 'linear-gradient(135deg, #3B82F6, #4ade80)',
            color: !hasContent && !loading ? '#6b7280' : '#000',
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'background 0.15s',
          }}
        >
          {loading
            ? <><Spinner size={20} /><span style={{ color: '#9CA3AF' }}>{step ?? 'CLONING…'}</span></>
            : '🎬 CLONE THIS VIDEO'}
        </button>

        {/* Steps indicator while loading */}
        {loading && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
            {['Analyzing structure', 'Cloning content'].map((s, i) => (
              <div key={i} style={{
                fontFamily: 'monospace', fontSize: 9, padding: '4px 10px', borderRadius: 999,
                background: (step?.includes('Pass 1') && i === 0) || (step?.includes('Pass 2') && i === 1) ? '#4ade80' : '#1f2937',
                color: (step?.includes('Pass 1') && i === 0) || (step?.includes('Pass 2') && i === 1) ? '#000' : '#9CA3AF',
              }}>{s}</div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && (
          <div id="clone-results" style={{ marginTop: 8 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, color: '#4ade80', letterSpacing: 1, marginBottom: 10 }}>
              ✓ CLONE COMPLETE — {platform.toUpperCase()} · {pillar.toUpperCase()}
            </div>

            {/* Output tab bar */}
            <div style={{ display: 'flex', overflowX: 'auto', gap: 4, marginBottom: 14, paddingBottom: 4 }}>
              {OUTPUT_TABS.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flexShrink: 0,
                      padding: '7px 12px',
                      borderRadius: 999,
                      border: `1px solid ${isActive ? '#3B82F6' : '#1f2937'}`,
                      background: isActive ? '#1e3a5f' : 'transparent',
                      color: isActive ? '#3B82F6' : '#9CA3AF',
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 11,
                      cursor: 'pointer',
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab.emoji} {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Tab content */}
            <div style={{ minHeight: 200 }}>
              {renderTabContent()}
            </div>

            {/* Copy full pack */}
            <button
              onClick={() => copy([result.script, result.hooks, result.ctas, result.higgsfield, result.captions].join('\n\n---\n\n'))}
              style={{ width: '100%', background: 'transparent', border: '1px solid #4ade80', color: '#4ade80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, padding: '12px 0', borderRadius: 999, cursor: 'pointer', marginTop: 16 }}
            >
              📋 COPY FULL CONTENT PACK
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function copyBtnStyle(color: string): React.CSSProperties {
  return {
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 11,
    padding: '4px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    letterSpacing: 0.5,
  }
}
