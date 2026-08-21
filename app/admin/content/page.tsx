'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminChrome } from '../_components/AdminChrome';
import { AdminResetButton } from '../_components/AdminResetButton';

const KEYS = [
  { id: 'about', label: 'About' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'fees', label: 'Fees' },
  { id: 'learning-modes', label: 'Learning modes' },
  { id: 'careers', label: 'Careers' },
  { id: 'affiliations-meta', label: 'Affiliations' }
] as const;

type Doc = Record<string, any>;

export default function ContentAdminPage() {
  const [key, setKey] = useState<(typeof KEYS)[number]['id']>('admissions');
  const [data, setData] = useState<Doc>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (k: string) => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/content?key=${encodeURIComponent(k)}`);
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
    load(key);
  }, [key, load]);

  async function save() {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Save failed');
      setMsg(`Saved ${key}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminChrome>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 6 }}>Content</h1>
          <p style={{ color: '#64748b', margin: 0, maxWidth: 560 }}>
            Edit website text with forms. Changes save into the database (JSON storage) — you do not edit raw JSON.
          </p>
        </div>
        <AdminResetButton
          scope={`content:${key}`}
          label={`Reset ${key} to default`}
          confirmText={`Reset "${key}" from public/data folder defaults? Current edits for this document will be overwritten.`}
          onDone={() => load(key)}
        />
      </div>

      {msg ? (
        <p style={{ color: msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('error') ? '#b91c1c' : '#0f766e' }}>
          {msg}
        </p>
      ) : null}

      <label style={label}>Section</label>
      <select
        style={input}
        value={key}
        onChange={(e) => setKey(e.target.value as (typeof KEYS)[number]['id'])}
      >
        {KEYS.map((k) => (
          <option key={k.id} value={k.id}>
            {k.label}
          </option>
        ))}
      </select>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading…</p>
      ) : (
        <div style={{ marginTop: 8 }}>
          {key === 'about' && <AboutForm data={data} setData={setData} />}
          {key === 'admissions' && <AdmissionsForm data={data} setData={setData} />}
          {key === 'fees' && <FeesForm data={data} setData={setData} />}
          {key === 'learning-modes' && <LearningModesForm data={data} setData={setData} />}
          {key === 'careers' && <CareersForm data={data} setData={setData} />}
          {key === 'affiliations-meta' && <AffiliationsForm data={data} setData={setData} />}
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button style={btn} type="button" disabled={busy || loading} onClick={save}>
          {busy ? 'Saving…' : 'Save section'}
        </button>
      </div>
    </AdminChrome>
  );
}

/* ——— Form sections ——— */

function AboutForm({ data, setData }: { data: Doc; setData: (d: Doc) => void }) {
  const setNested = (field: string, patch: Record<string, string>) =>
    setData({ ...data, [field]: { ...(data[field] || {}), ...patch } });

  const whyChoose: Array<{ icon?: string; title?: string; text?: string }> = Array.isArray(data.whyChoose)
    ? data.whyChoose
    : [];
  const whoCanJoin: string[] = Array.isArray(data.whoCanJoin) ? data.whoCanJoin : [];
  const montessori = data.montessori || {};
  const points: string[] = Array.isArray(montessori.points) ? montessori.points : [];

  return (
    <>
      <section style={card}>
        <h2 style={h2}>Basics</h2>
        <Field label="Page title" value={data.title || ''} onChange={(v) => setData({ ...data, title: v })} />
        <Field label="Intro" value={data.intro || ''} onChange={(v) => setData({ ...data, intro: v })} multiline />
      </section>

      {(['welcomeNote', 'whoWeAre', 'founderMessage', 'vision', 'mission'] as const).map((field) => {
        const block = data[field] || {};
        return (
          <section key={field} style={card}>
            <h2 style={h2}>{field}</h2>
            <Field label="Title" value={block.title || ''} onChange={(v) => setNested(field, { title: v })} />
            {field === 'founderMessage' ? (
              <Field label="Name" value={block.name || ''} onChange={(v) => setNested(field, { name: v })} />
            ) : null}
            {field === 'welcomeNote' ? (
              <Field label="Heading" value={block.heading || ''} onChange={(v) => setNested(field, { heading: v })} />
            ) : null}
            <Field label="Text" value={block.text || ''} onChange={(v) => setNested(field, { text: v })} multiline />
          </section>
        );
      })}

      <section style={card}>
        <h2 style={h2}>Why choose</h2>
        {whyChoose.map((item, idx) => (
          <div key={idx} style={subCard}>
            <Field
              label="Icon key"
              value={item.icon || ''}
              onChange={(v) => {
                const next = [...whyChoose];
                next[idx] = { ...item, icon: v };
                setData({ ...data, whyChoose: next });
              }}
            />
            <Field
              label="Title"
              value={item.title || ''}
              onChange={(v) => {
                const next = [...whyChoose];
                next[idx] = { ...item, title: v };
                setData({ ...data, whyChoose: next });
              }}
            />
            <Field
              label="Text"
              value={item.text || ''}
              onChange={(v) => {
                const next = [...whyChoose];
                next[idx] = { ...item, text: v };
                setData({ ...data, whyChoose: next });
              }}
              multiline
            />
            <button
              type="button"
              style={dangerBtn}
              onClick={() => setData({ ...data, whyChoose: whyChoose.filter((_, i) => i !== idx) })}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          style={secondaryBtn}
          onClick={() => setData({ ...data, whyChoose: [...whyChoose, { icon: '', title: '', text: '' }] })}
        >
          Add reason
        </button>
      </section>

      <section style={card}>
        <h2 style={h2}>Montessori</h2>
        <Field
          label="Title"
          value={montessori.title || ''}
          onChange={(v) => setData({ ...data, montessori: { ...montessori, title: v } })}
        />
        <Field
          label="Intro"
          value={montessori.intro || ''}
          onChange={(v) => setData({ ...data, montessori: { ...montessori, intro: v } })}
          multiline
        />
        <Field
          label="Points (one per line)"
          value={points.join('\n')}
          onChange={(v) =>
            setData({
              ...data,
              montessori: { ...montessori, points: v.split('\n').map((s) => s.trim()).filter(Boolean) }
            })
          }
          multiline
        />
      </section>

      <section style={card}>
        <h2 style={h2}>Who can join</h2>
        <Field
          label="Items (one per line)"
          value={whoCanJoin.join('\n')}
          onChange={(v) =>
            setData({ ...data, whoCanJoin: v.split('\n').map((s) => s.trim()).filter(Boolean) })
          }
          multiline
        />
      </section>
    </>
  );
}

function AdmissionsForm({ data, setData }: { data: Doc; setData: (d: Doc) => void }) {
  const marquee: string[] = Array.isArray(data.marquee) ? data.marquee : [];
  const steps: Array<{ step?: number; title?: string; text?: string }> = Array.isArray(data.steps)
    ? data.steps
    : [];

  return (
    <>
      <section style={card}>
        <h2 style={h2}>Basics</h2>
        <Field label="Title" value={data.title || ''} onChange={(v) => setData({ ...data, title: v })} />
        <Field
          label="Marquee lines (one per line)"
          value={marquee.join('\n')}
          onChange={(v) =>
            setData({ ...data, marquee: v.split('\n').map((s) => s.trim()).filter(Boolean) })
          }
          multiline
        />
        <Field
          label="Course fee summary"
          value={data.courseFee || ''}
          onChange={(v) => setData({ ...data, courseFee: v })}
          multiline
        />
        <Field
          label="Documents required"
          value={data.documentsRequired || ''}
          onChange={(v) => setData({ ...data, documentsRequired: v })}
          multiline
        />
      </section>

      <section style={card}>
        <h2 style={h2}>Steps</h2>
        {steps.map((s, idx) => (
          <div key={idx} style={subCard}>
            <Field
              label="Step number"
              value={String(s.step ?? idx + 1)}
              onChange={(v) => {
                const next = [...steps];
                next[idx] = { ...s, step: Number(v) || idx + 1 };
                setData({ ...data, steps: next });
              }}
            />
            <Field
              label="Title"
              value={s.title || ''}
              onChange={(v) => {
                const next = [...steps];
                next[idx] = { ...s, title: v };
                setData({ ...data, steps: next });
              }}
            />
            <Field
              label="Text"
              value={s.text || ''}
              onChange={(v) => {
                const next = [...steps];
                next[idx] = { ...s, text: v };
                setData({ ...data, steps: next });
              }}
              multiline
            />
            <button
              type="button"
              style={dangerBtn}
              onClick={() => setData({ ...data, steps: steps.filter((_, i) => i !== idx) })}
            >
              Remove step
            </button>
          </div>
        ))}
        <button
          type="button"
          style={secondaryBtn}
          onClick={() =>
            setData({
              ...data,
              steps: [...steps, { step: steps.length + 1, title: '', text: '' }]
            })
          }
        >
          Add step
        </button>
      </section>
    </>
  );
}

function FeesForm({ data, setData }: { data: Doc; setData: (d: Doc) => void }) {
  const def = data.default || {};
  const packages: Array<{ name?: string; duration?: string; fee?: number; feeLabel?: string }> =
    Array.isArray(def.packages) ? def.packages : [];
  const courses: Record<string, any> = data.courses && typeof data.courses === 'object' ? data.courses : {};

  return (
    <>
      <section style={card}>
        <h2 style={h2}>Global fee settings</h2>
        <Field label="Currency" value={data.currency || ''} onChange={(v) => setData({ ...data, currency: v })} />
        <Field
          label="Currency symbol"
          value={data.currencySymbol || ''}
          onChange={(v) => setData({ ...data, currencySymbol: v })}
        />
        <label style={{ ...label, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={!!data.displayFees}
            onChange={(e) => setData({ ...data, displayFees: e.target.checked })}
          />
          Display fees publicly
        </label>
        <Field
          label="Contact message"
          value={data.contactMessage || ''}
          onChange={(v) => setData({ ...data, contactMessage: v })}
        />
        <Field label="Note" value={data.note || ''} onChange={(v) => setData({ ...data, note: v })} multiline />
      </section>

      <section style={card}>
        <h2 style={h2}>Default packages</h2>
        <Field
          label="Default duration label"
          value={def.duration || ''}
          onChange={(v) => setData({ ...data, default: { ...def, duration: v } })}
        />
        <Field
          label="Default fee label"
          value={def.fee || ''}
          onChange={(v) => setData({ ...data, default: { ...def, fee: v } })}
        />
        {packages.map((p, idx) => (
          <div key={idx} style={subCard}>
            <Field
              label="Package name"
              value={p.name || ''}
              onChange={(v) => {
                const next = [...packages];
                next[idx] = { ...p, name: v };
                setData({ ...data, default: { ...def, packages: next } });
              }}
            />
            <Field
              label="Duration"
              value={p.duration || ''}
              onChange={(v) => {
                const next = [...packages];
                next[idx] = { ...p, duration: v };
                setData({ ...data, default: { ...def, packages: next } });
              }}
            />
            <Field
              label="Fee amount (number)"
              value={p.fee != null ? String(p.fee) : ''}
              onChange={(v) => {
                const next = [...packages];
                next[idx] = { ...p, fee: Number(v) || 0 };
                setData({ ...data, default: { ...def, packages: next } });
              }}
            />
            <Field
              label="Fee label"
              value={p.feeLabel || ''}
              onChange={(v) => {
                const next = [...packages];
                next[idx] = { ...p, feeLabel: v };
                setData({ ...data, default: { ...def, packages: next } });
              }}
            />
            <button
              type="button"
              style={dangerBtn}
              onClick={() =>
                setData({
                  ...data,
                  default: { ...def, packages: packages.filter((_, i) => i !== idx) }
                })
              }
            >
              Remove package
            </button>
          </div>
        ))}
        <button
          type="button"
          style={secondaryBtn}
          onClick={() =>
            setData({
              ...data,
              default: {
                ...def,
                packages: [...packages, { name: '', duration: '', fee: 0, feeLabel: '' }]
              }
            })
          }
        >
          Add package
        </button>
      </section>

      <section style={card}>
        <h2 style={h2}>Per-course fee overrides</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 0 }}>
          Edit duration and fee text for each course. Package lists are preserved when you save.
        </p>
        {Object.keys(courses).map((courseId) => {
          const c = courses[courseId] || {};
          return (
            <div key={courseId} style={subCard}>
              <strong style={{ display: 'block', marginBottom: 8 }}>{courseId}</strong>
              <Field
                label="Duration"
                value={c.duration || ''}
                onChange={(v) =>
                  setData({ ...data, courses: { ...courses, [courseId]: { ...c, duration: v } } })
                }
              />
              <Field
                label="Fee label"
                value={c.fee || ''}
                onChange={(v) =>
                  setData({ ...data, courses: { ...courses, [courseId]: { ...c, fee: v } } })
                }
              />
              <Field
                label="Schedule note"
                value={c.schedule || ''}
                onChange={(v) =>
                  setData({ ...data, courses: { ...courses, [courseId]: { ...c, schedule: v } } })
                }
              />
            </div>
          );
        })}
      </section>
    </>
  );
}

function LearningModesForm({ data, setData }: { data: Doc; setData: (d: Doc) => void }) {
  const modes: Array<{ id?: string; title?: string; description?: string; icon?: string; features?: string[] }> =
    Array.isArray(data.modes) ? data.modes : [];
  const practical = data.practicalLearning || {};
  const items: string[] = Array.isArray(practical.items) ? practical.items : [];

  return (
    <>
      <section style={card}>
        <Field label="Title" value={data.title || ''} onChange={(v) => setData({ ...data, title: v })} />
      </section>
      {modes.map((m, idx) => (
        <section key={idx} style={card}>
          <h2 style={h2}>Mode {idx + 1}</h2>
          <Field
            label="Id"
            value={m.id || ''}
            onChange={(v) => {
              const next = [...modes];
              next[idx] = { ...m, id: v };
              setData({ ...data, modes: next });
            }}
          />
          <Field
            label="Title"
            value={m.title || ''}
            onChange={(v) => {
              const next = [...modes];
              next[idx] = { ...m, title: v };
              setData({ ...data, modes: next });
            }}
          />
          <Field
            label="Icon key"
            value={m.icon || ''}
            onChange={(v) => {
              const next = [...modes];
              next[idx] = { ...m, icon: v };
              setData({ ...data, modes: next });
            }}
          />
          <Field
            label="Description"
            value={m.description || ''}
            onChange={(v) => {
              const next = [...modes];
              next[idx] = { ...m, description: v };
              setData({ ...data, modes: next });
            }}
            multiline
          />
          <Field
            label="Features (one per line)"
            value={(m.features || []).join('\n')}
            onChange={(v) => {
              const next = [...modes];
              next[idx] = {
                ...m,
                features: v.split('\n').map((s) => s.trim()).filter(Boolean)
              };
              setData({ ...data, modes: next });
            }}
            multiline
          />
          <button
            type="button"
            style={dangerBtn}
            onClick={() => setData({ ...data, modes: modes.filter((_, i) => i !== idx) })}
          >
            Remove mode
          </button>
        </section>
      ))}
      <button
        type="button"
        style={secondaryBtn}
        onClick={() =>
          setData({
            ...data,
            modes: [...modes, { id: '', title: '', description: '', icon: '', features: [] }]
          })
        }
      >
        Add mode
      </button>

      <section style={card}>
        <h2 style={h2}>Practical learning</h2>
        <Field
          label="Title"
          value={practical.title || ''}
          onChange={(v) => setData({ ...data, practicalLearning: { ...practical, title: v } })}
        />
        <Field
          label="Items (one per line)"
          value={items.join('\n')}
          onChange={(v) =>
            setData({
              ...data,
              practicalLearning: {
                ...practical,
                items: v.split('\n').map((s) => s.trim()).filter(Boolean)
              }
            })
          }
          multiline
        />
      </section>
    </>
  );
}

function CareersForm({ data, setData }: { data: Doc; setData: (d: Doc) => void }) {
  const roles: Array<{ icon?: string; title?: string; text?: string }> = Array.isArray(data.roles)
    ? data.roles
    : [];
  return (
    <>
      <section style={card}>
        <Field label="Title" value={data.title || ''} onChange={(v) => setData({ ...data, title: v })} />
        <Field label="Intro" value={data.intro || ''} onChange={(v) => setData({ ...data, intro: v })} multiline />
      </section>
      <section style={card}>
        <h2 style={h2}>Roles</h2>
        {roles.map((r, idx) => (
          <div key={idx} style={subCard}>
            <Field
              label="Icon"
              value={r.icon || ''}
              onChange={(v) => {
                const next = [...roles];
                next[idx] = { ...r, icon: v };
                setData({ ...data, roles: next });
              }}
            />
            <Field
              label="Title"
              value={r.title || ''}
              onChange={(v) => {
                const next = [...roles];
                next[idx] = { ...r, title: v };
                setData({ ...data, roles: next });
              }}
            />
            <Field
              label="Text"
              value={r.text || ''}
              onChange={(v) => {
                const next = [...roles];
                next[idx] = { ...r, text: v };
                setData({ ...data, roles: next });
              }}
              multiline
            />
            <button
              type="button"
              style={dangerBtn}
              onClick={() => setData({ ...data, roles: roles.filter((_, i) => i !== idx) })}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          style={secondaryBtn}
          onClick={() => setData({ ...data, roles: [...roles, { icon: '', title: '', text: '' }] })}
        >
          Add role
        </button>
      </section>
    </>
  );
}

function AffiliationsForm({ data, setData }: { data: Doc; setData: (d: Doc) => void }) {
  const list: Array<Record<string, string>> = Array.isArray(data.affiliations) ? data.affiliations : [];
  return (
    <>
      <section style={card}>
        <Field label="Title" value={data.title || ''} onChange={(v) => setData({ ...data, title: v })} />
        <Field
          label="Subtitle"
          value={data.subtitle || ''}
          onChange={(v) => setData({ ...data, subtitle: v })}
        />
        <Field label="Note" value={data.note || ''} onChange={(v) => setData({ ...data, note: v })} multiline />
      </section>
      <section style={card}>
        <h2 style={h2}>Affiliations</h2>
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
            <Field
              label="Logo path"
              value={a.logo || ''}
              onChange={(v) => {
                const next = [...list];
                next[idx] = { ...a, logo: v };
                setData({ ...data, affiliations: next });
              }}
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
                { name: '', affiliationNo: '', period: '', govtRegNo: '', logo: '' }
              ]
            })
          }
        >
          Add affiliation
        </button>
      </section>
    </>
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
