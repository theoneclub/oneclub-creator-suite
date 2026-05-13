'use client'
import Spinner from '@/components/Spinner'

interface OutputCardProps {
  emoji: string
  label: string
  color: string
  content: string | string[]
  loading?: boolean
  onRegen?: () => void
  onCopy?: () => void
  onSave?: () => void
  children?: React.ReactNode
}

export default function OutputCard({
  emoji, label, color, content, loading, onRegen, onCopy, onSave, children
}: OutputCardProps) {
  const text = Array.isArray(content) ? content.join('\n') : content

  return (
    <div
      style={{
        background: '#111', border: `1px solid ${color}`,
        borderRadius: 16, padding: 16, marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color, display: 'flex', alignItems: 'center', gap: 6 }}>
          {emoji} {label}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {onSave && (
            <button onClick={onSave} style={btnStyle('#FFD700')}>⭐</button>
          )}
          {onRegen && (
            <button onClick={onRegen} disabled={loading} style={btnStyle(color)}>
              {loading ? <Spinner size={12} /> : '↻ REGEN'}
            </button>
          )}
          {onCopy && (
            <button onClick={onCopy} style={btnStyle('#9CA3AF')}>📋 COPY</button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#9CA3AF', fontFamily: "'Space Mono', monospace", fontSize: 12, textAlign: 'center', padding: 16 }}>
          <Spinner /> <span style={{ marginLeft: 8 }}>Generating...</span>
        </div>
      ) : (
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: '#fff', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {text}
        </div>
      )}

      {children}
    </div>
  )
}

function btnStyle(color: string): React.CSSProperties {
  return {
    background: 'transparent', border: `1px solid ${color}`, color,
    fontFamily: "'Bebas Neue', sans-serif", fontSize: 11,
    padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4,
  }
}
