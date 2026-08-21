'use client';

import { useState } from 'react';

type Props = {
  scope: string;
  label?: string;
  confirmText?: string;
  onDone?: () => void | Promise<void>;
  style?: React.CSSProperties;
};

export function AdminResetButton({
  scope,
  label = 'Reset to default',
  confirmText,
  onDone,
  style
}: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function run() {
    const ok = window.confirm(
      confirmText ||
        `Reset "${scope}" to the original folder data (public/data)? This overwrites current admin edits for this section.`
    );
    if (!ok) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setMsg(data.message || 'Reset complete');
      await onDone?.();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        disabled={busy}
        onClick={run}
        style={{
          background: '#fff',
          color: '#b45309',
          border: '1px solid #f59e0b',
          borderRadius: 999,
          padding: '8px 14px',
          fontWeight: 700,
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.7 : 1,
          ...style
        }}
      >
        {busy ? 'Resetting…' : label}
      </button>
      {msg ? <span style={{ fontSize: 12, color: msg.includes('fail') || msg.includes('Error') ? '#b91c1c' : '#64748b' }}>{msg}</span> : null}
    </div>
  );
}
