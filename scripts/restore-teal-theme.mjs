import fs from 'fs';
import pg from 'pg';

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[m[1]] = v.replace(/\r/g, '');
  }
}
loadEnv('.env.local');

const theme = {
  primary: '#0d9488',
  primaryLight: '#22d3ee',
  primaryDark: '#0f766e',
  accent: '#f59e0b',
  accentLight: '#fbbf24',
  violet: '#7c3aed',
  violetLight: '#a78bfa',
  coral: '#f97316',
  dark: '#0f172a',
  darkSoft: '#334155',
  text: '#1e293b',
  textMuted: '#64748b',
  bg: '#f0fdfa',
  bgWarm: '#fffbeb',
  bgSoft: '#ecfeff',
  white: '#ffffff',
  gradientBrand: 'linear-gradient(135deg, #0891b2 0%, #0d9488 35%, #7c3aed 70%, #f59e0b 100%)',
  gradientHero: 'linear-gradient(125deg, #0c4a6e 0%, #0891b2 28%, #0d9488 52%, #6366f1 78%, #d97706 100%)',
  gradientDark: 'linear-gradient(135deg, #0f172a 0%, #134e4a 45%, #312e81 100%)'
};

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
await client.connect();
await client.query(
  `UPDATE site_config SET theme = $1::jsonb, updated_at = NOW() WHERE id = 1`,
  [JSON.stringify(theme)]
);
const r = await client.query(`SELECT theme->>'primary' AS primary FROM site_config WHERE id = 1`);
console.log('theme primary now:', r.rows[0]);
await client.end();
