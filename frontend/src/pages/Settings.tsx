export function Settings({ theme, setTheme }: { theme: 'dark' | 'light'; setTheme: (t: 'dark' | 'light') => void }) {
  return (
    <div>
      <div className="page-header"><h1 className="page-title">Settings</h1><p className="page-subtitle">Application configuration.</p></div>
      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Appearance</div>
        <div className="field">
          <label>Theme</label>
          <select className="select" value={theme} onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>Theme is persisted to localStorage.</div>
      </div>
    </div>
  );
}