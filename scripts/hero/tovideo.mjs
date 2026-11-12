// Turns captured frames + timestamps into a constant 30 fps video.
// usage: node scripts/hero/tovideo.mjs <recDir> <out.mp4> [duration]
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [dir, out, durArg] = process.argv.slice(2);
const { t0, frames } = JSON.parse(readFileSync(dir + '/timeline.json', 'utf8'));
const FPS = 30, dur = +(durArg ?? 12.6);
const lines = [];
let j = 0;
for (let i = 0; i < Math.round(dur * FPS); i++) {
  const t = t0 + i / FPS;
  while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
  lines.push(`file 'frames/${frames[j].name}'`, `duration ${1 / FPS}`);
}
lines.push(`file 'frames/${frames[j].name}'`);
writeFileSync(dir + '/concat.txt', lines.join('\n'));
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', dir + '/concat.txt',
  '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '12', '-preset', 'medium', '-t', String(dur), out], { stdio: 'inherit' });
console.log(out);
