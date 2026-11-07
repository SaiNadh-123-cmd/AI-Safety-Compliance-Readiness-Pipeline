import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Writable } from 'stream';
import { Parser } from 'json2csv';

/**
 * Generate JSON, PDF, and CSV report files for a completed evaluation run.
 * Returns file paths keyed by format.
 */
export async function generateReports(results, reportDir, runId) {
  fs.mkdirSync(reportDir, { recursive: true });

  const jsonPath = path.join(reportDir, `${runId}.json`);
  const csvPath = path.join(reportDir, `${runId}.csv`);
  const pdfPath = path.join(reportDir, `${runId}.pdf`);

  // ── JSON ──
  const jsonContent = JSON.stringify(results, null, 2);
  fs.writeFileSync(jsonPath, jsonContent, 'utf8');

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
  const csvContent = parser.parse(csvRows);
  fs.writeFileSync(csvPath, csvContent, 'utf8');

  // ── PDF ──
  await generatePDF(results, pdfPath);

  return {
    json: jsonPath,
    csv: csvPath,
    pdf: pdfPath,
  };
}

/**
 * Generate a PDF report with findings, severity, and evidence.
 */
function generatePDF(results, pdfPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).fillColor('#01091d').text('O&G AI Safety & Compliance Pipeline', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).fillColor('#00e5ff').text('Red-Teaming Evaluation Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#666').text(`Run ID: ${results.runId}`);
    doc.text(`Target: ${results.target}`);
    doc.text(`Model: ${results.model}`);
    doc.text(`Generated: ${results.generatedAt}`);
    doc.moveDown();

    // Summary
    doc.fontSize(14).fillColor('#01091d').text('Summary', { underline: true });
    doc.fontSize(10).fillColor('#333');
    doc.text(`Total Tests: ${results.totalTests}`);
    doc.text(`Passed: ${results.passedTests}`);
    doc.text(`Failed: ${results.failedTests}`);
    doc.text(`Pass Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
    doc.moveDown();

    // Findings table
    doc.fontSize(14).fillColor('#01091d').text('Test Results', { underline: true });
    doc.moveDown();

    for (const r of results.results) {
      doc.fontSize(10).fillColor('#333');
      doc.text(`${r.id} - ${r.description}`, { continued: true });
      doc.fillColor(r.passed ? '#19dda2' : '#ff2a5f').text(`  ${r.passed ? 'PASSED' : 'FAILED'} (${r.severity})`);
      doc.fillColor('#333').text(`  Prompt: ${r.prompt}`);
      if (r.output) {
        doc.text(`  Output: ${r.output.substring(0, 200)}${r.output.length > 200 ? '...' : ''}`);
      }
      doc.moveDown(0.5);
    }

    // Footer
    doc.moveDown();
    doc.fontSize(8).fillColor('#999').text(
      'O&G AI Safety & Compliance Pipeline - Not legal advice. Human review required.',
      { align: 'center' }
    );

    doc.end();

    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}
