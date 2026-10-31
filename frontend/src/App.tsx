import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Overview } from './pages/Overview';
import { Assessments } from './pages/Assessments';
import { RedTeam } from './pages/RedTeam';
import { PiiProtection } from './pages/PiiProtection';
import { Findings } from './pages/Findings';
import { Compliance } from './pages/Compliance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { StarfieldGalaxyBackground } from './components/StarfieldGalaxyBackground';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const [view, setView] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const pages: Record<string, JSX.Element> = {
    overview: <Overview />,
    assessments: <Assessments />,
    redteam: <RedTeam />,
    pii: <PiiProtection />,
    findings: <Findings />,
    compliance: <Compliance />,
    reports: <Reports />,
    settings: <Settings theme={theme} setTheme={setTheme} />,
  };

  return (
    <div className="app-shell">
      {theme === 'dark' && <StarfieldGalaxyBackground theme="dark" />}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} view={view} setView={setView} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="main-area">
        <TopBar view={view} theme={theme} toggleTheme={toggleTheme} setMobileOpen={setMobileOpen} />
        <main className="content">{pages[view]}</main>
      </div>
    </div>
  );
}