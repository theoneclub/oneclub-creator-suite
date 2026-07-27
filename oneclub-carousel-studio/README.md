# One Club Carousel Studio

Viral carousel engine for The One Club. Deck JSON in, branded 1080×1440 PNGs
out, with compliance and layout QA in between — no Canva, no manual slide
assembly.

Carousels are the funnel's front door: ~7× the views of a reel, ~42× the
comments, ~18× the saves. Comments fire the ManyChat trigger → DM → Brevo →
Founding 500. **The slides exist to make one person type one word.**

## Quick start

```bash
cd oneclub-carousel-studio

node scripts/build.mjs  decks/2026-07-27-permission-slip.json   # HTML + compliance QA + grid preview
node scripts/render.mjs decks/2026-07-27-permission-slip.json   # build, then export PNGs + layout QA
node scripts/render.mjs output/2026-07-27-permission-slip       # re-export after a CSS tweak
node scripts/angle-report.mjs                                   # which angle actually converts

# from the repo root, the same three:
npm run carousel:build  -- decks/2026-07-27-permission-slip.json
npm run carousel:render -- decks/2026-07-27-permission-slip.json
npm run carousel:report
```

Chromium comes from Playwright, already present in this environment. On a fresh
machine: `npm i -D playwright && npx playwright install chromium`.

## Layout

```
oneclub-carousel-studio/
├── .claude/skills/carousel-generator/SKILL.md   the skill Claude follows
├── ds-bundle-morphe/        design bundle — pulled once, reused forever
│   ├── design-spec.md       what the look is and why
│   ├── tokens.css           locked palette + type scale
│   ├── carousel.css         slide layouts and blocks
│   └── fonts/               Anton, Bebas Neue, Inter (self-hosted)
├── decks/                   deck JSON — the source of truth for a carousel
│   ├── TEMPLATE.json
│   └── 2026-07-27-permission-slip.json
├── scripts/
│   ├── build.mjs            deck → slide HTML + grid preview + compliance QA
│   ├── render.mjs           slide HTML → PNGs + layout QA
│   ├── angle-report.mjs     engagement log → which angle to write next
│   └── lib/{template,compliance}.mjs
├── assets/                  Morphe hook art, screenshots, graphs
├── automation/              ManyChat / Brevo / Buffer runbooks + engagement log
└── output/<date>-<slug>/    slide-01.png … + caption.txt + grid.html + qa-report.json
```

## How a carousel gets made

1. **Copy first, always.** Five beats — hook, stakes, value, receipts, CTA.
   The hook is 80% of the result; nothing gets designed until it is locked.
2. **Hook art** via Higgsfield (Morphe: mirrored sunglasses, hooded jacket,
   never a face). Three variations, pick one, then build the set around it.
3. **Deck JSON** → `build.mjs`. Every slide is assembled from the same block
   vocabulary: headline, copy, row cards, stat panel, stat tiles, pull line,
   action pill.
4. **QA runs itself.** Compliance rules are code, not a checklist — dollar
   figures, guarantees, Freedom Fund framing, stale years, trigger-word
   collisions, caption above-the-fold placement. Layout QA measures real
   overflow in a headless browser. Errors block the export.
5. **Grid preview** — `output/<deck>/grid.html` shows the swipe order, how the
   set lands on the Instagram grid, the caption, and the QA table.
6. **Export** → numbered PNGs, ready for Buffer.

Then the loop in `automation/`: Buffer → comment → ManyChat DM + tag → Brevo
opt-in + Blueprint → Founding 500, with the weekly numbers coming back into
`engagement-log.csv` so `angle-report.mjs` can tell you what to write next.

## Deck JSON in one screen

```jsonc
{
  "slug": "permission-slip", "date": "2026-07-27",
  "angle": "System Critique & Economic Grievance",
  "trigger": "BLUEPRINT",              // carousels only — keeps reel triggers clean
  "slides": [
    { "type": "hook",   "kicker": "...", "headline": "Line one\nline ((two))",
      "image": "../../../assets/x-hook.png",
      "tiles": [{ "value": "$10,000", "label": "Community-voted, monthly" }],
      "pill":  { "text": "Swipe →", "ghost": true } },
    { "type": "stakes", "headline": "...", "copy": ["..."] },
    { "type": "value",  "headline": "...", "rows": [{ "t": "Title", "s": "Sub" }] },
    { "type": "value",  "headline": "...",
      "stats": { "caption": "...", "items": [{ "label": "Recurring", "value": "4", "bar": 4 }] },
      "pull": "One line that lands." },
    { "type": "receipts", "headline": "...", "rows": [...] },
    { "type": "cta", "trigger": "BLUEPRINT",
      "pill": { "before": "Comment", "word": "BLUEPRINT", "text": "↓" } }
  ],
  "caption": "Comment BLUEPRINT and I'll send you the exact playbook. 🔒 ...",
  "hashtags": ["#facelessmarketing", "..."]
}
```

Inline markup: `[[green]]`, `{{yellow}}`, `((boxed))`, `**bold**`, `\n` for a
line break in a headline.

## Rules that are enforced, not suggested

- No dollar figures as personal income results
- No outcome guarantees, no "risk-free", no earnings promises
- Freedom Fund = "$10,000 monthly, community-voted" — never "no loan, no equity"
- Write forward: 2026+, never a past year
- The CTA slide carries exactly one rotation word — the deck's own
- `Comment <WORD>` appears in the caption's first 125 characters

`build.mjs` exits non-zero when any of these break. `--force` overrides, and
should be a deliberate decision, not a habit.
