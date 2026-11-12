// README hero from the flutter-fitness eval: two dark phones, numbered callouts on the generated
// app, and the score counting from the "before" scan to the "after" scan.
// usage: node scripts/hero/fitness.mjs [webp|still|all]
//   env HERO_WORK          scratch folder for frames (default .work/hero-fitness)
//   env HERO_FITNESS_SHOTS folder holding flutter-fitness-before/ and flutter-fitness-after/ with the
//                          CI web renders (default .work/ci2, searched recursively for home.png / home-dark.png)
// Outputs docs/assets/hero-fitness.webp (animated) and docs/assets/hero-fitness-still.png.
//
// App pixels are the CI renders (Flutter web, 390x844 @3x), only scaled (Lanczos) and corner-masked.
// Callouts, labels and scores are HTML rendered with Playwright. Every callout names findings that
// must exist in the live scan of evals/apps/flutter-fitness/before; the script stops if one is missing.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { scan as hfScan } from '../../dist/src/index.js';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { chromium } = require('playwright');

const REPO = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');
const W = process.env.HERO_WORK ?? REPO + '/.work/hero-fitness';
const SHOTS = process.env.HERO_FITNESS_SHOTS ?? REPO + '/.work/ci2';
const OUT = REPO + '/docs/assets';
const FONT = REPO + '/brand/fonts/Bricolage.ttf';
const C = { ink: '#151412', paper: '#F4F1EA', clay: '#E0592A', muted: '#A49E93', body: '#262420', edge: '#3A3631' };

// Scores, verdicts and findings come from the scanner at build time.
const before = hfScan(REPO + '/evals/apps/flutter-fitness/before');
const after = hfScan(REPO + '/evals/apps/flutter-fitness/after');
function finding(rule, file, line) {
  const f = before.findings.find((x) => x.rule === rule && x.file === file && x.line === line);
  if (!f) throw new Error(`callout source missing from scan: ${rule} ${file}:${line}`);
  return f;
}
const sizes = finding('type-scale-sprawl', 'lib/screens/home_screen.dart', 39).message.match(/(\d+) distinct sizes/)[1];

// Callouts. `box` is the target on the 1170x2532 render (x, y, w, h, corner radius), `circle` is
// cx, cy, r. `src` lists the findings (rule, file, line) the callout stands for.
const CALLOUTS = [
  {
    rule: 'type-scale-sprawl', label: `${sizes} font sizes`,
    src: [['type-scale-sprawl', 'lib/screens/home_screen.dart', 39], ['type-scale-sprawl', 'lib/screens/home_screen.dart', 43], ['type-scale-sprawl', 'lib/screens/home_screen.dart', 63]],
    box: [30, 34, 362, 214, 24],
  },
  {
    rule: 'gradient-overuse', label: 'sweep gradient ring',
    src: [['gradient-overuse', 'lib/widgets/progress_ring.dart', 61]],
    circle: [324, 580, 222],
  },
  {
    rule: 'glassmorphism', label: 'frosted white borders',
    src: [['glassmorphism', 'lib/widgets/stat_chip.dart', 26], ['glassmorphism', 'lib/screens/home_screen.dart', 75]],
    box: [44, 880, 1082, 356, 66],
  },
  {
    rule: 'hardcoded-color', label: 'literal violet gradient',
    src: [['hardcoded-color', 'lib/data.dart', 13], ['gradient-overuse', 'lib/widgets/workout_card.dart', 28]],
    box: [44, 1420, 1082, 600, 96],
  },
];
for (const c of CALLOUTS) for (const s of c.src) finding(...s);

function findShot(dir, name) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { const r = findShot(p, name); if (r) return r; } else if (e === name) return p;
  }
  return null;
}
const SHOT_BEFORE = findShot(SHOTS + '/flutter-fitness-before', 'home.png'); // the app is dark-only
const SHOT_AFTER = findShot(SHOTS + '/flutter-fitness-after', 'home-dark.png');
if (!SHOT_BEFORE || !SHOT_AFTER) throw new Error('CI renders not found under ' + SHOTS);
const SRC_W = 1170, SRC_H = 2532;

const formats = {
  // README: 1200 wide, plays at 860 on GitHub.
  webp: { W: 1200, H: 924, sh: 680, top: 104, x: [372, null], right: 40, fs: 21, files: false, lockup: false },
  // Social card: final state, file:line under each callout.
  still: { W: 1600, H: 900, sh: 660, top: 112, x: [620, null], right: 150, fs: 22, files: true, lockup: true },
};
for (const f of Object.values(formats)) {
  f.sw = Math.round((f.sh * SRC_W) / SRC_H / 2) * 2;
  f.x[1] = f.W - f.right - f.sw;
  f.r = Math.round(f.sw * 0.065);
  f.bz = Math.round(f.sw * 0.032);
  f.k = f.sw / SRC_W;
}

const css = `
@font-face { font-family: B; src: url(data:font/ttf;base64,${readFileSync(FONT).toString('base64')}); }
* { margin: 0; box-sizing: border-box; }
body { background: ${C.ink}; font-family: B; color: ${C.paper}; -webkit-font-smoothing: antialiased; }
.t { position: absolute; white-space: nowrap; }
.w700 { font-variation-settings: 'wght' 700, 'opsz' 96; letter-spacing: -0.025em; }
.w600 { font-variation-settings: 'wght' 600, 'opsz' 48; }
.w450 { font-variation-settings: 'wght' 450, 'opsz' 14; }
.mono { font-family: Menlo, monospace; }
#san { font-variant-numeric: tabular-nums; }
.a { opacity: 0; }
`;

function mark(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><path d="M36.949 53.436A22.0 22.0 0 1 1 53.436 36.949" fill="none" stroke="${C.paper}" stroke-width="7.0" stroke-linecap="round"/><circle cx="32.0" cy="32.0" r="9.5" fill="${C.clay}"/></svg>`;
}

// "lib/screens/home_screen.dart" 39, 43 -> "home_screen.dart:39,43", one entry per file.
function fileRefs(src) {
  const by = new Map();
  for (const [, file, line] of src) {
    const k = file.split('/').pop();
    by.set(k, [...(by.get(k) ?? []), line]);
  }
  return [...by].map(([k, ls]) => `${k}:${[...new Set(ls)].join(',')}`).join('  ');
}

function page(f, img) {
  const { sw, sh, r, bz, top, k, fs } = f;
  const cx = f.x.map((x) => x + sw / 2);
  const phones = f.x.map((px, i) => `
    <div style="position:absolute;left:${px - bz}px;top:${top - bz}px;width:${sw + 2 * bz}px;height:${sh + 2 * bz}px;border-radius:${r + bz}px;background:${C.body};box-shadow:inset 0 0 0 1.5px ${C.edge}"></div>
    <img src="${img[i]}" style="position:absolute;left:${px}px;top:${top}px;width:${sw}px;height:${sh}px;border-radius:${r}px">`).join('');
  const ls = Math.round(sw * 0.075);
  const labelY = top - bz - ls - Math.round(ls * 0.8);
  const labels = [['Generated', C.muted], ['After handfeel fix', C.paper]]
    .map(([t, col], i) => `<div class="t w600" style="left:${cx[i]}px;top:${labelY}px;transform:translateX(-50%);font-size:${ls}px;color:${col}">${t}</div>`).join('');

  // Callouts: target outline on the screen, a leader to the badge at the phone edge, text to its left.
  const bd = Math.round(fs * 1.45);
  const badgeX = f.x[0] - bz - 18 - bd; // badge left edge
  const svg = [];
  const html = [];
  CALLOUTS.forEach((c, i) => {
    let ty, tx; // target anchor (left edge, vertical centre) in page px
    if (c.circle) {
      const [ccx, ccy, cr] = c.circle;
      svg.push(`<circle id="o${i}" class="a" cx="${f.x[0] + ccx * k}" cy="${top + ccy * k}" r="${cr * k}" fill="none" stroke="${C.clay}" stroke-width="2"/>`);
      tx = f.x[0] + (ccx - cr) * k; ty = top + ccy * k;
    } else {
      const [bx, by, bw, bh, br] = c.box;
      svg.push(`<rect id="o${i}" class="a" x="${f.x[0] + bx * k}" y="${top + by * k}" width="${bw * k}" height="${bh * k}" rx="${br * k}" fill="none" stroke="${C.clay}" stroke-width="2"/>`);
      tx = f.x[0] + bx * k; ty = top + (by + bh / 2) * k;
    }
    const lx0 = badgeX + bd;
    svg.push(`<line id="l${i}" class="a" x1="${lx0}" y1="${ty}" x2="${tx}" y2="${ty}" stroke="${C.clay}" stroke-width="2"/>`);
    const files = f.files ? `<div class="mono" style="font-size:${Math.round(fs * 0.72)}px;color:${C.muted};margin-top:${Math.round(fs * 0.3)}px">${fileRefs(c.src)}</div>` : '';
    html.push(`
      <div id="c${i}" class="a" style="position:absolute;left:0;top:0;width:${f.W}px;height:${f.H}px">
        <div class="t w700" style="left:${badgeX}px;top:${ty - bd / 2}px;width:${bd}px;height:${bd}px;border-radius:50%;background:${C.clay};color:${C.ink};font-size:${Math.round(fs * 0.95)}px;display:flex;align-items:center;justify-content:center;letter-spacing:0">${i + 1}</div>
        <div class="t" style="right:${f.W - badgeX + 14}px;top:${ty}px;transform:translateY(-50%);text-align:right">
          <div class="mono" style="font-size:${fs}px;color:${C.paper};line-height:1.2">${c.rule}</div>
          <div class="w450" style="font-size:${Math.round(fs * 0.86)}px;color:${C.muted};line-height:1.3;margin-top:2px">${c.label}</div>
          ${files}
        </div>
      </div>`);
  });

  // Score row.
  const ss = Math.round(sw * 0.15);
  const sy = top + sh + bz + Math.round(ss * 0.38);
  const vs = Math.round(ss * 0.36);
  const score = (x, id, val, col, verdict, cls) => `
    <div class="t w700 ${cls}" id="${id}" style="left:${x}px;top:${sy}px;transform:translateX(-50%);font-size:${ss}px;line-height:1;color:${col}"><span id="${id}n">${val}</span><span style="font-size:.42em;color:${C.muted}"> / 100</span></div>
    <div class="t w450 ${cls}" id="${id}v" style="left:${x}px;top:${sy + ss * 1.12}px;transform:translateX(-50%);font-size:${vs}px;color:${C.muted}">${verdict}</div>`;
  const scores = score(cx[0], 'sb', before.score, C.muted, before.grade, '') +
    score(cx[1], 'sa', before.score, C.clay, after.grade, 'a') +
    `<div class="t w700 a" id="arr" style="left:${(cx[0] + cx[1]) / 2}px;top:${sy + ss * 0.12}px;transform:translateX(-50%);font-size:${Math.round(ss * 0.7)}px;line-height:1;color:${C.muted}">&rarr;</div>`;
  const key = f.lockup ? '' : `<div class="t" style="right:${f.W - badgeX + 14}px;top:${sy + 4}px;text-align:right">
      <div class="mono" style="font-size:${fs}px;color:${C.paper}">handfeel scan</div>
      <div class="w450" style="font-size:${Math.round(fs * 0.86)}px;color:${C.muted};margin-top:2px">score out of 100</div></div>`;
  const lockup = f.lockup ? `<div class="t" style="left:72px;top:34px;display:flex;align-items:center;gap:14px">${mark(46)}<div class="w700" style="font-size:46px;line-height:1">handfeel</div></div>
    <div class="t w450" style="left:72px;top:${sy + 6}px;font-size:24px;color:${C.muted};white-space:normal;width:${badgeX - 120}px;line-height:1.35">Removes the AI look from generated mobile apps</div>` : '';

  return `<div style="position:relative;width:${f.W}px;height:${f.H}px;background:${C.ink};overflow:hidden">
    ${phones}${labels}${lockup}
    <svg style="position:absolute;left:0;top:0" width="${f.W}" height="${f.H}">${svg.join('')}</svg>
    ${html.join('')}${scores}${key}</div>`;
}

// Timeline (seconds). Callouts in one by one, then the count, hold, and everything added fades
// back out so the last frame matches the first.
const T = { first: 0.6, step: 0.6, fade: 0.35, countAt: 3.4, countDur: 1.6, outAt: 8.5, outDur: 0.5, end: 9.2 };
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
function state(t) {
  const out = 1 - ease((t - T.outAt) / T.outDur);
  const s = { c: CALLOUTS.map((_, i) => +(ease((t - T.first - i * T.step) / T.fade) * out).toFixed(3)) };
  const p = ease((t - T.countAt) / T.countDur);
  s.sa = +((t >= T.countAt - 0.25 ? ease((t - T.countAt + 0.25) / 0.25) : 0) * out).toFixed(3);
  s.n = Math.round(before.score + (after.score - before.score) * p);
  s.v = +(ease((t - T.countAt - T.countDur + 0.2) / 0.4) * out).toFixed(3);
  return s;
}

function ff(args) { execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); }

async function build(name, browser) {
  const f = formats[name];
  const dir = `${W}/${name}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir + '/frames', { recursive: true });
  // Lanczos downscale of the CI renders, no other change.
  const imgs = [SHOT_BEFORE, SHOT_AFTER].map((p, i) => {
    const o = `${dir}/screen-${i}.png`;
    ff(['-i', p, '-vf', `scale=${f.sw}:${f.sh}:flags=lanczos`, o]);
    return 'data:image/png;base64,' + readFileSync(o).toString('base64');
  });
  const pg = await browser.newPage({ viewport: { width: f.W, height: f.H } });
  await pg.setContent(`<!doctype html><html><head><style>${css}</style></head><body>${page(f, imgs)}</body></html>`);
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(150);
  const apply = (s) => pg.evaluate((s) => {
    const op = (id, v) => { document.getElementById(id).style.opacity = v; };
    s.c.forEach((v, i) => { op('c' + i, v); op('o' + i, v); op('l' + i, v); });
    op('sa', s.sa); op('arr', s.sa); op('sav', s.v);
    document.getElementById('san').textContent = s.n;
  }, s);

  if (name === 'still') {
    await apply(state(7));
    await pg.screenshot({ path: `${OUT}/hero-fitness-still.png` });
    console.log(`${OUT}/hero-fitness-still.png`);
    return pg.close();
  }
  // One PNG per distinct state at 25 fps; repeated states extend the previous frame's duration.
  const fps = 25, frames = [];
  let prev = null;
  for (let i = 0; i < Math.round(T.end * fps); i++) {
    const s = state(i / fps), key = JSON.stringify(s);
    if (key === prev) { frames[frames.length - 1].d += 1000 / fps; continue; }
    prev = key;
    await apply(s);
    const p = `${dir}/frames/f${String(i).padStart(4, '0')}.png`;
    await pg.screenshot({ path: p });
    frames.push({ p, d: 1000 / fps });
  }
  await pg.close();
  const args = ['-loop', '0', '-lossy', '-q', '90', '-m', '6'];
  for (const fr of frames) args.push('-d', String(Math.round(fr.d)), fr.p);
  execFileSync('img2webp', [...args, '-o', `${OUT}/hero-fitness.webp`], { stdio: 'inherit' });
  console.log(`${OUT}/hero-fitness.webp  (${frames.length} distinct frames, ${T.end} s)`);
}

const which = process.argv[2] ?? 'all';
const browser = await chromium.launch();
for (const name of which === 'all' ? Object.keys(formats) : [which]) await build(name, browser);
await browser.close();
