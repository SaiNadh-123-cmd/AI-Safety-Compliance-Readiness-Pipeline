import express from 'express';
import { checkGroqHealth } from '../services/promptfoo.js';

const router = express.Router();

/**
 * GET /api/health
 * Returns backend status, Groq integration status, and Promptfoo availability.
 * Frontend polls this to detect live vs demo mode.
 */
router.get('/', async (_req, res) => {
  const groqHealth = await checkGroqHealth();

  res.json({
    status: 'healthy',
    service: 'og-ai-safety-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mode: 'live',
    integrations: {
      promptfoo: {
        available: true,
        version: '0.125.0',
        endpoint: '/api/evaluate',
      },
      groq: {
        online: groqHealth.online,
        models: groqHealth.models,
        error: groqHealth.error || null,
      },
    },
  });
});

export default router;
