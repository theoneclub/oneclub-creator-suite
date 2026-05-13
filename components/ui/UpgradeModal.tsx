'use client'

interface UpgradeModalProps {
  onClose: () => void
}

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9000, padding: 20,
      }}
    >
      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 20, padding: 28, maxWidth: 360, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#22c55e"/>
              <circle cx="14" cy="14" r="12" fill="#16a34a"/>
              <text x="14" y="19" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">1</text>
            </svg>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1 }}>
              <span style={{ color: '#fff' }}>THE </span>
              <span style={{ color: '#4ade80' }}>ONE </span>
              <span style={{ color: '#fff' }}>CLUB</span>
            </span>
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, color: '#4ade80', margin: '0 0 6px' }}>
            OUT OF CREDITS
          </h2>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>
            You&apos;ve used all your credits this month.<br />Upgrade to keep creating.
          </p>
        </div>

        {/* Tier cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {/* Premium */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e2a4a 100%)', border: '1px solid #3B82F6', borderRadius: 14, padding: '14px 16px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#4ade80', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, padding: '2px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
              MOST POPULAR
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#60a5fa' }}>Premium</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6b7280', margin: '2px 0 8px' }}>Advanced Plan</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#fff', lineHeight: 1 }}>$97<span style={{ fontSize: 14, color: '#6b7280' }}>/mo</span></div>
            <ul style={{ margin: '10px 0 12px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['20 Freedom Fund Entries', '500 AI Credits/month', 'Access to AI Creator Tools', 'Affiliate Program', 'Recurring Income'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#e5e7eb' }}>
                  <span style={{ color: '#4ade80', fontSize: 14 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <a href="https://theoneclub.io/upgrade" target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(90deg, #38bdf8, #3B82F6)', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, padding: '11px 0', borderRadius: 999, textDecoration: 'none' }}>
              JOIN NOW →
            </a>
          </div>

          {/* Elite */}
          <div style={{ background: '#111', border: '1px solid #22c55e', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#4ade80' }}>Elite</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#6b7280', margin: '2px 0 8px' }}>Top-tier Plan</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#fff', lineHeight: 1 }}>$497<span style={{ fontSize: 14, color: '#6b7280' }}>/mo</span></div>
            <ul style={{ margin: '10px 0 12px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['50 Freedom Fund Entries', '2,000 AI Credits/month', 'Access to AI Creator Tools', 'Affiliate Program + Bonus Earnings', 'VIP Giveaways', 'Recurring Income'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#e5e7eb' }}>
                  <span style={{ color: '#4ade80', fontSize: 14 }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <a href="https://theoneclub.io/upgrade" target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(90deg, #4ade80, #22c55e)', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, padding: '11px 0', borderRadius: 999, textDecoration: 'none' }}>
              JOIN NOW →
            </a>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#4b5563', fontFamily: "'Space Mono', monospace", fontSize: 11, cursor: 'pointer', paddingTop: 4 }}
        >
          maybe later
        </button>
      </div>
    </div>
  )
}
