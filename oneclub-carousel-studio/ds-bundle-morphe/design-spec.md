# ds-bundle-morphe — Carousel Design Spec

Pulled once, locked. Every carousel uses this bundle unchanged so the account is
recognisable in-feed at thumbnail size, mid-scroll. If a deck needs a look this
spec doesn't cover, change the spec — not one deck.

**Sources.** The palette locked for the platform, cross-checked against
`app/globals.css` and `components/AppShell.tsx` in this repo (same greens, same
`#9CA3AF` secondary, same `#1f2937` dim border, same `#FFD700` CTA yellow), plus
the reference carousels supplied by the user — heavy stacked display type,
highlight boxes, accent-bar row cards, stat panels, pill CTAs, handle +
progress-bar footer. Those devices were adopted; the light warm palette they use
was not. Everything stays pure black / matrix green / CTA yellow.

`theoneclub.io` itself could not be fetched from this environment — the agent
proxy returns 403 for that host — so nothing here was invented from the live
site. If the site diverges, `tokens.css` is the file to edit.

## Canvas

- **1080 × 1440 (3:4)** — not square. Square is throttled in-feed right now.
- Pure black background. The only gradient allowed is the scrim over hook and
  CTA artwork.
- Safe margin 76px, 72px top. Nothing that carries meaning goes outside it.
- Export: PNG, 1× device scale, sRGB.

## Palette (locked — `tokens.css`)

| Token | Hex | Role |
|---|---|---|
| `--black` | `#000000` | Background |
| `--card` | `#111111` | Row cards, stat panels |
| `--green` | `#a3f0af` | Primary: kickers, headline accents, row accents, footer handle |
| `--green-soft` | `#4ADE80` | Third accent in the row cycle |
| `--yellow` | `#FFD700` | Highlight boxes, action pills, second accent in the cycle |
| `--white` | `#FFFFFF` | Headlines, pull lines, progress fill |
| `--grey` | `#9CA3AF` | Body copy, sub-lines, counters |
| `--border-dim` | `#1f2937` | Muted comparison bars |

Accents on row cards and stat bars cycle green → yellow → green-soft. That
rhythm is what the reference decks get from four pastel accents; here it comes
from three brand colours and nothing else.

## Type

- **Anton**, all-caps — headlines. Heavy condensed, stacks tight at 0.94
  line-height. This is the face that carries the reference look.
- **Bebas Neue** — kept in the bundle as the lighter condensed alternative.
  Swap `--font-display` in `tokens.css` to switch the whole system back.
- **Inter** — body, kickers, row cards, meta. Body 34px / 1.45; kickers 21px
  with 0.3em tracking.
- Self-hosted in `fonts/` (latin subset), so renders are identical offline and
  in CI. No network call at render time.
- Headlines auto-fit: the renderer shrinks type until the block stops
  overflowing, floor 0.62. Hitting the floor is a QA warning — the fix is fewer
  words, not smaller type.

## Recurring visual language

- **Kicker** — small letterspaced caps in green (yellow on the CTA). Names the
  beat: `SYSTEM CRITIQUE`, `WHAT IT COSTS`, `THE FREEDOM FUND`.
- **Stacked headline** — two or three lines, explicit `\n` breaks, one phrase
  in green or inside a yellow highlight box. Never more than one highlight per
  headline.
- **Footer bar** — `@theoneclub` left, a progress bar that fills across the set,
  `03 / 09` right. Same on every slide; it is the account's fingerprint at
  thumbnail size and it tells a scroller how much is left.
- **Adaptive vertical rhythm** — dense slides read top-down from the kicker;
  sparse slides centre their block automatically at render time. No slide ever
  has a short paragraph stranded at the top of an empty frame.
- **Morphe** — mirrored sunglasses, hooded jacket, never a face. Hook and CTA
  slides only, generated in Higgsfield, composited under a top-and-bottom scrim
  with the type centred over it. He plays the role a creator's face plays in a
  talking-head video: the constant.
- **The grid** — when no photograph exists, hook and CTA slides use the
  generated matrix backdrops in `assets/` (perspective grid, lit horizon, code
  rain). Vector, committed, offline, free. It is the fallback that still looks
  deliberate — swap in a photo whenever there is one.

## Blocks

Any slide can carry any of these; the type decides the base composition.

| Block | Use |
|---|---|
| `copy[]` | Body paragraphs. `**bold**` promotes a phrase to white. |
| `rows[]` | Accent-bar cards, `{ t, s }`. Set `numbered: true` for a ranked list. The workhorse — a value slide with 3 rows outperforms a paragraph. |
| `stats` | Chart card: label / bar / value rows. `muted: true` dims a comparison row. Bars are relative, never absolute claims. |
| `flow[]` | Step chain, `{ k, t, s }`. Three steps run across the frame; four or more stack into a vertical chain with connectors. |
| `big` | One oversized number with a label and a note. The slide you want screenshotted. |
| `figure` | Artwork inside a card, `{ image, caption, ratio }`. Diagrams are contained, never cropped — pass the art's aspect ratio and the card sizes to it. |
| `versus` | The ❌/✅ contrast, `{ no, yes }`. Left panel dims, right panel carries a green wash. The highest-signal device in the outlier research. |
| `tiles[]` | Two or three stat tiles, `{ value, label }`. Hook and support slides. |
| `pull` | Centred bold line under a chart or paragraph. The takeaway. |
| `pill` | Yellow action pill. `{ before, word, text }` on the CTA; `{ text, ghost: true }` for a swipe prompt. |

| Type | Composition |
|---|---|
| `hook` | Artwork + scrim, centred stack: kicker, oversized headline with highlight box, one line of white copy, tiles, ghost swipe pill |
| `stakes` | Kicker, stacked headline, one paragraph |
| `value` | Kicker, headline, then whichever block does the teaching |
| `receipts` | Kicker, headline, paragraph, three proof rows |
| `cta` | Artwork + scrim, centred: kicker, headline, supporting line, yellow comment pill |

## Editing

`tokens.css` for values, `carousel.css` for layout, `scripts/lib/template.mjs`
for structure. Re-run `node scripts/render.mjs output/<deck>` after any change —
every deck regenerates from the same bundle, so a fix propagates to everything
you re-render.
