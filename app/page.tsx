'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import MatrixRain from '@/components/MatrixRain'

export default function Home() {
  const [memberId, setMemberId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('member_id') ?? params.get('memberspace_member_id')

    if (id) {
      sessionStorage.setItem('oneclub_member_id', id)
      setMemberId(id)
    } else {
      const stored = sessionStorage.getItem('oneclub_member_id')
      setMemberId(stored)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#39FF14' }}>LOADING...</div>
      </div>
    )
  }

  if (!memberId) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
        <MatrixRain />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#22c55e"/>
              <circle cx="18" cy="18" r="15" fill="#16a34a"/>
              <text x="18" y="24" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">1</text>
            </svg>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2 }}>
              <span style={{ color: '#fff' }}>THE </span>
              <span style={{ color: '#4ade80' }}>ONE </span>
              <span style={{ color: '#fff' }}>CLUB</span>
            </div>
          </div>

          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: '#4ade80', margin: '0 0 12px', letterSpacing: 1, lineHeight: 1 }}>
            MEMBERS ONLY
          </h1>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#6b7280', marginBottom: 36, lineHeight: 1.7 }}>
            This AI Creator Suite is exclusive to<br />The One Club members.
          </p>
          <a
            href="https://theoneclub.io/founding500"
            style={{ display: 'block', background: '#FFD700', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, padding: '15px 0', borderRadius: 999, textDecoration: 'none', marginBottom: 12, letterSpacing: 0.5 }}
          >
            JOIN THE ONE CLUB →
          </a>
          <a
            href="https://theoneclub.io/login"
            style={{ display: 'block', background: 'transparent', border: '1px solid #4ade80', color: '#4ade80', fontFamily: "'Bebas Neue', sans-serif", fontSize: 17, padding: '13px 0', borderRadius: 999, textDecoration: 'none' }}
          >
            ALREADY A MEMBER? LOG IN →
          </a>
        </div>
      </div>
    )
  }

  return <AppShell memberId={memberId} />
}
