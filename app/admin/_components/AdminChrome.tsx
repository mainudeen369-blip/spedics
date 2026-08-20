'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/courses', label: 'Courses' },
  { href: '/admin/faq', label: 'FAQ' },
  { href: '/admin/site', label: 'Site & Colours' },
  { href: '/admin/content', label: 'Content JSON' }
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/admin/me')
      .then(async (r) => {
        if (!r.ok) {
          router.replace('/admin/login');
          return;
        }
        const data = await r.json();
        setEmail(data.email || '');
        setReady(true);
      })
      .catch(() => router.replace('/admin/login'));
  }, [router]);

  if (!ready) {
    return <div style={{ padding: 40 }}>Checking session…</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside style={{ background: '#0f172a', color: '#e2e8f0', padding: '24px 16px' }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>SPEDICS Admin</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 24 }}>{email}</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: '#e2e8f0',
                  textDecoration: 'none',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: active ? 'rgba(29,78,216,0.45)' : 'rgba(255,255,255,0.04)',
                  fontWeight: active ? 700 : 500
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/admin/logout', { method: 'POST' });
            router.replace('/admin/login');
          }}
          style={{ marginTop: 32, background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', width: '100%' }}
        >
          Log out
        </button>
        <p style={{ marginTop: 24, fontSize: 12, color: '#64748b' }}>
          <a href="/index.html" style={{ color: '#93c5fd' }}>View public site</a>
        </p>
      </aside>
      <main style={{ padding: 28 }}>{children}</main>
    </div>
  );
}
