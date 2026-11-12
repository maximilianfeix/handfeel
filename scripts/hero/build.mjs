// Composes the hero assets from the four real recordings.
// usage: HERO_WORK=<dir> node scripts/hero/build.mjs [hero|wide|square|all]
// All text and chrome (phone bodies, labels, scores, the light/dark caption, intro and end cards)
// is HTML rendered to PNG with Playwright, using brand/fonts/Bricolage.ttf. (The Homebrew ffmpeg
// used here has no drawtext filter.) ffmpeg only scales, corner-masks, cross-fades and overlays.
// App screens are the recordings, unchanged apart from scaling.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = require('playwright');

const REPO = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
// Working folder with the four takes (<app>-<dark|light>.mp4); outputs go to <work>/build.
const H = process.env.HERO_WORK ?? REPO + '/.work/hero';
const B = H + '/build';
const FONT = REPO + '/brand/fonts/Bricolage.ttf';
// Scores come from the scanner at build time, so the video can't drift from the repo.
import { scan as hfScan } from '../../dist/src/index.js';
const SCORE_BEFORE = hfScan('evals/apps/expo-budget/before').score;
const SCORE_AFTER = hfScan('evals/apps/expo-budget/after').score;
const C = { ink: '#151412', paper: '#F4F1EA', clay: '#E0592A', muted: '#A49E93', body: '#262420', edge: '#3A3631' };
const ASPECT = 390 / 844;
mkdirSync(B, { recursive: true });

// Main sequence: dark take (3.0 s) -> light take (7.6 s) -> back to dark. 0.3 s cross-fades.
const MAIN = 10.4;
const X1 = 2.7, X2 = 10.0, XD = 0.3;

const formats = {
  hero: { W: 1200, H: 1060, sh: 780, cx: [370, 830], top: 160, label: 'above', caption: 22, side: false },
  wide: { W: 1920, H: 1080, sh: 780, cx: [720, 1200], top: 172, label: 'above', caption: 22, side: true },
  square: { W: 1080, H: 1080, sh: 760, cx: [322, 758], top: 168, label: 'above', caption: 20, side: false },
};
for (const f of Object.values(formats)) {
  f.sw = Math.round((f.sh * ASPECT) / 2) * 2;
  f.r = Math.round(f.sw * 0.065);
  f.bz = Math.round(f.sw * 0.032);
  f.x = f.cx.map((c) => Math.round(c - f.sw / 2));
}

const css = `
@font-face { font-family: B; src: url(data:font/ttf;base64,${readFileSync(FONT).toString('base64')}); }
* { margin: 0; box-sizing: border-box; }
body { background: transparent; font-family: B; color: ${C.paper}; -webkit-font-smoothing: antialiased; }
.t { position: absolute; white-space: nowrap; }
.w700 { font-variation-settings: 'wght' 700, 'opsz' 96; letter-spacing: -0.025em; }
.w600 { font-variation-settings: 'wght' 600, 'opsz' 48; }
.w450 { font-variation-settings: 'wght' 450, 'opsz' 14; }
.mono { font-family: Menlo, monospace; }
`;

function mark(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><path d="M36.949 53.436A22.0 22.0 0 1 1 53.436 36.949" fill="none" stroke="${C.paper}" stroke-width="7.0" stroke-linecap="round"/><circle cx="32.0" cy="32.0" r="9.5" fill="${C.clay}"/></svg>`;
}

function mainLayer(f) {
  const { W, sw, sh, r, bz, x, top } = f;
  const phones = x.map((px) => `<div style="position:absolute;left:${px - bz}px;top:${top - bz}px;width:${sw + 2 * bz}px;height:${sh + 2 * bz}px;border-radius:${r + bz}px;background:${C.body};box-shadow:inset 0 0 0 1.5px ${C.edge}"></div>`).join('');
  const ls = Math.round(sw * 0.09);
  const labelY = top - bz - ls - Math.round(ls * 0.75);
  const labels = [
    ['Generated', C.muted],
    ['After handfeel fix', C.paper],
  ].map(([t, col], i) => `<div class="t w600" style="left:${f.cx[i]}px;top:${labelY}px;transform:translateX(-50%);font-size:${ls}px;color:${col}">${t}</div>`).join('');
  const ss = Math.round(sw * 0.1);
  const sy = top + sh + bz + Math.round(ss * 0.45);
  const scores = `
    <div class="t w700" style="left:${f.cx[0]}px;top:${sy}px;transform:translateX(-50%);font-size:${ss}px;color:${C.muted}">${SCORE_BEFORE}<span style="font-size:.5em;opacity:.8"> / 100</span></div>
    <div class="t w700" style="left:${(f.cx[0] + f.cx[1]) / 2}px;top:${sy}px;transform:translateX(-50%);font-size:${ss}px;color:${C.clay}">&rarr;</div>
    <div class="t w700" style="left:${f.cx[1]}px;top:${sy}px;transform:translateX(-50%);font-size:${ss}px;color:${C.paper}">${SCORE_AFTER}<span style="font-size:.5em;opacity:.8"> / 100</span></div>
    <div class="t w450" style="left:${(f.cx[0] + f.cx[1]) / 2}px;top:${sy + ss * 1.32}px;transform:translateX(-50%);font-size:${Math.round(ss * 0.4)}px;color:${C.muted}">score from <span class="mono" style="color:${C.paper}">handfeel scan</span></div>`;
  let side = '';
  if (f.side) {
    const before = ['purple-gradient', 'no-dark-mode', 'hardcoded-color', 'no-press-feedback', 'glassmorphism', 'type-scale-sprawl', 'icon-button-no-label'];
    const after = ['Flat surfaces', 'Follows light and dark', 'Pressed states, ripple', 'Selection haptics', '44 pt touch targets', '7 type roles, not 13 sizes'];
    const fs = 22, lh = 40, y0 = top + 150;
    side = `
      <div class="t w600" style="right:${W - (x[0] - bz - 70)}px;top:${y0 - 70}px;font-size:26px;color:${C.muted};text-align:right">What the scanner found</div>
      ${before.map((b, i) => `<div class="t mono" style="right:${W - (x[0] - bz - 70)}px;top:${y0 + i * lh}px;font-size:${fs}px;color:${C.paper};text-align:right">${b}</div>`).join('')}
      <div class="t w600" style="left:${x[1] + sw + bz + 70}px;top:${y0 - 70}px;font-size:26px;color:${C.muted}">What the fix changed</div>
      ${after.map((b, i) => `<div class="t w450" style="left:${x[1] + sw + bz + 70}px;top:${y0 + i * lh - 3}px;font-size:${fs + 4}px;color:${C.paper}">${b}</div>`).join('')}
      <div class="t w450" style="left:${x[1] + sw + bz + 70}px;top:${y0 + after.length * lh + 22}px;font-size:18px;color:${C.muted};width:330px;white-space:normal;line-height:1.4">Ripple and haptics are native only. This recording is Expo Web.</div>`;
  }
  return `<div style="position:relative;width:${W}px;height:${f.H}px;background:${C.ink}">${phones}${labels}${scores}${side}</div>`;
}

function maskLayer(f) {
  return `<div style="width:${f.sw}px;height:${f.sh}px;background:#000"><div style="width:100%;height:100%;border-radius:${f.r}px;background:#fff"></div></div>`;
}

function introLayer(f) {
  const m = Math.round(f.H * 0.13);
  return `<div style="position:relative;width:${f.W}px;height:${f.H}px;background:${C.ink};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${m * 0.35}px">
    <div style="display:flex;align-items:center;gap:${m * 0.28}px">${mark(m)}<div class="w700" style="font-size:${m * 1.05}px;line-height:1">handfeel</div></div>
    <div class="w450" style="font-size:${Math.round(m * 0.34)}px;color:${C.muted}">Removes the AI look from generated mobile apps</div>
  </div>`;
}

function outroLayer(f) {
  const m = Math.round(f.H * 0.085);
  return `<div style="position:relative;width:${f.W}px;height:${f.H}px;background:${C.ink};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${m * 0.5}px">
    <div style="display:flex;align-items:center;gap:${m * 0.28}px">${mark(m)}<div class="w700" style="font-size:${m * 1.05}px;line-height:1">handfeel</div></div>
    <div class="mono" style="font-size:${Math.round(m * 0.5)}px;color:${C.paper};background:#22201D;border:1.5px solid ${C.edge};border-radius:12px;padding:${m * 0.28}px ${m * 0.45}px"><span style="color:${C.muted}">$</span> npx handfeel scan .</div>
    <div class="w450" style="font-size:${Math.round(m * 0.36)}px;color:${C.muted}">github.com/maximilianfeix/handfeel</div>
  </div>`;
}

async function render(page, html, w, h, out) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body>${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
  await page.screenshot({ path: out, omitBackground: true });
}

function ff(args) {
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });
}

// Per-phone screen sequence: dark take, cross-fade to light take, cross-fade back to dark.
function seq(app, idx, f) {
  const i = idx * 3;
  return `[${i + 2}:v]settb=1/30,fps=30[${app}d1];[${i + 3}:v]settb=1/30,fps=30[${app}l];[${i + 4}:v]settb=1/30,fps=30[${app}d2];` +
    `[${app}d1][${app}l]xfade=transition=fade:duration=${XD}:offset=${X1}[${app}a];` +
    `[${app}a][${app}d2]xfade=transition=fade:duration=${XD}:offset=${X2},trim=0:${MAIN},setpts=PTS-STARTPTS,` +
    `scale=${f.sw}:${f.sh}:flags=lanczos,format=rgba[${app}s];` +
    `[${app}s][m${app}]alphamerge[${app}m];`;
}

const CAP_Y = (f) => (f.side ? 26 : f.W === 1080 ? 26 : 22);
const CAP_W = (f) => Math.round(f.caption * 17);
const CAP_H = (f) => Math.round(f.caption * 2.6);
function captionLayer(f, text) {
  const fs = f.caption, d = Math.round(fs * 0.5);
  const light = text.includes('light');
  return `<div style="position:relative;width:${CAP_W(f)}px;height:${CAP_H(f)}px;background:${C.ink};display:flex;align-items:center;justify-content:center">
    <div class="w600" style="font-size:${fs}px;color:${C.paper};border:1.5px solid ${C.edge};background:#1E1C19;border-radius:999px;padding:${Math.round(fs * 0.38)}px ${Math.round(fs * 0.8)}px;display:flex;align-items:center;gap:${Math.round(fs * 0.45)}px">
      <span style="width:${d}px;height:${d}px;border-radius:50%;background:${light ? C.paper : C.ink};box-shadow:0 0 0 1.5px ${C.muted}"></span>${text}</div></div>`;
}

async function buildMain(name, page) {
  const f = formats[name];
  await render(page, mainLayer(f), f.W, f.H, `${B}/${name}-bg.png`);
  await render(page, maskLayer(f), f.sw, f.sh, `${B}/${name}-mask.png`);
  await render(page, captionLayer(f, 'Phone set to dark mode'), CAP_W(f), CAP_H(f), `${B}/${name}-cap-dark.png`);
  await render(page, captionLayer(f, 'Phone set to light mode'), CAP_W(f), CAP_H(f), `${B}/${name}-cap-light.png`);
  const inputs = ['-loop', '1', '-framerate', '30', '-t', String(MAIN), '-i', `${B}/${name}-bg.png`, '-loop', '1', '-framerate', '30', '-t', String(MAIN), '-i', `${B}/${name}-mask.png`];
  for (const app of ['before', 'after']) inputs.push('-i', `${H}/${app}-dark.mp4`, '-i', `${H}/${app}-light.mp4`, '-i', `${H}/${app}-dark.mp4`);
  const L = (p, t) => ['-loop', '1', '-framerate', '30', '-t', String(t), '-i', p];
  inputs.push(...L(`${B}/${name}-cap-dark.png`, 3), ...L(`${B}/${name}-cap-light.png`, 7.6), ...L(`${B}/${name}-cap-dark.png`, 3));
  const g =
    `[1:v]format=gray,split=2[mbefore][mafter];` +
    seq('before', 0, f) + seq('after', 1, f) +
    `[0:v]format=rgba[bg];[bg][beforem]overlay=${f.x[0]}:${f.top}[o1];[o1][afterm]overlay=${f.x[1]}:${f.top}[o2];` +
    `[8:v]format=rgb24,settb=1/30[c1];[9:v]format=rgb24,settb=1/30[c2];[10:v]format=rgb24,settb=1/30[c3];` +
    `[c1][c2]xfade=transition=fade:duration=${XD}:offset=${X1}[ca];[ca][c3]xfade=transition=fade:duration=${XD}:offset=${X2},trim=0:${MAIN},setpts=PTS-STARTPTS[cap];` +
    `[o2][cap]overlay=${Math.round((f.W - CAP_W(f)) / 2)}:${CAP_Y(f)},format=yuv420p[out]`;
  ff([...inputs, '-filter_complex', g, '-map', '[out]', '-r', '30', '-t', String(MAIN), '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', `${B}/${name}-main.mp4`]);
  console.log(`${B}/${name}-main.mp4`);
}

async function buildCards(name, page) {
  const f = formats[name];
  await render(page, introLayer(f), f.W, f.H, `${B}/${name}-intro.png`);
  await render(page, outroLayer(f), f.W, f.H, `${B}/${name}-outro.png`);
}

function buildFull(name, out) {
  const IN = 2.6, OUT = 4.6, D = 0.5;
  const g = `[0:v]settb=1/30,fps=30,format=yuv420p[i];[1:v]settb=1/30,fps=30,format=yuv420p[m];[2:v]settb=1/30,fps=30,format=yuv420p[o];` +
    `[i][m]xfade=transition=fade:duration=${D}:offset=${IN - D}[im];[im][o]xfade=transition=fade:duration=${D}:offset=${IN - D + MAIN - D},scale=out_range=tv:out_color_matrix=bt709,format=yuv420p[out]`;
  ff(['-loop', '1', '-framerate', '30', '-t', String(IN), '-i', `${B}/${name}-intro.png`, '-i', `${B}/${name}-main.mp4`,
    '-loop', '1', '-framerate', '30', '-t', String(OUT), '-i', `${B}/${name}-outro.png`,
    '-filter_complex', g, '-map', '[out]', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow',
    '-movflags', '+faststart', '-r', '30', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', out]);
  console.log(out);
}

const which = process.argv[2] ?? 'all';
const browser = await chromium.launch();
const page = await browser.newPage();
for (const name of which === 'all' ? Object.keys(formats) : [which]) {
  await buildMain(name, page);
  if (name !== 'hero') {
    await buildCards(name, page);
    buildFull(name, `${B}/${name}-full.mp4`);
  }
}
await browser.close();
