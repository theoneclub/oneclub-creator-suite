'use client'
import { useEffect, useState } from 'react'

type Props = {
  targetDate: string
  label: string
  color?: string
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function CountdownTimer({ targetDate, label, color = '#fff26a' }: Props) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false })

  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0, expired: true }); return }
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    const onBlur = () => clearInterval(id)
    window.addEventListener('blur', onBlur)
    return () => { clearInterval(id); window.removeEventListener('blur', onBlur) }
  }, [targetDate])

  if (t.expired) {
    return (
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#6b7280', letterSpacing: 2, marginBottom: 8 }}>{label}</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#ef4444', letterSpacing: 2 }}>CLOSED</div>
      </div>
    )
  }

  const units = [{ v: t.d, l: 'DAYS' }, { v: t.h, l: 'HRS' }, { v: t.m, l: 'MIN' }, { v: t.s, l: 'SEC' }]

  return (
    <div style={{ textAlign: 'center', marginBottom: 24 }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#6b7280', letterSpacing: 2, marginBottom: 12 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {units.map(({ v, l }) => (
          <div key={l} style={{ background: '#0d1117', border: `1px solid ${color}44`, borderRadius: 8, padding: '10px 14px', minWidth: 58, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, color, lineHeight: 1 }}>{pad(v)}</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#6b7280', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
