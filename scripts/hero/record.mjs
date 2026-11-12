// Records the Expo Web build of the budget app on a fixed, scripted timeline.
// usage: node scripts/hero/record.mjs <outDir> <baseUrl> <dark|light>
// One take per system colour scheme (Playwright colorScheme). Frames are full-resolution
// screenshots (390x844 @2x) with timestamps; a touch dot is drawn just before each tap.
// The dark take holds the home screen for 3 s; the light take taps Add, Transport, Budgets, Home.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = require('playwright');

const out = process.argv[2];
mkdirSync(out + '/frames', { recursive: true });
const BASE = process.argv[3] ?? 'http://localhost:8081';
const MODE = process.argv[4] ?? 'light'; // system colour scheme for this take

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: MODE,
});
// Touch indicator: a dot drawn at the tap point. It is an overlay for the viewer,
// not part of the app.
await ctx.addInitScript(() => {
  window.__tap = (x, y) => {
    const d = document.createElement('div');
    Object.assign(d.style, {
      position: 'fixed', left: x - 22 + 'px', top: y - 22 + 'px', width: '44px', height: '44px',
      borderRadius: '50%', background: 'rgba(224,89,42,0.45)', border: '2px solid rgba(255,255,255,0.9)',
      boxShadow: '0 0 0 1px rgba(0,0,0,0.35)', pointerEvents: 'none', zIndex: 2147483647,
      transform: 'scale(0.6)', opacity: '0', transition: 'transform 140ms ease-out, opacity 140ms ease-out',
    });
    document.body.appendChild(d);
    requestAnimationFrame(() => { d.style.transform = 'scale(1)'; d.style.opacity = '1'; });
    setTimeout(() => { d.style.transition = 'opacity 260ms ease-in, transform 260ms ease-in'; d.style.opacity = '0'; d.style.transform = 'scale(1.25)'; }, 380);
    setTimeout(() => d.remove(), 700);
  };
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// Pre-visit tabs so first navigation does not show a loading flash, then go home.
for (const t of ['Add', 'Budgets', 'Home']) {
  await clickVisible(t, false);
  await page.waitForTimeout(800);
}
await page.waitForTimeout(800);

async function visible(text) {
  const loc = page.getByText(text, { exact: true });
  const n = await loc.count();
  for (let i = n - 1; i >= 0; i--) {
    const b = await loc.nth(i).boundingBox();
    if (!b || b.width === 0 || b.y < 0 || b.y > 844) continue;
    const hit = await loc.nth(i).evaluate((el, [x, y]) => {
      const top = document.elementFromPoint(x, y);
      return !!top && el.contains(top);
    }, [b.x + b.width / 2, b.y + b.height / 2]);
    if (hit) return b;
  }
  throw new Error('not visible: ' + text);
}
async function clickVisible(text, dot = true, dy = 0) {
  const b = await visible(text);
  const x = b.x + b.width / 2, y = b.y + b.height / 2 + dy;
  if (dot) {
    await page.evaluate(([x, y]) => window.__tap(x, y), [x, y]);
    await page.waitForTimeout(150);
  }
  await page.touchscreen.tap(x, y);
}

// Frame capture: full-resolution screenshots in a loop (the DevTools screencast only
// delivers CSS-pixel frames). Each frame is stamped with the middle of its capture.
const frames = [];
let n = 0, recording = true;
const loop = (async () => {
  while (recording) {
    const a = Date.now() / 1000;
    const buf = await page.screenshot({ type: 'jpeg', quality: 92, animations: 'allow', caret: 'initial' });
    const t = (a + Date.now() / 1000) / 2;
    const name = `f${String(n++).padStart(5, '0')}.jpg`;
    writeFileSync(`${out}/frames/${name}`, buf);
    frames.push({ name, t });
  }
})();
await page.waitForTimeout(300);
const t0 = Date.now() / 1000;
const events = [];
const at = async (sec, label, fn) => {
  const wait = t0 + sec - Date.now() / 1000;
  if (wait > 0) await page.waitForTimeout(wait * 1000);
  events.push({ label, t: Date.now() / 1000 - t0 });
  await fn();
};
if (MODE === 'dark') {
  await at(3.0, 'end', async () => {});
} else {
  await at(1.6, 'tap Add', () => clickVisible('Add'));
  await at(2.9, 'tap Transport', () => clickVisible('Transport'));
  await at(4.3, 'tap Budgets', () => clickVisible('Budgets'));
  await at(6.3, 'tap Home', () => clickVisible('Home'));
  await at(7.6, 'end', async () => {});
}
recording = false;
await loop;
await page.waitForTimeout(300);
writeFileSync(`${out}/timeline.json`, JSON.stringify({ t0, events, frames }, null, 1));
console.log(`frames=${frames.length}`, events.map((e) => `${e.label}@${e.t.toFixed(2)}`).join(' '));
if (errors.length) console.error('page errors:', errors.slice(0, 5));
await browser.close();
