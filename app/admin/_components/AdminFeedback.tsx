'use client';

export type AdminNotice = { kind: 'info' | 'success' | 'error'; text: string } | null;

export function AdminStatusBanner({ notice }: { notice: AdminNotice }) {
  if (!notice) return null;
  const bg = notice.kind === 'error' ? '#fef2f2' : notice.kind === 'success' ? '#ecfdf5' : '#eff6ff';
  const color = notice.kind === 'error' ? '#b91c1c' : notice.kind === 'success' ? '#047857' : '#1d4ed8';
  const border = notice.kind === 'error' ? '#fecaca' : notice.kind === 'success' ? '#a7f3d0' : '#bfdbfe';
  return (
    <p
      role="status"
      aria-live="polite"
      style={{
        margin: '0 0 16px',
        padding: '12px 14px',
        borderRadius: 10,
        background: bg,
        color,
        border: `1px solid ${border}`,
        fontWeight: 700
      }}
    >
      {notice.kind === 'info' ? '⏳ ' : notice.kind === 'success' ? '✓ ' : '✕ '}
      {notice.text}
    </p>
  );
}

/** Full-page dim overlay with spinner while saving/uploading */
export function AdminBusyOverlay({ active, label = 'Saving…' }: { active: boolean; label?: string }) {
  if (!active) return null;
  return (
    <div
      role="alert"
      aria-busy="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.35)',
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'all'
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '22px 28px',
          boxShadow: '0 20px 50px rgba(15,23,42,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          minWidth: 200
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '3px solid #bfdbfe',
            borderTopColor: '#1d4ed8',
            display: 'inline-block',
            animation: 'spedics-spin 0.7s linear infinite'
          }}
        />
        <strong style={{ color: '#0f172a', fontSize: 16 }}>{label}</strong>
      </div>
      <style>{`@keyframes spedics-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function busyButtonStyle(base: React.CSSProperties, busy: boolean): React.CSSProperties {
  return {
    ...base,
    opacity: busy ? 0.75 : 1,
    cursor: busy ? 'wait' : 'pointer'
  };
}
