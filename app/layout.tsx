export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>SPEDICS Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body style={{ margin: 0, fontFamily: 'Segoe UI, system-ui, sans-serif', background: '#f1f5f9', color: '#0f172a' }}>
        {children}
      </body>
    </html>
  );
}
