const Policy = require("../../models/Policy");
const { ok } = require("../../utils/respond");
const { logAudit, actorNameFor } = require("../../services/audit.service");

async function getConfig(req, res, next) {
  try {
    const policy = await Policy.getSingleton();
    ok(res, policy);
  } catch (err) {
    next(err);
  }
}

const EDITABLE_FIELDS = [
  "commissionPct", "referralPct", "attributionDays", "cancelFreeHours",
  "fraudThreshold", "weatherDecisionHours", "weatherRefundPct",
];

// PATCH /api/admin/config — super-admin only (§3: "Only super sees policy
// config"). Mongoose's own schema min/max enforces each field's real range
// (§3's exact slider bounds) — no separate validation needed here.
async function updateConfig(req, res, next) {
  try {
    const policy = await Policy.getSingleton();
    const changes = [];
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined && req.body[field] !== policy[field]) {
        changes.push(`${field} ${policy[field]} → ${req.body[field]}`);
        policy[field] = req.body[field];
      }
    }
    await policy.save();

    if (changes.length) {
      const actorName = await actorNameFor(req.user.id);
      await logAudit({
        actorId: req.user.id, actorName, action: `Policy changed — ${changes.join(", ")}`,
        target: "Policy config", category: "money", tone: "warning",
      });
    }
    ok(res, policy);
  } catch (err) {
    next(err);
  }
}

module.exports = { getConfig, updateConfig };
