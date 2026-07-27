# The loop

```
Claude Code (carousel-generator skill)
   → Higgsfield (hook slide image)
   → export PNGs
   → Buffer (scheduled post, one-word CTA in caption)
   → [audience comments BLUEPRINT]
   → ManyChat (instant DM + tag)
   → Brevo (email capture + Blueprint delivery + nurture)
   → Founding 500 sequence
   → weekly: Buffer numbers back into engagement-log.csv → angle-report.mjs
```

The carousel is one link. A perfect slide set with a broken trigger word earns
nothing, so the wiring below is part of the deliverable, not an afterthought.

## What is wired in this repo

| Piece | State |
|---|---|
| Slide generation, QA, PNG export | Built — `scripts/` |
| Compliance rules as code | Built — `scripts/lib/compliance.mjs` |
| Angle attribution reporting | Built — `scripts/angle-report.mjs` + `engagement-log.csv` |
| ManyChat trigger + DM + tags | **Runbook only** — `manychat.md`. No API access from here |
| Brevo list, attributes, automation | **Runbook only** — `brevo.md`. Account inspected via MCP; the automation builder is UI-only |
| Buffer scheduling | **Runbook only** — `buffer.md`. No Buffer connector in this workspace |

The three runbooks are written to be followed once, in order, in about an hour.
Everything downstream of the export is a manual setup with a one-time cost and
then it runs itself.

## Attribution — the thing most people skip

Every contact that enters through a carousel carries three facts: **which
trigger word**, **which carousel**, **which angle**. Those three follow the
contact from ManyChat into Brevo, which is what makes `angle-report.mjs`
meaningful later. Tag naming is fixed:

```
carousel:<slug>          e.g. carousel:permission-slip
angle:<kebab-angle>      e.g. angle:system-critique
trigger:<WORD>           e.g. trigger:BLUEPRINT
```

Keep `BLUEPRINT` reserved for carousels. The reel rotation (FREEDOM / ESCAPE /
SYSTEM / FOUNDING / FREE / IN) stays out of carousel captions so the two
channels never share a number.
