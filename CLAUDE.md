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

## 8. Suggested build order

Given what's already scaffolded, the natural next slices are:

1. ~~**Finish module 01 (discovery)**: wishlist, profile/preferences~~ — **done.**
   `Wishlist.jsx` and `Profile.jsx` are built on the shared `ui/` primitives (§7);
   `AppContext` gained a `language` preference to support it. All seven module-01
   screens from the route table (§5) except the two Urdu (`-ur`) variants are now
   wired: home, search, tour, property, wishlist, profile. Home/Search/TourDetail/
   PropertyDetail were also refactored during this pass to use the new `ui/`
   components instead of their original hand-rolled markup — verified in-browser
   (screenshots, console-error check) after the refactor, not just by reading the
   diff.
2. ~~**Module 03 (identity)**: role selection → register/OTP → login → KYC~~ — **done,
   client-side only.** All 8 non-Urdu screens from the route table are wired: role,
   register, login, otp, otp-exhausted, kyc, kyc-pending, kyc-approved, kyc-rejected.
   Added `AuthContext` (§7) with fully mocked register/login/OTP/KYC actions, the
   `Countdown` primitive (§2/§7), and `DocumentUpload` (`components/identity/`) for
   the KYC uploader. `AppShell`'s (then still named `TravelerLayout`) header is now auth-aware (Sign in ↔ Hi,
   {name}/Sign out) and Home's six actor tiles pre-select the matching role on
   `/identity/role` via router `state`, per §6's "arrived via a home-page actor tile"
   note. Verified in-browser end-to-end for both branches: a partner role
   (operator) through register → OTP → the full 3-step KYC wizard (including real
   `file_upload` into the mock document uploader) → kyc-pending → both
   approved/rejected previews; and the non-partner **reset-password** path
   (duplicate-phone detection → OTP → signed back in) — not just the happy path.
   **Not done**: there's no real backend, so `AuthContext`'s functions are mocks (see
   §7) and there are no protected routes yet — nothing stops a signed-out user from
   hitting `/identity/kyc` directly. Add route guards once module 02 or a vendor
   module needs to actually gate on `user`/`kycStatus`, rather than speculatively now.
3. ~~**Module 02 (booking/payment)**: checkout, gateway, awaiting, confirmed, the six
   outcome branches, request-to-book, group-split, participant, history, cancel~~ —
   **done, client-side only.** All 15 non-Urdu screens from the route table are
   wired. Added `BookingContext` (§7) as the canonical, mutable seat store and the
   full state machine from §3: a real soft-lock (a plain-duration `Countdown` for
   display, a real `expiresAt` timestamp checked server-side-equivalent inside
   `resolvePayment` for genuine late-webhook detection — not just a client timer that
   can't actually expire anything), the atomic seat check
   (`findOneAndUpdate`-equivalent, read from closure state rather than a stale
   snapshot), deterministic payment-outcome triggers (§7), and real refund-tier math
   in `cancelBooking` reading each listing's own `bookingMode`/`cancellationPolicy`
   (added to `tours.js`'s `TOURS` rows, per §3's "per listing, not global"). `Outcome.jsx`
   is one shared component for all six branch screens (expired/failed/held/sold-out/
   late/declined), matching the wireframe's own "one branch template" design.
   Verified in-browser end-to-end, not just read back: the full instant-booking path
   with a promo code (JazzCash → gateway → awaiting → confirmed → e-ticket with the
   correct `SFR-YYYY-MMDD-NNNN` ref → seat count visibly reduced elsewhere in the app
   → cancel → correct tiered refund `%` → seat count restored); the decline-card and
   fraud-card outcomes; the request-to-book path (operator-response panel → accept →
   confirmed, seats deducted only on acceptance); and the full group-split path
   (create → pay-my-share → real participant links → all-paid → confirmed) — in both
   light and dark themes, with zero console errors. That last pass also caught and
   fixed two real bugs before they'd have shipped: `Countdown` showing a 24-hour
   window as bare `1439:51` minutes instead of `h:mm:ss`, and `payShare` **double-
   booking and double-decrementing availability** every time a group split completed
   (a `setState`-inside-`setState` purity bug StrictMode's double-invoke exposed —
   see §7). Also fixed a real data-staleness bug in `TourDetail`'s seed departure
   dates (hardcoded to a specific 2026 calendar date, so cancellation refund math
   would silently degrade to 0% once "today" passed that date) by storing
   `daysFromNow` instead and computing the real timestamp at booking time.
   **Not done**: no real backend (see §7 for the mock/trigger list), no route guards,
   and `sold-out`/`late-webhook` are only reachable via the Awaiting screen's labeled
   force-outcome panel rather than a genuine concurrent second booking (see §7 for
   why, and what a real fix would need — e.g. cross-tab `localStorage` sync or an
   actual backend).
4. ~~**Module 04 (vendor)**: dashboard, plans, subscribe, grace, listings (wizard),
   availability, inbox, booking detail, payouts, payout detail, gate, analytics~~ —
   **done, client-side only.** All 12 vendor routes are wired. Added `VendorContext`
   (§7) holding the subscription state machine (§3's 5-state graph, with the same
   honestly-labeled testing levers as module 02's force-outcome panel —
   `simulateChargeFailure`/`retryCharge`/`exhaustRetries`/`onGraceExpire`), full
   listing CRUD (draft → photos → policy → review → publish), a `publishGate(listing,
   {kycApproved, subOk})` pure function checked live (not just at wizard-submit time,
   so Gate/Review can always explain a current block), per-listing departures with a
   hard floor at `booked` seats, and a seeded payout ledger (accruing/pending/
   released/reversed buckets, reversal shown as a negative netted line rather than a
   clawback). Also added: a `switchRole`/`ROLES` role-switcher in `AuthContext` (a
   single demo account acting as every actor, mirroring the wireframe's own role
   switcher — not real multi-tenancy) and made `AppShell` (then still named
   `TravelerLayout`) role-aware off it;
   and — a real gap found while designing this module's booking-detail screen, which
   the spec requires to show masked CNIC — `TourDetail.jsx`'s request-to-book path
   never actually collected traveller name/CNIC before this pass. Fixed by carrying a
   `guests` array through `BookingContext.createRequest`/`acceptRequest` and adding
   validated inline guest fields to the request-mode UI. Verified in-browser
   end-to-end, not just read back: register → switch role to operator → KYC (reused
   module 03, including real `file_upload`) → approve via the labeled preview link →
   subscribe (Growth plan, tax calc verified) → full listing wizard (basics → 3 photos
   → policy → blocked at Review on "Add at least one departure" → add a departure →
   Review clears → Publish → status flips to `published`) → separately, as traveller,
   request-to-book a `bookingMode: 'request'` tour with two named guests → as operator,
   Inbox shows the request live (reading `BookingContext`'s real queue, not seeded
   data) → BookingDetail shows both guests with correctly masked CNICs
   (`35202-•••••••-6`) → Accept → seats deducted, booking confirmed, visible in the
   traveller's own Booking History. Also checked Payouts/PayoutDetail (all 4 buckets,
   reversal math) Gate (live formula against real KYC/subscription state), and
   Analytics — zero console errors throughout. **Deliberate scope decision**:
   vendor-published listings live only in `VendorContext`'s own `listings` array —
   they are **not** merged into the traveller-facing Discovery catalog (`TOURS` /
   `BookingContext.avail`) in this pass. Doing that properly needs per-listing
   departures feeding a shared catalog layer, which is real, separate work — tracked
   here as a known gap, not silently skipped. **Not done**: no real backend, no route
   guards, no live catalog merge (above).
5. ~~**Module 05 (transport & property)**: vehicles, routes, quotes, quote, permits,
   property, rooms, menu, enquiries, featured~~ — **done, client-side only.** All 10
   routes are wired, plus `TransportContext` (§7) and the traveller-facing `discover/
   transport` enquiry screen (module 01's 7th screen). This module was built in an
   earlier pass but had not been recorded here until this entry — CLAUDE.md's own
   build-order log had drifted from the actual code, which is exactly the kind of gap
   this file exists to prevent; treat this note as the correction.
6. ~~**Traveller-facing slices of modules 06–08**: gear commerce, social, AI trip
   planning~~ — **done, client-side only**, scoped deliberately to what the traveller
   role's nav (§5) actually points at — `Trips` → `/ai/planner`, `Feed` →
   `/social/feed`, `Gear` → `/shop/catalog` all resolved to `ComingSoon` before this
   pass despite being live links in `auth-context.js`'s `ROLES` table. See "Traveller
   workflows" above for the full behavioural list; in file terms this added
   `ShopContext`/`SocialContext`/`AiContext` (§7) and 19 new pages: **06 commerce**
   (`shop/catalog`, `product/:id`, `cart`, `checkout`, `order`, `tracking/:ref?`,
   `returns/:ref/:subOrderId`, plus one shared `Outcome.jsx` for expired/failed/held/
   sold-out — the same one-branch-template pattern as booking's `Outcome.jsx`); **07
   social** (`feed`, `composer`, `post/:id`, `profile/:id?`, `chats`, `thread/:id`,
   `report/:targetType/:targetId`); **08 AI** (`planner`, `itinerary`, `saved`,
   `chatbot`). Verified via a clean `eslint` pass and a clean production `vite build`
   (in-browser click-through wasn't available this session — the Chrome extension was
   declined — so this still needs a human or a future session's in-browser pass before
   being called fully verified, unlike modules 01–04's own entries above).
   **Deliberate scope decisions, same spirit as module 04's catalog-merge note**:
   gear checkout has no lock object at all (§3: "a cart holds nothing," unlike a tour's
   seat hold) — only a cosmetic checkout-session countdown, since nothing is actually
   released on timeout; the AI planner's itinerary-building algorithm is a real but
   simple interest/rating/budget sort against the live `TOURS` catalog, not a claimed
   "AI" — it's the same honest-transparency spirit as the chatbot's visible tool calls;
   a handful of real bugs were caught and fixed while building this, in the same
   register as the `payShare` bug §7 documents — an impure `setStock`-inside-
   `setOrders` updater in `ShopContext.submitReturn` (fixed by reading the sub-order
   from closure state first, then firing `setOrders`/`setStock` as separate top-level
   calls, exactly the `payShare` fix pattern) and a `Date.now()` call in a non-lazy
   `useState` initializer in `AiContext` (an eslint `react-hooks/purity` catch, not a
   StrictMode one — fixed by switching to `useState(() => [...])`).
   **Not done** (left for a future pass, not silently skipped): the seller side of
   commerce (`seller-products`, `fulfilment` as a seller would drive it — travellers
   can already trigger its steps via Tracking's honestly-labeled demo-advance button,
   same lever as `BookingContext.forceOutcome`); the influencer-only money screens of
   social (`collab`, `referrals`, `campaigns`); the AI module's `escalation` (folded
   into the chatbot's inline escalation banner rather than a separate screen),
   `map`/`landmark`/`geofence`/`weather`. Module 09 (admin) is now built — see item 7
   below — and does import `SocialContext`'s `REPORT_REASONS`/`CONTENT_STATES` rather
   than redefining them, exactly as this note originally anticipated.
7. ~~**Module 09 (admin console)**: console, kyc, moderation, ledger, payout-batch,
   disputes, fraud, analytics, config, audit~~ — **done, client-side only.** All 10
   routes are wired. Added `AdminContext` (§7 three-file split — `adminRole` in
   `super`/`sub`/`finance`, the exact `perms()` matrix from §3, the 7-field `policy`
   object with `savePolicy`, and an append-only `audit` log every action below writes
   to) plus two new shared `components/ui/` primitives spec calls for (`DataTable` —
   the KYC/moderation/audit/payout-batch shared shell, responsive table↔stacked-card at
   Tailwind's `lg`; `KpiCard`/`BarChart` — the KPI/chart shells, max 2 series, no pie).
   `AppShell`'s role switcher previously excluded `admin` outright (nav pointed at
   `ComingSoon`) — that exclusion is removed, and a "Sub-role" picker now appears only
   when acting as admin; the nav itself filters live through `perms()`, confirmed
   in-browser to literally disappear (not grey out) items per role.
   **The single-demo-account problem, resolved per queue**: KYC, fraud, and disputes
   are seeded multi-actor data (`data/admin/admin.js`), the same pattern
   `VendorContext.SEED_LEDGER` already established, since one logged-in demo account
   can't produce a real multi-vendor/multi-traveller queue. Moderation is fully
   live — it reads `SocialContext`'s real `posts`, and this pass added `reports` (per-
   report records, for reason tallies like "Spam ×2"), `moderateContent` (decision
   buttons generated from `CONTENT_STATES` itself — an illegal move is never offered),
   and `appealPost` (one appeal, enforced-by-name to require a different reviewer than
   the original decision). The Ledger screen merges `VendorContext.ledger` (this
   session's one real vendor, live and mutable) with seeded `PLATFORM_LEDGER_EXTRA`
   rows for every other party a platform ledger would carry. `VendorContext` gained a
   `reverseLedger` action (§3's named commission-clawback action, previously missing —
   only `setLedgerRowState` existed); fraud's Refund and a dispute's full-refund
   resolution call it for real on the one row each links to (`fr-1`/`dp-1` →
   `LG-4002`), everything else is a self-contained seeded mutation, documented inline
   rather than silently blurred. Payout batch's two-step approval (preparer ≠ approver,
   even same role) is demonstrated by name entry against a fixed `ADMIN_ROSTER`, since
   there's no real multi-admin auth — a same-name approval attempt is refused and
   logged to audit exactly like a real refusal would be.
   Verified in-browser end-to-end this session (Chrome extension available, unlike
   module 06–08's pass): signed in, switched to admin, confirmed nav/KPI tiles change
   shape (not greyed) across `super`/`sub`/`finance`; KYC approve + reject-with-reason;
   Moderation remove-with-reason → appeal refused for the same reviewer → appeal
   succeeded for a different one; Config's `fraudThreshold` slider live-recalculating
   which seeded fraud rows would hold, saved, and confirmed the committed value on both
   the Console KPI tile and a fresh page load; Fraud's Refund action → confirmed for
   real on the vendor's own Payouts screen (`LG-4002` moved from pending to reversed,
   netted as a negative line) after switching role back to operator; Disputes'
   mandatory-note + refund resolution, with "Not recorded" drawn honestly for the two
   timeline events that never happened (Law 2). Two real bugs were caught and fixed in
   this pass, same register as the `payShare`/`submitReturn` bugs above: the SLA
   countdown on the KYC queue rendered a fractional-second value
   (`17:53:59.19199999999546`) because `Countdown` needs a whole-second duration and
   `slaSeconds()` wasn't flooring it; and Console's "above the live fraud threshold" KPI
   was comparing against a hardcoded `0.75` instead of reading `policy.fraudThreshold`,
   silently defeating the point of a *live* config-driven KPI. Ledger, Payout batch, and
   Analytics were built to the same conventions but not walked end-to-end in-browser
   this session — a follow-up pass should confirm those three the way the rest of this
   entry's screens were.
   **Not done**: no real backend (as with every module so far — see the file-opening
   "Build strategy" note), no route guards, and the admin `Analytics` screen's monthly
   series/funnel are seeded (same honest framing as vendor `Analytics.jsx` — no real
   multi-month platform history exists yet to derive one from).
8. **Server**: stand up Mongoose models for the entities in §4 before wiring routes, so
   the state machines in §3 have somewhere real to live — pay particular attention to
   putting commission rate on Vendor/Seller (not a global constant) and booking mode /
   cancellation policy on Listing from the start (the client already models both on
   each `TOURS` row), since retrofitting those later means touching every screen that
   reads them. `BookingContext`'s mock functions were deliberately written to return
   the same shape a real API call would (§7) — replacing their bodies with `fetch()`
   calls once routes exist should not require changing any calling component.

9. ~~**Client-side restructure**: one `pages`/`components`/`context`/`data`
   per-module convention, plus route-level code-splitting~~ — **done.** `context/`
   was flat (23 files, all 8 modules' `*-context.js`/`*Context.jsx`/`use*.js` trios in
   one directory) — split into `context/<module>/`, mirroring `pages/`'s existing
   per-module layout (§7's new "Folder structure" bullet has the full convention).
   `components/TravelerLayout.jsx` — actually the shared shell every role mounts
   through, not traveller-only, per its own role-switcher logic — renamed to
   `components/layout/AppShell.jsx` (moved alongside `Logo.jsx`, the other genuine
   cross-module component) so the name stops implying traveller-only scope.
   `data/traveler/gear.js` and `data/traveler/social.js` moved to `data/shop/` and
   `data/social/` respectively (they're that module's seed data, not traveller's;
   `tours.js` stayed in `data/traveler/` — it genuinely is discovery's own catalog,
   reused by other modules the same way `TOURS`/`AVAILABILITY` always were). Three
   unreferenced Vite-boilerplate assets (`hero.png`, `react.svg`, `vite.svg` — zero
   imports, confirmed by grep) were removed. Separately, `App.jsx`'s 66 static page
   imports became `React.lazy()` + one root `<Suspense>` — the production build had
   been flagging one ~530KB/145KB-gzip JS chunk; after this it's a ~296KB/94.5KB-gzip
   shared chunk plus one small (0.7–14KB) chunk per screen, fetched on navigation
   instead of all up front. Verified via a clean `eslint` pass and a clean production
   `vite build` (both re-run after the move, not just before it) — in-browser
   click-through wasn't available this session (Chrome extension declined), so a
   future session should still confirm route transitions render their `Suspense`
   fallback correctly and no screen regressed visually, even though the build/lint
   passes prove every import resolves and nothing is dead code.

Do not build all 9 modules' UI against mock data first and wire the backend later "in
bulk" — the payment/inventory/moderation state machines are the actual product, and
building screens without their real transitions produces UI that has to be re-thought,
not just re-skinned.

---

## 9. Open questions inherited from the wireframe spec

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
