'use client';

import { useEffect, useState } from 'react';
import { AdminChrome } from '../_components/AdminChrome';
import { AdminResetButton } from '../_components/AdminResetButton';
import { MAX_IMAGE_MB, MEDIA_HINTS, validateMediaFile } from '@/lib/media-limits';

type Course = {
  id: string;
  title: string;
  short_title?: string;
  badge?: string;
  description?: string;
  image?: string;
  duration?: string;
  eligibility?: string;
  mode?: string[];
  fee?: string;
  schedule?: string;
  sort_order?: number;
  is_published?: boolean;
  is_featured?: boolean;
};

const EMPTY: Course = {
  id: '',
  title: '',
  short_title: '',
  badge: '',
  description: '',
  image: '',
  duration: '',
  eligibility: '',
  mode: ['Online', 'Offline'],
  fee: '',
  schedule: '',
  sort_order: 0,
  is_published: true,
  is_featured: true
};

function mediaSrc(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }
  return `/${url}`;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export default function CoursesAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  async function load() {
    const res = await fetch('/api/admin/courses');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    setCourses(data.courses || []);
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, []);

  const visible = courses.filter((c) => {
    if (filter === 'visible') return c.is_published !== false;
    if (filter === 'hidden') return c.is_published === false;
    return true;
  });

  async function saveCourse(course: Course) {
    const payload = {
      ...course,
      mode: Array.isArray(course.mode)
        ? course.mode
        : String(course.mode || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    };
    const res = await fetch('/api/admin/courses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Save failed');
    }
  }

  async function save() {
    if (!selected) return;
    if (!selected.id.trim() || !selected.title.trim()) {
      setMsg('Course ID and title are required');
      return;
    }
    setSaving(true);
    try {
      await saveCourse(selected);
      setMsg(selected.id && courses.some((c) => c.id === selected.id) ? 'Course saved' : 'Course added');
      await load();
      setSelected({ ...selected });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(course: Course, next: boolean) {
    try {
      const updated = { ...course, is_published: next };
      await saveCourse(updated);
      setMsg(next ? `“${course.short_title || course.title}” is now visible on the website` : `“${course.short_title || course.title}” is hidden from the website`);
      await load();
      if (selected?.id === course.id) setSelected(updated);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Update failed');
    }
  }

  async function uploadImage(file: File) {
    if (!selected) return;
    const check = validateMediaFile(file);
    if (!check.ok) {
      setMsg(check.error);
      return;
    }
    if (check.kind !== 'image') {
      setMsg('Please upload an image (JPEG/PNG/WebP), not a video.');
      return;
    }
    setUploading(true);
    setMsg(`Uploading “${file.name}”…`);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'courses');
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSelected({ ...selected, image: data.url });
      setMsg(`Image uploaded. Recommended size: 1280×800 (16:10). Click Save course to apply.${data.warning ? ' ' + data.warning : ''}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function removeCourse(id: string) {
    if (!confirm(`Delete course “${id}”? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/courses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      setMsg('Delete failed');
      return;
    }
    setMsg('Course deleted');
    if (selected?.id === id) setSelected(null);
    await load();
  }

  function startNew() {
    setSelected({
      ...EMPTY,
      sort_order: courses.length + 1,
      id: '',
      title: ''
    });
    setMsg('Fill in the new course details, upload an image, then Save.');
  }

  return (
    <AdminChrome>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 6 }}>Courses</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>
            Show or hide courses on the live site, add new programmes, and upload card images (1280×800 recommended).
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button type="button" style={btnTeal} onClick={startNew}>
            + Add course
          </button>
          <AdminResetButton
            scope="courses"
            label="Reset courses to default"
            onDone={async () => {
              setSelected(null);
              await load().catch((e) => setMsg(e.message));
            }}
          />
        </div>
      </div>

      {msg ? (
        <p
          role="status"
          style={{
            margin: '14px 0',
            padding: '12px 14px',
            borderRadius: 10,
            background: '#f0fdfa',
            color: '#0f766e',
            border: '1px solid #99f6e4',
            fontWeight: 600,
            fontSize: 14
          }}
        >
          {msg}
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {(
          [
            ['all', `All (${courses.length})`],
            ['visible', `Visible (${courses.filter((c) => c.is_published !== false).length})`],
            ['hidden', `Hidden (${courses.filter((c) => c.is_published === false).length})`]
          ] as const
        ).map(([key, labelText]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            style={{
              ...chip,
              background: filter === key ? '#0d9488' : '#fff',
              color: filter === key ? '#fff' : '#334155',
              borderColor: filter === key ? '#0d9488' : '#cbd5e1'
            }}
          >
            {labelText}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 300px) 1fr', gap: 16 }}>
        <div style={card}>
          {visible.length === 0 ? <p style={{ color: '#64748b', margin: 0 }}>No courses in this filter.</p> : null}
          {visible.map((c) => {
            const published = c.is_published !== false;
            return (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 8,
                  padding: 8,
                  borderRadius: 12,
                  border: selected?.id === c.id ? '2px solid #0d9488' : '1px solid #e2e8f0',
                  background: published ? '#fff' : '#f8fafc',
                  opacity: published ? 1 : 0.75
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelected({
                      ...c,
                      mode: Array.isArray(c.mode) ? c.mode : []
                    })
                  }
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '4px 6px',
                    border: 0,
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ fontSize: 13, display: 'block' }}>{c.short_title || c.title}</strong>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {c.badge || '—'} · {published ? 'Visible' : 'Hidden'}
                  </span>
                </button>
                <button
                  type="button"
                  title={published ? 'Hide from website' : 'Show on website'}
                  onClick={() => togglePublished(c, !published)}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: '6px 10px',
                    border: 0,
                    cursor: 'pointer',
                    background: published ? '#ecfdf5' : '#fef2f2',
                    color: published ? '#047857' : '#b91c1c',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {published ? 'Hide' : 'Show'}
                </button>
              </div>
            );
          })}
        </div>

        <div style={card}>
          {!selected ? (
            <p style={{ color: '#64748b' }}>Select a course, or click “Add course”.</p>
          ) : (
            <>
              <label style={label}>Course ID (slug)</label>
              <input
                style={input}
                value={selected.id}
                disabled={courses.some((c) => c.id === selected.id)}
                onChange={(e) => setSelected({ ...selected, id: slugify(e.target.value) })}
                placeholder="e.g. montessori-teacher-training"
              />
              {!courses.some((c) => c.id === selected.id) ? (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                  ID is fixed after first save. Tip: leave blank and it will be created from the title when you type.
                </p>
              ) : null}

              <label style={label}>Title</label>
              <input
                style={input}
                value={selected.title}
                onChange={(e) => {
                  const title = e.target.value;
                  const next = { ...selected, title };
                  if (!courses.some((c) => c.id === selected.id) && !selected.id) {
                    next.id = slugify(title);
                  }
                  setSelected(next);
                }}
              />
              <label style={label}>Short title</label>
              <input
                style={input}
                value={selected.short_title || ''}
                onChange={(e) => setSelected({ ...selected, short_title: e.target.value })}
              />
              <label style={label}>Badge / role label</label>
              <input
                style={input}
                value={selected.badge || ''}
                onChange={(e) => setSelected({ ...selected, badge: e.target.value })}
              />
              <label style={label}>Description</label>
              <textarea
                style={{ ...input, minHeight: 100 }}
                value={selected.description || ''}
                onChange={(e) => setSelected({ ...selected, description: e.target.value })}
              />

              <label style={label}>Course image (card on website)</label>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                Best size: <strong>1280 × 800 px</strong> (16:10), JPEG/WebP, under {MAX_IMAGE_MB} MB. This fills the
                course card photo area on the homepage and course page.
              </p>
              <input
                style={input}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploading || saving}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file);
                  e.target.value = '';
                }}
              />
              <label style={label}>Image path / URL</label>
              <input
                style={input}
                value={selected.image || ''}
                onChange={(e) => setSelected({ ...selected, image: e.target.value })}
                placeholder="images/courses/my-course.jpg or uploaded URL"
              />
              {selected.image ? (
                <div
                  style={{
                    marginTop: 10,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    maxWidth: 420,
                    aspectRatio: '16 / 10',
                    background: '#e2e8f0'
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaSrc(selected.image)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : null}

              <label style={label}>Duration</label>
              <input
                style={input}
                value={selected.duration || ''}
                onChange={(e) => setSelected({ ...selected, duration: e.target.value })}
              />
              <label style={label}>Eligibility</label>
              <input
                style={input}
                value={selected.eligibility || ''}
                onChange={(e) => setSelected({ ...selected, eligibility: e.target.value })}
              />
              <label style={label}>Fee text</label>
              <input
                style={input}
                value={selected.fee || ''}
                onChange={(e) => setSelected({ ...selected, fee: e.target.value })}
              />
              <label style={label}>Modes (comma separated)</label>
              <input
                style={input}
                value={Array.isArray(selected.mode) ? selected.mode.join(', ') : ''}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    mode: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  })
                }
              />
              <label style={label}>Sort order</label>
              <input
                style={input}
                type="number"
                value={selected.sort_order || 0}
                onChange={(e) => setSelected({ ...selected, sort_order: Number(e.target.value) })}
              />

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
                <label style={{ ...label, display: 'flex', gap: 8, alignItems: 'center', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={selected.is_published !== false}
                    onChange={(e) => setSelected({ ...selected, is_published: e.target.checked })}
                  />
                  Show on website
                </label>
                <label style={{ ...label, display: 'flex', gap: 8, alignItems: 'center', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={selected.is_featured !== false}
                    onChange={(e) => setSelected({ ...selected, is_featured: e.target.checked })}
                  />
                  Featured in listings
                </label>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                <button style={{ ...btn, opacity: saving || uploading ? 0.7 : 1 }} type="button" onClick={save} disabled={saving || uploading}>
                  {saving ? 'Saving…' : uploading ? 'Uploading…' : 'Save course'}
                </button>
                {courses.some((c) => c.id === selected.id) ? (
                  <button
                    type="button"
                    style={{ ...btn, background: selected.is_published !== false ? '#b91c1c' : '#047857' }}
                    onClick={() => togglePublished(selected, selected.is_published === false)}
                  >
                    {selected.is_published !== false ? 'Hide from website' : 'Show on website'}
                  </button>
                ) : null}
                {courses.some((c) => c.id === selected.id) ? (
                  <button type="button" style={btnDanger} onClick={() => removeCourse(selected.id)}>
                    Delete
                  </button>
                ) : null}
              </div>
              <p style={{ marginTop: 10, fontSize: 12, color: '#64748b' }}>{MEDIA_HINTS.body}</p>
            </>
          )}
        </div>
      </div>
    </AdminChrome>
  );
}

const card: React.CSSProperties = {
  background: '#fff',
  padding: 16,
  borderRadius: 14,
  boxShadow: '0 8px 24px rgba(15,23,42,0.05)'
};
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 6px' };
const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box'
};
const btn: React.CSSProperties = {
  marginTop: 0,
  background: '#1d4ed8',
  color: '#fff',
  border: 0,
  borderRadius: 999,
  padding: '10px 18px',
  fontWeight: 700,
  cursor: 'pointer'
};
const btnTeal: React.CSSProperties = {
  ...btn,
  background: '#0d9488'
};
const btnDanger: React.CSSProperties = {
  ...btn,
  background: '#fff',
  color: '#b91c1c',
  border: '1px solid #fecaca'
};
const chip: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 12px',
  border: '1px solid',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer'
};
