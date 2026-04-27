class ApiError extends Error {
  constructor(statusCode, message, { code, details, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.success = false;
    this.statusCode = statusCode;
    this.code = code || null;
    this.details = details || null;
    if (cause) this.cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, opts) {
    return new ApiError(400, message || 'Bad request', opts);
  }

  static unauthorized(message, opts) {
    return new ApiError(401, message || 'Unauthorized', opts);
  }

  static forbidden(message, opts) {
    return new ApiError(403, message || 'Forbidden', opts);
  }

  static notFound(message, opts) {
    return new ApiError(404, message || 'Not found', opts);
  }

  static conflict(message, opts) {
    return new ApiError(409, message || 'Conflict', opts);
  }

  static unsupported(message, opts) {
    return new ApiError(503, message || 'Service unavailable', opts);
  }

  static internal(message, opts) {
    return new ApiError(500, message || 'Internal server error', opts);
  }

  toJSON() {
    return {
      success: false,
      statusCode: this.statusCode,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

module.exports = ApiError;
