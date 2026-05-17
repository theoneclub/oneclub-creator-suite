'use client'
import { useState, useEffect, useCallback } from 'react'
import MatrixRain from '@/components/MatrixRain'

const C = {
  black: '#0a0a0a', card: '#111827', cardDeep: '#0d1117',
  green: '#a3f0af', yellow: '#fff26a', grey: '#6b7280',
  dim: '#1f2937', purple: '#a78bfa', orange: '#fb923c', red: '#ef4444',
}

type Finalist = { id: string; memberId: string; memberName: string; memberTier: string; entries: number; drawNumber: number; ideaTitle?: string; voteCount?: number; votePct?: number }
type Member = { memberId: string; memberName: string; tier: string; baseEntries: number; bonusEntries: number; totalEntries: number; drawn: boolean }
type Action = { id: string; icon: string; label: string; entries: number; url: string; active: boolean }
type Stats = { drawId: string; phase: string; totalMembers: number; totalEntries: number; finalistsDrawn: number; submissionsReceived: number; totalVotes: number; finalistVotes: Finalist[]; members: Member[] }

const SPIN_NAMES = ['ALEX R.', 'JAMIE K.', 'MORGAN L.', 'CASEY T.', 'RILEY S.', 'QUINN M.', 'DREW P.', 'SAM W.', 'TAYLOR H.', 'JORDAN B.']

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)
  const [tab, setTab] = useState<'draw' | 'config' | 'stats'>('draw')

  // Draw tab
  const [stats, setStats] = useState<Stats | null>(null)
  const [finalists, setFinalists] = useState<Finalist[]>([])
  const [spinning, setSpinning] = useState(false)
  const [spinName, setSpinName] = useState('')
  const [drawLoading, setDrawLoading] = useState(false)

  // Config tab
  const [drawDate, setDrawDate] = useState('')
  const [drawTime, setDrawTime] = useState('18:00')
  const [submissionHours, setSubmissionHours] = useState(72)
  const [votingHours, setVotingHours] = useState(72)
  const [prizeAmount, setPrizeAmount] = useState(10000)
  const [message, setMessage] = useState('')
  const [configSaving, setConfigSaving] = useState(false)
  const [configMsg, setConfigMsg] = useState('')

  // Actions
  const [actions, setActions] = useState<Action[]>([])
  const [newIcon, setNewIcon] = useState('🎯')
  const [newLabel, setNewLabel] = useState('')
  const [newEntries, setNewEntries] = useState(2)
  const [newUrl, setNewUrl] = useState('')

  const loadStats = useCallback(async () => {
    const res = await fetch('/api/freedomfund/admin/stats')
    if (res.ok) {
      const data: Stats = await res.json()
      setStats(data)
      setFinalists(data.finalistVotes || [])
    }
  }, [])

  const loadActions = useCallback(async () => {
    const res = await fetch('/api/freedomfund/admin/actions')
    if (res.ok) setActions(await res.json())
  }, [])

  useEffect(() => {
    if (authed) { loadStats(); loadActions() }
  }, [authed, loadStats, loadActions])

  const handleAuth = async () => {
    const res = await fetch('/api/admin/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    if (res.ok) { setAuthed(true); setPwError(false) }
    else setPwError(true)
  }

  const handleDraw = async () => {
    if (!stats?.drawId || drawLoading || (finalists.length >= 5)) return
    setDrawLoading(true)
    setSpinning(true)

    // Spin animation
    let spinCount = 0
    const spinInterval = setInterval(() => {
      setSpinName(SPIN_NAMES[Math.floor(Math.random() * SPIN_NAMES.length)])
      spinCount++
      if (spinCount > 20) clearInterval(spinInterval)
    }, 80)

    try {
      const res = await fetch('/api/freedomfund/admin/draw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drawId: stats.drawId }) })
      if (res.ok) {
        const { finalist } = await res.json()
        await new Promise(r => setTimeout(r, 1800))
        setSpinName(finalist.memberName)
        await new Promise(r => setTimeout(r, 600))
        setSpinning(false)
        await loadStats()
      }
    } finally {
      clearInterval(spinInterval)
      setSpinning(false)
      setDrawLoading(false)
    }
  }

  const handleReset = async () => {
    if (!stats?.drawId || !window.confirm('Reset all finalists for this draw?')) return
    await fetch('/api/freedomfund/admin/draw', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drawId: stats.drawId }) })
    await loadStats()
  }

  const handlePhase = async (phase: string) => {
    if (!stats?.drawId) return
    await fetch('/api/freedomfund/admin/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ drawId: stats.drawId, phase }) })
    await loadStats()
  }

  const handleSaveConfig = async () => {
    setConfigSaving(true)
    setConfigMsg('')
    try {
      const dt = drawDate && drawTime ? new Date(`${drawDate}T${drawTime}`).toISOString() : undefined
      const res = await fetch('/api/freedomfund/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drawId: stats?.drawId, drawDate: dt, submissionHours, votingHours, prizeAmount, message }),
      })
      setConfigMsg(res.ok ? '✓ Configuration saved!' : '✗ Save failed')
    } finally {
      setConfigSaving(false)
      setTimeout(() => setConfigMsg(''), 3000)
    }
  }

  const handleToggleAction = async (id: string, active: boolean) => {
    await fetch('/api/freedomfund/admin/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active }) })
    loadActions()
  }

  const handleAddAction = async () => {
    if (!newLabel) return
    await fetch('/api/freedomfund/admin/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ icon: newIcon, label: newLabel, entries: newEntries, url: newUrl }) })
    setNewLabel(''); setNewUrl(''); setNewEntries(2)
    loadActions()
  }

  // Password gate
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <MatrixRain />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360, padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: C.purple, letterSpacing: 3, marginBottom: 8 }}>THE ONE CLUB</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: C.yellow, letterSpacing: 1 }}>FREEDOM FUND</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: C.purple, letterSpacing: 1 }}>ADMIN PANEL</div>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            placeholder="Enter admin password..."
            style={{ width: '100%', background: C.card, border: `1px solid ${pwError ? C.red : C.dim}`, borderRadius: 8, padding: '14px 16px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 13, marginBottom: 12, boxSizing: 'border-box', outline: 'none' }}
          />
          {pwError && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.red, marginBottom: 10, textAlign: 'center' }}>Incorrect password</div>}
          <button
            onClick={handleAuth}
            style={{ width: '100%', background: C.purple, color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, padding: '14px 0', borderRadius: 8, border: 'none', cursor: 'pointer', letterSpacing: 0.5 }}
          >
            UNLOCK →
          </button>
        </div>
      </div>
    )
  }

  const drawnCount = stats?.finalistsDrawn || 0
  const TABS: { key: 'draw' | 'config' | 'stats'; label: string }[] = [{ key: 'draw', label: '🎰 DRAW' }, { key: 'config', label: '⚙️ CONFIG' }, { key: 'stats', label: '📊 STATS' }]

  return (
    <div style={{ minHeight: '100vh', background: C.black, color: '#fff' }}>
      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.dim}`, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.purple, letterSpacing: 2 }}>ADMIN</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: C.yellow, letterSpacing: 1 }}>FREEDOM FUND</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: `${C.purple}22`, border: `1px solid ${C.purple}55`, borderRadius: 6, padding: '4px 10px', fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.purple }}>
            {stats?.phase?.toUpperCase() || 'NO DRAW'}
          </div>
          <button onClick={() => { fetch('/api/admin/auth', { method: 'DELETE' }); setAuthed(false) }} style={{ background: 'transparent', border: `1px solid ${C.dim}`, color: C.grey, fontFamily: "'Space Mono', monospace", fontSize: 10, padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>
            LOCK
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.dim}`, background: C.card }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: tab === t.key ? `2px solid ${C.purple}` : '2px solid transparent', color: tab === t.key ? C.purple : C.grey, fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, padding: '14px 0', cursor: 'pointer', letterSpacing: 0.5 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* ── DRAW TAB ── */}
        {tab === 'draw' && (
          <>
            <div style={{ background: C.card, border: `2px solid ${C.purple}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.purple, letterSpacing: 0.5, marginBottom: 8 }}>WEIGHTED DRAW</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.grey, lineHeight: 1.6, marginBottom: 20 }}>
                Draw 5 finalists weighted by entries. Each draw removes from pool.
              </div>

              {spinning && (
                <div style={{ background: C.cardDeep, borderRadius: 10, padding: '20px 0', textAlign: 'center', marginBottom: 16, border: `1px solid ${C.purple}44` }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.purple, letterSpacing: 1, animation: 'pulse 0.1s infinite' }}>{spinName || '...'}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.grey, marginTop: 4 }}>DRAWING...</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.grey }}>{drawnCount}/5 FINALISTS DRAWN</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleReset} style={{ background: 'transparent', border: `1px solid ${C.red}`, color: C.red, fontFamily: "'Space Mono', monospace", fontSize: 10, padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>RESET</button>
                  <button
                    onClick={handleDraw}
                    disabled={drawLoading || drawnCount >= 5}
                    style={{ background: drawLoading || drawnCount >= 5 ? C.dim : C.purple, color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, padding: '10px 24px', borderRadius: 8, border: 'none', cursor: drawLoading || drawnCount >= 5 ? 'not-allowed' : 'pointer', letterSpacing: 0.5 }}
                  >
                    🎰 DRAW #{drawnCount + 1}
                  </button>
                </div>
              </div>

              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= drawnCount ? C.purple : C.dim }} />
                ))}
              </div>

              {drawnCount >= 5 && (
                <button
                  onClick={() => handlePhase('submissions')}
                  style={{ width: '100%', marginTop: 20, background: C.green, color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, padding: '14px 0', borderRadius: 8, border: 'none', cursor: 'pointer', letterSpacing: 0.5 }}
                >
                  ⚡ OPEN SUBMISSIONS →
                </button>
              )}
            </div>

            {/* Finalists list */}
            {stats?.finalistVotes?.length ? (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#fff', letterSpacing: 0.5, marginBottom: 12 }}>DRAWN FINALISTS</div>
                {stats.finalistVotes.map(f => (
                  <div key={f.id} style={{ background: C.card, border: `1px solid ${C.purple}33`, borderRadius: 10, padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.purple, marginBottom: 2 }}>#{f.drawNumber}</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#fff' }}>{f.memberName}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.grey }}>{f.memberTier?.toUpperCase()} · {f.entries} entries</div>
                    </div>
                    {f.ideaTitle && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.green, maxWidth: 160, textAlign: 'right' }}>{f.ideaTitle}</div>}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Member pool */}
            {stats?.members?.length ? (
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#fff', letterSpacing: 0.5, marginBottom: 12 }}>MEMBER POOL ({stats.totalMembers})</div>
                <div style={{ background: C.card, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.dim}` }}>
                  {stats.members.slice(0, 50).map((m, i) => (
                    <div key={m.memberId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < Math.min(stats.members.length, 50) - 1 ? `1px solid ${C.dim}` : 'none', opacity: m.drawn ? 0.4 : 1 }}>
                      <div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: m.drawn ? C.grey : '#fff' }}>{m.memberName}</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.grey }}>{m.tier?.toUpperCase()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: m.drawn ? C.grey : C.yellow }}>{m.totalEntries}</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.grey }}>
                          {stats.totalEntries > 0 ? ((m.totalEntries / stats.totalEntries) * 100).toFixed(1) : '0'}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* ── CONFIG TAB ── */}
        {tab === 'config' && (
          <>
            <div style={{ background: C.card, border: `2px solid ${C.purple}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.purple, letterSpacing: 0.5, marginBottom: 20 }}>DRAW CONFIGURATION</div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.grey, marginBottom: 6 }}>DRAW DATE</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="date" value={drawDate} onChange={e => setDrawDate(e.target.value)} style={{ flex: 1, background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, outline: 'none' }} />
                  <input type="time" value={drawTime} onChange={e => setDrawTime(e.target.value)} style={{ width: 120, background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.grey, marginBottom: 6 }}>SUBMISSION WINDOW (HRS)</div>
                  <input type="number" value={submissionHours} onChange={e => setSubmissionHours(Number(e.target.value))} style={{ width: '100%', background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.grey, marginBottom: 6 }}>VOTING WINDOW (HRS)</div>
                  <input type="number" value={votingHours} onChange={e => setVotingHours(Number(e.target.value))} style={{ width: '100%', background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.grey, marginBottom: 6 }}>PRIZE AMOUNT ($)</div>
                <input type="number" value={prizeAmount} onChange={e => setPrizeAmount(Number(e.target.value))} style={{ width: '100%', background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.grey, marginBottom: 6 }}>MESSAGE TO MEMBERS</div>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Optional message shown on member dashboard..." style={{ width: '100%', background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              <button onClick={handleSaveConfig} disabled={configSaving} style={{ width: '100%', background: configSaving ? C.dim : C.yellow, color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, padding: '14px 0', borderRadius: 8, border: 'none', cursor: configSaving ? 'not-allowed' : 'pointer', letterSpacing: 0.5 }}>
                {configSaving ? 'SAVING...' : 'SAVE CONFIGURATION ✓'}
              </button>
              {configMsg && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: configMsg.includes('✓') ? C.green : C.red, marginTop: 10, textAlign: 'center' }}>{configMsg}</div>}
            </div>

            {/* Bonus Actions */}
            <div style={{ background: C.card, border: `1px solid ${C.dim}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#fff', letterSpacing: 0.5, marginBottom: 16 }}>BONUS ENTRY ACTIONS</div>

              {actions.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.dim}`, opacity: a.active ? 1 : 0.5 }}>
                  <div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#fff' }}>{a.icon} {a.label}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.grey }}>+{a.entries} entries · {a.url}</div>
                  </div>
                  <button onClick={() => handleToggleAction(a.id, !a.active)} style={{ background: a.active ? C.green : C.dim, color: '#000', fontFamily: "'Space Mono', monospace", fontSize: 10, padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', minWidth: 36 }}>{a.active ? 'ON' : 'OFF'}</button>
                </div>
              ))}

              <div style={{ marginTop: 20 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: C.grey, letterSpacing: 0.5, marginBottom: 12 }}>ADD NEW ACTION</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input value={newIcon} onChange={e => setNewIcon(e.target.value)} placeholder="🎯" maxLength={4} style={{ width: 50, background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '10px 8px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 18, outline: 'none', textAlign: 'center' }} />
                  <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Action label" style={{ flex: 1, background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, outline: 'none' }} />
                  <input type="number" value={newEntries} onChange={e => setNewEntries(Number(e.target.value))} style={{ width: 70, background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '10px 8px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, outline: 'none', textAlign: 'center' }} />
                </div>
                <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                <button onClick={handleAddAction} disabled={!newLabel} style={{ background: newLabel ? C.purple : C.dim, color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, padding: '11px 24px', borderRadius: 8, border: 'none', cursor: newLabel ? 'pointer' : 'not-allowed', letterSpacing: 0.5 }}>+ ADD</button>
              </div>
            </div>
          </>
        )}

        {/* ── STATS TAB ── */}
        {tab === 'stats' && stats && (
          <>
            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'MEMBERS IN POOL', value: stats.totalMembers },
                { label: 'TOTAL ENTRIES', value: stats.totalEntries },
                { label: `SUBMISSIONS ${stats.submissionsReceived}/5`, value: stats.submissionsReceived },
                { label: 'VOTES CAST', value: stats.totalVotes },
              ].map(s => (
                <div key={s.label} style={{ background: C.card, border: `1px solid ${C.dim}`, borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: C.yellow }}>{s.value}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.grey, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Phase control */}
            <div style={{ background: C.card, border: `1px solid ${C.dim}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#fff', letterSpacing: 0.5, marginBottom: 4 }}>PHASE CONTROL</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.purple, marginBottom: 16 }}>CURRENT: {stats.phase?.toUpperCase()}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: '⚡ OPEN SUBMISSIONS', phase: 'submissions', color: C.orange },
                  { label: '🗳 OPEN VOTING', phase: 'voting', color: C.green },
                  { label: '🏆 ANNOUNCE RESULTS', phase: 'results', color: C.yellow },
                ].map(btn => (
                  <button key={btn.phase} onClick={() => handlePhase(btn.phase)} style={{ background: 'transparent', border: `1px solid ${btn.color}`, color: btn.color, fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, padding: '12px 0', borderRadius: 8, cursor: 'pointer', letterSpacing: 0.5, opacity: stats.phase === btn.phase ? 0.4 : 1 }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live vote breakdown */}
            {stats.finalistVotes?.length > 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.dim}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#fff', letterSpacing: 0.5, marginBottom: 16 }}>LIVE VOTE BREAKDOWN</div>
                {[...stats.finalistVotes].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0)).map(f => (
                  <div key={f.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#fff' }}>{f.memberName}</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: C.yellow }}>{f.voteCount || 0} votes ({f.votePct || 0}%)</div>
                    </div>
                    <div style={{ background: C.cardDeep, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{ background: C.purple, height: '100%', width: `${f.votePct || 0}%`, transition: 'width 0.5s ease', borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'stats' && !stats && (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.grey }}>
            No active draw found. Create one in Config.
          </div>
        )}
      </div>
    </div>
  )
}
