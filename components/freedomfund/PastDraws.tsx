'use client'

type Draw = {
  id: string
  draw_date: string
  winner_name: string
  winner_tier: string
  winner_idea_title: string
  winner_idea_description: string
  winner_vote_pct: number
  prize_amount: number
}

export default function PastDraws({ draws }: { draws: Draw[] }) {
  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#fff', letterSpacing: 1, marginBottom: 16 }}>🏛 PAST DRAWS</div>
      {!draws.length ? (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24, textAlign: 'center', fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#6b7280' }}>
          No past draws yet — be the first winner!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {draws.map(d => {
            const date = new Date(d.draw_date)
            const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            return (
              <div key={d.id} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#a3f0af', letterSpacing: 0.5 }}>WINS ${d.prize_amount?.toLocaleString()}</div>
                </div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#fff26a', marginBottom: 4 }}>{d.winner_name}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6b7280', marginBottom: 6 }}>{d.winner_tier?.toUpperCase()} MEMBER</div>
                {d.winner_idea_title && (
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: '#a3f0af', letterSpacing: 0.5 }}>{d.winner_idea_title}</div>
                )}
                {d.winner_vote_pct > 0 && (
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6b7280', marginTop: 6 }}>{d.winner_vote_pct}% OF VOTES 🎉</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
