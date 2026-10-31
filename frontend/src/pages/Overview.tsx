import { assessments, activity, findings } from '../data/mock';
import { Card, Button } from '../components/ui';
import { ArrowUpRight, AlertTriangle, ShieldCheck, Layers } from 'lucide-react';
import { useState } from 'react';

export function Overview() {
  const total = assessments.length;
  const completed = assessments.filter((a) => a.status === 'Completed').length;
  const openFindings = findings.length;
  const highRisk = findings.filter((f) => f.severity === 'Critical' || f.severity === 'High').length;

  const [counter] = useState({ total, completed, openFindings, highRisk });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">AI Safety & Compliance Readiness — overview of assessments, findings, and risk posture.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Button variant="primary"><ArrowUpRight size={14} /> Start New Assessment</Button>
        <Button>View Reports</Button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Total Assessments</div><div className="stat-value">{counter.total}</div><div className="stat-delta">+2 this month</div></div>
        <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value">{counter.completed}</div><div className="stat-delta">{Math.round((counter.completed/counter.total)*100)}% completion</div></div>
        <div className="stat-card"><div className="stat-label">Open Findings</div><div className="stat-value">{counter.openFindings}</div><div className="stat-delta">Across all assessments</div></div>
        <div className="stat-card"><div className="stat-label">High-Risk Findings</div><div className="stat-value">{counter.highRisk}</div><div className="stat-delta">Requires attention</div></div>
      </div>

      <div className="grid-2">
        <Card>
          <div className="card-header"><span className="card-title">Risk Distribution</span></div>
          <div className="chart">
            {['Critical','High','Medium','Low'].map((s, i) => {
              const counts = [1,2,2,0];
              const h = 40 + counts[i]*30;
              return <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="chart-bar" style={{ height: h }} />
                <div className="chart-label">{s}</div>
              </div>;
            })}
          </div>
        </Card>
        <Card>
          <div className="card-header"><span className="card-title">Recent Activity</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span>{a.text}</span>
                <span style={{ color: 'var(--muted)', fontSize: 11 }}>{a.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <div className="card-header"><span className="card-title">Recent Assessments</span><Button size="sm">View all</Button></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Target</th><th>Model</th><th>Date</th><th>Status</th><th>Findings</th></tr></thead>
            <tbody>
              {assessments.slice(0, 4).map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.target}</td>
                  <td>{a.model}</td>
                  <td>{a.date}</td>
                  <td><span className="badge">{a.status}</span></td>
                  <td>{a.findings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 16 }}>
        <Card><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Layers size={18} /><div><div className="stat-label">Frameworks</div><div style={{ fontWeight: 600 }}>NIST + EU AI Act</div></div></div></Card>
        <Card><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><ShieldCheck size={18} /><div><div className="stat-label">Pass Rate</div><div style={{ fontWeight: 600 }}>94.2%</div></div></div></Card>
        <Card><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><AlertTriangle size={18} /><div><div className="stat-label">Open Findings</div><div style={{ fontWeight: 600 }}>{openFindings}</div></div></div></Card>
      </div>
    </div>
  );
}