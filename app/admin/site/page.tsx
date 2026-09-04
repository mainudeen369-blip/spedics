'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminChrome } from '../_components/AdminChrome';
import { AdminResetButton } from '../_components/AdminResetButton';
import { DEFAULT_TEAL_THEME } from '@/lib/default-theme';

const THEME_KEYS = [
  ['primary', 'Primary', 'Buttons, badges, links, course badges'],
  ['primaryLight', 'Primary light', 'Highlights, accents on teal areas'],
  ['primaryDark', 'Primary dark', 'Hover states, darker teal accents'],
  ['accent', 'Accent', 'Enquire / CTA buttons, badge dots'],
  ['accentLight', 'Accent light', 'Accent hover / soft gold highlights'],
  ['bg', 'Background', 'Main page soft background tint'],
  ['bgWarm', 'Background warm', 'Warm section bands'],
  ['text', 'Text', 'Body paragraph text'],
  ['textMuted', 'Text muted', 'Subtitles, meta, secondary labels'],
  ['dark', 'Dark', 'Headings, logo text, dark UI']
] as const;

function ThemeLivePreview({ theme }: { theme: Record<string, string> }) {
  const t = useMemo(
    () => ({
      ...DEFAULT_TEAL_THEME,
      ...theme
    }),
    [theme]
  );

  const heroGradient = `linear-gradient(115deg, ${t.dark}ee 0%, ${t.primaryDark}cc 42%, ${t.primary}99 72%, ${t.accent}66 100%)`;

  return (
    <div
      style={{
        marginTop: 18,
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        background: t.bg,
        boxShadow: '0 12px 32px rgba(15,23,42,0.08)'
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          background: '#0f172a',
          color: '#e2e8f0',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap'
        }}
      >
        <span>Live website preview</span>
        <span style={{ fontWeight: 500, color: '#94a3b8', fontSize: 12 }}>
          Changes here update as you pick colours — save to apply on the real site
        </span>
      </div>

      {/* Mini hero */}
      <div
        style={{
          position: 'relative',
          minHeight: 168,
          backgroundImage: `${heroGradient}, url(/images/hero-bg.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '22px 20px',
          color: '#fff'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(105deg, ${t.dark}d9 0%, ${t.primaryDark}a6 50%, transparent 100%)`
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 11,
              marginBottom: 10
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.accent }} />
            Hero badge · Accent / white on Dark overlay
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>
            SPEDICS Institute
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 12, maxWidth: 340 }}>
            Hero title uses white on dark/teal overlay — keep Primary dark + Dark strong for readable text.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                background: `linear-gradient(135deg, ${t.accentLight}, ${t.accent})`,
                color: t.dark,
                borderRadius: 999,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 800
              }}
            >
              Enquire (Accent)
            </span>
            <span
              style={{
                border: '2px solid rgba(255,255,255,0.8)',
                borderRadius: 999,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 700
              }}
            >
              Explore Courses
            </span>
          </div>
        </div>
      </div>

      {/* Content band */}
      <div style={{ padding: 18, display: `1px solid ${t.primary}22` }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: t.primary, marginBottom: 4 }}>
          SECTION LABEL · Primary
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: t.dark, marginBottom: 6 }}>Our Courses · Dark</div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: t.textMuted, lineHeight: 1.5 }}>
          Subtitle uses Text muted. Body copy below uses Text.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
            gap: 14
          }}
        >
          {/* Course card */}
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              overflow: 'hidden',
              border: `1px solid ${t.primary}18`,
              boxShadow: `0 10px 28px ${t.primary}22`
            }}
          >
            <div
              style={{
                height: 96,
                background: `linear-gradient(135deg, ${t.primary}, ${t.primaryLight})`,
                position: 'relative'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  background: t.primary,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 999,
                  padding: '4px 8px'
                }}
              >
                Badge · Primary
              </span>
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 800, color: t.dark, fontSize: 14, marginBottom: 4 }}>Montessori Teacher Training</div>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: t.text, lineHeight: 1.45 }}>
                Card body text colour = Text. Meta line below = Text muted.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: t.textMuted }}>3 / 6 / 12 months</span>
                <span
                  style={{
                    background: t.primary,
                    color: '#fff',
                    borderRadius: 999,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 800
                  }}
                >
                  Read More
                </span>
              </div>
            </div>
          </div>

          {/* Side panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                background: t.bgWarm,
                borderRadius: 12,
                padding: 12,
                border: `1px solid ${t.accent}33`
              }}
            >
              <div style={{ fontWeight: 800, color: t.dark, fontSize: 13, marginBottom: 4 }}>Warm section · Background warm</div>
              <p style={{ margin: 0, fontSize: 12, color: t.text }}>
                Soft cream bands use Background warm; page wash uses Background.
              </p>
            </div>
            <div
              style={{
                background: t.bg,
                borderRadius: 12,
                padding: 12,
                border: `1px solid ${t.primary}33`
              }}
            >
              <div style={{ fontWeight: 800, color: t.primaryDark, fontSize: 13, marginBottom: 4 }}>
                Teal band · Background + Primary dark
              </div>
              <p style={{ margin: 0, fontSize: 12, color: t.textMuted }}>
                Primary light is used for cyan highlights and soft glows.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(
                [
                  ['Primary', t.primary],
                  ['Primary light', t.primaryLight],
                  ['Primary dark', t.primaryDark],
                  ['Accent', t.accent],
                  ['Accent light', t.accentLight],
                  ['Dark', t.dark],
                  ['Text', t.text],
                  ['Muted', t.textMuted]
                ] as const
              ).map(([name, color]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.text }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      background: color,
                      border: '1px solid rgba(0,0,0,0.12)'
                    }}
                  />
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const hero = data.hero || {};

  return (
    <AdminChrome>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <h1 style={{ marginTop: 0 }}>Site & Colours</h1>
        <AdminResetButton
          scope="site"
          label="Reset site to default"
          confirmText="Reset site contact/brand text and teal theme from public/data/site.json?"
          onDone={async () => {
            const r = await fetch('/api/admin/site');
            const d = await r.json();
            setData(d.data || {});
            setTheme(d.theme || {});
            setMsg('Reloaded after reset');
          }}
        />
      </div>
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
        <h2>Hero text</h2>
        <label style={label}>Badge</label>
        <input
          style={input}
          value={hero.badge || ''}
          onChange={(e) => setData({ ...data, hero: { ...hero, badge: e.target.value } })}
        />
        <label style={label}>Title</label>
        <input
          style={input}
          value={hero.title || ''}
          onChange={(e) => setData({ ...data, hero: { ...hero, title: e.target.value } })}
        />
        <label style={label}>Subtitle</label>
        <textarea
          style={{ ...input, minHeight: 72 }}
          value={hero.subtitle || ''}
          onChange={(e) => setData({ ...data, hero: { ...hero, subtitle: e.target.value } })}
        />
        <label style={label}>Background image path</label>
        <input
          style={input}
          value={hero.backgroundImage || 'images/hero-bg.jpg'}
          onChange={(e) => setData({ ...data, hero: { ...hero, backgroundImage: e.target.value } })}
        />
        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>
          Default: <code>images/hero-bg.jpg</code> (1920×1080). Overlay keeps text readable with Dark / Primary colours.
        </p>
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
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
          Pick a colour and watch the mini website below — each swatch label explains where it appears on the live site.
        </p>
        <button
          type="button"
          style={{ ...btn, background: '#0d9488', marginBottom: 12 }}
          onClick={() => setTheme({ ...DEFAULT_TEAL_THEME })}
        >
          Restore original teal theme
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          {THEME_KEYS.map(([key, labelText, hint]) => (
            <div key={key} style={{ padding: 10, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <label style={{ ...label, marginTop: 0 }}>{labelText}</label>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{hint}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="color"
                  value={theme[key] || DEFAULT_TEAL_THEME[key as keyof typeof DEFAULT_TEAL_THEME] || '#1d4ed8'}
                  onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                  style={{ width: 44, height: 40, border: 0, background: 'transparent' }}
                />
                <input style={input} value={theme[key] || ''} onChange={(e) => setTheme({ ...theme, [key]: e.target.value })} />
              </div>
            </div>
          ))}
        </div>

        <ThemeLivePreview theme={theme} />
      </section>

      <button style={btn} type="button" onClick={save}>Save all</button>
    </AdminChrome>
  );
}

const card: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 14, marginBottom: 18, boxShadow: '0 8px 24px rgba(15,23,42,0.05)' };
const label: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, margin: '10px 0 6px' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', boxSizing: 'border-box' };
const btn: React.CSSProperties = { marginTop: 8, background: '#1d4ed8', color: '#fff', border: 0, borderRadius: 999, padding: '12px 20px', fontWeight: 700, cursor: 'pointer' };
