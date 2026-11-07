/**
 * O&G AI Safety & Compliance Pipeline - Demo API Client
 * Always uses pre-computed sandbox results. No live backend dependency.
 * The live site (Netlify) works fully offline with these pre-saved results.
 */

import type {
  PIIProcessResult,
  ExecutiveDossier,
} from '../types/pipeline';
import redteamResults from '../data/redteam-results.json';

/* ──────────────────────── Types ──────────────────────── */

export type BackendMode = 'demo';

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
  status: 'completed';
  mode: BackendMode;
  target: string;
  model: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: EvaluateResult[];
  generatedAt: string;
}

/* ──────────────────────── Precomputed Data ──────────────────────── */

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
};

/* ──────────────────────── API Client (Demo Only) ──────────────────────── */

const API_CLIENT = {
  /**
   * Always returns 'demo' mode — no live backend is used.
   */
  async getMode(): Promise<{ mode: BackendMode; online: boolean }> {
    return { mode: 'demo', online: false };
  },

  /**
   * Returns the pre-computed evaluation run immediately.
   */
  async evaluate(): Promise<EvaluationRun> {
    // Simulate a brief evaluation delay for realism
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { ...DEMO_EVALUATION };
  },

  /**
   * Returns the same pre-computed run (no polling needed in demo mode).
   */
  async getEvaluation(): Promise<EvaluationRun | null> {
    return { ...DEMO_EVALUATION };
  },

  /**
   * Download a generated report (json | pdf | csv) — generated client-side.
   */
  async downloadReport(
    format: 'json' | 'pdf' | 'csv'
  ): Promise<Blob> {
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

    // PDF placeholder — real PDF generated client-side via jsPDF in the component.
    return new Blob(['PDF report generated client-side via jsPDF.'], {
      type: 'application/pdf',
    });
  },

  /* ───────── Legacy methods (kept for existing UI) ───────── */

  async processChatMessage(): Promise<{
    response: string;
    preProcessing?: PIIProcessResult;
    postProcessing?: PIIProcessResult;
  }> {
    return {
      response:
        'Payload inspected. Sensitive entities were masked before model processing and the response passed output review.',
    };
  },

  async getRedTeamFindings(): Promise<EvaluateResult[]> {
    return DEMO_EVALUATION.results;
  },

  async getComplianceMatrix(pillar: string) {
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
