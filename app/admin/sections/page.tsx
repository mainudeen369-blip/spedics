'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AdminChrome } from '../_components/AdminChrome';
import { AdminResetButton } from '../_components/AdminResetButton';
import {
  DEFAULT_HOMEPAGE_SECTION_ORDER,
  HOMEPAGE_SECTIONS_CONTENT_KEY,
  normalizeHomepageSectionOrder,
  sectionsFromOrder,
  type HomepageSectionDef
} from '@/lib/homepage-sections';

export default function HomepageSectionsAdminPage() {
  const [sections, setSections] = useState<HomepageSectionDef[]>(() =>
    sectionsFromOrder(DEFAULT_HOMEPAGE_SECTION_ORDER)
  );
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/content?key=${HOMEPAGE_SECTIONS_CONTENT_KEY}`);
      const json = await res.json();
      const order = normalizeHomepageSectionOrder(json?.data?.order);
      setSections(sectionsFromOrder(order));
    } catch (e) {
      setMsg(String(e));
      setSections(sectionsFromOrder(DEFAULT_HOMEPAGE_SECTION_ORDER));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function moveItem(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= sections.length || to >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: HOMEPAGE_SECTIONS_CONTENT_KEY,
          data: { order: sections.map((s) => s.id) }
        })
      });
      setMsg(res.ok ? 'Saved. Refresh the public homepage to see the new order.' : 'Save failed');
    } catch (e) {
      setMsg(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminChrome>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <h1 style={{ marginTop: 0, marginBottom: 6 }}>Homepage sections</h1>
          <p style={{ color: '#64748b', margin: 0, maxWidth: 560 }}>
            Drag sections to change their order on the website. Names match what visitors see on the
            homepage. Header, marquee and footer stay fixed.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <AdminResetButton
            scope="homepage-sections"
            label="Reset to default"
            confirmText="Reset homepage section order to the default (Vision & Mission under Welcome)?"
            onDone={async () => {
              await load();
              setMsg('Order reset to default');
            }}
          />
          <button type="button" onClick={save} disabled={saving} style={primaryBtn}>
            {saving ? 'Saving…' : 'Save order'}
          </button>
        </div>
      </div>

      {msg ? <p style={{ color: '#1d4ed8', marginTop: 16 }}>{msg}</p> : null}

      <ol
        style={{
          listStyle: 'none',
          margin: '24px 0 0',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxWidth: 640
        }}
      >
        {sections.map((section, index) => {
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
          return (
            <li
              key={section.id}
              draggable
              onDragStart={(e) => {
                setDragIndex(index);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(index));
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (overIndex !== index) setOverIndex(index);
              }}
              onDragLeave={() => {
                if (overIndex === index) setOverIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = Number(e.dataTransfer.getData('text/plain'));
                moveItem(Number.isFinite(from) ? from : (dragIndex ?? -1), index);
                setDragIndex(null);
                setOverIndex(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: isDragging ? '#eff6ff' : '#fff',
                border: `1px solid ${isOver ? '#2563eb' : '#e2e8f0'}`,
                borderRadius: 12,
                boxShadow: isOver
                  ? '0 0 0 2px rgba(37,99,235,0.2)'
                  : '0 4px 14px rgba(15,23,42,0.04)',
                cursor: 'grab',
                opacity: isDragging ? 0.65 : 1,
                touchAction: 'none',
                userSelect: 'none'
              }}
            >
              <span
                aria-hidden
                style={{
                  color: '#94a3b8',
                  fontSize: 18,
                  lineHeight: 1,
                  letterSpacing: 1,
                  fontWeight: 700
                }}
              >
                ⋮⋮
              </span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: '#f1f5f9',
                  color: '#475569',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {index + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{section.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>#{section.id}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  type="button"
                  aria-label={`Move ${section.label} up`}
                  disabled={index === 0}
                  onClick={() => moveItem(index, index - 1)}
                  style={iconBtn}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Move ${section.label} down`}
                  disabled={index === sections.length - 1}
                  onClick={() => moveItem(index, index + 1)}
                  style={iconBtn}
                >
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <p style={{ color: '#64748b', fontSize: 13, marginTop: 20, maxWidth: 640 }}>
        Tip: After saving, open the public site and hard-refresh if the old order is cached. Layout
        and mobile responsiveness are unchanged — only the vertical order of sections is updated.
      </p>
    </AdminChrome>
  );
}

const primaryBtn: CSSProperties = {
  background: '#1d4ed8',
  color: '#fff',
  border: 'none',
  borderRadius: 999,
  padding: '10px 18px',
  fontWeight: 700,
  cursor: 'pointer'
};

const iconBtn: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#334155',
  fontWeight: 700,
  cursor: 'pointer'
};
