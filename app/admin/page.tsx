'use client';

import { AdminChrome } from './_components/AdminChrome';
import { AdminResetButton } from './_components/AdminResetButton';
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
          ['Gallery', '/admin/gallery', 'Add / edit / remove gallery photos'],
          ['Courses', '/admin/courses', 'Titles, badges, fees, modes'],
          ['FAQ', '/admin/faq', 'Questions and answers'],
          ['Site & Colours', '/admin/site', 'Contact, WhatsApp text, theme colours'],
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
          background: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: 14,
          padding: 18
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Reset to folder defaults</h2>
        <p style={{ color: '#92400e', fontSize: 14, marginTop: 0 }}>
          Restores Neon data from <code>public/data</code> (the original website files). Admin login is not changed.
          Prefer resetting one section at a time. Gallery reset restores seed folder images (not Blob uploads).
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {(
            [
              ['site', 'Site & theme'],
              ['content', 'All content docs'],
              ['courses', 'Courses'],
              ['faq', 'FAQ'],
              ['gallery', 'Gallery'],
              ['testimonials', 'Testimonials'],
              ['guides', 'Guides'],
              ['affiliations', 'Affiliations']
            ] as const
          ).map(([scope, label]) => (
            <AdminResetButton key={scope} scope={scope} label={label} />
          ))}
          <AdminResetButton
            scope="all"
            label="Reset everything"
            confirmText="Reset ALL website content (site, courses, FAQ, gallery, content, testimonials, guides) from public/data defaults? Admin login is kept. This cannot be undone from the admin UI."
            style={{ borderColor: '#b91c1c', color: '#b91c1c' }}
          />
        </div>
      </section>
    </AdminChrome>
  );
}
