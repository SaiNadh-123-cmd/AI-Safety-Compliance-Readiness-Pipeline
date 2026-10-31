import { ChevronLeft, ChevronRight, LayoutDashboard, Shield, Lock, FileSearch, Grid3x3, FileText, Settings } from 'lucide-react';

const nav = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'assessments', label: 'Assessments', icon: FileSearch },
  { id: 'redteam', label: 'Red Team Testing', icon: Shield },
  { id: 'pii', label: 'PII Protection', icon: Lock },
  { id: 'findings', label: 'Findings & Evidence', icon: FileText },
  { id: 'compliance', label: 'Compliance Matrix', icon: Grid3x3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ collapsed, setCollapsed, view, setView, mobileOpen, setMobileOpen }: {
  collapsed: boolean; setCollapsed: (v: boolean) => void; view: string; setView: (v: string) => void;
  mobileOpen: boolean; setMobileOpen: (v: boolean) => void;
}) {
  return (
    <>
      {mobileOpen && <div className="mobile-overlay show" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">AI</div>
          <span className="sidebar-brand">Safety & Compliance</span>
          <button className="icon-btn" style={{ marginLeft: 'auto' }} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <button key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => { setView(n.id); setMobileOpen(false); }} title={n.label}>
                <span className="icon"><Icon size={18} /></span>
                <span className="label">{n.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="nav-item" style={{ cursor: 'default' }}>
            <span className="icon"><Shield size={18} /></span>
            <span className="label">v1.0 Prototype</span>
          </div>
        </div>
      </aside>
    </>
  );
}