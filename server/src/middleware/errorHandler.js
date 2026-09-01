const ApiError = require("../utils/ApiError");

// Mounted after every route — turns an unmatched URL into a proper ApiError
// instead of Express's default HTML 404 page.
function notFound(req, res, next) {
  next(new ApiError(404, "NOT_FOUND", `Route ${req.method} ${req.originalUrl} does not exist`));
}

// Mounted last. Every thrown/next(err) error lands here and comes out as the
// app's one error envelope: { ok:false, error: { code, message } }.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    ok: false,
    error: { code, message: err.message || "Something went wrong" },
  });
}

module.exports = { notFound, errorHandler };
