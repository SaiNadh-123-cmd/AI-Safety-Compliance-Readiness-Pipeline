/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { redTeamCategories, testCases } from '../data/mock';
import { Card, Button, Badge, Tabs, Drawer } from '../components/ui';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function RedTeam() {
  const [tab, setTab] = useState('Categories');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Red Team Testing</h1><p className="page-subtitle">Security testing workspace — demo data only.</p></div>
      <Tabs tabs={['Categories', 'Test Cases', 'Results']} active={tab} onChange={setTab} />

      {tab === 'Categories' && (
        <div className="grid-2">
          {redTeamCategories.map((c) => (
            <Card key={c.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{c.desc}</div>
                </div>
                <Badge>{c.severity}</Badge>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-2)' }}>
                <span>Tests: {c.count}</span>
                <span>Findings: {c.findings}</span>
              </div>
              <button className="btn ghost sm" style={{ marginTop: 10, alignSelf: 'flex-start' }} onClick={() => setExpanded(expanded === c.name ? null : c.name)}>
                {expanded === c.name ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Details
              </button>
              {expanded === c.name && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-2)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  Example: prompt variants targeting this category. Results logged in Test Cases tab.
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === 'Test Cases' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Category</th><th>Prompt Preview</th><th>Expected</th><th>Actual</th><th>Result</th><th>Severity</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {testCases.map((t) => (
                <tr key={t.id}>
                  <td><code>{t.id}</code></td>
                  <td>{t.category}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.prompt}</td>
                  <td>{t.expected}</td>
                  <td>{t.actual}</td>
                  <td><Badge>{t.result}</Badge></td>
                  <td>{t.severity}</td>
                  <td>{t.date}</td>
                  <td><Button size="sm" onClick={() => setDetail(t)}>View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Results' && (
        <Card><p style={{ color: 'var(--text-2)', fontSize: 13 }}>Aggregate results: {testCases.filter(t=>t.result==='Pass').length} passed, {testCases.filter(t=>t.result==='Fail').length} failed out of {testCases.length}.</p></Card>
      )}

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.id}>
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="kv"><span className="k">Category</span><span className="v">{detail.category}</span></div>
            <div className="kv"><span className="k">Severity</span><span className="v">{detail.severity}</span></div>
            <div className="kv"><span className="k">Result</span><span className="v">{detail.result}</span></div>
            <div><div className="stat-label">Prompt</div><p style={{ fontSize: 13, marginTop: 4 }}>{detail.prompt}</p></div>
            <div><div className="stat-label">Expected</div><p style={{ fontSize: 13, marginTop: 4 }}>{detail.expected}</p></div>
            <div><div className="stat-label">Actual</div><p style={{ fontSize: 13, marginTop: 4 }}>{detail.actual}</p></div>
          </div>
        )}
      </Drawer>
    </div>
  );
}