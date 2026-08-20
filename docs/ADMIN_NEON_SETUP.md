# SPEDICS — Admin + Neon setup

## Stack
- **Public site**: static HTML in `public/` (same pages as before)
- **Admin**: `/admin` (Next.js)
- **API**: `/api/admin/*` and `/api/public/content`
- **DB**: Neon PostgreSQL (`db/schema.sql` + `db/seed.sql`)

## 1. Neon connection
1. Create a Neon project
2. Copy the connection string
3. Create `.env.local` in the project root:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
ADMIN_EMAIL=admin@spedics.local
ADMIN_PASSWORD=Admin@123
ADMIN_JWT_SECRET=pick-a-long-random-secret
```

Paste your Neon string when ready — tell the developer and they will wire `.env.local`.

## 2. Create tables + seed current website data
In the **Neon SQL Editor**:
1. Paste and run all of `db/schema.sql`
2. Paste and run all of `db/seed.sql`

Or regenerate seed from JSON anytime:
```bash
npm run seed:generate
```

Default admin (also works from env before DB user exists):
- Email: `admin@spedics.local`
- Password: `Admin@123`

## 3. Local run
```bash
npm install
npm run dev
```
- Site: http://localhost:3000/index.html
- Admin: http://localhost:3000/admin/login

## 4. What admin can manage
| Page | Content |
|------|---------|
| Gallery | Photos, titles, order, publish |
| Courses | Titles, badges, fees text, modes |
| FAQ | Questions / answers |
| Site & Colours | Contact, WhatsApp copy, fee toggle, theme colours |
| Content JSON | about, admissions, fees, modes, careers |

## 5. Deploy (Vercel)
- Framework: Next.js (see `vercel.json`)
- Add the same env vars in Vercel project settings
- Push to `main`

## 6. Photos & videos (Vercel Blob)
1. Vercel Dashboard → **Storage** → **Blob** → Create store
2. Copy the **read-write** token into `.env.local` and Vercel env as `BLOB_READ_WRITE_TOKEN`
3. Redeploy / restart `npm run dev`
4. Admin → Gallery → upload file

**Without the token:** local `npm run dev` saves into `public/uploads/`; on Vercel, small images can use a temporary data-URL fallback. Videos/large files need Blob.
