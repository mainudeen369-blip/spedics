'use client';

import { useEffect, useState } from 'react';
import { AdminChrome } from '../_components/AdminChrome';

const THEME_KEYS = [
  ['primary', 'Primary'],
  ['primaryLight', 'Primary light'],
  ['primaryDark', 'Primary dark'],
  ['accent', 'Accent'],
  ['accentLight', 'Accent light'],
  ['bg', 'Background'],
  ['bgWarm', 'Background warm'],
  ['text', 'Text'],
  ['textMuted', 'Text muted'],
  ['dark', 'Dark']
] as const;

export default function SiteAdminPage() {
  const [data, setData] = useState<any>({});
  const [theme, setTheme] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/site')
      .then((r) => r.json())
      .then((d) => {
        setData(d.data || {});
        setTheme(d.theme || {});
      })
      .catch((e) => setMsg(String(e)));
  }, []);

  async function save() {
    const res = await fetch('/api/admin/site', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, theme })
    });
    setMsg(res.ok ? 'Saved site settings & colours' : 'Save failed');
  }

  const contact = data.contact || {};

  return (
    <AdminChrome>
      <h1 style={{ marginTop: 0 }}>Site & Colours</h1>
      {msg ? <p style={{ color: '#1d4ed8' }}>{msg}</p> : null}

      <section style={card}>
        <h2>Brand</h2>
        <label style={label}>Institute name</label>
        <input style={input} value={data.name || ''} onChange={(e) => setData({ ...data, name: e.target.value })} />
        <label style={label}>Short name</label>
        <input style={input} value={data.shortName || ''} onChange={(e) => setData({ ...data, shortName: e.target.value })} />
        <label style={label}>Tagline</label>
        <input style={input} value={data.tagline || ''} onChange={(e) => setData({ ...data, tagline: e.target.value })} />
      </section>

      <section style={card}>
        <h2>Contact</h2>
        <label style={label}>Phone</label>
        <input style={input} value={contact.phone || ''} onChange={(e) => setData({ ...data, contact: { ...contact, phone: e.target.value } })} />
        <label style={label}>WhatsApp</label>
        <input style={input} value={contact.whatsapp || ''} onChange={(e) => setData({ ...data, contact: { ...contact, whatsapp: e.target.value } })} />
        <label style={label}>Email</label>
        <input style={input} value={contact.email || ''} onChange={(e) => setData({ ...data, contact: { ...contact, email: e.target.value } })} />
        <label style={label}>Address</label>
        <input style={input} value={contact.address || ''} onChange={(e) => setData({ ...data, contact: { ...contact, address: e.target.value } })} />
      </section>

      <section style={card}>
        <h2>Fees & WhatsApp copy</h2>
        <label style={{ ...label, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={!!data.displayFees} onChange={(e) => setData({ ...data, displayFees: e.target.checked })} />
          Display fee amounts publicly
        </label>
        <label style={label}>Fee contact message</label>
        <input style={input} value={data.feeContactMessage || ''} onChange={(e) => setData({ ...data, feeContactMessage: e.target.value })} />
        <label style={label}>WhatsApp enquiry message</label>
        <textarea style={{ ...input, minHeight: 90 }} value={data.whatsappEnquiryMessage || ''} onChange={(e) => setData({ ...data, whatsappEnquiryMessage: e.target.value })} />
      </section>

      <section style={card}>
        <h2>Theme colours</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>These map to CSS variables on the public site (via theme API / future CSS injection).</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {THEME_KEYS.map(([key, labelText]) => (
            <div key={key}>
              <label style={label}>{labelText}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="color"
                  value={theme[key] || '#1d4ed8'}
                  onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                  style={{ width: 44, height: 40, border: 0, background: 'transparent' }}
                />
                <input style={input} value={theme[key] || ''} onChange={(e) => setTheme({ ...theme, [key]: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <button style={btn} type="button" onClick={save}>Save all</button>
    </AdminChrome>
  );
}

const card: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 14, marginBottom: 18, boxShadow: '0 8px 24px rgba(15,23,42,0.05)' };
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 6px' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box' };
const btn: React.CSSProperties = { marginTop: 8, background: '#1d4ed8', color: '#fff', border: 0, borderRadius: 999, padding: '12px 20px', fontWeight: 700, cursor: 'pointer' };
