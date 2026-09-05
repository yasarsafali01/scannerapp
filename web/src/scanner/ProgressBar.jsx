import { useEffect, useState } from "react";

export default function ProgressBar({ progress, label, indeterminate }) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!indeterminate) {
      setElapsed(0);
      return undefined;
    }
    const start = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [indeterminate]);

  return (
    <div className="progress-wrap">
      <div className="progress-track">
        {indeterminate ? (
          <div className="progress-indeterminate" />
        ) : (
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        )}
      </div>
      <p className="progress-label">
        {label || `%${pct}`}
        {indeterminate && elapsed > 0 ? ` (${elapsed} sn)` : ""}
      </p>
    </div>
  );
}
