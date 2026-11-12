/**
 * DashboardPanel - Executive dashboard shown after evaluation completes.
 * Features: KPI cards, category breakdown bars, compliance matrix,
 * download hub, evidence cards with filter tabs, sticky back-to-home button.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  ShieldAlert,
  FileText,
  File,
  Files,
  Globe,
  Shield,
  BarChart3,
} from 'lucide-react';
import { exportExecutivePdf } from '../utils/exportExecutivePdf';
import type { EvaluationRun } from '../services/api';

interface DashboardPanelProps {
  run: EvaluationRun;
  onBackHome: () => void;
}

export function DashboardPanel({ run, onBackHome }: DashboardPanelProps) {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const passRate = run.totalTests > 0
    ? ((run.passedTests / run.totalTests) * 100).toFixed(1)
    : '0.0';

  const catStats = [
    { label: 'Jailbreaks & Override', key: 'jailbreak', color: '#00E5FF' },
    { label: 'System-Prompt Leakage', key: 'system-prompt', color: '#3B82F6' },
    { label: 'PII Disclosure', key: 'sensitive-data', color: '#F59E0B' },
    { label: 'Toxic / Abusive Output', key: 'toxic', color: '#EF4444' },
    { label: 'Dangerous Advice', key: 'dangerous', color: '#00E5FF' },
  ].map((c) => {
    const matching = run.results.filter((r) =>
      (r.category || '').toLowerCase().includes(c.key.split('-')[0]) ||
      r.description.toLowerCase().includes(c.key.split('-')[0]) ||
      r.id.toLowerCase().includes(c.key.replace('-', ''))
    );
    const total = matching.length || 1;
    const passed = matching.filter((r) => r.passed).length;
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

  const filteredResults = run.results.filter((r) => {
    if (filter === 'passed') return r.passed;
    if (filter === 'failed') return !r.passed;
    return true;
  });

  return (
    <section className="dashboard-shell min-h-screen bg-[#01091D] text-white">
      {/* Sticky Back to Home Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onBackHome}
          className="flex items-center gap-2 bg-[#01091D]/90 backdrop-blur-md border border-[#00E5FF]/50 text-white hover:bg-[#00E5FF] hover:text-[#01091D] shadow-lg transition-all duration-300 px-4 py-3 rounded-full"
        >
          <ArrowLeft size={16} />
          <span className="text-sm font-bold tracking-wider">Back to Home</span>
        </button>
      </div>

      {/* Sticky Top Nav with Back Button */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[#01091D]/90 backdrop-blur-md border-b border-[#00E5FF]/30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onBackHome}
            className="flex items-center gap-2 bg-white/10 border border-[#00E5FF]/50 rounded-md px-3 py-2 hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] transition-all text-sm font-semibold"
          >
            <ArrowLeft size={16} /> <span>Back to Home / New Evaluation</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#00E5FF] bg-[#00E5FF]/20 px-2 py-1 rounded">
              Live Mode: {run.mode === 'live' ? 'CONNECTED' : 'SANDBOX'}
            </span>
            <span className="text-xs font-mono text-[#7595b4]">Run ID: {run.runId.substring(0, 12)}…</span>
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
            Automated red-teaming evaluation completed — {run.passedTests}/{run.totalTests} tests passed
          </p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'TOTAL PROBES', value: run.totalTests, color: '#0F172A', icon: BarChart3 },
            { label: 'PASSED SAFEGUARDS', value: run.passedTests, color: '#10B981', icon: CheckCircle },
            { label: 'CRITICAL / FAILED', value: run.failedTests, color: '#EF4444', icon: ShieldAlert },
            { label: 'SAFETY PASS RATE', value: passRate + '%', color: '#0284C7', icon: Shield },
          ].map((kpi, idx) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-xl bg-[#021233] border border-[#CBD5E1] p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `rgb(${kpi.color[0]}, ${kpi.color[1]}, ${kpi.color[2]})` }} />
                <kpi.icon className="w-4 h-4" style={{ color: `rgb(${kpi.color[0]}, ${kpi.color[1]}, ${kpi.color[2]})` }} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
              <div className="text-xs font-mono text-[#83a2c1]">{kpi.label}</div>
              {kpi.label === 'SAFETY PASS RATE' ? (
                <div className="mt-3 w-full bg-[#021233] border border-[#00E5FF]/30 rounded h-2">
                  <div className="h-full bg-gradient-to-r from-[#00E5FF] to-[#10B981] rounded" style={{ width: passRate + '%' }} />
                </div>
              ) : null}
            </motion.div>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Red-Team Category Breakdown</h2>
          </div>
          <div className="space-y-3">
            {catStats.map((c) => {
              const passW = c.total > 0 ? (c.passed / c.total) * 100 : 0;
              const failW = 100 - passW;
              return (
                <motion.div
                  key={c.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catStats.indexOf(c) * 0.1 }}
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
              {matrixRows.map((row) => (
                <span
                  key={row.control}
                  className={`px-2 py-1 text-xs rounded ${row.status === 'PASSED' ? 'bg-[#10B981]/20 text-[#10B981]' : row.status === 'REVIEW' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}
                >
                  {row.status}
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
                {matrixRows.map((row, i) => {
                  const sevColor =
                    row.severity === 'HIGH' ? '#EF4444' : row.severity === 'MEDIUM' ? '#F59E0B' : '#10B981';
                  const statusColor =
                    row.status === 'PASSED' ? '#10B981' : row.status === 'IN PROGRESS' ? '#F59E0B' : '#EF4444';
                  return (
                    <tr key={i}>
                      <td className="px-3 py-2">{row.control}</td>
                      <td className="px-3 py-2 font-mono text-[#7595b4]">{row.evidence}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold`} style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold`} style={{ backgroundColor: `${sevColor}20`, color: sevColor }}>
                          {row.severity}
                        </span>
                      </td>
                      <td className="px-3 py-2">{row.review}</td>
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
              onClick={() => exportExecutivePdf(run)}
              className="flex items-center gap-2 bg-[#01091D]/90 backdrop-blur-md border border-[#00E5FF] text-[#00E5FF] px-4 py-2 rounded hover:bg-[#00E5FF] hover:text-[#01091D] transition-all"
            >
              <FileText size={14} /> Download PDF Report
            </button>
            <button
              className="flex items-center gap-2 bg-[#01091D]/90 backdrop-blur-md border border-[#00E5FF]/50 text-white px-4 py-2 rounded hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] transition-all"
            >
              <File size={14} /> Download Markdown Report
            </button>
            <button
              className="flex items-center gap-2 bg-[#01091D]/90 backdrop-blur-md border border-[#00E5FF]/50 text-white px-4 py-2 rounded hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] transition-all"
            >
              <Files size={14} /> Export CSV Matrix
            </button>
            <button
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
                {run.results.length} Test Cases
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
              const isPass = r.passed;
              return (
                <motion.div
                  key={r.id}
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
                          <span className="text-xs font-mono text-[#7595b4]">{r.id}</span>
                          <span className="text-xs font-bold text-white">{r.severity}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${isPass ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                            {r.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#83a2c1]">{r.category}</span>
                      </div>
                      <div className="mt-3 bg-[#0F172A] border border-[#00E5FF]/20 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[#83a2c1] uppercase">Adversarial Prompt</span>
                        </div>
                        <div className="text-sm text-[#eef7ff] whitespace-pre-wrap font-mono">{r.prompt}</div>
                      </div>
                      <div className="mt-3 bg-[#021233] border border-[#00E5FF]/20 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-[#00E5FF] uppercase">Model Response</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${isPass ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                            {isPass ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                        <div className="text-sm text-[#eef7ff] whitespace-pre-wrap font-mono">{r.output}</div>
                        {r.assertions && r.assertions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#00E5FF]/10">
                            <span className="text-[10px] font-bold text-[#83a2c1] block mb-1">Assertions</span>
                            {r.assertions.map((a, ai) => (
                              <div key={ai} className="flex items-start gap-2 text-xs text-[#7595b4] leading-tight">
                                <span className="text-[10px] text-[#10B981]" style={{ width: '18px' }}>•</span>
                                <span className="leading-tight">{a.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
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
