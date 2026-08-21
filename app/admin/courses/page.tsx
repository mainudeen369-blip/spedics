'use client';

import { useEffect, useState } from 'react';
import { AdminChrome } from '../_components/AdminChrome';
import { AdminResetButton } from '../_components/AdminResetButton';

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
};

export default function CoursesAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch('/api/admin/courses');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    setCourses(data.courses || []);
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, []);

  async function save() {
    if (!selected) return;
    const payload = {
      ...selected,
      mode: Array.isArray(selected.mode)
        ? selected.mode
        : String(selected.mode || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    };
    const res = await fetch('/api/admin/courses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setMsg(res.ok ? 'Course saved' : 'Save failed');
    await load();
  }

  return (
    <AdminChrome>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <h1 style={{ marginTop: 0 }}>Courses</h1>
        <AdminResetButton
          scope="courses"
          label="Reset courses to default"
          onDone={async () => {
            setSelected(null);
            await load().catch((e) => setMsg(e.message));
          }}
        />
      </div>
      {msg ? <p style={{ color: '#1d4ed8' }}>{msg}</p> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <div style={card}>
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected({
                ...c,
                mode: Array.isArray(c.mode) ? c.mode : []
              })}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                marginBottom: 6,
                borderRadius: 10,
                border: selected?.id === c.id ? '2px solid #1d4ed8' : '1px solid #e2e8f0',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <strong style={{ fontSize: 13 }}>{c.short_title || c.title}</strong>
              <div style={{ fontSize: 11, color: '#64748b' }}>{c.badge}</div>
            </button>
          ))}
        </div>
        <div style={card}>
          {!selected ? <p>Select a course</p> : (
            <>
              <label style={label}>Title</label>
              <input style={input} value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
              <label style={label}>Short title</label>
              <input style={input} value={selected.short_title || ''} onChange={(e) => setSelected({ ...selected, short_title: e.target.value })} />
              <label style={label}>Badge / role label</label>
              <input style={input} value={selected.badge || ''} onChange={(e) => setSelected({ ...selected, badge: e.target.value })} />
              <label style={label}>Description</label>
              <textarea style={{ ...input, minHeight: 100 }} value={selected.description || ''} onChange={(e) => setSelected({ ...selected, description: e.target.value })} />
              <label style={label}>Image path</label>
              <input style={input} value={selected.image || ''} onChange={(e) => setSelected({ ...selected, image: e.target.value })} />
              <label style={label}>Duration</label>
              <input style={input} value={selected.duration || ''} onChange={(e) => setSelected({ ...selected, duration: e.target.value })} />
              <label style={label}>Fee text</label>
              <input style={input} value={selected.fee || ''} onChange={(e) => setSelected({ ...selected, fee: e.target.value })} />
              <label style={label}>Modes (comma separated)</label>
              <input
                style={input}
                value={Array.isArray(selected.mode) ? selected.mode.join(', ') : ''}
                onChange={(e) => setSelected({ ...selected, mode: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              />
              <label style={label}>Sort order</label>
              <input style={input} type="number" value={selected.sort_order || 0} onChange={(e) => setSelected({ ...selected, sort_order: Number(e.target.value) })} />
              <label style={{ ...label, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={selected.is_published !== false} onChange={(e) => setSelected({ ...selected, is_published: e.target.checked })} />
                Published
              </label>
              <button style={btn} type="button" onClick={save}>Save course</button>
            </>
          )}
        </div>
      </div>
    </AdminChrome>
  );
}

const card: React.CSSProperties = { background: '#fff', padding: 16, borderRadius: 14, boxShadow: '0 8px 24px rgba(15,23,42,0.05)' };
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 6px' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box' };
const btn: React.CSSProperties = { marginTop: 14, background: '#1d4ed8', color: '#fff', border: 0, borderRadius: 999, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' };
