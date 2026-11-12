/**
 * EvaluationPanel - Red-teaming evaluation form and results viewer (Hybrid Mode).
 * Live mode: submits target URL to backend, runs real Promptfoo + Ollama eval.
 * Demo mode: shows pre-computed sandbox results.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, X, ShieldAlert, FileText, File, Files } from 'lucide-react';
import API_CLIENT, {
  type EvaluateRequest,
  type EvaluationRun,
} from '../services/api';
import { DEMO_TESTS } from '../data/demo-tests';
import { exportExecutivePdf } from '../utils/exportExecutivePdf';

export function EvaluationPanel() {
  const [evaluating, setEvaluating] = useState(false);
  const [run, setRun] = useState<EvaluationRun | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const startPolling = (runId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    const interval = setInterval(async () => {
      const updated = await API_CLIENT.getEvaluation(runId);
      if (updated) {
        setRun(updated);
        if (updated.status === 'completed' || updated.status === 'failed') {
          clearInterval(interval);
          setEvaluating(false);
          pollIntervalRef.current = null;
        }
      }
    }, 3000);

    pollIntervalRef.current = interval;
  };

  const startEvaluation = useCallback(async () => {
    setEvaluating(true);
    setRun(null);

    const request: EvaluateRequest = {
      targetUrl: targetUrl || undefined,
      apiKey: apiKey || undefined,
      model: 'qwen3:8b',
      tests: DEMO_TESTS,
    };

    let started: EvaluationRun | undefined;
    try {
      started = await API_CLIENT.evaluate(request);
      setRun(started);
      if (started.mode === 'live') {
        startPolling(started.runId);
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
      setEvaluating(false);
    } finally {
      if (!started) setEvaluating(false);
    }
  }, [targetUrl, apiKey]);

  const downloadReport = async (format: 'json' | 'pdf' | 'csv') => {
    if (!run) return;
    try {
      const blob = await API_CLIENT.downloadReport(run.runId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `og-safety-${run.runId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Download ${format} failed:`, err);
      alert(`Failed to download ${format.toUpperCase()} report.`);
    }
  };

  const downloadPdf = () => {
    if (!run) return;
    try {
      exportExecutivePdf(run);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF report.');
    }
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const isLive = run?.mode === 'live';
  const passRate = run
    ? ((run.passedTests / run.totalTests) * 100).toFixed(0)
    : '0';

  return (
    <section className="evaluation-section section-shell">
      <div className="section-intro">
        <div className="section-index">01</div>
        <div>
          <div className="section-label">Workstream A / Red-Teaming Arena</div>
          <h2>Run Safety <span>Evaluation</span></h2>
        </div>
        <p>
          {isLive
            ? 'Live evaluation via Promptfoo + Ollama qwen3:8b through your tunnel.'
            : 'Pre-computed red-teaming results against qwen3:8b. Start the backend + tunnel for live evaluation.'}
        </p>
      </div>

      <div className="eval-card">
        <div className="eval-header">
          <h3>Target Configuration</h3>
          <span className={`mode-pill ${isLive ? 'live' : 'demo'}`}>
            {isLive ? '● Live Backend' : '○ Demo Mode'}
          </span>
        </div>

        <div className="eval-form">
          <div className="form-row">
            <label>Target Chatbot URL</label>
            <input
              type="url"
              placeholder="https://your-chatbot.com/api/chat"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={evaluating}
              className="bg-[#021233] text-white placeholder-slate-400 border border-[#00E5FF]/30 rounded-md px-3 py-2 focus:outline-none focus:border-[#00E5FF]/50"
            />
          </div>
          <div className="form-row">
            <label>API Key (optional)</label>
            <input
              type="password"
              placeholder="sk-…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={evaluating}
              className="bg-[#021233] text-white placeholder-slate-400 border border-[#00E5FF]/30 rounded-md px-3 py-2 focus:outline-none focus:border-[#00E5FF]/50"
            />
          </div>
          <div className="form-hint">
            Leave URL empty to test against the default local Ollama model (qwen3:8b).
            {isLive
              ? 'Results come from your live backend.'
              : 'Backend offline — showing precomputed sandbox results.'}
          </div>

          <button
            className={`eval-button ${evaluating ? 'running' : ''}`}
            onClick={startEvaluation}
            disabled={evaluating}
          >
            {evaluating ? (
              <>
                <Play size={14} className="animate-spin" />
                Running evaluation…
              </>
            ) : (
              <>
                <Play size={14} />
                Run Safety Evaluation
              </>
            )}
          </button>
        </div>

        {run && (
          <div className="eval-results">
            <div className="results-header">
              <h3>Evaluation Results</h3>
              <button className="close-results" onClick={() => setRun(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="results-summary">
              <div className="stat">
                <span className="stat-value">{run.totalTests}</span>
                <span className="stat-label">Total Tests</span>
              </div>
              <div className="stat">
                <span className="stat-value" style={{ color: '#19dda2' }}>
                  {run.passedTests}
                </span>
                <span className="stat-label">Passed</span>
              </div>
              <div className="stat">
                <span className="stat-value" style={{ color: '#ff2a5f' }}>
                  {run.failedTests}
                </span>
                <span className="stat-label">Failed</span>
              </div>
              <div className="stat">
                <span className="stat-value">{passRate}%</span>
                <span className="stat-label">Pass Rate</span>
              </div>
            </div>

            <div className="results-list">
              {run.results.map((r) => (
                <div
                  key={r.id}
                  className={`result-item ${r.passed ? 'passed' : 'failed'}`}
                >
                  <div className="result-head">
                    <span className="result-id">{r.id}</span>
                    <span className="result-title">{r.description}</span>
                    <span className={`result-badge ${r.passed ? 'pass' : 'fail'}`}>
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="result-prompt">{r.prompt}</div>
                  <div className="result-output">
                    <ShieldAlert size={12} />
                    {r.output}
                  </div>
                </div>
              ))}
            </div>

            <div className="results-downloads">
              <h4>Download Reports</h4>
              <div className="download-buttons">
                <button className="download-btn" onClick={() => downloadReport('json')}>
                  <FileText size={14} /> JSON
                </button>
                <button className="download-btn" onClick={downloadPdf}>
                  <File size={14} /> PDF
                </button>
                <button className="download-btn" onClick={() => downloadReport('csv')}>
                  <Files size={14} /> CSV
                </button>
              </div>
              <p className="download-hint">
                {isLive
                  ? 'Generated by your live backend.'
                  : 'Generated client-side from precomputed sandbox data.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
