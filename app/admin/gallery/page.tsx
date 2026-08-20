'use client';

import { useEffect, useState } from 'react';
import { AdminChrome } from '../_components/AdminChrome';

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

function isVideoUrl(url?: string) {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('video');
}

export default function GalleryAdminPage() {
  const [meta, setMeta] = useState({ title: '', subtitle: '' });
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [form, setForm] = useState<GalleryItem>({ id: '', title: '', description: '', image_url: '', category: '', sort_order: 0, is_published: true });
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/gallery');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    setMeta(data.meta);
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, []);

  async function saveMeta() {
    const res = await fetch('/api/admin/gallery', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta })
    });
    setMsg(res.ok ? 'Gallery title saved' : 'Save failed');
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setMsg('Uploading to Vercel Blob…');
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'gallery');
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm((prev) => ({
        ...prev,
        image_url: data.url,
        file_name: data.fileName || file.name,
        id: prev.id || file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
      }));
      setMsg(`Uploaded (${data.kind}). Click Save item to store in gallery.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (!res.ok) {
      const data = await res.json();
      setMsg(data.error || 'Save failed');
      return;
    }
    setMsg('Item saved');
    setForm({ id: '', title: '', description: '', image_url: '', category: '', sort_order: items.length, is_published: true });
    await load();
  }

  async function remove(id: string) {
    if (!confirm(`Delete ${id}?`)) return;
    await fetch(`/api/admin/gallery?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <AdminChrome>
      <h1 style={{ marginTop: 0 }}>Gallery</h1>
      <p style={{ color: '#64748b', marginTop: 0 }}>Photos and videos upload to <strong>Vercel Blob</strong>. Neon only stores the URL and text.</p>
      {msg ? <p style={{ color: '#1d4ed8' }}>{msg}</p> : null}

      <section style={card}>
        <h2>Section text</h2>
        <label style={label}>Title</label>
        <input style={input} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
        <label style={label}>Subtitle</label>
        <input style={input} value={meta.subtitle} onChange={(e) => setMeta({ ...meta, subtitle: e.target.value })} />
        <button style={btn} type="button" onClick={saveMeta}>Save section</button>
      </section>

      <section style={card}>
        <h2>Add / update item</h2>
        <form onSubmit={saveItem}>
          <label style={label}>Upload photo or video (Vercel Blob)</label>
          <input
            style={input}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <label style={label}>ID (slug)</label>
          <input style={input} required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="nursery-place-value-lesson" />
          <label style={label}>Title</label>
          <input style={input} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label style={label}>Description</label>
          <textarea style={{ ...input, minHeight: 80 }} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label style={label}>Media URL (auto-filled after upload)</label>
          <input style={input} value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://….public.blob.vercel-storage.com/…" />
          {form.image_url ? (
            <div style={{ marginTop: 10 }}>
              {isVideoUrl(form.image_url) ? (
                <video src={form.image_url} controls style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8 }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, objectFit: 'cover' }} />
              )}
            </div>
          ) : null}
          <label style={label}>Category</label>
          <input style={input} value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <label style={label}>Sort order</label>
          <input style={input} type="number" value={form.sort_order || 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          <label style={{ ...label, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={form.is_published !== false} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            Published
          </label>
          <button style={btn} type="submit" disabled={uploading}>Save item</button>
        </form>
      </section>

      <section style={card}>
        <h2>Existing ({items.length})</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: 12, alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 12, padding: 10 }}>
              {isVideoUrl(item.image_url) ? (
                <video src={item.image_url} style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 8, background: '#e2e8f0' }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url || ''} alt="" style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 8, background: '#e2e8f0' }} />
              )}
              <div>
                <strong>{item.title}</strong>
                <div style={{ fontSize: 12, color: '#64748b' }}>{item.id} · {item.category} · #{item.sort_order}</div>
                <div style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>{item.image_url}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={btnSecondary} onClick={() => setForm(item)}>Edit</button>
                <button type="button" style={{ ...btnSecondary, color: '#b91c1c' }} onClick={() => remove(item.id)}>Delete</button>
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
const btn: React.CSSProperties = { marginTop: 14, background: '#1d4ed8', color: '#fff', border: 0, borderRadius: 999, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' };
