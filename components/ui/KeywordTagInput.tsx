'use client'
import { useState } from 'react'

interface KeywordTagInputProps {
  keywords: string[]
  onChange: (keywords: string[]) => void
  placeholder?: string
}

export default function KeywordTagInput({ keywords, onChange, placeholder }: KeywordTagInputProps) {
  const [value, setValue] = useState('')

  const addKeyword = () => {
    const trimmed = value.trim()
    if (!trimmed || keywords.includes(trimmed)) { setValue(''); return }
    onChange([...keywords, trimmed])
    setValue('')
  }

  const removeKeyword = (kw: string) => onChange(keywords.filter(k => k !== kw))

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: keywords.length ? 8 : 0 }}>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }}
          placeholder={placeholder ?? 'Type a keyword, press Enter…'}
          style={{
            flex: 1, background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
            padding: '12px 14px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12, boxSizing: 'border-box',
          }}
        />
        <button
          onClick={addKeyword}
          disabled={!value.trim()}
          style={{
            background: value.trim() ? '#4ade80' : '#1f2937', border: 'none', borderRadius: 10, padding: '0 18px',
            color: value.trim() ? '#000' : '#6b7280', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, cursor: value.trim() ? 'pointer' : 'default',
          }}
        >
          Add
        </button>
      </div>

      {keywords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {keywords.map(kw => (
            <span
              key={kw}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0d2b0d', border: '1px solid #4ade80',
                color: '#4ade80', borderRadius: 999, padding: '5px 6px 5px 12px', fontFamily: "'Space Mono', monospace", fontSize: 11,
              }}
            >
              {kw}
              <button
                onClick={() => removeKeyword(kw)}
                aria-label={`Remove ${kw}`}
                style={{ background: 'transparent', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 4px' }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
