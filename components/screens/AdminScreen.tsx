'use client'
import { useState, useEffect, useCallback } from 'react'
import MatrixRain from '@/components/MatrixRain'
import Spinner from '@/components/Spinner'
import Toast from '@/components/Toast'
import { BrainSource, AdminStats } from '@/types'

const TAG_OPTIONS = ['HOOKS', 'COPYWRITING', 'ONE_CLUB', 'VOICE', 'RESEARCH', 'OTHER']
const TAG_COLORS: Record<string, string> = { HOOKS: '#4ade80', COPYWRITING: '#3B82F6', ONE_CLUB: '#A855F7', VOICE: '#EC4899', RESEARCH: '#F97316', OTHER: '#9CA3AF' }

export default function AdminScreen() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)
  const [tab, setTab] = useState<'brain' | 'stats'>('brain')
  const [sources, setSources] = useState<BrainSource[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [url, setUrl] = useState('')
  const [tag, setTag] = useState('HOOKS')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const loadSources = useCallback(async () => {
    const res = await fetch('/api/admin/brain')
    if (res.ok) setSources(await res.json())
  }, [])

  const loadStats = useCallback(async () => {
    const res = await fetch('/api/admin/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  useEffect(() => {
    if (authed) { loadSources(); loadStats() }
  }, [authed, loadSources, loadStats])

  const handleAuth = async () => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) { setAuthed(true); setPwError(false) }
    else setPwError(true)
  }

  const handleLock = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    setAuthed(false)
    setPassword('')
  }

  const handleAdd = async () => {
    if (!url) return
    setLoading(true)
    try {
      const res = await fetch('/api/brain/fetch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tag, memberId: 'admin', scope: 'global' }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setUrl('')
      setToast({ msg: '✅ Added to Global Brain!', type: 'success' })
      loadSources()
    } catch (e: unknown) {
      setToast({ msg: e instanceof Error ? e.message : 'Failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, active: boolean) => {
    await fetch('/api/admin/brain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id, active }) })
    loadSources()
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/admin/brain', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadSources()
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 360, borderRadius: 20, padding: '40px 28px', border: '1px solid #A855F7', background: '#0a0010' }}>
          <MatrixRain />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🔒</div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#A855F7', margin: '12px 0 4px' }}>ADMIN ACCESS</h1>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', marginBottom: 24 }}>The One Club — Operator Panel</p>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              placeholder="Password"
              style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${pwError ? '#F97316' : '#A855F7'}`, borderRadius: 10, padding: '14px 16px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 14, letterSpacing: 4, textAlign: 'center', marginBottom: 8, boxSizing: 'border-box' }}
            />
            {pwError && <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#F97316', marginBottom: 10 }}>Incorrect password. Try again.</div>}
            <button onClick={handleAuth} style={{ width: '100%', background: '#A855F7', border: 'none', borderRadius: 999, padding: '14px 0', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, cursor: 'pointer' }}>
              ENTER →
            </button>
          </div>
        </div>
      </div>
    )
  }

  const activeSources = sources.filter(s => s.active !== false)

  return (
    <div style={{ paddingBottom: 20 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 16px 16px', background: '#1a0a2e', marginBottom: 16 }}>
        <MatrixRain />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#A855F7', margin: 0 }}>⚙️ ADMIN</h1>
          <button onClick={handleLock} style={{ background: 'transparent', border: '1px solid #A855F7', color: '#A855F7', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, padding: '6px 16px', borderRadius: 999, cursor: 'pointer' }}>
            🔒 LOCK
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['brain', 'stats'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 0', borderRadius: 999, border: `1px solid ${tab === t ? '#A855F7' : '#1f2937'}`, background: tab === t ? '#A855F7' : 'transparent', color: tab === t ? '#fff' : '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, cursor: 'pointer' }}>
              {t === 'brain' ? '🧠 GLOBAL BRAIN' : '📊 USAGE STATS'}
            </button>
          ))}
        </div>

        {tab === 'brain' ? (
          <div>
            {/* Add source card */}
            <div style={{ background: '#111', border: '1px solid #A855F7', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#A855F7', marginBottom: 12 }}>ADD TO GLOBAL BRAIN</div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 10 }}>
                {TAG_OPTIONS.map(t => (
                  <button key={t} onClick={() => setTag(t)} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 999, border: `1px solid ${tag === t ? TAG_COLORS[t] : '#1f2937'}`, background: tag === t ? TAG_COLORS[t] : 'transparent', color: tag === t ? '#000' : '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, cursor: 'pointer' }}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={url} onChange={e => setUrl(e.target.value)} placeholder="YouTube · Articles · Blog · PDF · Any URL" style={{ flex: 1, background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: 'monospace', fontSize: 11 }} />
                <button onClick={handleAdd} disabled={loading || !url} style={{ padding: '10px 16px', background: loading ? '#1f2937' : '#A855F7', border: 'none', borderRadius: 8, color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, cursor: 'pointer' }}>
                  {loading ? <Spinner size={14} /> : '➕ ADD'}
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'TOTAL', value: sources.length, color: '#9CA3AF' },
                { label: 'ACTIVE', value: activeSources.length, color: '#4ade80' },
                { label: 'INACTIVE', value: sources.length - activeSources.length, color: '#1f2937' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, background: '#111', border: `1px solid ${s.color}`, borderRadius: 10, padding: '10px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: s.color }}>{s.value}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9CA3AF' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Source list */}
            {sources.map(s => (
              <div key={s.id} style={{ background: '#111', border: `1px solid ${s.active !== false ? '#4ade80' : '#1f2937'}`, borderRadius: 12, padding: 14, marginBottom: 10, opacity: s.active !== false ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span>{s.type === 'youtube' ? '▶️' : s.type === 'pdf' ? '📄' : '🔗'}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 999, background: TAG_COLORS[s.tag] ?? '#9CA3AF', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 10 }}>{s.tag}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#9CA3AF' }}>{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#fff' }}>{s.title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={() => handleToggle(s.id, !(s.active !== false))} style={{ background: s.active !== false ? '#4ade80' : '#1f2937', border: 'none', borderRadius: 999, padding: '4px 10px', color: s.active !== false ? '#000' : '#9CA3AF', fontFamily: 'monospace', fontSize: 9, cursor: 'pointer' }}>
                      {s.active !== false ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 16 }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'MEMBERS TODAY', value: stats.totalMembersToday, color: '#4ade80' },
                { label: 'GENS TODAY', value: stats.generationsToday, color: '#FFD700' },
                { label: 'MEMBERS WEEK', value: stats.totalMembersWeek, color: '#3B82F6' },
                { label: 'GENS WEEK', value: stats.generationsWeek, color: '#EC4899' },
              ].map(s => (
                <div key={s.label} style={{ background: '#111', border: `1px solid ${s.color}`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: s.color }}>{s.value}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9CA3AF' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#111', border: '1px solid #1f2937', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: '#9CA3AF', marginBottom: 12 }}>FEATURE BREAKDOWN</div>
              {stats.featureBreakdown.map(f => (
                <div key={f.feature} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#fff', textTransform: 'capitalize' }}>{f.feature}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>{f.count} ({f.pct}%)</span>
                  </div>
                  <div style={{ background: '#1f2937', borderRadius: 4, height: 6 }}>
                    <div style={{ background: '#4ade80', height: '100%', borderRadius: 4, width: `${f.pct}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#111', border: '1px solid #1f2937', borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: '#9CA3AF', marginBottom: 12 }}>MEMBERS BY TIER</div>
              {stats.tierBreakdown.map(t => (
                <div key={t.tier} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1f2937' }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#fff', textTransform: 'uppercase' }}>{t.tier}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#4ade80' }}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>
        )}
      </div>
    </div>
  )
}
