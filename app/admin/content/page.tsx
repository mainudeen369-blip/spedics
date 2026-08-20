'use client';

import { useEffect, useState } from 'react';
import { AdminChrome } from '../_components/AdminChrome';

const KEYS = ['about', 'admissions', 'fees', 'learning-modes', 'careers', 'affiliations-meta'];

export default function ContentAdminPage() {
  const [key, setKey] = useState('admissions');
  const [text, setText] = useState('{}');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/admin/content?key=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((d) => setText(JSON.stringify(d.data || {}, null, 2)))
      .catch((e) => setMsg(String(e)));
  }, [key]);

  async function save() {
    try {
      const data = JSON.parse(text);
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
      });
      setMsg(res.ok ? `Saved ${key}` : 'Save failed');
    } catch {
      setMsg('Invalid JSON');
    }
  }

  return (
    <AdminChrome>
      <h1 style={{ marginTop: 0 }}>Content JSON</h1>
      <p style={{ color: '#64748b' }}>Edit structured sections (admissions marquee, fees packages, about text, etc.).</p>
      {msg ? <p style={{ color: '#1d4ed8' }}>{msg}</p> : null}
      <label style={label}>Document</label>
      <select style={input} value={key} onChange={(e) => setKey(e.target.value)}>
        {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
      <textarea style={{ ...input, minHeight: 420, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13 }} value={text} onChange={(e) => setText(e.target.value)} />
      <button style={btn} type="button" onClick={save}>Save JSON</button>
    </AdminChrome>
  );
}

const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 6px' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box', marginBottom: 12 };
const btn: React.CSSProperties = { background: '#1d4ed8', color: '#fff', border: 0, borderRadius: 999, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' };
