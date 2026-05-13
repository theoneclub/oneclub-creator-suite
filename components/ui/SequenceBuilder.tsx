'use client'
import Spinner from '@/components/Spinner'

export interface SequenceItem {
  body: string
  purpose: string
  sendDelay?: string
  personalisationNotes?: string
  subject?: string
  preview?: string
  cta?: string
  sendDay?: string
  charCount?: number
  approved: boolean
}

interface SequenceBuilderProps {
  items: SequenceItem[]
  currentIndex: number
  loading: boolean
  onEdit: (index: number, field: string, value: string) => void
  onRegen: (index: number) => void
  onApprove: (index: number) => void
  type: 'email' | 'sms' | 'outreach'
}

export default function SequenceBuilder({
  items, currentIndex, loading, onEdit, onRegen, onApprove, type
}: SequenceBuilderProps) {
  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 6, borderRadius: 3,
              background: item.approved ? '#4ade80' : i === currentIndex ? '#FFD700' : '#1f2937',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {items.map((item, i) => {
        const isActive = i === currentIndex
        const isApproved = item.approved

        return (
          <div
            key={i}
            style={{
              background: '#111', border: `1px solid ${isApproved ? '#4ade80' : isActive ? '#FFD700' : '#1f2937'}`,
              borderRadius: 16, padding: 16, marginBottom: 12,
              opacity: !isActive && !isApproved ? 0.4 : 1,
              transition: 'all 0.3s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: isApproved ? '#4ade80' : '#FFD700' }}>
                {type === 'email' ? `EMAIL ${i + 1}` : type === 'sms' ? `MESSAGE ${i + 1}` : `MESSAGE ${i + 1}`}
                {item.purpose && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#9CA3AF', fontFamily: "'Space Mono', monospace", textTransform: 'none' }}>
                    {item.purpose}
                  </span>
                )}
              </div>
              {isApproved && (
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#4ade80' }}>✓ APPROVED</span>
              )}
            </div>

            {isActive && !isApproved && (
              <>
                {type === 'email' && (
                  <>
                    <input
                      value={item.subject ?? ''}
                      onChange={e => onEdit(i, 'subject', e.target.value)}
                      placeholder="Subject line..."
                      style={inputStyle}
                    />
                    <div style={{ position: 'relative' }}>
                      <input
                        value={item.preview ?? ''}
                        onChange={e => onEdit(i, 'preview', e.target.value)}
                        placeholder="Preview text (40 chars)..."
                        maxLength={40}
                        style={inputStyle}
                      />
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>
                        {(item.preview ?? '').length}/40
                      </span>
                    </div>
                  </>
                )}

                {loading ? (
                  <div style={{ textAlign: 'center', padding: 24, color: '#9CA3AF', fontFamily: 'monospace', fontSize: 12 }}>
                    <Spinner /> <span style={{ marginLeft: 8 }}>Generating...</span>
                  </div>
                ) : (
                  <textarea
                    value={item.body}
                    onChange={e => onEdit(i, 'body', e.target.value)}
                    rows={type === 'sms' ? 3 : 8}
                    style={{ ...inputStyle, resize: 'vertical', height: 'auto' }}
                  />
                )}

                {type === 'email' && (
                  <>
                    <input
                      value={item.cta ?? ''}
                      onChange={e => onEdit(i, 'cta', e.target.value)}
                      placeholder="CTA text..."
                      style={inputStyle}
                    />
                    {item.purpose && (
                      <div style={{ background: '#1a0a2e', border: '1px solid #A855F7', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#A855F7' }}>🎯 THIS EMAIL&apos;S JOB: {item.purpose}</span>
                      </div>
                    )}
                    {item.sendDay && (
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>📅 {item.sendDay}</div>
                    )}
                  </>
                )}

                {type === 'sms' && (
                  <>
                    <div style={{
                      fontFamily: 'monospace', fontSize: 12, textAlign: 'right',
                      color: (item.charCount ?? 0) > 155 ? '#EF4444' : (item.charCount ?? 0) > 130 ? '#FFD700' : '#4ade80',
                    }}>
                      {item.charCount ?? 0}/160
                    </div>
                    {item.sendDay && (
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>📅 {item.sendDay}</div>
                    )}
                    {i === 0 && (
                      <div style={{ background: '#0d2b0d', border: '1px solid #4ade80', borderRadius: 8, padding: '6px 10px', marginTop: 6, fontFamily: 'monospace', fontSize: 10, color: '#4ADE80' }}>
                        ⚠️ Message 1 must include opt-out: &quot;Reply STOP to unsubscribe&quot;
                      </div>
                    )}
                  </>
                )}

                {type === 'outreach' && item.personalisationNotes && (
                  <div style={{ background: '#1a0a2e', border: '1px solid #A855F7', borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#A855F7' }}>🎯 PERSONALISATION NOTES</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{item.personalisationNotes}</div>
                  </div>
                )}
                {type === 'outreach' && item.sendDelay && (
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>⏱ {item.sendDelay}</div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => onRegen(i)} disabled={loading} style={regenBtn}>
                    {loading ? <Spinner size={12} /> : '↺ REGENERATE'}
                  </button>
                  <button onClick={() => onApprove(i)} disabled={loading || !item.body} style={approveBtn}>
                    ✓ APPROVE & BUILD NEXT →
                  </button>
                </div>
              </>
            )}

            {isApproved && (
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#9CA3AF', whiteSpace: 'pre-wrap' }}>
                {type === 'email' && item.subject && <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>{item.subject}</div>}
                {item.body.slice(0, 120)}{item.body.length > 120 ? '...' : ''}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d0d0d', border: '1px solid #1f2937',
  borderRadius: 8, padding: '8px 10px', color: '#fff',
  fontFamily: "'Space Mono', monospace", fontSize: 12,
  marginBottom: 8, boxSizing: 'border-box',
}

const regenBtn: React.CSSProperties = {
  flex: 1, background: 'transparent', border: '1px solid #4ade80', color: '#4ade80',
  fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, padding: '10px 0',
  borderRadius: 8, cursor: 'pointer',
}

const approveBtn: React.CSSProperties = {
  flex: 2, background: '#FFD700', border: 'none', color: '#000',
  fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, padding: '10px 0',
  borderRadius: 8, cursor: 'pointer',
}
