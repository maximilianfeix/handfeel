// Screenshots of an Expo Web app at phone size.
// usage: node scripts/shoot.mjs <baseUrl> <outDir> <route>... [--dark] [--width=390 --height=844]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const [base, out, ...routes] = args.filter((a) => !a.startsWith('--'));
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: +(flags.width ?? 390), height: +(flags.height ?? 844) },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  colorScheme: flags.dark ? 'dark' : 'light',
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
for (const r of routes.length ? routes : ['/']) {
  await page.goto(base + r, { waitUntil: 'networkidle' });
  await page.waitForTimeout(+(flags.wait ?? 1500));
  const name = (r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '-')) + (flags.dark ? '-dark' : '');
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`${out}/${name}.png`);
}
if (errors.length) console.error('page errors:', errors.slice(0, 5));
await browser.close();
