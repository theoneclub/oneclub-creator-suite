# Angle backlog — daily automation

Source list for the 3x/day carousel automation (see `automation/daily-automation.md`).
Each firing picks the next unchecked angle, builds a full deck around it, checks it off,
and appends a row here noting the slug it shipped as. All decks share the theme
("Faceless AI Affiliate Marketing"), the `BLUEPRINT` trigger, and the same ebook lead
magnet — only the hook, proof point, and analogy change per post. Checked-off angles
also cross-reference existing decks under `decks/` — never regenerate one already used.

Before picking the next angle: `ls decks/` and skim slugs/angles already shipped
(`node -e "..."` one-liner in the daily-automation doc works) so this file and reality
never drift apart.

## Unused

- [x] **Side-hustle math** — shipped as `side-hustle-math` (2026-08-09). Dropped the
      hourly-wage number entirely — the money-claim compliance rule flags any `$` figure
      regardless of whose income it is, so the comparison runs on "pays once vs. pays on
      repeat" instead of a dollar amount.
- [x] **"Isn't this a pyramid scheme?"** — shipped as `not-a-pyramid-scheme` (2026-08-09).
      Used the `versus` block (❌/✅ side-by-side) for the first time in this campaign —
      fits objection-handling angles better than a chart.
- [x] **The tools, not the tool** — shipped as `tools-not-the-tool` (2026-08-09). First deck
      to use `big`, `cards`, and `panel`/`stats` — none of which had appeared yet. Hook
      reuses `tab-graveyard.svg` as full-bleed art instead of the real photo or text-only.
      Originally also used `tiles` on the receipts slide, but the content was thin (just
      restated the "3" from slide 2) despite the "screenshot this" note next to it —
      replaced with a real reusable test instead. See the guardrails note in
      daily-automation.md: variety is never a reason to ship a slide with nothing on it.
- [x] **Vet the offer before you promote it** — shipped as `vet-the-offer` (2026-08-10). New
      `tiles` intro (icon numbered checks) plus a fresh scorecard mock (`offer-scorecard.svg`),
      distinct from `program-check.svg`'s gut-check questions — this one is the actual terms
      (commission rate, recurring, cookie window, payout minimum).
- [ ] **A day in the actual routine** — what 30-60 minutes of this looks like on a normal day.
      Grounds the "faceless" claim in something concrete instead of an abstraction.
- [ ] **No audience, cold reach** — go deeper than slide 3 of `faceless-ai-affiliate`: how a
      single post reaches strangers via discovery, not followers. Different proof, same claim.
- [ ] **The flat month vs the compounding month** — month 1 looks identical whether someone
      quits after it or not. Month 12 doesn't. A visual on delayed payoff, no new SVG needed
      if `tip-vs-paycheck.svg`'s shape still fits — reuse before building new art.
- [x] **Red flags in an affiliate program** — shipped as `red-flags-in-an-offer`
      (2026-08-31). First deck in the new **Editorial** style (see
      `automation/visual-styles.md`): zero imagery on any slide, pure typography.
      Trimmed to four flags, not five, to fit an 8-slide deck — the hook headline
      had to be corrected to match once that scope changed, a live example of why
      slide count and content have to agree before copy locks.
- [ ] **You don't need a niche, you need a translator** — reframes "I have no expertise" by
      positioning the poster as translating a tool for a beginner, not as an authority.
- [ ] **What actually breaks first** — the realistic failure mode (posting twice and quitting)
      stated bluntly, paired with the fix (a publishing rhythm, not more research).

## Shipped

<!-- Append one row per post, newest first:
     date | slug | angle | trigger | style | slides | block types | assets used
     The next firing reads the last 3 rows (daily-automation.md step 4) for structure
     and the last 2 rows' `style` (visual-styles.md) for the visual system. Keep both
     filled in, or those checks have nothing to work from. -->

2026-08-31 | red-flags-in-an-offer | Faceless AI Affiliate Marketing: red flags in an affiliate program | BLUEPRINT | Editorial | 8 | hook: text-only; text-only throughout, no imagery | ebook-blueprint.png
2026-08-31 | faceless-loop-system | Faceless AI Affiliate Marketing: it was never the tool, it's the loop | BLUEPRINT | Scene | 10 | hook: text-only; full-bleed scene art on every slide (no mock/figure/tiles) | scene-loop.svg, scene-triloop.svg, scene-cardstack.svg, scene-oneangle.svg, scene-mask.svg, scene-gauge.svg, scene-repeatgrid.svg, scene-broadcast.svg, scene-loop-bright.svg, scene-cta-glow.svg, ebook-blueprint.png
2026-08-10 | vet-the-offer | Faceless AI Affiliate Marketing: vet the offer before you promote it | BLUEPRINT | Signature | 6 | hook: photo; tiles; text-only; mock | faceless-figure.jpg, offer-scorecard.svg, ebook-blueprint.png
2026-08-09 | tools-not-the-tool | Faceless AI Affiliate Marketing: the tools, not the tool | BLUEPRINT | Signature | 7 | hook: illustrated full-bleed (tab-graveyard.svg); big; cards; panel/stats | tab-graveyard.svg, ebook-blueprint.png
2026-08-09 | not-a-pyramid-scheme | Faceless AI Affiliate Marketing: answering the pyramid scheme objection | BLUEPRINT | Signature | 6 | hook: photo+quoted objection; versus; flow | faceless-figure.jpg, ebook-blueprint.png
2026-08-09 | side-hustle-math | Faceless AI Affiliate Marketing: side-hustle math | BLUEPRINT | Signature | 5 | hook: text-only; figure; flow | twelve-month-stack.svg, ebook-blueprint.png
2026-08-06 | faceless-ai-affiliate | Faceless AI Affiliate Marketing: $22B market, $30B by 2030, and why AI made it easier | BLUEPRINT | Signature | 6 | hook: photo; mock; figure; flow | faceless-figure.jpg, market-size.svg, faceless-formats.svg, program-check.svg, ebook-blueprint.png
