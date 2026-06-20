'use client'
import { useState, useEffect, useCallback } from 'react'
import Spinner from '@/components/Spinner'
import Toast from '@/components/Toast'
import { AvatarSettings, SchedulerSettings, ScheduledPost, BufferChannel, ScheduleAngle } from '@/types'

interface SchedulerScreenProps {
  memberId: string
  avatarSettings: AvatarSettings
}

type PlatformKey = 'instagram' | 'facebook' | 'twitter' | 'threads'
type PostTab = 'script' | 'twitter' | 'threads' | 'facebook' | 'instagram'

const PLATFORM_ICONS: Record<PlatformKey, string> = {
  instagram: '📸',
  facebook: '👥',
  twitter: '𝕏',
  threads: '🧵',
}

const ANGLE_CONFIG: Record<ScheduleAngle, { emoji: string; label: string; color: string; time: string }> = {
  pain:  { emoji: '😤', label: 'PAIN',  color: '#F97316', time: '8:00 AM' },
  prize: { emoji: '🏆', label: 'PRIZE', color: '#4ade80', time: '1:00 PM' },
  news:  { emoji: '📡', label: 'NEWS',  color: '#3B82F6', time: '7:00 PM' },
}

const ANGLES: ScheduleAngle[] = ['pain', 'prize', 'news']

interface GeneratedPost {
  id: string
  angle: ScheduleAngle
  topic: string
  shortFormScript: string
  twitterPost: string
  threadsPost: string
  facebookPost: string
  instagramCaption: string
  newsSource?: string
  scheduled?: boolean
  bufferPostIds?: Record<string, string>
}

function AestClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4ade80' }}>{time} AEST</span>
}

function XCharCounter({ text }: { text: string }) {
  const len = text.length
  const color = len > 270 ? '#ef4444' : len > 240 ? '#F97316' : '#4ade80'
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 10, color, textAlign: 'right', marginTop: 4 }}>
      {len}/280
    </div>
  )
}

function PostCard({
  post,
  onRegen,
  onSchedule,
  onUpdate,
  scheduling,
}: {
  post: GeneratedPost
  onRegen: () => void
  onSchedule: () => void
  onUpdate: (field: string, value: string) => void
  scheduling: boolean
}) {
  const [tab, setTab] = useState<PostTab>('script')
  const cfg = ANGLE_CONFIG[post.angle]
  const [editing, setEditing] = useState(false)

  const tabs: { id: PostTab; label: string }[] = [
    { id: 'script',    label: 'SHORT FORM' },
    { id: 'twitter',   label: '𝕏' },
    { id: 'threads',   label: 'THREADS' },
    { id: 'facebook',  label: 'FACEBOOK' },
    { id: 'instagram', label: 'INSTAGRAM' },
  ]

  const contentMap: Record<PostTab, string> = {
    script:    post.shortFormScript,
    twitter:   post.twitterPost,
    threads:   post.threadsPost,
    facebook:  post.facebookPost,
    instagram: post.instagramCaption,
  }

  const fieldMap: Record<PostTab, string> = {
    script:    'shortFormScript',
    twitter:   'twitterPost',
    threads:   'threadsPost',
    facebook:  'facebookPost',
    instagram: 'instagramCaption',
  }

  const currentContent = contentMap[tab]

  const copy = () => {
    navigator.clipboard.writeText(currentContent)
  }

  return (
    <div style={{ border: `1px solid ${cfg.color}`, borderRadius: 16, marginBottom: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: cfg.color + '22', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{cfg.emoji}</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: cfg.color }}>{cfg.label}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, background: '#161616', color: '#9CA3AF', padding: '2px 8px', borderRadius: 999 }}>{cfg.time}</span>
          {post.scheduled && (
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, background: '#4ade80', color: '#000', padding: '2px 8px', borderRadius: 999 }}>
              SCHEDULED
            </span>
          )}
          {post.angle === 'news' && !post.scheduled && (
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 9, background: '#3B82F6', color: '#fff', padding: '2px 8px', borderRadius: 999, animation: 'pulse 2s infinite' }}>
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Topic */}
      <div style={{ padding: '8px 14px', background: '#0f0f0f', fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>
        {post.topic}
      </div>

      {/* Platform tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === t.id ? cfg.color : 'transparent'}`,
              color: tab === t.id ? cfg.color : '#9CA3AF',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 11,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 14, background: '#0f0f0f' }}>
        {editing ? (
          <textarea
            value={currentContent}
            onChange={e => onUpdate(fieldMap[tab], e.target.value)}
            style={{
              width: '100%',
              background: '#161616',
              border: `1px solid ${cfg.color}`,
              borderRadius: 8,
              padding: 10,
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: 12,
              minHeight: 120,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#e5e7eb', whiteSpace: 'pre-wrap', lineHeight: 1.6, minHeight: 80 }}>
            {currentContent}
          </div>
        )}
        {tab === 'twitter' && <XCharCounter text={currentContent} />}
        {post.newsSource && tab === 'script' && (
          <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 10, color: '#3B82F6' }}>
            Source: {post.newsSource}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '10px 14px', background: '#0a0a0a', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={onRegen}
          style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, borderRadius: 8, cursor: 'pointer' }}
        >
          ↻ REGEN
        </button>
        <button
          onClick={() => setEditing(!editing)}
          style={{ padding: '6px 12px', background: 'transparent', border: `1px solid ${editing ? cfg.color : '#1f2937'}`, color: editing ? cfg.color : '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, borderRadius: 8, cursor: 'pointer' }}
        >
          {editing ? '✓ DONE' : '✏️ EDIT'}
        </button>
        <button
          onClick={copy}
          style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, borderRadius: 8, cursor: 'pointer' }}
        >
          📋 COPY
        </button>
        {!post.scheduled && (
          <button
            onClick={onSchedule}
            disabled={scheduling}
            style={{
              marginLeft: 'auto',
              padding: '6px 16px',
              background: scheduling ? '#1f2937' : '#FFD700',
              border: 'none',
              color: '#000',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 13,
              borderRadius: 8,
              cursor: scheduling ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {scheduling ? <><Spinner size={12} /> SCHEDULING...</> : '✓ APPROVE & SCHEDULE →'}
          </button>
        )}
        {post.scheduled && post.bufferPostIds && (
          <div style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 9, color: '#4ade80', display: 'flex', alignItems: 'center' }}>
            ✓ In Buffer queue
          </div>
        )}
      </div>
    </div>
  )
}

export default function SchedulerScreen({ memberId, avatarSettings }: SchedulerScreenProps) {
  const [settings, setSettings] = useState<SchedulerSettings | null>(null)
  const [channels, setChannels] = useState<BufferChannel[]>([])
  const [posts, setPosts] = useState<Partial<Record<ScheduleAngle, GeneratedPost>>>({})
  const [generating, setGenerating] = useState<Partial<Record<ScheduleAngle, boolean>>>({})
  const [scheduling, setScheduling] = useState<Partial<Record<ScheduleAngle, boolean>>>({})
  const [history, setHistory] = useState<ScheduledPost[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)

  const loadSettings = useCallback(async () => {
    const res = await fetch(`/api/scheduler/settings?memberId=${memberId}`)
    if (res.ok) setSettings(await res.json())
  }, [memberId])

  const loadChannels = useCallback(async () => {
    const res = await fetch('/api/scheduler/channels')
    if (res.ok) setChannels(await res.json())
  }, [])

  const loadHistory = useCallback(async () => {
    const res = await fetch(`/api/scheduler/history?memberId=${memberId}`)
    if (res.ok) setHistory(await res.json())
  }, [memberId])

  useEffect(() => {
    loadSettings()
    loadChannels()
    loadHistory()
  }, [loadSettings, loadChannels, loadHistory])

  const saveSettings = async (updated: SchedulerSettings) => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/scheduler/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, ...updated }),
      })
      if (res.ok) {
        setSettings(updated)
        setToast({ msg: '✓ Settings saved', type: 'success' })
      }
    } finally {
      setSavingSettings(false)
    }
  }

  const generatePost = async (angle: ScheduleAngle) => {
    setGenerating(prev => ({ ...prev, [angle]: true }))
    try {
      const res = await fetch('/api/scheduler/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, angle, avatarSettings, useBrandBrain: settings?.use_brand_brain ?? true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ msg: data.error ?? 'Generation failed', type: 'error' })
        return
      }
      setPosts(prev => ({ ...prev, [angle]: data.post }))
    } catch {
      setToast({ msg: 'Generation failed', type: 'error' })
    } finally {
      setGenerating(prev => ({ ...prev, [angle]: false }))
    }
  }

  const generateAll = async () => {
    setLoadingAll(true)
    for (const angle of ANGLES) {
      await generatePost(angle)
    }
    setLoadingAll(false)
  }

  const schedulePost = async (angle: ScheduleAngle) => {
    const post = posts[angle]
    if (!post || !settings) return

    setScheduling(prev => ({ ...prev, [angle]: true }))
    try {
      const cfg = ANGLE_CONFIG[angle]
      const [hours] = cfg.time.split(':').map(Number)

      // Build scheduled time for today at the angle's hour in AEST
      const now = new Date()
      const aestStr = now.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' })
      const scheduledFor = `${aestStr}T${String(hours).padStart(2, '0')}:00:00+10:00`

      const enabledPlatforms = Object.entries(settings.platforms)
        .filter(([, v]) => v)
        .map(([k]) => k)

      const res = await fetch('/api/scheduler/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, memberId, platforms: enabledPlatforms, scheduledFor }),
      })
      const data = await res.json()

      if (data.success) {
        setPosts(prev => ({
          ...prev,
          [angle]: { ...prev[angle]!, scheduled: true, bufferPostIds: data.bufferPostIds },
        }))
        setToast({ msg: `✓ ${angle.toUpperCase()} post scheduled to Buffer!`, type: 'success' })
        loadHistory()
      } else {
        setToast({ msg: 'Scheduling failed — check Buffer connection', type: 'error' })
      }
    } catch {
      setToast({ msg: 'Scheduling failed', type: 'error' })
    } finally {
      setScheduling(prev => ({ ...prev, [angle]: false }))
    }
  }

  const updatePostField = (angle: ScheduleAngle, field: string, value: string) => {
    setPosts(prev => ({
      ...prev,
      [angle]: { ...prev[angle]!, [field]: value },
    }))
  }

  const toggleEnabled = () => {
    if (!settings) return
    const updated = { ...settings, enabled: !settings.enabled }
    saveSettings(updated)
  }

  const togglePlatform = (platform: PlatformKey) => {
    if (!settings) return
    const updated = {
      ...settings,
      platforms: { ...settings.platforms, [platform]: !settings.platforms[platform] },
    }
    saveSettings(updated)
  }

  const bufferConnected = channels.length > 0

  return (
    <div style={{ paddingBottom: 20 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      

      <div style={{ padding: '0 16px' }}>
        {/* Auto Mode Card */}
        <div style={{ background: '#161616', border: `1px solid ${settings?.enabled ? '#4ade80' : '#1f2937'}`, borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: settings?.enabled ? '0 0 12px #4ade8033' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#fff' }}>AUTO MODE</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                {settings?.enabled
                  ? 'Generating and posting automatically every day'
                  : 'Enable to post 3x daily without touching it'}
              </div>
            </div>
            <button
              onClick={toggleEnabled}
              disabled={savingSettings}
              style={{
                width: 56,
                height: 30,
                borderRadius: 999,
                background: settings?.enabled ? '#4ade80' : '#374151',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: 3,
                left: settings?.enabled ? 29 : 3,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Schedule grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ANGLES.map(angle => {
              const cfg = ANGLE_CONFIG[angle]
              return (
                <div key={angle} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#0f0f0f', borderRadius: 10 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#9CA3AF', width: 56, flexShrink: 0 }}>{cfg.time}</span>
                  <span style={{ fontSize: 16 }}>{cfg.emoji}</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: cfg.color, flex: 1 }}>{cfg.label}</span>
                  {angle === 'news' && (
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 9, background: '#3B82F6', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>LIVE</span>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(Object.keys(PLATFORM_ICONS) as PlatformKey[]).map(p => (
                      <span key={p} style={{ fontSize: 14, opacity: settings?.platforms[p] ? 1 : 0.3 }}>{PLATFORM_ICONS[p]}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Platform Toggles */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: '#9CA3AF', marginBottom: 8 }}>PLATFORMS</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(Object.keys(PLATFORM_ICONS) as PlatformKey[]).map(p => {
              const active = settings?.platforms[p] ?? false
              const connected = channels.some(c => c.service === p || (p === 'twitter' && c.service === 'twitter'))
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 999,
                    border: `1px solid ${active ? '#4ade80' : '#1f2937'}`,
                    background: active ? '#4ade8022' : 'transparent',
                    color: active ? '#4ade80' : '#9CA3AF',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {PLATFORM_ICONS[p]} {p.toUpperCase()}
                  {connected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Buffer Status */}
        <div style={{
          background: '#161616',
          border: `1px solid ${bufferConnected ? '#4ade80' : '#F97316'}`,
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>{bufferConnected ? '✓' : '⚠'}</span>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, color: bufferConnected ? '#4ade80' : '#F97316' }}>
              {bufferConnected
                ? `Buffer connected — ${channels.length} channel${channels.length !== 1 ? 's' : ''} active`
                : 'Buffer not connected'}
            </div>
            {bufferConnected && (
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {channels.slice(0, 6).map(c => (
                  <div key={c.id} title={c.name} style={{ width: 20, height: 20, borderRadius: '50%', background: '#1f2937', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9CA3AF' }}>
                    {c.avatar ? <img src={c.avatar} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.name[0]}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generate All Button */}
        <button
          onClick={generateAll}
          disabled={loadingAll || ANGLES.some(a => generating[a])}
          style={{
            width: '100%',
            background: loadingAll ? '#1f2937' : '#FFD700',
            border: 'none',
            borderRadius: 999,
            padding: '18px 0',
            color: '#000',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 20,
            cursor: loadingAll ? 'not-allowed' : 'pointer',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {loadingAll
            ? <><Spinner size={18} /><span>GENERATING...</span></>
            : '⚡ GENERATE TODAY\'S POSTS'}
        </button>

        {/* Post Cards */}
        {ANGLES.map(angle => {
          const post = posts[angle]
          const isGenerating = generating[angle]
          const cfg = ANGLE_CONFIG[angle]

          if (isGenerating) {
            return (
              <div key={angle} style={{ border: `1px solid ${cfg.color}`, borderRadius: 16, padding: 24, marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Spinner size={24} />
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: cfg.color }}>
                  {angle === 'news' ? '🔍 SEARCHING LIVE TRENDS...' : `GENERATING ${cfg.label} POST...`}
                </div>
              </div>
            )
          }

          if (!post) return null

          return (
            <PostCard
              key={angle}
              post={post}
              onRegen={() => generatePost(angle)}
              onSchedule={() => schedulePost(angle)}
              onUpdate={(field, value) => updatePostField(angle, field, value)}
              scheduling={!!scheduling[angle]}
            />
          )
        })}

        {/* Post History */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            width: '100%',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#9CA3AF',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 15,
            padding: '10px 0',
            borderRadius: 12,
            cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          📋 POST HISTORY (LAST 7 DAYS) {showHistory ? '▲' : '▼'}
        </button>

        {showHistory && (
          <div>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#9CA3AF', fontFamily: 'monospace', fontSize: 11 }}>
                No posts yet. Generate your first post above.
              </div>
            ) : (
              history.map(h => {
                const cfg = h.angle ? ANGLE_CONFIG[h.angle] : null
                const statusColors: Record<string, string> = {
                  scheduled: '#4ade80',
                  posted: '#3B82F6',
                  failed: '#ef4444',
                  draft: '#9CA3AF',
                }
                return (
                  <HistoryItem key={h.id} post={h} cfg={cfg} statusColor={statusColors[h.status] ?? '#9CA3AF'} />
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryItem({
  post,
  cfg,
  statusColor,
}: {
  post: ScheduledPost
  cfg: { emoji: string; label: string; color: string; time: string } | null
  statusColor: string
}) {
  const [expanded, setExpanded] = useState(false)
  const date = new Date(post.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })

  return (
    <div style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#9CA3AF', flexShrink: 0 }}>{date}</span>
        {cfg && (
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, color: cfg.color, background: cfg.color + '22', padding: '1px 8px', borderRadius: 999 }}>
            {cfg.emoji} {cfg.label}
          </span>
        )}
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#e5e7eb', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {post.topic}
        </span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 10, color: statusColor, flexShrink: 0 }}>
          {post.status.toUpperCase()}
        </span>
        <span style={{ color: '#9CA3AF', fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {post.short_form_script && (
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#e5e7eb', marginTop: 10, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {post.short_form_script}
            </div>
          )}
          {post.news_source && (
            <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 10, color: '#3B82F6' }}>
              {post.news_source}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
