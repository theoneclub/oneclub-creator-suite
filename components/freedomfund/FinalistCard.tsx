'use client'
import { useState } from 'react'

type Finalist = {
  id: string
  memberId: string
  memberName: string
  memberTier: string
  ideaTitle: string
  ideaDescription: string
  drawNumber: number
  votePct?: number
}

type Props = {
  finalist: Finalist
  phase: string
  myMemberId: string
  memberId: string
  hasVoted: boolean
  votedForId: string | null
  drawId: string
  onVote: (finalistId: string) => void
  isWinner?: boolean
}

export default function FinalistCard({ finalist, phase, myMemberId, memberId, hasVoted, votedForId, drawId, onVote, isWinner }: Props) {
  const [voting, setVoting] = useState(false)
  const isMe = finalist.memberId === myMemberId
  const myVote = votedForId === finalist.id
  const showResults = phase === 'results' || (hasVoted && phase === 'voting')

  const handleVote = async () => {
    if (voting || hasVoted || isMe) return
    setVoting(true)
    try {
      const res = await fetch('/api/freedomfund/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, drawId, finalistId: finalist.id }),
      })
      if (res.ok) onVote(finalist.id)
    } finally {
      setVoting(false)
    }
  }

  return (
    <div style={{
      background: '#111827',
      border: myVote ? '2px solid #fff26a' : isWinner && phase === 'results' ? '2px solid #fff26a' : '1px solid #1f2937',
      borderRadius: 12,
      padding: 20,
      marginBottom: 12,
      position: 'relative',
    }}>
      {myVote && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: '#fff26a', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>YOUR VOTE ✓</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#fff', letterSpacing: 0.5 }}>{finalist.memberName}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#6b7280', textTransform: 'uppercase' }}>{finalist.memberTier} MEMBER</div>
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#1f2937', background: '#0d1117', padding: '2px 8px', borderRadius: 4 }}>#{finalist.drawNumber}</div>
      </div>

      {finalist.ideaTitle && (
        <>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#a3f0af', letterSpacing: 0.5, marginBottom: 6 }}>{finalist.ideaTitle}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 12 }}>{finalist.ideaDescription}</div>
        </>
      )}

      {showResults && finalist.votePct !== undefined && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6b7280' }}>VOTES</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: myVote ? '#fff26a' : '#fff' }}>{finalist.votePct}%</div>
          </div>
          <div style={{ background: '#0d1117', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ background: myVote ? '#fff26a' : '#a3f0af', height: '100%', width: `${finalist.votePct}%`, transition: 'width 0.8s ease', borderRadius: 4 }} />
          </div>
        </div>
      )}

      {phase === 'voting' && !hasVoted && (
        isMe ? (
          <div style={{ background: '#1f2937', borderRadius: 8, padding: '10px 0', textAlign: 'center', fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#6b7280' }}>🚫 CANNOT SELF-VOTE</div>
        ) : (
          <button
            onClick={handleVote}
            disabled={voting}
            style={{ width: '100%', background: voting ? '#6b7280' : '#fff26a', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, padding: '12px 0', borderRadius: 8, border: 'none', cursor: voting ? 'not-allowed' : 'pointer', letterSpacing: 0.5 }}
          >
            {voting ? 'CASTING VOTE...' : 'VOTE FOR THIS IDEA'}
          </button>
        )
      )}
    </div>
  )
}
