'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminChrome } from '../_components/AdminChrome';
import { AdminResetButton } from '../_components/AdminResetButton';
import { MAX_IMAGE_MB, validateMediaFile } from '@/lib/media-limits';

type Doc = Record<string, any>;

export default function AffiliationsAdminPage() {
  const [data, setData] = useState<Doc>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/content?key=affiliations-meta');
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Load failed');
      setData(d.data && typeof d.data === 'object' ? d.data : {});
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
      setData({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'affiliations-meta', data })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Save failed');
      setMsg('Affiliations saved — live Recognition & Affiliation section updated.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const list: Array<Record<string, string>> = Array.isArray(data.affiliations) ? data.affiliations : [];

  async function uploadAffiliationImage(idx: number, field: 'logo' | 'banner', file: File) {
    const check = validateMediaFile(file);
    if (!check.ok) {
      setMsg(check.error);
      return;
    }
    if (check.kind !== 'image') {
      setMsg('Please upload an image (JPEG/PNG/WebP/GIF).');
      return;
    }
    setUploadBusy(true);
    setMsg(`Uploading “${file.name}”…`);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'affiliations');
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Upload failed');
      const next = [...list];
      next[idx] = { ...next[idx], [field]: payload.url || '' };
      setData({ ...data, affiliations: next });
      setMsg(
        `${field === 'logo' ? 'Logo' : 'Banner'} uploaded. Click Save affiliations to publish.${
          payload.warning ? ` ${payload.warning}` : ''
        }`
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadBusy(false);
    }
  }

  return (
    <AdminChrome>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 6 }}>Affiliations</h1>
          <p style={{ color: '#64748b', margin: 0, maxWidth: 560 }}>
            Manage Recognition & Affiliation partners, logos and banners shown on the homepage.
          </p>
        </div>
        <AdminResetButton
          scope="content:affiliations-meta"
          label="Reset affiliations to default"
          confirmText="Reset affiliations from public/data/affiliations.json? Current edits will be overwritten."
          onDone={() => load()}
        />
      </div>

      {msg ? (
        <p
          style={{
            color:
              msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('error')
                ? '#b91c1c'
                : '#0f766e'
          }}
        >
          {msg}
        </p>
      ) : null}

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading…</p>
      ) : (
        <>
          <section style={card}>
            <Field label="Title" value={data.title || ''} onChange={(v) => setData({ ...data, title: v })} />
            <Field
              label="Subtitle"
              value={data.subtitle || ''}
              onChange={(v) => setData({ ...data, subtitle: v })}
            />
            <Field
              label="Note"
              value={data.note || ''}
              onChange={(v) => setData({ ...data, note: v })}
              multiline
            />
          </section>

          <section style={card}>
            <h2 style={h2}>Partners</h2>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Upload logo and banner images (max {MAX_IMAGE_MB} MB each). After upload, click{' '}
              <strong>Save affiliations</strong> so the live site updates.
            </p>
            {list.map((a, idx) => (
              <div key={idx} style={subCard}>
                <Field
                  label="Name"
                  value={a.name || ''}
                  onChange={(v) => {
                    const next = [...list];
                    next[idx] = { ...a, name: v };
                    setData({ ...data, affiliations: next });
                  }}
                />
                <Field
                  label="Affiliation no."
                  value={a.affiliationNo || ''}
                  onChange={(v) => {
                    const next = [...list];
                    next[idx] = { ...a, affiliationNo: v };
                    setData({ ...data, affiliations: next });
                  }}
                />
                <Field
                  label="Period"
                  value={a.period || ''}
                  onChange={(v) => {
                    const next = [...list];
                    next[idx] = { ...a, period: v };
                    setData({ ...data, affiliations: next });
                  }}
                />
                <Field
                  label="Govt reg no."
                  value={a.govtRegNo || ''}
                  onChange={(v) => {
                    const next = [...list];
                    next[idx] = { ...a, govtRegNo: v };
                    setData({ ...data, affiliations: next });
                  }}
                />
                <MediaField
                  label="Logo"
                  hint="Square or circular logo works best (list + partner strip)."
                  value={a.logo || ''}
                  disabled={uploadBusy}
                  previewStyle={{ maxWidth: 120, aspectRatio: '1 / 1', objectFit: 'contain' }}
                  onChange={(v) => {
                    const next = [...list];
                    next[idx] = { ...a, logo: v };
                    setData({ ...data, affiliations: next });
                  }}
                  onUpload={(file) => uploadAffiliationImage(idx, 'logo', file)}
                />
                <MediaField
                  label="Banner image (optional)"
                  hint="Wide credential banner under the affiliation text."
                  value={a.banner || ''}
                  disabled={uploadBusy}
                  previewStyle={{ maxWidth: 520, aspectRatio: '16 / 5', objectFit: 'contain' }}
                  onChange={(v) => {
                    const next = [...list];
                    next[idx] = { ...a, banner: v };
                    setData({ ...data, affiliations: next });
                  }}
                  onUpload={(file) => uploadAffiliationImage(idx, 'banner', file)}
                />
                <Field
                  label="Detail / content"
                  value={a.detail || ''}
                  onChange={(v) => {
                    const next = [...list];
                    next[idx] = { ...a, detail: v };
                    setData({ ...data, affiliations: next });
                  }}
                  multiline
                />
                <button
                  type="button"
                  style={dangerBtn}
                  onClick={() => setData({ ...data, affiliations: list.filter((_, i) => i !== idx) })}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              style={secondaryBtn}
              onClick={() =>
                setData({
                  ...data,
                  affiliations: [
                    ...list,
                    { name: '', affiliationNo: '', period: '', govtRegNo: '', logo: '', banner: '', detail: '' }
                  ]
                })
              }
            >
              Add affiliation
            </button>
          </section>
        </>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button style={btn} type="button" disabled={busy || loading || uploadBusy} onClick={save}>
          {uploadBusy ? 'Uploading…' : busy ? 'Saving…' : 'Save affiliations'}
        </button>
      </div>
    </AdminChrome>
  );
}

function previewSrc(url: string) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (/^(https?:)?\/\//i.test(s) || s.startsWith('data:') || s.startsWith('/')) return s;
  return `/${s}`;
}

function MediaField({
  label: labelText,
  hint,
  value,
  previewStyle,
  disabled,
  onChange,
  onUpload
}: {
  label: string;
  hint?: string;
  value: string;
  disabled?: boolean;
  previewStyle?: React.CSSProperties;
  onChange: (v: string) => void;
  onUpload: (file: File) => void | Promise<void>;
}) {
  const src = previewSrc(value);
  return (
    <div style={{ marginTop: 4 }}>
      <label style={label}>{labelText}</label>
      {hint ? (
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>{hint}</p>
      ) : null}
      <input
        style={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onUpload(file);
          e.target.value = '';
        }}
      />
      <label style={{ ...label, marginTop: 8 }}>{labelText} path / URL</label>
      <input
        style={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="images/certificates/… or URL from upload"
      />
      {src ? (
        <div
          style={{
            marginTop: 10,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            background: '#fff',
            padding: 8,
            maxWidth: previewStyle?.maxWidth || 420
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            style={{ width: '100%', display: 'block', background: '#f8fafc', ...previewStyle }}
          />
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label: labelText,
  value,
  onChange,
  multiline
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <>
      <label style={label}>{labelText}</label>
      {multiline ? (
        <textarea style={{ ...input, minHeight: 90 }} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input style={input} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </>
  );
}

const card: React.CSSProperties = {
  background: '#fff',
  padding: 16,
  borderRadius: 14,
  boxShadow: '0 8px 24px rgba(15,23,42,0.05)',
  marginBottom: 14
};
const subCard: React.CSSProperties = {
  background: '#f8fafc',
  padding: 12,
  borderRadius: 12,
  marginBottom: 10,
  border: '1px solid #e2e8f0'
};
const h2: React.CSSProperties = { margin: '0 0 8px', fontSize: 16 };
const label: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  margin: '10px 0 6px'
};
const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
  marginBottom: 4
};
const btn: React.CSSProperties = {
  background: '#0d9488',
  color: '#fff',
  border: 0,
  borderRadius: 999,
  padding: '10px 18px',
  fontWeight: 700,
  cursor: 'pointer'
};
const secondaryBtn: React.CSSProperties = {
  ...btn,
  background: '#0f172a',
  marginTop: 8
};
const dangerBtn: React.CSSProperties = {
  ...btn,
  background: '#b91c1c',
  marginTop: 8,
  padding: '8px 14px',
  fontSize: 13
};
