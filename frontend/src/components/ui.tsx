/* eslint-disable @typescript-eslint/no-explicit-any */
import { X } from 'lucide-react';
import { useState } from 'react';

export function Button({ children, variant = 'default', size, onClick, disabled, type = 'button' }: any) {
  const cls = `btn ${variant === 'primary' ? 'primary' : variant === 'ghost' ? 'ghost' : variant === 'danger' ? 'danger' : ''} ${size === 'sm' ? 'sm' : ''}`;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Card({ children, className = '' }: any) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function Badge({ children }: any) {
  return <span className="badge"><span className="dot" />{children}</span>;
}

export function Input(props: any) { return <input className="input" {...props} />; }
export function Textarea(props: any) { return <textarea className="textarea" {...props} />; }
export function Select(props: any) { return <select className="select" {...props}>{props.children}</select>; }

export function Field({ label, hint, children }: any) {
  return <div className="field"><label>{label}</label>{children}{hint && <span className="hint">{hint}</span>}</div>;
}

export function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <span className="card-title">{title}</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="card-header">
          <span className="card-title">{title}</span>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </>
  );
}

export function Tabs({ tabs, active, onChange }: any) {
  return (
    <div className="tabs">
      {tabs.map((t: string) => (
        <button key={t} className={`tab ${active === t ? 'active' : ''}`} onClick={() => onChange(t)}>{t}</button>
      ))}
    </div>
  );
}

export function Toast({ message }: any) {
  return <div className="toast">{message}</div>;
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };
  const node = msg ? <div className="toast-container"><Toast message={msg} /></div> : null;
  return { show, node };
}