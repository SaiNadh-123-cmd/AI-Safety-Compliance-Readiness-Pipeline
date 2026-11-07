/**
 * ModeBanner - Shows whether the frontend is in Live Mode (backend reachable)
 * or Demo Mode (pre-computed results). No live backend = honest demo badge.
 */
import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { detectMode, type BackendStatus } from '../services/api';

export function ModeBanner() {
  const [status, setStatus] = useState<BackendStatus>({
    mode: 'demo',
    online: false,
    origin: '',
  });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await detectMode();
        if (mounted) {
          setStatus(s);
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

  const isLive = status.mode === 'live';
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
              Showing precomputed results. Start the local backend + tunnel for live evaluation.
            </span>
          </>
        )}
      </div>
    </div>
  );
}
