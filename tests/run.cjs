/* eslint-disable @typescript-eslint/no-require-imports */
// Zero-dependency test runner: node:test + jiti (TS + "@/" alias). Run: npm test
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
// Placeholder env so server modules (supabaseAdmin) import; tests never hit the network.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'test';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test';
const { createJiti } = require('jiti');
const jiti = createJiti(__filename, { alias: { '@': root }, interopDefault: true });
for (const f of fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.ts'))) {
  jiti(path.join(__dirname, f));
}
