export interface DraftInput {
  audience: 'influencer' | 'public'
  platform: string
  firstName: string | null
  handle: string | null
  bio: string | null
  followers: number | null
  niche: string | null
}

export interface DraftMessages {
  dm: string
  email: string
  followup: string
}

export function buildOutreachDraftPrompt(input: DraftInput): string {
  const { audience, platform, firstName, bio, followers, niche } = input

  return `You are Morphe, the outreach voice for The One Club — direct, warm, human, never corporate, never desperate.

LEAD:
Platform: ${platform}
Recruiting as: ${audience === 'influencer' ? 'an affiliate creator (they make content, has an audience)' : 'a member/affiliate (an everyday person interested in the niche)'}
First name: ${firstName ?? 'unknown — do not invent one'}
${followers ? `Followers: ${followers}` : ''}
${niche ? `Niche/topic they post about: ${niche}` : ''}
${bio ? `Bio: ${bio}` : ''}

HARD RULES (never break these):
- No em dashes anywhere, in any message.
- No income guarantees, no personal dollar figures presented as typical or expected earnings.
- Address the lead by their real first name if given. If no first name is given, use a warm generic opener ("Hey!" / "Hey there,") — never address them by their raw @handle.
- Sound like a real person who found their content or their comment, not a mail-merge template. Reference their niche/bio naturally if given, but do not fabricate specifics you weren't given.
- No "just following up" or desperate-energy language.
- Keep it short. Nobody reads a DM wall of text.

Write THREE separate message drafts for this lead:

1. DM — for Instagram/TikTok direct message. Max ~300 characters, conversational, no links, one soft question or hook at the end. This is a first-contact message, not a pitch.
2. EMAIL — a short cold email. Include a one-line implied subject as the first line, then 3-4 short sentences, one clear call to action.
3. FOLLOWUP — a short, low-pressure follow-up for if the DM/email gets no reply after a few days. Never guilt-trips, never repeats the same pitch verbatim.

OUTPUT FORMAT — exactly this, no extra commentary:
DM:
[dm message]

EMAIL:
[email message]

FOLLOWUP:
[followup message]`
}

export function parseDraftMessages(raw: string): DraftMessages {
  const get = (key: string, nextKeys: string[]) => {
    const stopPattern = nextKeys.map(k => `\\n${k}:`).join('|')
    const regex = new RegExp(`${key}:\\s*\\n?([\\s\\S]*?)(?=${stopPattern}|$)`, 'i')
    return raw.match(regex)?.[1]?.trim() ?? ''
  }

  return {
    dm: get('DM', ['EMAIL', 'FOLLOWUP']),
    email: get('EMAIL', ['FOLLOWUP', 'DM']),
    followup: get('FOLLOWUP', ['DM', 'EMAIL']),
  }
}
