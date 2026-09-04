const Lead = require("../../models/Lead");
const Vehicle = require("../../models/Vehicle");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { ok } = require("../../utils/respond");

const LEAD_WINDOW_HOURS = 24;
const QUOTE_EXPIRY_HOURS = [24, 48, 168]; // CLAUDE.md §6 quote composer's 3 fixed options
const KINDS = ["transport", "table", "group"];

function toDto(l) {
  return {
    id: l._id,
    kind: l.kind,
    subjectId: l.subjectId,
    subjectLabel: l.subjectLabel,
    name: l.name,
    date: l.date,
    count: l.count,
    note: l.note,
    status: l.status,
    createdAt: l.createdAt,
    deadlineAt: l.deadlineAt,
    quote: l.quote,
    acceptedAt: l.acceptedAt,
  };
}

// A quoted lead whose own expiry has passed and was never accepted settles
// to `expired` lazily on read/action — same "check on read, no cron infra"
// shape as booking's settleIfLapsed. `request`-status leads have no such
// auto-transition — CLAUDE.md §3's lifecycle diagram doesn't define one; the
// 24h clock there is a display-only "reply within" expectation.
async function settleIfLapsed(lead) {
  if (lead.status === "quoted" && lead.quote?.expiresAt && lead.quote.expiresAt.getTime() < Date.now()) {
    lead.status = "expired";
    await lead.save();
  }
  return lead;
}

// POST /api/transport/leads — traveller-facing, any authenticated role.
async function create(req, res, next) {
  try {
    const { kind, subjectId, ownerId, subjectLabel, date, count, note } = req.body;
    if (!KINDS.includes(kind) || !subjectLabel || !date || !(count > 0)) {
      throw new ApiError(400, "MISSING_FIELDS", "kind, subjectLabel, date and a positive count are required.");
    }

    let resolvedOwnerId = ownerId;
    if (kind === "transport") {
      if (!subjectId) throw new ApiError(400, "MISSING_SUBJECT", "A vehicle must be specified for a transport enquiry.");
      const vehicle = await Vehicle.findById(subjectId);
      if (!vehicle) throw new ApiError(404, "VEHICLE_NOT_FOUND", "Vehicle not found.");
      resolvedOwnerId = vehicle.ownerId;
    } else if (!ownerId) {
      throw new ApiError(400, "MISSING_OWNER", "A property owner must be specified for a table/group enquiry.");
    }

    // req.user only carries {id, role, adminRole} from the JWT (§4 — the
    // token deliberately doesn't embed a display name) — a real lookup is
    // required for the traveller's actual name, not req.user.name, which is
    // always undefined.
    const traveller = await User.findById(req.user.id);

    const lead = await Lead.create({
      kind,
      ownerId: resolvedOwnerId,
      subjectId: kind === "transport" ? subjectId : null,
      subjectLabel,
      traveller: req.user.id,
      name: traveller?.name || "Traveller",
      date,
      count,
      note: note || "",
      status: "request",
      deadlineAt: new Date(Date.now() + LEAD_WINDOW_HOURS * 3600000),
    });
    ok(res, toDto(lead), 201);
  } catch (err) {
    next(err);
  }
}

// GET /api/transport/leads/mine — traveller's own enquiries.
async function listMine(req, res, next) {
  try {
    const leads = await Lead.find({ traveller: req.user.id }).sort({ createdAt: -1 });
    await Promise.all(leads.map(settleIfLapsed));
    ok(res, leads.map(toDto));
  } catch (err) {
    next(err);
  }
}

// POST /api/transport/leads/:id/accept — traveller accepts a quote (§3: the
// real quoted -> accepted transition; no Booking document is created, the
// Lead itself is the record of what was agreed).
async function accept(req, res, next) {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, traveller: req.user.id });
    if (!lead) throw new ApiError(404, "LEAD_NOT_FOUND", "Enquiry not found.");
    await settleIfLapsed(lead);
    if (lead.status !== "quoted") throw new ApiError(409, "NOT_QUOTED", "This enquiry doesn't have an active quote to accept.");
    lead.status = "accepted";
    lead.acceptedAt = new Date();
    await lead.save();
    ok(res, toDto(lead));
  } catch (err) {
    next(err);
  }
}

// GET /api/transport/leads — owner inbox (transport or property role) —
// scoped by ownerId alone is sufficient: a transport owner's leads are
// always kind 'transport' (resolved from a vehicle they own) and a property
// owner's are always 'table'/'group', so there's nothing to cross-filter.
async function listOwnerInbox(req, res, next) {
  try {
    const leads = await Lead.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    await Promise.all(leads.map(settleIfLapsed));
    ok(res, leads.map(toDto));
  } catch (err) {
    next(err);
  }
}

async function findOwned(id, ownerId) {
  const lead = await Lead.findOne({ _id: id, ownerId });
  if (!lead) throw new ApiError(404, "LEAD_NOT_FOUND", "Enquiry not found.");
  return lead;
}

// POST /api/transport/leads/:id/quote — a required expiry is one of the 3
// fixed windows (§3), never a free-form value.
async function sendQuote(req, res, next) {
  try {
    const { lineItems, expiryHours } = req.body;
    if (!Array.isArray(lineItems) || !lineItems.some((li) => li.amount > 0)) {
      throw new ApiError(400, "MISSING_LINE_ITEMS", "At least one line item with a positive amount is required.");
    }
    if (!QUOTE_EXPIRY_HOURS.includes(expiryHours)) {
      throw new ApiError(400, "INVALID_EXPIRY", "Pick one of the 3 fixed expiry windows (24h/48h/7 days).");
    }
    const lead = await findOwned(req.params.id, req.user.id);
    await settleIfLapsed(lead);
    if (lead.status !== "request") throw new ApiError(409, "NOT_PENDING", "This enquiry has already been resolved.");

    const items = lineItems.filter((li) => li.amount > 0).map((li) => ({ label: li.label || "Line item", amount: li.amount }));
    const total = items.reduce((n, li) => n + li.amount, 0);
    const now = new Date();
    lead.status = "quoted";
    lead.quote = { lineItems: items, total, expiryHours, quotedAt: now, expiresAt: new Date(now.getTime() + expiryHours * 3600000) };
    await lead.save();
    ok(res, toDto(lead));
  } catch (err) {
    next(err);
  }
}

// POST /api/transport/leads/:id/decline — no reason required, a deliberate,
// spec-called-out difference from the vendor booking decline's 4 fixed
// reasons (§6 quotes inbox note).
async function decline(req, res, next) {
  try {
    const lead = await findOwned(req.params.id, req.user.id);
    await settleIfLapsed(lead);
    if (lead.status !== "request") throw new ApiError(409, "NOT_PENDING", "This enquiry has already been resolved.");
    lead.status = "declined";
    await lead.save();
    ok(res, toDto(lead));
  } catch (err) {
    next(err);
  }
}

async function withdraw(req, res, next) {
  try {
    const lead = await findOwned(req.params.id, req.user.id);
    await settleIfLapsed(lead);
    if (lead.status !== "quoted") throw new ApiError(409, "NOT_QUOTED", "There's no active quote to withdraw.");
    lead.status = "withdrawn";
    await lead.save();
    ok(res, toDto(lead));
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listMine, accept, listOwnerInbox, sendQuote, decline, withdraw, toDto };
