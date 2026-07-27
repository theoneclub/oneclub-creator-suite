# Brevo — email capture, Blueprint delivery, nurture

Account inspected on 2026-07-27 via the Brevo MCP connector, so the values
below are the live ones, not placeholders.

**Account:** THE ONE CLUB (`theoneclub25@gmail.com`) · timezone Australia/Sydney ·
Marketing plan: Free (300 sends/day — this caps the daily send, watch it once
the carousels scale) · Marketing Automation: enabled.

**Senders already verified**

| id | Name | Email |
|---|---|---|
| 3 | Morph | hello@theoneclub.io |
| 2 | THE ONE CLUB | support@theoneclub.io |
| 1 | THE ONE CLUB | theoneclub25@gmail.com |

Send the ebook sequence from **Morph <hello@theoneclub.io>** — the DM came
from Morphe, the email must match or the handoff feels like a different brand.

**Lists that exist:** Founding 500 (11), Elite Members (10), Premium Members (9),
Ebook Downloads (8), Members (5).

## 1. Create what is missing

**List:** `Carousel → Ebook` — new. Keep it separate from the existing Ebook
Downloads list so carousel-sourced leads stay measurable on their own.

**Contact attributes** (Contacts → Settings → Contact attributes). None of
these exist yet — all three are required:

| Attribute | Type | Example |
|---|---|---|
| `TRIGGER_WORD` | Text | `EBOOK` |
| `CAROUSEL` | Text | `faceless-affiliate-playbook` |
| `ANGLE` | Text | `faceless-affiliate` |

## 2. The opt-in page

A Brevo landing page (or a Brevo form on your own page) that the ManyChat
button links to. One field: email. One button: "Send me the ebook."

Above the fold, restate the promise in Morphe's voice, not marketing voice —
the reader arrived 15 seconds ago from a DM and will bounce on anything that
smells like a funnel. Compliance applies here exactly as on the slides: no
dollar figures as personal results, no guarantees, Freedom Fund framed as
"$10,000 monthly, community-voted".

## 3. The automation: "Carousel → Ebook"

Automations → Create → Custom. Entry point: **contact added to list
`Carousel → Ebook`**.

| # | Timing | Job | Notes |
|---|---|---|---|
| 1 | Immediately | **Deliver the ebook.** Link, nothing else. | Subject earns the open; the file is the only payload. No pitch. |
| 2 | +24h | **Did you open it?** One idea from the ebook expanded — recurring vs one-time. | Single CTA to the Founding 500 page. |
| — | +48h | **Split.** Condition: joined Founding 500? | Yes → exit, they are a member. No → converge into the existing 6-email Founding 500 sequence at its email #2. |

That convergence is the point: the ebook reader who does not convert in 48
hours becomes a standard nurture contact instead of sitting in a dead-end list.
Do not duplicate the Founding 500 emails inside this automation — point at the
existing sequence so there is one place to edit them.

## 4. Segments — the reporting half

Contacts → Segments. Create one per angle you run:

```
ANGLE equals "system-critique"
ANGLE equals "recurring-income"
ANGLE equals "ai-replacement"
...
```

With these, Brevo answers the question that decides next month's content: which
carousel angle produced the highest email → Founding 500 conversion, not just
the most comments. Feed those numbers back into
`automation/engagement-log.csv` (`emails`, `founding500` columns) and run
`node scripts/angle-report.mjs`.

## 5. Watch items

- Free plan = **300 emails/day**. One carousel doing numbers can exceed that in
  an afternoon; the automation will queue rather than send. Upgrade before a
  launch push, not during one.
- Every automated email needs the physical address + unsubscribe footer Brevo
  injects — do not strip it in a custom template.
- Double opt-in: leave it **off** for this flow. The DM already established
  consent and a second confirmation click loses a third of the leads.
