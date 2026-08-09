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
- [ ] **The tools, not the tool** — what AI actually does in the workflow (script drafting,
      voiceover, scheduling) without naming or endorsing specific paid products.
- [ ] **Vet the offer before you promote it** — a checklist format: commission rate, recurring
      or not, cookie duration, payout minimum. Teach the reader to evaluate any offer, not
      just this one.
- [ ] **A day in the actual routine** — what 30-60 minutes of this looks like on a normal day.
      Grounds the "faceless" claim in something concrete instead of an abstraction.
- [ ] **No audience, cold reach** — go deeper than slide 3 of `faceless-ai-affiliate`: how a
      single post reaches strangers via discovery, not followers. Different proof, same claim.
- [ ] **The flat month vs the compounding month** — month 1 looks identical whether someone
      quits after it or not. Month 12 doesn't. A visual on delayed payoff, no new SVG needed
      if `tip-vs-paycheck.svg`'s shape still fits — reuse before building new art.
- [ ] **Red flags in an affiliate program** — reverse framing: what disqualifies an offer
      (no minimum payout transparency, short cookie window, one-time only). Teaches by
      exclusion instead of endorsement.
- [ ] **You don't need a niche, you need a translator** — reframes "I have no expertise" by
      positioning the poster as translating a tool for a beginner, not as an authority.
- [ ] **What actually breaks first** — the realistic failure mode (posting twice and quitting)
      stated bluntly, paired with the fix (a publishing rhythm, not more research).

## Shipped

<!-- Append one row per post, newest first:
     date | slug | angle | trigger | slides | block types | assets used
     The next firing reads the last 3 rows (daily-automation.md step 4) and must not
     repeat their slide count, hook treatment, or primary visual block type. Keep this
     column filled in, or that check has nothing to work from. -->

2026-08-09 | not-a-pyramid-scheme | Faceless AI Affiliate Marketing: answering the pyramid scheme objection | BLUEPRINT | 6 | hook: photo+quoted objection; versus; flow | faceless-figure.jpg, ebook-blueprint.png
2026-08-09 | side-hustle-math | Faceless AI Affiliate Marketing: side-hustle math | BLUEPRINT | 5 | hook: text-only; figure; flow | twelve-month-stack.svg, ebook-blueprint.png
2026-08-06 | faceless-ai-affiliate | Faceless AI Affiliate Marketing: $22B market, $30B by 2030, and why AI made it easier | BLUEPRINT | 6 | hook: photo; mock; figure; flow | faceless-figure.jpg, market-size.svg, faceless-formats.svg, program-check.svg, ebook-blueprint.png
