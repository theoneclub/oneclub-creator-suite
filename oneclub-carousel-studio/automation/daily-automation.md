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
4. Write a new deck at `decks/<today>-<angle-slug>.json`:
   - `trigger: "BLUEPRINT"`, CTA `product.image: "../../../assets/ebook-blueprint.png"`,
     button text `Comment "BLUEPRINT" and I'll send it over` (match the live deck's exact
     wording — see `decks/2026-08-06-faceless-ai-affiliate.json` as the quality/format bar).
     The button font auto-scales to the trigger word's length (`scripts/lib/template.mjs`,
     `button()`), so a longer or shorter word than "BLUEPRINT" won't wrap or need a manual
     font-size tweak.
   - 5-8 slides, the 5-beat structure (hook, stakes, value x2-4, receipts, cta) per
     `.claude/skills/carousel-generator/SKILL.md`.
   - Apply the `social` skill's hook formulas and carousel architecture, the
     `copywriting` skill's clarity/specificity rules, and the `post-grader` skill's
     voice-rules audit (digits not words, zero em dashes, no filler words/openers,
     active voice, contractions) while drafting. Grade the hook mentally against
     post-grader's rubric before finalizing — weak hooks get rewritten, not shipped.
   - Reuse existing SVG mocks under `assets/` where the shape already fits (e.g.
     `tip-vs-paycheck.svg`, `market-size.svg`, `faceless-formats.svg`) rather than
     building new art. Only add a new mock panel via `scripts/make-mocks.mjs` if the
     angle genuinely needs one no existing asset covers.
   - Brand persona: Morphe — hooded, mirrored sunglasses, never a face, matrix-green
     `#a3f0af` on black, anti-establishment voice, pre-launch framing ("we're
     building this"). `assets/faceless-figure.jpg` is the only real photo asset for
     a hooded figure — reuse it for the hook if a photo fits.
5. `node scripts/build.mjs decks/<slug>.json` — must come back clean (warnings ok,
   zero errors). Fix and rerun until clean; never ship on `--force`.
6. `node scripts/render.mjs output/<slug>` — every slide must hit fit 1.00 with no
   overflow. Fix and rerender until clean.
7. Check off the angle in `automation/angle-backlog.md` and append a row under
   "Shipped": `date | slug | angle | BLUEPRINT`.
8. Commit (deck JSON + any new/changed assets) and push to
   `claude/oneclub-carousel-automation-02vsrn`.
9. Send the rendered PNGs to the user (`SendUserFile`, status `proactive` since
   they didn't ask for this specific run). Caption: the angle used, and a reminder
   that this deck still needs its own `carousel:<slug>` tag added to the existing
   `BLUEPRINT` ManyChat automation before posting live (see `automation/manychat.md`
   section 3) — that step isn't automated, there's no ManyChat/Buffer connection in
   this environment.

## Guardrails

- Never auto-post to Instagram, Buffer, or ManyChat. Draft generation only.
- Never reuse a slug or an angle already present in `decks/`.
- Never ship a deck with compliance errors, `--force`, or layout overflow.
- If three consecutive firings fail QA on the same root cause, stop and leave a
  clear note in the session rather than retrying blindly — that's a signal
  something upstream (a skill, a template, an asset) needs a human look.
