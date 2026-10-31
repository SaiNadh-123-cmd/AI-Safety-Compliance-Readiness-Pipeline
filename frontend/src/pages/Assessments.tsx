/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { assessments } from '../data/mock';
import { Card, Button, Input, Field, Modal, Badge } from '../components/ui';
import { Plus, Search, Filter } from 'lucide-react';

export function Assessments() {
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');

  const filtered = assessments.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><h1 className="page-title">Assessments</h1><p className="page-subtitle">Manage AI safety assessments.</p></div>
        <Button variant="primary" onClick={() => { setShowCreate(true); setStep(1); }}><Plus size={14} /> New Assessment</Button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }} />
          <Input placeholder="Search assessments..." value={search} onChange={(e: any) => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <Button><Filter size={14} /> Filter</Button>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Target</th><th>Model</th><th>Version</th><th>Date</th><th>Status</th><th>Findings</th></tr></thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td><code>{a.id}</code></td>
                <td>{a.name}</td>
                <td>{a.target}</td>
                <td>{a.model}</td>
                <td>{a.version}</td>
                <td>{a.date}</td>
                <td><Badge>{a.status}</Badge></td>
                <td>{a.findings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Assessment">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[1,2,3].map((s) => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? 'var(--text)' : 'var(--border)' }} />)}
        </div>
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Assessment name"><Input placeholder="e.g. Enterprise Assistant v2.4" /></Field>
            <Field label="Target application"><Input placeholder="Target app" /></Field>
            <Field label="Application description"><textarea className="textarea" placeholder="Description" /></Field>
            <Field label="Model / provider"><Input placeholder="GPT-4o" /></Field>
            <Field label="Model version"><Input placeholder="2.4.1" /></Field>
          </div>
        )}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Environment"><select className="select"><option>Staging</option><option>Development</option></select></Field>
            <Field label="Intended use"><Input placeholder="Customer support" /></Field>
            <Field label="Test categories">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Jailbreaks','Context Leakage','Sensitive Data','Toxic Output','High-Impact Advice'].map((c) => (
                  <label key={c} style={{ fontSize: 13, display: 'flex', gap: 8 }}><input type="checkbox" defaultChecked /> {c}</label>
                ))}
              </div>
            </Field>
          </div>
        )}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 13, display: 'flex', gap: 8 }}><input type="checkbox" /> I confirm authorization to test the target.</label>
            <label style={{ fontSize: 13, display: 'flex', gap: 8 }}><input type="checkbox" /> I confirm synthetic or approved test data will be used.</label>
            <Card><div className="kv"><span className="k">Scope</span><span className="v">5 test categories</span></div><div className="kv"><span className="k">Environment</span><span className="v">Staging</span></div></Card>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <Button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>Back</Button>
          {step < 3 ? <Button variant="primary" onClick={() => setStep((s) => s + 1)}>Next</Button> : <Button variant="primary" onClick={() => setShowCreate(false)}>Confirm & Create</Button>}
        </div>
      </Modal>
    </div>
  );
}