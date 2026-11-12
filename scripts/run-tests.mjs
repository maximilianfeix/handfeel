// Runs dist/test/*.test.js explicitly; Node 18 has no glob support in --test and Windows shells don't expand globs.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const files = readdirSync('dist/test').filter((f) => f.endsWith('.test.js')).map((f) => `dist/test/${f}`);
const r = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(r.status ?? 1);
