---
name: carousel-generator
description: Build a One Club Instagram carousel end to end — slide-by-slide copy on the 5-beat formula, hook slide art via Higgsfield, branded 1080x1440 HTML slides, compliance + layout QA, grid preview, and numbered PNG export ready for Buffer. Use when the user asks for a carousel, a swipe post, a slide set, or says "use the carousel generator skill".
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion, mcp__Higgsfield__generate_image, mcp__Higgsfield__balance, mcp__Higgsfield__select_workspace, mcp__Higgsfield__show_medias, mcp__Higgsfield__media_import_url, mcp__Higgsfield__job_display
---

# Carousel Generator — The One Club

Carousels are the funnel's front door: roughly 7x the views of a reel, 42x the
comments, 18x the saves. Comments fire the ManyChat trigger, the DM goes out,
the email lands, Brevo nurture starts. **The carousel's only job is to make
someone comment one word.** Everything below serves that.

The lead magnet is already built: **The Faceless AI Affiliate ebook**. Its
trigger word is `EBOOK`, kept out of the reel rotation so carousel conversion is
trackable on its own. (`BLUEPRINT` stays reserved for the Blueprint version of
the same asset — use one or the other per deck, never both.)

**Give the whole thing away on the slides.** The carousel that earns the comment
is the one that already taught the reader something they can act on today. Hold
nothing back "for the DM" — the ebook is the expanded version, not the missing
half. A deck that reads as a pitch gets scrolled; a deck that reads as a free
lesson gets saved, and saves are what put it in front of the next person.

## Invocation

"Use the carousel generator skill" + a topic, an angle, or a raw idea.

## Narrative formula — ALWAYS these 5 beats, non-negotiable

1. **HOOK** (slide 1) — bold claim + a real number, OR a system-critique
   statement. This slide is 80% of the result. Do not move to design until
   the hook is locked.
2. **STAKES** (slide 2) — why this matters to THEM. What breaks if they ignore it.
3. **VALUE** (slides 3–7) — the actual teaching. Faceless AI content, recurring
   vs one-time income, affiliate mechanics, AI replacement fear, system
   critique — pull from the 7 rotating angles in brand memory. Pack real
   value, not teasers.
4. **RECEIPTS** (second-to-last) — proof. Community wins, Freedom Fund
   entrants, platform milestones. NEVER a specific personal dollar income
   claim. Freedom Fund is always "$10,000 monthly, community-voted" — never
   "no loan, no equity".
5. **CTA** (final slide) — ONE word, comment-triggered. `EBOOK` for the
   Faceless AI Affiliate ebook; otherwise from the live rotation: FREEDOM /
   ESCAPE / SYSTEM / FOUNDING / FREE / IN / BLUEPRINT.

## Process — copy BEFORE design, always

1. **Write the copy first.** Slide by slide, in chat, as plain text. Show it to
   the user before generating any HTML or image. Get explicit lock-in on the
   hook slide before proceeding — 80% of iteration time goes here and that is
   expected, not a problem. Offer 3 hook options when the angle is new.
2. **Hook slide art.** If the slide calls for Morphe (mirrored sunglasses,
   hooded jacket, never a face), hand off to Higgsfield — never render a person
   in HTML. See "Hook slide via Higgsfield" below.
3. **Write the deck JSON** to `decks/<YYYY-MM-DD>-<slug>.json` once the hook is
   locked, then build all remaining slides in one pass.
4. **QA every slide.** `node scripts/build.mjs` runs the compliance and
   structure rules; `node scripts/render.mjs` adds the layout pass (text
   overlap, auto-fit floor, dead space) measured in a real browser. Fix what it
   reports, re-run, and tell the user what was fixed — don't silently pass.
5. **Grid preview.** Open `output/<date>-<slug>/grid.html` — the set as a swipe
   strip and as it lands on the Instagram grid, with the caption and the QA
   table. Review before export.
6. **Export.** `render.mjs` writes numbered PNGs to `output/<date>-<slug>/`,
   1080x1440, ready to airdrop or drop into Buffer.

## Commands

```bash
node scripts/build.mjs  decks/2026-07-27-permission-slip.json   # HTML + compliance QA + preview
node scripts/render.mjs decks/2026-07-27-permission-slip.json   # builds, then exports PNGs + layout QA
node scripts/render.mjs output/2026-07-27-permission-slip       # re-export after a CSS tweak
node scripts/angle-report.mjs                                   # which angle actually converts
```

`build.mjs` exits non-zero on any compliance error, so a non-compliant deck
cannot be exported by accident. `--force` overrides — only with the user
saying so explicitly.

## Deck JSON

Copy `decks/TEMPLATE.json`. Fields:

| Field | Notes |
|---|---|
| `slug`, `date` | Output goes to `output/<date>-<slug>/` |
| `angle` | One of the 7 rotating angles — this is the attribution key later |
| `trigger` | Comment word. `BLUEPRINT` for the Blueprint magnet |
| `slides[].type` | `hook` \| `stakes` \| `value` \| `receipts` \| `cta` |
| `slides[].kicker` | Small letterspaced label naming the beat |
| `slides[].headline` | All-caps display type, auto-fits. `\n` forces a line break — stack 2-3 lines |
| `slides[].copy[]` | Body paragraphs |
| `slides[].rows[]` | Accent-bar cards `{ t, s }`. `numbered: true` for a ranked list |
| `slides[].flow[]` | Step chain `{ k, t, s }`. Three steps run across, four or more stack |
| `slides[].big` | Oversized number `{ value, label, sub }` — one idea, unscrollable |
| `slides[].figure` | Image in a card `{ image, caption, ratio, cover }`. `ratio` sizes the card to the art; `cover: true` crops instead of fitting |
| `slides[].stats` | Chart card `{ caption, items:[{ label, value, bar, muted }] }` |
| `slides[].tiles[]` | Stat tiles `{ value, label }` — two or three, no more |
| `slides[].pull` | Centred takeaway line |
| `slides[].pill` | Action pill `{ before, word, text }` or `{ text, ghost: true }` |
| `slides[].image` | Hook/CTA art, relative to the slide HTML (`../../../assets/...`) |
| `slides[].trigger` | CTA slide only — must equal the deck trigger |
| `caption`, `hashtags[]` | `Comment <WORD>` must be in the first 125 chars |

Inline markup: `[[green]]`, `{{yellow}}`, `((boxed))`, `**bold**`, `\n` line break.

**Choosing a block.** A value slide is stronger as three `rows` than as a
paragraph — the decks that work are lists, diagrams and charts, not prose. Use
`flow` for a process, `rows` for criteria, `stats` for a comparison, `big` for
the one rule you want remembered, `figure` for a diagram, `tiles` for two or
three hard numbers, `pull` for the line you want quoted back to you. One block
per slide, and vary the block from slide to slide — nine card-lists in a row is
as monotonous as nine paragraphs.

**Line breaks are yours.** A `\n` in a headline is a hard break: the renderer
holds it and shrinks the type rather than re-wrapping where the browser prefers.
Break the line where the sentence breathes.

## Hook slide via Higgsfield

1. `select_workspace` → the One Club workspace, then `balance` — credits are
   finite, check before promising a set of variations.
2. Reference the Morphe avatar/element. As of 2026-07-27 the workspace
   (`55f32a4c-6ecc-4800-97f9-e307e8c15ce3`) has **no trained Soul characters and
   no media matching `7f5bb224`** — the IDs in the original build brief do not
   resolve there. Ask the user for the current reference (or upload one via
   `media_upload_widget`) rather than generating a generic person.
3. **Be explicit about what to exclude.** This is the single biggest failure
   point. Every hook prompt states: no floating unattached icons, no text or
   lettering rendered in the image, no visible face, no mismatched lighting,
   subject occupies the right two-thirds, left third clear and unbusy for the
   text overlay, pure black background, matrix-green rim light only.
4. `get_cost: true` first. Then generate 3 variations, show them, let the user
   pick one, lock it — THEN build the rest of the set around it.
5. Model: **GPT Image 2** for hook stills (text-on-image precision).
   Higgsfield/Seedance stay reserved for video. Cost check on 2026-07-27:
   `gpt_image_2`, 3:4, 3 variations at default quality = **0.5 credits**;
   workspace balance was **3 credits**, so quality/resolution upgrades are the
   thing to price before promising them.
6. Save the pick to `assets/<slug>-hook.png`, point `slides[0].image` at it,
   re-render. Hook and CTA slides compose correctly on pure black if the art
   isn't ready yet — ship the copy, drop the art in later.

## Compliance guardrails (enforced in code — `scripts/lib/compliance.mjs`)

- No specific dollar figures as personal income results
- No outcome guarantees, no "risk-free", no earnings promises
- Freedom Fund = "$10,000 monthly, community-voted" — never "no loan, no equity"
- Emotional hooks only, never income claims
- Pre-launch framing: "we're building this"
- Write forward — 2026+, never a past year
- Avoid: hustle, grind, synergy, leverage

Warnings ship; errors block. If the user wants a warning overridden, that's
their call — say it's overridden, don't quietly drop it.

## After the export

The carousel is one link in the chain. Hand off per `automation/`:
Buffer (schedule) → comment → ManyChat (DM + tag) → Brevo (email + Blueprint)
→ Founding 500. Log the post in `automation/engagement-log.csv` when it goes
up, fill in views/comments/saves weekly, and run `angle-report.mjs` — after
five carousels it starts telling you which angle to write next. Data beats
design.
