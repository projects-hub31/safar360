# safar360 — build reference

Safar360 is a MERN marketplace for Pakistani tourism: a booking, commerce and social
platform connecting travellers with tour operators, transport owners, property owners,
gear sellers and influencers, with an admin layer running finance, moderation, KYC and
fraud review. This file is the ground truth for building it — extracted from a full read
of the client-supplied wireframe deliverable and kept in sync with what actually exists
in `client/` and `server/`.

**Build strategy — frontend first, backend second.** All 9 modules get built
client-side against mock data/context (the pattern already used by modules 01–05 and the
traveller-facing slices of 06–08, §7/§8) before any server work starts. Do not jump to
Mongoose models, routes, or a real database mid-way through the frontend pass — finish
the UI for every module (including 09/admin, and the remaining seller/influencer/AI
screens listed as gaps in §8) first, so the state machines get fully worked out in the UI
layer first. Only once the frontend is complete across all 9 modules does work move to
§4/§8-item-7 (server: Mongoose models, real routes, swapping mocked context actions for
real `fetch()` calls). This is a deliberate, explicit instruction from the user — don't
silently start backend work while frontend modules are still outstanding.

**Frontend phase closed out 2026-09-01.** Re-verified directly (not just by reading this
file's own log): `npm run lint` and `npm run build` both clean in `client/`, and the only
surviving `ComingSoon` reference in `App.jsx` is the catch-all `path="*"` 404 route — no
real screen falls through to it. All 9 modules' routes are wired per §5/§8. Residual,
non-blocking items noted in §8 items 9–12 (a few click-throughs not yet re-confirmed
in-browser after refactors — Suspense fallback on route transitions, Ledger/Payout-batch/
Analytics walk-through, quick-sign-in panel) are cosmetic/verification gaps, not missing
functionality, and don't block backend work. **Repo hygiene closed 2026-09-02**:
`client/` carries its own nested `.git` (separate from `safar360/`'s); the route guards,
quick sign-in, and the two new Money screens (§8 items 11–12) that were sitting
uncommitted there as of 2026-09-01 are now committed in `client/`'s own repo, dated as
frontend-era work rather than blurring into the backend commits that started the same
day. Backend build plan starts at §9 below.

**Source wireframes:** `~/Downloads/genie(new project)/Safar360 Complete Wire Frames/`
(`index.html`, `safar360-app.html`, `safar360-design-system.html`). These are large
(~1–5MB) self-contained bundles — a custom packer stores gzip+base64 modules inside a
`<script type="__bundler/manifest">` tag and a JSON-stringified page template inside
`<script type="__bundler/template">`. Do not open them with `Read` directly (they exceed
the size limit and are unreadable minified/escaped blobs). To re-extract content: find the
longest line in the file (`awk '{print length, NR}' file.html | sort -rn`), then either
`json.loads()` it directly (the manifest line) or decode each `{mime, compressed, data}`
entry with `base64.b64decode` + `gzip.decompress` (the module map line). The **template**
line is itself a JSON string — `json.loads()` it once to get real HTML/JS. This unpacked
the actual React shell source, the 9 batch documents (each a real `<x-dc>` doc, readable
directly, no further decoding needed), and the design-system doc. Every batch and the full
design system have now been read in full — this file reflects that complete pass, not a
sample. Batch UUID → name mapping (from the shell's `ext_resources`): `75b11f4b`=
Discovery(01), `8a6e5666`=Booking(02), `c6ed3ca7`=Identity(03), `03f54989`=Vendor(04),
`472332bc`=Transport(05), `3dc614b9`=Commerce(06), `07706e28`=Social(07), `04696009`=
AI(08), `3dbe3a73`=Admin(09).

---

## 1. Tech stack (already scaffolded — follow it, don't re-architect)

**Client** (`client/`): Vite 8 + React 19 + React Router 7 + Tailwind 3, plain JS/JSX
(no TypeScript). ESLint configured. Routing uses `HashRouter` (`main.jsx`) with
declarative `<Routes>`/`<Route>` (`App.jsx`) — so addresses match the wireframe's own
hash routes exactly, e.g. `#/discover/home`.

**Server** (`server/`): Express 5 + Mongoose 9 + JWT (`jsonwebtoken`) + `bcryptjs` for
auth, `cookie-parser`, `cors`, `dotenv`. CommonJS (`require`, not ESM) — `server.js` is
currently a bare skeleton (single `GET /` route, no DB connection, no routers yet). Run
with `nodemon server.js` (script: `npm run dev`).

**Do not introduce**: TypeScript, a different CSS framework, a different router, Redux/
Zustand (React Context is the established pattern — see §8), or a different backend
framework. If one of these is genuinely needed, raise it rather than switching silently.

---

## 2. Design system

The wireframe's design tokens have already been ported faithfully into
`client/tailwind.config.js` and `client/src/index.css` (CSS variables under `:root` and
`:root[data-theme="dark"]`, mapped to Tailwind color keys — `bg`, `surface`, `raised`,
`sunken`, `border`/`border-strong`/`border-loud`, `fg`/`fg-muted`/`fg-subtle`, `primary`
(+`-hover`/`-press`/`-on`/`-soft`/`-soft-text`/`-line`), `accent`, `success`, `warning`,
`danger`, `info`, `held`). Dark mode toggles via `data-theme="dark"` on `<html>`
(`darkMode: ['selector', '[data-theme="dark"]']` in Tailwind config) — **use the semantic
Tailwind classes (`bg-surface`, `text-fg-muted`, `border-border`, etc.), never raw hex or
manual `dark:` variants**, so components stay theme-correct automatically. Reuse this
system exactly; do not invent new tokens without adding them to both files.

### Brand thesis
"Trustworthy enough to take money. Aspirational enough to sell Hunza." Jade `#097969`
(primary — 5.4:1 on white), true-black-anchored cool-neutral ramp, signal yellow
`#FFC107` as accent (a **surface**, never a text color, never "success" — 1.6:1 on white
means it fails as text). No generic SaaS blue as primary (blue = info toast only), no
travel-template clichés (no gradient hero, no pill "Explore now", no wanderlust script
font), no truck-art pastiche.

**Four laws** (apply to every screen):
1. **The server is the truth** — no UI element asserts a financial/inventory fact the
   server hasn't confirmed.
2. **Every state is drawn** — every state-machine value gets an explicit pill + surface,
   never an implicit/blank state.
3. **Time is visible, urgency is red** — countdowns render on screen; under threshold
   they switch to danger color and step up weight/size. Amber is never used for urgency.
4. **Blocks explain themselves** — every disabled/gated control ships with a caption
   naming the blocker and what lifts it (e.g. "Complete KYC to publish").

### Typography
Three families: **Outfit** (display/editorial — place names, hero headlines, empty-state
titles; never below 20px, never in a table or admin/vendor UI), **Plus Jakarta Sans**
(UI workhorse — labels, body, buttons, nav, tables), **IBM Plex Mono** (machine truth —
money, booking IDs, countdowns, tracking numbers; always `tabular-nums`). Urdu uses
**Noto Naskh Arabic** (interim choice; Nastaliq for display surfaces is an open question).
Scale (size/line-height/weight): display-xl 52/56/500, display-l 34/39/500,
title-l 24/31/700, title-m 19/26/700, title-s 16/22/600 (see design-system doc for
body/caption sizes).

### Spacing / shape / motion
4pt base, 8pt rhythm (space-1=4 … space-16=64; layout gutters 16/24/28 mobile/tablet/
desktop; content max-width 1240px; reading measure ≤70ch). Radii: 4 (pill/tag), 8
(input/button), 12 (card), 16 (sheet/modal), full (avatar only — **buttons are never
fully pill-shaped**, that reads promotional). Elevation: 3 shadow steps (`--sh1/2/3`),
near-black neutral shadows; dark mode relies on surface-lightness steps + 1px border
instead of shadow. Motion: 80ms acknowledge (press/toggle), 160ms reveal (tooltip/
dropdown), 240ms transit (sheet/modal/page), 400ms explain (stepper, refund breakdown
expanding), 1s loop only for skeleton/await states. **A countdown never animates its
digits** — steps once per second, tabular, no easing. Respect `prefers-reduced-motion`
(collapses transit to an 80ms opacity change; shimmer becomes a static tint).

### Icons & imagery
Outline set, 1.5px stroke, 24px grid (Lucide as base set — already usable via
`client/public/icons.svg`). Directional icons (chevrons, arrows, back/send) mirror in
RTL; non-directional (clock, calendar, checkmark, logo) never mirror. No icon carries
meaning alone — always paired with a text label. Min tap target 44×44 regardless of
visual icon size. Images: fixed aspect ratios (4:3 listing card, 16:9 hero/gallery, 1:1
product/avatar), `object-fit: cover`, ink-100 placeholder, captions never on a scrim over
an unpredictable photo. Human-scale destination photography (a person/vehicle for scale).
Vendor uploads assumed bad — layout must never collapse on a broken image.

### Breakpoints
`≥360` design floor / canonical artboard 390 (mobile-first, Flutter-mobile-first per the
original spec), `≥600` sm, `≥905` md, `≥1240` lg (two-pane detail, admin gains left nav),
`≥1600` xl (content stays capped at 1240). Layout switches on **container** width, not
viewport.

### Component library
One shell per component, variants layered on top — build these once as shared React
components, don't reimplement per screen.

- **Button** — primary/secondary/tertiary/destructive/link. Sizes: lg-52 (full-width
  mobile CTA), md-44 (default), sm-36 (desktop tables only). States: default, hover,
  focus-visible (2px ring), active (`scale(.98)`), disabled (**always** paired with a
  caption naming the blocker — never a silently dead button), loading (label changes,
  width held, spinner). Exactly one primary per view — on money screens, that's the
  payment action.
- **Form fields** — label(+`*`) · [prefix] · field · [suffix] · helper OR error (same
  slot). Variants: text/tel(`+92` prefix)/email/number/password(reveal)/textarea/select/
  with-prefix/with-action. Sizes 44 default, 52 for single-field mobile steps. States:
  default/hover/focus/filled/error/warning/disabled/read-only/loading(skeleton, label
  persists)/success(server-validated only, e.g. a coupon). **Validate on blur, never on
  keystroke.** RTL: `+92` prefix stays inline-start, numbers are an LTR isolate, error
  icon moves to the start edge, `dir="auto"` on free-text fields.
- **OTP input** — 6 boxes 46×56, `dir="ltr"` row always (even in Urdu — mirroring digits
  guarantees mis-entry, a deliberate exception to the RTL rule). Auto-advance, paste
  fills all 6, `autocomplete="one-time-code"`. States: empty/partial/complete/verifying/
  error(n left)/exhausted(cooldown)/expired(resend)/provider-down(email fallback).
- **Document uploader** — one component serves KYC, vehicle permits, property licences.
  States: empty/selected/uploading(%)/paused-offline/uploaded-in-review/approved/
  rejected(reason mandatory)/too-large/wrong-type. Uploaded copy always says "in
  review," never "verified" — only an admin decision earns that word. Client-side
  downscale to 1600px before upload, chunked+resumable, visible byte count.
- **Slot-lock timer** — the one countdown component driving the 10-min checkout lock,
  the 24h vendor request-to-book clock, the group-payment window, and the 3-day
  subscription grace period ("one clock, four contexts"). States: held(calm)/
  expiring(≤2:00, danger, `role=alert`)/lapsed(recovery UI preserves entered data)/
  extended(server-granted only)/unknown(clock unreachable → "Checking your hold…",
  **never fake a countdown**). Clock is server-time-anchored; client clock skew must
  never shorten a real hold. `aria-live` announcements only at 5:00/2:00/0:30/expiry.
- **Status pill** — one pill per legal state across every state machine (§3), each =
  glyph + label + hue + tap-for-gloss. Hue map: info=in motion/waiting-on-someone,
  success=terminal good, danger=terminal bad, warning=must-act/clock-running,
  violet(held)=under review, neutral=done/archived. Rules: never two pills on one
  object, never a bare dot, never colour without glyph+label. Two disclosure pills
  (**Sponsored**, **Machine translated**) are deliberately styled ugly/achromatic/mono/
  uppercase/bordered so they never read as decoration or a quality badge.
- **Search & filter panel** — filters map 1:1 to indexed DB columns; zero-result facets
  are **disabled with count shown, never hidden**. Mobile = search bar + full-height
  filter sheet with sticky "Show N results" footer; ≥905 = persistent 264px rail.
- **Availability calendar / date-range picker** — one grid, two modes (traveller-read
  live slots vs vendor-edit bulk-set). Cell states: available/few-left(≤3)/full/blocked/
  past/selected/range-start-in-end/loading/conflict(vendor — can raise a slot count but
  never below current bookings). Remaining-slot counts are printed digits, never
  colour-saturation alone.
- **Listing cards** (tour/property/vehicle/product) — one shell (image·title·meta·
  price·action), meta line varies by type. States include wishlisted(optimistic +
  rollback), few-left, sold-out(dimmed, "Notify me"), unpublished(vendor view),
  image-error(degrades to text-only — **no card ever requires an image to function**).
- **Price display / order summary** — always `"Rs "` + thousands separators, no
  decimals, never abbreviated in money contexts. **Every order-summary line is
  server-computed** — the client never sums a cart for display.
- **Stepper / tabs / banner / modal / toast** — banner = persistent state needing
  resolution; toast = transient receipt. **State a state-machine cares about never goes
  in a toast.** Toasts: max one at a time, 4s (8s with an action), never for money
  outcomes. Destructive-confirm buttons carry the consequence-with-amount, never "OK".
  Machine-translation banners are never dismissible and exempt price/policy text (kept
  untranslated so a bad translation of a refund term can't become a liability).
- **Data table with bulk actions** — powers KYC queue, moderation queue, payout
  batches, fulfilment, booking inboxes. Below 905px, becomes a stacked card list.
  Bulk reject still demands one reason **per row**, logged to the audit stream.
  Permission-denied removes the action entirely — it is never shown disabled.
- **KPI card & chart shells** — every figure states "as of [rollup time]." Max 2 series;
  **no pie charts, no dual axes.** Semantic hues (held, refunded) reserved for
  semantic quantities, never a rainbow categorical palette.
- **Feed post / chat bubble / notification item** — a tour-announce post reads live
  inventory, **never bakes seat count/price into the post**. Chat message states:
  Sending → Sent → Delivered → Failed (explicit retry, no silent auto-resend).
- **Empty / error / permission-denied / offline / skeleton** — copy formula: **what
  happened (no blame) → why (one clause) → the single next action.** Banned copy:
  "Something went wrong.", "Oops!". Money errors state explicitly whether money moved.

### Patterns
- **Navigation per actor** — traveller: 5-tab bottom bar (Explore/Search/Bookings/Feed/
  Profile). Operator: Dashboard/Bookings/Listings/Money. Transport: Dashboard/Quotes/
  Vehicles/Money (Quotes-first — leads expire). Property: Dashboard/Enquiries/Property/
  Money (named "Enquiries" not "Bookings" deliberately — leads, not reservations).
  Influencer: Feed/Collabs/Campaigns/Profile. Admin: left rail grouped Queues/Money/
  Content/Platform, **items absent (not disabled) when permission is missing**.
  Multi-role users get a persistent role chip in the header — ambiguity here is how a
  vendor could accidentally cancel a traveller's booking.
- **Form & validation** — validate on blur. Server truth wins; a server rejection is
  shown verbatim at the field. One error summary at top on submit, each item links to
  its field. Autosave drafts per step (listing builder, KYC). **Never disable submit to
  enforce validity** — let it be pressed and explain what's wrong.
- **Error & recovery** — retry in place, never navigate away, never lose entered data.
  Money errors state whether money moved, as a sentence, not an inferred pill.
  Idempotency is user-visible as safety copy: "Retrying is safe — we won't charge
  twice." Every failure names an owner ("waiting on the operator" / "waiting on
  JazzCash" / "waiting on us").
- **Gates & permission-denied** — three-part template: **blocked · why · what unblocks
  it**. Show the gated thing disabled with its reason, never hide it. The UI gate is
  never the security control — the API enforces it. Unpublished ≠ deleted — copy uses
  the word "saved."
- **Offline & poor connection** — three tiers: online / slow(>2s skeleton, "still
  working" at 5s) / offline(cached read-only with timestamp). E-ticket and active-
  booking details are cached for true offline use. **No optimistic UI on anything
  financial** (wishlist is the one exception, with rollback). Never start a countdown
  offline — show "Checking your hold…" if remaining lock time can't be verified.
- **Destructive actions** — tiered by reversibility: reversible → do it + Undo toast;
  irreversible-with-money → modal stating the computed amount; irreversible-and-systemic
  (release a payout batch, remove content) → modal + typed or second-approver
  confirmation. Confirm buttons always carry the consequence ("Cancel and refund
  Rs 226,500"), never "Confirm."
- **Notifications** — SMS reserved for money/safety/expiring-window classes; social is
  push-only, batched.

  | Class | Channels | In-app |
  |---|---|---|
  | Critical money/booking | push+SMS+email | Banner, persists until resolved |
  | Safety (weather/geofence) | push+SMS | Banner on the active booking |
  | Time-boxed action (accept/pay) | push+SMS, one reminder at 50% of window | Notification w/ countdown + inline action |
  | Transactional info | push+email | Notification item |
  | Social | push only, batched | Notification item, grouped |

  Money and safety notification classes are **non-optional at signup** — every other
  class is user-configurable.
- **Accessibility baseline** — contrast ≥4.5:1 body / ≥3:1 large-text+UI-boundaries in
  both themes; targets 44×44 min (36px rows only in dense admin tables on pointer
  devices); focus always visible, modals trap+restore focus; **never colour alone** for
  any status/error/chart value; layouts survive 200% text zoom without clipping.
- **Flagged trade-offs** (carried forward as known issues, not yet solved): the payment-
  webhook gap is real waiting — give it an honest-expectation screen, not a fake
  progress bar. A 10-minute soft lock is tight for a first-time wallet user on a slow
  connection — collect guest details *before* locking. Group split-payment's
  all-or-nothing refund punishes the group for one late person — the organizer view
  must state this rule before they commit. Vendor price/policy text stays untranslated
  even under machine translation, to avoid a mistranslated refund term becoming a
  liability.

---

## 3. Domain model & business rules

The wireframe's shell encodes a real state-machine spec, not just static mockups. Treat
the field/action names and transition tables below as the contract to implement server-
side (Mongoose models + route handlers), then mirror client-side.

### Roles (7 actors, `role` on the user model)
`traveller`, `operator` (tour operator), `transport` (transport owner), `property`
(property/hotel/restaurant owner), `seller` (gear seller), `influencer`, `admin`. Admin
additionally carries its **own** sub-role — see Admin RBAC below. Each role has a
distinct nav/home surface — see §5.

### Payment / webhook state machine
States: `idle → pending → confirmed | failed | held`. `pending` = gateway authorized,
awaiting a **signed webhook** (the webhook is the sole authority — nothing captures on
the client's word; "authorized ≠ confirmed" is the load-bearing distinction). `held` =
fraud score above `policy.fraudThreshold` (default `0.75`), routed to admin fraud review
(§ below). A late webhook (arrives after the lock TTL) auto-refunds rather than
overbooking. This exact machine is reused for **both** tour bookings and gear orders —
only what capture touches differs (seats vs. stock). Webhook signature verification
should retry up to **3x within 30s** before giving up.

### Booking soft-lock
`startLock` reserves a slot for `lockMinutes` (default 10) **without deducting
anything** — deduction happens only on a verified capture. The wireframe's own spec
frames this as a **Redis TTL key** design (lock = a key that auto-expires), not a
timestamp field polled on read — implement it that way (Redis, or a Mongo TTL index as
a fallback) rather than a cron-checked expiry column. On TTL elapse the lock clears and
the slot returns to the public pool. A request-to-book (operator-mediated) never holds
a seat at all until the operator accepts — decline = full refund, no seats ever touched.

### Inventory & the atomic-check pattern
Two independent pools: `availability` (per-tour seat counts) and `stock` (per-SKU gear
counts). **A cart holds nothing** — deduction fires from exactly one place, a verified
capture. The anti-oversell mechanism is explicit in the source spec: a **single atomic
conditional update**, not read-then-write —
```
(remaining_seats - requested_seats) >= 0   // as one findOneAndUpdate filter+update
```
In Mongoose: `Tour.findOneAndUpdate({ _id, seatsLeft: { $gte: seats } }, { $inc: { seatsLeft: -seats } })`
and treat a null result as the sold-out/late-webhook race — refund, don't oversell. The
same pattern applies to gear stock. This is the one piece of "how," not just "what," to
carry directly into the booking/order confirmation logic.

### Subscription (vendor publish gate) — full transition table
Five states, this is the complete legal graph (nothing else is a legal move):
```
active    → past_due (charge fails) | cancelled (vendor cancels)
past_due  → active (retry succeeds) | grace (retries exhausted, after 2 retries over 3 days)
grace     → active (payment received) | suspended (3 days elapse)
suspended → active (payment received) | cancelled (90 days elapse)
cancelled → active (resubscribe) | purged (90 days elapse)
```
Publishing requires `kyc === 'approved' AND sub in (active, grace)`. `suspended` ≠
deleted — listings are hidden but fully saved; `cancelled` keeps listings live until the
paid period ends, data retained 90 days. Grace period is a fixed 3-day countdown banner
(amber → red under 24h remaining). Sales tax on subscription payment is **16%** flat.

**Commission is plan-driven, not a single global rate** — this corrects/extends the
`policy.commissionPct` default below. Vendor plans:

| Plan | Price/mo | Listing cap | Commission |
|---|---|---|---|
| Starter | Rs 2,500 | 3 | 15% |
| Growth | Rs 6,500 | 15 | 12% |
| Pro | Rs 14,000 | unlimited | 9% |

Gear sellers likewise carry a **per-seller** commission rate, not a shared default —
seed example: Karakoram Gear 12%, Baltistan Outfitters 10%, Indus Trek Supply 14%.
Model commission as a field on the Vendor/Seller (or their active subscription plan
document), with `policy.commissionPct` as only the fallback/default shown in admin
config, not the value actually charged.

### KYC
Per-vendor states: `pending → approved | rejected`, each vendor with its own publish
gate. Admin review carries a **24h SLA** (countdown badge on the queue card, amber under
8h remaining, red once overdue). Rejection requires picking exactly **one of 4 fixed
reasons**: image unreadable / document expired / name mismatch / missing document — the
reject action stays disabled until one is chosen, and the reason is shown to the vendor
**verbatim**, never paraphrased. Resubmission is scoped **per rejected document**, not a
full re-upload — stated explicitly as the important retention decision. Required
document set varies by vendor type (tour operator: CNIC front/back + business
registration; transport: CNIC + route permit + fitness certificate). CNIC format is
validated **on blur only**, regex `/^\d{5}-\d{7}-\d$/`, error copy: *"A CNIC is 13
digits as 00000-0000000-0. Check the number on the card."*

### Moderation contract (batch 07 ↔ batch 09, one shared registry)
`REPORT_REASONS`: `spam`, `harassment`, `misinfo` (dangerous misinformation), `undisclosed`
(paid promotion without disclosure), `stolen`, `other` — each with a label + description.
A report with an unlisted reason is refused.
`CONTENT_STATES`: `live → reported → under_review → removed | restored → reported`, exact
legal transition table (nothing else is legal):
```
live:         [reported]
reported:     [under_review, live]
under_review: [removed, restored]
removed:      [restored]
restored:     [reported]
```
`AUTO_REVIEW_AT = 3` — 3 independent reports auto-hides content pending human review. A
`removed`/`restored` decision always requires a reason (both directions). **Admin's
decision buttons should be generated dynamically from this transition table** — an
illegal move is never offered as a disabled option, it simply doesn't exist as a button.
Reporters are never disclosed to the author; the author is told the rule, never who
reported. One appeal is allowed, and it goes to a **different** moderator than the
original decision.

### Ledger — 6 states, not 3
Single money record shape for vendor commission accrual, referral commission, and
payouts: `{ id, kind, ref, party, label, gross, rate, commission, net, state, via }`.
States: `accruing → accrued → pending → released`, plus exception states `held·dispute`
and `reversed`. `commission = round(gross * rate)`; `net = commission` for referrals,
`net = gross - commission` for vendor/seller payouts. `reverseLedger` claws back
commission on a refund/cancellation (e.g. a weather cancellation calls the same
`cancelBooking` + `reverseLedger` pair as any other cancellation — no parallel refund
path). **Payout batch approval is two-step, enforced by identity, not just role** — the
person who prepared the batch cannot also be its second approver, even if they hold a
role that would otherwise permit it. A payee with an open dispute is held out of a
payout batch entirely (clawing money back from a bank account afterward doesn't work).

### Referral / influencer attribution
Last-click wins, 30-day attribution window (`policy.attributionDays`, default 30).
Conversion only fires from the same verified-capture point as inventory deduction — a
failed payment leaves no commission behind. Default `referralPct = 0.04`. Paid on **trip
completion, not booking**. A campaign's "Earned" and "Paid" are distinct: earned = value
of verified deliverables; paid = what has actually reached the account, net of a 10%
platform fee withheld.

### Policy object (admin-configurable — `#/admin/config`)
Single source of truth read live by multiple screens — never hard-code a threshold
that's already here. The config screen edits **exactly these 7 fields** via live
sliders, each with a real-time "effect" preview recalculated from the current value
(e.g. dragging `fraudThreshold` immediately shows whether a specific held payment would
still be held):

```js
{
  commissionPct: 12,     // 5–25% — DEFAULT only; actual rate is plan/seller-specific, see above
  referralPct: 4,        // 1–12% — influencer commission on conversions
  attributionDays: 30,   // 1–90d — referral attribution window
  cancelFreeHours: 48,   // 0–96h step 6 — free-cancellation window
  fraudThreshold: 0.75,  // 0.5–0.95 step .01 — payments scoring above this are held
  weatherDecisionHours: 12, // 2–24h — operator's window to decide on a weather alert
  weatherRefundPct: 100, // 50–100% step 5 — refund rate on a weather cancellation
}
```
(`weatherAuthority` and `weatherWindKmh` also exist on the object as read-only context
for the weather flow below, but aren't among the 7 sliders admin edits directly.)

### Booking mode & cancellation policy — per listing, not global
Each tour listing carries its own **booking mode**: `instant` (pay now, seats deducted
on payment confirmation) or `request` (24h operator response window, seats deducted
only on acceptance) — this is the switch that produces the `awaiting-accept` /
`group-split` flows vs. the direct checkout flow. Each listing also carries its own
**cancellation policy**, one of three presets: `flexible` (full refund until 24h
before), `standard` (100% at 7 days, 50% at 48h, nothing after), `strict` (50% until 14
days, nothing after — intended for permit-heavy treks). Store both as fields on the
Listing document; the refund calculator reads the listing's own policy, not a global
constant. A cancellation reason of `operator`-caused (weather, operator cancels) always
forces a 100% refund regardless of the listing's policy tier.

### Lead / quote lifecycle (transport & property enquiries — no inventory, no money)
```
request → quoted (owner sets an expiry: 24h / 48h / 7 days — required on every quote)
quoted  → accepted → a real booking is created (only point money/inventory enters)
quoted  → expired (no reply in time)
quoted  → withdrawn (owner cancels the quote)
```
No inventory hold and no payment at any step before `accepted`. This is the same shape
for transport quotes, property/restaurant enquiries, and gear "notify me" — a lead, not
a reservation, until explicitly converted.

### Collaboration lifecycle (influencer ↔ operator, §7.9)
```
invited  → accepted → in_progress → delivered → paid
invited  → declined            (no obligation either side)
accepted → cancelled           (either side, with 7-day notice)
```
Payment is escrowed on `accepted`, released on verified + disclosed deliverables.

### Commerce-specific rules
- **Coupons** are validated server-side against distinct failure modes (model as a
  `result` enum, not a boolean): `valid`, `scope` (seller-restricted, cart has none of
  their items), `expired`, `minimum` (subtotal below a floor — error states the exact
  shortfall), `used` (single-use-per-account, cites the order it was already used on),
  `invalid` (unrecognized code).
- **Shipping**: flat **Rs 350 per seller/parcel** — a multi-seller cart pays shipping
  once per distinct seller, not once per order.
- **COD (cash-on-delivery)** is blocked when the order total exceeds a cap **and** at
  least one seller in the cart doesn't support COD — both conditions, not either alone.
- **Fulfilment** is a strict 3-step sequence per sub-order: `packing → shipped →
  delivered`, each step irreversible and sequential (can't skip). A "ship within" clock
  runs during `packing`; late dispatch affects seller ranking.
- **Returns**: reason is one of `size` (wrong size) / `damaged` / `wrong` (not as
  listed) / `changed` (changed mind). Return shipping is **free** when the fault is the
  seller's (`damaged` or `wrong`), otherwise **Rs 350** charged against the refund.
  Returning restores stock, reverses the commission accrual, and never touches other
  sub-orders from the same original payment.
- **Gear checkout never holds stock in the first place** (unlike a tour's seat lock) —
  this is explicitly why a sold-out race exists at capture time on the gear side (same
  atomic-check pattern as tours) but there's no separate "expired lock" release step.

### AI & location rules
- **Chatbot function-call transparency** (reusable UI pattern, not just a batch-08
  quirk): every tool call the assistant makes renders visibly — name, arguments, and
  raw return payload — in its own block, separate from the prose reply. Confidence gaps
  get an explicit "uncertain" disclosure rather than a smooth-sounding guess (e.g. a
  road-status lookup that returns no data must say so, not improvise an answer).
- **Escalation to a human** triggers on: any money question (refund/charge/payout —
  immediate), any safety question (weather/road/medical — never model-answered), two
  failed answers in a row, or user-initiated (the escalate control is always visible,
  never buried). The human agent's context is explicitly scoped — booking ref, transcript,
  payment method+status are visible; CNIC, card number, and other bookings are not.
- **Geofence permission** is exactly 4 states: `prompt` / `granted` / `denied` /
  `unavailable` (no signal). `denied` is first-class, not an error — never re-prompt
  after a refusal. Check-in only offered near a mapped point; effects: marks an
  itinerary stop reached, optionally notifies an emergency contact, **never posts
  publicly** by default.
- **Weather override flow** (extends `weatherCancel`):
  `alert issued → operator notified → operator decides within policy.weatherDecisionHours
  (proceed | postpone | cancel) → no decision = auto-postpone`. A `cancel` decision runs
  the **same** `cancelBooking` action as any other cancellation, at `policy.
  weatherRefundPct`, plus `reverseLedger` for the commission clawback — no separate
  weather-refund code path.
- **Landmarks** are a hand-curated collection (name, coords, elevation, blurb, facts,
  related tours, access notes) — the assistant/chatbot can reference them but never adds
  to the list; model as its own collection, not user-generated content.

### Admin RBAC — exact permission matrix
Admin carries its own sub-role, `adminRole`: `super` | `sub` | `finance`.
```js
perms(adminRole) = {
  kyc:        adminRole in [super, sub],
  moderation: adminRole in [super, sub],
  finance:    adminRole in [super, finance],
  disputes:   adminRole in [super, finance],
  fraud:      adminRole in [super, finance],
  analytics:  true,                 // every admin role
  config:     adminRole === super,
  audit:      adminRole in [super, finance],
}
```
RBAC is enforced by **absence** — a denied nav item or screen simply doesn't render,
never a greyed-out/disabled version (that would advertise a capability a sub-admin can't
use). `sub` = queues only (KYC + moderation). `finance` = money only (ledger, payout
batches, disputes, fraud). Only `super` sees policy config.

### Fraud review — explainable rule breakdown
The fraud gate reads `policy.fraudThreshold` live — lowering the threshold in config
immediately changes whether a given score would be held, proving the gate is
policy-driven, not hardcoded. The score itself is never a bare number: it's a sum of
**weighted, signed contributing factors**, each shown to the reviewer, e.g.: card issued
outside Pakistan `+0.28`, first booking on this account `+0.24`, amount in top 5% of
bookings `+0.19`, departure within 72h `+0.11`, device seen before with no chargebacks
`−0.14`. Model fraud scoring as a rule-weight table, not a scalar column, so this
breakdown can survive into the real backend. Explicit design stance: *"The model does
not decide. It scores and explains — a person decides."* Traveller-facing copy never
uses the word "fraud," only "held for review." Three resolution actions map to ordinary
actions, not a dispute-only mechanism: Clear → `setPaymentState(confirmed)`, Refund →
`setPaymentState(failed)` + `reverseLedger`, Ask-for-ID → holds without penalizing.

### Dispute resolution
One screen shows both parties' claims plus an **independent cross-module timeline**
(payment capture timestamp, geofence check-in/no-check-in, weather alert issuance,
operator completion mark) used to adjudicate rather than trusting either claim alone —
model this as reading from other modules' event logs, not a dispute-owned evidence
store. A mandatory reasoning note (shown to both parties) gates 3 resolution actions:
refund traveller in full, split (partial), or release to operator — each of which runs
**ordinary** actions (`cancelBooking`+`reverseLedger`, or a partial-amount
`reverseLedger`), no separate dispute-only refund mechanism.

### Permits
Per-route/document states: `valid`, `expiring`, `expired`, with an explicit **30-day**
warning threshold (`days <= 30` → expiring/warning tone; `days < 0` → expired/danger).
Visibility gate: `permit.status === 'valid' AND vehicle.active AND owner.kyc ===
'approved'`. An expired permit withdraws its route from search (same visibility-gate
pattern as KYC/subscription) but never cancels bookings already taken on that route.

### Money & locale conventions
Charges always run in **PKR**; display currency (`PKR`/`USD`/`AED`) is cosmetic only —
already implemented in `client/src/context/AppContext.jsx` (`formatMoney`, rates
`USD:278`, `AED:76`, matching the wireframe exactly — keep these in sync if the
wireframe rates ever change). Money is always tabular (`font-variant-numeric:
tabular-nums`), prefixed, never abbreviated ("Rs 148,000", never "148k") in
money-critical contexts. **In Urdu/RTL layout, numbers, CNICs, booking references, dates
and money stay LTR** — never mirror them, and in Urdu-numeral contexts (e.g. a
countdown) they render as Urdu-Indic digits (۰۱۲۳۴۵۶۷۸۹) but the direction stays
isolated LTR.

---

## 4. Backend implementation notes

Concrete "how," not just "what," pulled directly from the source spec:

- **Reference number formats**: bookings `SFR-YYYY-MMDD-NNNN`, gear orders
  `ORD-YYYY-MMDD-NNNN`, payments `pay_xxxxxxxx`, ledger rows `LG-NNNN`, permits e.g.
  `GB-DNP-2026-0881` (region-district-year-sequence).
- **Soft locks as TTL keys** (Redis, or a Mongo TTL index if Redis isn't introduced) —
  not a timestamp column polled on every read.
- **Atomic inventory/stock deduction** via a single conditional update
  (`findOneAndUpdate` with a `$gte` filter), never read-then-write — see §3 for the
  exact shape.
- **Webhook verification retries** up to 3x within 30s before the payment is treated as
  failed/lost.
- **OTP**: 6 digits, 5-minute TTL, 5 attempts before a 15-minute lockout; on SMS
  provider outage, email verification is offered immediately as a fallback rather than
  hard-blocking the user.
- **Session/auth**: a rotated refresh token presented twice is treated as theft — revoke
  every session on that account. A password reset also revokes all sessions everywhere.
  Failed sign-ins are rate-limited per phone number, with the limit disclosed up front.
  Password-recovery flows send a code, never a password; support cannot read or set
  passwords.
- **Suggested Mongoose collections** (beyond the obvious User/Listing/Booking): `Order`
  + `SubOrder` (one payment, N seller-scoped sub-orders), `Payment`, `LedgerRow` (shared
  shape for commission/referral/payout — see §3), `Content` + `Report` (the moderation
  registry), `Permit`, `Policy` (a singleton config document), `Landmark` (hand-curated,
  not user-generated), `Dispute` (reads other collections' events rather than owning its
  own evidence copy), `Quote`/`Lead`, `Collaboration`. `Vendor`/`Seller` documents should
  carry their own commission-rate field (plan- or seller-specific — see §3), with
  `Policy.commissionPct` as only the displayed default, not the charged rate.

---

## 5. Information architecture (9 modules, route table)

Route pattern in the real app: `/<module>/<screen>` (React Router, not hash). This table
is the full screen inventory from the wireframe — build against it; treat gaps as
backlog, not as "doesn't exist."

| # | Module | id | Key screens |
|---|--------|-----|------|
| 01 | Traveller discovery | `discover` | home, search, tour, property, transport, wishlist, profile |
| 02 | Booking & payment | `booking` | checkout, gateway, awaiting, confirmed, expired, failed, late-webhook, held, sold-out, declined, awaiting-accept, group-split, participant, history, cancel |
| 03 | Onboarding & identity | `identity` | role, register, login, otp, otp-exhausted, kyc, kyc-pending, kyc-approved, kyc-rejected |
| 04 | Vendor (tour operator) | `vendor` | dashboard, plans, subscribe, grace, listings, availability, inbox, booking, payouts, payout, gate, analytics |
| 05 | Transport & property | `transport` | vehicles, routes, quotes, quote, permits, property, rooms, menu, enquiries, featured |
| 06 | Commerce (gear) | `shop` | catalog, product, cart, checkout, order, tracking, sold-out, expired, seller-products, fulfilment, returns |
| 07 | Social & influencer | `social` | feed, explore, composer, post, profile, chats, thread, report, collab, referrals, campaigns |
| 08 | AI & location | `ai` | planner, itinerary, saved, chatbot, escalation, map, landmark, tracking, geofence, weather |
| 09 | Admin console | `admin` | console, kyc, moderation, ledger, payout-batch, disputes, fraud, analytics, config, audit |

`client/src/pages/traveler/` now covers all 7 module-01 screens (`Home`, `Search`,
`TourDetail`, `PropertyDetail`, `Transport`, `Wishlist`, `Profile`). Module 05 (transport
& property, all 10 screens) and module 04 (vendor, all 12 screens) are also fully built —
see §8 for the up-to-date per-module status; this line only tracks the traveller-role
discovery folder specifically.

Per-role default nav (first item is the role's landing page after login):
- **traveller**: Discover → Bookings → Trips → Feed → Gear
- **operator**: Dashboard → Listings → Bookings → Money → Plan
- **transport**: Vehicles → Quotes → Permits → Money
- **property**: Property → Rooms → Menu → Enquiries
- **seller**: Products → Orders → Returns → Money
- **influencer**: Feed → Compose → Campaigns → Referrals
- **admin**: Overview → KYC → Moderation → Finance → Disputes → Config

### Traveller workflows

Beyond the route table above, this is the working list of what a traveller — the one
role with a public, no-account browsing surface — can actually **do**, end to end, in
the app as built. Every item below is a real flow through live context state (§7), not a
static mockup: seats/stock genuinely decrement, refunds genuinely compute, chats
genuinely carry message states. Use this list as the traveller-side acceptance bar for
any future module touching these surfaces.

- **Discover and book a tour** — browse Home or Search (filters, sort, sponsored-slot
  rules) → open a tour → hold seats (`instant` mode) or send a request (`request` mode,
  §3) → checkout with a payment method and optional promo code → live gateway ladder →
  confirmed e-ticket, or one of the six honest outcome branches (expired/failed/held/
  sold-out/late-webhook/declined) → manage it later from Booking History, including a
  correctly tiered cancellation refund.
- **Split a booking with a group, or pay via a shared link** — start a group-split from a
  tour page, nudge participants, and reach an all-or-nothing confirm (or a full-refund
  lapse) exactly as §3 specifies; a participant with no account at all can still pay
  their share through the guest pay-link.
- **Save trips and manage preferences** — wishlist a tour with optimistic toggle+rollback,
  and set display name, home city, language, theme, currency, distance unit and
  per-class notification toggles from Profile.
- **Send a transport enquiry** — request a vehicle for a route as a lead, not a booking
  (§3 lead lifecycle) — no seat is held and no money moves until an owner-issued quote is
  explicitly accepted.
- **Plan a trip with AI, then act on the plan** — set an origin, day count, budget,
  traveller count, interests and pace on the planner (with the constructed API payload
  shown as a transparency device) → get a real day-by-day itinerary built from live
  listings, with unfillable days left as an honest gap rather than an invented stop →
  save it, and re-open it later to see a real re-cost against current prices/availability
  (a "gone since we planned it" line if something sold out in the meantime).
- **Ask the assistant, or skip straight to a person** — chat with the AI assistant and see
  every tool call it makes rendered openly (name, arguments, raw result) rather than
  folded into the prose; money and safety questions, and two unclear answers in a row,
  escalate automatically, and a "talk to a person" control is always on screen regardless.
- **Buy gear** — browse the catalog (category/seller/in-stock filters) → a product page
  where an individual size/variant can be sold out on its own → a cart grouped by seller
  with its own shipping line and a coupon field (full failure-mode set, §3) → checkout
  (COD blocked per the two-condition rule when it applies) → an order split into
  independent, trackable sub-orders per seller → return a delivered parcel with the
  correct free-vs-charged shipping rule.
- **Take part in the social layer** — read the Followed/Explore feed, post a trip report/
  photo/departure announcement (with mandatory paid-partnership disclosure where it
  applies), comment, like/save, message an operator or another traveller with real
  Sending→Sent→Delivered→Failed states and explicit retry, block/unblock an account
  without losing the transcript, and report content against the same shared reason
  registry the future admin moderation queue will read.

---

## 6. Per-screen reference

Field-level detail extracted from a full read of all 9 batches — form fields, exact
validation copy, magic/demo values (useful when sanity-checking a real implementation
against the source behaviour), and any screen-local logic not already covered as a
cross-cutting rule in §3. Organized by module; skip screens with nothing beyond what §3
already covers.

### 01 · Discovery
- **home** — Search bar: `where` (text), `when` (date), `guests` (stepper, 1–12). Six
  role-picker tiles route to `#/identity/role` with the role pre-selected. "Today on the
  road" stats must be real cross-module reads (seats, commission%, quotes, stock,
  referral earnings), never hardcoded copy. **Sponsored-slot algorithm**: only applied
  when sort is "relevance" — interleave max **2 sponsored per 8 organic** results; any
  other sort strips sponsored entirely. Seat-pill thresholds: `≤0` → "Sold out"
  (muted), `≤3` → "N seats left" (danger), else → "N seats" (success).
- **search** — Filters: price range (Rs 20,000–150,000, step 5,000), region checkboxes
  with live counts, duration chips (1–3/4–5/6+ days, multi-select), verified-only and
  has-availability toggles. Sort: relevance/price-asc/price-desc/rating/soonest. Empty
  state names the filter to clear.
- **tour** — Departure picker (some dates can be `full` → disabled), guest stepper
  capped at that departure's `seatsLeft`, live subtotal/4% fee/total. CTA text changes
  by state: "Sold out on this date" vs "Hold N seats for 10 minutes." Example
  cancellation tiers: **free until 7 days before, 50% until 48h before, nothing after**
  — this is the `standard` cancellation-policy preset (§3).
- **property** — House-rules grid (check-in/out, power schedule, payment methods incl.
  cash). Per-room availability pill, disabled "Unavailable" at `left ≤ 0`.
- **transport** — Explicitly an **enquiry, not a booking** — date, passenger stepper,
  free-text note; submits into the lead lifecycle (§3), not a checkout.
- **wishlist** — Empty state: *"Every safar starts with one saved place."* (Already
  mirrored in `AppContext`'s wishlist toggle.)
- **profile** — Display name, home city, language toggle, theme, currency (with "always
  charged in PKR" disclaimer), distance unit, 4 notification toggles (booking/
  price-drop/messages/promo — **promo defaults off**).
- **home-ur** — Real Urdu copy, not machine-mirrored; date/price/guest-count stay LTR
  isolates even while the guest counter itself renders in Urdu-Indic digits.

### Traveller role — full workflow map

Everything below is every path a signed-in (or, where noted, signed-out) **traveller**
can actually walk through the built app today, written as `node -> node -> node` chains
— the shape requested for this section, one flow per line, route in `backticks` after
each stop. This is the traveller-role companion to the route table above: that table
says which screens exist per module, this section says how a traveller actually strings
them together. Every arrow here is a real, working transition in the current code — not
an aspiration — except the two exceptions called out at the end, which are documented as
gaps rather than silently implied to work.

**1. First-time entry (signed out) and returning sign-in**
```
guest -> discover home (`discover/home`) -> tap "Traveller" role tile or "Sign in"
      -> role select (`identity/role`) -> register (`identity/register`, phone or email)
      -> OTP verify (`identity/otp`, magic code 419027) -> account created -> discover home
```
```
guest -> register with phone 300 4821776 -> "this account may already exist" panel
      -> login (`identity/login`) -> discover home
```
```
returning traveller -> login (`identity/login`, phone/email + password) -> discover home
```
```
traveller -> OTP screen -> 5 wrong codes -> otp-exhausted (`identity/otp-exhausted`, 15-min lockout)
          -> email fallback offered immediately (no SMS outage hard-block)
```

**2. Discover and book a tour — instant mode**
```
traveller -> discover home (`discover/home`) or search (`discover/search`, filters + sort)
          -> tour details (`discover/tour/:id`) -> pick a departure + guest count
          -> "Hold N seats for 10 minutes" -> checkout (`booking/checkout`, guest CNICs + payment + promo)
          -> gateway (`booking/gateway`) -> awaiting webhook (`booking/awaiting`)
          -> confirmed e-ticket (`booking/confirmed`) -> booking history (`booking/history`)
          -> cancel (`booking/cancel/:ref`, tiered refund)
```
Branches out of the same hold/checkout, each a real, reachable outcome (§3 payment
state machine) rather than a dead end:
```
checkout -> 10-minute hold expires -> expired (`booking/expired`) -> back to tour details to retry
awaiting  -> card declined -> failed (`booking/failed`) -> retry with a different method
awaiting  -> fraud score over threshold -> held (`booking/held`) -> wait for human review
awaiting  -> seat taken moments earlier -> sold-out (`booking/sold-out`) -> browse other tours
awaiting  -> webhook arrives after the hold expired -> late-webhook (`booking/late-webhook`) -> auto-refunded
```

**3. Book a tour — request mode (operator-mediated, no lock, no charge)**
```
traveller -> tour details (`discover/tour/:id`, bookingMode = request)
          -> enter each guest's name + CNIC -> "Request N seats — operator has 24h"
          -> awaiting-accept (`booking/awaiting-accept`)
          -> operator accepts within 24h -> booking confirmed -> booking history
```
```
awaiting-accept -> operator declines, or the 24h window lapses
                -> declined (`booking/declined`) -> nothing was ever charged, no seat ever touched
```

**4. Split a booking with a group**
```
traveller -> tour details (2+ guests) -> "Split the cost with the group instead"
          -> group-split (`booking/group-split`) -> name participants -> share the pay-link
```
```
each participant (no account needed) -> pay-link (`booking/participant/:groupId/:index`)
                                      -> pays their share -> back to group-split's live status
```
```
group-split -> everyone pays inside the 24h window -> booking confirmed
group-split -> window lapses with even one person unpaid -> everyone who paid is refunded in full
```

**5. Wishlist**
```
traveller -> any tour card (home, search, or tour details) -> tap the ☆
          -> wishlist (`discover/wishlist`) -> tap a saved card -> back to tour details
```

**6. Profile and preferences**
```
traveller -> profile (`discover/profile`)
          -> edit name, home city, language, theme, currency, distance unit, notification toggles
          -> saved to this device
```

**7. Property browsing, a real room reservation, and a table/group enquiry**
```
traveller -> discover home -> property (`discover/property`) -> browse rooms + house rules
          -> set check-in date + nights -> "Reserve" on a room -> pick guests + a payment method
          -> "Pay & reserve" -> room booked: availability decrements, a reference is issued,
             the reservation appears under "Your reservations here" with a Cancel action
```
Same card/amount rules as every other checkout in the app (§3), plus the atomic
floor check against the room's own `total`/`booked` count:
```
"Pay & reserve" -> card declined -> inline failure message -> try another method, nothing charged
"Pay & reserve" -> fraud score over threshold -> inline "held for review" message, nothing charged
"Pay & reserve" -> another guest took the last room first -> inline sold-out message, nothing charged
```
```
property -> "Ask about a table or group booking" -> fill date, guest count, note -> "Send enquiry"
         -> lead created — no table held, no payment taken -> "View my enquiries" -> enquiries list (flow 8)
```

**8. Transport enquiry, and tracking every enquiry to a decision**
```
traveller -> discover home (or the Gear/Trips/Feed nav — Transport sits under Discover)
          -> transport (`discover/transport`) -> pick a date + passenger count + note
          -> "Send enquiry" -> lead created — no vehicle held, no charge until an owner's quote is accepted
```
```
traveller -> booking history (`booking/history`, "My enquiries" link) or either enquiry-sent
             panel above -> my enquiries (`discover/enquiries`)
          -> a request still awaiting a reply, or a quote with its line items and a real
             "Accept quote" action -> quoted -> accepted (§3 lead lifecycle's one paid
             transition) -> the owner has the agreed total on file
```

**9. Buy gear**
```
traveller -> "Gear" nav tab -> catalog (`shop/catalog`, category/seller/in-stock filters)
          -> product (`shop/product/:id`) -> pick a size/variant + quantity -> "Add to cart"
          -> cart (`shop/cart`, grouped by seller, coupon field) -> "Checkout"
          -> checkout (`shop/checkout`, address + payment method incl. COD + session countdown) -> pay
          -> order (`shop/order`, per-seller receipt) -> tracking (`shop/tracking/:ref`, packing → shipped → delivered per seller)
          -> once delivered: returns (`shop/returns/:ref/:subOrderId`) -> refund, minus return shipping unless it was the seller's fault
```
Same payment-machine branches as tours, gear-flavoured (§3: "one shared machine for
tours and gear"):
```
checkout -> card declined -> failed (`shop/failed`) -> back to cart, try another method
checkout -> fraud score over threshold -> held (`shop/held`) -> wait for human review
checkout -> stock ran out for a line item -> sold-out (`shop/sold-out`) -> back to cart, reduce quantity
checkout -> 10-minute session times out -> expired (`shop/expired`) -> nothing was ever held, cart is untouched
```

**10. Social — feed, posting, messaging, moderation**
```
traveller -> "Feed" nav tab -> feed (`social/feed`, Followed/Explore tabs)
          -> like or save a post -> post detail (`social/post/:id`) -> read or add a comment
          -> "Report" -> report (`social/report/post/:id`, pick a reason, optionally also block the account)
```
```
feed -> "Post" -> composer (`social/composer`) -> choose trip-report / photo / announce-departure
      -> write (2,200-char cap, auto-extracted tags) -> tick the paid-partnership disclosure if it applies
      -> "Post" -> back to the feed
```
```
tour details (operator name) or a post's author name -> profile (`social/profile/:id`)
          -> "Follow", or "Message" -> thread (`social/thread/:id`) -> type + send
          -> Sending → Sent → Delivered, or Failed with an explicit Retry
```
```
traveller -> chats (`social/chats`, All/Unread/Blocked tabs) -> a thread (`social/thread/:id`)
          -> block or unblock the other account — the transcript is preserved either way
```

**11. AI trip planning and the assistant**
```
traveller -> "Trips" nav tab -> planner (`ai/planner`, origin/days/budget/travellers/interests/pace
          — the constructed request payload shown live) -> "Build my itinerary"
          -> itinerary (`ai/itinerary`, real day-by-day plan; a day the catalog can't fill
             stays an explicit gap, never an invented stop)
          -> "View & book" a day -> tour details (`discover/tour/:id`, re-enters flow 2 above)
          -> or "Save itinerary" -> saved (`ai/saved`) -> "Open" a saved plan
          -> re-costs against live prices/availability, flags anything "gone since we planned it"
```
```
planner -> "Or just ask a question →" -> chatbot (`ai/chatbot`)
        -> ask about a booking / weather / a road / trip ideas -> every tool call shown openly
        -> a money question, a safety question, or two unclear answers in a row
        -> escalated to a person automatically; "Talk to a person" is also always on screen
```

**Formerly-known gaps, now closed**: an earlier pass of this map flagged two real dead
ends — the property page's "Reserve" button routing into `booking/checkout` with nothing
actually held, and no traveller-facing screen for what happens to an enquiry after
"Enquiry sent." Both are fixed as of flows 7–8 above, not by stretching `BookingContext`
(which stays tour-shaped) but by giving rooms their own booking action in
`TransportContext` (`bookRoom`/`cancelRoomBooking`, running through the same card/
amount/fraud rules as every other checkout, then an atomic floor check against the
room's own `total`/`booked`, same pattern as `setRoomTotal`'s existing hard floor) and a
real `acceptLead` transition plus a new `discover/enquiries` screen for the traveller
side of the lead lifecycle (§3). `PropertyDetail.jsx` also now reads the same live
`rooms` array `TransportContext` exposes to a property owner, rather than its own
hardcoded, disconnected room list — a property owner changing room prices/counts is now
visible to travellers immediately, the way the vendor→Discovery gap for tours is
explicitly *not* yet bridged (§8 module 04 entry) but this smaller, single-context case
now is. One remaining honest simplification: a room reservation resolves in one call
rather than a separate hold-then-resolve pair, since nothing in the source spec documents
a soft-lock requirement for a room the way it does for a tour seat.

### 02 · Booking & payment
- **checkout** — Guest rows: name + CNIC (`dir="ltr"`, placeholder `00000-0000000-0`),
  labelled "names must match CNIC or passport." Four payment methods, each with real
  field/help copy:

  | Method | Field | Example | Note |
  |---|---|---|---|
  | JazzCash | Mobile account number | `0300 4821776` | Push notification in-app |
  | EasyPaisa | Mobile account number | `0345 2210094` | 5-digit PIN prompt |
  | Card (Stripe) | Card number | `4242 4242 4242 4242` | 3-D Secure may ask your bank |
  | Bank transfer | IBAN | `PK36 SCBL 0000 0011 2345 6702` | Confirms next working day — **the one method that extends the soft-lock TTL instead of letting it expire** |

  Promo field: demo code `NORTH10` = 10% off.
- **gateway** — Simulated handoff; shows the payment ladder (`initiated → authorized →
  captured → failed/held`) as a live stepper with the current step highlighted — worth
  replicating as a visible payment-state indicator, not just an internal enum.
- **awaiting** — Displays `payment_id`, an idempotency key, and elapsed time; webhook
  resolves around 10s in the demo (real system: see §4 retry policy).
- **confirmed** — E-ticket with QR + reference (`SFR-YYYY-MMDD-NNNN`). "What changed in
  the system" panel literally lists the mutations (availability decrement, booking
  count, notification) — a useful dev-mode audit-trail pattern to keep for staging.
- **expired/failed/declined/late-webhook/held/sold-out** — each state's exact rule,
  authoritative for the transition logic:
  - `expired`: lock TTL elapsed → availability unchanged, payment never initiated.
  - `failed`: payment initiated→failed → soft lock released → no deduction.
  - `declined`: booking pending→cancelled, payment captured→refunded, lock released,
    commission accrual reversed.
  - `late-webhook`: webhook arrives after lock TTL → atomic check fails → payment
    captured→refunded → booking never created (see §3 atomic-check pattern).
  - `held`: payment initiated→held → fraud score above threshold → routed to admin
    fraud queue, no auto-confirm.
  - `sold-out`: same atomic-check failure as late-webhook, but triggered at lock time.
- **awaiting-accept** — Request-to-book (`instant` vs `request` booking mode, §3): 24h
  operator response clock, auto-cancels and releases the hold on timeout. *"No seats are
  deducted yet and you have not been charged."*
- **group-split** — All-or-nothing group payment, 24h window: *"if even one person
  hasn't paid when the window closes, everyone who did pay is refunded in full."*
  Organizer view needs per-participant status + a nudge action from the start.
- **participant** — The pay-link a non-account participant opens; explicit guest
  checkout for group-split participants only ("you don't need an account to pay").
- **cancel** — Reason select: `plans`/`weather`/`medical`/`operator`/`other`. `operator`
  always forces a 100% refund regardless of the listing's cancellation-policy tier;
  every other reason runs the date-tiered calculation from the listing's own policy.
- **checkout-ur** — Same fields, Urdu labels, CNIC/date/money stay LTR.

### 03 · Identity
- **role** — 6 role cards, each with a one-line doc-requirement teaser shown before
  commitment (doc requirements are config-dependent per role, not hardcoded).
- **register** — Phone (`+92` prefix) or email. Password hint: strong at **≥12
  characters** (length only, no complexity regex). **Duplicate-detection magic value**:
  phone `300 4821776` → shows a "this account may already exist" panel with sign-in/
  reset CTAs, deliberately without confirming which is true (avoids account
  enumeration). Password reset revokes every existing session on success.
- **login** — Phone-or-email + password. Session-security rules: see §4.
- **otp** — See Component library "OTP input." **Magic verify code: `419027`**. Error
  copy on a wrong code: *"That code is incorrect. N attempts left before this number is
  locked for 15 minutes."*
- **otp-exhausted** — 15-minute lockout; email fallback offered immediately during an
  SMS outage rather than hard-blocking (see §4).
- **kyc** — 3-step stepper (Account → Documents → Plan). Business name, owner CNIC
  (blur-validated, see §3), operating region (GB/KPK/AJK/Balochistan). Document upload
  cards carry independent per-document state (done/uploading/rejected-with-reason).
  Submit disabled until CNIC is valid and a certificate is chosen. **Autosave per step**
  is a hard UX requirement — a dropped connection on a mid-range Android must not lose
  20 minutes of typing.
- **kyc-pending** — Explicit allowed-vs-blocked split while pending: allowed = draft/
  save listings, set availability/pricing, choose plan; blocked = publish, receive
  bookings. Model as real permission checks, not just copy.
- **kyc-approved** — Enumerates what approval flips: every draft's publish unblocks,
  ledger moves accruing→pending on next batch, verified badge appears. Re-verification
  triggers on document **expiry**, never on a fixed timer.
- **kyc-rejected** — Reviewer reason shown verbatim (a stored field, never paraphrased).
- **kyc-ur** — Same fields, RTL; input/button min-heights increase slightly (48→50px,
  52→54px) for Naskh ascender clearance — a real CSS detail, not just a direction flip.

### 04 · Vendor (tour operator)
- **dashboard** — Gate banner tone: danger if `kyc==='rejected'` or `sub==='suspended'`,
  else warning if gated for another reason, else success. KPIs: awaiting-answer count,
  confirmed this month, acceptance rate, net earned. Payout summary always pairs gross/
  commission/net.
- **plans** — See the commission table in §3. Below the plan cards, a live explainer
  walks the full 5-state subscription machine with its permission grid per state.
- **subscribe** — Payment methods: card/JazzCash/bank transfer. **16% sales tax** flat
  on subscription price. Auto-renew charges 3 days before expiry. Two retries over 3
  days before moving to `grace` on a failed charge.
- **grace** — 3-day countdown, danger styling under 24h remaining. *"Nothing is
  deleted"* is the standing reassurance copy for both `grace` and `suspended`.
- **listings** — 4-step wizard: **Basics → Photos → Policy → Review**, autosaves every
  step (pill: "All changes saved" / "Saving…"). Basics: description has a **minimum
  120-character** requirement with a live counter that turns danger under threshold.
  Photos: **minimum 3 required to publish**, one marked Cover. Policy step is where
  `bookingMode` (`instant`/`request`) and `cancellationPolicy`
  (`flexible`/`standard`/`strict`) are chosen — see §3. Review step lists every publish
  blocker with a ✓/✕ icon; the publish button stays visible-but-disabled with its
  reason attached (Law 4), never hidden.
- **availability** — Per-departure seat-cap stepper with a **hard floor at the current
  booked count** — attempting to go lower shows: *"You can't set the cap below N — that
  many travellers have already paid for this date."* Same floor pattern reused for
  property room counts (§05 below). Blackout dates hide a date from search but never
  auto-cancel existing bookings on it.
- **inbox** — 4 tabs (Waiting/Answered/Declined/All) with counts. 24h "time to answer"
  countdown per request, turns danger under 6h remaining.
- **booking** (detail) — Masked CNIC display (`35202-4471829-6` format). Decline
  requires **exactly one of 4 fixed reasons**: no guide available / weather-road
  conditions / below minimum group size / permits won't clear in time — decline stays
  disabled until chosen. Ignoring a request until the 24h timeout counts as a decline
  **and** counts against acceptance rate (unlike an explicit decline, which doesn't
  necessarily need to).
- **payouts** — 3 buckets (Accruing/Pending/Released) plus a **Reversed** state on
  individual rows. *"Commission is deducted once, at accrual, and never re-applied. A
  refund reverses the accrual with it."*
- **payout** (detail) — Itemized: gross bookings, commission, a **refund-reversal line
  shown as negative**, transferred total. Changing bank details pauses payouts for one
  cycle while re-verified.
- **gate** — Exact publish-gate formula, shown to the vendor directly:
  ```
  publish requires:
    kyc_status == approved
    subscription in (active, grace)
    photos >= 3 · price > 0 · 1+ departure
  ```
- **analytics** — KPIs + a bookings-by-month bar chart + a traffic-source breakdown
  (search results / trip planner / influencer referrals / direct links). Explicit
  anti-vanity-metrics stance: no impression counts, no "engagement" figures.

### 05 · Transport & property
- **vehicles** — A vehicle flagged `needsPermit: true` auto-hides from search when its
  linked permit expires, in addition to a manual owner "pause" toggle — two independent
  visibility gates on the same object.
- **routes** — Explicitly **not an inventory object** — a pricing sheet only, no seats
  attached. Fare mode: `whole` (flat vehicle fare) or `seat` (per-seat + a required
  **minimum seats to run**, 1–12). *"Nothing on this screen holds a seat, reserves a
  vehicle, or takes money."*
- **quotes** (inbox) — 3 tabs (Awaiting/Quoted/Declined). "Reply within" countdown per
  lead. Declining a lead here does **not** require a reason (unlike the vendor booking
  decline, which does).
- **quote** (composer) — Itemized line items (vehicle/permit/fuel/driver-overnight),
  running total, and a **required expiry** (24h/48h/7 days) on every quote — see the
  lead lifecycle in §3.
- **permits** — Per-document card: days-left badge, `days ≤ 30` → warning "Expiring,"
  `days < 0` → danger "Expired." Gate formula:
  ```
  visible in search requires:
    permit.status == valid · vehicle.active == true · owner.kyc == approved
  warning at T−30 days · withdrawal at T+0
  ```
- **property** — Explicit distinction: *"Rooms are booked, enquiries are not. Room
  reservations take payment and reduce availability. Restaurant tables and group
  enquiries are leads."*
- **rooms** — Same hard-floor-at-booked-count pattern as vendor availability. Seasonal
  rate multipliers (peak ×1.4, shoulder ×1.0, winter ×0.6) apply on top of the nightly
  rate, but the **guest always sees one final computed number**, never a base+surcharge
  breakdown.
- **menu** — Per-dish on/off toggle; toggling off overlays "Off the menu today" but
  never deletes the item or its price history.
- **enquiries** — *"No table is held, no room is blocked, and no payment is taken."*
- **featured** — Region-based pricing (different base cost per region) × a 7–60 day
  slider (step 7). Live preview enforces the **2-per-10, disclosed** sponsored cap —
  buying beyond the cap queues rather than displacing organic results.

### 06 · Commerce (gear)
- **catalog** — Category/seller checkboxes with live counts, in-stock-only toggle.
  Per-seller commission table in §3.
- **product** — Size/colour selectors where individual sizes can be independently
  sold-out (`gone: true` per variant) — a size sells out on its own, not the whole
  product. *"Adding to a cart holds nothing. Stock comes down when payment is verified,
  not when you add — which is why two people can reach checkout for the last one."*
- **cart** — Grouped by seller, each with its own subtotal + shipping note. Coupon
  system: see §3's 5 failure modes — implement `result` as an enum returned by the
  server, and surface the server's exact message rather than a generic "invalid code."
  Shipping: flat Rs 350 per seller (§3).
- **checkout** — Same soft-lock visual pattern as booking checkout. Address: name,
  address, city (select), phone. COD blocking rule per §3.
- **order** — One payment split into N sub-orders, one per seller, each independently
  trackable/returnable.
- **tracking** — Per-parcel vertical step tracker with a courier reference; parcels from
  the same order on different couriers/clocks are explicitly independent — a delay on
  one never holds up another.
- **sold-out** — Same atomic-check-failure shape as booking's `late-webhook` (§3); has a
  restock-notify action.
- **expired** — Checkout-timeout screen; explicitly notes gear checkout **never held
  stock in the first place**, so nothing is "released" here (contrast with a tour's
  lock release).
- **seller-products** — Seller's own product list with a manual restock action.
- **fulfilment** — The 3-step packing→shipped→delivered sequence (§3); "ship within"
  clock during packing; a seller only ever sees their own sub-orders from a shared
  order, never another seller's parcel.
- **returns** — Reason select and shipping-cost rule per §3.
- **cart-ur / order-ur** — Urdu labels, numbers/prices stay LTR.

### 07 · Social & influencer
- **feed** — Tabs Followed/Explore with different ranking-disclosure copy per tab.
  Sponsored and moderation-state pills on cards. Blocked-author posts vanish with a
  count banner ("N posts hidden because you blocked this account"). Like/save are
  optimistic local toggles (the one other exception, alongside wishlist, to "no
  optimistic UI on financial state" — these aren't financial).
- **composer** — Post types: trip-report/photo/announce-departure. 2,200-character cap.
  Tags auto-extracted via a hashtag regex that supports Urdu characters. An
  "announce-departure" post must reference a real tour and pulls its live meta — *"does
  not hold or create anything."* **Paid-partnership disclosure is a mandatory checkbox,
  not optional** — undisclosed partnership content is removed and counts against the
  account, this is a hard moderation trigger, not just a style guideline.
- **post** (detail) — A comment `under_review` renders italic+muted with a "Hidden
  pending review" pill — visible to its own author, hidden from others, never hard
  deleted mid-review.
- **profile** — Tier badge (e.g. Platinum) is explicitly *"earned from completed
  collaborations and disclosed posts, never bought"* — don't model it as a purchasable
  flag.
- **chats** — Tabs All/Unread/Blocked. A blocked thread stays visible, greyed, **read-
  only**, transcript never deleted — unblocking restores it in full.
- **thread** — Message states exactly: **Sending → Sent → Delivered → Failed**, with an
  explicit retry action — no silent auto-resend (a duplicate message to an operator
  about a booking is a real-world failure mode the spec calls out directly).
- **report** — Uses the shared `REPORT_REASONS` (§3) as radio cards. "Also block this
  account" is a **separate mutation** from filing the report — either can happen
  without the other.
- **collab** — See the collaboration lifecycle in §3.
- **referrals** — Conversions list is the **same shared ledger rows**, filtered to
  `kind==='referral'`, that the admin ledger screen shows — one source of truth so the
  two surfaces can never disagree. "Earned, not yet paid" breaks out gross / 10% tax
  withheld / net.
- **campaigns** — Deliverable checklist per campaign; distinguishes "earned" (verified
  deliverable value) from "paid" (net of the 10% platform fee, actually disbursed).

### 08 · AI & location
- **planner** — Origin (select), date, days slider (2–21), budget slider (Rs 25,000–
  300,000, step 5,000), traveller stepper, interest chips, pace chips. The screen
  literally shows the constructed API call (`POST /ai/plan-trip {origin, days, budget,
  travellers, interests}`) as a transparency device.
- **itinerary** — Every line item carries a real listing id and checks live
  availability — **a day the catalog can't fill stays explicitly empty** with an amber
  gap notice, never an invented stop. Sold-out-since-planned items show "Gone since we
  planned it" instead of a book action.
- **saved** — Re-costs on open and surfaces a price-delta explanation if a rate changed
  since saving.
- **chatbot** — See the function-call transparency pattern in §3. Concrete example
  tool-calls used in the wireframe: `getBooking`, `getForecast`, `getRoadStatus`,
  `escalateToHuman`, `searchListings` — a useful minimal tool set to scope a v1
  implementation against.
- **escalation / map / landmark / tracking / geofence / weather** — see §3.

### 09 · Admin console
- **console** — KPI and module tiles both filtered live through `perms()` (§3); a
  denied area is absent, not disabled.
- **kyc** — See §3 (24h SLA, 4 fixed rejection reasons, per-vendor-type doc checklist).
  Approve/reject call the **same shared `setKyc` action** the vendor's own submission
  flow uses — there's no separate admin-only mutation path.
- **moderation** — Decision buttons generated from `MOD_TRANSITIONS` (§3), reporter
  reasons tallied on the card (e.g. "Spam ×2").
- **ledger** — Full table (Reference/Party/Gross/Rate/Commission/Net/State) — the
  commission rows compute live from the vendor/seller's own rate (§3's plan-driven
  model), referral rows pulled from the same shared array the referrals screen reads.
- **payout-batch** — Two-step approval enforced by identity (§3); a payee with an open
  dispute is excluded from the batch entirely.
- **disputes** — See the cross-module timeline pattern in §3.
- **fraud** — See the explainable rule-weight breakdown in §3.
- **analytics** — Tracks **completed** bookings (not created), plus a checkout funnel
  (reached checkout → completed payment → lost to lock expiry → lost to payment
  failure). Same anti-vanity-metrics stance as vendor analytics.
- **config** — Edits the 7-field policy object (§3) via sliders with live effect
  previews. Banner: *"Every default below is my proposal, not a decision"* — i.e. these
  are meant to be genuinely operator-tunable, not hardcoded launch values.
- **audit** — Filters (Everything/Refused/Money/Moderation) over one shared, append-only
  action log that every mutation (including refusals) writes to — including this
  screen's own filter/search actions should not be treated as exempt from that log in
  the real implementation. Row tone by action type: refused=danger, policy/permit/
  subscription changes=warning, reversals/cancellations/removals=held, else=success.

---

## 7. Client conventions already established

- **Folder structure — one convention, four directories**: `pages/`, `components/`,
  `context/`, and `data/` are all split into the **same** per-module subfolders, named
  after the module `id`s in §5's route table — `traveler`, `booking`, `identity`,
  `vendor`, `transport`, `shop`, `social`, `ai`. A vendor screen is
  `pages/vendor/*.jsx`; a vendor-specific composite (once one exists — today vendor
  pages compose entirely from `ui/`) would live in `components/vendor/`; its state is
  `context/vendor/` (`vendor-context.js` the raw `createContext` + constants,
  `VendorContext.jsx` the provider, `useVendor.js` the hook — **every** module's
  context follows this identical three-file split, never mixed into one file, because
  mixing component + non-component exports in one module breaks Fast Refresh); its
  seed data, if any, is `data/vendor/`. `context/app/` and `context/auth/` are
  "modules" in this same sense too — global state with no screen of their own, not an
  exception to the pattern. Two directories sit outside the per-module split on
  purpose because every module consumes them, not just one: `components/ui/` (the
  design-system primitive layer, §2) and `components/layout/` (`AppShell.jsx` +
  `Logo.jsx` — the one shell every role mounts through; named `AppShell`, not
  `TravelerLayout`, precisely because it isn't traveller-specific). A developer
  looking for anything vendor-related has exactly one place to check per concern —
  nothing module-specific lives loose at a directory root.
- **Reusable UI primitives**: `client/src/components/ui/` — `Button`, `Card`,
  `ChoiceCard`, `Countdown`, `EmptyState`, `SelectField`, `StatusPill`, `Stepper`,
  `TextField`, `Toggle` (barrel export at `ui/index.js`). These implement the design
  system's Component library (§2) — `Button` covers primary/secondary/tertiary/
  destructive × lg/md/sm × disabled/loading, `StatusPill` is the one-tone-per-state
  pill (never raw `className` strings for status), `Toggle` is a real `role="switch"`
  for on/off preferences (distinct from plain filter checkboxes), `TextField`
  supports a `prefix` slot (e.g. `+92`) for the with-prefix form-field variant,
  `ChoiceCard` is the single-select radio-card shape (role/plan/payment-method/
  cancellation-reason pickers all use it — extracted after the third hand-rolled
  copy, use it instead of a fourth), `Countdown` is the C-05 slot-lock timer — **use
  it for every countdown** (OTP TTL, checkout lock, 24h request/group windows,
  subscription grace) rather than a new inline timer per screen. `Countdown` renders
  `m:ss` under an hour and `h:mm:ss` at or above it (a 24-hour window shown as bare
  minutes reads as a bug, not a clock); see its own doc comment for why it takes a
  plain `seconds` duration and a `key` to restart, never a wall-clock timestamp.
  **Use these instead of hand-rolling buttons/pills/inputs/timers per screen** —
  every screen built so far pulls from this layer rather than duplicating Tailwind
  strings. `seatPill()` in `tours.js` returns a semantic `{ label, tone }`, not a
  class string — the data layer names the state, `<StatusPill tone={...}>` decides
  how it looks; follow that split for any other status source. Domain-specific
  composites that build on the primitives (e.g. `WishlistButton`, `DocumentUpload`)
  live beside their module (`components/traveler/`, `components/identity/`) rather
  than in the generic `ui/` layer. Shared validation lives in `utils/validators.js`
  (`isValidCnic`/`CNIC_ERROR`) — both the KYC wizard and checkout's guest-CNIC fields
  import from there rather than redefining the regex.
- **Global state**: React Context, not Redux. Eight providers now, all in `main.jsx`'s
  tree (`AppProvider` → `AuthProvider` → `BookingProvider` → `VendorProvider` →
  `TransportProvider` → `ShopProvider` → `SocialProvider` → `AiProvider`, outermost
  first — `AiProvider` nests last because it reads `useBooking()` internally for the
  planner/itinerary/chatbot, §8 module 08 entry): `AppContext` (`app-context.js`/`AppContext.jsx`/
  `useApp.js` — theme, currency, `language`, wishlist, `formatMoney`), `AuthContext`
  (`auth-context.js`/`AuthContext.jsx`/`useAuth.js` — `user`, `signupRole`, the
  in-flight `pending` OTP/reset session, register/login/OTP/KYC actions, and a
  `switchRole`/`ROLES` role-switcher — a single demo account acting as every platform
  actor, mirroring the wireframe's own role switcher; `AppShell`'s nav/logo/
  cart-visibility all key off `ROLES.find(r => r.id === user?.role)`, not real
  multi-tenancy), `BookingContext` (`booking-context.js`/`BookingContext.jsx`/
  `useBooking.js` — the §3 payment/booking state machine: `avail` (the **canonical,
  mutable** seat store — every screen that shows or changes seat counts reads this,
  not the static seed in `tours.js`), `lock`, `paymentState`, `bookings`, `requests`
  (request-to-book, each carrying a `guests: [{name, cnic}]` array collected in
  `TourDetail.jsx`'s request-mode UI), `groups` (group-split), plus the actions in §6
  module 02's per-screen notes below), and `VendorContext`
  (`vendor-context.js`/`VendorContext.jsx`/`useVendor.js` — the §3 subscription state
  machine, per-vendor `listings` CRUD, `publishGate`/`publishListing`, per-listing
  `departures`, and a seeded payout `ledger`; see §8 module 04 entry for the scope
  note on why published listings don't merge into the traveller Discovery catalog),
  `TransportContext` (`transport-context.js`/`TransportContext.jsx`/`useTransport.js` —
  module 05's vehicles/permits/routes/rooms/menu plus the shared lead lifecycle, §3; also
  owns the traveller-facing `bookRoom`/`cancelRoomBooking` pair — the one inventory type
  in this context that takes payment, so it runs through the same card/fraud rules as
  `BookingContext`/`ShopContext` — and `acceptLead`, the real `quoted → accepted`
  transition `discover/enquiries` calls),
  `ShopContext` (`shop-context.js`/`ShopContext.jsx`/`useShop.js` — module 06's cart,
  canonical mutable `stock` map, coupon `result`-enum validation, and the same
  payment/webhook machine as `BookingContext` reused for gear, §3 "one shared machine
  for tours and gear"; deliberately has **no** lock object at all, since a gear cart
  holds nothing — only a cosmetic checkout-session countdown), `SocialContext`
  (`social-context.js`/`SocialContext.jsx`/`useSocial.js` — module 07's posts/comments/
  threads, the shared `REPORT_REASONS`/`CONTENT_STATES` moderation registry written to
  be the same table a future admin queue would import, §3), and `AiContext`
  (`ai-context.js`/`AiContext.jsx`/`useAi.js` — module 08's planner/itinerary/saved/
  chatbot; reads `useBooking()` internally for live seats and bookings, which is why it
  must nest inside `BookingProvider` in `main.jsx`).
  Follow this three-file split (bare context object, provider component, hook) for
  any new global slice of state rather than one big provider file — and keep
  constants/non-component exports in the bare `*-context.js` file, never in the
  `*Context.jsx` provider file, or Fast Refresh breaks (ESLint's
  `react-refresh/only-export-components` catches this).
  `AuthContext`'s and `BookingContext`'s logic is **entirely mocked client-side**
  until `server/` has real endpoints — magic OTP `419027`, magic duplicate-phone
  trigger `3004821776`, deterministic payment-outcome triggers (Stripe test card
  `4000000000000002` → declined, `4100000000000019` → held for review, a mobile-
  wallet number ending `0000` → declined, a total ≥ Rs 400,000 → held), any
  non-empty login password succeeds. Every mock function returns the same
  `{ ok, ... }`/`{ kind, ... }` shape a real `fetch()` would, specifically so
  swapping the body for a real call later doesn't change any caller. `sold-out` and
  `late-webhook` outcomes need a genuine second actor to reach naturally (nothing
  else decrements `avail` between one browser's lock and its own confirm) — the
  Awaiting screen's "No live payment gateway is connected yet" panel force-picks
  every outcome for exactly this reason, same honest-labeling approach as the KYC
  preview links in identity (module 03), not hidden magic values. `language` is
  currently a **stored preference only** — `dir`/`lang` on `<html>` is deliberately
  not flipped yet, since no screen has RTL-aware layout (logical inset/margin,
  mirrored icons); doing that now would silently break existing screens rather than
  translate them. Real Urdu RTL support is a distinct build task — see §9.
- **React hooks lint is strict here — treat its errors as real bugs, not noise.**
  `eslint-plugin-react-hooks` in this repo (v7, React-Compiler-era rules) flags two
  things worth knowing before you fight them: (1) `react-hooks/purity` — never call
  `Date.now()`/`Math.random()`/etc. during render or inside `useMemo`. It's fine
  inside a function that only ever runs from an event handler or a `setTimeout`
  callback (e.g. `BookingContext.startLock` computing `expiresAt`) — but the linter
  can be inconsistent about recognizing that for a function *defined inside a
  component* that also appears in that same component's JSX (`TourDetail`'s own
  `onBook` was flagged even though it's only ever passed to `onClick`); when that
  happens, don't fight it — move the `Date.now()` call into the context action being
  invoked (already lint-clean) and pass it a plain duration/count instead. If a
  component needs a duration for display, compute it once in an event handler and
  pass down a **plain number**, never a timestamp to be diffed against `Date.now()`
  in render — see `Countdown`'s doc comment, `AuthContext`'s `pending.otpToken`, and
  `BookingContext.startLock`'s `departureDays` param (not a raw `departureAt`) for
  three variations on this. (2) `react-hooks/set-state-in-effect` — don't call
  `setState` synchronously as the first thing in a `useEffect` body; either move
  that call into the event handler that triggered the change, or push it inside an
  async callback (a `setTimeout`/`setInterval`/promise callback) so the effect's
  only synchronous job is starting the subscription. Where a value needs to reset
  when a prop changes, prefer forcing a remount via React `key` (what `Countdown`
  expects callers to do) over an effect that watches the prop and calls `setState`.
- **A `setState` updater function must be pure — no calling other `setState`s from
  inside it.** This isn't an ESLint-caught rule (nothing statically flags it) but a
  real bug class: React 18/19 StrictMode (enabled in `main.jsx`) deliberately
  invokes updater functions **twice** in dev specifically to catch impure ones, and
  this project hit it for real — `BookingContext.payShare`'s original version
  computed "did everyone just pay" and called `setAvail`/`setBookings` *inside* the
  `setGroups` updater callback, which silently **double-booked and double-decremented
  availability** every time a group split completed (visible in the browser as two
  identical confirmed bookings for one group). The fix: read the current state
  needed for the decision from the surrounding closure (safe — the action only ever
  runs from an event handler, so it sees the latest render's state), make the
  decision once, call `setGroups` with an updater that does nothing but return new
  state for `groups`, then make any *other* `setState` calls (`setAvail`,
  `setBookings`) as separate top-level calls afterward, not nested inside the first
  one. Before writing a `setX((prev) => { ...; setY(...); return ...; })` shape
  anywhere, restructure it this way instead.
- **Persisted UI prefs** (theme, currency, language) go in `localStorage` under
  `s360-*` keys, read defensively (`try/catch`, matching the wireframe's own
  pattern). Profile-only fields not read elsewhere yet (name, home city, distance
  unit, notification toggles) persist the same way directly in `Profile.jsx` under
  `s360-profile` rather than living in global context — promote them to `AppContext`
  only once another screen actually needs to read them.
- **Layout**: `components/layout/AppShell.jsx` wraps every role's routes (not just
  traveller's) via a single React Router `<Route element={...}>` layout route;
  `pages/ComingSoon.jsx` is the catch-all for unbuilt routes — keep using this instead
  of a blank 404 as new modules come online.
- **Route-level code-splitting**: every page in `App.jsx` is a `React.lazy()` import
  wrapped in one root `<Suspense>` — each screen ships as its own chunk (a few KB),
  fetched on navigation instead of bloating the initial bundle. Add new routes the
  same way (`const Screen = lazy(() => import('./pages/module/Screen'))`); a static
  `import` at the top of `App.jsx` pulls that screen back into the eagerly-loaded main
  chunk and defeats the point.
- **Mock data**: `client/src/data/<module>/*.js` — static data modules (`data/traveler/
  tours.js`, `data/shop/gear.js`, `data/social/social.js`) while there's no backend
  yet, one per domain area, following the same per-module split as `pages/`/`context/`.
  When wiring to the real API, replace the import with a fetch/hook, keep the shape
  stable so components don't need rewrites.
- **Images**: real destination photography lives in `client/src/assets/traveler/`
  (already sourced to match the wireframe's tour/property photos — Hunza, Fairy
  Meadows, Deosai, Skardu, Kalash, Gwadar, etc.). Prefer these over placeholders when
  building new screens for the same tours.
- **Path aliases**: none configured — relative imports only, matching existing files.

---

## 8. Suggested build order — status

Frontend-first phase (see the file-opening "Build strategy" note) is **complete across
all 9 modules, client-side only** — no real backend and no route guards until item 11
below. Per-module notes (what was added, what was deliberately deferred):

1. **Module 01 (discovery)** — done. All 7 non-Urdu screens (home, search, tour,
   property, wishlist, profile). Home/Search/TourDetail/PropertyDetail refactored onto
   the shared `ui/` primitives. `AppContext` gained a `language` preference.
2. **Module 03 (identity)** — done, client-side only. All 8 non-Urdu screens (role,
   register, login, otp, otp-exhausted, kyc, kyc-pending/approved/rejected). Added
   `AuthContext` (fully mocked register/login/OTP/KYC), `Countdown`, and
   `DocumentUpload`. No route guards yet at this point (added later, item 11).
3. **Module 02 (booking/payment)** — done, client-side only. All 15 non-Urdu screens.
   Added `BookingContext` as the canonical mutable seat store implementing §3's full
   state machine: a real soft-lock, atomic seat check read from closure state,
   deterministic payment-outcome triggers (§7), and refund-tier math reading each
   listing's own `bookingMode`/`cancellationPolicy`. `Outcome.jsx` is the one shared
   component for all six outcome branches. Non-obvious gotchas hit and fixed here (see
   §7 for the general rules these taught): `Countdown` must render `h:mm:ss` above an
   hour, not bare minutes; `payShare` had a `setState`-inside-`setState` purity bug that
   silently double-booked/double-decremented availability on every group-split
   completion; seed departure dates were hardcoded to a specific calendar date and had
   to become a `daysFromNow` offset instead (or refund-tier math silently degrades to 0%
   once "today" passes that date). **Not done**: no real backend, no route guards, and
   `sold-out`/`late-webhook` are only reachable via the Awaiting screen's labeled
   force-outcome panel (no genuine second actor exists in a single-browser demo).
4. **Module 04 (vendor)** — done, client-side only. All 12 routes. Added `VendorContext`
   (subscription state machine, listing CRUD with `publishGate`, per-listing departures
   with a hard floor at booked seats, seeded payout ledger with accruing/pending/
   released/reversed buckets). Added `switchRole`/`ROLES` to `AuthContext` — a single
   demo account acting as every actor, not real multi-tenancy — and made `AppShell`
   role-aware off it. **Deliberate scope decision**: vendor-published listings live only
   in `VendorContext.listings`, not merged into the traveller-facing Discovery catalog
   (`TOURS`/`BookingContext.avail`) — tracked as a known gap here, closed later on the
   backend side (§9's vendor-backend entry).
5. **Module 05 (transport & property)** — done, client-side only. All 10 routes, plus
   `TransportContext` and the `discover/transport` traveller enquiry screen.
6. **Traveller-facing slices of 06–08 (gear, social, AI)** — done, client-side only.
   Added `ShopContext`/`SocialContext`/`AiContext` and 19 pages across gear commerce,
   social, and AI. The seller side of commerce (`seller-products`, `fulfilment`,
   `returns`) and the influencer money screens (`campaigns`, `collab`, `referrals`) were
   also built in this pass — each pinned to one fixed demo-account id
   (`DEMO_SELLER_ID='karakoram-gear'`, `DEMO_INFLUENCER_ID='amna-sheikh'`), since neither
   role has real per-account identity the way vendor/transport/property do (single-entity
   by construction). The AI module's `map`/`landmark`/`geofence`/`weather` screens were
   also built; `Weather.jsx` is operator-facing despite sitting under the `ai/` prefix
   (routed under the `operator` role guard in item 11). A later audit against the actual
   decoded wireframe source (not just this file's own §5 summary, which turned out to be
   an incomplete transcription) found three real gaps that had been missed or
   misassessed: **`social/explore`** (a real search+live-hashtag-chip screen, distinct
   from the Feed tab that just re-filters in place), **`ai/tracking`** (a live in-trip
   location screen — distinct from `shop/tracking`'s gear-parcel courier tracking), and
   **`ai/escalation`** (a dedicated human-hand-off screen, wrongly assessed earlier as
   already covered by the chatbot's inline "Escalated" banner). All three are now built.
   Lesson for future module work: re-verify §5's route table against the decoded
   wireframe source directly rather than trusting a prior transcription.
7. **Module 09 (admin console)** — done, client-side only. All 10 routes. Added
   `AdminContext` (RBAC `perms()` matrix, the 7-field policy object, an append-only
   audit log every mutating action writes to) plus two new shared `ui/` primitives:
   `DataTable` (KYC/moderation/audit/payout-batch shared shell) and `KpiCard`/`BarChart`.
   KYC/fraud/disputes use seeded multi-actor data (no real multi-vendor account model
   exists); Moderation is fully live against `SocialContext`'s real posts/reports.
   Ledger, Payout-batch, and Analytics were built to the same conventions but not walked
   end-to-end in-browser in this pass — flagged as a follow-up check, not a blocker.
8. **Server** — not started at the time this item was written; the full plan is §9.
9. **Client-side restructure** — done. `context/` (previously flat, 23 files) split into
   `context/<module>/` mirroring `pages/`'s layout. `components/TravelerLayout.jsx`
   renamed to `components/layout/AppShell.jsx` (it wraps every role, not just
   traveller's). `data/traveler/gear.js`/`social.js` moved to `data/shop/`/`data/social/`
   (they're those modules' seed data, not discovery's). Dead Vite-boilerplate assets
   removed. `App.jsx`'s static page imports converted to `React.lazy()` + one root
   `<Suspense>`, splitting one large JS chunk into a shared chunk plus one small chunk
   per screen.
10. **Context re-render pass** — done. Every context provider's `value` object and every
    action function were being rebuilt fresh on each render (zero `useCallback`/
    `useMemo` anywhere in `context/`), so any state change in an outer provider
    re-rendered the entire 9-deep provider tree regardless of relevance. Fixed by
    wrapping every action in `useCallback` and every provider's `value` in `useMemo`.
    Also added a `vite.config.js` `manualChunks` split (function form — this Vite
    8/Rolldown setup rejects the older object form) so the react/react-dom/
    react-router-dom vendor chunk stays cached across app deploys.
11. **Nav data bug + route guards** — done. The `transport` and `seller` roles' "Money"
    nav item both wrongly pointed at `/vendor/payouts` (the tour-operator's own ledger).
    Fixed with dedicated `pages/shop/SellerPayouts.jsx` (Accruing/Payable buckets derived
    from fulfilment state) and `pages/transport/Money.jsx` (accepted quotes only, per
    §3's lead lifecycle, commission read live off `policy.commissionPct`). Also added the
    route guards flagged as a gap since item 2: `components/layout/RequireAuth.jsx` and
    `RequireRole.jsx` (same three-part gate template as `components/admin/PermGate.jsx`
    — an `EmptyState` stating blocked/why/what unblocks it, never a silent redirect).
    `App.jsx`'s route tree is now grouped: public (discovery browsing, the identity flow
    itself, public feed/profile/post, the group-split guest pay-link) → `RequireAuth` for
    everything else → nested `RequireRole` groups per actor. This is still a
    single-demo-account role-switcher, not real multi-tenancy, so gate copy says "switch
    Acting as," not a real authorization failure.
12. **Quick sign-in (testing-only)** — done. `AuthContext.quickSignIn(roleId)` signs
    straight in as a fresh test account for any of the 7 roles with no phone/OTP entry
    (partner roles start already `kycStatus: 'approved'`), surfaced as a labeled
    testing-only panel on `identity/Login.jsx` — same honestly-labeled-lever convention
    as `BookingContext.forceOutcome`. The header's "Acting as" switcher still moves
    between all 7 roles afterward with no further sign-in; this panel only removes the
    *first* sign-in's friction.

Do not build all 9 modules' UI against mock data first and wire the backend later "in
bulk" — the payment/inventory/moderation state machines are the actual product, and
building screens without their real transitions produces UI that has to be re-thought,
not just re-skinned.

---

## 9. Backend build plan — traveller-first, 2 devs, ~18 working days (20-day ceiling)

**Started 2026-09-01.** The frontend pass (§8) already did the hard design work: every
state machine in §3 is fully worked out and every context's mock actions already return
the exact `{ ok, ... }`/`{ kind, ... }` shape a real `fetch()` would (§7). Backend work is
therefore mostly **porting already-correct logic to the server and swapping fetch calls
in**, not re-deriving business rules from scratch — that's what makes ~18 days for 9
modules realistic for two people. Two rules carry over unchanged from the frontend phase:

1. **Traveller-first, sequential for the core, parallel after.** Auth → discovery →
   booking/payment is one dependency chain every other module sits on top of (a vendor
   needs KYC/auth to exist, gear checkout reuses the payment/webhook machine booking
   builds, admin reads everything). Build that chain first, with both devs pairing on it
   — it's the highest-risk part (soft locks, atomic inventory, webhook race conditions)
   and the part every later module either depends on or literally reuses. Only after it
   is real and verified do the two devs split onto independent modules.
2. **Integrate as you go, per module — no big-bang rewire at the end.** The moment a
   module's routes exist, swap that module's context actions from mock bodies to real
   `fetch()` calls and verify the flow in-browser before starting the next module. This
   is exactly why the mock functions were shaped the way they were (§7) — a calling
   component should never need to change, only the function body. Waiting until all 9
   backends exist to wire any of them risks discovering a shape mismatch nine times at
   once instead of once each.

### Server structure (build this first, day 1)

`server/` is currently a bare skeleton (`server.js` only, empty `controllers`/`models`/
`view`). Restructure to mirror the client's per-module convention (§7's "one convention,
four directories") rather than inventing a new layout:

```
server/
  server.js                    entry point — env load, DB connect, mount routes, listen
  src/
    config/
      db.js                    mongoose.connect, exits process on failure (fail loud, not silent)
      env.js                   reads/validates process.env, one place, never `process.env.X` scattered around
    middleware/
      auth.js                  requireAuth — verifies JWT, attaches req.user
      requireRole.js           requireRole('operator', 'admin', ...) — server-side twin of
                                the client's RequireRole guard (§8 item 11) — this is the
                                real security control; the client gate is UX only (§2 law)
      errorHandler.js          one JSON error shape: { ok: false, error: { code, message } }
      rateLimiter.js           per-phone-number sign-in throttle (§4)
    models/                    one file per collection, per §4's suggested list
    routes/<module>/           identity, discover, booking, vendor, transport, shop, social, ai, admin
    controllers/<module>/      mirrors routes/ 1:1
    services/                  cross-module logic that isn't a route handler:
      lock.service.js          soft-lock create/check/release (§ below — TTL-based)
      payment-gateway.mock.js  simulated gateway + async webhook fire (§ below)
      ledger.service.js        accrueCommission / reverseLedger — one implementation,
                                every module that touches money calls this, never a
                                second copy (§3 ledger is explicitly "6 states, not 3,
                                one shape" — the service layer should mirror that)
    utils/
      reference-numbers.js     SFR-/ORD-/pay_/LG-/GB- generators (§4) — build once, reuse
      validators.js            CNIC regex etc. — mirrors client/src/utils/validators.js
                                so the same rule lives on both sides, not just the client
```

Response shape convention: every endpoint returns `{ ok: true, data }` on success or
`{ ok: false, error: { code, message } }` on failure — deliberately the same envelope
shape the mocked context actions already use (§7), so the eventual `fetch()` swap is a
mechanical change, not a reinterpretation.

**Soft locks**: §4 frames these as TTL keys, Redis-first with a Mongo TTL index as
fallback. Since Redis isn't provisioned and adding new infra on day 1 is its own risk,
default to a **Mongo TTL index** (a `Lock` collection with an `expiresAt` field and a
`{ expireAfterSeconds: 0 }` index) unless the team already has Redis available.

**Payment gateway**: there is no real gateway integrated (Stripe/JazzCash/etc. are out of
scope for this pass — confirm with the user if that changes). `services/
payment-gateway.mock.js`: a charge request returns `pending` immediately, then
asynchronously fires a signed request to the app's own `POST /api/webhooks/payment`,
going through the **real** 3x/30s signature-verification-retry path (§4). Keep the same
deterministic test triggers the client already established (§7: card
`4000000000000002` → declined, `4100000000000019` → held, wallet number ending `0000` →
declined, total ≥ Rs 400,000 → held).

### Day-by-day

| Days | Dev A | Dev B | Milestone |
|---|---|---|---|
| **1** | Server restructure (above), DB connect, error/response middleware, `Policy` model (§3's 7 fields) + seed script, reference-number utils | `User` model (7 roles + `adminRole` sub-role, phone/email, `passwordHash`, `kycStatus`), `requireAuth`/`requireRole` middleware, route stubs for register/login/otp | `npm run dev` boots, DB connects, `/api/health` 200, `Policy` seeded and readable |
| **2–3** | Both, paired | Both, paired | Full identity backend: register, login, OTP (6-digit/5-min TTL/5 attempts/15-min lockout, email fallback on provider-down), JWT access+refresh with rotation-theft detection (§4: a reused refresh token revokes every session), password reset (code, never a password), per-phone rate limiting, KYC document endpoints (states `pending→approved\|rejected`, 4 fixed rejection reasons, per-document resubmission not full re-upload). **Swap `AuthContext`** — verify register→OTP→login and the KYC wizard in-browser against real endpoints. |
| **4–7** | Both, paired | Both, paired | Discovery + booking/payment core — the highest-risk chain, build together: `Tour`/`Listing` model (bookingMode + cancellationPolicy per listing, §3, not global), seed-migrate `data/traveler/tours.js`, search/filter/sort; soft-lock service; atomic seat deduction (`findOneAndUpdate` + `$gte` filter, §3's exact shape, null result → sold-out/late-webhook path, never oversell); mock gateway + webhook verification retry; `Booking` model covering all six outcome branches; refund-tier calculator reading each listing's own policy; request-to-book (24h window, no seat touched until accept); group-split (all-or-nothing, full refund on lapse). **Swap `BookingContext`** and discovery's data source — verify the full instant-booking path, request-to-book, group-split, and a cancellation refund end-to-end in-browser, plus a genuine two-tab race to confirm sold-out/late-webhook now happen for real instead of via the client's force-outcome panel (§7). |
| **8–9** | **Vendor backend** — subscription state machine (§3's 5-state graph incl. `past_due`/`grace`/`suspended` timers), listing CRUD + `publishGate`, per-listing departures, `LedgerRow` model + `ledger.service.js` (build the shared ledger service here — payouts are its first real consumer). Swap `VendorContext`, verify listing wizard → publish → payout math in-browser. | **Transport & property backend** — `Vehicle`/`Permit`/`Quote`/`Lead` models, the shared lead lifecycle (§3: request→quoted→accepted/expired/withdrawn, no money/inventory before accepted), room reservations (reuses the booking module's payment path, not a parallel one). Swap `TransportContext`, verify a quote round-trip and a real room reservation in-browser. | Vendor and transport/property both real; ledger service exists for later modules to reuse |
| **10–11** | **Commerce (gear) backend** — `Product`/`Order`/`SubOrder`/stock model, cart→checkout reusing the *same* payment/webhook machine from days 4–7 (§3: "one shared machine... only what capture touches differs"), coupon `result`-enum validation, per-seller shipping (Rs 350/parcel), COD two-condition block, 3-step fulfilment, returns (free-vs-Rs-350 shipping by fault). Swap `ShopContext`, verify a multi-seller checkout and a return in-browser. | **Social backend** — `Post`/`Comment`/`Thread`/`Report` models, the shared `REPORT_REASONS`/`CONTENT_STATES` registry (build this as the one table admin's moderation queue will import later, §3 — not a second copy), messaging with Sending→Sent→Delivered states, block/unblock. Swap `SocialContext`, verify posting, reporting, and a real chat thread in-browser. | Gear commerce and social both real |
| **12–13** | **AI backend** — port the planner's interest/rating/budget sort to read the real `Tour` collection server-side, chatbot tool-call endpoints (`getForecast`/`getRoadStatus` reading a small seeded lookup, same honest-uncertainty-disclosure rule, §3), escalation ticket creation (`buildScopedContext` ported server-side so the exclusion list — CNIC, card number, other bookings, saved cards — is enforced by the API, not just client-side courtesy), weather decision endpoint (calls the *same* `cancelBooking`+`reverseLedger` service functions, no parallel refund path). Swap `AiContext`, verify planner/chatbot/weather-cancel in-browser. | **Referral & collaboration backend** — extends `ledger.service.js` (built days 8–9) with `kind: 'referral'` rows, last-click 30-day attribution firing only from the verified-capture point, paid-on-completion-not-booking; `Collaboration` model with the exact `invited→accepted→in_progress→delivered→paid` transition table enforced server-side (illegal moves refused, not just unoffered — mirrors `CONTENT_STATES`'s pattern), `verified`+`disclosed` booleans gating `markDelivered`, `INFLUENCER_PLATFORM_FEE_PCT`-style constant applied once at the service layer, not duplicated. Swap the referral/collab pieces of `SocialContext`, verify a full collab lifecycle in-browser. | AI and referral/collaboration both real; ledger service now has both its consumers |
| **14–16** | Both, paired | Both, paired | **Admin backend** — built last and together deliberately, since it's the one module that reads every other module's data rather than owning its own: RBAC middleware (`adminRole` matrix from §3, enforced by route-level absence — a denied endpoint 404s or 403s, the response for a hidden nav item is never "here but disabled"), KYC/moderation queues (real, reading Identity/Social), ledger view (merges every module's real `LedgerRow`s — no more seeded `PLATFORM_LEDGER_EXTRA`), fraud scoring as a weighted-factor table (not a scalar column) reading `policy.fraudThreshold` live, payout batch two-step approval enforced by identity (preparer ≠ approver, checked against the authenticated user, not just a role check), disputes reading a real cross-module event timeline, audit log middleware on every mutating admin action. Swap `AdminContext` entirely, verify RBAC nav-by-absence, a real fraud hold→refund, and a real two-approver payout batch in-browser. |
| **17–18** | Both | Both | **Integration hardening** — real JWT-backed route guards replacing the client's role-switcher-only gates (§8 item 11 becomes real auth, not just UX); a genuine concurrent-request test against the atomic seat/stock deduction; full regression across all 9 modules, light+dark, zero console errors; decide the fate of the client-only testing levers (`forceOutcome`, `quickSignIn`, KYC preview links) — gate behind a dev-only flag or leave clearly labeled, don't silently ship them as real capabilities; update this file's own log the way §8's entries do, per module, as each is verified — not one summary at the very end. |
| **19–20** | — | — | **Buffer.** Deployment config (hosting for `server/`, MongoDB Atlas production cluster, env secrets), anything that slipped from days 1–18, final QA pass. |

This assumes both devs are working the chain days 1–7 together (the riskiest 40% of the
schedule) and split cleanly afterward — if that pairing turns out to run long, it eats
into the buffer at the end, not into a later module's time, since days 8+ are genuinely
independent per-column work.

### Progress log

**Day 1 (2026-09-01) — server skeleton, `Policy`/`User` models, auth middleware: done.**
`config/env.js`/`db.js` (fail-loud on connect failure — verified against a deliberately
unreachable Mongo URI, confirmed exit code 1), the `{ok,data}`/`{ok:false,error}` envelope
+ `errorHandler`, `models/Policy.js` (singleton, §3's 7 fields with real schema
min/max), `GET /api/admin/config`, `seeds/policy.seed.js`. `models/User.js` (7 roles +
`adminRole`, otp subdocument, bcrypt), `requireAuth`/`requireRole` middleware. No MongoDB
was provisioned in this environment, so the DB round-trip itself wasn't run
end-to-end at this point — that needed a real `MONGODB_URI` (Atlas free tier is fine).

**Days 2–7 (2026-09-02) — full identity + discovery + booking/payment core: done.**
Identity: register/login/otp-verify/resend/refresh/logout/me, password forgot/reset. Real
bcrypt+JWT, 6-digit OTP (5 min TTL/5 attempts/15-min lockout) with the client's magic code
`419027` kept as a non-production bypass. Refresh rotation is a real `Session` model keyed
by `family`/`jti` — reusing an already-rotated token kills the whole family (§4's theft
rule); a password reset kills every session for the user. Per-phone rate limiting
(in-memory, documented Redis stand-in).
Discovery: `models/Tour.js` (embedded `departures`, each with its own
`seatsTotal`/`seatsLeft`), seeded from `tours.js`'s 10 rows by hand (that file imports
`.jpg` assets, so it can't be `require()`d server-side). `GET /api/discover/tours` ports
the client's exact search/filter/sort logic including the sponsored-slot interleave.
Booking/payment: soft lock as a Mongo TTL collection; mock gateway + webhook service
resolving through one `processPaymentWebhook` function whether delivered in-process or via
a real webhook POST, deterministic test triggers preserved, fraud score modeled as the
weighted-factor breakdown (§3), not a bare number; atomic seat deduction via
`findOneAndUpdate` + `arrayFilters` + `$gte`; all six outcome branches real; cancellation
reads each booking's snapshotted policy tier, restores the seat, reverses the ledger row;
request-to-book's 24h window is enforced lazily on read (no cron infra); `ledger.service.js`
(`accrueCommission`/`reverseLedger`) is the one shared implementation, reading
`Policy.commissionPct` as the fallback rate until the real per-vendor rate exists.
**Bug caught before verification**: the first draft kept a booking's `Lock` alive until its
webhook resolved, leaving a window where checkout could double-submit against the same
lock — fixed by snapshotting `lockExpiresAt` onto the `Booking` and releasing the `Lock`
immediately at checkout; the webhook reads the snapshot, and a second checkout on an
already-consumed `lockId` now 404s.
Verified genuinely (not just syntax-checked): `mongodb-memory-server` installed as a
throwaway dev-only tool (never touched `package.json`, removed after the run) to drive the
real `server.js` over real HTTP. 34 assertions passed, covering auth (register/OTP/login/
refresh-rotation/theft-detection/rate-limiting/duplicate-phone), discovery search/sort,
the full instant-booking path with a real atomic seat decrement, the double-checkout fix,
decline/fraud-hold outcomes, tiered-refund cancellation, request-to-book, and password
reset revoking every session.
**Not built at this point**: group-split/guest pay-link backend (closed below,
2026-09-03); real payment gateway (still out of scope, confirm with user); KYC review
endpoints (vendor-side, lands with the vendor module).

**2026-09-03 — client fetch-swap + group-split backend + traveller module complete.**
`AuthContext`/`BookingContext` (and dependent screens: Login, Register, Otp, Checkout,
Awaiting, Cancel, History, TourDetail) swapped to the real endpoints via a new
`client/src/utils/api.js`.
Group-split: `models/GroupSplit.js` + routes mounted at `/api/booking/group`, ahead of the
auth-required `/api/booking` router so a participant with no account can still reach it.
All-or-nothing for real — the final participant's payment is the one real capture point,
running the same atomic-deduct + `Booking.create` + `accrueCommission` path as instant
checkout, not a parallel implementation; a lapsed window settles lazily on read.
`BookingContext`'s `startGroupSplit`/`payShare`/`lapseGroup` swapped to real endpoints;
added `fetchGroup` for a participant opening the pay-link on a fresh device.
**Real bug caught and fixed**: `deductSeat`'s `$gte` seat guard lived only in
`arrayFilters`, which is not itself a top-level match condition — an already-sold-out
departure could still match the top-level filter and silently skip the anti-oversell
check, on **both** checkout paths. Fixed by moving the `$gte` condition into the top-level
query via `$elemMatch`. Confirmed with a forced race against the main checkout endpoint.
Verified: 18 new assertions (group-split happy path, no-account pay, idempotent re-pay,
lapse-with-one-unpaid, pay-into-lapsed-window refused, sold-out race on the final payment)
plus the full pre-existing 43-assertion suite re-run clean against the `deductSeat` fix.
**Traveller module (identity + discovery + booking/payment) is 100% of its defined §9
scope as of this date.** Deliberately still out of scope: a real payment gateway (confirm
with user before integrating); Discovery's Home/Search browse surface still reads the
mock `TOURS` catalog for images/copy — booking-critical reads (departures, seats, locking,
group-split) already go through the real `Tour` collection via a documented `slug` bridge
in `TourDetail`; re-pointing Home/Search's browsing surface at the live collection is a
separate, larger frontend change, not a backend gap.

**Vendor backend (module 04) — started 2026-09-03, ~50% of days 8–9's scope.**
`models/Subscription.js` + service (full 5-state graph, lazy-timer settlement on read,
same "check on read, no cron" pattern), plan table in `utils/vendorPlans.js` copied onto
the Subscription doc at subscribe time. `models/KycDocument.js` + service (per-document
review, resubmission reuses the same row, 4 fixed rejection reasons enforced
server-side, aggregate `User.kycStatus` recomputed on every submit/review; admin-gated
even though the admin console doesn't exist yet). `Tour` extended with `ownerId`/
`status`/`photos` (previously a bare string with no real Vendor/User link); full listing
CRUD, photo management, per-departure add/blackout/seat-edit with the booked-seat floor.
`utils/publishGate.js` ported from the client, now also checking a real plan
listing-cap. **Per-vendor commission wired into both real capture paths** — the webhook
service and `operatorDecision` both read the paying vendor's own
`Subscription.commissionPct` first, falling back to `Policy.commissionPct` only for
ownerless/legacy tours — closing the "fallback-always" gap flagged in the days-4–7 log.
`GET /api/vendor/ledger` — the ledger service's first real consumer.
Verified: 43 assertions covering the full subscription lifecycle, KYC submit→reject→
resubmit→approve, publish-gate blocking/unblocking correctly per condition (including a
Starter plan's 3-listing cap), a real traveller booking against a vendor listing
confirming via the real webhook path, and the vendor's ledger showing the vendor's actual
plan rate (9% Pro) rather than the Policy default (12%).
**Not built (remaining, as of the 2026-09-03 pass)**: admin-side payout batches / two-step
preparer-≠-approver approval (module 09 scope — this module only exposes the vendor's own
read+reverse view); real file storage for KYC documents/listing photos (`fileRef` is
still a client-supplied string handle — out of scope for this pass, confirm with user
before adding one); `VendorContext`'s fetch-swap. Module 05 (transport & property)
backend — the parallel Dev-B track for these same days — has not been started.

**Real vendor inbox + analytics endpoints — 2026-09-05.** Closed the two items this
section had flagged as outstanding for module 04 itself (not module 09's or module 05's
share): the old `POST /api/booking/:ref/operator-decision` (booking.controller.js) had
**no ownership check at all** — any signed-in operator could accept/decline any other
operator's booking request, exactly the "deliberately lightweight stand-in, not the real
vendor inbox" gap flagged since the days-4–7 log. Replaced it with
`controllers/vendor/bookings.controller.js`, mounted under the existing
`requireRole('operator')` vendor router: `GET /api/vendor/bookings[?status=]` and
`GET /api/vendor/bookings/:ref` (both scoped to `Tour.ownerId === req.user.id` — a
booking against another vendor's tour 404s, not just hides), and
`POST /api/vendor/bookings/:ref/decision` (`action: 'accept'|'decline'`, decline
validated server-side against the same 4 fixed reasons as
`client/src/context/vendor/vendor-context.js`'s `DECLINE_REASONS`, now mirrored in
`utils/declineReasons.js`). Guest CNICs are masked server-side (`utils/validators.js`'s
new `maskCnic`) rather than sent in full and masked only in the client. `Booking` gained
an `autoDeclined` boolean, set only by the lazy 24h-lapse path
(`settleIfLapsed`, now exported from `booking.controller.js`) — §6 vendor/booking-detail's
distinction that a timeout counts against acceptance rate while an explicit decline
doesn't is real, not just documented: an explicit decline never sets it.
Added `GET /api/vendor/analytics` (`controllers/vendor/analytics.controller.js`):
`bookingsCount` (confirmed bookings against the vendor's own tours), `netEarned` (real
ledger sum, a reversed row counted negative rather than dropped — matching Payouts.jsx's
own "netted against your next payout" framing), `acceptanceRate` (`accepted / (accepted +
autoDeclined)`, `null` until at least one exists — never a fake percentage), and `monthly`
(a real 6-month trailing aggregate of confirmed-booking counts, genuinely computed from
`Booking`/`Tour.ownerId` now that vendor listings carry a real owner link — sparse in a
fresh dev database, but real rather than seeded). Traffic-source breakdown is deliberately
**not** part of this endpoint — no referral/campaign click-tracking backend exists yet
(that's §9 days 12–13 scope) — so the client's "Where bookings come from" section stays
seeded/illustrative until that module lands, rather than this endpoint inventing numbers
it can't back.
Verified genuinely: a 61-assertion `mongodb-memory-server` run (same throwaway-dependency
method as every other pass here) covering two separate vendors with their own published
request-mode tours — vendor B gets a 404 both reading and deciding vendor A's booking;
masked CNIC on read; a bad decline reason 400s; an explicit decline does not set
`autoDeclined`; accept deducts the real seat and posts a ledger row at the vendor's own
plan rate (Pro, 9%) with the correct gross; deciding an already-decided booking 409s; a
forced-lapsed request auto-declines with `autoDeclined: true`; analytics' acceptance rate
correctly excludes the explicit decline from both sides of the ratio; a non-operator gets
403 from the whole `/vendor/bookings` surface; and reversing the ledger row flips
`netEarned` negative. All 61 passed; the throwaway script and dependency were both removed
after the run.
**`VendorContext` fetch-swap, plus closing the request-to-book loop end-to-end —
2026-09-05.** `VendorContext.jsx` now calls the real endpoints throughout — subscription
(incl. the plan-id case map, client `starter/growth/pro` <-> server
`Starter/Growth/Pro`), listing CRUD (`updateListing` is optimistic-local + debounced
500ms per listing id, accumulating rapid successive field edits rather than dropping all
but the latest — a per-keystroke PATCH would have spammed the server and let a stale
response clobber a newer edit), the booking inbox (`fetchInbox`/`acceptBooking`/
`declineBooking`, replacing `Inbox.jsx`/`BookingDetail.jsx`'s old reads off
`BookingContext`'s mock `requests`/`acceptRequest`/`declineRequest`), the ledger, and the
new analytics endpoint. `SEED_LEDGER`'s 4 rows are kept as a permanent local-only
exception, not removed — `AdminContext`'s fraud/dispute demo resolutions and
`AiContext`'s weather-cancel demo both call `reverseLedger` against those fixed ids
(`LG-4002`/`LG-4003`/`LG-4004`), and a freshly-registered real vendor's own ledger starts
empty, so `reverseLedger`/`fetchLedger` special-case those 4 ids into local-only
mutations, the same shape `BookingContext`'s own `LEGACY_SEED_REFS` already established.
Every vendor page that reads `subscription`/`listings`/`ledger`/`inbox`/`analytics` now
fetches on mount (`useEffect`, matching `History.jsx`'s existing `fetchHistory()`
convention) rather than assuming the data is already there.
Wiring the inbox surfaced a real, live gap: `BookingContext.createRequest` (the
traveller's own "send a request" action, called from `TourDetail.jsx`) was **still the
old mock** — request-mode bookings were never actually sent to the real
`POST /api/booking/request` at all, so the real vendor inbox just built would have stayed
permanently empty in the running app. Closed both ends of this: `TourDetail.jsx` now
fetches `liveTour` for request-mode tours too (previously skipped outright, request mode
booked only against a hardcoded mock departure list) and calls the real `createRequest`
with a real tour/departure id; `BookingContext.createRequest` now POSTs for real and
returns `{ok, ref, deadlineAt}` instead of mutating a local mock queue.
`acceptRequest`/`declineRequest` and the `requests` array are removed from
`BookingContext` entirely — deciding a request is exclusively `VendorContext`'s
ownership-scoped job now, not something a traveller's own context should be able to do.
`AwaitingAccept.jsx` (the traveller's own waiting screen) is rewritten from a page that
let the *traveller* fake-play the vendor's accept/decline buttons (a frontend-phase
stand-in, labeled "No vendor inbox is built yet (module 04)") into a pure poller —
`checkBookingStatus(ref)` every second, exactly like the instant-mode `Awaiting.jsx`
already does — until the server (i.e. the vendor's real decision) resolves it.
`checkBookingStatus` itself had a real bug for this to work at all: it only recognized
`status === 'pending'` as "still waiting," but a request-mode booking's in-flight status
is `'awaiting-accept'` — the old check would have treated an untouched request as already
terminal-and-failed on the very first poll. Fixed to treat both as pending, and to only
touch `paymentState` for the payment-flavored terminal states (confirmed/held/failed),
leaving a plain `'declined'` alone rather than mislabeling it as a payment failure.
Verified genuinely (not just lint/build): a 31-assertion `mongodb-memory-server` run
(same throwaway-dependency method as every prior pass) driving the exact HTTP shapes the
new client code sends — PATCH/DELETE support end to end (listing field patch incl.
`description`, photo add/delete, departure seat PATCH), publish, and the **full real
request-to-book loop**: a traveller creates a request against a real departure id
resolved via `/discover/tours/:id`, the vendor's real inbox shows it pending with an
already-masked CNIC, the vendor accepts it for real, and the traveller's own status poll
correctly flips from `awaiting-accept` to `confirmed` and the booking lands in real
history. Also a clean `eslint` (project-wide) and a clean production `vite build`
throughout every edit in this pass.
**Still not built**: the shared `identity/kyc` wizard is still on `AuthContext`'s mock
`submitKyc`/`setKycStatus`, and `quickSignIn`/`switchRole` not carrying a real token —
both flagged here, both fixed in the two dated entries right below. Admin payout batches,
vendor file storage, and module 05 backend remain exactly as the paragraph above left them.

**`identity/kyc` wizard wired to the real endpoints — 2026-09-05.** Real document review
only exists server-side for `operator` (`routes/vendor/index.js` gates the entire
`/vendor/kyc/documents` surface behind `requireRole('operator')` — `kyc.service.js`'s own
comment: "Only `operator` is in scope for this module"). Rather than silently 403ing
`transport`/`property`/`seller` (also `PARTNER_ROLES`, per `auth-context.js`) or ripping
out their only working KYC flow, `Kyc.jsx`/`KycPending.jsx`/`KycRejected.jsx` branch on
`user.role === 'operator'`: real for operator, the pre-existing local-mock flow
unchanged for the others. New `utils/kycDocs.js` holds the client<->server type map
(`cnicFront`/`cnicBack`/`registration` <-> `cnic_front`/`cnic_back`/
`business_registration`) and a `REJECTION_LABELS` map for the 4 fixed reason ids, mirroring
`server/src/models/KycDocument.js`'s enums exactly (§4: "the same rule lives on both
sides"). `AuthContext.jsx` gained `fetchKycDocuments`/`submitKycDocument`/`refreshUser`
(the last needed because a document submission or an out-of-band admin decision doesn't
otherwise touch the locally-cached `user` object — `kycStatus` has to be explicitly
re-read); `submitKyc`/`setKycStatus` stay exactly as they were, still serving the
non-operator mock path (and `setKycStatus` is also still admin module 09's own
"this session's live demo account" convenience in `pages/admin/Kyc.jsx`, untouched).
`DocumentUpload.jsx` now takes an optional `onUpload` prop — real async submission when
given (operator), the original simulated timeout when omitted (everyone else) — one
component, two backing implementations, not a fork. A real per-document `approved` status
got its own pill (there wasn't one before; every uploaded doc just said "in review"
forever, even once genuinely approved) — server is the only one that gets to say
"verified" (§2 law), so `approved` still never unlocks anything the reviewer hasn't
granted (no "Replace" once a document has cleared).
One genuine backend gap surfaced and was deliberately **not** papered over: the wizard's
own "Account" step (business name, operating region) and the owner-CNIC text field have
nowhere real to persist to at all — `User` has no such fields, and nothing else on the
server models a vendor's business profile. Wiring those would mean adding new backend
schema, which is a bigger, separate decision than "wire to the *existing* endpoints" — so
that step stays exactly the local-draft-only UX it always was (`localStorage`,
unautosaved to any server), for every role including `operator`, while the Documents step
underneath it is now fully real. Flagged rather than silently left inconsistent.
`KycPending.jsx`'s old "preview" buttons (`setKycStatus('approved'/'rejected')`) would
now be actively dishonest for `operator` — the real `user.kycStatus` persists
server-side, so faking it locally would visibly "un-fake" itself on the next
`refreshUser()`/reload. Replaced with real polling every 5s (`refreshUser`, same
"check on read" shape as every other lazily-settled state in this app), routing to
approved/rejected the moment a real decision lands; since no admin console UI exists yet
to actually make that decision from a browser, the copy says so honestly rather than
offering a working-but-fake shortcut. `KycRejected.jsx`'s reason now comes from the real
rejected `KycDocument.rejectionReason` (there's no aggregate reason field on `User` at
all — rejection reasons only ever lived per-document) mapped through the same
`REJECTION_LABELS`.
Verified genuinely: a 28-assertion `mongodb-memory-server` run (same throwaway-dependency
method as every prior pass) — a fresh operator starts at `kycStatus: 'none'` with 0
documents; submitting all 3 required docs flips the aggregate to `pending`; an admin
rejecting one with `image_unreadable` flips it to `rejected` and the raw reason maps to
the client's exact "Image unreadable" label; resubmitting the same document type reuses
the same document id and clears the rejection back to `pending` (not a new row); approving
all 3 flips the aggregate to `approved`; and a traveller is correctly 403'd off the entire
`/vendor/kyc/documents` surface, both reading and submitting — confirming the branch in
the client is necessary, not just cautious. Clean `eslint` (project-wide) and `vite build`
throughout.

**`quickSignIn`/`switchRole` now carry a real token — 2026-09-05.** Both previously
cleared/never held a real access token at all (pure local-state role labels, §7/§8 item
12), so "Acting as: operator" via either shortcut sent every vendor request with no
`Authorization` header — a 401 before the role check even ran. Fixed in
`AuthContext.jsx`: a new `signInAsRealRole(roleId)` does a genuine register-then-OTP-
verify (server's documented dev-bypass code `419027`) the first time a role is used, and
a plain login on every call after that (register correctly replies `DUPLICATE_ACCOUNT`,
which is the signal to fall back to login) — one fixed real test phone/password per
self-registerable role (`3009000001`..`3009000006`), so the same demo account is reused
rather than registering a fresh one on every click. Both `quickSignIn` and `switchRole`
now call this; `admin` is the one exception left as a local-only mock, since there's no
self-registration for it (§4 — an admin account is seeded server-side) and no real admin
endpoints exist yet to need a real token against anyway. Partner roles no longer start
`kycStatus: 'approved'` for free — silently pre-approving KYC from the client would be
faking a real admin decision (§3: "the model does not decide, a person decides" — the
same principle), so a quick-signed-in vendor now walks the real KYC/subscription flow
from a fresh account like any real vendor would. Each role's real state (KYC,
subscription, listings, bookings) now persists across "switches" for free, as genuine
server state, rather than needing the old mock's local kycStatus-preservation logic.
Both call sites (`Login.jsx`'s quick-sign-in panel, `AppShell`'s "Acting as" select) are
now async with a brief in-flight state and a visible error on failure — a real network
round trip replaced what used to be an instant local mutation, so both needed a way to
show something other than silently doing nothing if the round trip fails.
Verified genuinely: a 10-assertion `mongodb-memory-server` run (same throwaway-dependency
method as every other pass) proving the exact sequence — first call registers and gets a
real `role: 'operator'` JWT; that token actually passes `GET /vendor/listings`
(`requireRole('operator')`), while a real traveller's own token still correctly 403s on
the same route (proving this is a real role check, not "any token works"); a second call
for the same role hits `DUPLICATE_ACCOUNT` and logs in instead, and that session's token
also passes the gate; and a listing created, then "switched away" from and back to,
survives untouched — real server state, no client bookkeeping needed. Clean `eslint`
(project-wide) and `vite build` throughout.

**Admin KYC queue wired to real `operator` applications — 2026-09-05.** The vendor's own
KYC wizard (previous entry) had a real per-document submit/list endpoint but no way for
an admin to see WHAT to review — `GET /api/vendor/kyc/documents` is vendor-scoped (one
signed-in vendor's own docs), and the only admin-facing route was `POST .../:id/review`,
a blind "decide by id" action with nothing upstream to list ids from. Added
`GET /api/vendor/kyc/documents/queue` (admin-only, mounted alongside the existing review
route ahead of the blanket `requireRole('operator')` gate): `kyc.service.js`'s new
`listQueue()` groups every `KycDocument` by vendor (a reviewer decides per document, §3,
but browses per vendor application) and joins each group to its vendor's name/role/real
`kycStatus`. `AdminContext.jsx` gained `fetchKycQueue`/`reviewKycDocument`, merging real
rows (tagged `real: true`) over the **permanent** seeded `KYC_QUEUE` rows — same "seed
stays, real merges in" shape as `VendorContext.SEED_LEDGER`/`BookingContext.
LEGACY_SEED_REFS` — since transport/property/seller vendor types still have no real KYC
backend to replace their demo rows with (only `operator` does, per the previous entry's
own note). `pages/admin/Kyc.jsx` branches per row: a seeded row keeps its exact original
one-button-per-vendor Approve/Reject-with-one-reason UI; a real row's Documents column now
shows each document with its own status and, if still pending, its own Approve/Reject
(one of the same 4 fixed reasons, mirrored via `utils/kycDocs.js`'s `REJECTION_LABELS` —
new `DOC_TYPE_LABEL` map added alongside it for display) — the real per-document
granularity the mock's flat per-vendor row never modeled, since the seeded demo data
predates the real backend's exact shape.
Verified genuinely: a 23-assertion `mongodb-memory-server` run (same throwaway-dependency
method as every prior pass) — the queue is empty before anyone submits; submitting
partially groups correctly into one row with all of that vendor's documents, and a second
vendor's later submission appears as a genuinely separate row without disturbing the
first; rejecting one specific document flips only that document (and the vendor's
aggregate status) while the vendor's other two documents stay untouched — proving
per-document, not per-application, granularity; a resubmit-then-approve-everything cycle
flips the aggregate to `approved`, visible both in the queue and on the vendor's own
`/identity/auth/me`; and neither the vendor themselves nor a traveller can read the queue
(403), confirming it's genuinely admin-only. Clean `eslint` (project-wide) and `vite
build` throughout.

**Module 05 (transport & property) backend, full pass — 2026-09-05.** The parallel
Dev-B track §9 always intended to run alongside vendor (04) — untouched until now, all
mock. New models: `Vehicle`, `Permit` (a real `expiresAt` date, `daysLeft` computed live
at read time — never a decaying stored counter), `Route` (pricing sheet, no inventory
field on purpose), `Room`/`RoomBooking` (the one inventory in this module that takes real
payment), `MenuItem`, `Lead` (the shared shape for transport quotes and property table/
group enquiries, §3). Mounted at `/api/transport/*`, gated per-route by
`requireRole('transport')`/`requireRole('property')`/both for the shared lead endpoints,
with the traveller-facing actions (`create`/`accept` a lead, `book`/`cancel` a room)
mounted ungated ahead of those checks — same shape vendor's KYC-review route already
established. Two new public endpoints, `GET /api/discover/vehicles` and
`GET /api/discover/rooms`, exist for the same reason booking's own `GET /discover/tours`
does: a traveller enquiring or booking needs a real id to act against, and neither
`Transport.jsx` nor `PropertyDetail.jsx` browse a real multi-owner catalog (both still
show one arbitrary single entity, same simplification as `TourDetail`'s own slug bridge) —
`discover/rooms` also returns that owner's real id, since a table/group enquiry has no
vehicle-like subject to resolve one from server-side the way a transport lead does.
Room booking reuses the exact same deterministic decision function the real booking
webhook already uses (`payment-gateway.mock.js`'s `decideOutcome`, newly exported) without
the pending/async webhook step — one call, no soft-lock, matching §8 module 05's own note
that nothing in the source spec documents a hold requirement for a room the way it does a
tour seat. The lead lifecycle's one lazy-settle case (`quoted → expired` once the quote's
own expiry passes unaccepted) follows the same "check on read, no cron infra" shape as
booking's `settleIfLapsed`; `request`-status leads have no auto-transition at all — §3's
lifecycle diagram doesn't define one, the 24h clock there is display-only.
A real, structural gap surfaced and was deliberately not routed around: real KYC review
only covers `operator` (kyc.service.js's own scope), so a real `transport`/`property`
account's `kycStatus` can never leave `'none'` — enforcing CLAUDE.md §3's literal
visibility formula (`... AND owner.kyc === 'approved'`) would make every real vehicle
permanently invisible in discover and every real property permanently "unverified" for no
reason tied to anything actually gated. `discover/vehicles.controller.js` drops that
clause (active + valid-permit-if-needed only) with a comment explaining why; the client's
`Vehicles.jsx`/`Property.jsx` pass `kycApproved`/`kycApproved`-equivalent as `true`
unconditionally now, rather than reading a `kycStatus` that structurally can't help them.
Also fixed while wiring, not left as a known gap: adding a permit and linking it to a
vehicle now actually flips that vehicle's `needsPermit`/`permitId` — the client mock never
wired this connection at all (`Vehicles.jsx` had no way to set `needsPermit`, and the old
`addPermit` never touched it either), so the permit gate had only ever been exercised by
seed data, never a real add-permit action.
Client: `TransportContext.jsx` calls the real endpoints throughout — `vehicles`/`rooms`
are shared slots between the owner's own CRUD fetch and the public discover fetch (only
one is ever active per screen, the same single-demo-account pattern every other module
uses); `featured`/`buyFeatured` stay local-only mock, since CLAUDE.md §9's days 8-9 scope
never covered it. The old fake "Preview · no traveller review screen built yet" panels on
`Quote.jsx`/`Enquiries.jsx` are removed — the real traveller-facing accept flow
(`discover/enquiries`) already existed before this pass and those panels' own label was
already stale; faking an outcome locally would now visibly diverge from real server state
on the next fetch, the same reasoning that removed KYC's own fake preview buttons.
Countdown displays across `Quotes.jsx`/`Quote.jsx`/`Enquiries.jsx` (both owner and
traveller-facing) now read real remaining time from the lead's actual `deadlineAt`/
`quote.expiresAt` instead of always showing a fresh full window.
A real bug was caught during client-contract verification, not left for later: both
`leads.controller.js`'s `create()` and `rooms.controller.js`'s `book()` read
`req.user.name` for the traveller's display name — but `requireAuth` only ever attaches
`{id, role, adminRole}` from the JWT (the token deliberately doesn't embed a display
name), so every lead's `name` and every room booking's `guestName` silently fell back to
the literal string `"Traveller"` regardless of who was actually signed in. Fixed by
looking up the real `User` document, the same pattern `listings.controller.js`'s
`createDraft` already used correctly for a vendor's `operator` display name — this file's
two spots just hadn't followed it.
Verified genuinely: a 51-assertion `mongodb-memory-server` run (same throwaway-dependency
method as every prior pass) covering vehicle/permit creation and the real needsPermit
link, discover visibility flipping on permit expiry/renewal/vehicle-pause, route
validation, full room CRUD plus a real traveller booking (deterministic decline/hold/
confirm, the atomic sold-out check, cancellation restoring the floor), menu toggling, and
the complete lead lifecycle for both a transport quote (ownership-scoped inbox, a
non-owner and a traveller both correctly blocked from deciding it, quote → accept) and a
property table/group enquiry (decline, quote → lazy-expire → accept correctly refused) —
plus a second, 17-assertion pass verifying the exact client contract (PATCH support,
booking with no `guestName` sent, discover DTO shapes) that caught the `req.user.name`
bug above. Clean `eslint` (project-wide) and `vite build` throughout.
**Not built**: `Featured.jsx`/featured placement (deliberately out of scope, per the note
above); real KYC coverage for `transport`/`property` (module 05's own future backend
item, not something to retrofit here); `AdminContext`'s `policy` (read by `Money.jsx` for
the platform commission rate) is still local-only mock, unconnected to the real
`GET /api/admin/config` — a pre-existing, separate gap in admin module 09, not something
this pass touched (closed below).

**Module 09 (admin) backend, full pass — 2026-09-05.** RBAC: `middleware/
requireAdminPerm.js` mirrors §3's exact matrix server-side (`kyc`/`moderation` →
super|sub, `finance`/`disputes`/`fraud`/`audit` → super|finance, `config` → super only) —
a denied route 403s, matching the client's own "absence, never disabled" law rather than
just leaving it as a UI convention. Admin can't self-register (no phone/OTP flow makes
sense for a fixed sub-role), so `POST /identity/auth/dev-admin-signin` (`auth.controller.
js`) is the sanctioned exception: one fixed, auto-created test account per sub-role
(`super`/`sub`/`finance`), refused outright in production — the same "dev-only, clearly
labeled, never a real capability" shape as the OTP bypass code and `quickSignIn`.
New models: `AuditLog` (`actorId`/`actorName`/`action`/`target`/`category`/`tone`/
`refused`), `PayoutBatch` (`status: prepared|approved`, real `preparedBy`/`approvedBy`
`User` refs plus display-name snapshots — a JWT only ever carries `{id, role,
adminRole}`, never a name, so every admin controller resolves a real name via
`audit.service.js`'s new `actorNameFor()` rather than trusting `req.user.name`, which
doesn't exist), `Dispute` (`travellerClaim`/`operatorClaim`/`resolution`, all display
names snapshotted the same way). `Payment` gained one field, `fraudAskedForId` — fraud
review's three resolutions (§3: "the model does not decide... a person decides") are
modeled as ordinary state transitions plus this one flag, not a parallel fraud-specific
enum: Clear runs the *exact* real capture path (`webhook.service.js`'s `confirmed`
branch was extracted into an exported `capturePayment(payment, booking)` so the fraud
controller and the webhook call the identical function — atomic seat check included, so
clearing a held payment can still legitimately resolve to sold-out), Refund marks the
payment failed and calls the one shared `reverseLedger`, Ask-for-ID only sets the new
flag. `ledger.service.js` gained `settleAccruingRows()` — the missing accruing→pending
transition (nothing previously moved a row off `accruing` at all): a booking's row
settles once its own `departureDate` has passed, the same
"check on read, no cron infra" shape as every other lazy timer in this app, called at the
top of every ledger/payout-batch read so a stale `accruing` row is never shown as
payable.
Controllers, all under `routes/admin/index.js` (config is a public `GET`, `POST
/disputes` is traveller-facing and mounted ahead of the blanket `requireRole('admin')`
gate, same shape the KYC-review route already established): `config.controller.js`
gained `updateConfig` (super-only, relies on `Policy`'s existing schema `min`/`max` for
range validation rather than re-implementing it); `ledger.controller.js` (`getLedger` —
the real, unscoped, platform-wide view every vendor's own real commission row now feeds
into; `reverseRow` — admin can reverse any party's row, unlike the vendor's own
self-scoped reverse); `fraud.controller.js` (the three resolutions above, `list()`
returning every payment that ever scored above 0 so resolved rows keep their history
visible); `disputes.controller.js` (`create()` — one open dispute per booking at a time,
only on the traveller's own confirmed/cancelled booking; `buildTimeline()` — a real
cross-module read, not a dispute-owned copy: only "Payment captured" has a real source in
this codebase, so geofence check-in/weather alert/operator-completion honestly read
`at: null` rather than fabricating a plausible-looking timestamp; `resolve()` — a
mandatory note gates all three actions, only `refund` actually restores the seat and
reverses the ledger row, `split`/`release` record the decision without touching
inventory, the same acknowledged simplification `VendorContext`'s ledger shape already
carries); `payoutBatches.controller.js` (`candidates()` groups every `pending` row by
party and excludes anyone with an open dispute; `prepare()`/`approve()` — the two-step
check compares real authenticated user ids, not a typed name string, so the same person
genuinely cannot approve their own batch even holding a role that would otherwise allow
it); `audit.controller.js` (`?filter=all|refused|money|moderation|kyc`).
**Real bug caught before verification, not after**: `disputes.controller.js`'s
`resolve()` had two `const actorName` declarations in the same function once
`decidedByName` was added — a genuine `SyntaxError` waiting to happen, caught on review
and fixed by computing it once and reusing it for both the resolution snapshot and the
audit-log call.
Client: `AdminContext.jsx` fully rewritten onto the real endpoints — `policy` starts
`null` and loads from the public config GET on mount (closing the gap the module 05
entry above flagged: `transport/Money.jsx` and `social/Referrals.jsx` now read the same
live value instead of a local mock default); `kycQueue` and `ledger` both keep merging
real rows over the **permanent** seeded rows (`KYC_QUEUE`'s transport/property/seller
rows, `PLATFORM_LEDGER_EXTRA`'s referral rows) for exactly the reasons the module 04/05
entries already established — no real backend exists yet for non-operator KYC or for
referrals. `data/admin/admin.js` trimmed to just those two permanent seeds plus
`KYC_REJECT_REASONS`/`POLICY_FIELDS`; `FRAUD_QUEUE`, `DISPUTES`, `PAYOUT_CANDIDATES`,
`ADMIN_ROSTER`, `DEFAULT_POLICY`, `AUDIT_SEED`, and the local `fraudScore()` helper are
all deleted outright now that the server computes and returns real scores/factors
directly. All 7 dependent admin pages (Fraud, Ledger, Disputes, PayoutBatch, Config,
Audit, Console) updated to fetch on mount and call the real actions; `PayoutBatch.jsx`
lost its preparer/approver name `TextField`s entirely — identity is now the real signed-
in admin, not a typed string a demo has to fake matching/mismatching. `AppShell.jsx`'s
"Sub-role" selector now calls a new `AuthContext.switchAdminRole()` (re-authenticates as
that sub-role's own fixed dev account — a real round trip, same async/error-state
pattern `onSwitchRole` already used) instead of a local `setAdminRole` that no longer
exists.
One real React lint bug surfaced while wiring `Config.jsx`: syncing a local `draft` copy
of `policy` (which starts `null`) via a `useEffect` that calls `setDraft` tripped
`react-hooks/set-state-in-effect` — fixed per §7's own stated preference (force a
remount over an effect that watches a prop and calls `setState`) by splitting the page
into an outer `Config` that returns `null` until `policy` is real and an inner
`ConfigForm` that only ever mounts once it is, so `useState(policy)` is correct on its
very first render with nothing to watch-and-sync afterward.
Verified genuinely (not just lint/build): a 44-assertion `mongodb-memory-server` run
(same throwaway-dependency method as every prior pass, removed after) driving the exact
HTTP shapes `AdminContext.jsx` calls — RBAC (sub-admin 403s on fraud/audit, finance-admin
403s on config PATCH); a fraud-held payment carries a real 5-factor weighted breakdown;
Ask-for-ID leaves it held, Refund resolves it to refunded and the underlying booking
reads back failed, Clear resolves a *second* held payment through the real capture path
to a genuinely confirmed booking with a real seat deducted; resolving an already-resolved
fraud row 409s; a traveller files a dispute on their own confirmed booking (a second open
dispute on the same booking 409s), the listed dispute carries a real timeline with
payment-capture genuinely timestamped and the three unbuilt events honestly `null`;
resolving without a note 400s, a full-refund resolution cancels the booking, restores the
seat, and reverses its ledger row, re-resolving 409s; a fresh commission row starts
`accruing`, backdating its booking's `departureDate` directly in Mongo (the same "move
the clock forward" seam every lazy-settle test in this app has needed) flips it to
`pending` on the next ledger read; a finance-admin prepares a payout batch from that row,
the *same* finance-admin's own approval attempt 409s, a *different* admin (super)
approves it and the row releases; a direct ledger-row reverse works independently; an
out-of-range config PATCH is rejected by schema validation; and the audit log shows real
entries including the refused same-identity approval attempt, correctly filtered by
`?filter=money`. All 44 passed on the first clean run after the fixes above. Clean
`eslint` (project-wide) and `vite build` throughout.
**Not built**: admin `Moderation.jsx` and `Analytics.jsx` are unchanged by this pass —
Moderation was already reading `SocialContext`'s real posts/reports directly (no
separate `/admin/moderation` backend needed, since that data already lives server-side
once module 07 gets its own backend pass — not yet started); Analytics' monthly
series/funnel stay seeded, same honest framing as vendor `Analytics.jsx`, since no
real multi-month platform history exists to derive one from. Real per-account identity
for KYC/ledger diversity is still limited to whatever vendors/travellers this
environment's own manual/scripted testing has actually created — there is no seed script
populating a rich multi-vendor admin demo dataset, unlike the client-only phase's
seeded rows. No in-browser click-through was performed this pass (Chrome extension not
used this session) — a future session should still visually confirm Ledger/PayoutBatch/
Console/Config render correctly against a freshly-registered admin and at least one real
vendor booking, the way modules 04/05's own entries were confirmed in-browser.

---

## 10. Open questions inherited from the wireframe spec

These were explicitly left undecided by the source design system — resolve with the
client/user before treating either direction as final:
- **Nastaliq vs. Naskh** for Urdu display surfaces (Naskh is the interim default for UI/
  dense data because Nastaliq's baseline slope breaks table rows).
- Full Urdu translation coverage — wireframe only fully translates: discovery home,
  checkout→e-ticket→booking history, onboarding/KYC, feed. Everything else is
  RTL-mirrored English ("mirrored" in the wireframe's own terminology), pending
  translation.
- Whether a checkout soft-lock may be extended once, server-side, for a slow-connection
  first-time user (flagged as a real UX risk — the 10-minute window can be tight once
  guest details + gateway redirect + OTP are all accounted for).
- The exact sponsored-placement cap is stated as "2 per 10, disclosed" throughout, but
  its enforcement point (ranking service vs. ad product) and whether it should ever
  exclude position 1 for a repeat logged-in user is flagged as a recommendation, not a
  ratified rule.
- Whether PKR should remain the only settlement currency long-term or whether USD/AED
  become real (not just cosmetic) settlement options.
