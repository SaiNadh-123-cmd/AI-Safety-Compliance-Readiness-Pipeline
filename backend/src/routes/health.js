import express from 'express';

const router = express.Router();

/**
 * GET /api/health
 * Returns backend status, Groq API key configuration, and model info.
 * Frontend uses this to detect live vs demo mode before evaluation.
 */
router.get('/', async (_req, res) => {
  const groqApiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  res.json({
    status: 'ok',
    groqKeyConfigured: Boolean(groqApiKey),
    model,
    timestamp: new Date().toISOString(),
  });
});

export default router;
