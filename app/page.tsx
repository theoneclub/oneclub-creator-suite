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
      <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="20" fill="#22c55e" />
          <circle cx="20" cy="20" r="17" fill="#16a34a" />
          <text x="20" y="27" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial,sans-serif">1</text>
        </svg>
        <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: '#6b7280' }}>Loading…</div>
      </div>
    )
  }

  if (!memberId) {
    return (
      <div style={{ background: '#0a0a0a', minHeight: '100vh', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative', overflow: 'hidden' }}>
        <MatrixRain />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 }}>
            <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
              <circle cx="21" cy="21" r="21" fill="#22c55e" />
              <circle cx="21" cy="21" r="18" fill="#16a34a" />
              <text x="21" y="28" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial,sans-serif">1</text>
            </svg>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, letterSpacing: 2 }}>
              <span style={{ color: '#fff' }}>THE </span>
              <span style={{ color: '#22c55e' }}>ONE </span>
              <span style={{ color: '#fff' }}>CLUB</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px 24px', marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 38, color: '#22c55e', margin: '0 0 12px', letterSpacing: 1, lineHeight: 1 }}>
              MEMBERS ONLY
            </h1>
            <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.7 }}>
              The AI Creator Suite is exclusive<br />to The One Club members.
            </p>
          </div>

          <a
            href="https://theoneclub.io/founding500"
            style={{ display: 'block', background: '#22c55e', color: '#000', fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, fontWeight: 900, padding: '15px 0', borderRadius: 999, textDecoration: 'none', marginBottom: 12, letterSpacing: 0.5 }}
          >
            JOIN THE ONE CLUB →
          </a>
          <a
            href="https://theoneclub.io/login"
            style={{ display: 'block', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'system-ui,sans-serif', fontSize: 15, fontWeight: 600, padding: '14px 0', borderRadius: 999, textDecoration: 'none' }}
          >
            Already a member? Log in →
          </a>
        </div>
      </div>
    )
  }

  return <AppShell memberId={memberId} />
}
