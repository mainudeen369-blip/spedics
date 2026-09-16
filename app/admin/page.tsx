'use client';

import { AdminChrome } from './_components/AdminChrome';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <AdminChrome>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: '#64748b' }}>
        Manage website content from here — gallery, courses, FAQ, site details and more.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginTop: 24 }}>
        {[
          ['Section order', '/admin/sections', 'Drag homepage sections (Welcome, Vision, Courses…)'],
          ['Gallery', '/admin/gallery', 'Add / edit / remove gallery photos'],
          ['Courses', '/admin/courses', 'Add / hide / show courses & upload card images'],
          ['Affiliations', '/admin/affiliations', 'Partners, logos and banners for Recognition & Affiliation'],
          ['FAQ', '/admin/faq', 'Questions and answers'],
          ['Site & Colours', '/admin/site', 'Contact, theme colours with live preview'],
          ['Content', '/admin/content', 'About, admissions, fees and more (forms)']
        ].map(([title, href, desc]) => (
          <Link
            key={href as string}
            href={href as string}
            style={{
              background: '#fff',
              padding: 18,
              borderRadius: 14,
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
            }}
          >
            <strong>{title}</strong>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{desc}</div>
          </Link>
        ))}
      </div>

      <section
        style={{
          marginTop: 32,
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 14,
          padding: 18
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Reset to folder defaults</h2>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 0, marginBottom: 0 }}>
          <strong style={{ color: '#b91c1c' }}>Temporarily disabled</strong> so live website data cannot be
          overwritten by mistake. Contact the developer if a controlled restore is needed.
        </p>
      </section>
    </AdminChrome>
  );
}
