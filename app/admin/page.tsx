'use client';

import { AdminChrome } from './_components/AdminChrome';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <AdminChrome>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: '#64748b' }}>Manage all SPEDICS website content from here. Add your Neon connection string to <code>.env.local</code>, then run schema + seed.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginTop: 24 }}>
        {[
          ['Gallery', '/admin/gallery', 'Add / edit / remove gallery photos'],
          ['Courses', '/admin/courses', 'Titles, badges, fees, modes'],
          ['FAQ', '/admin/faq', 'Questions and answers'],
          ['Site & Colours', '/admin/site', 'Contact, WhatsApp text, theme colours'],
          ['Content JSON', '/admin/content', 'About, admissions, fees blob']
        ].map(([title, href, desc]) => (
          <Link key={href as string} href={href as string} style={{ background: '#fff', padding: 18, borderRadius: 14, textDecoration: 'none', color: 'inherit', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <strong>{title}</strong>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{desc}</div>
          </Link>
        ))}
      </div>
      <ol style={{ marginTop: 32, color: '#334155', lineHeight: 1.7 }}>
        <li>Create Neon project → copy connection string</li>
        <li>Put it in <code>.env.local</code> as <code>DATABASE_URL=...</code></li>
        <li>In Neon SQL Editor, run <code>db/schema.sql</code> then <code>db/seed.sql</code></li>
        <li>Login: <code>admin@spedics.local</code> / <code>Admin@123</code> (or env vars)</li>
      </ol>
    </AdminChrome>
  );
}
