'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Spinner from '@/components/Spinner'
import Toast from '@/components/Toast'
import UpgradeModal from '@/components/ui/UpgradeModal'
import KeywordTagInput from '@/components/ui/KeywordTagInput'
import LeadMessageSheet from '@/components/ui/LeadMessageSheet'
import EmailIntegrationSettings from '@/components/ui/EmailIntegrationSettings'
import { GENERATE_BATCH_CAP, ADD_LEAD_CREDIT_COST, GENERATE_LEAD_CREDIT_COST, FOLLOWER_TIERS, FollowerTierKey, providerSupportsSend } from '@/lib/outreachConfig'
import { LeadAudience, LeadPlatform, MemberCredits, MemberEmailIntegration, OutreachLead } from '@/types'

interface LeadsScreenProps { memberId: string }

type FilterChip = 'all' | 'needs_attention' | 'contacted'
type Panel = null | 'add' | 'generate'

const ADD_LEAD_PLATFORMS: { id: LeadPlatform; label: string }[] = [
  { id: 'instagram', label: '📸 Instagram' },
  { id: 'tiktok', label: '🎵 TikTok' },
  { id: 'linkedin', label: '💼 LinkedIn' },
]
const DISCOVER_PLATFORMS: { id: 'instagram' | 'tiktok'; label: string }[] = [
  { id: 'instagram', label: '📸 Instagram' },
  { id: 'tiktok', label: '🎵 TikTok' },
]

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const day = new Date(date); day.setHours(0, 0, 0, 0)

  if (day.getTime() === today.getTime()) return 'Today'
  if (day.getTime() === yesterday.getTime()) return 'Yesterday'
  return day.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
}

function dayKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export default function LeadsScreen({ memberId }: LeadsScreenProps) {
  const [audience, setAudience] = useState<LeadAudience>('influencer')
  const [leads, setLeads] = useState<OutreachLead[]>([])
  const [credits, setCredits] = useState<MemberCredits | null>(null)
  const [emailIntegration, setEmailIntegration] = useState<MemberEmailIntegration | null>(null)
  const [filter, setFilter] = useState<FilterChip>('all')
  const [panel, setPanel] = useState<Panel>(null)
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedLead, setSelectedLead] = useState<OutreachLead | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showEmailSettings, setShowEmailSettings] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // Add Lead form
  const [addPlatform, setAddPlatform] = useState<LeadPlatform>('instagram')
  const [profileInput, setProfileInput] = useState('')
  const [addNiche, setAddNiche] = useState('')
  const [manualFirstName, setManualFirstName] = useState('')

  // Generate Leads form
  const [genPlatform, setGenPlatform] = useState<'instagram' | 'tiktok'>('instagram')
  const [genKeywords, setGenKeywords] = useState<string[]>([])
  const [genQuantity, setGenQuantity] = useState(10)
  const [genFollowerTiers, setGenFollowerTiers] = useState<FollowerTierKey[]>(['micro'])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type })

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true)
    const res = await fetch(`/api/outreach/leads?memberId=${memberId}`)
    if (res.ok) setLeads(await res.json())
    setLoadingLeads(false)
  }, [memberId])

  const loadCredits = useCallback(async () => {
    const res = await fetch(`/api/credits?memberId=${memberId}`)
    if (res.ok) setCredits(await res.json())
  }, [memberId])

  const loadEmailIntegration = useCallback(async () => {
    const res = await fetch(`/api/outreach/email-integration?memberId=${memberId}`)
    if (res.ok) { const data = await res.json(); setEmailIntegration(data.integration ?? null) }
  }, [memberId])

  useEffect(() => { loadLeads(); loadCredits(); loadEmailIntegration() }, [loadLeads, loadCredits, loadEmailIntegration])

  const audienceLeads = useMemo(() => leads.filter(l => l.audience === audience), [leads, audience])

  const filteredLeads = useMemo(() => {
    if (filter === 'needs_attention') return audienceLeads.filter(l => !l.contacted)
    if (filter === 'contacted') return audienceLeads.filter(l => l.contacted)
    return audienceLeads
  }, [audienceLeads, filter])

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; leads: OutreachLead[] }>()
    for (const lead of filteredLeads) {
      const key = dayKey(lead.created_at)
      if (!map.has(key)) map.set(key, { label: dayLabel(lead.created_at), leads: [] })
      map.get(key)!.leads.push(lead)
    }
    return Array.from(map.values())
  }, [filteredLeads])

  const toggleContacted = async (leadId: string, contacted: boolean) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, contacted } : l))
    setSelectedLead(prev => prev && prev.id === leadId ? { ...prev, contacted } : prev)
    const res = await fetch('/api/outreach/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, leadId, contacted }),
    })
    if (!res.ok) { showToast('Could not update — try again.', 'error'); loadLeads() }
  }

  const sendEmail = async (leadId: string) => {
    const res = await fetch('/api/outreach/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, leadId }),
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error === 'NO_EMAIL_INTEGRATION' ? 'Connect an email provider first.' : 'Send failed.', 'error'); return }
    setLeads(prev => prev.map(l => l.id === leadId ? data : l))
    setSelectedLead(data)
  }

  const submitAddLead = async () => {
    if (!profileInput.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/outreach/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, audience, platform: addPlatform, profileInput, niche: addNiche || undefined, manualFirstName: manualFirstName || undefined }),
      })
      const data = await res.json()
      if (data.error === 'NO_CREDITS') { setShowUpgrade(true); return }
      if (data.error === 'TIER_NOT_ALLOWED') { showToast('Your plan doesn’t include the Outreach tool yet.', 'error'); return }
      if (!res.ok) { showToast(data.error ?? 'Could not add lead.', 'error'); return }

      setLeads(prev => [data, ...prev])
      setProfileInput(''); setAddNiche(''); setManualFirstName(''); setPanel(null)
      showToast('✅ Lead added!')
      loadCredits()
    } finally {
      setSubmitting(false)
    }
  }

  const submitGenerate = async () => {
    if (genKeywords.length === 0) { showToast('Add at least one keyword first.', 'error'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/outreach/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId, audience, platform: genPlatform, keywords: genKeywords, quantity: genQuantity,
          followerTiers: audience === 'influencer' ? genFollowerTiers : undefined,
        }),
      })
      const data = await res.json()
      if (data.error === 'NO_CREDITS') { setShowUpgrade(true); return }
      if (data.error === 'TIER_NOT_ALLOWED') { showToast('Your plan doesn’t include the Outreach tool yet.', 'error'); return }
      if (!res.ok) { showToast(data.error ?? 'Could not generate leads.', 'error'); return }

      const newLeads: OutreachLead[] = data.leads ?? []
      setLeads(prev => [...newLeads, ...prev])
      showToast(newLeads.length ? `✅ ${newLeads.length} leads generated!` : (data.message ?? 'No matches found.'))
      if (newLeads.length) { setGenKeywords([]); setPanel(null) }
      loadCredits()
    } finally {
      setSubmitting(false)
    }
  }

  const toggleFollowerTier = (key: FollowerTierKey) => {
    setGenFollowerTiers(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const canSendEmail = !!emailIntegration && providerSupportsSend(emailIntegration.provider)

  return (
    <div style={{ paddingBottom: 20 }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {selectedLead && (
        <LeadMessageSheet
          lead={selectedLead}
          emailProvider={emailIntegration?.provider ?? null}
          canSendEmail={canSendEmail}
          onClose={() => setSelectedLead(null)}
          onToggleContacted={toggleContacted}
          onSendEmail={sendEmail}
          onCopied={showToast}
        />
      )}
      {showEmailSettings && (
        <EmailIntegrationSettings
          memberId={memberId}
          onClose={() => setShowEmailSettings(false)}
          onConnected={setEmailIntegration}
          onToast={showToast}
        />
      )}

      <div style={{ padding: '0 16px' }}>
        {/* Credits + email settings row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>
            <span style={{ color: '#4ade80', fontWeight: 700 }}>{credits?.credits_remaining ?? '—'} cr</span>
            {' · '}Add lead: {ADD_LEAD_CREDIT_COST}cr · Generate: {GENERATE_LEAD_CREDIT_COST}cr/lead
          </div>
          <button onClick={() => setShowEmailSettings(true)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#9CA3AF', fontFamily: 'monospace', fontSize: 10, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
            ✉️ Email {emailIntegration ? `(${emailIntegration.provider})` : 'setup'}
          </button>
        </div>

        {/* Audience toggle */}
        <div style={{ display: 'flex', background: '#161616', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 999, padding: 3, marginBottom: 14 }}>
          {([['influencer', 'Influencers'], ['public', 'Everyday Leads']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setAudience(id)} style={{ flex: 1, padding: '8px 0', borderRadius: 999, background: audience === id ? '#4ade80' : 'transparent', color: audience === id ? '#000' : '#9CA3AF', border: 'none', fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setPanel(panel === 'add' ? null : 'add')} style={{ flex: 1, background: panel === 'add' ? '#4ade80' : '#111', color: panel === 'add' ? '#000' : '#fff', border: '1px solid #1f2937', borderRadius: 12, padding: '12px 0', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, cursor: 'pointer' }}>
            + ADD LEAD
          </button>
          <button onClick={() => setPanel(panel === 'generate' ? null : 'generate')} style={{ flex: 1, background: panel === 'generate' ? '#FFD700' : '#111', color: panel === 'generate' ? '#000' : '#fff', border: '1px solid #1f2937', borderRadius: 12, padding: '12px 0', fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, cursor: 'pointer' }}>
            🔍 GENERATE LEADS
          </button>
        </div>

        {panel === 'add' && (
          <div style={{ background: '#111', border: '1px solid #1f2937', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {ADD_LEAD_PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setAddPlatform(p.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 999, border: `1px solid ${addPlatform === p.id ? '#4ade80' : '#1f2937'}`, background: addPlatform === p.id ? '#0d2b0d' : 'transparent', color: addPlatform === p.id ? '#4ade80' : '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, cursor: 'pointer' }}>
                  {p.label}
                </button>
              ))}
            </div>
            <input value={profileInput} onChange={e => setProfileInput(e.target.value)} placeholder="Profile URL or @handle" style={inputStyle} />
            <input value={addNiche} onChange={e => setAddNiche(e.target.value)} placeholder="Niche / context (optional)" style={inputStyle} />
            {addPlatform === 'linkedin' && (
              <input value={manualFirstName} onChange={e => setManualFirstName(e.target.value)} placeholder="Their first name (LinkedIn can't be auto-enriched)" style={inputStyle} />
            )}
            <button onClick={submitAddLead} disabled={submitting || !profileInput.trim()} style={{ width: '100%', background: '#4ade80', border: 'none', borderRadius: 999, padding: '13px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, cursor: 'pointer' }}>
              {submitting ? <Spinner size={16} /> : `ADD LEAD · ${ADD_LEAD_CREDIT_COST}cr`}
            </button>
          </div>
        )}

        {panel === 'generate' && (
          <div style={{ background: '#111', border: '1px solid #1f2937', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {DISCOVER_PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setGenPlatform(p.id)} style={{ flex: 1, padding: '7px 0', borderRadius: 999, border: `1px solid ${genPlatform === p.id ? '#FFD700' : '#1f2937'}`, background: genPlatform === p.id ? '#3a2e00' : 'transparent', color: genPlatform === p.id ? '#FFD700' : '#9CA3AF', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, cursor: 'pointer' }}>
                  {p.label}
                </button>
              ))}
            </div>

            <KeywordTagInput keywords={genKeywords} onChange={setGenKeywords} placeholder="e.g. side hustle — press Enter" />

            {audience === 'influencer' && (
              <div style={{ display: 'flex', gap: 6, margin: '12px 0' }}>
                {(Object.keys(FOLLOWER_TIERS) as FollowerTierKey[]).map(key => (
                  <button key={key} onClick={() => toggleFollowerTier(key)} style={{ flex: 1, padding: '6px 4px', borderRadius: 8, border: `1px solid ${genFollowerTiers.includes(key) ? '#4ade80' : '#1f2937'}`, background: genFollowerTiers.includes(key) ? '#0d2b0d' : 'transparent', color: genFollowerTiers.includes(key) ? '#4ade80' : '#9CA3AF', fontFamily: 'monospace', fontSize: 9, cursor: 'pointer' }}>
                    {FOLLOWER_TIERS[key].label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#9CA3AF' }}>Quantity</span>
              <input
                type="number" min={1} max={GENERATE_BATCH_CAP} value={genQuantity}
                onChange={e => setGenQuantity(Math.max(1, Math.min(GENERATE_BATCH_CAP, Number(e.target.value) || 1)))}
                style={{ width: 70, background: '#0d0d0d', border: '1px solid #1f2937', borderRadius: 8, padding: '6px 8px', color: '#fff', fontFamily: 'monospace', fontSize: 12 }}
              />
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b7280' }}>max {GENERATE_BATCH_CAP}/click — click again for more</span>
            </div>

            <button onClick={submitGenerate} disabled={submitting || genKeywords.length === 0} style={{ width: '100%', background: '#FFD700', border: 'none', borderRadius: 999, padding: '13px 0', color: '#000', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, cursor: 'pointer' }}>
              {submitting ? <Spinner size={16} /> : `GENERATE ${genQuantity} LEADS · ${genQuantity * GENERATE_LEAD_CREDIT_COST}cr`}
            </button>
          </div>
        )}

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {([['all', 'All'], ['needs_attention', 'Needs attending to'], ['contacted', 'Contacted']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${filter === id ? '#4ade80' : '#1f2937'}`, background: filter === id ? '#0d2b0d' : 'transparent', color: filter === id ? '#4ade80' : '#9CA3AF', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Day-grouped list */}
        {loadingLeads ? (
          <div style={{ textAlign: 'center', padding: 30 }}><Spinner /></div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
            No {audience === 'influencer' ? 'influencer' : 'everyday'} leads yet. Add one or generate a batch above.
          </div>
        ) : (
          groups.map(group => {
            const needAttending = group.leads.filter(l => !l.contacted).length
            return (
              <div key={group.label + group.leads[0].id} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: '#fff' }}>{group.label}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: needAttending ? '#F97316' : '#4ade80' }}>
                    {needAttending > 0 ? `${needAttending} need attending to` : 'All contacted'}
                  </div>
                </div>
                {group.leads.map(lead => (
                  <div key={lead.id} onClick={() => setSelectedLead(lead)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#111', border: '1px solid #1f2937', borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        @{lead.handle ?? '—'} {lead.first_name ? `· ${lead.first_name}` : ''}
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b7280' }}>
                        {lead.platform}{lead.followers ? ` · ${lead.followers.toLocaleString()} followers` : ''}{lead.niche ? ` · ${lead.niche}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); toggleContacted(lead.id, !lead.contacted) }}
                      style={{ flexShrink: 0, background: lead.contacted ? '#0d2b0d' : 'transparent', border: `1px solid ${lead.contacted ? '#4ade80' : '#1f2937'}`, color: lead.contacted ? '#4ade80' : '#9CA3AF', borderRadius: 999, padding: '6px 12px', fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {lead.contacted ? '✓ Contacted' : 'Mark contacted'}
                    </button>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
  padding: '12px 14px', color: '#fff', fontFamily: "'Space Mono', monospace", fontSize: 12,
  marginBottom: 10, boxSizing: 'border-box',
}
