const Policy = require("../../models/Policy");
const { ok } = require("../../utils/respond");

async function getConfig(req, res, next) {
  try {
    const policy = await Policy.getSingleton();
    ok(res, policy);
  } catch (err) {
    next(err);
  }
}

module.exports = { getConfig };
