# Visual styles — rotating the look, not just the content

Structural variety (`daily-automation.md` step 4) keeps slide count, hook
treatment and block type from repeating across the last 3 decks. That rule
governs *content* structure. This file governs the *visual system* — the
whole deck's look, not one slide's block — and it rotates independently on
the same principle: **don't ship the same visual style as the last 2 decks.**

Every deck picks ONE style below and stays in it for all 10 (or 5-8) of its
own slides. Mixing styles inside one deck is not itself a style.

## The styles

### Signature (`faceless-ai-affiliate`, `vet-the-offer`)
The original house look. Photo hook (`faceless-figure.jpg` — see the note on
that asset below), `mock`/`figure` blocks running SVG UI panels
(`market-size.svg`, `offer-scorecard.svg`) in a split layout, text-heavy
value slides with no background art. Reads as a product/system explainer.

### Scene (`faceless-loop-system`)
Full-bleed abstract art on every slide via `scripts/make-scene-art.mjs` —
one purpose-built composition per slide (a loop glyph, a flow diagram, a
gauge), not a photo or a UI mock. Reads as bold and graphic. Heaviest to
produce: each new deck in this style needs new scene compositions, or reuses
existing `scene-*.svg` files only when their metaphor genuinely fits the new
angle — don't force a gauge or a card-stack onto content it wasn't drawn for.

### Editorial (new)
No imagery anywhere. Every slide is `text-only` — headline, copy, and the
existing typographic devices (`label` pill, `pull` quote, `big` number,
`{{accent}}` words) doing 100% of the work. Reads as stark and confident, the
opposite of Scene's graphic density. Fastest to produce (no new assets), and
the natural choice when an angle's actual content is thin on visual metaphor
and would otherwise get an art asset invented just to fill the slide — see
the padding-for-variety guardrail in `daily-automation.md`. Editorial is the
legitimate alternative to that trap, not text-only used to duck other rules.

## Picking the next style

Step 4 of `daily-automation.md` now also reads the last 2 shipped rows'
`style` column (see the updated `angle-backlog.md` Shipped table) and picks
whichever of the three isn't in that set. If it's genuinely the best fit to
repeat a style two days running (e.g. two decks in a row both hinge on a
literal visual metaphor that Scene serves and Editorial can't), that's a
judgment call worth stating out loud in the session, not a silent default.

## A 4th style is coming, not built yet

Once `faceless-figure.jpg` is recovered (see the open item in `assets/` — it
was never actually committed and is gone from this container, flagged
2026-08-31), a **Photo** style is worth adding: the real Morphe photograph as
the anchor on every slide via crops/reframes, not just the hook. Don't build
it on a placeholder or a different stock image — the whole point is the
brand's own one real photo asset, and a substitute would need to be swapped
out again later.
