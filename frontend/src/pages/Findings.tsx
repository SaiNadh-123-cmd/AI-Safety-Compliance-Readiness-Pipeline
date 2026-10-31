/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { findings } from '../data/mock';
import { Button, Badge, Drawer } from '../components/ui';
import { Filter } from 'lucide-react';

export function Findings() {
  const [severity, setSeverity] = useState('All');
  const [detail, setDetail] = useState<any>(null);

  const filtered = severity === 'All' ? findings : findings.filter((f) => f.severity === severity);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Findings & Evidence</h1><p className="page-subtitle">Security findings management — demo data.</p></div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['All','Critical','High','Medium','Low'].map((s) => (
          <Button key={s} variant={severity === s ? 'primary' : 'default'} size="sm" onClick={() => setSeverity(s)}>{s}</Button>
        ))}
        <Button size="sm"><Filter size={12} /> More filters</Button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Severity</th><th>Owner</th><th>Retest</th><th></th></tr></thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id}>
                <td><code>{f.id}</code></td>
                <td>{f.title}</td>
                <td>{f.category}</td>
                <td><Badge>{f.severity}</Badge></td>
                <td>{f.owner}</td>
                <td>{f.retest}</td>
                <td><Button size="sm" onClick={() => setDetail(f)}>View</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.id}>
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{detail.title}</div>
            <div className="kv"><span className="k">Severity</span><span className="v">{detail.severity}</span></div>
            <div className="kv"><span className="k">Category</span><span className="v">{detail.category}</span></div>
            <div className="kv"><span className="k">Owner</span><span className="v">{detail.owner}</span></div>
            <div><div className="stat-label">Description</div><p style={{ marginTop: 4 }}>{detail.description}</p></div>
            <div><div className="stat-label">Reproduction</div><p style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{detail.repro}</p></div>
            <div><div className="stat-label">Expected</div><p style={{ marginTop: 4 }}>{detail.expected}</p></div>
            <div><div className="stat-label">Actual</div><p style={{ marginTop: 4 }}>{detail.actual}</p></div>
            <div><div className="stat-label">Evidence</div><p style={{ marginTop: 4 }}>{detail.evidence}</p></div>
            <div><div className="stat-label">Remediation</div><p style={{ marginTop: 4 }}>{detail.remediation}</p></div>
          </div>
        )}
      </Drawer>
    </div>
  );
}