import express from 'express';

const router = express.Router();

/**
 * GET /api/health
 * Returns backend status. Frontend polls this to detect live vs demo mode.
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'og-ai-safety-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mode: 'live',
  });
});

export default router;
