import { Sun, Moon, Search, Bell, Menu } from 'lucide-react';

const titles: Record<string, { title: string; crumb: string }> = {
  overview: { title: 'Overview', crumb: 'Dashboard' },
  assessments: { title: 'Assessments', crumb: 'Manage assessments' },
  redteam: { title: 'Red Team Testing', crumb: 'Security testing workspace' },
  pii: { title: 'PII Protection', crumb: 'Two-sided guardrails' },
  findings: { title: 'Findings & Evidence', crumb: 'Security findings' },
  compliance: { title: 'Compliance Matrix', crumb: 'Framework readiness' },
  reports: { title: 'Reports', crumb: 'Executive summaries' },
  settings: { title: 'Settings', crumb: 'Configuration' },
};

export function TopBar({ view, theme, toggleTheme, setMobileOpen }: {
  view: string; theme: string; toggleTheme: () => void; setMobileOpen: (v: boolean) => void;
}) {
  const t = titles[view] || titles.overview;
  return (
    <header className="topbar">
      <button className="icon-btn mobile-nav-btn" onClick={() => setMobileOpen(true)}><Menu size={18} /></button>
      <div>
        <div className="topbar-title">{t.title}</div>
        <div className="topbar-breadcrumb">{t.crumb}</div>
      </div>
      <div className="topbar-spacer" />
      <div className="topbar-actions">
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted)' }} />
          <input className="input" placeholder="Search..." style={{ paddingLeft: 34, width: 220 }} />
        </div>
        <button className="icon-btn" title="Notifications"><Bell size={16} /></button>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
      </div>
    </header>
  );
}