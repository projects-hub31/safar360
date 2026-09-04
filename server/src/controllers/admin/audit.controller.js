const AuditLog = require("../../models/AuditLog");
const { ok } = require("../../utils/respond");

function toDto(row) {
  return {
    id: row._id,
    at: row.createdAt,
    actor: row.actorName,
    action: row.action,
    target: row.target,
    category: row.category,
    tone: row.tone,
    refused: row.refused,
  };
}

// GET /api/admin/audit?filter=all|refused|money|moderation — one shared,
// append-only log every admin mutation in this module writes to (§3).
async function list(req, res, next) {
  try {
    const { filter } = req.query;
    const query = {};
    if (filter === "refused") query.refused = true;
    else if (filter === "money" || filter === "moderation" || filter === "kyc") query.category = filter;

    const rows = await AuditLog.find(query).sort({ createdAt: -1 }).limit(200);
    ok(res, rows.map(toDto));
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
