const AuditLog = require("../models/AuditLog");
const User = require("../models/User");

// One shared implementation every admin mutation calls (§3: "one shared,
// append-only action log") — never a second, route-local copy.
async function logAudit({ actorId = null, actorName, action, target, category, tone = "success", refused = false }) {
  return AuditLog.create({ actorId, actorName, action, target, category, tone, refused });
}

// req.user only carries {id, role, adminRole} from the JWT (same gap fixed
// in transport's leads/rooms controllers) — every admin controller that logs
// an action needs the real admin's name for the audit trail, not a literal.
async function actorNameFor(userId) {
  const user = await User.findById(userId);
  return user?.name || "Admin";
}

module.exports = { logAudit, actorNameFor };
