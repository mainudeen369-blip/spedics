'use client';

import { useEffect, useRef, useState } from 'react';
import { AdminChrome } from '../_components/AdminChrome';
import {
  MAX_GALLERY_ITEMS,
  MAX_IMAGE_MB,
  MAX_VIDEO_MB,
  MEDIA_HINTS,
  RECOMMENDED_GALLERY_ITEMS,
  validateMediaFile
} from '@/lib/media-limits';
import { AdminResetButton } from '../_components/AdminResetButton';

type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  file_name?: string;
  image_url?: string;
  category?: string;
  sort_order?: number;
  is_published?: boolean;
};

type Notice = { kind: 'info' | 'success' | 'error'; text: string } | null;

function isVideoUrl(url?: string) {
  if (!url) return false;
  const check = url.includes('pathname=') ? decodeURIComponent(url) : url;
  return /\.(mp4|webm|mov)(\?|$)/i.test(check) || check.includes('video') || check.startsWith('data:video');
}

function mediaSrc(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

function MediaThumb({ url, large }: { url?: string; large?: boolean }) {
  const src = mediaSrc(url);
  if (!src) {
    return (
      <div
        style={{
          width: large ? '100%' : 96,
          height: large ? 180 : 64,
          maxWidth: large ? '100%' : 96,
          borderRadius: 8,
          background: '#e2e8f0',
          display: 'grid',
          placeItems: 'center',
          color: '#94a3b8',
          fontSize: 12
        }}
      >
        No media
      </div>
    );
  }
  if (isVideoUrl(url)) {
    return (
      <video
        src={src}
        controls={large}
        style={{
          width: large ? '100%' : 96,
          maxWidth: '100%',
          height: large ? 180 : 64,
          objectFit: 'cover',
          borderRadius: 8,
          background: '#e2e8f0'
        }}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt=""
      style={{
        width: large ? '100%' : 96,
        maxWidth: '100%',
        height: large ? 180 : 64,
        objectFit: 'cover',
        borderRadius: 8,
        background: '#e2e8f0'
      }}
    />
  );
}

async function readError(res: Response) {
  const text = await res.text();
  try {
    const data = JSON.parse(text) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    /* not JSON */
  }
  if (res.status === 503) return 'Upload service unavailable (503). Media storage may not be configured.';
  return text.slice(0, 200) || `Request failed (${res.status})`;
}

export default function GalleryAdminPage() {
  const [meta, setMeta] = useState({ title: '', subtitle: '' });
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [form, setForm] = useState<GalleryItem>({ id: '', title: '', description: '', image_url: '', category: '', sort_order: 0, is_published: true });
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadReady, setUploadReady] = useState<{ blobConfigured: boolean; message: string } | null>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  function showNotice(next: Notice) {
    setNotice(next);
    requestAnimationFrame(() => {
      noticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  async function load() {
    const res = await fetch('/api/admin/gallery');
    if (!res.ok) throw new Error(await readError(res));
    const data = await res.json();
    setMeta(data.meta);
    setItems(data.items || []);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([
      load(),
      fetch('/api/admin/upload')
        .then(async (res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .catch(() => null)
    ])
      .then(([, status]) => {
        if (status) {
          setUploadReady({
            blobConfigured: Boolean(status.blobConfigured),
            message: status.message || ''
          });
        }
      })
      .catch((e) => showNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Failed to load gallery' }))
      .finally(() => setLoading(false));
  }, []);

  async function saveMeta() {
    setSavingMeta(true);
    showNotice({ kind: 'info', text: 'Saving section…' });
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta })
      });
      if (!res.ok) throw new Error(await readError(res));
      showNotice({ kind: 'success', text: 'Section saved successfully.' });
    } catch (e) {
      showNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSavingMeta(false);
    }
  }

  async function uploadFile(file: File) {
    const check = validateMediaFile(file);
    if (!check.ok) {
      showNotice({ kind: 'error', text: check.error });
      return;
    }
    if (items.length >= MAX_GALLERY_ITEMS && !items.some((i) => i.id === form.id)) {
      showNotice({
        kind: 'error',
        text: `Gallery is full (${MAX_GALLERY_ITEMS} items). Delete some items first — too many media files slow the website.`
      });
      return;
    }

    setUploading(true);
    showNotice({ kind: 'info', text: `Uploading “${file.name}”… please wait` });
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'gallery');
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      if (!res.ok) throw new Error(await readError(res));
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        image_url: data.url,
        file_name: data.fileName || file.name,
        id: prev.id || file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
      }));
      const warn = data.warning ? ` ${data.warning}` : '';
      showNotice({ kind: 'success', text: `Upload successful.${warn} Click Save item to add it to the gallery.` });
    } catch (e) {
      showNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Upload failed' });
    } finally {
      setUploading(false);
    }
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image_url?.trim()) {
      showNotice({ kind: 'error', text: 'Upload a photo/video (or paste a media URL) before saving.' });
      return;
    }
    setSavingItem(true);
    showNotice({ kind: 'info', text: 'Saving item… please wait' });
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error(await readError(res));
      showNotice({ kind: 'success', text: `“${form.title}” saved successfully.` });
      setForm({ id: '', title: '', description: '', image_url: '', category: '', sort_order: items.length + 1, is_published: true });
      await load();
    } catch (e) {
      showNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Save failed' });
    } finally {
      setSavingItem(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(`Delete ${id}?`)) return;
    setDeleting(true);
    showNotice({ kind: 'info', text: 'Deleting… please wait' });
    try {
      const res = await fetch(`/api/admin/gallery?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readError(res));
      showNotice({ kind: 'success', text: 'Item deleted.' });
      await load();
    } catch (e) {
      showNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Delete failed' });
    } finally {
      setDeleting(false);
    }
  }

  const busy = uploading || savingItem || savingMeta || deleting;
  const busyLabel = uploading
    ? 'Uploading…'
    : savingItem
      ? 'Saving item…'
      : savingMeta
        ? 'Saving section…'
        : deleting
          ? 'Deleting…'
          : '';
  const nearLimit = items.length >= RECOMMENDED_GALLERY_ITEMS;

  return (
    <AdminChrome>
      {busy ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center'
          }}
          aria-live="assertive"
          aria-busy="true"
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '28px 36px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              textAlign: 'center',
              minWidth: 240
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                margin: '0 auto 14px',
                border: '4px solid #99f6e4',
                borderTopColor: '#0d9488',
                borderRadius: '50%',
                animation: 'spedics-spin 0.8s linear infinite'
              }}
            />
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{busyLabel}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Please wait</div>
          </div>
          <style>{`@keyframes spedics-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 6 }}>Gallery</h1>
          <p style={{ color: '#64748b', marginTop: 0 }}>Upload photos or videos, then save each item with a title and description.</p>
        </div>
        <AdminResetButton
          scope="gallery"
          label="Reset gallery to default"
          confirmText="Reset gallery from public/data/gallery folders? Custom Blob uploads will be replaced by seed folder images."
          onDone={() => load()}
        />
      </div>

      <div
        style={{
          margin: '0 0 16px',
          padding: '14px 16px',
          borderRadius: 12,
          background: '#f0fdfa',
          border: '1px solid #99f6e4',
          color: '#115e59',
          fontSize: 14,
          lineHeight: 1.55
        }}
      >
        <strong>{MEDIA_HINTS.title}.</strong> {MEDIA_HINTS.body}
        <div style={{ marginTop: 8, fontWeight: 700 }}>
          Now: {loading ? '…' : items.length} / {MAX_GALLERY_ITEMS} items
          {nearLimit ? ' — consider deleting unused photos so the site stays fast.' : ''}
        </div>
      </div>

      <div ref={noticeRef}>
        {uploadReady && !uploadReady.blobConfigured ? (
          <p
            style={{
              margin: '0 0 12px',
              padding: '12px 14px',
              borderRadius: 10,
              background: '#fff7ed',
              color: '#9a3412',
              border: '1px solid #fed7aa',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Photo storage not fully configured yet. Prefer small compressed files (images ≤ {MAX_IMAGE_MB} MB).
          </p>
        ) : null}
        {notice ? (
          <p
            role="status"
            style={{
              margin: '0 0 16px',
              padding: '14px 16px',
              borderRadius: 10,
              background: notice.kind === 'error' ? '#fef2f2' : notice.kind === 'success' ? '#ecfdf5' : '#eff6ff',
              color: notice.kind === 'error' ? '#b91c1c' : notice.kind === 'success' ? '#047857' : '#0f766e',
              border: `1px solid ${notice.kind === 'error' ? '#fecaca' : notice.kind === 'success' ? '#a7f3d0' : '#99f6e4'}`,
              fontWeight: 700,
              fontSize: 15
            }}
          >
            {notice.kind === 'info' ? '⏳ ' : notice.kind === 'success' ? '✓ ' : '⚠ '}
            {notice.text}
          </p>
        ) : null}
      </div>

      <section style={card}>
        <h2>Section text</h2>
        <label style={label}>Title</label>
        <input style={input} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} disabled={busy} />
        <label style={label}>Subtitle</label>
        <input style={input} value={meta.subtitle} onChange={(e) => setMeta({ ...meta, subtitle: e.target.value })} disabled={busy} />
        <button style={{ ...btn, opacity: busy ? 0.7 : 1 }} type="button" onClick={saveMeta} disabled={busy}>
          {savingMeta ? 'Saving…' : 'Save section'}
        </button>
      </section>

      <section style={card}>
        <h2>Add / update item</h2>
        <form onSubmit={saveItem}>
          <label style={label}>Upload photo (≤ {MAX_IMAGE_MB} MB) or video (≤ {MAX_VIDEO_MB} MB)</label>
          <input
            style={input}
            type="file"
            accept={MEDIA_HINTS.accept}
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
              e.target.value = '';
            }}
          />
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>
            Tip: compress images before upload (WebP/JPEG). Large files make the public site slower.
          </p>
          <label style={label}>ID (slug)</label>
          <input style={input} required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="nursery-place-value-lesson" disabled={busy} />
          <label style={label}>Title</label>
          <input style={input} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={busy} />
          <label style={label}>Description</label>
          <textarea style={{ ...input, minHeight: 80 }} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={busy} />
          <label style={label}>Media URL (auto-filled after upload)</label>
          <input style={input} value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Upload a file, or paste a media URL" disabled={busy} />
          {form.image_url ? (
            <div style={{ marginTop: 10 }}>
              <MediaThumb url={form.image_url} large />
            </div>
          ) : null}
          <label style={label}>Category</label>
          <input style={input} value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} disabled={busy} />
          <label style={label}>Sort order</label>
          <input style={input} type="number" value={form.sort_order || 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} disabled={busy} />
          <label style={{ ...label, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={form.is_published !== false} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} disabled={busy} />
            Published
          </label>
          <button style={{ ...btn, opacity: busy ? 0.7 : 1 }} type="submit" disabled={busy}>
            {savingItem ? 'Saving…' : 'Save item'}
          </button>
        </form>
      </section>

      <section style={card}>
        <h2>Existing ({loading ? '…' : `${items.length} / ${MAX_GALLERY_ITEMS}`})</h2>
        {loading ? <p style={{ color: '#64748b' }}>Loading…</p> : null}
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: 12, alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 12, padding: 10 }}>
              <MediaThumb url={item.image_url} />
              <div>
                <strong>{item.title}</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>{item.id} · {item.category} · #{item.sort_order}</div>
                <div style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>{item.image_url || '(no media URL)'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={btnSecondary} onClick={() => setForm(item)} disabled={busy}>Edit</button>
                <button type="button" style={{ ...btnSecondary, color: '#b91c1c' }} onClick={() => remove(item.id)} disabled={busy}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminChrome>
  );
}

const card: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 14, marginBottom: 18, boxShadow: '0 8px 24px rgba(15,23,42,0.05)' };
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 6px' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box' };
const btn: React.CSSProperties = { marginTop: 14, background: '#0d9488', color: '#fff', border: 0, borderRadius: 999, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' };
