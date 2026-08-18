# The VSL funnel — ebook as the high-value content offer

Maps Sabri Suby's HVCO funnel onto what's already built. Nothing here replaces
`manychat.md` or `brevo.md` — this file adds one stage (the VSL) between "ebook
delivered" and "Founding 500 signup", and shows exactly which existing copy
changes to make room for it.

## The funnel, end to end

```
1. ATTRACTION       Carousel / reel (value given away in full — existing)
                          │  comments BLUEPRINT
                          ▼
2. OPT-IN (HVCO)    ManyChat DM → Brevo landing page → email captured
                          │  ebook delivered instantly
                          ▼
3. BRIDGE            Ebook's own closing page + Brevo email #2
                          │  "watch the walkthrough"
                          ▼
4. VSL               <-- you're building this next
                          │  ends on one offer
                          ▼
5. CONVERSION        Founding 500 signup
```

The only structural change from the current build: **email #2 and the ebook's
last page now point at the VSL, not straight at the Founding 500 page.** The
VSL becomes the thing that sells Founding 500 — the email's job is just to get
the click.

## Stage 2 — the opt-in page (Brevo)

This is the HVCO step. Suby's rule: the page has to sell the *specific* thing
inside the report, not a vague topic — and it needs to look like something a
competitor would charge for, not a 5-page brochure.

```
[ mockup cover: ebook-blueprint.png ]

THE FACELESS AI AFFILIATE BLUEPRINT

No camera. No face. No audience required.
The exact system: picking a recurring offer, building one faceless
angle, and the publishing rhythm that finds the winner.

Inside:
→ The four-question test for picking an offer worth promoting
→ Three faceless content formats that need zero on-camera time
→ The publishing rhythm that separates one post from thirty

[ Send me the blueprint ]
(email field only — no double opt-in)
```

Above-the-fold promise restates the exact language from whichever carousel
sent them here — someone arriving 15 seconds after reading a slide bounces off
anything that reads like a different pitch than the one they just agreed to.

## Stage 3 — the bridge (this is new)

Suby's HVCO always ends on its own next offer — the last page of the report,
not a separate ask. Two places carry that bridge:

**A. The ebook's own closing page.** Add this as the actual last page of the
PDF, after the content — not a separate email:

```
YOU HAVE THE BLUEPRINT.

Everything in this ebook is real and complete on its own. But reading
the steps and watching them run are different things.

I recorded the exact walkthrough — the offer, the angle, the first
thirty posts — start to finish, so you can see it before you build it
yourself.

[ Watch the walkthrough ]
```

**B. Brevo automation, email #2 (+24h) — replaces the current "Did you open
it?" CTA.** Same trigger and timing as `brevo.md` already specifies, new copy:

```
Subject: the part the ebook can't show you

Reading the blueprint and watching it actually run are two different
things.

I recorded the walkthrough. Same offer, same angle, same publishing
rhythm from the ebook, done in front of you instead of described.

[ Watch the walkthrough ]  → VSL page
```

The +48h split in `brevo.md` stays exactly as built — "joined Founding 500?"
now effectively reads as "watched the VSL and converted?" but the branch logic
doesn't change: yes exits, no converges into the existing Founding 500
nurture sequence at email #2.

**One more free touch, no new infrastructure:** ManyChat can also send a
single follow-up DM at +6h if the ebook button was clicked but the VSL link
in the ebook wasn't (same "no third chase" discipline as the existing DM
rules in `manychat.md`):

```
Get through the blueprint yet? The walkthrough's at the end — worth
watching before you start.  [ Watch it ]
```

## Stage 4 — the VSL page (pre-frame copy, video slots in when it's ready)

Suby's VSLs work because the page around the video makes one sharp promise
before anyone presses play. Draft the wrapper now so the page is ready the
moment the video exists:

```
[ video embed ]

THE WALKTHROUGH: PICKING THE OFFER, BUILDING THE ANGLE,
POSTING THE FIRST THIRTY.

Everything from the blueprint, run start to finish. This is the exact
process behind The One Club, and why we built it as a club, not a
course.

[ Join Founding 500 — first 500 in ]
```

One offer at the end, same as the "20% pitch" beat in the sales-call
structure — not a menu of options. Pre-launch framing throughout: "we're
building this," never a finished-product claim.

## What did NOT get imported from Suby's system, and why

- **Outbound SMS/call/voicemail blanket.** That machinery assumes a $2k+
  service closed on the phone. Founding 500 is a membership funnel that
  already converts through DM + email; adding a call layer would need new
  infrastructure (a dialer, a setter) this account doesn't have and this
  product doesn't need yet.
- **The live sales call (50% discovery / 20-30% proof / 20% pitch).** No
  phone step exists in this funnel. The VSL is doing the job the sales call
  does in Suby's model — proof of the system live, then one offer.
- **Setter/closer team scaling.** Not relevant until there's a call step to
  staff.

## Compliance carries over unchanged

Every stage above is still bound by `scripts/lib/compliance.mjs`: no dollar
figures as personal income results, no guarantees, Freedom Fund only as
"$10,000 monthly, community-voted", pre-launch framing, no em dashes, no
hustle/grind/synergy/leverage. Write the VSL script through the same filter
before recording it.
