'use client';

import { useCallback, useEffect, useState } from 'react';

type KillSwitchStatus = {
  active: boolean;
  disabledApis: string[];
  updatedAt: string | null;
  pool: string[];
  poolSize: number;
};

export default function RandomApisClosePanel() {
  const [status, setStatus] = useState<KillSwitchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/killswitch', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Failed to load kill switch status');
      }
      const data = (await res.json()) as KillSwitchStatus;
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleToggle = async () => {
    if (!status || toggling) return;

    setToggling(true);
    setError(null);

    try {
      const action = status.active ? 'disable' : 'enable';
      const res = await fetch('/api/killswitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, count: 6 }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to update kill switch');
      }

      setStatus({
        active: data.active,
        disabledApis: data.disabledApis || [],
        updatedAt: data.updatedAt ?? null,
        pool: data.pool || status.pool,
        poolSize: data.pool?.length ?? status.poolSize,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
    } finally {
      setToggling(false);
    }
  };

  const isOn = Boolean(status?.active);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          API Control
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Random APIs Close
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Turn ON to randomly stop 6 APIs. State is saved in the shared database, so
          localhost and Hostinger/VPS both follow the same switch. Login is not
          required for this page.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Kill switch</p>
            <p className="text-xs text-slate-500">
              {loading
                ? 'Loading status...'
                : isOn
                  ? '6 random APIs are currently stopped'
                  : 'All APIs are running normally'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={loading || toggling || !status}
            aria-pressed={isOn}
            className={`relative inline-flex h-12 w-28 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isOn ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          >
            <span
              className={`absolute left-1 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-800 shadow transition-transform ${
                isOn ? 'translate-x-16' : 'translate-x-0'
              }`}
            >
              {toggling ? '...' : isOn ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Currently disabled APIs
            </h2>
            <button
              type="button"
              onClick={loadStatus}
              className="text-xs font-medium text-slate-600 underline-offset-2 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Fetching...</p>
          ) : !isOn || !status?.disabledApis.length ? (
            <p className="mt-3 text-sm text-slate-500">None — all APIs are open.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {status.disabledApis.map((api) => (
                <li
                  key={api}
                  className="rounded-lg border border-red-100 bg-white px-3 py-2 font-mono text-xs text-red-700"
                >
                  {api}
                </li>
              ))}
            </ul>
          )}

          {status?.updatedAt && (
            <p className="mt-3 text-xs text-slate-500">
              Last updated: {new Date(status.updatedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800">API pool</h2>
          <p className="mt-1 text-xs text-slate-500">
            Random 6 are picked from this list ({status?.poolSize ?? 0} total). Auth
            APIs are never stopped.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(status?.pool || []).map((api) => {
              const disabled = status?.disabledApis?.includes(api);
              return (
                <span
                  key={api}
                  className={`rounded-md px-2 py-1 font-mono text-[11px] ${
                    disabled
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {api}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
