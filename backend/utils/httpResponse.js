export function sendClientError(req, res, status, error, reason) {
  const route = `${req.method} ${req.path}`;
  console.warn(
    `HTTP ${status} ${route} uid=${req.uid || 'anonymous'} reason=${reason}`
  );
  return res.status(status).json({ error, reason });
}
