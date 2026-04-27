const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, _next) {
  console.error(err.stack);

  if (err instanceof ApiError) {
    const body = err.toJSON();
    if (process.env.NODE_ENV === 'development') body.stack = err.stack;
    return res.status(err.statusCode).json(body);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    code: null,
    details: null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
