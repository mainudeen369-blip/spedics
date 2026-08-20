/**
 * Run a SQL file against Neon using DATABASE_URL from .env.local or env
 * Usage: node scripts/run-sql.mjs db/schema.sql
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const p = path.join(ROOT, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || process.env[m[1]]) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[m[1]] = v;
    }
  }
}

loadEnv();

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-sql.mjs <path-to.sql>');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL missing. Create .env.local with your Neon connection string.');
  process.exit(1);
}

const sqlText = fs.readFileSync(path.resolve(ROOT, file), 'utf8');
const sql = neon(process.env.DATABASE_URL);

// Split on semicolons carefully — neon query runs one statement; use full script via unsafe if available
// @neondatabase/serverless supports sql.query for raw? Use fetch to Neon HTTP with full script.
async function run() {
  const res = await fetch(process.env.DATABASE_URL.replace(/^postgres(ql)?:\/\//, (m) => {
    // Use Neon SQL-over-HTTP: need neon() tagged template for each statement
    return m;
  }), { method: 'HEAD' }).catch(() => null);

  // Split statements simply (good enough for our schema/seed)
  const parts = sqlText
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');

  // Keep BEGIN/COMMIT as single transaction via sequential queries
  console.log(`Running ${file} (${parts.length} statements)...`);
  await sql`BEGIN`;
  try {
    for (const stmt of parts) {
      if (!stmt) continue;
      await sql.query(stmt + ';');
    }
    await sql`COMMIT`;
    console.log('OK');
  } catch (err) {
    await sql`ROLLBACK`;
    console.error(err);
    process.exit(1);
  }
}

run();
