/**
 * O&G AI Safety & Compliance Pipeline - Hybrid API Client
 * Reads backend URL from VITE_BACKEND_ORIGIN env var.
 * Tries /api/health first: online → Live Mode (real eval), offline → Demo Mode (precomputed).
 */

import type {
  PIIProcessResult,
  ExecutiveDossier,
} from '../types/pipeline';
import redteamResults from '../data/redteam-results.json';

/* ──────────────────────── Types ──────────────────────── */

export type BackendMode = 'live' | 'demo';

export interface EvaluateRequest {
  targetUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  model?: string;
  tests?: Array<{
    description: string;
    prompt: string;
    assert?: Array<{ type: string; value: string }>;
  }>;
}

export interface EvaluateResult {
  id: string;
  category?: string;
  description: string;
  prompt: string;
  target: string;
  passed: boolean;
  severity: 'high' | 'medium' | 'low';
  score: number;
  output: string;
  assertions: Array<{ type: string; value: string; passed: boolean }>;
  timestamp: string;
}

export interface EvaluationRun {
  runId: string;
  status: 'running' | 'completed' | 'failed';
  mode: BackendMode;
  target: string;
  model: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: EvaluateResult[];
  generatedAt: string;
  downloads?: {
    json: string;
    pdf: string;
    csv: string;
  };
}

export interface BackendStatus {
  mode: BackendMode;
  online: boolean;
  origin: string;
}

/* ──────────────────────── Config ──────────────────────── */

// Backend origin from Vite env var. Set in Netlify dashboard or local .env.
// Example: https://abc123.loca.lt  or  http://localhost:3001
const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN || 'https://og-ai-safety-backend.onrender.com';

const API_BASE = BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : '';

// Health check timeout (ms) - short so demo fallback kicks in quickly
const HEALTH_TIMEOUT = 5000;

// Number of retry attempts for cold-start (Render free tier can take 10-30s to wake)
const HEALTH_MAX_RETRIES = 3;
const HEALTH_RETRY_DELAY_MS = 3000;

/* ──────────────────────── Precomputed Demo Data ──────────────────────── */

const DEMO_EVALUATION: EvaluationRun = {
  runId: redteamResults.runId,
  status: 'completed',
  mode: 'demo',
  target: redteamResults.target,
  model: redteamResults.model,
  totalTests: redteamResults.totalTests,
  passedTests: redteamResults.passedTests,
  failedTests: redteamResults.failedTests,
  generatedAt: redteamResults.generatedAt,
  results: redteamResults.results as EvaluateResult[],
  downloads: {
    json: '/api/evaluate/demo-mode/json',
    pdf: '/api/evaluate/demo-mode/pdf',
    csv: '/api/evaluate/demo-mode/csv',
  },
};

/* ──────────────────────── Mode Detection ──────────────────────── */

let cachedMode: BackendStatus | null = null;
let cacheTime = 0;
const MODE_CACHE_TTL = 15000; // Re-check every 15 seconds

async function checkBackendHealth(origin: string): Promise<boolean> {
  if (!origin) return false;

  // Retry loop to handle cold-start (Render free tier can take 10-30s to wake)
  for (let attempt = 0; attempt < HEALTH_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

    try {
      const res = await fetch(`${origin}/api/health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (res.ok) return true;
    } catch {
      // Ignore, try again
    } finally {
      clearTimeout(timeout);
    }

    // Wait before retry (except on last attempt)
    if (attempt < HEALTH_MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, HEALTH_RETRY_DELAY_MS));
    }
  }

  return false;
}

export async function detectMode(): Promise<BackendStatus> {
  const now = Date.now();
  if (cachedMode && now - cacheTime < MODE_CACHE_TTL) {
    return cachedMode;
  }

  const online = await checkBackendHealth(BACKEND_ORIGIN);
  cachedMode = {
    mode: online ? 'live' : 'demo',
    online,
    origin: BACKEND_ORIGIN,
  };
  cacheTime = now;

  return cachedMode;
}

/* ──────────────────────── API Client ──────────────────────── */

const API_CLIENT = {
  /**
   * Detect live vs demo mode by hitting the backend health endpoint.
   */
  async getMode(): Promise<BackendStatus> {
    return detectMode();
  },

  /**
   * Start a red-teaming evaluation.
   * Live mode: POST to backend. Demo mode: return precomputed data.
   */
  async evaluate(request: EvaluateRequest): Promise<EvaluationRun> {
    const status = await detectMode();

    if (status.mode === 'live' && status.origin) {
      try {
        const res = await fetch(`${API_BASE}/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return {
          ...data,
          mode: 'live' as const,
          downloads: {
            json: `${API_BASE}/evaluate/${data.runId}/json`,
            pdf: `${API_BASE}/evaluate/${data.runId}/pdf`,
            csv: `${API_BASE}/evaluate/${data.runId}/csv`,
          },
        };
      } catch (err) {
        console.warn('Backend evaluation failed, falling back to demo:', err);
        return { ...DEMO_EVALUATION };
      }
    }

    return { ...DEMO_EVALUATION };
  },

  /**
   * Poll for evaluation results (live mode only).
   */
  async getEvaluation(runId: string): Promise<EvaluationRun | null> {
    const status = await detectMode();

    if (status.mode === 'live' && status.origin) {
      try {
        const res = await fetch(`${API_BASE}/evaluate/${runId}`, {
          cache: 'no-store',
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    }

    return runId === 'demo-mode' ? { ...DEMO_EVALUATION } : null;
  },

  /**
   * Download a generated report (json | pdf | csv).
   * Live mode: fetch from backend. Demo mode: client-side blob.
   */
  async downloadReport(
    runId: string,
    format: 'json' | 'pdf' | 'csv'
  ): Promise<Blob> {
    const status = await detectMode();

    if (status.mode === 'live' && status.origin) {
      const res = await fetch(`${API_BASE}/evaluate/${runId}/${format}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.blob();
    }

    // Demo mode: generate client-side
    if (format === 'json') {
      return new Blob([JSON.stringify(DEMO_EVALUATION, null, 2)], {
        type: 'application/json',
      });
    }

    if (format === 'csv') {
      const header =
        'id,category,description,prompt,target,passed,severity,score,output,timestamp\n';
      const rows = DEMO_EVALUATION.results.map(
        (r) =>
          `"${r.id}","${r.category}","${r.description}","${r.prompt.replace(
            /"/g,
            '""'
          )}","${r.target}",${r.passed},"${r.severity}",${r.score},"${r.output.replace(
            /"/g,
            '""'
          )}","${r.timestamp}"`
      );
      return new Blob([header + rows.join('\n')], { type: 'text/csv' });
    }

    return new Blob(['PDF report generated client-side via jsPDF.'], {
      type: 'application/pdf',
    });
  },

  /* ───────── Legacy methods (kept for existing UI) ───────── */

  async processChatMessage(
    text: string,
    toggles: { input: boolean; output: boolean; raw: boolean }
  ): Promise<{
    response: string;
    preProcessing?: PIIProcessResult;
    postProcessing?: PIIProcessResult;
  }> {
    const status = await detectMode();

    if (status.mode === 'live' && status.origin) {
      try {
        const res = await fetch(`${API_BASE}/chat/guardrail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, toggles }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch {
        // Fall through to demo
      }
    }

    const isThreat = text.toLowerCase().includes('ignore previous');
    return {
      response: isThreat
        ? 'Request blocked. Hidden instructions and safety boundaries remain protected.'
        : 'Payload inspected. Sensitive entities were masked before model processing and the response passed output review.',
    };
  },

  async getRedTeamFindings(): Promise<EvaluateResult[]> {
    const status = await detectMode();

    if (status.mode === 'live' && status.origin) {
      try {
        const res = await fetch(`${API_BASE}/redteam/findings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch {
        return DEMO_EVALUATION.results;
      }
    }

    return DEMO_EVALUATION.results;
  },

  async getComplianceMatrix(pillar: string) {
    const status = await detectMode();

    if (status.mode === 'live' && status.origin) {
      try {
        const res = await fetch(
          `${API_BASE}/compliance/matrix?pillar=${encodeURIComponent(pillar)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch {
        return null;
      }
    }

    return {
      pillar,
      controls_mapped: '47/56',
      readiness_index: 82.4,
      evidence: [
        { id: 'RT-038', title: 'Context & data mapping', status: 'HIGH / IN PROGRESS', tone: 'red' },
        { id: 'PG-014', title: 'Privacy risk measurement', status: 'LOW / PASSED', tone: 'green' },
        { id: 'DOC-021', title: 'Human oversight roles', status: 'REVIEW REQUIRED', tone: 'gold' },
        { id: 'EV-009', title: 'Incident response plan', status: 'NOT STARTED', tone: 'cyan' },
      ],
    };
  },

  async exportDossier(
    format: 'json' | 'markdown' | 'pdf'
  ): Promise<Blob | ExecutiveDossier | null> {
    const status = await detectMode();

    if (status.mode === 'live' && status.origin) {
      try {
        const res = await fetch(`${API_BASE}/compliance/dossier?format=${format}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (format === 'json') return await res.json();
        return await res.blob();
      } catch {
        return null;
      }
    }

    const content =
      format === 'json'
        ? JSON.stringify(
            { readiness: 82.4, openFindings: 6, controlCoverage: '47/56' },
            null,
            2
          )
        : '# O&G Executive Readiness Dossier\n\nReadiness index: 82.4 / 100\nControl coverage: 47 / 56';

    return new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/plain',
    }) as unknown as Blob | ExecutiveDossier | null;
  },
};

export default API_CLIENT;
