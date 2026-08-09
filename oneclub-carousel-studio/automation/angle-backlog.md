# Angle backlog — daily automation

Source list for the 3x/day carousel automation (see `automation/daily-automation.md`).
Each firing picks the next unchecked angle, builds a full deck around it, checks it off,
and appends a row here noting the slug it shipped as. All decks share the theme
("Faceless AI Affiliate Marketing"), the `SYSTEM` trigger, and the same ebook lead
magnet — only the hook, proof point, and analogy change per post. Checked-off angles
also cross-reference existing decks under `decks/` — never regenerate one already used.

Before picking the next angle: `ls decks/` and skim slugs/angles already shipped
(`node -e "..."` one-liner in the daily-automation doc works) so this file and reality
never drift apart.

## Unused

- [ ] **Side-hustle math** — compare trading an hour for a fixed rate (rideshare, delivery)
      against one post that keeps earning. Hook: a specific hourly-wage number, not a claim
      about this business's income.
- [ ] **"Isn't this a pyramid scheme?"** — answer the objection directly. No recruiting, no
      downline, no one below you. You get paid for a sale, not for signing people up.
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

<!-- Append one row per post, newest first: date | slug | angle | trigger -->
