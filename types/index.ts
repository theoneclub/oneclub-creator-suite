export type Tier = 'starter' | 'premium' | 'elite' | 'founding'

export interface MemberCredits {
  member_id: string
  tier: Tier
  credits_remaining: number
  credits_total: number
  entries: number
  reset_date: string | null
  updated_at: string
}

export interface AvatarSettings {
  avatarName?: string
  niche?: string
  audience?: string
  tone?: string
  format?: string
  platforms?: string[]
  mission?: string
  voiceProfile?: string
  sigPhrases?: string
  avoidWords?: string
  cta?: string
}

export interface BrainSource {
  id: string
  url?: string
  type: 'youtube' | 'webpage' | 'pdf' | 'docx' | 'txt' | 'manual'
  title: string
  tag: string
  summary?: string
  active?: boolean
  created_at: string
  from?: 'GLOBAL' | 'PERSONAL'
}

export interface SavedItem {
  id: string
  member_id: string
  type: 'hook' | 'script' | 'email' | 'sms' | 'outreach'
  title: string
  content: string
  created_at: string
}

export interface GeneratedContent {
  hook?: string
  title?: string
  caption?: string
  hashtags?: string[]
  script?: ScriptContent
  cta?: string
  hookRating?: string
  seoScore?: string
}

export interface ScriptContent {
  intro: string
  point1: string
  point2: string
  point3: string
  cta: string
}

export interface EmailItem {
  subject: string
  preview: string
  body: string
  cta: string
  sendDay: string
  purpose: string
  approved?: boolean
}

export interface EmailSequence {
  id: string
  member_id: string
  name: string
  type: string
  mode: 'oneclub' | 'member'
  total_emails: number
  emails: EmailItem[]
  status: string
  created_at: string
  updated_at: string
}

export interface SMSMessage {
  body: string
  charCount: number
  sendDay: string
  purpose: string
  approved?: boolean
}

export interface SMSCampaign {
  id: string
  member_id: string
  name: string
  mode: 'oneclub' | 'member'
  total_messages: number
  messages: SMSMessage[]
  status: string
  created_at: string
}

export interface OutreachMessage {
  body: string
  purpose: string
  sendDelay: string
  personalisationNotes: string
  approved?: boolean
}

export interface OutreachSequence {
  id: string
  member_id: string
  name: string
  platform: 'instagram' | 'tiktok' | 'linkedin' | 'email'
  target_type: string
  target_description: string
  goal: string
  mode: 'oneclub' | 'member'
  messages: OutreachMessage[]
  created_at: string
}

export interface AdminStats {
  totalMembersToday: number
  totalMembersWeek: number
  generationsToday: number
  generationsWeek: number
  featureBreakdown: { feature: string; count: number; pct: number }[]
  tierBreakdown: { tier: string; count: number }[]
  globalBrainCount: number
}

export type Screen = 'brain' | 'content' | 'outreach' | 'email' | 'sms'
