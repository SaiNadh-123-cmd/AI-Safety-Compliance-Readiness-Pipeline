import { Card, Button } from '../components/ui';
import { Download } from 'lucide-react';

export function Reports() {
  const sections = ['Assessment summary', 'System description', 'Scope', 'Methodology', 'Test coverage', 'Findings by severity', 'PII guardrail results', 'Framework mapping', 'Remediation plan', 'Residual risks', 'Human review requirements'];
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><h1 className="page-title">Reports & Executive Summary</h1><p className="page-subtitle">Report preview — frontend placeholder only.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button><Download size={14} /> Export JSON</Button>
          <Button><Download size={14} /> Export Markdown</Button>
          <Button variant="primary"><Download size={14} /> Print PDF</Button>
        </div>
      </div>

      <Card>
        <div className="card-title" style={{ marginBottom: 12 }}>Executive Report Preview</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sections.map((s) => (
            <div key={s} className="kv"><span className="k">{s}</span><span className="v">Sample content</span></div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 12, border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)' }}>
          Note: This is a prototype preview. No real assessment results, certifications, or approvals are generated.
        </div>
      </Card>
    </div>
  );
}