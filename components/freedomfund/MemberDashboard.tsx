'use client'
import { useState, useEffect, useCallback } from 'react'
import CountdownTimer from './CountdownTimer'
import BonusEntries from './BonusEntries'
import FinalistCard from './FinalistCard'
import PastDraws from './PastDraws'

const C = {
  black: '#0a0a0a', card: '#111827', cardDeep: '#0d1117',
  green: '#a3f0af', yellow: '#fff26a', grey: '#6b7280',
  dim: '#1f2937', purple: '#a78bfa', orange: '#fb923c', red: '#ef4444',
}

const PHASES = ['draw', 'submissions', 'voting', 'results']
const PHASE_LABELS = ['DRAW', 'SUBMIT', 'VOTE', 'RESULTS']

type Config = { id: string; drawDate: string; submissionDeadline: string; votingDeadline: string; prizeAmount: number; phase: string; message: string }
type EntryData = { baseEntries: number; bonusEntries: number; totalEntries: number; tier: string; bonusUnlocked: boolean; completedActions: string[]; hasVoted: boolean; votedForId: string | null; drawId: string }
type Finalist = { id: string; memberId: string; memberName: string; memberTier: string; ideaTitle: string; ideaDescription: string; drawNumber: number; votePct?: number }
type Action = { id: string; icon: string; label: string; entries: number; url: string; active: boolean }
type Draw = { id: string; draw_date: string; winner_name: string; winner_tier: string; winner_idea_title: string; winner_idea_description: string; winner_vote_pct: number; prize_amount: number }

export default function MemberDashboard({ memberId, tier: urlTier }: { memberId: string; tier: string }) {
  const [config, setConfig] = useState<Config | null>(null)
  const [entries, setEntries] = useState<EntryData | null>(null)
  const [finalists, setFinalists] = useState<Finalist[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [history, setHistory] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)

  // Submission form
  const [ideaTitle, setIdeaTitle] = useState('')
  const [ideaDesc, setIdeaDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Vote state (local optimistic)
  const [hasVoted, setHasVoted] = useState(false)
  const [votedForId, setVotedForId] = useState<string | null>(null)
  const [completedActions, setCompletedActions] = useState<string[]>([])
  const [bonusEntries, setBonusEntries] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cfgRes, actRes, histRes] = await Promise.all([
        fetch('/api/freedomfund/config'),
        fetch('/api/freedomfund/actions'),
        fetch('/api/freedomfund/history'),
      ])

      const cfg: Config | null = cfgRes.ok ? await cfgRes.json() : null
      const hist: Draw[] = histRes.ok ? await histRes.json() : []
      setConfig(cfg)
      setHistory(hist)

      // Load actions from public endpoint (we expose one)
      const actData = actRes.ok ? await actRes.json() : []
      setActions(actData)

      if (!cfg) return

      const [entRes, finRes] = await Promise.all([
        fetch(`/api/freedomfund/entries?memberId=${memberId}`),
        fetch(`/api/freedomfund/finalists?drawId=${cfg.id}`),
      ])

      if (entRes.ok) {
        const ent: EntryData = await entRes.json()
        setEntries(ent)
        setHasVoted(ent.hasVoted)
        setVotedForId(ent.votedForId)
        setCompletedActions(ent.completedActions)
        setBonusEntries(ent.bonusEntries)
      }
      if (finRes.ok) setFinalists(await finRes.json())
    } finally {
      setLoading(false)
    }
  }, [memberId])

  useEffect(() => { load() }, [load])

  const myFinalist = finalists.find(f => f.memberId === memberId)

  const handleVote = (finalistId: string) => {
    setHasVoted(true)
    setVotedForId(finalistId)
  }

  const handleClaim = (actionId: string, entriesAwarded: number) => {
    setCompletedActions(prev => [...prev, actionId])
    setBonusEntries(prev => prev + entriesAwarded)
  }

  const handleSubmit = async () => {
    if (!myFinalist || !ideaTitle || !entries?.drawId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/freedomfund/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, drawId: entries.drawId, finalistId: myFinalist.id, title: ideaTitle, description: ideaDesc }),
      })
      if (res.ok) setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  const phase = config?.phase || 'draw'
  const phaseIdx = PHASES.indexOf(phase)
  const totalEntries = (entries?.baseEntries || 0) + bonusEntries
  const tier = entries?.tier || urlTier || 'starter'

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: C.green }}>LOADING...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 16px 60px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 16px' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: C.grey, letterSpacing: 2 }}>THE ONE CLUB</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: C.yellow, letterSpacing: 1 }}>FREEDOM FUND</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: C.dim, borderRadius: 6, padding: '4px 10px', marginBottom: 4 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.grey, textTransform: 'uppercase' }}>{tier}</div>
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.yellow }}>{totalEntries} ENTRIES</div>
        </div>
      </div>

      {/* Phase progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28 }}>
        {PHASE_LABELS.map((label, i) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 2, background: i <= phaseIdx ? C.green : C.dim, marginBottom: 4, transition: 'background 0.3s' }} />
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: i <= phaseIdx ? C.green : C.grey, textAlign: 'center', letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>

      {config?.message && (
        <div style={{ background: C.dim, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>
          {config.message}
        </div>
      )}

      {/* Phase: DRAW */}
      {phase === 'draw' && (
        <>
          <CountdownTimer targetDate={config?.drawDate || ''} label="NEXT FREEDOM FUND DRAW" color={C.yellow} />
          <div style={{ background: C.card, border: `1px solid ${C.dim}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#fff', marginBottom: 12, letterSpacing: 0.5 }}>HOW IT WORKS</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF', lineHeight: 1.8, marginBottom: 16 }}>
              5 finalists will be drawn weighted by entries.<br />
              More entries = better odds of being drawn.
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
              <div style={{ flex: 1, background: C.cardDeep, borderRadius: 8, padding: '12px 0', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.yellow }}>{entries?.baseEntries || 0}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.grey }}>BASE</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: C.grey }}>+</div>
              <div style={{ flex: 1, background: C.cardDeep, borderRadius: 8, padding: '12px 0', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.green }}>{bonusEntries}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.grey }}>BONUS</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: C.grey }}>=</div>
              <div style={{ flex: 1, background: C.cardDeep, borderRadius: 8, padding: '12px 0', textAlign: 'center', border: `1px solid ${C.yellow}33` }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.yellow }}>{totalEntries}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: C.grey }}>TOTAL</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Phase: SUBMISSIONS */}
      {phase === 'submissions' && (
        <>
          {myFinalist ? (
            <div style={{ background: C.card, border: `2px solid ${C.yellow}`, borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: `0 0 20px ${C.yellow}22` }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: C.yellow, marginBottom: 4, letterSpacing: 0.5 }}>🎉 YOU&apos;VE BEEN DRAWN!</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 16 }}>
                You&apos;re finalist #{myFinalist.drawNumber}. Submit your idea below — tell members how you&apos;d use ${config?.prizeAmount?.toLocaleString()}.
              </div>
              <CountdownTimer targetDate={config?.submissionDeadline || ''} label="SUBMIT YOUR IDEA BY" color={C.orange} />
              {submitted || myFinalist.ideaTitle ? (
                <div style={{ background: C.cardDeep, border: `1px solid ${C.green}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.green, marginBottom: 4 }}>✅ IDEA SUBMITTED</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.grey }}>Good luck — voting opens soon!</div>
                </div>
              ) : (
                <>
                  <input
                    value={ideaTitle}
                    onChange={e => setIdeaTitle(e.target.value)}
                    placeholder="Your idea title..."
                    maxLength={100}
                    style={{ width: '100%', background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '12px 14px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
                  />
                  <textarea
                    value={ideaDesc}
                    onChange={e => setIdeaDesc(e.target.value)}
                    placeholder="How would you use the $10,000? Be specific and inspiring..."
                    rows={4}
                    maxLength={600}
                    style={{ width: '100%', background: C.cardDeep, border: `1px solid ${C.dim}`, borderRadius: 8, padding: '12px 14px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, marginBottom: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !ideaTitle.trim()}
                    style={{ width: '100%', background: submitting || !ideaTitle.trim() ? C.grey : C.yellow, color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, padding: '14px 0', borderRadius: 8, border: 'none', cursor: submitting || !ideaTitle.trim() ? 'not-allowed' : 'pointer', letterSpacing: 0.5 }}
                  >
                    {submitting ? 'SUBMITTING...' : 'SUBMIT MY IDEA'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <CountdownTimer targetDate={config?.submissionDeadline || ''} label="SUBMISSIONS CLOSE IN" color={C.orange} />
              <div style={{ background: C.card, border: `1px solid ${C.dim}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#fff', marginBottom: 8 }}>5 FINALISTS SELECTED</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.grey, lineHeight: 1.7 }}>
                  Finalists are submitting their ideas now.<br />
                  Voting opens soon — you&apos;ll choose who wins ${config?.prizeAmount?.toLocaleString()}.
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Phase: VOTING */}
      {phase === 'voting' && (
        <>
          <CountdownTimer targetDate={config?.votingDeadline || ''} label="VOTING CLOSES IN" color={C.green} />
          <div style={{ background: C.dim, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.grey, textAlign: 'center', lineHeight: 1.6 }}>
            1 vote per member · No self-voting · Cannot be changed
          </div>
          {hasVoted && (
            <div style={{ background: C.cardDeep, border: `1px solid ${C.green}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, textAlign: 'center', fontFamily: "'Space Mono', monospace", fontSize: 12, color: C.green }}>
              ✓ Vote cast! Results announced when voting closes.
            </div>
          )}
          {finalists.map(f => (
            <FinalistCard
              key={f.id}
              finalist={f}
              phase={phase}
              myMemberId={memberId}
              memberId={memberId}
              hasVoted={hasVoted}
              votedForId={votedForId}
              drawId={entries?.drawId || ''}
              onVote={handleVote}
            />
          ))}
        </>
      )}

      {/* Phase: RESULTS */}
      {phase === 'results' && (() => {
        const winner = finalists.reduce((best, f) => (!best || (f.votePct || 0) > (best.votePct || 0)) ? f : best, finalists[0])
        const sorted = [...finalists].sort((a, b) => (b.votePct || 0) - (a.votePct || 0))
        return (
          <>
            {winner && (
              <div style={{ background: C.card, border: `2px solid ${C.yellow}`, borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: `0 0 30px ${C.yellow}22`, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 4 }}>🏆</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: C.grey, letterSpacing: 2, marginBottom: 8 }}>FREEDOM FUND WINNER — {new Date(config?.drawDate || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: C.yellow, letterSpacing: 0.5, marginBottom: 4 }}>{winner.memberName}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: C.green, marginBottom: 12, letterSpacing: 0.5 }}>{winner.ideaTitle}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 16 }}>{winner.ideaDescription}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#fff', marginBottom: 4 }}>{winner.votePct}% OF VOTES 🎉</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: C.yellow }}>WINS ${config?.prizeAmount?.toLocaleString()}</div>
              </div>
            )}
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#fff', letterSpacing: 0.5, marginBottom: 12 }}>ALL RESULTS</div>
            {sorted.map((f, i) => (
              <FinalistCard key={f.id} finalist={f} phase={phase} myMemberId={memberId} memberId={memberId} hasVoted={hasVoted} votedForId={votedForId} drawId={entries?.drawId || ''} onVote={() => {}} isWinner={i === 0} />
            ))}
          </>
        )
      })()}

      {/* Bonus Entries (always visible) */}
      {actions.length > 0 && (
        <BonusEntries
          actions={actions}
          bonusUnlocked={entries?.bonusUnlocked ?? false}
          completedActions={completedActions}
          drawId={entries?.drawId || ''}
          memberId={memberId}
          onClaim={handleClaim}
        />
      )}

      {/* Past Draws (always visible) */}
      <PastDraws draws={history} />
    </div>
  )
}
