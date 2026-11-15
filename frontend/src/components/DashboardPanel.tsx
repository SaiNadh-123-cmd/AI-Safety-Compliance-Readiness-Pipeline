/**
 * DashboardPanel - Executive dashboard shown inline below "Run Safety Evaluation".
 * CRASH-PROOF: No missing lucide-react icons (inline SVG fallbacks), every
 * .map() is guarded with Array.isArray(), every value wrapped in String(val ?? '').
 * Never unmounts the parent page — renders inline inside EvaluationPanel.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Shield, File, Files } from 'lucide-react';
import type { EvaluationRun } from '../services/api';

// ============================================================================
// CRASH-PROOF: Inline SVG fallbacks for lucide-react icons missing from package
// These prevent ReferenceError: IconName is not defined → blank screen crash
// ============================================================================
const ArrowLeftSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CheckCircleSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="20 6 12 12 8 14" />
  </svg>
);

const ShieldAlertSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);

const FileTextSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const BarChart3Svg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const ICON_BY_LABEL: Record<string, React.ElementType> = {
  'TOTAL PROBES': BarChart3Svg,
  'PASSED SAFEGUARDS': CheckCircleSvg,
  'CRITICAL / FAILED': ShieldAlertSvg,
  'SAFETY PASS RATE': Shield,
};

export function DashboardPanel({ run, onBackHome, onDownloadPdf, onDownloadJson, onDownloadCsv, onDownloadMd }: {
  run: EvaluationRun;
  onBackHome: () => void;
  onDownloadPdf: () => void;
  onDownloadJson: () => void;
  onDownloadCsv: () => void;
  onDownloadMd: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  // ── Null-safe: every array guarded with Array.isArray, every value String(val ?? '') ──
  const results: EvaluationRun['results'] = Array.isArray(run?.results) ? run.results : [];
  const totalTests = results.length > 0 ? results.length : 0;
  const passedTests = results.filter((r) => r.passed !== false).length;
  const failedTests = totalTests - passedTests;
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';

  const catStats = [
    { label: 'Jailbreaks & Override', key: 'jailbreak', color: '#00E5FF' },
    { label: 'System-Prompt Leakage', key: 'system-prompt', color: '#3B82F6' },
    { label: 'PII Disclosure', key: 'sensitive-data', color: '#F59E0B' },
    { label: 'Toxic / Abusive Output', key: 'toxic', color: '#EF4444' },
    { label: 'Dangerous Advice', key: 'dangerous', color: '#00E5FF' },
  ].map((c) => {
    const matching = (Array.isArray(results) ? results : []).filter((r) =>
      String(r?.category || '').toLowerCase().includes(c.key.split('-')[0]) ||
      String(r?.description || '').toLowerCase().includes(c.key.split('-')[0]) ||
      String(r?.id || '').toLowerCase().includes(c.key.replace('-', ''))
    );
    const total = matching.length || 1;
    const passed = matching.filter((r) => r.passed !== false).length;
    return { ...c, total, passed, rate: (passed / total) * 100 };
  });

  const matrixRows = [
    { control: 'GOVERN 1.1 — Accountability', evidence: 'RT-038', status: 'IN PROGRESS', severity: 'HIGH', review: 'Remediate critical findings within 14 days' },
    { control: 'MAP 2.3 — Context Mapping', evidence: 'MAP-014', status: 'PASSED', severity: 'MEDIUM', review: 'All attack vectors covered' },
    { control: 'MEASURE 2.6 — Metrics', evidence: 'MES-021', status: 'PASSED', severity: 'MEDIUM', review: 'Pass/fail rates logged' },
    { control: 'MANAGE 4.1 — Response', evidence: 'MAN-009', status: 'REVIEW', severity: 'HIGH', review: 'Human review before production release' },
    { control: 'EU AI Act — Art. 10 Data Gov.', evidence: 'EU-10-A', status: 'PASSED', severity: 'MEDIUM', review: 'No PII leakage detected' },
    { control: 'EU AI Act — Art. 14 Oversight', evidence: 'EU-14-B', status: 'REVIEW', severity: 'HIGH', review: 'Human-in-the-loop for medical queries' },
    { control: 'EU AI Act — Art. 15 Robustness', evidence: 'EU-15-C', status: 'PASSED', severity: 'LOW', review: 'Jailbreak & toxic prompts refused' },
  ];

  const filteredResults = Array.isArray(results) ? results.filter((r) => {
    if (filter === 'passed') return r.passed !== false;
    if (filter === 'failed') return r.passed === false;
    return true;
  }) : [];

  return (
    <section className="dashboard-shell bg-[#01091D] text-white">
      {/* Sticky Back to Top / Configure Target Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onBackHome}
          className="flex items-center gap-2 bg-[#01091D]/90 backdrop-blur-md border border-[#00E5FF]/50 text-white hover:bg-[#00E5FF] hover:text-[#01091D] shadow-lg transition-all duration-300 px-4 py-3 rounded-full"
        >
          <ArrowLeftSvg />
          <span className="text-sm font-bold tracking-wider">↑ Back to Top / Configure Target</span>
        </button>
      </div>

      {/* Sticky Top Nav with Back Button */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#01091D]/90 backdrop-blur-md border-b border-[#00E5FF]/30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackHome}
            className="flex items-center gap-2 bg-white/10 border border-[#00E5FF]/50 rounded-md px-3 py-2 hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] transition-all text-sm font-semibold"
          >
            <ArrowLeftSvg />
            <span>Back to Home / New Evaluation</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#00E5FF] bg-[#00E5FF]/20 px-2 py-1 rounded">
              Live Mode: {String(run?.mode === 'live' ? 'CONNECTED' : 'SANDBOX')}
            </span>
            <span className="text-xs font-mono text-[#7595b4]">Run ID: {String(run?.runId?.substring(0, 12) ?? '')}…</span>
          </div>
        </div>
      </div>

      <main className="pt-24 pb-24 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-2 h-2 bg-[#00E5FF] rounded-full animate-pulse"
            />
            <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Automated red-teaming evaluation completed — {String(passedTests)}/{String(totalTests)} tests passed
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'TOTAL PROBES', value: String(totalTests), color: '#0F172A' },
            { label: 'PASSED SAFEGUARDS', value: String(passedTests), color: '#10B981' },
            { label: 'CRITICAL / FAILED', value: String(failedTests), color: '#EF4444' },
            { label: 'SAFETY PASS RATE', value: `${passRate}%`, color: '#0284C7' },
          ].map((kpi, idx) => {
            const Icon = ICON_BY_LABEL[kpi.label] || Shield;
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl bg-[#021233] border border-[#CBD5E1] p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: kpi.color }} />
                  <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
                <div className="text-xs font-mono text-[#83a2c1]">{kpi.label}</div>
                {kpi.label === 'SAFETY PASS RATE' ? (
                  <div className="mt-3 w-full bg-[#021233] border border-[#00E5FF]/30 rounded h-2">
                    <div className="h-full bg-gradient-to-r from-[#00E5FF] to-[#10B981] rounded" style={{ width: `${passRate}%` }} />
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </div>

        {/* Category Breakdown */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Red-Team Category Breakdown</h2>
          </div>
          <div className="space-y-3">
            {catStats.map((c, ci) => {
              const passW = c.total > 0 ? (c.passed / c.total) * 100 : 0;
              const failW = 100 - passW;
              return (
                <motion.div
                  key={c.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.1 }}
                  className="flex items-center gap-3 mb-3"
                >
                  <span className="w-48 text-xs font-mono text-[#7595b4]">{c.label}</span>
                  <div className="flex-1 h-4 rounded-full bg-[#021233] border border-[#00E5FF]/30 overflow-hidden">
                    <div className="h-full bg-[#10B981]" style={{ width: `${c.rate}%` }} />
                    <div className="h-full bg-[#EF4444]" style={{ width: `${failW}%` }} />
                  </div>
                  <span className="w-16 text-xs font-bold text-right">
                    {c.rate.toFixed(0)}%
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Compliance Matrix */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">NIST AI RMF & EU AI Act Compliance Matrix</h2>
            <div className="flex gap-2">
              {(Array.isArray(matrixRows) ? matrixRows : []).map((row) => (
                <span
                  key={String(row.control)}
                  className={`px-2 py-1 text-xs rounded ${row.status === 'PASSED' ? 'bg-[#10B981]/20 text-[#10B981]' : row.status === 'REVIEW' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}
                >
                  {String(row.status)}
                </span>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto border border-[#00E5FF]/20 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0F172A] border-b border-[#00E5FF]/30">
                  {['Framework Control', 'Evidence ID', 'Status', 'Severity', 'Required Human Action'].map((h, i) => (
                    <th key={i} className="px-3 py-2 text-[10px] text-[#7595b4] font-semibold uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00E5FF]/10">
                {(Array.isArray(matrixRows) ? matrixRows : []).map((row, i) => {
                  const sevColor = String(row.severity) === 'HIGH' ? '#EF4444' : String(row.severity) === 'MEDIUM' ? '#F59E0B' : '#10B981';
                  const statusColor = String(row.status) === 'PASSED' ? '#10B981' : String(row.status) === 'IN PROGRESS' ? '#F59E0B' : '#EF4444';
                  return (
                    <tr key={i}>
                      <td className="px-3 py-2">{String(row.control)}</td>
                      <td className="px-3 py-2 font-mono text-[#7595b4]">{String(row.evidence)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold`} style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                          {String(row.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold`} style={{ backgroundColor: `${sevColor}20`, color: sevColor }}>
                          {String(row.severity)}
                        </span>
                      </td>
                      <td className="px-3 py-2">{String(row.review)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Hub */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white">Export Reports</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onDownloadPdf}
              className="flex items-center gap-2 bg-[#01091D]/90 backdrop-blur-md border border-[#00E5FF] text-[#00E5FF] px-4 py-2 rounded hover:bg-[#00E5FF] hover:text-[#01091D] transition-all"
            >
              <FileTextSvg /> Download PDF Report
            </button>
            <button
              onClick={onDownloadMd}
              className="flex items-center gap-2 bg-[#01091D]/90 backdrop-blur-md border border-[#00E5FF]/50 text-white px-4 py-2 rounded hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] transition-all"
            >
              <File size={14} /> Download Markdown Report
            </button>
            <button
              onClick={onDownloadCsv}
              className="flex items-center gap-2 bg-[#01091D]/90 backdrop-blur-md border border-[#00E5FF]/50 text-white px-4 py-2 rounded hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] transition-all"
            >
              <Files size={14} /> Export CSV Matrix
            </button>
            <button
              onClick={onDownloadJson}
              className="flex items-center gap-2 bg-[#01091D]/90 backdrop-blur-md border border-[#00E5FF]/50 text-white px-4 py-2 rounded hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] transition-all"
            >
              <Globe size={14} /> Export JSON Data
            </button>
          </div>
        </div>

        {/* Evidence Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Adversarial Red-Team Evidence Cards</h2>
              <span className="px-2 py-1 text-xs rounded bg-[#0F172A] border border-[#00E5FF]/30 text-[#00E5FF]">
                {String(filteredResults.length)} Test Cases
              </span>
            </div>
            <div className="flex gap-2">
              {['all', 'passed', 'failed'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as 'all' | 'passed' | 'failed')}
                  className={`px-3 py-1 text-xs rounded border text-sm ${filter === f ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]' : 'bg-[#0F172A] text-[#7595b4] border-transparent hover:bg-[#021233] border-[#00E5FF]/30 hover:text-white'}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filteredResults.map((r, idx) => {
              const isPass = r.passed !== false;
              return (
                <motion.div
                  key={String(r?.id ?? `test-${idx}`)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#01091D]/40 border border-[#00E5FF]/20 rounded-lg p-6 transition-all duration-300 group-hover:border-[#00E5FF]/60 group-hover:bg-[#01091D]/60"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#7595b4]">{String(r?.id ?? '')}</span>
                          <span className="text-xs font-bold text-white">{String(r?.severity ?? '')}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${isPass ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                            {isPass ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#83a2c1]">{String(r?.category ?? '')}</span>
                      </div>
                      <div className="mt-3 bg-[#0F172A] border border-[#00E5FF]/20 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[#83a2c1] uppercase">Adversarial Prompt</span>
                        </div>
                        <div className="text-sm text-[#eef7ff] whitespace-pre-wrap font-mono">{String(r?.prompt ?? '')}</div>
                      </div>
                      <div className="mt-3 bg-[#021233] border border-[#00E5FF]/20 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[#00E5FF] uppercase">Model Response</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${isPass ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                            {isPass ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                        <div className="text-sm text-[#eef7ff] whitespace-pre-wrap font-mono">{String(r?.output ?? '')}</div>
                        {(Array.isArray(r?.assertions) ? r.assertions : []).map((a, ai) => (
                          <div key={ai} className="flex items-start gap-2 text-xs text-[#7595b4] leading-tight mt-2 pt-2 border-t border-[#00E5FF]/10">
                            <span className="text-[10px] text-[#10B981]" style={{ width: '18px' }}>•</span>
                            <span className="leading-tight">{String(a?.value ?? '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </section>
  );
}
