import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { runPromptfooEvaluation } from '../services/promptfoo.js';
import { generateReports } from '../services/reports.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// In-memory run store (use Redis/DB in production)
const runs = new Map();

/**
 * POST /api/evaluate
 * Body: { targetUrl?, apiKey?, headers?, model?, tests? }
 * Runs Promptfoo red-teaming against the target or Groq Cloud.
 * Returns runId + download URLs for JSON / PDF / CSV.
 */
router.post('/', async (req, res, next) => {
  try {
    const { targetUrl, apiKey, headers, model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant', tests = [] } = req.body;

    const runId = uuidv4();
    const startedAt = new Date().toISOString();

    // Initial run record
    runs.set(runId, {
      runId,
      status: 'running',
      mode: 'live',
      startedAt,
      targetUrl,
      model,
      results: null,
      downloads: {},
      error: null,
    });

    // Run evaluation asynchronously (fire-and-forget with status tracking)
    (async () => {
      try {
        const results = await runPromptfooEvaluation({
          runId,
          targetUrl,
          apiKey,
          headers,
          model,
          tests,
        });

        // Generate downloadable reports
        const reportDir = path.join(process.cwd(), 'reports', runId);
        fs.mkdirSync(reportDir, { recursive: true });

        const files = await generateReports(results, reportDir, runId);

        runs.set(runId, {
          runId,
          status: 'completed',
          mode: 'live',
          startedAt,
          completedAt: new Date().toISOString(),
          targetUrl,
          model,
          results,
          downloads: files,
          error: null,
        });
      } catch (err) {
        runs.set(runId, {
          runId,
          status: 'failed',
          mode: 'live',
          startedAt,
          completedAt: new Date().toISOString(),
          targetUrl,
          model,
          results: null,
          downloads: {},
          error: err.message,
        });
      }
    })();

    res.json({
      runId,
      status: 'running',
      mode: 'live',
      message: 'Evaluation started. Poll /api/evaluate/:runId for results.',
      downloads: {
        json: `/api/evaluate/${runId}/json`,
        pdf: `/api/evaluate/${runId}/pdf`,
        csv: `/api/evaluate/${runId}/csv`,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/evaluate/:runId
 * Poll for run status and results.
 */
router.get('/:runId', (req, res) => {
  const run = runs.get(req.params.runId);
  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }
  res.json(run);
});

/**
 * GET /api/evaluate/:runId/:format
 * Download generated report (json | pdf | csv).
 */
router.get('/:runId/:format', (req, res) => {
  const { runId, format } = req.params;
  const run = runs.get(runId);

  if (!run || !run.downloads || !run.downloads[format]) {
    return res.status(404).json({ error: 'Report not found or not yet generated' });
  }

  const filePath = path.join(process.cwd(), 'reports', runId, `${runId}.${format}`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Report file not found on disk' });
  }

  const contentTypes = {
    json: 'application/json',
    pdf: 'application/pdf',
    csv: 'text/csv',
  };

  res.setHeader('Content-Disposition', `attachment; filename="og-safety-${runId}.${format}"`);
  res.setHeader('Content-Type', contentTypes[format] || 'application/octet-stream');
  res.sendFile(filePath);
});

export default router;
