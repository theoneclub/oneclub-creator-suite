import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function detectPlatform(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('tiktok.com'))    return 'TikTok'
  if (u.includes('instagram.com')) return 'Instagram Reels'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'X / Twitter'
  if (u.includes('facebook.com')) return 'Facebook'
  if (u.includes('threads.net'))  return 'Threads'
  return 'Video'
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function parseVtt(vtt: string): string {
  return vtt
    .split('\n')
    .filter(line => {
      if (!line.trim()) return false
      if (line.startsWith('WEBVTT')) return false
      if (/^\d+$/.test(line.trim())) return false
      if (/-->/.test(line)) return false
      if (/^NOTE/.test(line.trim())) return false
      return true
    })
    .map(l => l.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .join(' ')
}

async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  const pageRes = await fetch('https://www.youtube.com/watch?v=' + videoId, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  })
  if (!pageRes.ok) return null
  const html = await pageRes.text()

  const captionMatch = html.match(/"captionTracks":(\[.*?\])/)
  if (!captionMatch) return null

  let tracks: { languageCode: string; baseUrl: string }[]
  try { tracks = JSON.parse(captionMatch[1]) } catch { return null }

  const track =
    tracks.find(t => t.languageCode === 'en') ||
    tracks.find(t => t.languageCode?.startsWith('en')) ||
    tracks[0]

  if (!track?.baseUrl) return null

  const captionRes = await fetch(track.baseUrl)
  if (!captionRes.ok) return null
  const xml = await captionRes.text()

  const lines = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g) || []
  return lines
    .map(l =>
      l
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/\n/g, ' ').trim()
    )
    .filter(Boolean)
    .join(' ') || null
}

// TikTok public oEmbed — no auth required
async function fetchTikTokMetadata(url: string): Promise<{ title: string; thumbnailUrl: string; authorName: string } | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.title) return null
    return {
      title: data.title ?? '',
      thumbnailUrl: data.thumbnail_url ?? '',
      authorName: data.author_name ?? '',
    }
  } catch {
    return null
  }
}

// Scrape og: meta tags for Instagram / Facebook / other platforms
async function fetchOgMetadata(url: string): Promise<{ title: string; thumbnailUrl: string; description: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const html = await res.text()

    const ogTag = (prop: string): string => {
      const m = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
               || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'i'))
      return m ? m[1] : ''
    }

    const title = ogTag('title')
    const thumbnailUrl = ogTag('image')
    const description = ogTag('description')

    if (!title && !thumbnailUrl) return null
    return { title, thumbnailUrl, description }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ transcript: null, note: 'No URL provided' })

    const platform = detectPlatform(url)

    // ── YouTube: caption extraction ──────────────────────────────────────────
    const ytId = extractYouTubeId(url)
    if (ytId) {
      const transcript = await fetchYouTubeTranscript(ytId)
      if (transcript) {
        return NextResponse.json({
          transcript,
          platform: 'YouTube',
          wordCount: transcript.split(/\s+/).length,
          note: '✓ Auto-fetched from YouTube captions',
        })
      }
      return NextResponse.json({
        transcript: null,
        platform: 'YouTube',
        note: 'No captions found — paste transcript manually.',
      })
    }

    // ── TikTok: oEmbed metadata + thumbnail ─────────────────────────────────
    if (platform === 'TikTok') {
      const meta = await fetchTikTokMetadata(url)
      if (meta) {
        return NextResponse.json({
          transcript: meta.title, // caption goes in the transcript field
          thumbnailUrl: meta.thumbnailUrl,
          videoTitle: meta.title,
          authorName: meta.authorName,
          platform: 'TikTok',
          analysisType: 'metadata',
          note: '✓ Video analyzed — caption + thumbnail ready to clone',
        })
      }
      return NextResponse.json({
        transcript: null,
        platform: 'TikTok',
        note: 'Could not analyze this TikTok — paste the caption manually below.',
      })
    }

    // ── Instagram: og: meta tags ─────────────────────────────────────────────
    if (platform === 'Instagram Reels') {
      const meta = await fetchOgMetadata(url)
      if (meta && (meta.title || meta.thumbnailUrl)) {
        const caption = [meta.title, meta.description].filter(Boolean).join('\n\n')
        return NextResponse.json({
          transcript: caption || null,
          thumbnailUrl: meta.thumbnailUrl || null,
          videoTitle: meta.title || null,
          platform: 'Instagram Reels',
          analysisType: 'metadata',
          note: caption
            ? '✓ Video analyzed — caption + thumbnail ready to clone'
            : '✓ Thumbnail captured — ready to clone visually',
        })
      }
      return NextResponse.json({
        transcript: null,
        platform: 'Instagram Reels',
        note: 'Instagram blocked the fetch — paste the caption manually below.',
      })
    }

    // ── Facebook: og: meta tags ──────────────────────────────────────────────
    if (platform === 'Facebook') {
      const meta = await fetchOgMetadata(url)
      if (meta && (meta.title || meta.thumbnailUrl)) {
        const caption = [meta.title, meta.description].filter(Boolean).join('\n\n')
        return NextResponse.json({
          transcript: caption || null,
          thumbnailUrl: meta.thumbnailUrl || null,
          videoTitle: meta.title || null,
          platform: 'Facebook',
          analysisType: 'metadata',
          note: caption
            ? '✓ Video analyzed — caption + thumbnail ready to clone'
            : '✓ Thumbnail captured — ready to clone visually',
        })
      }
      return NextResponse.json({
        transcript: null,
        platform: 'Facebook',
        note: 'Facebook blocked the fetch — paste the caption manually below.',
      })
    }

    return NextResponse.json({
      transcript: null,
      platform,
      note: platform + ' detected — paste the caption/transcript manually below.',
    })

  } catch (_err) {
    console.error('Transcript route error:', _err)
    return NextResponse.json({
      transcript: null,
      platform: 'Unknown',
      note: 'Error fetching — paste manually.',
    })
  }
}
