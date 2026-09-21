// Server-side Apify client. Called only from API routes with the service
// token below — never exposed to the browser, never a member's own key.
//
// Actor IDs are env-configurable so they can be swapped without a code
// change once you've confirmed pricing/quality in the Apify console:
//   APIFY_ACTOR_INSTAGRAM_PROFILE  default: apify/instagram-profile-scraper
//   APIFY_ACTOR_INSTAGRAM_HASHTAG  default: apify/instagram-hashtag-scraper
//   APIFY_ACTOR_TIKTOK_PROFILE     default: clockworks/tiktok-profile-scraper
//   APIFY_ACTOR_TIKTOK_SEARCH      default: clockworks/tiktok-scraper
//
// These are the actors Apify's own team (Instagram) and the most-used,
// actively-maintained community actor (Clockworks, TikTok) publish as of
// 2026. Confirm current pricing/output schema in the Apify console before
// going live — third-party actor input/output fields can change.

const APIFY_BASE = 'https://api.apify.com/v2'

const ACTORS = {
  instagramProfile: process.env.APIFY_ACTOR_INSTAGRAM_PROFILE || 'apify/instagram-profile-scraper',
  instagramHashtag: process.env.APIFY_ACTOR_INSTAGRAM_HASHTAG || 'apify/instagram-hashtag-scraper',
  tiktokProfile: process.env.APIFY_ACTOR_TIKTOK_PROFILE || 'clockworks/tiktok-profile-scraper',
  tiktokSearch: process.env.APIFY_ACTOR_TIKTOK_SEARCH || 'clockworks/tiktok-scraper',
}

export interface ScrapedProfile {
  handle: string
  displayName: string | null
  bio: string | null
  followers: number | null
  email: string | null
}

export interface ScrapedPost {
  handle: string
  displayName: string | null
  bio: string | null
  followers: number | null
}

async function runActorSync(actorId: string, input: Record<string, unknown>, timeoutSecs = 55): Promise<unknown[]> {
  const token = process.env.APIFY_API_TOKEN
  if (!token) throw new Error('APIFY_NOT_CONFIGURED')

  const url = `${APIFY_BASE}/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSecs}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`APIFY_RUN_FAILED: ${res.status} ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data : []
}

function extractEmailFromBio(bio: string | null | undefined): string | null {
  if (!bio) return null
  const match = bio.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return match ? match[0] : null
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function asNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

// ── Instagram ─────────────────────────────────────────────────────────

export async function fetchInstagramProfile(handle: string): Promise<ScrapedProfile | null> {
  const items = await runActorSync(ACTORS.instagramProfile, { usernames: [handle] })
  const item = items[0] as Record<string, unknown> | undefined
  if (!item) return null

  const bio = asString(item.biography) ?? asString(item.bio)
  return {
    handle,
    displayName: asString(item.fullName) ?? asString(item.full_name),
    bio,
    followers: asNumber(item.followersCount) ?? asNumber(item.followers),
    email: asString(item.publicEmail) ?? extractEmailFromBio(bio),
  }
}

export async function searchInstagramByHashtags(hashtags: string[], limit: number): Promise<ScrapedPost[]> {
  const cleanTags = hashtags.map(h => h.replace(/^#/, '').replace(/\s+/g, ''))
  const items = await runActorSync(ACTORS.instagramHashtag, {
    hashtags: cleanTags,
    resultsLimit: limit,
  })

  const seen = new Set<string>()
  const posts: ScrapedPost[] = []
  for (const raw of items) {
    const item = raw as Record<string, unknown>
    const handle = asString(item.ownerUsername) ?? asString(item.username)
    if (!handle || seen.has(handle)) continue
    seen.add(handle)
    posts.push({
      handle,
      displayName: asString(item.ownerFullName) ?? asString(item.fullName),
      bio: null,
      followers: asNumber(item.ownerFollowersCount) ?? null,
    })
    if (posts.length >= limit) break
  }
  return posts
}

// ── TikTok ────────────────────────────────────────────────────────────

export async function fetchTiktokProfile(handle: string): Promise<ScrapedProfile | null> {
  const items = await runActorSync(ACTORS.tiktokProfile, { profiles: [handle] })
  const item = items[0] as Record<string, unknown> | undefined
  if (!item) return null

  const bio = asString(item.signature) ?? asString(item.bio)
  return {
    handle,
    displayName: asString(item.nickname) ?? asString(item.nickName),
    bio,
    followers: asNumber(item.fans) ?? asNumber(item.followerCount),
    email: extractEmailFromBio(bio),
  }
}

export async function searchTiktokByKeywords(keywords: string[], limit: number): Promise<ScrapedPost[]> {
  const items = await runActorSync(ACTORS.tiktokSearch, {
    searchQueries: keywords,
    resultsPerPage: limit,
  })

  const seen = new Set<string>()
  const posts: ScrapedPost[] = []
  for (const raw of items) {
    const item = raw as Record<string, unknown>
    const author = (item.authorMeta ?? item.author) as Record<string, unknown> | undefined
    const handle = asString(author?.name) ?? asString(author?.uniqueId)
    if (!handle || seen.has(handle)) continue
    seen.add(handle)
    posts.push({
      handle,
      displayName: asString(author?.nickName) ?? asString(author?.nickname),
      bio: asString(author?.signature),
      followers: asNumber(author?.fans) ?? asNumber(author?.followerCount),
    })
    if (posts.length >= limit) break
  }
  return posts
}
