import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function read(): string {
  // dist/src/version.js -> ../../package.json
  const here = dirname(fileURLToPath(import.meta.url));
  for (const p of [join(here, '..', '..', 'package.json'), join(here, '..', 'package.json')]) {
    try {
      const v = JSON.parse(readFileSync(p, 'utf8')).version;
      if (v) return v;
    } catch {
      /* try next */
    }
  }
  return '0.0.0';
}

export const VERSION = read();
