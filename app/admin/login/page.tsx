'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@spedics.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <form onSubmit={onSubmit} style={{ width: '100%', maxWidth: 400, background: '#fff', padding: 28, borderRadius: 16, boxShadow: '0 12px 40px rgba(15,23,42,0.12)' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>SPEDICS Admin</h1>
        <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: 14 }}>Sign in to manage gallery, courses, colours and content.</p>
        <label style={labelStyle}>Email</label>
        <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label style={labelStyle}>Password</label>
        <input style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        {error ? <p style={{ color: '#b91c1c', fontSize: 14 }}>{error}</p> : null}
        <button disabled={loading} style={btnStyle} type="submit">{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', marginBottom: 14, boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 999, border: 0, background: '#1d4ed8', color: '#fff', fontWeight: 700, cursor: 'pointer' };
