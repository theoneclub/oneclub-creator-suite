'use client'
import { useState } from 'react'

type Action = {
  id: string
  icon: string
  label: string
  entries: number
  url: string
  active: boolean
}

type Props = {
  actions: Action[]
  bonusUnlocked: boolean
  completedActions: string[]
  drawId: string
  memberId: string
  onClaim: (actionId: string, entriesAwarded: number) => void
}

export default function BonusEntries({ actions, bonusUnlocked, completedActions, drawId, memberId, onClaim }: Props) {
  const [claiming, setClaiming] = useState<string | null>(null)

  const handleClaim = async (action: Action) => {
    if (!bonusUnlocked || completedActions.includes(action.id) || claiming) return
    if (action.url && action.url !== '#') window.open(action.url, '_blank')
    setClaiming(action.id)
    await new Promise(r => setTimeout(r, 1500))
    try {
      const res = await fetch('/api/freedomfund/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, actionId: action.id, drawId }),
      })
      if (res.ok) {
        const data = await res.json()
        onClaim(action.id, data.entriesAwarded)
      }
    } finally {
      setClaiming(null)
    }
  }

  const activeActions = actions.filter(a => a.active)

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#fff', letterSpacing: 1, marginBottom: 16 }}>⚡ EARN BONUS ENTRIES</div>

      {!bonusUnlocked ? (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#6b7280', marginBottom: 8 }}>🔒 BONUS ENTRIES LOCKED</div>
          <div style={{ marginBottom: 16 }}>
            {activeActions.map(action => (
              <div key={action.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1f2937', opacity: 0.4, filter: 'blur(1px)' }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#6b7280' }}>{action.icon} {action.label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#a3f0af' }}>+{action.entries} entries</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>
            Upgrade to Starter or above to earn bonus entries
          </div>
          <a
            href="https://theoneclub.io/pricing"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'block', background: '#fff26a', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, padding: '13px 0', borderRadius: 8, textDecoration: 'none', letterSpacing: 0.5 }}
          >
            UPGRADE NOW →
          </a>
        </div>
      ) : (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' }}>
          {activeActions.map((action, i) => {
            const done = completedActions.includes(action.id)
            const isLoading = claiming === action.id
            return (
              <div key={action.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < activeActions.length - 1 ? '1px solid #1f2937' : 'none', opacity: done ? 0.5 : 1 }}>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: done ? '#6b7280' : '#fff', marginBottom: 2 }}>{action.icon} {action.label}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#a3f0af', letterSpacing: 0.5 }}>+{action.entries} entries</div>
                </div>
                <button
                  onClick={() => handleClaim(action)}
                  disabled={done || !!claiming}
                  style={{
                    background: done ? 'transparent' : isLoading ? '#6b7280' : '#fff26a',
                    color: done ? '#6b7280' : '#000',
                    border: done ? '1px solid #6b7280' : 'none',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 14,
                    padding: '8px 16px',
                    borderRadius: 6,
                    cursor: done || claiming ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: 0.5,
                  }}
                >
                  {done ? '✓ DONE' : isLoading ? '...' : 'CLAIM →'}
                </button>
              </div>
            )
          })}
          <div style={{ padding: '10px 20px', borderTop: '1px solid #1f2937', background: '#0d1117' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6b7280' }}>Actions reset each draw period</div>
          </div>
        </div>
      )}
    </div>
  )
}
