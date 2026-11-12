import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan } from '../src/scan.js';
import { ruleCatalog } from '../src/rules/index.js';

// dist/test -> ../../test/fixtures
const FIX = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'test', 'fixtures');

const pairs: { rule: string; platform: string }[] = [];
for (const rule of readdirSync(FIX)) for (const platform of readdirSync(join(FIX, rule))) pairs.push({ rule, platform });

for (const { rule, platform } of pairs) {
  test(`${rule} [${platform}] flags the bad fixture`, () => {
    const r = scan(join(FIX, rule, platform, 'bad'), { only: [rule] });
    assert.ok(r.findings.length > 0, `expected findings for ${rule} in bad/, got none`);
    assert.ok(r.score < 100, `${rule} bad/ should cost points`);
    assert.ok(r.findings.every((f) => f.rule === rule));
  });
  test(`${rule} [${platform}] passes the good fixture`, () => {
    const r = scan(join(FIX, rule, platform, 'good'), { only: [rule] });
    const free = ruleCatalog().find((c) => c.id === rule)?.free ?? 0;
    if (free) {
      // rules with an allowance may report findings, but must not cost points
      assert.equal(r.score, 100, r.findings.map((f) => f.message).join('\n'));
    } else {
      assert.deepEqual(
        r.findings.map((f) => `${f.file}:${f.line} ${f.message}`),
        [],
      );
    }
  });
}

test('every rule id has at least one fixture pair', () => {
  const have = new Set(pairs.map((p) => p.rule));
  const missing = ruleCatalog()
    .map((r) => r.id)
    .filter((id) => !have.has(id));
  assert.deepEqual(missing, []);
});

test('every fixture directory has bad and good', () => {
  for (const { rule, platform } of pairs) {
    assert.ok(existsSync(join(FIX, rule, platform, 'bad')), `${rule}/${platform}/bad`);
    assert.ok(existsSync(join(FIX, rule, platform, 'good')), `${rule}/${platform}/good`);
  }
});
