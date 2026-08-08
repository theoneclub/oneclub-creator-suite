# ManyChat — comment capture + instant DM

Set this up once. Every future carousel reuses it by adding the new post to the
same trigger.

## 1. The trigger

**Instagram → Automation → New → Comment Trigger**

| Setting | Value |
|---|---|
| Post | The carousel (add each new carousel to this same automation) |
| Keyword match | `EBOOK` — exact word, case-insensitive |
| Also match | Common misfires: `ebook`, `e-book`, `e book`, `EBOOOK` |

**Alias every word on the CTA slide.** The beginner deck's CTA says three
rotation words out loud — SYSTEM (the trigger), BLUEPRINT (the asset) and FREE
(the offer). All three need to be aliases on the same automation or the leads
that type the wrong one land nowhere. This is the rule, not the exception:

```
trigger:  SYSTEM
aliases:  BLUEPRINT · FREE · "the system" · "sytem"
```

**Alias the asset's own name.** If the slide says "I'll send you The AI Affiliate
Blueprint" but the trigger is `SYSTEM`, a good share of people will type
BLUEPRINT — they're repeating what they just read. Add every word that appears
on the CTA slide as an alias on the same automation, or those leads land nowhere.
The build QA warns when a CTA slide carries a rotation word that isn't its own
trigger, which is your cue to set the alias rather than a reason to reword.
| Reply to comment publicly | On — one short line, rotate it: "Sent." / "Check your DMs." / "On its way." |
| Reply in DM | On |

Public replies matter: they raise the comment count on the post, which is the
metric the algorithm rewards. Rotating the text keeps it from reading as a bot.

## 2. The DM

Send immediately. Short, no fluff, one action. Use ManyChat's own button/link —
never a raw URL pasted in the message body, Instagram suppresses those.

```
Here it is — the Faceless AI Affiliate ebook.

Every step from the carousel, expanded: picking a recurring
offer, building one faceless angle, and the publishing rhythm
that finds the winner.

[ Get the ebook ]   ← button → Brevo opt-in page
```

Second message, sent 10 minutes later only if the button was not clicked:

```
Did the link land? Tap it and the ebook goes straight to your inbox.
```

No third chase. If they do not click twice, they are not a lead yet.

## 3. Tags — this is the attribution data

Apply all three on trigger fire:

```
carousel:<slug>        e.g. carousel:permission-slip
angle:<kebab-angle>    e.g. angle:system-critique
trigger:EBOOK
```

Create the tags before the post goes live. A carousel that fires an untagged
trigger produces a lead you can never attribute, and that lead is the whole
point of the exercise.

## 4. Handoff to Brevo

ManyChat → Settings → Integrations → **Brevo**. Map on tag applied:

| ManyChat | Brevo |
|---|---|
| Email (captured on the opt-in page) | `EMAIL` |
| First name | `FIRSTNAME` |
| `carousel:*` tag | `CAROUSEL` attribute |
| `angle:*` tag | `ANGLE` attribute |
| `trigger:*` tag | `TRIGGER_WORD` attribute |
| — | Add to list **Carousel → Ebook** |

If the native integration will not carry custom fields on your plan, bridge it
with Make/Zapier: ManyChat "Tag Applied" → Brevo "Create or Update Contact".
Same field map. Do not skip the three attributes to save a step — without them
`angle-report.mjs` has nothing to rank.

## 6. Live triggers

One word per asset. Reusing a word across two magnets is exactly what makes
`angle-report.mjs` unable to tell you which deck converted.

| Trigger | Asset | Deck |
|---|---|---|
| `EBOOK` | The Faceless AI Affiliate ebook | `faceless-affiliate-playbook`, the five alternates |
| `SYSTEM` | The AI Affiliate Blueprint | `best-ai-model-for-beginners`, `first-week-plan`, `faceless-ai-affiliate` |
| `FOUNDING` | The One Club walkthrough | `the-one-club-documented` |
| `HOOKS` | The first-line swipe file | `first-line-patterns` |


`FOUNDING` and `HOOKS` are new — create both automations before those decks go
live, or the comments land nowhere.

**Three decks now share `SYSTEM`.** The trigger alone can no longer tell you
which one converted, so the `carousel:<slug>` tag in section 3 stops being
good practice and becomes the only thing keeping attribution readable. Apply it
on every fire, or `angle-report.mjs` will pool all three into one row.

## 5. Per-carousel checklist

- [ ] New post added to the existing `EBOOK` comment trigger
- [ ] `carousel:<slug>` and `angle:<angle>` tags created
- [ ] Test comment from a second account → DM arrives < 30s
- [ ] Test contact lands in Brevo with all three attributes populated
- [ ] Row added to `automation/engagement-log.csv`
