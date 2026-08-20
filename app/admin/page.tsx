'use client';

import { AdminChrome } from './_components/AdminChrome';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <AdminChrome>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: '#64748b' }}>Manage website content from here — gallery, courses, FAQ, site details and more.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginTop: 24 }}>
        {[
          ['Gallery', '/admin/gallery', 'Add / edit / remove gallery photos'],
          ['Courses', '/admin/courses', 'Titles, badges, fees, modes'],
          ['FAQ', '/admin/faq', 'Questions and answers'],
          ['Site & Colours', '/admin/site', 'Contact, WhatsApp text, theme colours'],
          ['Content', '/admin/content', 'About, admissions and fee text']
        ].map(([title, href, desc]) => (
          <Link key={href as string} href={href as string} style={{ background: '#fff', padding: 18, borderRadius: 14, textDecoration: 'none', color: 'inherit', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
            <strong>{title}</strong>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{desc}</div>
          </Link>
        ))}
      </div>
    </AdminChrome>
  );
}
