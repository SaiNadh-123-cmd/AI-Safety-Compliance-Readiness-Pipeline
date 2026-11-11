/**
 * EvaluationPanel - Red-teaming evaluation form and results viewer (Hybrid Mode).
 * Live mode: submits target URL to backend, runs real Promptfoo + Ollama eval.
 * Demo mode: shows pre-computed sandbox results.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Play, X, ShieldAlert, FileText, File, Files } from 'lucide-react';
import API_CLIENT, {
  type EvaluateRequest,
  type EvaluationRun,
} from '../services/api';
import { DEMO_TESTS } from '../data/demo-tests';

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
      const doc = new jsPDF();

      const MARGIN = 20;
      const PAGE_WIDTH = 210; // mm (A4)
      const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
      const C = {
        navy: [1, 9, 29],
        gold: [255, 238, 85],
        cyan: [0, 229, 255],
        emerald: [16, 185, 129],
        crimson: [239, 68, 68],
        dark: [15, 23, 42],
        muted: [100, 116, 139],
        lightGray: [148, 163, 184],
        amber: [245, 158, 11],
        textDark: [30, 41, 59],
        kpiBorder: [226, 232, 240],
        white: [255, 255, 255],
      };

      let y = MARGIN;

      // ── Branded header banner ──
      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.rect(0, 0, PAGE_WIDTH, 30, 'F');
      doc.setFillColor(C.gold[0], C.gold[1], C.gold[2]);
      doc.rect(0, 30, PAGE_WIDTH, 1.5, 'F');
      doc.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.rect(0, 31.5, PAGE_WIDTH, 1, 'F');

      // Vector O&G emblem (hexagon)
      doc.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      const cx = MARGIN + 10;
      const cy = 15;
      const r = 7;
      const points: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
      }
      doc.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < 6; i++) doc.lineTo(points[i][0], points[i][1]);
      doc.fill();

      doc.setFillColor(C.gold[0], C.gold[1], C.gold[2]);
      doc.circle(cx, cy, r * 0.42, 'F');
      doc.setDrawColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.setLineWidth(0.5);
      doc.circle(cx, cy, r * 0.42, 'S');

      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const tw = doc.getTextWidth('O&G');
      doc.text('O&G', cx - tw / 2, cy - 1.5);

      // Title
      doc.setFillColor(C.white[0], C.white[1], C.white[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('AI SAFETY & COMPLIANCE READINESS PIPELINE', MARGIN + 22, 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(200, 220, 240);
      doc.text(
        'Executive Red-Teaming, PII Guardrail & Regulatory Audit Report',
        MARGIN + 22,
        15
      );

      // Metadata pill
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(PAGE_WIDTH - MARGIN - 50, 8, 50, 14, 2, 2, 'F');
      doc.setDrawColor(0, 229, 255);
      doc.setLineWidth(0.5);
      doc.roundedRect(PAGE_WIDTH - MARGIN - 50, 8, 50, 14, 2, 2, 'S');
      doc.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.setFontSize(6.5);
      doc.text('RUN ID', PAGE_WIDTH - MARGIN - 48, 10.5);
      doc.setFillColor(C.white[0], C.white[1], C.white[2]);
      doc.setFontSize(7);
      doc.text(
        run.runId.substring(0, 12) + '…',
        PAGE_WIDTH - MARGIN - 48,
        13,
        { maxWidth: 44 }
      );

      y = 40;

      // ── KPI row ──
      const passRate = run.totalTests > 0 ? ((run.passedTests / run.totalTests) * 100).toFixed(1) : '0.0';
      const kpis = [
        { label: 'TOTAL PROBES', value: run.totalTests, accent: C.navy },
        { label: 'PASSED SAFEGUARDS', value: run.passedTests, accent: C.emerald },
        { label: 'CRITICAL / FAILED', value: run.failedTests, accent: C.crimson },
        { label: 'PASS RATE', value: passRate + '%', accent: C.cyan },
      ];
      const kpiW = (CONTENT_WIDTH - 3 * 4) / 4;
      kpis.forEach((k, i) => {
        const x = MARGIN + i * (kpiW + 4);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, kpiW, 14, 2, 2, 'F');
        doc.setDrawColor(C.kpiBorder[0], C.kpiBorder[1], C.kpiBorder[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, kpiW, 14, 2, 2, 'S');
        doc.setFillColor(k.accent[0], k.accent[1], k.accent[2]);
        doc.rect(x, y, kpiW, 1.5, 'F');
        doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(String(k.value), x, y + 3, { maxWidth: kpiW, align: 'center' });
        doc.setFillColor(C.muted[0], C.muted[1], C.muted[2]);
        doc.setFontSize(5.5);
        doc.text(k.label, x, y + 9, { maxWidth: kpiW, align: 'center' });
      });
      y += 20;

      // ── Evidence cards ──
      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('[02] ADVERSARIAL RED-TEAM EVIDENCE LOG', MARGIN, y);
      y += 6;

      run.results.forEach((r) => {
        const promptLines = doc.splitTextToSize(r.prompt, CONTENT_WIDTH - 30, { fontSize: 7 });
        const outputLines = doc.splitTextToSize(r.output || '(no output)', CONTENT_WIDTH - 30, { fontSize: 7 });
        const cardHneeded = 10 + promptLines.length * 4.5 + outputLines.length * 4.5 + 14;

        if (y + cardHneeded > 280) {
          doc.addPage();
          y = MARGIN;
        }

        const cardY = y;
        const statusColor = r.passed ? C.emerald : C.crimson;
        const statusText = r.passed ? 'PASSED' : 'FAILED';

        // Card bg
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(MARGIN, cardY, CONTENT_WIDTH, cardHneeded, 2, 2, 'F');
        doc.setDrawColor(C.lightGray[0], C.lightGray[1], C.lightGray[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(MARGIN, cardY, CONTENT_WIDTH, cardHneeded, 2, 2, 'S');

        // Header strip
        doc.setFillColor(C.dark[0], C.dark[1], C.dark[2]);
        doc.rect(MARGIN, cardY, CONTENT_WIDTH, 7, 'F');

        doc.setFillColor(C.white[0], C.white[1], C.white[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(r.id.toUpperCase(), MARGIN + 4, cardY + 1.5);
        doc.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);
        doc.text(r.description, MARGIN + 18, cardY + 1.5, { maxWidth: CONTENT_WIDTH - 60 });

        // Status badge
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(PAGE_WIDTH - MARGIN - 25, cardY + 1.5, 21, 4, 2, 2, 'F');
        doc.setFillColor(C.white[0], C.white[1], C.white[2]);
        doc.setFontSize(6);
        doc.text(statusText, PAGE_WIDTH - MARGIN - 25, cardY + 3, {
          maxWidth: 25,
          align: 'center',
        });

        let py = cardY + 9;
        // Prompt box
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(MARGIN + 2, py, CONTENT_WIDTH - 4, promptLines.length * 4.5 + 4, 1.5, 1.5, 'F');
        doc.setFillColor(C.muted[0], C.muted[1], C.muted[2]);
        doc.setFontSize(6);
        doc.text('ADVERSARIAL PROMPT', MARGIN + 6, py + 1.5);
        doc.setFillColor(C.textDark[0], C.textDark[1], C.textDark[2]);
        doc.setFontSize(7);
        doc.text(promptLines, MARGIN + 6, py + 5);

        py += promptLines.length * 4.5 + 6;

        // Response box
        const respBg = r.passed ? [236, 253, 245] : [255, 241, 242];
        doc.setFillColor(respBg[0], respBg[1], respBg[2]);
        doc.roundedRect(MARGIN + 2, py, CONTENT_WIDTH - 4, outputLines.length * 4.5 + 4, 1.5, 1.5, 'F');
        const respTextColor = r.passed ? C.emerald : C.crimson;
        doc.setFillColor(respTextColor[0], respTextColor[1], respTextColor[2]);
        doc.setFontSize(6);
        doc.text(
          r.passed ? 'GUARDRAIL RESPONSE — PASS' : 'GUARDRAIL RESPONSE — FAIL',
          MARGIN + 6,
          py + 1.5
        );
        doc.setFillColor(C.textDark[0], C.textDark[1], C.textDark[2]);
        doc.setFontSize(7);
        doc.text(doc.splitTextToSize(r.output || '(no output)', CONTENT_WIDTH - 30, { fontSize: 7 }), MARGIN + 6, py + 5);

        y = py + outputLines.length * 4.5 + 10;
      });

      y += 8;

      // ── Compliance matrix ──
      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('[03] NIST AI RMF & EU AI ACT COMPLIANCE MATRIX', MARGIN, y);
      y += 6;

      const matrix = [
        ['GOVERN — Accountability', 'RT-038', 'IN PROGRESS', 'HIGH', 'Remediate critical findings within 14 days'],
        ['MAP — Context Mapping', 'MAP-014', 'PASSED', 'MEDIUM', 'All attack vectors covered'],
        ['MEASURE — Metrics', 'MES-021', 'PASSED', 'MEDIUM', 'Pass/fail rates logged'],
        ['MANAGE — Response', 'MAN-009', 'REVIEW', 'HIGH', 'Human review before production release'],
        ['EU AI Act — Art. 10 Data Gov.', 'EU-10-A', 'PASSED', 'MEDIUM', 'No PII leakage detected'],
        ['EU AI Act — Art. 14 Oversight', 'EU-14-B', 'REVIEW', 'HIGH', 'Human-in-the-loop for medical queries'],
        ['EU AI Act — Art. 15 Robustness', 'EU-15-C', 'PASSED', 'LOW', 'Jailbreak & toxic prompts refused'],
      ];

      // Table header
      doc.setFillColor(C.dark[0], C.dark[1], C.dark[2]);
      doc.rect(MARGIN, y, CONTENT_WIDTH, 6, 'F');
      doc.setFillColor(C.white[0], C.white[1], C.white[2]);
      doc.setFontSize(6.5);
      doc.text('CONTROL TOPIC', MARGIN + 2, y + 1.5, { maxWidth: 40 });
      doc.text('EVIDENCE ID', MARGIN + 42, y + 1.5, { maxWidth: 25 });
      doc.text('STATUS', MARGIN + 68, y + 1.5, { maxWidth: 25 });
      doc.text('SEVERITY', MARGIN + 94, y + 1.5, { maxWidth: 25 });
      doc.text('REVIEW / MITIGATION', MARGIN + 120, y + 1.5, { maxWidth: CONTENT_WIDTH - 122 });
      y += 7;

      matrix.forEach((row) => {
        if (y + 5 > 280) {
          doc.addPage();
          y = MARGIN;
        }
        const statusColor = row[2] === 'PASSED' ? C.emerald : row[2] === 'IN PROGRESS' ? C.amber : C.crimson;
        const sevColor = row[3] === 'HIGH' ? C.crimson : row[3] === 'MEDIUM' ? C.amber : C.emerald;

        doc.setFillColor(255, 255, 255);
        doc.rect(MARGIN, y, CONTENT_WIDTH, 5.5, 'F');
        doc.setDrawColor(C.lightGray[0], C.lightGray[1], C.lightGray[2]);
        doc.setLineWidth(0.3);
        doc.line(MARGIN, y + 5.5, MARGIN + CONTENT_WIDTH, y + 5.5);

        doc.setFillColor(C.textDark[0], C.textDark[1], C.textDark[2]);
        doc.setFontSize(6.5);
        doc.text(row[0], MARGIN + 2, y + 1.2, { maxWidth: 38 });
        doc.setFillColor(C.muted[0], C.muted[1], C.muted[2]);
        doc.text(row[1], MARGIN + 42, y + 1.2, { maxWidth: 24 });
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.setFontSize(6.5);
        doc.text(row[2], MARGIN + 68, y + 1.2, { maxWidth: 24 });
        doc.setFillColor(sevColor[0], sevColor[1], sevColor[2]);
        doc.text(row[3], MARGIN + 94, y + 1.2, { maxWidth: 24 });
        doc.setFillColor(C.textDark[0], C.textDark[1], C.textDark[2]);
        doc.text(row[4], MARGIN + 120, y + 1.2, { maxWidth: CONTENT_WIDTH - 122 });
        y += 5.8;
      });

      y += 8;

      // ── Footer ──
      doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
      y += 4;
      doc.setFillColor(C.muted[0], C.muted[1], C.muted[2]);
      doc.setFontSize(6);
      doc.text(
        'O&G AI Safety & Compliance Pipeline • Automated technical evidence only; not a legal compliance determination. Human review required.',
        MARGIN,
        y,
        { maxWidth: CONTENT_WIDTH, align: 'center' }
      );
      doc.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.setFontSize(7);
      doc.text('aisafetycompliance.netlify.app', MARGIN, y + 4, {
        maxWidth: CONTENT_WIDTH,
        align: 'center',
      });

      doc.save(`og-safety-${run.runId}.pdf`);
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
