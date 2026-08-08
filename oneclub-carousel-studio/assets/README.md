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
| `hook-sheet.svg` | Six fill-in-the-blank first-line shapes |
| `program-check.svg` | Four questions to vet an affiliate program |

## The one committed bitmap

`faceless-figure.jpg` — Morphe: hood up, mirrored sunglasses, no face, green rim
light. Supplied by the user, so unlike everything else here it cannot be
regenerated, which is why it is committed despite the rule above.

It is 768x1376, taller than the 3:4 slide, with the head in its upper third — so
centre-cover puts the face straight behind the headline. The hook slide places
it by hand instead:

```json
"image":    "../../../assets/faceless-figure.jpg",
"imageFit": "600px 1075px",      // background-size — the whole photo, uncropped
"imagePos": "center bottom",     // background-position
"scrim":    "vignette",
"align":    "top"
```

Showing the picture whole and giving the headline clear space are in tension: at
0.558 the photo is far narrower than the 3:4 slide, so filling the frame crops
it, and any size large enough to fill puts the head straight behind the type.
The resolution is to stop trying to fill the frame — `align: "top"` puts the
copy in the upper third and the complete photo sits underneath it.

600px wide is the ceiling for this photo with this copy block. The head starts
12% down the picture, so bottom-anchored it clears the type at roughly
`1440 - 0.876 x height`; any larger and the hood rises behind the swipe pill.
Dropping the pill would buy about another 100px if a deck wants it bigger.

`scrim: "vignette"` is there because a photo smaller than the frame shows its own
rectangle — its near-black is not the slide's pure black. The vignette dissolves
that edge from the centre out.

A panel is referenced as `"mock": { "image": "../../../assets/<file>" }`, which
is also what switches the slide to the split layout. Unlike hook backdrops these
are *not* full-bleed — they carry their own window chrome and are meant to be
read, so they need the column to themselves.

**Product renders: run them through `scripts/trim-product.mjs` first.**

```
node scripts/trim-product.mjs assets/ebook-blueprint.png
```

It does two mechanical things and never repaints the artwork: keys the
background out, and crops to the subject. `ebook-blueprint.png` arrived at
1280x720 with the book floating in the middle — `contain` would have rendered it
tiny, because the box was mostly empty canvas. Trimmed, it is 407x715.

The key is a **flood fill from the border inwards**, not a threshold. The book's
own page block is white, and a threshold would have eaten it.

Hook art needs a clear middle band: the headline block sits roughly y 380–1050,
so put the subject above or below it, or keep it as uniform texture. Every one of
these was rebuilt once for exactly that reason.

These are the default backdrops. When a Higgsfield photo of Morphe is available,
point the slide's `image` at the PNG instead and re-render — nothing else in the
deck changes. Photography beats vector art on a hook slide; the vector art beats
an empty black frame, which is what you have until the photo exists.

Bitmap art is not committed by default (it's heavy and regenerable). Commit a
hook photo only when a deck needs to be reproducible from a clean checkout.
