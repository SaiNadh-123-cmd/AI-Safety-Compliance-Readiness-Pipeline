/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { complianceNist, complianceEu } from '../data/mock';
import { Card, Button, Badge, Tabs } from '../components/ui';

export function Compliance() {
  const [tab, setTab] = useState('NIST');
  const [selected, setSelected] = useState<any>(null);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Compliance Matrix</h1><p className="page-subtitle">Framework readiness — technical evidence only; not legal advice.</p></div>
      <Tabs tabs={['NIST AI RMF', 'EU AI Act']} active={tab} onChange={setTab} />

      {tab === 'NIST AI RMF' && (
        <div className="grid-2">
          {complianceNist.map((c) => (
            <Card key={c.pillar}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{c.pillar}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{c.topic}</div>
                </div>
                <Badge>{c.status}</Badge>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-2)' }}>
                <div className="kv"><span className="k">Evidence</span><span className="v">{c.evidence}</span></div>
                <div className="kv"><span className="k">Findings</span><span className="v">{c.findings}</span></div>
              </div>
              <Button size="sm" style={{ marginTop: 10 }} onClick={() => setSelected(c)}>View control</Button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'EU AI Act' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Topic</th><th>Status</th><th>Rationale</th><th>Mitigation</th><th>Owner</th><th>Retest</th></tr></thead>
            <tbody>
              {complianceEu.map((c, i) => (
                <tr key={i}>
                  <td>{c.topic}</td>
                  <td><Badge>{c.status}</Badge></td>
                  <td style={{ fontSize: 12 }}>{c.rationale}</td>
                  <td style={{ fontSize: 12 }}>{c.mitigation}</td>
                  <td>{c.owner}</td>
                  <td>{c.retest}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="card-header"><span className="card-title">{selected.pillar} control detail</span><button className="icon-btn" onClick={() => setSelected(null)}>×</button></div>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Technical evidence only. Legal classification requires qualified review.</p>
          </div>
        </div>
      )}
    </div>
  );
}