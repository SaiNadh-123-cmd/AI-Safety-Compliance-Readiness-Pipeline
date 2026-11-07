/**
 * DemoModeBanner - Honest badge showing the site is running in demo mode
 * with pre-computed sandbox results. No live backend dependency.
 */
import { FlaskConical } from 'lucide-react';

export function DemoModeBanner() {
  return (
    <div className="mode-banner mode-demo" role="status" aria-live="polite">
      <div className="mode-content">
        <FlaskConical className="mode-icon" size={14} />
        <span className="mode-label">Demo Mode — Using Sandbox Results</span>
        <span className="mode-detail">
          Pre-computed red-teaming results against qwen3:8b. No live backend required.
        </span>
      </div>
    </div>
  );
}
