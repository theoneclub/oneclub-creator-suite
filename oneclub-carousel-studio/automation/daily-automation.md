# Daily carousel automation

Fires 3x/day via a Routine. Each firing produces ONE new draft carousel — not a
publish, a draft. Nothing goes to Instagram automatically; the user reviews and
posts manually, same as every carousel before this.

## What each firing does

1. `cd oneclub-carousel-studio`, confirm on branch `claude/oneclub-carousel-automation-02vsrn`
   (`git fetch origin claude/oneclub-carousel-automation-02vsrn && git checkout claude/oneclub-carousel-automation-02vsrn && git pull`).
2. Read `automation/angle-backlog.md`. Take the first unchecked angle. If the list is
   exhausted, invent a new on-theme angle (same rules: faceless AI affiliate marketing,
   no personal income claims) and add it to the file before using it.
3. Check `decks/` for slugs and angles already shipped so this never duplicates a deck
   that exists:
   ```
   for f in decks/*.json; do node -e "try{const d=require('./\$f'); console.log(d.slug,'|',d.angle)}catch(e){}"; done
   ```
4. **Check the last 3 rows of the "Shipped" table in `automation/angle-backlog.md`** and
   note their slide count, block types, and visual assets. This firing's deck must differ
   from ALL of the last 3 on every axis below — three posts a day landing on the same
   layout is the thing this step exists to prevent. If the backlog log is missing the
   structure notes for recent rows (older entries, before this rule existed), open those
   decks' JSON directly and check.
5. Write a new deck at `decks/<today>-<angle-slug>.json`:
   - `trigger: "BLUEPRINT"`, CTA `product.image: "../../../assets/ebook-blueprint.png"`,
     button text `Comment "BLUEPRINT" and I'll send it over` (match the live deck's exact
     wording — see `decks/2026-08-06-faceless-ai-affiliate.json` as the quality/format bar).
     The button font auto-scales to the trigger word's length (`scripts/lib/template.mjs`,
     `button()`), so a longer or shorter word than "BLUEPRINT" won't wrap or need a manual
     font-size tweak.
   - **Slide count**: pick a different total than the last 3 shipped decks. Valid range
     is 5-8 per beat structure below.
   - **The 5-beat structure is fixed** (hook, stakes, value x1-4, receipts second-to-last,
     cta last, per `.claude/skills/carousel-generator/SKILL.md`) but everything inside
     each beat is a choice. Vary:
     - **Hook slide**: photo (`assets/faceless-figure.jpg`, vignette scrim) vs. text-only
       vs. a quoted objection (see `not-a-pyramid-scheme` for the quoted-objection pattern).
       Don't repeat whichever one the last shipped deck used.
     - **The main visual block on stakes/value/receipts slides** — pick from this list,
       and don't reuse the same block type on two of a deck's own slides OR repeat the
       type any of the last 3 shipped decks leaned on most:
       - `mock` — a 620x1300 SVG panel (chart, checklist, comparison) in the side column
       - `figure` — a wider inline image with a caption, for horizontal diagrams
       - `versus` — a ❌/✅ two-column comparison (`not-a-pyramid-scheme` slide 2)
       - `flow` — numbered steps, horizontal (≤3 items) or stacked (4+)
       - `tiles` — a row of stat/value cards (`{ value, label }`), optionally with icons
         (`tiles--icon` triggers automatically when any tile has an `icon` field, one of:
         eye, bag, calendar, target, doc, users, gear, bolt, chart, vote, lock, seed)
       - `cards` — a chained icon list with a connector line, ending in an optional flag
       - `panel`/`stats` — a labelled stat block with items and an optional caption
       - `big` — one oversized number as the whole visual moment (`{ value, label, sub }`)
       - text-only, no visual block at all — a legitimate choice, not a fallback
     - **Visual assets**: reuse an existing SVG under `assets/` when its shape genuinely
       fits the new angle (list them: `market-size.svg`, `tip-vs-paycheck.svg`,
       `faceless-formats.svg`, `twelve-month-stack.svg`, `program-check.svg`,
       `quit-curve.svg`, `ninety-day-heatmap.svg`, `thirty-posts-grid.svg`,
       `tab-graveyard.svg`, `week-one-calendar.svg`, `comment-to-inbox.svg`,
       `script-template.svg`, `no-requirements.svg`, `model-compare.svg`,
       `face-vs-faceless.svg`) — but don't reuse the same asset two firings in a row.
       If nothing fits, build a new panel via `scripts/make-mocks.mjs` (follow its
       existing helper patterns: `svg()`, `chrome()`, `intro()`, `footer()`) rather than
       forcing an ill-fitting asset onto the angle.
   - Apply the `social` skill's hook formulas and carousel architecture, the
     `copywriting` skill's clarity/specificity rules, and the `post-grader` skill's
     voice-rules audit (digits not words, zero em dashes, no filler words/openers,
     active voice, contractions) while drafting. Grade the hook mentally against
     post-grader's rubric before finalizing — weak hooks get rewritten, not shipped.
   - Brand persona: Morphe — hooded, mirrored sunglasses, never a face, matrix-green
     `#a3f0af` on black, anti-establishment voice, pre-launch framing ("we're
     building this"). `assets/faceless-figure.jpg` is the only real photo asset for
     a hooded figure.
6. `node scripts/build.mjs decks/<slug>.json` — must come back clean (warnings ok,
   zero errors). Fix and rerun until clean; never ship on `--force`.
7. `node scripts/render.mjs output/<slug>` — every slide must hit fit 1.00 with no
   overflow or clipping. Fix and rerender until clean.
8. Check off the angle in `automation/angle-backlog.md` and append a row under
   "Shipped": `date | slug | angle | BLUEPRINT | <slide count> | <block types used> | <assets used, or "none">`.
   This structure column is what step 4 reads on the next firing — leaving it blank
   defeats the whole point of this rule.
9. Commit (deck JSON + any new/changed assets) and push to
   `claude/oneclub-carousel-automation-02vsrn`.
10. Send the rendered PNGs to the user (`SendUserFile`, status `proactive` since
   they didn't ask for this specific run). Caption: the angle used, and a reminder
   that this deck still needs its own `carousel:<slug>` tag added to the existing
   `BLUEPRINT` ManyChat automation before posting live (see `automation/manychat.md`
   section 3) — that step isn't automated, there's no ManyChat/Buffer connection in
   this environment.

## Guardrails

- Never auto-post to Instagram, Buffer, or ManyChat. Draft generation only.
- Never reuse a slug or an angle already present in `decks/`.
- Never ship a deck with compliance errors, `--force`, or layout overflow.
- Never repeat the slide count, hook treatment, or primary visual block type of any of
  the last 3 shipped decks (step 4). Three posts a day in the same layout reads as one
  templated post copy-pasted, not three different ones — this is a hard rule, not a
  nice-to-have. But variety is never a reason to ship a slide with nothing real on it —
  a `tiles`/`note`-screenshot-this slide that just restates a number already shown two
  slides earlier is worse than repeating a block type. If the angle doesn't naturally
  fill a fresh block type with something worth a reader's attention, pick a different
  fresh block, or fall back to text — never pad a slide just to hit the variety quota.
  (`tools-not-the-tool` shipped its first version with exactly this problem: `tiles`
  showing "3 tools, total" and "1 prompt to start" on a receipts slide already headlined
  "screenshot this," when there was nothing in it worth saving. Fixed by replacing it
  with an actual reusable test — "will you still be opening it in a week?" — instead of
  restating the number from slide 2.)
  nice-to-have.
- If three consecutive firings fail QA on the same root cause, stop and leave a
  clear note in the session rather than retrying blindly — that's a signal
  something upstream (a skill, a template, an asset) needs a human look.
