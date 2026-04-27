#!/usr/bin/env node
const { execSync } = require('child_process');

let raw = '';
try {
  raw = execSync('git grep -nE "require\\([^)]*models/" -- server', {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
} catch (err) {
  if (err.status === 1) {
    raw = '';
  } else {
    console.error('git grep failed:', err.message);
    process.exit(2);
  }
}

const offenders = raw
  .split('\n')
  .filter(Boolean)
  .filter((line) => !line.startsWith('server/repositories/'));

if (offenders.length) {
  console.error('Direct model imports found outside server/repositories/:');
  for (const line of offenders) console.error('  ' + line);
  console.error('\nAll Mongoose model access must go through a repository.');
  process.exit(1);
}

console.log('OK: no direct model imports outside server/repositories/');
