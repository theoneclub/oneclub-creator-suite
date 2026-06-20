'use client'
import { MemberCredits, AvatarSettings, Screen } from '@/types'

const TOOLS: { id: Screen; emoji: string; name: string; desc: string; bg: string }[] = [
  { id: 'brain',    emoji: '🧠', name: 'Brain',       desc: 'Add knowledge sources',          bg: 'rgba(34,197,94,0.15)'  },
  { id: 'content',  emoji: '✨', name: 'Content',     desc: 'Hooks, scripts & captions',      bg: 'rgba(255,215,0,0.15)'  },
  { id: 'clone',    emoji: '🎬', name: 'Video Clone', desc: 'Clone any viral video',           bg: 'rgba(59,130,246,0.15)' },
  { id: 'outreach', emoji: '🤝', name: 'Outreach',    desc: 'DM sequences that convert',      bg: 'rgba(168,85,247,0.15)' },
  { id: 'email',    emoji: '📧', name: 'Email',       desc: 'Email sequences for your list',  bg: 'rgba(236,72,153,0.15)' },
  { id: 'sms',      emoji: '📱', name: 'SMS',         desc: 'High-converting text campaigns', bg: 'rgba(249,115,22,0.15)' },
  { id: 'schedule', emoji: '📅', name: 'Scheduler',   desc: 'Auto-post across platforms',     bg: 'rgba(20,184,166,0.15)' },
]

const TIER_COLORS: Record<string, string> = {
  starter: '#ef4444', premium: '#3B82F6', elite: '#22c55e', founding: '#22c55e',
}
const TIER_LABELS: Record<string, string> = {
  starter: 'Starter', premium: 'Premium', elite: 'Elite', founding: 'Founding 500',
}

interface HomeScreenProps {
  credits: MemberCredits | null
  avatar: AvatarSettings
  globalCount: number
  memberCount: number
  onNavigate: (screen: Screen) => void
}

export default function HomeScreen({ credits, avatar, globalCount, memberCount, onNavigate }: HomeScreenProps) {
  const tier      = credits?.tier ?? 'starter'
  const tierColor = TIER_COLORS[tier] ?? '#ef4444'
  const tierLabel = TIER_LABELS[tier] ?? 'Starter'
  const name      = avatar.avatarName ?? 'Creator'

  return (
    <div style={{ padding: '24px 16px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Welcome */}
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Welcome back, {name}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: tierColor, background: `${tierColor}1a`, border: `1px solid ${tierColor}40`, padding: '3px 10px', borderRadius: 999 }}>
          {tierLabel}
        </span>
      </div>

      {/* Credits hero card */}
      <div style={{ background: '#1a1a1a', borderRadius: 16, padding: '20px 20px 0', overflow: 'hidden' }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Credits Remaining</div>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 4 }}>
          {credits?.credits_remaining ?? '—'}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>
          of {credits?.credits_total ?? '—'} total · resets {credits?.reset_date
            ? new Date(credits.reset_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            : 'monthly'}
        </div>

        {/* Progress bar */}
        {credits && (
          <div style={{ height: 3, background: '#2a2a2a', borderRadius: 999, marginBottom: 20 }}>
            <div style={{
              height: '100%',
              width: `${Math.round((credits.credits_remaining / credits.credits_total) * 100)}%`,
              background: '#22c55e',
              borderRadius: 999,
            }} />
          </div>
        )}

        {/* Sub-stats row */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Fund Entries', value: credits?.entries ?? '—' },
            { label: 'Brain Sources', value: globalCount + memberCount },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, padding: '14px 0',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              paddingLeft: i > 0 ? 16 : 0,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick generate button */}
      <button
        onClick={() => onNavigate('content')}
        style={{ width: '100%', padding: '14px 0', background: '#22c55e', color: '#000', border: 'none', borderRadius: 999, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
      >
        + Generate Content
      </button>

      {/* Tools */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          Your Tools
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 14px', borderRadius: 12, width: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: tool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
                {tool.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{tool.name}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{tool.desc}</div>
              </div>
              <span style={{ fontSize: 18, color: '#4b5563', lineHeight: 1 }}>›</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
