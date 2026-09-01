// Every successful endpoint replies with this same envelope — { ok:true, data } —
// matching the shape the client's mocked context actions already use, so swapping
// a mock action for a real fetch() later is a mechanical change, not a rewrite.
function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json({ ok: true, data });
}

module.exports = { ok };
