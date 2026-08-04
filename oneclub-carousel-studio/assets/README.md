# assets/

Source imagery for slides. Referenced from a deck as
`"image": "../../../assets/<file>"` (the path is relative to the generated
slide HTML in `output/<deck>/html/`).

What belongs here:

- **Morphe hook art** — generated in Higgsfield, one per carousel.
  Name it `<slug>-hook.png` / `<slug>-cta.png` so it is obvious which deck owns it.
- **Screenshots of high performers** — the ones worth stealing structure from.
- **Charts/graphs** you want to drop into a slide instead of rebuilding as a
  `stats` block.

Export hook art at 1080x1440 or larger, 3:4. The slide crops to cover, so a
16:9 render loses the top and bottom of the subject.

## Vector art in this folder (committed)

Generated in-repo, so any deck renders identically offline with no image
pipeline and no credits spent:

| File | Used by | What it is |
|---|---|---|
| `matrix-grid-hook.svg` | hook slides | Perspective grid receding to a lit horizon, code rain above |
| `matrix-grid-cta.svg` | CTA slides | Same world, with a beam of light rising from the vanishing point |
| `quit-curve.svg` | any `figure` block | Flat-then-compounding results curve with the quit point marked |
| `faceless-formats.svg` | any `figure` block | The three faceless content formats as phone mocks |
| `thirty-posts-grid.svg` | hook slides | Thirty post cards, twenty-eight dim, two lit |
| `ninety-day-heatmap.svg` | hook slides | Ninety days as a heatmap — green only appears late |
| `face-vs-faceless.svg` | hook slides | Hard split: dim figure on camera vs lit screen recording |
| `comment-to-inbox.svg` | hook slides | The comment → DM → inbox chain |
| `tab-graveyard.svg` | hook slides | Ten browser tabs, nine dim, one lit |
| `ebook-blueprint.svg` | CTA `product` block | The Faceless AI Affiliate Blueprint as a standing paperback. **Stand-in** — replace with the real cover render (see below) |

## UI panels for split slides (generated)

`node scripts/make-mocks.mjs` writes these. They are 620x1300 — the ratio that
fills the art column of a split slide — and every coordinate is computed from
the canvas, so changing `W`/`H` in that script reflows all seven rather than
stranding hand-placed numbers. Edit the script, never the SVG.

| File | What it shows |
|---|---|
| `oneclub-panel.svg` | Member dashboard: the four-step build, and the community-voted monthly fund |
| `oneclub-offer-board.svg` | Five offers checked, only the recurring one kept |
| `oneclub-angle-sheet.svg` | The faceless script sheet, and three formats that need no camera |
| `oneclub-calendar.svg` | Thirty dated posts, colour-coded by type |
| `oneclub-automation.svg` | Comment to DM to email to follow-up |
| `oneclub-tabs.svg` | Eight open tabs of half-finished plans |
| `oneclub-walkthrough.svg` | The walkthrough the CTA hands over |

A panel is referenced as `"mock": { "image": "../../../assets/<file>" }`, which
is also what switches the slide to the split layout. Unlike hook backdrops these
are *not* full-bleed — they carry their own window chrome and are meant to be
read, so they need the column to themselves.

**Swapping in the real ebook cover.** Save it as `assets/ebook-blueprint.png` with
a *transparent* background, roughly 3:4, then point the CTA's `product.image` at
the PNG. If the render you have sits on a white background, key the white out
first — on a pure-black slide an un-keyed mockup shows as a white rectangle.

Hook art needs a clear middle band: the headline block sits roughly y 380–1050,
so put the subject above or below it, or keep it as uniform texture. Every one of
these was rebuilt once for exactly that reason.

These are the default backdrops. When a Higgsfield photo of Morphe is available,
point the slide's `image` at the PNG instead and re-render — nothing else in the
deck changes. Photography beats vector art on a hook slide; the vector art beats
an empty black frame, which is what you have until the photo exists.

Bitmap art is not committed by default (it's heavy and regenerable). Commit a
hook photo only when a deck needs to be reproducible from a clean checkout.
