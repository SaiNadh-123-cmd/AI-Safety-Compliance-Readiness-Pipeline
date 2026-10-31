import { useState } from 'react';
import { piiEntities } from '../data/mock';
import { Card, Badge, Tabs } from '../components/ui';

export function PiiProtection() {
  const [tab, setTab] = useState('Demo');
  const [input, setInput] = useState('My phone number is 9876543210.');
  const protectedText = input.replace(/9876543210/g, '[PHONE_NUMBER]').replace(/alex@example.com/g, '[EMAIL_ADDRESS]');

  return (
    <div>
      <div className="page-header"><h1 className="page-title">PII Protection</h1><p className="page-subtitle">Two-sided guardrail architecture — demonstration only.</p></div>
      <Tabs tabs={['Demo', 'Architecture', 'Coverage', 'Evaluation']} active={tab} onChange={setTab} />

      {tab === 'Demo' && (
        <div className="grid-2">
          <Card>
            <div className="card-title" style={{ marginBottom: 8 }}>Input Protection</div>
            <div className="kv"><span className="k">Original</span><span className="v">{input}</span></div>
            <div className="kv"><span className="k">Detected</span><span className="v">PHONE_NUMBER</span></div>
            <div className="kv"><span className="k">Protected</span><span className="v">{protectedText}</span></div>
            <div style={{ marginTop: 12 }}><input className="input" value={input} onChange={(e) => setInput(e.target.value)} /></div>
          </Card>
          <Card>
            <div className="card-title" style={{ marginBottom: 8 }}>Output Protection</div>
            <div className="kv"><span className="k">Model response</span><span className="v">Contact alex@example.com</span></div>
            <div className="kv"><span className="k">Detected</span><span className="v">EMAIL_ADDRESS</span></div>
            <div className="kv"><span className="k">Protected</span><span className="v">Contact [EMAIL_ADDRESS]</span></div>
          </Card>
        </div>
      )}

      {tab === 'Architecture' && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <div className="kv"><span className="k">Chamber 01</span><span className="v">Input Pre-Processor — detection & masking</span></div>
            <div className="kv"><span className="k">Chamber 02</span><span className="v">Model Core Execution</span></div>
            <div className="kv"><span className="k">Chamber 03</span><span className="v">Output Post-Processor — scrubbing & verification</span></div>
          </div>
        </Card>
      )}

      {tab === 'Coverage' && (
        <Card>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {piiEntities.map((e) => <Badge key={e}>{e}</Badge>)}
          </div>
        </Card>
      )}

      {tab === 'Evaluation' && (
        <div className="grid-2">
          <Card><div className="kv"><span className="k">Entity coverage</span><span className="v">5 types</span></div><div className="kv"><span className="k">Detection accuracy</span><span className="v">98.7% (demo)</span></div><div className="kv"><span className="k">False positives</span><span className="v">1.3%</span></div></Card>
          <Card><div className="kv"><span className="k">False negatives</span><span className="v">0.8%</span></div><div className="kv"><span className="k">Supported locales</span><span className="v">en-US</span></div><div className="kv"><span className="k">Note</span><span className="v">Sample data only</span></div></Card>
        </div>
      )}
    </div>
  );
}