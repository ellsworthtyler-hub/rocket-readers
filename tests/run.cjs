// Zero-dependency test runner: node:test + jiti (TS + "@/" alias). Run: npm test
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '..');
const { createJiti } = require('jiti');
const jiti = createJiti(__filename, { alias: { '@': root }, interopDefault: true });
for (const f of fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.ts'))) {
  jiti(path.join(__dirname, f));
}
