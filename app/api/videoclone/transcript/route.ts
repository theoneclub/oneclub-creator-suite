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

async function fetchTikTokTranscript(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.tiktok.com/',
    },
    redirect: 'follow',
  })
  if (!res.ok) return null
  const html = await res.text()

  const dataPatterns = [
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/,
    /__NEXT_DATA__[^>]*>([\s\S]*?)<\/script>/,
  ]

  let jsonStr: string | null = null
  for (const p of dataPatterns) {
    const m = html.match(p)
    if (m) { jsonStr = m[1]; break }
  }

  if (jsonStr) {
    try {
      const data = JSON.parse(jsonStr)
      const jsonText = JSON.stringify(data)

      const subtitleBlock = jsonText.match(/"subtitleInfos":\[(.*?)\]/)
      if (subtitleBlock) {
        const vttUrlMatch = subtitleBlock[1].match(/"Url":"(https:[^"]+\.vtt[^"]*)"/)
        const srtUrlMatch = subtitleBlock[1].match(/"Url":"(https:[^"]+\.srt[^"]*)"/)
        const captionUrl = (vttUrlMatch ?? srtUrlMatch)?.[1]
        if (captionUrl) {
          const clean = captionUrl.replace(/\\u002F/g, '/').replace(/\\/g, '')
          const vttRes = await fetch(clean)
          if (vttRes.ok) {
            const parsed = parseVtt(await vttRes.text())
            if (parsed) return parsed
          }
        }
      }

      const captionUrlMatch = jsonText.match(/"captionUrl":"(https:[^"]+)"/)
      if (captionUrlMatch) {
        const clean = captionUrlMatch[1].replace(/\\u002F/g, '/').replace(/\\/g, '')
        const captionRes = await fetch(clean)
        if (captionRes.ok) {
          const parsed = parseVtt(await captionRes.text())
          if (parsed) return parsed
        }
      }
    } catch (_e) {
      // fall through
    }
  }

  const vttInPage = html.match(/https:\/\/[^\s"']+\.vtt[^\s"']*/i)
  if (vttInPage) {
    const vttRes = await fetch(vttInPage[0])
    if (vttRes.ok) {
      const parsed = parseVtt(await vttRes.text())
      if (parsed) return parsed
    }
  }

  return null
}

async function fetchInstagramTranscript(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  })
  if (!res.ok) return null
  const html = await res.text()

  const captionPatterns = [
    /"accessibility_caption":"([^"]+)"/,
    /"edge_media_to_caption"[\s\S]{0,200}"text":"([^"]+)"/,
  ]
  for (const p of captionPatterns) {
    const m = html.match(p)
    if (m && m[1].length > 20) {
      return m[1].replace(/\\n/g, ' ').replace(/\\"/g, '"')
    }
  }

  const vttMatch = html.match(/https:\/\/[^\s"']+\.vtt[^\s"']*/i)
  if (vttMatch) {
    const vttRes = await fetch(vttMatch[0])
    if (vttRes.ok) {
      const parsed = parseVtt(await vttRes.text())
      if (parsed) return parsed
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ transcript: null, note: 'No URL provided' })

    const platform = detectPlatform(url)

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

    if (platform === 'TikTok') {
      const transcript = await fetchTikTokTranscript(url)
      if (transcript) {
        return NextResponse.json({
          transcript,
          platform: 'TikTok',
          wordCount: transcript.split(/\s+/).length,
          note: '✓ Auto-fetched from TikTok captions',
        })
      }
      return NextResponse.json({
        transcript: null,
        platform: 'TikTok',
        note: 'No captions on this TikTok — paste transcript manually below.',
      })
    }

    if (platform === 'Instagram Reels') {
      const transcript = await fetchInstagramTranscript(url)
      if (transcript) {
        return NextResponse.json({
          transcript,
          platform: 'Instagram Reels',
          wordCount: transcript.split(/\s+/).length,
          note: '✓ Auto-fetched from Instagram captions',
        })
      }
      return NextResponse.json({
        transcript: null,
        platform: 'Instagram Reels',
        note: 'No captions on this Reel — paste transcript manually below.',
      })
    }

    return NextResponse.json({
      transcript: null,
      platform,
      note: platform + ' detected — paste the transcript manually below.',
    })

  } catch (_err) {
    console.error('Transcript route error:', _err)
    return NextResponse.json({
      transcript: null,
      platform: 'Unknown',
      note: 'Error fetching transcript — paste manually.',
    })
  }
}
