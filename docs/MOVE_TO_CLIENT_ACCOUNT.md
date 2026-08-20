# Moving SPEDICS to the client's Vercel + Neon account

**Difficulty: Easy** (about 30–60 minutes). No code rewrite needed — only accounts, env vars, and DNS.

## What stays the same
- GitHub repo (or transfer repo ownership to client)
- Same codebase (`main` branch)
- Same SQL: `db/schema.sql` + `db/seed.sql` (or dump from current Neon)

## Checklist

### 1. Neon (database) — Easy
1. Client creates a Neon project under their email
2. Run `db/schema.sql` then `db/seed.sql` in their Neon SQL Editor  
   **Or** use Neon “Transfer project” / export if available on your plan
3. Copy their new `DATABASE_URL`

### 2. Vercel (hosting + Blob) — Easy
1. Client creates a Vercel account / team
2. Import the same GitHub repo (or transfer the Vercel project: Project Settings → General → Transfer)
3. Recreate env vars on their project:

```env
DATABASE_URL=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
ADMIN_JWT_SECRET=...
BLOB_READ_WRITE_TOKEN=...
NEXT_PUBLIC_SITE_URL=https://their-domain-or-vercel-url
```

4. Create **Blob** store on their Vercel team → copy `BLOB_READ_WRITE_TOKEN`
5. Redeploy

### 3. Domain — Easy
- Point domain DNS to the new Vercel project (or transfer domain in Vercel)

### 4. Media already on Blob
- Old Blob URLs keep working only while your store exists
- For a clean handoff: re-upload important gallery files on the client Blob store, or keep your Blob temporarily until migrated

## What is NOT hard
- No change to admin UI or APIs for a normal move
- Neon + Vercel + Blob tokens are just config

## Tip
Keep a private note of all env vars. When the client is ready, you paste the same keys into their Vercel/Neon — done.
