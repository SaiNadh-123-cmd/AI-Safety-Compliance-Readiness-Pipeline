/**
 * ModeBanner - Shows whether the frontend is in Live Mode (backend reachable)
 * or Demo Mode (pre-computed results).
 * Includes a connecting state for cold-start backends (Render free tier)
 * and a manual toggle to switch modes.
 */
import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { detectMode, type BackendStatus } from '../services/api';

export function ModeBanner() {
  const [status, setStatus] = useState<BackendStatus>({
    mode: 'demo',
    online: false,
    origin: '',
  });
  const [checking, setChecking] = useState<'checking' | 'live' | 'demo' | null>(
    'checking'
  );
  const [forceDemo, setForceDemo] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await detectMode();
        if (mounted) {
          setStatus(s);
          setChecking(s.mode === 'live' ? 'live' : 'demo');
        }
      } finally {
        if (mounted) setChecking('demo');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isLive = status.mode === 'live' && !forceDemo;

  const handleRetry = async () => {
    setChecking('checking');
    try {
      const s = await detectMode();
      setStatus(s);
      setChecking(s.mode === 'live' ? 'live' : 'demo');
    } catch {
      setChecking('demo');
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount - nothing needed
    };
  }, []);

  const toggleMode = () => {
    setForceDemo((prev) => !prev);
  };

  if (checking === 'checking') {
    return (
      <div className="mode-banner mode-checking" role="status" aria-live="polite">
        <span className="mode-dot animate-pulse" />
        <span className="mode-label">Connecting to backend…</span>
        <span className="mode-detail">Waking up server (may take 10–30s)</span>
      </div>
    );
  }

  return (
    <div
      className={`mode-banner ${isLive ? 'mode-live' : 'mode-demo'}`}
      role="status"
      aria-live="polite"
    >
      <div className="mode-content">
        {isLive ? (
          <>
            <Wifi className="mode-icon" size={14} />
            <span className="mode-label">Live Mode</span>
            <span className="mode-detail">
              Connected to backend at {status.origin}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="mode-icon" size={14} />
            <span className="mode-label">Demo Mode — Server Offline</span>
            <span className="mode-detail">
              Showing precomputed results. Start the local backend + tunnel for live
              evaluation.
            </span>
          </>
        )}
      </div>
      <div className="mode-actions">
        <button
          className="mode-toggle"
          onClick={isLive ? toggleMode : handleRetry}
          title={isLive ? 'Switch to Demo Mode' : 'Retry Connection'}
        >
          {isLive ? (
            <>
              <WifiOff size={12} />
              <span>Demo Mode</span>
            </>
          ) : (
            <>
              <RefreshCw size={12} />
              <span>Retry Live</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
