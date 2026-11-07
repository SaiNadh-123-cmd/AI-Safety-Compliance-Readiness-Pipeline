/**
 * 404 Not Found middleware.
 */
export function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found' });
}
