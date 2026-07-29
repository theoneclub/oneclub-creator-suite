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

These are the default backdrops. When a Higgsfield photo of Morphe is available,
point the slide's `image` at the PNG instead and re-render — nothing else in the
deck changes. Photography beats vector art on a hook slide; the vector art beats
an empty black frame, which is what you have until the photo exists.

Bitmap art is not committed by default (it's heavy and regenerable). Commit a
hook photo only when a deck needs to be reproducible from a clean checkout.
