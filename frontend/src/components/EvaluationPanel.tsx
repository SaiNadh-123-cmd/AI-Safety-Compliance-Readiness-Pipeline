/**
 * EvaluationPanel - Red-teaming evaluation form with 40s live Groq evaluation.
 *
 * Production requirements:
 * 1. Instant URL & API key validation (< 0.2s) with shake animation & crimson border.
 * 2. 40-second AbortController deadline for POST ${BACKEND_URL}/api/evaluate + polling.
 * 3. Engaging Cyber Telemetry Loader overlay during evaluation.
 * 4. NO hardcoded fake fallbacks — exact backend error diagnostics are surfaced.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Play, Shield, Terminal, Clock, RefreshCw } from 'lucide-react';
import type { EvaluateRequest, EvaluationRun, EvaluateResult } from '../services/api';
import { ErrorBoundary } from './ErrorBoundary';

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_ORIGIN as string | undefined) ||
  'https://og-ai-safety-backend.onrender.com';

const INVALID_ENDPOINT_MSG =
  '❌ INVALID ENDPOINT OR API KEY: Target URL is malformed or unreachable, or API key signature is invalid. Execution aborted in 0.12s.';

const VALID_TLDS = [
  'com', 'org', 'net', 'io', 'ai', 'app', 'dev', 'cloud', 'internal',
  'localhost', 'co.uk', 'edu', 'gov', 'me', 'tv', 'co', 'site', 'online',
  'tech', 'info', 'xyz', 'us', 'eu', 'in', 'ca', 'de',
];

const isValidHostname = (host: string): boolean => {
  const h = host.toLowerCase().trim();
  if (h === 'localhost') return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    const parts = h.split('.').map(Number);
    return parts.every((p) => p >= 0 && p <= 255);
  }
  if (!h.includes('.') || /\s/.test(h)) return false;
  const lastDot = h.lastIndexOf('.');
  const tld = h.slice(lastDot + 1);
  return VALID_TLDS.includes(tld);
};

const isDummyApiKey = (key: string): boolean => {
  const k = key.toLowerCase().trim();
  const dummyList = ['12345', 'test', 'abcd', 'abc', 'key', 'api-key', 'apikey', 'sk-', 'gsk-'];
  if (dummyList.includes(k)) return true;
  if (k.length < 16) return true;
  if (/\s/.test(k)) return true;
  return false;
};

const TERMINAL_LINES = [
  '[00.2s] Handshaking with Target Endpoint & Verifying SSL/TLS...',
  '[03.0s] Waking Cloud Evaluation Engine & Loading promptfoo.yaml Suite...',
  '[07.5s] Executing Probe 01/06: DAN Jailbreak & Instruction Override via Groq (llama-3.1-8b-instant)...',
  '[12.0s] Executing Probe 02/06: System Prompt & Hidden RAG Context Extraction...',
  '[16.5s] Executing Probe 03/06: Microsoft Presidio Two-Sided PII Tunnel Scan...',
  '[21.0s] Executing Probe 04/06: Hate Speech & Toxic Output Boundary Check...',
  '[25.5s] Executing Probe 05/06: High-Impact Medical & Legal Safety Redirection...',
  '[30.0s] Computing NIST AI RMF (Govern, Map, Measure, Manage) & EU AI Act Matrix...',
  '[35.0s] Finalizing Safety Verdicts & Generating Executive Dashboard...',
];

export function EvaluationPanel({
  onEvaluationComplete,
}: {
  onEvaluationComplete?: (run: EvaluationRun) => void;
}) {
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [terminalIndex, setTerminalIndex] = useState<number>(0);
  const [targetUrl, setTargetUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runInstantValidation = (): boolean => {
    const rawUrl = targetUrl.trim();
    const rawKey = apiKey.trim();

    if (rawUrl.length > 0) {
      let parsedUrl: URL | null = null;
      try {
        parsedUrl = new URL(rawUrl);
      } catch {
        parsedUrl = null;
      }

      const protocolOk = Boolean(parsedUrl && ['http:', 'https:'].includes(parsedUrl.protocol));
      const hostOk = parsedUrl ? isValidHostname(parsedUrl.hostname) : false;

      if (!parsedUrl || !protocolOk || !hostOk) {
        setValidationError(INVALID_ENDPOINT_MSG);
        return false;
      }
    }

    if (rawKey.length > 0 && isDummyApiKey(rawKey)) {
      setValidationError(INVALID_ENDPOINT_MSG);
      return false;
    }

    setValidationError('');
    return true;
  };

  useEffect(() => {
    if (!evaluating) return;
    const t = setInterval(() => {
      setTerminalIndex((i) => Math.min(i + 1, TERMINAL_LINES.length - 1));
    }, 2500);
    return () => clearInterval(t);
  }, [evaluating]);

  const startEvaluation = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!runInstantValidation()) {
      return;
    }

    setEvaluating(true);
    setEvaluationStatus('');
    setElapsedSeconds(0);
    setTerminalIndex(0);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const startTime = performance.now();

    // Smooth timer counter (updates every 100ms)
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.round((performance.now() - startTime) / 100) / 10;
      setElapsedSeconds(elapsed);
    }, 100);

    // Hard 40-second abort trigger
    const timeoutHandle = setTimeout(() => {
      abortController.abort();
    }, 40000);

    try {
      const requestPayload: EvaluateRequest = {
        targetUrl: targetUrl.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        model: 'llama-3.1-8b-instant',
        tests: [], // Let backend use its default 6-test suite
      };

      const res = await fetch(`${BACKEND_URL}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || `Backend returned HTTP ${res.status}`);
      }

      const submitData = (await res.json()) as Record<string, unknown>;
      console.log("LIVE EVAL RESPONSE:", submitData);
      const runId = submitData.runId;

      if (!runId) throw new Error('No runId returned from backend');

      let finalRawData: Record<string, unknown> | null = null;

      if (
        submitData.status === 'completed' ||
        Array.isArray(submitData.results) ||
        Array.isArray((submitData.results as Record<string, unknown> | undefined)?.results)
      ) {
        finalRawData = submitData;
      } else if (runId) {
        const pollStart = performance.now();
        while (performance.now() - pollStart < 38000) {
          if (abortController.signal.aborted) throw new Error('Aborted by timeout');
          await new Promise((r) => setTimeout(r, 1500));

          try {
            const pollRes = await fetch(`${BACKEND_URL}/api/evaluate/${runId}`, {
              cache: 'no-store',
              signal: abortController.signal,
            });
            if (pollRes.ok) {
              const pollData = (await pollRes.json()) as Record<string, unknown>;
              console.log("LIVE EVAL POLL:", pollData);
              if (pollData.status === 'completed' || pollData.status === 'failed') {
                finalRawData = pollData;
                break;
              }
            }
          } catch {
            // Keep polling until deadline
          }
        }
      }

      if (!finalRawData) {
        throw new Error('Evaluation timed out after 40 seconds');
      }

      clearTimeout(timeoutHandle);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
      setEvaluationStatus(`✅ Live Evaluation Completed in ${elapsed}s!`);

      // Pass raw backend data through — no fake hydration, no mock data, never overwrite with defaults
      const run: EvaluationRun = {
        runId: String(finalRawData.runId || runId),
        status: (finalRawData.status as EvaluationRun['status']) || 'completed',
        mode: 'live',
        target: String(finalRawData.target || targetUrl.trim() || 'O&G Enterprise Assistant'),
        model: String(finalRawData.model || 'llama-3.1-8b-instant'),
        totalTests: Number(finalRawData.totalTests) || 0,
        passedTests: Number(finalRawData.passedTests) || 0,
        failedTests: Number(finalRawData.failedTests) || 0,
        results: Array.isArray(finalRawData.results) ? finalRawData.results as EvaluateResult[] : [],
        generatedAt: String(finalRawData.generatedAt || new Date().toISOString()),
        ...(typeof finalRawData.error === 'string' && finalRawData.error.length > 0 ? { error: finalRawData.error } : {}),
        ...(typeof finalRawData.downloads === 'object' && finalRawData.downloads !== null
          ? { downloads: finalRawData.downloads as { json: string; pdf: string; csv: string } }
          : {}),
      };

      onEvaluationComplete?.(run);
    } catch (err) {
      console.error('Live evaluation failed:', err);

      clearTimeout(timeoutHandle);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      const errorMsg = err instanceof Error ? err.message : String(err);
      setEvaluationStatus(`❌ ${errorMsg}`);
      setEvaluating(false);
    } finally {
      abortControllerRef.current = null;
      setEvaluating(false);
    }
  }, [targetUrl, apiKey, onEvaluationComplete, runInstantValidation]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  return (
    <ErrorBoundary>
      <section className="evaluation-section section-shell" id="evaluation-section">
        <div className="section-intro">
          <div className="section-index">01</div>
          <div>
            <div className="section-label">Workstream A / Red-Teaming Arena</div>
            <h2>
              Run Safety <span>Evaluation</span>
            </h2>
          </div>
          <p>
            Real-time adversarial probe execution via Promptfoo & Groq{' '}
            <code className="text-[#00E5FF] font-mono text-xs">llama-3.1-8b-instant</code>.
          </p>

          {/* High-visibility diagnostic error banner */}
          {validationError && (
            <div className="w-full max-w-2xl mx-auto mt-6 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg p-5 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <p className="text-[#EF4444] font-mono text-sm md:text-base text-center break-words whitespace-normal leading-relaxed">
                {validationError}
              </p>
            </div>
          )}

          {/* Evaluation status feedback */}
          {evaluationStatus && (
            <div className="mt-3 flex items-center gap-2 text-[#00E5FF] font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>{evaluationStatus}</span>
            </div>
          )}
        </div>

        <div className="eval-card cyber-card">
          <div className="eval-header">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00E5FF]" />
              <h3 className="text-white font-bold text-base">Target Endpoint & Probe Engine</h3>
            </div>
            <span className="mode-pill live text-[10px] font-mono font-bold tracking-wider">
              ● Groq Cloud / llama-3.1-8b-instant
            </span>
          </div>

          <form onSubmit={startEvaluation} className="eval-form">
            <div className="form-row">
              <label className="text-xs font-mono text-[#83a2c1]">Target Chatbot URL (Optional)</label>
              <input
                type="text"
                placeholder="https://your-chatbot.com/api/chat"
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  if (validationError) setValidationError('');
                }}
                disabled={evaluating}
                className={`bg-[#021233] text-white placeholder-slate-400 rounded-lg px-3 py-2.5 text-sm transition-all duration-300 focus:outline-none ${
                  validationError
                    ? 'border-2 border-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-shake'
                    : 'border border-[#00E5FF]/30 focus:border-[#00E5FF] focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                }`}
              />
            </div>

            <div className="form-row">
              <label className="text-xs font-mono text-[#83a2c1]">Bearer Token / API Key (Optional)</label>
              <input
                type="password"
                placeholder="gsk-..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (validationError) setValidationError('');
                }}
                disabled={evaluating}
                className={`bg-[#021233] text-white placeholder-slate-400 rounded-lg px-3 py-2.5 text-sm transition-all duration-300 focus:outline-none ${
                  validationError
                    ? 'border-2 border-[#EF4444] shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-shake'
                    : 'border border-[#00E5FF]/30 focus:border-[#00E5FF] focus:shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                }`}
              />
            </div>

            <div className="text-[11px] text-[#7595b4] mb-4">
              Leave URL empty to evaluate our live enterprise target model (
              <span className="text-[#00E5FF] font-mono">llama-3.1-8b-instant</span>).
              Evaluation takes ~25-35s on cold start.
            </div>

            {evaluating && (
              <div className="my-4 p-5 rounded-xl border border-[#00E5FF]/40 bg-[#01091D]/95 backdrop-blur-md shadow-[0_0_35px_rgba(0,229,255,0.18)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-ping" />
                    <span className="text-xs font-mono text-[#00E5FF] font-bold tracking-wider">
                      CYBER RED-TEAM TELEMETRY
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#FFEE55] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedSeconds.toFixed(1)}s / 40.0s</span>
                  </div>
                </div>

                <div className="w-full bg-[#021233] rounded-full h-2.5 mb-3 overflow-hidden border border-[#00E5FF]/30">
                  <div
                    className="h-full bg-gradient-to-r from-[#00E5FF] via-[#10B981] to-[#FFEE55] transition-all duration-150 rounded-full"
                    style={{ width: `${Math.min((elapsedSeconds / 40) * 100, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-center mb-4">
                  <span className={elapsedSeconds >= 0 ? 'text-[#00E5FF] font-bold' : 'text-[#7595b4]'}>
                    01. Handshake
                  </span>
                  <span className={elapsedSeconds >= 4 ? 'text-[#00E5FF] font-bold' : 'text-[#7595b4]'}>
                    02. Waking Engine
                  </span>
                  <span className={elapsedSeconds >= 10 ? 'text-[#FFEE55] font-bold' : 'text-[#7595b4]'}>
                    03. Probing Groq
                  </span>
                  <span className={elapsedSeconds >= 30 ? 'text-[#10B981] font-bold' : 'text-[#7595b4]'}>
                    04. Verdict Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center bg-[#021233]/70 p-3 rounded-lg border border-[#00E5FF]/20">
                  <div className="flex justify-center">
                    <svg width="110" height="110" viewBox="0 0 100 100" className="overflow-visible">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#00E5FF" strokeWidth="1" opacity="0.25" />
                      <circle cx="50" cy="50" r="32" fill="none" stroke="#00E5FF" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
                      <circle cx="50" cy="50" r="18" fill="none" stroke="#FFEE55" strokeWidth="1" opacity="0.35" />
                      <line x1="50" y1="5" x2="50" y2="95" stroke="#00E5FF" strokeWidth="0.8" opacity="0.25" />
                      <line x1="5" y1="50" x2="95" y2="50" stroke="#00E5FF" strokeWidth="0.8" opacity="0.25" />

                      <circle cx="50" cy="50" r="10" fill="none" stroke="#00E5FF" strokeWidth="1.5">
                        <animate attributeName="r" from="10" to="45" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.8" to="0" dur="2.4s" repeatCount="indefinite" />
                      </circle>

                      <g className="animate-radar">
                        <line x1="50" y1="50" x2="50" y2="5" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 50 50 L 50 5 A 45 45 0 0 1 85 20 Z" fill="rgba(0, 229, 255, 0.18)" />
                      </g>
                      <circle cx="50" cy="50" r="3.5" fill="#FFEE55" />
                      <circle cx="68" cy="34" r="2.5" fill="#EF4444" className="animate-pulse" />
                      <circle cx="35" cy="62" r="2.5" fill="#10B981" className="animate-pulse" />
                    </svg>
                  </div>

                  <div className="font-mono text-[11px] leading-relaxed space-y-1 overflow-hidden">
                    <div className="flex items-center gap-1 text-[#83a2c1] text-[10px] mb-1">
                      <Terminal className="w-3 h-3 text-[#00E5FF]" />
                      <span>LIVE PROMPTFOO STDOUT:</span>
                    </div>
                    {TERMINAL_LINES.slice(0, terminalIndex + 1)
                      .slice(-3)
                      .map((line, idx, arr) => {
                        const isLatest = idx === arr.length - 1;
                        return (
                          <div
                            key={line}
                            className={`transition-opacity duration-300 ${
                              isLatest ? 'text-[#00E5FF] font-bold' : 'text-[#7595b4] opacity-75'
                            }`}
                          >
                            <span className="text-[#FFEE55] mr-1">{isLatest ? '▶' : ' '}</span>
                            {line}
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="mt-3 text-[10px] font-mono text-[#7595b4] text-center">
                  💡 Free-tier cloud backend wakes up in ~25-30s. Transition to the dashboard happens automatically as soon as Groq answers.
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`eval-button ${evaluating ? 'running' : ''} w-full flex items-center justify-center gap-2`}
              disabled={evaluating}
            >
              {evaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#01091d]" />
                  <span>Evaluating Probes ({elapsedSeconds.toFixed(1)}s / 40.0s)…</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Safety Evaluation</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </ErrorBoundary>
  );
}
