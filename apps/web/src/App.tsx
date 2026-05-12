import { useEffect, useState } from 'react';
import type { HealthResponse } from '@otcflow/shared';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE}/health`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not reach API. Run `npm run dev:api` in another terminal.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>OTCFlow</h1>
      </header>
      <section className="panel" aria-live="polite">
        <h2>API health</h2>
        {error ? <p className="error">{error}</p> : null}
        {health ? <pre className="json">{JSON.stringify(health, null, 2)}</pre> : null}
        {!health && !error ? <p className="muted">Loading…</p> : null}
      </section>
    </div>
  );
}
