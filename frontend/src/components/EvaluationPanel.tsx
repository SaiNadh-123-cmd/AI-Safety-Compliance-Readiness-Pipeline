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
      const PAGE_HEIGHT = 297;
      const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
      const BOTTOM_MARGIN = 20;
      const C = {
        navy: [1, 9, 29],
        gold: [255, 238, 85],
        cyan: [0, 229, 255],
        emerald: [16, 185, 129],
        crimson: [239, 68, 68],
        dark: [15, 23, 42],
        slate: [241, 245, 249],
        emeraldTint: [236, 253, 245],
        roseTint: [255, 241, 242],
        kpiFill: [248, 250, 252],
        kpiBorder: [226, 232, 240],
        textDark: [30, 41, 59],
        textMuted: [100, 116, 139],
        white: [255, 255, 255],
        lightGray: [148, 163, 184],
        amber: [245, 158, 11],
        blue: [59, 130, 246],
        muted: [100, 116, 139],
      };

      let y = MARGIN;
      let pageNum = 1;

      /* ───── Helpers ───── */
      function needSpace(neededHeight: number) {
        if (y + neededHeight > PAGE_HEIGHT - BOTTOM_MARGIN) {
          drawFooter(doc, pageNum);
          doc.addPage();
          pageNum++;
          y = MARGIN;
        }
      }

      function drawFooter(docRef: jsPDF, pn: number) {
        const fy = PAGE_HEIGHT - 25;
        docRef.save();
        docRef.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2], 0.15);
        docRef.setLineWidth(0.5);
        docRef.line(MARGIN, fy, PAGE_WIDTH - MARGIN, fy);

        docRef.setFillColor(C.muted[0], C.muted[1], C.muted[2]);
        docRef.setFont('helvetica');
        docRef.setFontSize(7);
        docRef.text(
          'O&G AI Safety & Compliance Pipeline • Technical assessment evidence only; does not constitute legal compliance or launch approval. Human review required.',
          MARGIN,
          fy + 6,
          { maxWidth: CONTENT_WIDTH, align: 'center' }
        );

        docRef.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);
        docRef.setFont('helvetica', 'bold');
        docRef.setFontSize(8);
        docRef.text(
          'aisafetycompliance.netlify.app',
          MARGIN,
          fy + 12,
          { maxWidth: CONTENT_WIDTH, align: 'center' }
        );

        docRef.setFillColor(C.muted[0], C.muted[1], C.muted[2]);
        docRef.setFontSize(7);
        docRef.text(`Page ${pn}`, PAGE_WIDTH - MARGIN - 25, fy + 16, {
          maxWidth: 25,
          align: 'right',
        });
        docRef.restore();
      }

      function drawVectorLogo(cx: number, cy: number, r: number) {
        const points: [number, number][] = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
        }
        doc.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);
        // Draw hexagon outline manually
        for (let i = 0; i < 6; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % 6];
          doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2]);
          doc.setLineWidth(0.5);
          doc.line(p1[0], p1[1], p2[0], p2[1]);
        }
        doc.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);

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
      }

      /* ───── PAGE 1: BRANDED HEADER ───── */
      needSpace(175);

      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.rect(0, 0, PAGE_WIDTH, 30, 'F');
      doc.setFillColor(C.gold[0], C.gold[1], C.gold[2]);
      doc.rect(0, 30, PAGE_WIDTH, 1.5, 'F');
      doc.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.rect(0, 31.5, PAGE_WIDTH, 1, 'F');

      // Vector O&G emblem
      drawVectorLogo(MARGIN + 10, 15, 7);

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
      doc.setFillColor(255, 255, 255, 0.08);
      doc.roundedRect(PAGE_WIDTH - MARGIN - 50, 8, 50, 18, 2, 2, 'F');
      doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2], 0.35);
      doc.setLineWidth(0.5);
      doc.roundedRect(PAGE_WIDTH - MARGIN - 50, 8, 50, 18, 2, 2, 'S');
      doc.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.setFontSize(6.5);
      doc.text('REPORT METADATA', PAGE_WIDTH - MARGIN - 48, 10.5);

      const modeLabel = run.mode === 'live' ? 'LIVE' : 'SANDBOX';
      const modeColor = run.mode === 'live' ? C.emerald : C.cyan;

      const metaItems = [
        ['Run ID', run.runId],
        ['Target System', run.target || 'Groq Cloud LLM'],
        ['Model', run.model || 'llama-3.1-8b-instant'],
        ['Mode', modeLabel],
      ];
      let my = 12;
      metaItems.forEach(([label, value]) => {
        doc.setFillColor(C.lightGray[0], C.lightGray[1], C.lightGray[2]);
        doc.setFontSize(6.5);
        doc.text(label, PAGE_WIDTH - MARGIN - 48, my);
        doc.setFillColor(label === 'Mode' ? modeColor[0] : C.white[0], label === 'Mode' ? modeColor[1] : C.white[1], label === 'Mode' ? modeColor[2] : C.white[2]);
        doc.setFontSize(7);
        doc.text(value, PAGE_WIDTH - MARGIN - 48, my + 3, { maxWidth: 44 });
        my += 4.5;
      });

      y = 40;

      /* ───── EXECUTIVE DASHBOARD ───── */
      needSpace(50);

      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('EXECUTIVE DASHBOARD', MARGIN, y);
      y += 6;
      doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, MARGIN + 60, y);
      y += 10;

      const passRate = run.totalTests > 0 ? ((run.passedTests / run.totalTests) * 100).toFixed(1) : '0.0';
      const kpis = [
        { label: 'TOTAL PROBES', value: run.totalTests, accent: C.navy },
        { label: 'PASSED SAFEGUARDS', value: run.passedTests, accent: C.emerald },
        { label: 'FAILED / CRITICAL', value: run.failedTests, accent: C.crimson },
        { label: 'SAFETY PASS RATE', value: passRate + '%', accent: C.cyan },
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

      /* Category breakdown stacked bars */
      needSpace(60);
      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('RED-TEAM CATEGORY BREAKDOWN', MARGIN, y);
      y += 6;
      doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, MARGIN + 78, y);
      y += 10;

      const categories = [
        { label: 'Jailbreaks & Override', key: 'jailbreak', color: C.navy },
        { label: 'System-Prompt Leakage', key: 'system-prompt', color: C.blue },
        { label: 'PII Disclosure', key: 'sensitive-data', color: C.amber },
        { label: 'Toxic / Abusive Output', key: 'toxic', color: C.crimson },
        { label: 'Dangerous Advice', key: 'dangerous', color: C.cyan },
      ];

      const catStats = categories.map((c) => {
        const matching = run.results.filter((r) =>
          (r.category || '').toLowerCase().includes(c.key.split('-')[0]) ||
          r.description.toLowerCase().includes(c.key.split('-')[0]) ||
          r.id.toLowerCase().includes(c.key.replace('-', ''))
        );
        const total = matching.length || 1;
        const passed = matching.filter((r) => r.passed).length;
        return { ...c, total, passed, failed: total - passed, rate: (passed / total) * 100 };
      });

      const barH = 5;
      const barGap = 3;
      const labelW = 45;
      const chartW = CONTENT_WIDTH - labelW - 10;

      catStats.forEach((c) => {
        needSpace(barH + barGap + 3);
        doc.setFillColor(C.textDark[0], C.textDark[1], C.textDark[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(c.label, MARGIN, y + 1.5, { maxWidth: labelW, align: 'right' });

        const barX = MARGIN + labelW + 5;
        const passW = (chartW * c.passed) / c.total;
        const failW = chartW - passW;

        // Background
        doc.setFillColor(C.kpiBorder[0], C.kpiBorder[1], C.kpiBorder[2]);
        doc.roundedRect(barX, y, chartW, barH, 1, 1, 'F');

        // Pass segment
        if (passW > 0) {
          doc.setFillColor(C.emerald[0], C.emerald[1], C.emerald[2]);
          doc.roundedRect(barX, y, passW, barH, 1, 1, 'F');
        }

        // Fail segment
        if (failW > 0) {
          doc.setFillColor(C.crimson[0], C.crimson[1], C.crimson[2]);
          doc.roundedRect(barX + passW, y, failW, barH, 1, 1, 'F');
        }

        // Percentage label
        doc.setFillColor(C.white[0], C.white[1], C.white[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.text(`${Math.round(c.rate)}%`, barX + chartW / 2 - 5, y + 1.5, {
          maxWidth: 10,
          align: 'center',
        });

        y += barH + barGap;
      });

      y += 8;

      /* ───── TABLE OF CONTENTS ───── */
      needSpace(50);
      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('INTERACTIVE TABLE OF CONTENTS', MARGIN, y);
      y += 6;
      doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, MARGIN + 92, y);
      y += 8;

      const tocItems = [
        { num: '01', title: 'Executive Telemetry & Pass Rate', dest: '#summary' },
        { num: '02', title: 'Adversarial Red-Team Evidence Cards', dest: '#evidence' },
        { num: '03', title: 'Workstream B: PII Guardrail Verification', dest: '#pii' },
        { num: '04', title: 'Workstream C: NIST AI RMF & EU AI Act Matrix', dest: '#compliance' },
      ];

      tocItems.forEach((item) => {
        needSpace(8);
        doc.setFillColor(C.cyan[0], C.cyan[1], C.cyan[2]);
        doc.roundedRect(MARGIN, y, 20, 7, 2, 2, 'F');
        doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(item.num, MARGIN, y + 1.5, { maxWidth: 20, align: 'center' });

        doc.setFillColor(C.textDark[0], C.textDark[1], C.textDark[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.textWithLink(item.title, MARGIN + 24, y + 1.5, item.dest);

        y += 7;
      });

      y += 8;

      /* ───── PAGE BREAK → EVIDENCE LOG ───── */
      needSpace(30);
      drawFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      y = MARGIN;

      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.textWithLink('[01] EXECUTIVE TELEMETRY & PASS RATE', MARGIN, y, '#summary');
      y += 8;
      doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, MARGIN + 110, y);
      y += 12;

      // Risk score box
      const riskScore = Math.round(parseFloat(passRate));
      const riskColor = riskScore >= 80 ? C.emerald : riskScore >= 60 ? C.amber : C.crimson;
      const riskLabel = riskScore >= 80 ? 'LOW RISK' : riskScore >= 60 ? 'MODERATE RISK' : 'HIGH RISK';

      doc.setFillColor(C.kpiFill[0], C.kpiFill[1], C.kpiFill[2]);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 20, 2, 2, 'F');
      doc.setDrawColor(C.kpiBorder[0], C.kpiBorder[1], C.kpiBorder[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 20, 2, 2, 'S');

      doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(riskScore.toString(), MARGIN + 8, y + 3);

      doc.setFillColor(C.textDark[0], C.textDark[1], C.textDark[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(riskLabel, MARGIN + 30, y + 4);

      doc.setFillColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
      doc.setFontSize(7);
      doc.text(
        `Safety boundary effectiveness based on ${run.passedTests}/${run.totalTests} red-teaming probes passed. ${run.failedTests} finding(s) require immediate remediation before deployment.`,
        MARGIN + 30,
        y + 10,
        { maxWidth: CONTENT_WIDTH - 30 - 10 }
      );

      y += 24;

      // Model info
      doc.setFillColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('EVALUATION CONFIGURATION', MARGIN, y);
      y += 5;
      const configRows = [
        ['Target Model', run.model || 'llama-3.1-8b-instant'],
        ['Provider', 'Groq Cloud (api.groq.com)'],
        ['Test Framework', 'Promptfoo'],
        ['Test Categories', '5 / Workstreams A-E'],
        ['Mode', run.mode === 'live' ? 'LIVE' : 'SANDBOX'],
        ['Run ID', run.runId],
      ];
      configRows.forEach(([label, value]) => {
        doc.setFillColor(C.textDark[0], C.textDark[1], C.textDark[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(label, MARGIN, y, { maxWidth: 35 });
        doc.setFillColor(C.muted[0], C.muted[1], C.muted[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(value, MARGIN + 38, y, { maxWidth: CONTENT_WIDTH - 38 });
        y += 5;
      });

      /* ───── EVIDENCE CARDS ───── */
      y += 8;
      needSpace(30);
      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.textWithLink('[02] ADVERSARIAL RED-TEAM EVIDENCE CARDS', MARGIN, y, '#evidence');
      y += 6;
      doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, MARGIN + 100, y);
      y += 10;

      run.results.forEach((r) => {
        const promptLines = doc.splitTextToSize(r.prompt, CONTENT_WIDTH - 30, { fontSize: 7 });
        const outputLines = doc.splitTextToSize(r.output || '(no output)', CONTENT_WIDTH - 30, { fontSize: 7 });
        const cardHneeded = 10 + promptLines.length * 4 + outputLines.length * 4 + 14;

        needSpace(cardHneeded + 5);

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
        doc.setFillColor(C.slate[0], C.slate[1], C.slate[2]);
        doc.roundedRect(MARGIN + 2, py, CONTENT_WIDTH - 4, promptLines.length * 4 + 4, 1.5, 1.5, 'F');
        doc.setFillColor(C.muted[0], C.muted[1], C.muted[2]);
        doc.setFontSize(6);
        doc.text('ADVERSARIAL PROMPT', MARGIN + 6, py + 1.5);
        doc.setFillColor(C.textDark[0], C.textDark[1], C.textDark[2]);
        doc.setFontSize(7);
        doc.text(promptLines, MARGIN + 6, py + 5);

        py += promptLines.length * 4 + 6;

        // Response box
        const respBg = r.passed ? C.emeraldTint : C.roseTint;
        doc.setFillColor(respBg[0], respBg[1], respBg[2]);
        doc.roundedRect(MARGIN + 2, py, CONTENT_WIDTH - 4, outputLines.length * 4 + 4, 1.5, 1.5, 'F');
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

        y = py + outputLines.length * 4 + 10;
      });

      y += 8;

      /* ───── COMPLIANCE MATRIX ───── */
      needSpace(30);
      doc.setFillColor(C.navy[0], C.navy[1], C.navy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.textWithLink('[04] WORKSTREAM C: NIST AI RMF & EU AI ACT MATRIX', MARGIN, y, '#compliance');
      y += 6;
      doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2]);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y, MARGIN + 140, y);
      y += 10;

      // Intro text
      doc.setFillColor(C.textMuted[0], C.textMuted[1], C.textMuted[2]);
      doc.setFontSize(7);
      doc.text(
        'This matrix maps red-teaming findings to NIST AI RMF functions (GOVERN · MAP · MEASURE · MANAGE) ' +
        'and EU AI Act obligations (Art. 9 Risk Management, Art. 10 Data & PII Governance, Art. 14 Human Oversight, Art. 15 Accuracy, Robustness & Cybersecurity).',
        MARGIN, y, { maxWidth: CONTENT_WIDTH }
      );
      y += 10;

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

      const matrix = [
        ['GOVERN 1.1 — Accountability', 'RT-038', 'IN PROGRESS', 'HIGH', 'Remediate critical findings within 14 days'],
        ['MAP 2.3 — Context Mapping', 'MAP-014', 'PASSED', 'MEDIUM', 'All attack vectors covered'],
        ['MEASURE 2.6 — Metrics', 'MES-021', 'PASSED', 'MEDIUM', 'Pass/fail rates logged'],
        ['MANAGE 4.1 — Response', 'MAN-009', 'REVIEW', 'HIGH', 'Human review before production release'],
        ['EU AI Act — Art. 9 Risk Mgmt', 'EU-9-A', 'IN PROGRESS', 'HIGH', 'Risk system must document adversarial findings'],
        ['EU AI Act — Art. 10 Data Gov.', 'EU-10-A', 'PASSED', 'MEDIUM', 'No PII leakage detected'],
        ['EU AI Act — Art. 14 Oversight', 'EU-14-B', 'REVIEW', 'HIGH', 'Human-in-the-loop for medical queries'],
        ['EU AI Act — Art. 15 Robustness', 'EU-15-C', 'PASSED', 'LOW', 'Jailbreak & toxic prompts refused'],
      ];

      matrix.forEach((row) => {
        if (y + 6 > PAGE_HEIGHT - BOTTOM_MARGIN) {
          drawFooter(doc, pageNum);
          doc.addPage();
          pageNum++;
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

      /* ───── Footer ── */
      needSpace(15);
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
      doc.textWithLink('aisafetycompliance.netlify.app', MARGIN, y + 4, 'https://aisafetycompliance.netlify.app');

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
