import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { buildBrainContext } from '@/lib/brain'
import { callClaude } from '@/lib/claude'
import { AvatarSettings, ScheduleAngle } from '@/types'

export const dynamic = 'force-dynamic'

const PAIN_PROMPT = (avatarSettings: AvatarSettings, brainContext: string) => `You are creating daily social media content for The One Club — helping people escape the 9-5 with AI tools.
Voice: Morphe — direct, system-critical, anti-establishment, no hype, no em dashes.

ANGLE: PAIN
Speak to raw frustrations of someone stuck in the 9-5. Make them feel understood. Truth only — no solutions yet.

AVATAR: ${JSON.stringify(avatarSettings)}
BRAND BRAIN: ${brainContext}

FRAMEWORK (Daniel Priestley):
- Hook: Who this is for + why they should care (first 3 seconds)
- Content: The painful truth they feel but haven't heard said this clearly
- CTA: "Comment AI" for Instagram/TikTok/Threads | direct for X/Facebook

RULES:
- Pure value — zero selling
- No income claims or guarantees
- Evergreen — not time-sensitive
- Short form: max 150 words (60 seconds read aloud)
- X: max 280 chars, no hashtags
- No em dashes

OUTPUT — use exactly these labels:
TOPIC: [one line summary]

SHORT_FORM_SCRIPT:
[150 words max]

TWITTER:
[280 chars max]

THREADS:
[150-300 chars]

FACEBOOK:
[200-400 chars]

INSTAGRAM:
[hook + value + "Comment AI ⬇️" + 15 hashtags on new lines]`

const PRIZE_PROMPT = (avatarSettings: AvatarSettings, brainContext: string) => `You are creating daily social media content for The One Club.
Voice: Morphe — direct, aspirational, system-critical, no em dashes.

ANGLE: PRIZE
Paint the life your audience wants. Make them hungry for freedom. Grounded — not fantasy.

AVATAR: ${JSON.stringify(avatarSettings)}
BRAND BRAIN: ${brainContext}

FRAMEWORK:
- Hook: Paint the dream in the opening line
- Content: What that freedom specifically looks like day-to-day
- CTA: "Comment AI" for Instagram/TikTok/Threads

RULES:
- No income guarantees
- Real and achievable — not hype
- Pure value, zero selling
- No em dashes
- 150 words max

OUTPUT:
TOPIC: [one line summary]

SHORT_FORM_SCRIPT:
[150 words max]

TWITTER:
[280 chars max]

THREADS:
[150-300 chars]

FACEBOOK:
[200-400 chars]

INSTAGRAM:
[hook + value + "Comment AI ⬇️" + 15 hashtags]`

const NEWS_PROMPT = (avatarSettings: AvatarSettings, brainContext: string, headline: string, summary: string, source: string) => `You are creating daily social media content for The One Club.
Voice: Morphe — direct, informed, system-critical, no em dashes.

ANGLE: NEWS/TREND
Connect a real trending story to your audience's world. Be the person who explains what this means for people building income online with AI.

NEWS:
Headline: ${headline}
Summary: ${summary}
Source: ${source}

AVATAR: ${JSON.stringify(avatarSettings)}
BRAND BRAIN: ${brainContext}

FRAMEWORK:
- Hook: What just happened (the news)
- Insight: What this actually means for online income builders
- CTA: "Comment AI" for Instagram/TikTok/Threads

RULES:
- Reference real news — never fabricate
- Relevant to AI tools and online business
- Pure value, no selling
- Credit source naturally
- No em dashes
- 150 words max

OUTPUT:
TOPIC: [one line summary]
NEWS_SOURCE: [URL]

SHORT_FORM_SCRIPT:
[150 words max]

TWITTER:
[280 chars max]

THREADS:
[150-300 chars]

FACEBOOK:
[200-400 chars]

INSTAGRAM:
[hook + value + "Comment AI ⬇️" + 15 hashtags]`

function parsePost(raw: string) {
  const get = (key: string) => {
    const escaped = key.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')
    const regex = new RegExp(`${escaped}:\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z_/\\s]*:|$)`, 'i')
    return raw.match(regex)?.[1]?.trim() ?? ''
  }
  const getInline = (key: string) => {
    const escaped = key.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')
    return raw.match(new RegExp(`${escaped}:\\s*(.+)`, 'i'))?.[1]?.trim() ?? ''
  }

  return {
    topic: getInline('TOPIC'),
    newsSource: getInline('NEWS_SOURCE'),
    shortFormScript: get('SHORT_FORM_SCRIPT'),
    twitterPost: get('TWITTER'),
    threadsPost: get('THREADS'),
    facebookPost: get('FACEBOOK'),
    instagramCaption: get('INSTAGRAM'),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memberId, angle, avatarSettings, useBrandBrain } = body as {
      memberId: string
      angle: ScheduleAngle
      avatarSettings: AvatarSettings
      useBrandBrain: boolean
    }

    const supabase = createServerClient()
    const brainContext = useBrandBrain ? await buildBrainContext(memberId, true, true) : ''

    let prompt = ''
    let newsSource = ''

    if (angle === 'news') {
      // Fetch trending news
      const baseUrl = req.nextUrl.origin
      const newsRes = await fetch(`${baseUrl}/api/scheduler/news`)
      const news = newsRes.ok ? await newsRes.json() : { headline: '', summary: '', sourceUrl: '' }
      newsSource = news.sourceUrl ?? ''
      prompt = NEWS_PROMPT(avatarSettings, brainContext, news.headline, news.summary, news.sourceUrl)
    } else if (angle === 'pain') {
      prompt = PAIN_PROMPT(avatarSettings, brainContext)
    } else {
      prompt = PRIZE_PROMPT(avatarSettings, brainContext)
    }

    const raw = await callClaude(
      'You are a social media content creator. Follow the output format exactly.',
      prompt,
      1500
    )

    const parsed = parsePost(raw)
    if (angle === 'news' && !parsed.newsSource) parsed.newsSource = newsSource

    // Save as draft
    const { data: post, error } = await supabase
      .from('scheduled_posts')
      .insert({
        member_id: memberId,
        angle,
        topic: parsed.topic,
        short_form_script: parsed.shortFormScript,
        twitter_post: parsed.twitterPost,
        threads_post: parsed.threadsPost,
        facebook_post: parsed.facebookPost,
        instagram_caption: parsed.instagramCaption,
        news_source: parsed.newsSource || null,
        status: 'draft',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        angle,
        topic: parsed.topic,
        shortFormScript: parsed.shortFormScript,
        twitterPost: parsed.twitterPost,
        threadsPost: parsed.threadsPost,
        facebookPost: parsed.facebookPost,
        instagramCaption: parsed.instagramCaption,
        newsSource: parsed.newsSource,
      },
    })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
