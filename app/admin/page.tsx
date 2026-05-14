'use client'
import { useState, useEffect, useCallback } from 'react'
import MatrixRain from '@/components/MatrixRain'
import Spinner from '@/components/Spinner'
import AdminContent from '@/components/freedomfund/AdminContent'
import { BrainSource, AdminStats } from '@/types'

// ── Palette ──────────────────────────────────────────────────────────────────
const A = {
  bg:      '#050508',
  sidebar: '#0d0d14',
  card:    '#111118',
  border:  '#1f2937',
  purple:  '#A855F7',
  green:   '#4ade80',
  yellow:  '#FFD700',
  red:     '#EF4444',
  grey:    '#9CA3AF',
  dim:     '#374151',
}

const TAG_OPTIONS = ['HOOKS', 'COPYWRITING', 'ONE_CLUB', 'VOICE', 'RESEARCH', 'OTHER']
const TAG_COLORS: Record<string, string> = {
  HOOKS: '#4ade80', COPYWRITING: '#3B82F6', ONE_CLUB: '#A855F7',
  VOICE: '#EC4899', RESEARCH: '#F97316', OTHER: '#9CA3AF',
}

type Section = 'dashboard' | 'brain' | 'freedomfund' | 'members' | 'settings'

interface Member {
  member_id: string
  tier: string
  credits_remaining: number
  credits_total: number
  entries: number
  updated_at: string
}

interface Settings {
  anthropic: boolean
  supabase: boolean
  adminSecretSet: boolean
  nodeEnv: string
}

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV: { id: Section; emoji: string; label: string }[] = [
  { id: 'dashboard',   emoji: '📊', label: 'Dashboard' },
  { id: 'brain',       emoji: '🧠', label: 'Global Brain' },
  { id: 'freedomfund', emoji: '🏆', label: 'Freedom Fund' },
  { id: 'members',     emoji: '👥', label: 'Members' },
  { id: 'settings',    emoji: '⚙️', label: 'Settings' },
]

// ── Small reusable stat card ──────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ background: A.card, border: `1px solid ${color}33`, borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: A.grey, marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ── Password gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)

  const attempt = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    setLoading(false)
    if (res.ok) { setErr(false); onAuth() }
    else setErr(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <MatrixRain />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 380, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: A.purple, letterSpacing: 1 }}>MASTER ADMIN</div>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: A.grey, marginTop: 4 }}>The One Club — Operator Panel</div>
        </div>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          placeholder="Admin password"
          style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${err ? A.red : A.purple}`, borderRadius: 10, padding: '14px 16px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 14, letterSpacing: 3, textAlign: 'center', marginBottom: 8, boxSizing: 'border-box', outline: 'none' }}
        />
        {err && <div style={{ fontFamily: 'monospace', fontSize: 11, color: A.red, marginBottom: 10, textAlign: 'center' }}>Incorrect password.</div>}
        <button
          onClick={attempt}
          disabled={loading}
          style={{ width: '100%', background: A.purple, border: 'none', borderRadius: 999, padding: '14px 0', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, cursor: 'pointer', letterSpacing: 0.5 }}
        >
          {loading ? 'CHECKING…' : 'ENTER →'}
        </button>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [section, setSection] = useState<Section>('dashboard')

  // ── Brain state ──
  const [brainSources, setBrainSources] = useState<BrainSource[]>([])
  const [brainUrl, setBrainUrl] = useState('')
  const [brainTag, setBrainTag] = useState('HOOKS')
  const [brainLoading, setBrainLoading] = useState(false)
  const [brainToast, setBrainToast] = useState('')

  // ── Dashboard / stats ──
  const [stats, setStats] = useState<AdminStats | null>(null)

  // ── Members state ──
  const [members, setMembers] = useState<Member[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [editCredits, setEditCredits] = useState('')
  const [editEntries, setEditEntries] = useState('')
  const [memberSaving, setMemberSaving] = useState(false)

  // ── Settings state ──
  const [settings, setSettings] = useState<Settings | null>(null)

  // ── Loaders ──────────────────────────────────────────────────────────────────
  const loadBrain = useCallback(async () => {
    const res = await fetch('/api/admin/brain')
    if (res.ok) setBrainSources(await res.json())
  }, [])

  const loadStats = useCallback(async () => {
    const res = await fetch('/api/admin/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  const loadMembers = useCallback(async () => {
    const res = await fetch('/api/admin/members')
    if (res.ok) setMembers(await res.json())
  }, [])

  const loadSettings = useCallback(async () => {
    const res = await fetch('/api/admin/settings')
    if (res.ok) setSettings(await res.json())
  }, [])

  useEffect(() => {
    if (!authed) return
    loadStats()
    loadBrain()
    loadMembers()
    loadSettings()
  }, [authed, loadStats, loadBrain, loadMembers, loadSettings])

  const handleLock = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    setAuthed(false)
  }

  // ── Brain handlers ────────────────────────────────────────────────────────────
  const handleBrainAdd = async () => {
    if (!brainUrl) return
    setBrainLoading(true)
    try {
      const res = await fetch('/api/brain/fetch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: brainUrl, tag: brainTag, memberId: 'admin', scope: 'global' }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setBrainUrl('')
      setBrainToast('✅ Added!')
      setTimeout(() => setBrainToast(''), 3000)
      loadBrain()
    } catch (e: unknown) {
      setBrainToast(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBrainLoading(false)
    }
  }

  const handleBrainToggle = async (id: string, active: boolean) => {
    await fetch('/api/admin/brain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id, active }) })
    loadBrain()
  }

  const handleBrainDelete = async (id: string) => {
    await fetch('/api/admin/brain', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadBrain()
  }

  // ── Member edit handlers ──────────────────────────────────────────────────────
  const openEdit = (m: Member) => {
    setEditMember(m)
    setEditCredits(String(m.credits_remaining))
    setEditEntries(String(m.entries))
  }

  const handleMemberSave = async () => {
    if (!editMember) return
    setMemberSaving(true)
    await fetch('/api/admin/members', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: editMember.member_id, credits_remaining: Number(editCredits), entries: Number(editEntries) }),
    })
    setMemberSaving(false)
    setEditMember(null)
    loadMembers()
  }

  // ── FF quick phase actions (on dashboard) ─────────────────────────────────────
  const handleFFPhase = async (phase: string) => {
    // We need the current draw ID from the FF stats endpoint
    const res = await fetch('/api/freedomfund/admin/stats')
    if (!res.ok) return
    const data = await res.json()
    if (!data.drawId) return
    await fetch('/api/freedomfund/admin/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drawId: data.drawId, phase }),
    })
    loadStats()
  }

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />

  const activeBrain = brainSources.filter(s => s.active !== false).length
  const filteredMembers = members.filter(m =>
    m.member_id.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.tier.toLowerCase().includes(memberSearch.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: A.bg, color: '#fff' }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 220, background: A.sidebar, borderRight: `1px solid ${A.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: A.purple, letterSpacing: 3, marginBottom: 4 }}>THE ONE CLUB</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#fff', letterSpacing: 0.5 }}>MASTER ADMIN</div>
        </div>

        <div style={{ borderTop: `1px solid ${A.border}`, flex: 1 }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setSection(n.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 20px', background: section === n.id ? `${A.purple}18` : 'transparent',
                border: 'none', borderLeft: `3px solid ${section === n.id ? A.purple : 'transparent'}`,
                color: section === n.id ? A.purple : A.grey,
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 0.5,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 18 }}>{n.emoji}</span>
              {n.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 20, borderTop: `1px solid ${A.border}` }}>
          <button
            onClick={handleLock}
            style={{ width: '100%', background: 'transparent', border: `1px solid ${A.border}`, color: A.grey, fontFamily: "'Space Mono', monospace", fontSize: 11, padding: '8px 0', borderRadius: 6, cursor: 'pointer' }}
          >
            🔒 LOCK SESSION
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>

        {/* ══════════════ DASHBOARD ══════════════ */}
        {section === 'dashboard' && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#fff', margin: '0 0 24px', letterSpacing: 0.5 }}>📊 Dashboard</h2>

            {stats ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
                  <StatCard label="ACTIVE MEMBERS TODAY" value={stats.totalMembersToday} color={A.green} />
                  <StatCard label="GENERATIONS TODAY" value={stats.generationsToday} color={A.yellow} />
                  <StatCard label="MEMBERS THIS WEEK" value={stats.totalMembersWeek} color="#3B82F6" />
                  <StatCard label="GLOBAL BRAIN SOURCES" value={stats.globalBrainCount} color={A.purple} />
                </div>

                {/* Quick actions */}
                <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: A.grey, marginBottom: 16 }}>FREEDOM FUND — QUICK ACTIONS</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { label: '⚡ OPEN SUBMISSIONS', phase: 'submissions', color: '#F97316' },
                      { label: '🗳 OPEN VOTING', phase: 'voting', color: A.green },
                      { label: '🏆 ANNOUNCE RESULTS', phase: 'results', color: A.yellow },
                    ].map(btn => (
                      <button key={btn.phase} onClick={() => handleFFPhase(btn.phase)}
                        style={{ background: 'transparent', border: `1px solid ${btn.color}`, color: btn.color, fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', letterSpacing: 0.5 }}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feature breakdown */}
                <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: A.grey, marginBottom: 16 }}>FEATURE BREAKDOWN (TODAY)</div>
                  {stats.featureBreakdown.map(f => (
                    <div key={f.feature} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#fff', textTransform: 'capitalize' }}>{f.feature}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: A.grey }}>{f.count} ({f.pct}%)</span>
                      </div>
                      <div style={{ background: A.border, borderRadius: 4, height: 6 }}>
                        <div style={{ background: A.green, height: '100%', borderRadius: 4, width: `${f.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tier breakdown */}
                <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 12, padding: 24 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: A.grey, marginBottom: 16 }}>MEMBERS BY TIER</div>
                  {stats.tierBreakdown.map(t => (
                    <div key={t.tier} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${A.border}` }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#fff', textTransform: 'uppercase' }}>{t.tier}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 14, color: A.green }}>{t.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 80 }}><Spinner /></div>
            )}
          </div>
        )}

        {/* ══════════════ GLOBAL BRAIN ══════════════ */}
        {section === 'brain' && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#fff', margin: '0 0 24px', letterSpacing: 0.5 }}>🧠 Global Brain</h2>

            {brainToast && <div style={{ background: A.card, border: `1px solid ${A.green}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontFamily: 'monospace', fontSize: 12, color: A.green }}>{brainToast}</div>}

            {/* Add source */}
            <div style={{ background: A.card, border: `1px solid ${A.purple}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: A.purple, marginBottom: 16 }}>ADD TO GLOBAL BRAIN</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {TAG_OPTIONS.map(t => (
                  <button key={t} onClick={() => setBrainTag(t)} style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${brainTag === t ? TAG_COLORS[t] : A.border}`, background: brainTag === t ? TAG_COLORS[t] : 'transparent', color: brainTag === t ? '#000' : A.grey, fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, cursor: 'pointer' }}>{t}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={brainUrl} onChange={e => setBrainUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBrainAdd()} placeholder="YouTube · Articles · Blog · PDF · Any URL" style={{ flex: 1, background: '#0d0d0d', border: `1px solid ${A.border}`, borderRadius: 8, padding: '12px 14px', color: '#fff', fontFamily: 'monospace', fontSize: 12, outline: 'none' }} />
                <button onClick={handleBrainAdd} disabled={brainLoading || !brainUrl} style={{ padding: '12px 24px', background: brainLoading || !brainUrl ? A.dim : A.purple, border: 'none', borderRadius: 8, color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {brainLoading ? <Spinner size={14} /> : '➕ ADD'}
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'TOTAL', value: brainSources.length, color: A.grey },
                { label: 'ACTIVE', value: activeBrain, color: A.green },
                { label: 'INACTIVE', value: brainSources.length - activeBrain, color: A.border },
              ].map(s => (
                <div key={s.label} style={{ background: A.card, border: `1px solid ${s.color}`, borderRadius: 10, padding: '16px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: s.color }}>{s.value}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: A.grey }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Source list */}
            {brainSources.map(s => (
              <div key={s.id} style={{ background: A.card, border: `1px solid ${s.active !== false ? A.green : A.border}`, borderRadius: 10, padding: '14px 18px', marginBottom: 10, opacity: s.active !== false ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span>{s.type === 'youtube' ? '▶️' : s.type === 'pdf' ? '📄' : '🔗'}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 999, background: TAG_COLORS[s.tag] ?? A.grey, color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 10 }}>{s.tag}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 10, color: A.grey }}>{new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff' }}>{s.title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <button onClick={() => handleBrainToggle(s.id, !(s.active !== false))} style={{ background: s.active !== false ? A.green : A.border, border: 'none', borderRadius: 999, padding: '4px 12px', color: s.active !== false ? '#000' : A.grey, fontFamily: 'monospace', fontSize: 10, cursor: 'pointer' }}>
                      {s.active !== false ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => handleBrainDelete(s.id)} style={{ background: 'none', border: 'none', color: A.red, cursor: 'pointer', fontSize: 18 }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════ FREEDOM FUND ══════════════ */}
        {section === 'freedomfund' && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#fff', margin: '0 0 24px', letterSpacing: 0.5 }}>🏆 Freedom Fund</h2>
            <AdminContent onLock={handleLock} />
          </div>
        )}

        {/* ══════════════ MEMBERS ══════════════ */}
        {section === 'members' && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#fff', margin: '0 0 24px', letterSpacing: 0.5 }}>👥 Members</h2>

            <input
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              placeholder="Search by member ID or tier…"
              style={{ width: '100%', background: A.card, border: `1px solid ${A.border}`, borderRadius: 8, padding: '12px 16px', color: '#fff', fontFamily: 'monospace', fontSize: 13, outline: 'none', marginBottom: 20, boxSizing: 'border-box' }}
            />

            {/* Edit modal */}
            {editMember && (
              <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: A.card, border: `1px solid ${A.purple}`, borderRadius: 16, padding: 32, width: 360, maxWidth: '90vw' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: A.purple, marginBottom: 4 }}>EDIT MEMBER</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: A.grey, marginBottom: 20, wordBreak: 'break-all' }}>{editMember.member_id}</div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: A.grey, marginBottom: 6 }}>CREDITS REMAINING</div>
                    <input type="number" value={editCredits} onChange={e => setEditCredits(e.target.value)} style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${A.border}`, borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: 'monospace', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: A.grey, marginBottom: 6 }}>FUND ENTRIES</div>
                    <input type="number" value={editEntries} onChange={e => setEditEntries(e.target.value)} style={{ width: '100%', background: '#0d0d0d', border: `1px solid ${A.border}`, borderRadius: 8, padding: '10px 12px', color: '#fff', fontFamily: 'monospace', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setEditMember(null)} style={{ flex: 1, background: 'transparent', border: `1px solid ${A.border}`, color: A.grey, fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, padding: '12px 0', borderRadius: 8, cursor: 'pointer' }}>CANCEL</button>
                    <button onClick={handleMemberSave} disabled={memberSaving} style={{ flex: 2, background: A.purple, border: 'none', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, padding: '12px 0', borderRadius: 8, cursor: 'pointer' }}>
                      {memberSaving ? 'SAVING…' : 'SAVE CHANGES'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 80px', gap: 0, padding: '10px 20px', borderBottom: `1px solid ${A.border}`, background: A.sidebar }}>
                {['MEMBER ID', 'TIER', 'CREDITS', 'ENTRIES', 'LAST ACTIVE', ''].map(h => (
                  <div key={h} style={{ fontFamily: 'monospace', fontSize: 9, color: A.grey, letterSpacing: 1 }}>{h}</div>
                ))}
              </div>
              {filteredMembers.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: A.grey }}>No members found.</div>
              ) : (
                filteredMembers.map(m => (
                  <div key={m.member_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 80px', gap: 0, padding: '12px 20px', borderBottom: `1px solid ${A.border}`, alignItems: 'center' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ffffff08')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.member_id}</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: m.tier === 'founding' ? A.green : m.tier === 'elite' ? A.green : m.tier === 'premium' ? '#3B82F6' : A.grey, textTransform: 'uppercase' }}>{m.tier}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: A.yellow }}>{m.credits_remaining}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: A.purple }}>{m.entries}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: A.grey }}>{new Date(m.updated_at).toLocaleDateString()}</div>
                    <button onClick={() => openEdit(m)} style={{ background: 'transparent', border: `1px solid ${A.border}`, color: A.grey, fontFamily: 'monospace', fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>EDIT</button>
                  </div>
                ))
              )}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: A.grey, marginTop: 10, textAlign: 'right' }}>{filteredMembers.length} members shown</div>
          </div>
        )}

        {/* ══════════════ SETTINGS ══════════════ */}
        {section === 'settings' && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#fff', margin: '0 0 24px', letterSpacing: 0.5 }}>⚙️ Settings</h2>

            {/* API status */}
            <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: A.grey, marginBottom: 16 }}>API CONNECTION STATUS</div>
              {settings ? (
                [
                  { label: 'Anthropic (Claude)', ok: settings.anthropic },
                  { label: 'Supabase', ok: settings.supabase },
                  { label: 'Admin Secret', ok: settings.adminSecretSet },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${A.border}` }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff' }}>{s.label}</span>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: s.ok ? A.green : A.red, border: `1px solid ${s.ok ? A.green : A.red}`, borderRadius: 999, padding: '2px 12px' }}>
                      {s.ok ? '✓ CONNECTED' : '✗ NOT SET'}
                    </span>
                  </div>
                ))
              ) : <Spinner />}
              {settings && <div style={{ fontFamily: 'monospace', fontSize: 10, color: A.grey, marginTop: 12 }}>Environment: {settings.nodeEnv}</div>}
            </div>

            {/* Rate limits info */}
            <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: A.grey, marginBottom: 16 }}>RATE LIMITS (per member per day)</div>
              {[
                { action: 'content',   limit: 20 },
                { action: 'email',     limit: 10 },
                { action: 'sms',       limit: 10 },
                { action: 'outreach',  limit: 10 },
                { action: 'brain_add', limit: 30 },
              ].map(r => (
                <div key={r.action} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${A.border}` }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff', textTransform: 'capitalize' }}>{r.action}</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: A.yellow }}>{r.limit} / day</span>
                </div>
              ))}
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: A.grey, marginTop: 12 }}>Rate limits are configured in <code style={{ color: A.purple }}>lib/rateLimit.ts</code></div>
            </div>

            {/* Admin password note */}
            <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: A.grey, marginBottom: 12 }}>ADMIN PASSWORD</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: A.grey, lineHeight: 1.8 }}>
                The admin password is set via the <span style={{ color: A.purple }}>ADMIN_SECRET</span> environment variable in Vercel.<br />
                To change it: update the env var in Vercel → Project Settings → Environment Variables, then redeploy.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
