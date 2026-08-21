'use client';

import { useEffect, useState } from 'react';
import { AdminChrome } from '../_components/AdminChrome';
import { AdminResetButton } from '../_components/AdminResetButton';

type Faq = { id?: string; question: string; answer: string; answer_with_fees?: string };

export default function FaqAdminPage() {
  const [items, setItems] = useState<Faq[]>([]);
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch('/api/admin/faq');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    setItems(data.items || []);
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, []);

  async function saveAll() {
    const res = await fetch('/api/admin/faq', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    setMsg(res.ok ? 'FAQ saved' : 'Save failed');
    await load();
  }

  return (
    <AdminChrome>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <h1 style={{ marginTop: 0 }}>FAQ</h1>
        <AdminResetButton scope="faq" label="Reset FAQ to default" onDone={() => load().catch((e) => setMsg(e.message))} />
      </div>
      {msg ? <p style={{ color: '#1d4ed8' }}>{msg}</p> : null}
      <button style={btn} type="button" onClick={() => setItems([...items, { question: '', answer: '' }])}>Add question</button>
      <button style={{ ...btn, marginLeft: 8, background: '#0f172a' }} type="button" onClick={saveAll}>Save all</button>
      <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
        {items.map((item, idx) => (
          <div key={item.id || idx} style={card}>
            <label style={label}>Question</label>
            <input style={input} value={item.question} onChange={(e) => {
              const next = [...items];
              next[idx] = { ...item, question: e.target.value };
              setItems(next);
            }} />
            <label style={label}>Answer</label>
            <textarea style={{ ...input, minHeight: 80 }} value={item.answer} onChange={(e) => {
              const next = [...items];
              next[idx] = { ...item, answer: e.target.value };
              setItems(next);
            }} />
            <label style={label}>Answer when fees visible (optional)</label>
            <textarea style={{ ...input, minHeight: 60 }} value={item.answer_with_fees || ''} onChange={(e) => {
              const next = [...items];
              next[idx] = { ...item, answer_with_fees: e.target.value };
              setItems(next);
            }} />
            <button type="button" style={{ ...btn, background: '#b91c1c', marginTop: 10 }} onClick={() => setItems(items.filter((_, i) => i !== idx))}>Remove</button>
          </div>
        ))}
      </div>
    </AdminChrome>
  );
}

const card: React.CSSProperties = { background: '#fff', padding: 16, borderRadius: 14, boxShadow: '0 8px 24px rgba(15,23,42,0.05)' };
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 6px' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box' };
const btn: React.CSSProperties = { background: '#1d4ed8', color: '#fff', border: 0, borderRadius: 999, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' };
