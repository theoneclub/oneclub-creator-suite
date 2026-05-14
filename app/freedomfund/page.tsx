'use client'
import { useEffect, useState } from 'react'
import MatrixRain from '@/components/MatrixRain'
import MemberDashboard from '@/components/freedomfund/MemberDashboard'

const TIER_ALIASES: Record<string, string> = {
  'founding 500': 'founding',
  'founding500': 'founding',
  'elite member': 'elite',
  'premium member': 'premium',
  'starter member': 'starter',
}

function normaliseTier(raw: string): string {
  const lower = raw.toLowerCase().trim()
  return TIER_ALIASES[lower] || lower.split(' ')[0]
}

export default function FreedomFundPage() {
  const [memberId, setMemberId] = useState<string | null>(null)
  const [tier, setTier] = useState('starter')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('member_id') ?? params.get('memberspace_member_id')
    const rawTier = params.get('tier') || params.get('plan_name') || ''

    if (id) {
      const t = normaliseTier(rawTier || 'starter')
      sessionStorage.setItem('ff_member_id', id)
      sessionStorage.setItem('ff_tier', t)
      setMemberId(id)
      setTier(t)
    } else {
      const stored = sessionStorage.getItem('ff_member_id')
      const storedTier = sessionStorage.getItem('ff_tier')
      setMemberId(stored)
      if (storedTier) setTier(storedTier)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#a3f0af' }}>LOADING...</div>
      </div>
    )
  }

  if (!memberId) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
        <MatrixRain />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#22c55e" />
              <circle cx="18" cy="18" r="15" fill="#16a34a" />
              <text x="18" y="24" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">1</text>
            </svg>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 2 }}>
              <span style={{ color: '#fff' }}>THE </span>
              <span style={{ color: '#a3f0af' }}>ONE </span>
              <span style={{ color: '#fff' }}>CLUB</span>
            </div>
          </div>

          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: '#fff26a', margin: '0 0 4px', letterSpacing: 1, lineHeight: 1 }}>FREEDOM FUND</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#fff', margin: '0 0 16px', letterSpacing: 0.5 }}>🔒 RESTRICTED ACCESS</div>

          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#6b7280', marginBottom: 36, lineHeight: 1.8 }}>
            Freedom Fund is exclusive to<br />The One Club members.
          </p>

          <a
            href="https://theoneclub.io"
            style={{ display: 'block', background: '#fff26a', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, padding: '15px 0', borderRadius: 999, textDecoration: 'none', marginBottom: 12, letterSpacing: 0.5 }}
          >
            JOIN THE ONE CLUB →
          </a>
          <a
            href="https://theoneclub.io/login"
            style={{ display: 'block', background: 'transparent', border: '1px solid #a3f0af', color: '#a3f0af', fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, padding: '13px 0', borderRadius: 999, textDecoration: 'none' }}
          >
            ALREADY A MEMBER? LOG IN →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      <MemberDashboard memberId={memberId} tier={tier} />
    </div>
  )
}
