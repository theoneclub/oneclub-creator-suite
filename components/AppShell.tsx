'use client'
import { useState, useEffect, useCallback } from 'react'
import BrainScreen from '@/components/screens/BrainScreen'
import ContentScreen from '@/components/screens/ContentScreen'
import VideoCloneScreen from '@/components/screens/VideoCloneScreen'
import OutreachScreen from '@/components/screens/OutreachScreen'
import EmailScreen from '@/components/screens/EmailScreen'
import SMSScreen from '@/components/screens/SMSScreen'
import SchedulerScreen from '@/components/screens/SchedulerScreen'
import HomeScreen from '@/components/screens/HomeScreen'
import { MemberCredits, AvatarSettings, Screen } from '@/types'

const C = {
  bg:      '#0d0d0d',
  sidebar: '#111111',
  card:    '#1a1a1a',
  border:  'rgba(255,255,255,0.06)',
  green:   '#22c55e',
  textPri: '#ffffff',
  textSec: '#9CA3AF',
  textMut: '#6b7280',
}

const TIERS: Record<string, { label: string; color: string }> = {
  starter:  { label: 'STARTER',      color: '#ef4444' },
  premium:  { label: 'PREMIUM',      color: '#3B82F6' },
  elite:    { label: 'ELITE',        color: C.green   },
  founding: { label: 'FOUNDING 500', color: C.green   },
}

const NAV_MAIN: { id: Screen; emoji: string; label: string }[] = [
  { id: 'home',     emoji: '🏠', label: 'Home'        },
  { id: 'brain',    emoji: '🧠', label: 'Brain'       },
  { id: 'content',  emoji: '✨', label: 'Content'     },
  { id: 'clone',    emoji: '🎬', label: 'Video Clone' },
]

const NAV_TOOLS: { id: Screen; emoji: string; label: string }[] = [
  { id: 'outreach', emoji: '🤝', label: 'Outreach'  },
  { id: 'email',    emoji: '📧', label: 'Email'     },
  { id: 'sms',      emoji: '📱', label: 'SMS'       },
  { id: 'schedule', emoji: '📅', label: 'Scheduler' },
]


const PAGE_TITLES: Record<Screen, string> = {
  home: 'Home', brain: 'Brain', content: 'Content', clone: 'Video Clone',
  outreach: 'Outreach', email: 'Email', sms: 'SMS', schedule: 'Scheduler',
}

interface AppShellProps { memberId: string }

export default function AppShell({ memberId }: AppShellProps) {
  const [screen, setScreen]           = useState<Screen>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [credits, setCredits]         = useState<MemberCredits | null>(null)
  const [avatar, setAvatar]           = useState<AvatarSettings>({})
  const [globalCount, setGlobalCount] = useState(0)
  const [memberCount, setMemberCount] = useState(0)

  const loadCredits = useCallback(async () => {
    const res = await fetch(`/api/credits?memberId=${memberId}`)
    if (res.ok) setCredits(await res.json())
  }, [memberId])

  const loadAvatar = useCallback(async () => {
    const res = await fetch(`/api/avatar?memberId=${memberId}`)
    if (res.ok) setAvatar(await res.json())
  }, [memberId])

  const loadBrainCounts = useCallback(async () => {
    const [g, m] = await Promise.all([
      fetch('/api/brain/global').then(r => r.json()),
      fetch(`/api/brain/member?memberId=${memberId}`).then(r => r.json()),
    ])
    setGlobalCount(Array.isArray(g) ? g.filter((s: { active?: boolean }) => s.active !== false).length : 0)
    setMemberCount(Array.isArray(m) ? m.length : 0)
  }, [memberId])

  useEffect(() => {
    loadCredits(); loadAvatar(); loadBrainCounts()
  }, [loadCredits, loadAvatar, loadBrainCounts])

  const tier       = credits?.tier ?? 'starter'
  const tierConfig = TIERS[tier] ?? TIERS.starter

  const navigate = (s: Screen) => { setScreen(s); setSidebarOpen(false) }

  const renderScreen = () => {
    switch (screen) {
      case 'home':     return <HomeScreen credits={credits} avatar={avatar} globalCount={globalCount} memberCount={memberCount} onNavigate={navigate} />
      case 'brain':    return <BrainScreen memberId={memberId} />
      case 'content':  return <ContentScreen memberId={memberId} avatarSettings={avatar} />
      case 'clone':    return <VideoCloneScreen memberId={memberId} />
      case 'outreach': return <OutreachScreen memberId={memberId} avatarSettings={avatar} />
      case 'email':    return <EmailScreen memberId={memberId} avatarSettings={avatar} />
      case 'sms':      return <SMSScreen memberId={memberId} avatarSettings={avatar} />
      case 'schedule': return <SchedulerScreen memberId={memberId} avatarSettings={avatar} />
    }
  }

  // Reusable nav button
  const NavBtn = ({ item }: { item: { id: Screen; emoji: string; label: string } }) => {
    const active = screen === item.id
    return (
      <button
        onClick={() => navigate(item.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', borderRadius: 10, width: '100%',
          background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1, width: 24, textAlign: 'center' }}>{item.emoji}</span>
        <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? C.textPri : C.textSec }}>
          {item.label}
        </span>
      </button>
    )
  }

  const initials = (avatar.avatarName ?? 'C').charAt(0).toUpperCase()

  return (
    <div style={{ background: C.bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative', fontFamily: 'system-ui,-apple-system,BlinkMacSystemFont,sans-serif' }}>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        position: 'fixed', top: 0, left: sidebarOpen ? 0 : -280,
        width: 260, height: '100%',
        background: C.sidebar,
        zIndex: 400,
        display: 'flex', flexDirection: 'column',
        transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
        overflowY: 'auto',
      }}>

        {/* Logo row */}
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#22c55e" />
              <circle cx="14" cy="14" r="11" fill="#16a34a" />
              <text x="14" y="19" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial,sans-serif">1</text>
            </svg>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 1.5, color: C.textPri }}>
              THE <span style={{ color: C.green }}>ONE</span> CLUB
            </span>
          </div>
          {/* Collapse btn */}
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3" width="14" height="2" rx="1" fill="#6b7280" />
              <rect x="2" y="8" width="10" height="2" rx="1" fill="#6b7280" />
              <rect x="2" y="13" width="14" height="2" rx="1" fill="#6b7280" />
            </svg>
          </button>
        </div>

        {/* Main nav */}
        <nav style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV_MAIN.map(item => <NavBtn key={item.id} item={item} />)}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: C.border, margin: '10px 16px' }} />

        {/* Tools nav */}
        <nav style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          {NAV_TOOLS.map(item => <NavBtn key={item.id} item={item} />)}
        </nav>

        {/* New Post btn */}
        <div style={{ padding: '12px 16px' }}>
          <button
            onClick={() => navigate('content')}
            style={{ width: '100%', padding: '12px 0', background: '#fff', color: '#000', border: 'none', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            + Generate Content
          </button>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10, width: '100%' }}>
            <span style={{ fontSize: 16 }}>🛠️</span>
            <span style={{ fontSize: 13, color: C.textSec }}>Settings</span>
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 10, width: '100%' }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span style={{ fontSize: 13, color: C.textSec }}>Ask Morphe</span>
          </button>
        </div>

        {/* User profile row */}
        <div style={{ padding: '12px 16px 20px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#22c55e,#16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#000', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textPri }}>{avatar.avatarName ?? 'Creator'}</div>
              <div style={{ fontSize: 11, color: C.textMut }}>@{(avatar.avatarName ?? 'creator').toLowerCase()}</div>
            </div>
          </div>
          <span style={{ fontSize: 18, color: C.textMut }}>⋯</span>
        </div>
      </aside>

      {/* ── Top bar ── */}
      <header style={{
        height: 54, background: C.sidebar, borderBottom: `1px solid ${C.border}`,
        padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Menu"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', gap: 5 }}
          >
            <div style={{ width: 20, height: 2, background: C.textPri, borderRadius: 2 }} />
            <div style={{ width: 14, height: 2, background: C.textSec, borderRadius: 2 }} />
            <div style={{ width: 20, height: 2, background: C.textPri, borderRadius: 2 }} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, color: C.textPri }}>{PAGE_TITLES[screen]}</span>
        </div>

        {/* Right side: tier badge + credits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: tierConfig.color, background: `${tierConfig.color}1a`, border: `1px solid ${tierConfig.color}40`, padding: '3px 8px', borderRadius: 999 }}>
            {tierConfig.label}
          </span>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.green }}>
            {credits?.credits_remaining ?? '—'} cr
          </span>
        </div>
      </header>

      {/* ── Screen ── */}
      <main style={{ minHeight: 'calc(100vh - 54px)' }}>
        {renderScreen()}
      </main>

    </div>
  )
}
