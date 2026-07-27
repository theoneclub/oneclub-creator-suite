# Buffer — scheduling + the weekly data pull

## Posting

1. Export finishes → `output/<date>-<slug>/` holds `slide-01.png … slide-09.png`
   plus `caption.txt`.
2. Buffer → new post → **Instagram** → attach all slides **in numbered order**.
   Buffer sorts by upload order, not filename, so add them one at a time or
   verify the order in the preview before queueing. A carousel with slide 9
   second is a dead post.
3. Paste `caption.txt`. The trigger line is already the first line — leave it
   there. Everything after the third line is below the fold and does not
   affect the trigger.
4. Schedule: **one carousel daily**, alongside the existing 2 videos. Post at
   the time your reels already peak — same audience, same clock.

## Instagram-primary

Carousels do not cross-post cleanly to TikTok / Shorts / Pinterest the way the
Seedance videos do. Treat the carousel as an Instagram-native asset and let the
video engine own the other platforms. If you want the carousel content
elsewhere, re-cut it as a video rather than dumping nine stills.

## The weekly data pull — this is the part that compounds

Every Monday, Buffer → Analytics → the week's carousels. Pull four numbers per
post: **views, comments, saves, shares**. Add them to
`automation/engagement-log.csv` next to the ManyChat DM count and the Brevo
email count. Then:

```bash
node scripts/angle-report.mjs
```

After five carousels that table stops being trivia and starts being an
instruction: which angle earns comments, which one converts DMs into emails,
which one to stop writing. Feed the winning angle back into the next
`carousel-generator` run — that is the whole feedback loop, and it is worth more
than any redesign.
