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

Nothing here is committed by default except this file — art is heavy and
regenerable. Commit a hook image only when a deck needs to be reproducible.
