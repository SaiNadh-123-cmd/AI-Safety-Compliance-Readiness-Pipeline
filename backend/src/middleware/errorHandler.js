/**
 * Global error handler middleware.
 * Returns JSON error responses with appropriate status codes.
 */
export function errorHandler(err, _req, res, _next) {
  console.error('Backend error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
