/**
 * ModeBanner - Shows whether the frontend is connected to a live backend
 * or running in demo mode with precomputed data.
 */
import { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { detectMode, type BackendMode } from '../services/api';

export function ModeBanner() {
  const [mode, setMode] = useState<BackendMode>('demo');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await detectMode();
        if (mounted) {
          setMode(status.mode);
        }
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="mode-banner mode-checking" role="status" aria-live="polite">
        <span className="mode-dot animate-pulse" /> Detecting backend…
      </div>
    );
  }

  const isLive = mode === 'live';
  return (
    <div className={`mode-banner ${isLive ? 'mode-live' : 'mode-demo'}`} role="status" aria-live="polite">
      <div className="mode-content">
        {isLive ? (
          <>
            <Wifi className="mode-icon" size={14} />
            <span className="mode-label">Live Mode</span>
            <span className="mode-detail">Connected to backend at {import.meta.env.VITE_BACKEND_ORIGIN || 'localhost:3001'}</span>
          </>
        ) : (
          <>
            <WifiOff className="mode-icon" size={14} />
            <span className="mode-label">Demo Mode — Server Offline</span>
            <span className="mode-detail">Showing precomputed results. Start the local backend for live Promptfoo + Ollama evaluation.</span>
          </>
        )}
      </div>
      <div className="mode-actions">
        {!isLive && (
          <button className="mode-retry" onClick={() => window.location.reload()}>
            <AlertTriangle size={12} /> Retry Connection
          </button>
        )}
      </div>
    </div>
  );
}
