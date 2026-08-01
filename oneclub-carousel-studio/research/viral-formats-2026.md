# What's actually working — research log

Pulled 2026-07-29. Redo this quarterly; hook patterns decay.

## Sources

1. **vidIQ outlier search** — Instagram + TikTok posts that beat their own creator's
   median by 20x–400x, filtered to this exact niche (faceless / AI / affiliate /
   side income, English, last 30 days). This is the strongest signal here because
   it is normalised per creator: a 41x outlier on a 43K account is a format
   winning, not an audience winning.
2. **2026 carousel benchmark write-ups** — swipe-through and save-rate norms,
   slide-count data, hook-length data. Listed at the bottom.
3. **X** — searched, thin. X surfaces its own carousel *ad* documentation, not
   creator format breakdowns. Not worth re-running; the outlier data covers it.

## The hook patterns that produced outliers

Ranked by how well they transfer to a compliant One Club carousel.

| Pattern | Real example (outlier multiple) | Our version |
|---|---|---|
| **Contrarian negation** — "Most people don't need X, they need Y" | "most people don't need another business idea. they need a faster way to turn the ideas they already have into…" (20.2x) | "Nobody needs your face. They need the demo." |
| **Belief correction** — "Most people think X" | "Most people think they need to learn something completely different to create more options…" (41.8x) | "Most pick their offer in four minutes." |
| **❌ / ✅ binary** — two states, one frame | "Part Time Job ❌ / Kids YouTube + AI ✅" (29.9x, and 374.7x on a 365-follower account) | The `versus` block, now on four of the five decks |
| **"Without" framing** — the objection, pre-answered | "I found a way to start online without creating my own product" (31.4x) | "No face. No following. No product of your own." |
| **Reframe of failure** — "X isn't Y, it's Z" | — | "Your first 30 posts aren't content — they're data." |
| **Presupposition** — "Stop doing X" | — | "Stop adding offers. It's a focus problem." |
| **Counted resource** — "here are the 7 prompts I used" | "…here are the exact prompts I used" (20.2x); "Here are the 7 prompts" (41.8x) | The comment-trigger CTA does this job: a named, finite asset |
| **Time-stamped specificity** | "47 minutes later, I had one listed. 7 weeks later…" (20.2x) | "in four minutes", "ninety days", "weeks 3–8" |

**The single most repeated device across the winners is a concrete number in the
first three seconds** — minutes, prompts, steps, posts. Not adjectives.

## The constraint that separates us from the outlier set

Almost every top performer leads with an income figure: `$7.5k`, `$1,000 a month`,
`10k/month`. **We cannot and do not.** Compliance blocks it, and the checker in
`scripts/lib/compliance.mjs` will fail the build.

The substitutes that carry the same specificity without the claim:

- **Time** — "four minutes", "an afternoon", "ninety days"
- **Counts** — "3 questions", "30 posts", "4 referrals", "1 offer"
- **Ratios and comparisons** — recurring vs one-time at month 12, no units attached
- **Named artefacts** — "the exact checklist", "the format breakdown"

A hook built on time and counts tests nearly as well as one built on dollars, and
it is the only version we can actually run.

## Structural benchmarks

- **Hook headline: 5–8 words.** Longer and it auto-shrinks, which is exactly when
  it stops punching. Now a QA warning past 10 words.
- **Slide 1 carries ~80% of the outcome.** Everything else is downstream of it.
- **Swipe-through slide 1 → 2: 60–75%** is healthy. Under 50% means the hook failed.
- **Save rate 1.5–3%** of impressions is strong for educational carousels. Under
  0.5% means the value slides aren't earning their slot.
- **5–7 slides** reportedly drive ~3.4x the saves of a static image; 8–10 is the
  other commonly cited sweet spot. Both work — the five-slide alternates and the
  nine-slide playbook sit at either end deliberately.
- **Hold the payoff back.** Put the most useful slide second-to-last, not third.
  Readers swipe to reach it and save the post to finish later. Our `receipts` slot
  now carries the most actionable content in every deck rather than brand proof.

## What changed in the decks because of this

- All five hooks rewritten onto a named pattern above; each now leads with a
  number or a negation, and all sit inside the 5–8 word band.
- The parenthetical sub-line kept — it mirrors "(for growing your brand)" in the
  reference and gives the hook a second beat without a second headline.
- New `versus` block for the ❌/✅ device, used on the stakes slide where the
  reader's current behaviour can be contrasted with the swap.
- `receipts` reframed from brand proof to the most useful slide in the deck.
- Compliance gained a hook-length rule so this decays loudly, not silently.

## Sources

- [How to Make Instagram Carousels That Actually Get Saved (2026)](https://viraly.io/blog/how-to-make-instagram-carousels)
- [Instagram Carousel Best Practices (2026): Slide-by-Slide Design for Saves and Shares](https://www.adpicto.com/en/blog/instagram-carousel-best-practices-2026)
- [Instagram Carousel Best Practices 2026: 12 Rules That Drive Saves](https://carouselli.com/blog/instagram-carousel-best-practices)
- [Best Hooks for Instagram Carousel That Make People Swipe](https://resont.com/blog/top-instagram-carousel-hooks/)
- [Carousel Copywriting: The Complete Conversion Framework](https://postnitro.ai/blog/post/carousel-copywriting-framework)
- [30 Carousel Hook Examples That Stop the Scroll](https://contentdrips.com/blog/2026/06/carousel-hook-examples/)
- [Instagram Carousel Strategy 2026](https://www.truefuturemedia.com/articles/instagram-carousel-strategy-2026)
- vidIQ outlier search (Instagram + TikTok), niche-filtered, 2026-07-29 — not a public URL
