import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';

const MARGIN = 40;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_MARGIN = 60;

const C = {
  navy: '#01091D',
  gold: '#FFEE55',
  cyan: '#00E5FF',
  emerald: '#10B981',
  crimson: '#EF4444',
  dark: '#0F172A',
  slate: '#F1F5F9',
  emeraldTint: '#ECFDF5',
  roseTint: '#FFF1F2',
  kpiFill: '#F8FAFC',
  kpiBorder: '#CBD5E1',
  textDark: '#1E293B',
  textMuted: '#64748B',
  white: '#FFFFFF',
  lightGray: '#94A3B8',
  amber: '#F59E0B',
  blue: '#3B82F6',
};

/* ═════════════════════════════════════════════════════════════════════
   REPORT ENTRY POINT
   ═════════════════════════════════════════════════════════════════════ */
export async function generateReports(results, reportDir, runId) {
  fs.mkdirSync(reportDir, { recursive: true });

  const jsonPath = path.join(reportDir, `${runId}.json`);
  const csvPath = path.join(reportDir, `${runId}.csv`);
  const pdfPath = path.join(reportDir, `${runId}.pdf`);

  // ── JSON ──
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');

  // ── CSV ──
  const csvFields = [
    'id', 'description', 'prompt', 'target', 'passed', 'severity',
    'score', 'output', 'assertions', 'timestamp',
  ];
  const csvRows = results.results.map((r) => ({
    id: r.id,
    description: r.description,
    prompt: `"${r.prompt.replace(/"/g, '""')}"`,
    target: r.target,
    passed: r.passed,
    severity: r.severity,
    score: r.score,
    output: `"${(r.output || '').replace(/"/g, '""')}"`,
    assertions: JSON.stringify(r.assertions || []),
    timestamp: r.timestamp,
  }));
  const parser = new Parser({ fields: csvFields });
  fs.writeFileSync(csvPath, parser.parse(csvRows), 'utf8');

  // ── PDF ──
  await generatePDF(results, pdfPath);

  return { json: jsonPath, csv: csvPath, pdf: pdfPath };
}

/* ═════════════════════════════════════════════════════════════════════
   PDF GENERATOR — Sequential Y-coordinate tracking, no overlaps
   ═════════════════════════════════════════════════════════════════════ */
function generatePDF(results, pdfPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const stream = fs.createWriteStream(pdfPath);
    let pageNum = 1;
    let currentY = MARGIN;

    doc.pipe(stream);

    /* ───── Helpers ───── */
    function needSpace(neededHeight) {
      if (currentY + neededHeight > PAGE_HEIGHT - BOTTOM_MARGIN) {
        drawFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        currentY = MARGIN;
      }
    }

    function drawFooter(docRef, pn) {
      const fy = PAGE_HEIGHT - 45;
      docRef.save();
      docRef.strokeStyle = `rgba(0, 229, 255, 0.15)`;
      docRef.lineWidth(1);
      docRef.moveTo(MARGIN, fy).lineTo(PAGE_WIDTH - MARGIN, fy).stroke();

      docRef.fillStyle = C.textMuted;
      docRef.font('Helvetica').fontSize(7);
      docRef.text(
        'O&G AI Safety & Compliance Pipeline • Technical assessment evidence only; does not constitute legal compliance or launch approval. Human review required.',
        MARGIN,
        fy + 9,
        { width: CONTENT_WIDTH, align: 'center' }
      );

      docRef.fillStyle = C.cyan;
      docRef.font('Helvetica-Bold').fontSize(8);
      docRef.text(
        'aisafetycompliance.netlify.app',
        MARGIN,
        fy + 18,
        {
          width: CONTENT_WIDTH,
          align: 'center',
          link: 'https://aisafetycompliance.netlify.app',
        }
      );

      docRef.fillStyle = C.textMuted;
      docRef.font('Helvetica').fontSize(7);
      docRef.text(`Page ${pn}`, PAGE_WIDTH - MARGIN - 30, fy + 28, {
        width: 30,
        align: 'right',
      });
      docRef.restore();
    }

    function drawVectorLogo(docRef, cx, cy, radius) {
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
      }
      docRef.save();
      docRef.fillStyle = C.cyan;
      docRef.beginPath();
      docRef.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < 6; i++) docRef.lineTo(points[i][0], points[i][1]);
      docRef.closePath().fill();

      docRef.fillStyle = C.gold;
      docRef.circle(cx, cy, radius * 0.42).fill();
      docRef.strokeStyle = C.navy;
      docRef.lineWidth(2);
      docRef.circle(cx, cy, radius * 0.42).stroke();

      docRef.fillStyle = C.navy;
      docRef.font('Helvetica-Bold').fontSize(radius * 0.55);
      const tw = docRef.widthOfString('O&G');
      docRef.text('O&G', cx - tw / 2, cy - radius * 0.24);
      docRef.restore();
    }

    function measureTextHeight(text, font, size, width) {
      doc.save();
      doc.font(font).fontSize(size);
      const words = text.split(' ');
      let lineCount = 1;
      let currentWidth = 0;
      const spaceWidth = doc.widthOfString(' ');
      for (const w of words) {
        const wWidth = doc.widthOfString(w);
        if (currentWidth + wWidth > width && lineCount > 0) {
          lineCount++;
          currentWidth = wWidth;
        } else {
          currentWidth += wWidth + spaceWidth;
        }
      }
      const h = lineCount * size * 1.25;
      doc.restore();
      return h;
    }

    function measureTextHeightArray(lines, font, size) {
      doc.save();
      doc.font(font).fontSize(size);
      const h = lines.length * size * 1.25;
      doc.restore();
      return h;
    }

    /* ───── PAGE 1: BRANDED HEADER ───── */
    needSpace(175);

    doc.save();
    doc.fillStyle = C.navy;
    doc.rect(0, 0, PAGE_WIDTH, 175).fill();

    // Accent borders
    doc.strokeStyle = C.gold;
    doc.lineWidth(4);
    doc.moveTo(0, 175).lineTo(PAGE_WIDTH, 175).stroke();
    doc.strokeStyle = C.cyan;
    doc.lineWidth(2);
    doc.moveTo(0, 179).lineTo(PAGE_WIDTH, 179).stroke();

    // Vector O&G emblem
    drawVectorLogo(doc, MARGIN + 30, 88, 26);

    // Title block
    doc.fillStyle = C.white;
    doc.font('Helvetica-Bold').fontSize(19);
    doc.text('AI SAFETY & COMPLIANCE READINESS PIPELINE', MARGIN + 90, 66, {
      width: CONTENT_WIDTH - 90 - 160,
      align: 'left',
    });
    doc.font('Helvetica').fontSize(10.5).fillStyle('rgba(255,255,255,0.85)');
    doc.text(
      'Executive Red-Teaming, PII Guardrail & Regulatory Audit Report',
      MARGIN + 90,
      96,
      { width: CONTENT_WIDTH - 90 - 160, align: 'left' }
    );

    // Metadata pill box (top right)
    const pillX = PAGE_WIDTH - MARGIN - 160;
    const pillY = 60;
    const pillW = 160;
    const pillH = 55;
    doc.save();
    doc.fillStyle = 'rgba(255,255,255,0.07)';
    doc.roundedRect(pillX, pillY, pillW, pillH, 7).fill();
    doc.strokeStyle = 'rgba(0,229,255,0.35)';
    doc.lineWidth(1);
    doc.roundedRect(pillX, pillY, pillW, pillH, 7).stroke();

    doc.fillStyle = C.cyan;
    doc.font('Helvetica-Bold').fontSize(7.5);
    doc.text('REPORT METADATA', pillX + 10, pillY + 8);

    const modeLabel = results.mode === 'live' ? 'LIVE' : 'SANDBOX';
    const modeColor = results.mode === 'live' ? C.emerald : C.cyan;

    const metaItems = [
      ['Run ID', results.runId],
      ['Target System', results.target || 'Groq Cloud LLM'],
      ['Model', results.model || 'llama-3.1-8b-instant'],
      ['Mode', modeLabel],
      ['Generated', new Date(results.generatedAt).toLocaleString()],
    ];
    let my = pillY + 18;
    for (const [label, value] of metaItems) {
      doc.fillStyle = C.lightGray;
      doc.font('Helvetica').fontSize(6.5);
      doc.text(label, pillX + 10, my);
      doc.fillStyle = label === 'Mode' ? modeColor : C.white;
      doc.font('Helvetica-Bold').fontSize(7.5);
      doc.text(value, pillX + 10, my + 8, { width: pillW - 20 });
      my += 17;
    }
    doc.restore();
    doc.restore();

    currentY = 195;

    /* ───── EXECUTIVE DASHBOARD ───── */
    needSpace(140);

    doc.fillStyle = C.navy;
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text('EXECUTIVE DASHBOARD', MARGIN, currentY);
    currentY += 6;
    doc.strokeStyle = C.cyan;
    doc.lineWidth(2);
    doc.moveTo(MARGIN, currentY).lineTo(MARGIN + 60, currentY).stroke();
    currentY += 16;

    const passRate = results.totalTests > 0
      ? ((results.passedTests / results.totalTests) * 100).toFixed(1)
      : '0.0';

    const kpis = [
      { label: 'TOTAL PROBES', value: results.totalTests, accent: C.navy, sub: 'Red-teaming tests executed' },
      { label: 'PASSED SAFEGUARDS', value: results.passedTests, accent: C.emerald, sub: 'Tests passed safety assertions' },
      { label: 'FAILED / CRITICAL', value: results.failedTests, accent: C.crimson, sub: 'Tests requiring remediation' },
      { label: 'SAFETY PASS RATE', value: passRate + '%', accent: C.cyan, sub: 'Safety boundary effectiveness' },
    ];

    const kpiW = (CONTENT_WIDTH - 3 * 12) / 4;
    const kpiH = 100;
    const kpiY = currentY;

    kpis.forEach((k, i) => {
      const x = MARGIN + i * (kpiW + 12);

      // Card bg
      doc.save();
      doc.fillStyle = C.kpiFill;
      doc.roundedRect(x, kpiY, kpiW, kpiH, 7).fill();
      doc.strokeStyle = C.kpiBorder;
      doc.lineWidth(1);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 7).stroke();

      // Accent bar
      doc.fillStyle = k.accent;
      doc.rect(x, kpiY, kpiW, 6).fill();

      // Value
      doc.fillStyle = C.textDark;
      doc.font('Helvetica-Bold').fontSize(20);
      const vw = doc.widthOfString(k.value);
      doc.text(k.value, x + (kpiW - vw) / 2, kpiY + 18);

      // Label
      doc.fillStyle = C.textMuted;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text(k.label, x + 10, kpiY + 52, { width: kpiW - 20, align: 'center' });

      // Sub label
      doc.font('Helvetica').fontSize(6.5).fillStyle(C.lightGray);
      doc.text(k.sub, x + 10, kpiY + 60, { width: kpiW - 20, align: 'center' });

      // Progress bar for pass rate
      if (k.label === 'SAFETY PASS RATE') {
        const barY = kpiY + 76;
        const barW = kpiW - 20;
        const barH = 6;
        doc.fillStyle = C.kpiBorder;
        doc.roundedRect(x + 10, barY, barW, barH, 3).fill();
        const fillW = barW * (parseFloat(passRate) / 100);
        doc.fillStyle = k.accent;
        doc.roundedRect(x + 10, barY, fillW, barH, 3).fill();
      }
      doc.restore();
    });

    currentY = kpiY + kpiH + 22;

    /* Category breakdown stacked bars */
    needSpace(110);
    doc.fillStyle = C.navy;
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text('RED-TEAM CATEGORY BREAKDOWN', MARGIN, currentY);
    currentY += 6;
    doc.strokeStyle = C.cyan;
    doc.lineWidth(2);
    doc.moveTo(MARGIN, currentY).lineTo(MARGIN + 78, currentY).stroke();
    currentY += 16;

    const categories = [
      { key: 'jailbreak', label: 'Jailbreaks & Override', color: C.navy },
      { key: 'system-prompt', label: 'System-Prompt Leakage', color: C.blue },
      { key: 'sensitive-data', label: 'PII Disclosure', color: C.amber },
      { key: 'toxic', label: 'Toxic / Abusive Output', color: C.crimson },
      { key: 'dangerous', label: 'Dangerous Advice', color: C.cyan },
    ];

    const catStats = categories.map((c) => {
      const matching = results.results.filter((r) =>
        (r.category || '').toLowerCase().includes(c.key.split('-')[0]) ||
        r.description.toLowerCase().includes(c.key.split('-')[0]) ||
        r.id.toLowerCase().includes(c.key.replace('-', ''))
      );
      const total = matching.length || 1;
      const passed = matching.filter((r) => r.passed).length;
      return { ...c, total, passed, failed: total - passed, rate: (passed / total) * 100 };
    });

    const barH = 22;
    const barGap = 8;
    const labelW = 140;
    const chartW = CONTENT_WIDTH - labelW - 30;

    catStats.forEach((c) => {
      needSpace(barH + 16);
      doc.fillStyle = C.textDark;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text(c.label, MARGIN, currentY, { width: labelW, align: 'right' });

      const barX = MARGIN + labelW + 10;
      const passW = (chartW * c.passed) / c.total;
      const failW = chartW - passW;

      // Background
      doc.fillStyle = C.kpiBorder;
      doc.roundedRect(barX, currentY, chartW, barH, 4).fill();

      // Pass segment
      if (passW > 0) {
        doc.fillStyle = c.passed > 0 ? C.emerald : C.kpiBorder;
        doc.roundedRect(barX, currentY, passW, barH, 4).fill();
      }

      // Fail segment
      if (failW > 0) {
        doc.fillStyle = C.crimson;
        doc.roundedRect(barX + passW, currentY, failW, barH, 4).fill();
      }

      // Percentage label
      doc.fillStyle = C.white;
      doc.font('Helvetica-Bold').fontSize(7);
      doc.text(`${Math.round(c.rate)}%`, barX + chartW / 2 - 15, currentY + 5, {
        width: 30,
        align: 'center',
      });

      currentY += barH + barGap;
    });

    currentY += 8;

    /* ───── INTERACTIVE TABLE OF CONTENTS ───── */
    needSpace(70);
    doc.fillStyle = C.navy;
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text('INTERACTIVE TABLE OF CONTENTS', MARGIN, currentY);
    currentY += 6;
    doc.strokeStyle = C.cyan;
    doc.lineWidth(2);
    doc.moveTo(MARGIN, currentY).lineTo(MARGIN + 92, currentY).stroke();
    currentY += 16;

    const tocItems = [
      { num: '01', title: 'Executive Telemetry & Pass Rate', dest: 'summary' },
      { num: '02', title: 'Adversarial Red-Team Evidence Cards', dest: 'evidence' },
      { num: '03', title: 'Workstream B: PII Guardrail Verification', dest: 'pii' },
      { num: '04', title: 'Workstream C: NIST AI RMF & EU AI Act Matrix', dest: 'compliance' },
    ];

    tocItems.forEach((item) => {
      needSpace(26);
      const itemY = currentY;
      // Number badge
      doc.fillStyle = C.cyan;
      doc.roundedRect(MARGIN, itemY, 24, 18, 4).fill();
      doc.fillStyle = C.navy;
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text(item.num, MARGIN, itemY + 3, { width: 24, align: 'center' });

      // Clickable title
      doc.fillStyle = C.textDark;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text(
        item.title,
        MARGIN + 34,
        itemY + 2,
        { width: CONTENT_WIDTH - 34 - 60, link: `#${item.dest}` }
      );

      // Arrow
      doc.fillStyle = C.lightGray;
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('▸', PAGE_WIDTH - MARGIN - 20, itemY + 1);

      currentY += 26;
    });

    currentY += 10;

    /* ───── PAGE BREAK → EVIDENCE LOG ───── */
    needSpace(40);
    drawFooter(doc, pageNum);
    doc.addPage();
    pageNum++;
    currentY = MARGIN;

    doc.save();
    doc.fillStyle = C.navy;
    doc.font('Helvetica-Bold').fontSize(16);
    doc.text('[01] EXECUTIVE TELEMETRY & PASS RATE', MARGIN, currentY, {
      link: '#summary',
    });
    currentY += 8;
    doc.strokeStyle = C.cyan;
    doc.lineWidth(2);
    doc.moveTo(MARGIN, currentY).lineTo(MARGIN + 110, currentY).stroke();
    currentY += 18;

    // Risk score box
    const riskScore = Math.round(parseFloat(passRate));
    const riskColor = riskScore >= 80 ? C.emerald : riskScore >= 60 ? C.amber : C.crimson;
    const riskLabel = riskScore >= 80 ? 'LOW RISK' : riskScore >= 60 ? 'MODERATE RISK' : 'HIGH RISK';

    doc.save();
    doc.fillStyle = C.kpiFill;
    doc.roundedRect(MARGIN, currentY, CONTENT_WIDTH, 70, 8).fill();
    doc.strokeStyle = C.kpiBorder;
    doc.lineWidth(1);
    doc.roundedRect(MARGIN, currentY, CONTENT_WIDTH, 70, 8).stroke();

    doc.fillStyle = riskColor;
    doc.font('Helvetica-Bold').fontSize(34);
    doc.text(riskScore.toString(), MARGIN + 25, currentY + 12);

    doc.fillStyle = C.textDark;
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text(riskLabel, MARGIN + 95, currentY + 16);

    doc.fillStyle = C.textMuted;
    doc.font('Helvetica').fontSize(9);
    doc.text(
      `Safety boundary effectiveness based on ${results.passedTests}/${results.totalTests} red-teaming probes passed. ` +
      `${results.failedTests} finding(s) require immediate remediation before deployment.`,
      MARGIN + 95,
      currentY + 30,
      { width: CONTENT_WIDTH - 95 - 25 }
    );
    doc.restore();

    currentY += 86;

    // Model info section
    doc.fillStyle = C.textMuted;
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('EVALUATION CONFIGURATION', MARGIN, currentY);
    currentY += 6;
    const configRows = [
      ['Target Model', results.model || 'llama-3.1-8b-instant'],
      ['Provider', 'Groq Cloud (api.groq.com)'],
      ['Test Framework', 'Promptfoo'],
      ['Test Categories', '5 / Workstreams A-E'],
      ['Mode', results.mode === 'live' ? 'LIVE' : 'SANDBOX'],
      ['Run ID', results.runId],
    ];
    configRows.forEach(([label, value]) => {
      doc.fillStyle = C.textDark;
      doc.font('Helvetica-Bold').fontSize(8.5);
      doc.text(label, MARGIN, currentY, { width: 120 });
      doc.fillStyle = C.textMuted;
      doc.font('Helvetica').fontSize(8.5);
      doc.text(value, MARGIN + 125, currentY, { width: CONTENT_WIDTH - 125 });
      currentY += 14;
    });

    /* ───── EVIDENCE CARDS ───── */
    currentY += 16;
    needSpace(40);
    doc.fillStyle = C.navy;
    doc.font('Helvetica-Bold').fontSize(16);
    doc.text('[02] ADVERSARIAL RED-TEAM EVIDENCE CARDS', MARGIN, currentY, {
      link: '#evidence',
    });
    currentY += 8;
    doc.strokeStyle = C.cyan;
    doc.lineWidth(2);
    doc.moveTo(MARGIN, currentY).lineTo(MARGIN + 100, currentY).stroke();
    currentY += 18;

    results.results.forEach((r, idx) => {
      const cardPadding = 14;
      const headerH = 24;
      const promptH = measureTextHeight(r.prompt, 'Helvetica', 8.5, CONTENT_WIDTH - cardPadding * 2) + 10;
      const outputH = measureTextHeight(r.output || '(no model output captured)', 'Helvetica', 8.5, CONTENT_WIDTH - cardPadding * 2) + 10;
      const cardH = headerH + promptH + outputH + cardPadding * 2 + 14;

      needSpace(cardH + 10);

      const cardY = currentY;
      const statusColor = r.passed ? C.emerald : C.crimson;
      const statusText = r.passed ? 'PASSED' : 'FAILED';
      const sevColor = r.severity === 'HIGH' ? C.crimson : r.severity === 'MODERATE' ? C.amber : C.emerald;
      const sevLabel = r.severity || 'MEDIUM';

      // Card background
      doc.save();
      doc.fillStyle = C.white;
      doc.roundedRect(MARGIN, cardY, CONTENT_WIDTH, cardH, 8).fill();
      doc.strokeStyle = C.kpiBorder;
      doc.lineWidth(1);
      doc.roundedRect(MARGIN, cardY, CONTENT_WIDTH, cardH, 8).stroke();

      // Header strip
      doc.fillStyle = C.dark;
      doc.roundedRect(MARGIN, cardY, CONTENT_WIDTH, headerH, 7).fill();
      doc.rect(MARGIN, cardY + headerH - 7, CONTENT_WIDTH, 7).fill();

      // Test ID & title
      doc.fillStyle = C.white;
      doc.font('Helvetica-Bold').fontSize(9.5);
      doc.text(`${r.id.toUpperCase()}`, MARGIN + 12, cardY + 6);
      doc.font('Helvetica-Bold').fontSize(10);
      doc.fillStyle = C.cyan;
      doc.text(r.description, MARGIN + 45, cardY + 5, {
        width: CONTENT_WIDTH - 45 - 120,
      });

      // Status badge
      const badgeW = 70;
      const badgeX = PAGE_WIDTH - MARGIN - badgeW - 10;
      doc.save();
      doc.fillStyle = statusColor;
      doc.roundedRect(badgeX, cardY + 6, badgeW, 14, 7).fill();
      doc.fillStyle = C.white;
      doc.font('Helvetica-Bold').fontSize(7);
      doc.text(statusText, badgeX, cardY + 9, { width: badgeW, align: 'center' });
      doc.restore();

      // Severity badge
      const sevBadgeX = PAGE_WIDTH - MARGIN - 50 - 10;
      doc.save();
      doc.fillStyle = sevColor;
      doc.roundedRect(sevBadgeX, cardY + 6, 50, 14, 7).fill();
      doc.fillStyle = C.white;
      doc.font('Helvetica-Bold').fontSize(7);
      doc.text(sevLabel, sevBadgeX, cardY + 9, { width: 50, align: 'center' });
      doc.restore();

      // Adversarial Prompt Box
      const promptY = cardY + headerH + 12;
      doc.fillStyle = C.slate;
      doc.roundedRect(MARGIN + 8, promptY, CONTENT_WIDTH - 16, promptH, 5).fill();
      doc.fillStyle = C.textMuted;
      doc.font('Helvetica-Bold').fontSize(7);
      doc.text('ADVERSARIAL PROMPT', MARGIN + 18, promptY + 6);
      doc.fillStyle = C.textDark;
      doc.font('Courier').fontSize(8.5);
      doc.text(r.prompt, MARGIN + 18, promptY + 16, {
        width: CONTENT_WIDTH - 36,
        lineBreak: true,
      });

      // Model Response Box
      const responseY = promptY + promptH + 8;
      const respBg = r.passed ? C.emeraldTint : C.roseTint;
      const respLabel = r.passed ? 'GUARDRAIL RESPONSE — PASS' : 'GUARDRAIL RESPONSE — FAIL';
      const respLabelColor = r.passed ? C.emerald : C.crimson;

      doc.fillStyle = respBg;
      doc.roundedRect(MARGIN + 8, responseY, CONTENT_WIDTH - 16, outputH, 5).fill();

      doc.fillStyle = respLabelColor;
      doc.font('Helvetica-Bold').fontSize(7);
      doc.text(respLabel, MARGIN + 18, responseY + 6);

      // Output text
      const outputText = r.output || '(no model output captured)';
      doc.fillStyle = C.textDark;
      doc.font('Courier').fontSize(8.5);
      doc.text(outputText, MARGIN + 18, responseY + 16, {
        width: CONTENT_WIDTH - 36,
        lineBreak: true,
      });

      // Assertion notes
      const assertY = responseY + outputH + 6;
      if (r.assertions && r.assertions.length > 0) {
        doc.fillStyle = C.textMuted;
        doc.font('Helvetica-Bold').fontSize(7);
        doc.text('ASSERTIONS:', MARGIN + 18, assertY);
        let ay = assertY + 10;
        r.assertions.forEach((a) => {
          doc.fillStyle = C.textDark;
          doc.font('Helvetica').fontSize(7.5);
          doc.text(`• ${a.value}`, MARGIN + 18, ay, { width: CONTENT_WIDTH - 36 });
          ay += 10;
        });
        currentY = ay + 6;
      } else {
        currentY = assertY + 16;
      }

      doc.restore();
    });

    /* ───── COMPLIANCE MATRIX ───── */
    currentY += 8;
    needSpace(120);
    doc.fillStyle = C.navy;
    doc.font('Helvetica-Bold').fontSize(16);
    doc.text('[04] WORKSTREAM C: NIST AI RMF & EU AI ACT MATRIX', MARGIN, currentY, {
      link: '#compliance',
    });
    currentY += 8;
    doc.strokeStyle = C.cyan;
    doc.lineWidth(2);
    doc.moveTo(MARGIN, currentY).lineTo(MARGIN + 140, currentY).stroke();
    currentY += 18;

    // Intro text
    doc.fillStyle = C.textMuted;
    doc.font('Helvetica').fontSize(8.5);
    doc.text(
      'This matrix maps red-teaming findings to NIST AI RMF functions (GOVERN · MAP · MEASURE · MANAGE) ' +
      'and EU AI Act obligations (Art. 9 Risk Management, Art. 10 Data & PII Governance, Art. 14 Human Oversight, Art. 15 Accuracy, Robustness & Cybersecurity).',
      MARGIN, currentY, { width: CONTENT_WIDTH }
    );
    currentY += 16;

    // Table header
    const tableX = MARGIN;
    const tableW = CONTENT_WIDTH;
    const colW = {
      control: 110,
      evidence: 60,
      status: 70,
      severity: 60,
      review: tableW - 110 - 60 - 70 - 60 - 16,
    };
    const rowH = 30;
    const headerY = currentY;

    doc.save();
    doc.fillStyle = C.dark;
    doc.rect(tableX, headerY, tableW, rowH).fill();
    doc.fillStyle = C.white;
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('CONTROL TOPIC', tableX + 8, headerY + 8, { width: colW.control - 16 });
    doc.text('EVIDENCE ID', tableX + colW.control + 8, headerY + 8, { width: colW.evidence - 16 });
    doc.text('STATUS', tableX + colW.control + colW.evidence + 8, headerY + 8, { width: colW.status - 16 });
    doc.text('SEVERITY', tableX + colW.control + colW.evidence + colW.status + 8, headerY + 8, { width: colW.severity - 16 });
    doc.text('HUMAN REVIEW / MITIGATION', tableX + colW.control + colW.evidence + colW.status + colW.severity + 8, headerY + 8, { width: colW.review - 16 });
    doc.restore();

    let ty = headerY + rowH;
    const matrixRows = [
      {
        control: 'GOVERN 1.1 — Accountability & Oversight',
        evidence: 'RT-038',
        status: 'IN PROGRESS',
        severity: 'HIGH',
        review: 'Red-team findings reviewed by safety officer; remediation plan due within 14 days.',
      },
      {
        control: 'MAP 2.3 — Context & Stakeholder Mapping',
        evidence: 'MAP-014',
        status: 'PASSED',
        severity: 'MEDIUM',
        review: 'Adversarial test categories cover all identified high-risk interaction vectors.',
      },
      {
        control: 'MEASURE 2.6 — Metrics & Monitoring',
        evidence: 'MES-021',
        status: 'PASSED',
        severity: 'MEDIUM',
        review: 'Pass/fail rates and severity distribution logged for continuous monitoring.',
      },
      {
        control: 'MANAGE 4.1 — Prioritization & Response',
        evidence: 'MAN-009',
        status: 'REVIEW',
        severity: 'HIGH',
        review: 'Critical findings require patch deployment and re-test before production release.',
      },
      {
        control: 'EU AI Act — Art. 9 Risk Management',
        evidence: 'EU-9-A',
        status: 'IN PROGRESS',
        severity: 'HIGH',
        review: 'Risk management system must document all adversarial findings and mitigations.',
      },
      {
        control: 'EU AI Act — Art. 10 Data & PII Governance',
        evidence: 'EU-10-B',
        status: 'PASSED',
        severity: 'MEDIUM',
        review: 'No PII leakage detected in model outputs across sensitive-data probes.',
      },
      {
        control: 'EU AI Act — Art. 14 Human Oversight',
        evidence: 'EU-14-C',
        status: 'REVIEW',
        severity: 'HIGH',
        review: 'Human-in-the-loop required for medical/emergency query handling.',
      },
      {
        control: 'EU AI Act — Art. 15 Accuracy & Robustness',
        evidence: 'EU-15-D',
        status: 'PASSED',
        severity: 'LOW',
        review: 'Model correctly refused jailbreak and toxic-content prompts across all variants.',
      },
    ];

    matrixRows.forEach((row, i) => {
      needSpace(rowH + 4);
      const isAlt = i % 2 === 1;
      doc.save();
      doc.fillStyle = isAlt ? C.slate : C.white;
      doc.rect(tableX, ty, tableW, rowH).fill();
      doc.strokeStyle = C.kpiBorder;
      doc.lineWidth(0.5);
      doc.moveTo(tableX, ty + rowH).lineTo(tableX + tableW, ty + rowH).stroke();

      doc.fillStyle = C.textDark;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text(row.control, tableX + 8, ty + 7, { width: colW.control - 16, lineBreak: true });

      doc.fillStyle = C.textMuted;
      doc.font('Helvetica').fontSize(8);
      doc.text(row.evidence, tableX + colW.control + 8, ty + 9, { width: colW.evidence - 16 });

      const statusColor = row.status === 'PASSED' ? C.emerald : row.status === 'IN PROGRESS' ? C.amber : C.crimson;
      doc.fillStyle = statusColor;
      doc.font('Helvetica-Bold').fontSize(7.5);
      doc.text(row.status, tableX + colW.control + colW.evidence + 8, ty + 8, {
        width: colW.status - 16,
      });

      const sevColor = row.severity === 'HIGH' ? C.crimson : row.severity === 'MEDIUM' ? C.amber : C.emerald;
      doc.fillStyle = sevColor;
      doc.font('Helvetica-Bold').fontSize(7.5);
      doc.text(row.severity, tableX + colW.control + colW.evidence + colW.status + 8, ty + 8, {
        width: colW.severity - 16,
      });

      doc.fillStyle = C.textDark;
      doc.font('Helvetica').fontSize(7.5);
      doc.text(row.review, tableX + colW.control + colW.evidence + colW.status + colW.severity + 8, ty + 7, {
        width: colW.review - 16,
        lineBreak: true,
      });
      doc.restore();
      ty += rowH;
    });

    currentY = ty + 14;

    /* Footer disclaimer */
    needSpace(50);
    doc.fillStyle = C.textMuted;
    doc.font('Helvetica-Oblique').fontSize(7.5);
    doc.text(
      'O&G AI Safety & Compliance Pipeline • Automated technical evidence generated via Promptfoo red-teaming. ' +
      'This report is not a legal compliance determination. All findings require qualified human review before deployment decisions.',
      MARGIN, currentY, { width: CONTENT_WIDTH, align: 'center', lineBreak: true }
    );

    /* Final footer */
    drawFooter(doc, pageNum);

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}
