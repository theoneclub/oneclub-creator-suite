import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

function detectPlatform(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('tiktok.com')) return 'TikTok'
  if (u.includes('instagram.com')) return 'Instagram Reels'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'X / Twitter'
  return 'Social Media'
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ transcript: null, note: 'No URL provided' })

    const platform = detectPlatform(url)
    const videoId = extractYouTubeId(url)

    if (!videoId) {
      return NextResponse.json({
        transcript: null,
        platform,
        note: `${platform} detected — auto-transcription is YouTube only. Paste the transcript manually below.`,
      })
    }

    // Fetch YouTube page to extract caption track URLs
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!pageRes.ok) {
      return NextResponse.json({ transcript: null, platform, note: 'Could not reach YouTube — paste transcript manually.' })
    }

    const html = await pageRes.text()

    // Extract captionTracks JSON
    const captionMatch = html.match(/"captionTracks":(\[.*?\])/)
    if (!captionMatch) {
      return NextResponse.json({ transcript: null, platform, note: 'No captions found on this video — paste transcript manually.' })
    }

    let tracks: { languageCode: string; baseUrl: string; name?: { simpleText?: string } }[]
    try {
      tracks = JSON.parse(captionMatch[1])
    } catch {
      return NextResponse.json({ transcript: null, platform, note: 'Could not parse captions — paste transcript manually.' })
    }

    // Prefer English auto-generated, then any English, then first available
    const track =
      tracks.find(t => t.languageCode === 'en') ||
      tracks.find(t => t.languageCode?.startsWith('en')) ||
      tracks[0]

    if (!track?.baseUrl) {
      return NextResponse.json({ transcript: null, platform, note: 'No usable caption track — paste transcript manually.' })
    }

    // Fetch the caption XML
    const captionRes = await fetch(track.baseUrl)
    if (!captionRes.ok) {
      return NextResponse.json({ transcript: null, platform, note: 'Caption fetch failed — paste transcript manually.' })
    }

    const xml = await captionRes.text()

    // Strip XML tags and decode HTML entities
    const lines = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/g) || []
    const transcript = lines
      .map(l =>
        l
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/\n/g, ' ')
          .trim()
      )
      .filter(Boolean)
      .join(' ')

    if (!transcript) {
      return NextResponse.json({ transcript: null, platform, note: 'Captions were empty — paste transcript manually.' })
    }

    return NextResponse.json({
      transcript,
      platform,
      wordCount: transcript.split(/\s+/).length,
      note: '✓ Auto-fetched from YouTube captions',
    })
  } catch (err) {
    console.error('Transcript fetch error:', err)
    return NextResponse.json({ transcript: null, platform: 'Social Media', note: 'Error fetching transcript — paste manually.' })
  }
}
