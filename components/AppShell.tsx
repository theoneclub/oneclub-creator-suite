'use client'
import { useState, useEffect, useCallback } from 'react'
import BrainScreen from '@/components/screens/BrainScreen'
import ContentScreen from '@/components/screens/ContentScreen'
import OutreachScreen from '@/components/screens/OutreachScreen'
import EmailScreen from '@/components/screens/EmailScreen'
import SMSScreen from '@/components/screens/SMSScreen'
import { MemberCredits, AvatarSettings, Screen } from '@/types'

const TIERS = {
  starter:  { label: 'STARTER',      color: '#ef4444' },
  premium:  { label: 'PREMIUM',      color: '#3B82F6' },
  elite:    { label: 'ELITE',        color: '#4ade80' },
  founding: { label: 'FOUNDING 500', color: '#4ade80' },
}

const NAV_TABS: { id: Screen; emoji: string; label: string }[] = [
  { id: 'brain',    emoji: '🧠', label: 'BRAIN' },
  { id: 'content',  emoji: '✨', label: 'CONTENT' },
  { id: 'outreach', emoji: '🤝', label: 'OUTREACH' },
  { id: 'email',    emoji: '📧', label: 'EMAIL' },
  { id: 'sms',      emoji: '📱', label: 'SMS' },
]

interface AppShellProps { memberId: string }

export default function AppShell({ memberId }: AppShellProps) {
  const [screen, setScreen] = useState<Screen>('brain')
  const [credits, setCredits] = useState<MemberCredits | null>(null)
  const [avatar, setAvatar] = useState<AvatarSettings>({})
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
    setGlobalCount(Array.isArray(g) ? g.filter((s: {active?: boolean}) => s.active !== false).length : 0)
    setMemberCount(Array.isArray(m) ? m.length : 0)
  }, [memberId])

  useEffect(() => {
    loadCredits()
    loadAvatar()
    loadBrainCounts()
  }, [loadCredits, loadAvatar, loadBrainCounts])

  const tier = credits?.tier ?? 'starter'
  const tierConfig = TIERS[tier as keyof typeof TIERS] ?? TIERS.starter

  const renderScreen = () => {
    switch (screen) {
      case 'brain':    return <BrainScreen memberId={memberId} />
      case 'content':  return <ContentScreen memberId={memberId} avatarSettings={avatar} />
      case 'outreach': return <OutreachScreen memberId={memberId} avatarSettings={avatar} />
      case 'email':    return <EmailScreen memberId={memberId} avatarSettings={avatar} />
      case 'sms':      return <SMSScreen memberId={memberId} avatarSettings={avatar} />
    }
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', maxWidth: 480, margin: '0 auto', position: 'relative', paddingBottom: 70 }}>
      {/* Top bar */}
      <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* ① coin icon */}
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="13" fill="#22c55e"/>
            <circle cx="13" cy="13" r="11" fill="#16a34a"/>
            <text x="13" y="18" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial, sans-serif">1</text>
          </svg>
          <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: 1, fontFamily: "'Bebas Neue', sans-serif" }}>
            <span style={{ color: '#fff' }}>THE </span>
            <span style={{ color: '#4ade80' }}>ONE </span>
            <span style={{ color: '#fff' }}>CLUB</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#FFD700' }}>
              {credits?.credits_remaining ?? '—'} CREDITS
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9CA3AF' }}>
              {credits?.entries ?? '—'} FUND ENTRIES
            </div>
          </div>
        </div>
      </div>

      {/* Tier bar */}
      <div style={{ background: '#111', borderBottom: '1px solid #1f2937', padding: '6px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: tierConfig.color, border: `1px solid ${tierConfig.color}`, padding: '2px 10px', borderRadius: 999 }}>
            {tierConfig.label}
          </span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4ADE80' }}>
          🧠 {globalCount} GLOBAL + {memberCount} PERSONAL
        </div>
      </div>

      {/* Screen content */}
      <div style={{ overflowY: 'auto' }}>
        {renderScreen()}
      </div>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: '#0d0d0d', borderTop: '1px solid #1f2937',
        display: 'flex', zIndex: 200,
      }}>
        {NAV_TABS.map(tab => {
          const isActive = screen === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 2px 6px', background: 'transparent', border: 'none', cursor: 'pointer',
                borderTop: `2px solid ${isActive ? '#4ade80' : 'transparent'}`,
                minHeight: 44,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{tab.emoji}</span>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 9,
                color: isActive ? '#4ade80' : '#9CA3AF',
                marginTop: 2,
                letterSpacing: 0.5,
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
