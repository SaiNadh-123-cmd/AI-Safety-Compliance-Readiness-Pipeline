import express from 'express';
import { getActiveModel } from '../utils/groqClient.js';

const router = express.Router();

/**
 * GET /api/health
 * Returns backend status, Groq API key configuration, and model info.
 */
router.get('/', async (_req, res) => {
  const groqApiKey = process.env.GROQ_API_KEY;
  const model = getActiveModel();

  res.json({
    status: 'ok',
    groqKeyConfigured: Boolean(groqApiKey),
    model,
    timestamp: new Date().toISOString(),
  });
});

export default router;
