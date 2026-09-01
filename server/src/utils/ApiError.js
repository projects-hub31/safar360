// Throw this from anywhere (a controller, a service) and errorHandler.js
// turns it into the app's standard { ok:false, error } response.
class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = ApiError;
