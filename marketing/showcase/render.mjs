// Frame-accurate renderer: seeks each film to every frame, screenshots it and
// pipes the frames into ffmpeg. Usage:
//   node render.mjs                 # all films
//   node render.mjs doradca 30      # one film, custom fps
//   node render.mjs doradca --stills  # PNG contact frames only (fast check)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  const root = (await import('node:child_process')).execSync('npm root -g').toString().trim();
  playwright = require(join(root, 'playwright'));
}

const ROOT = dirname(fileURLToPath(import.meta.url));
const FILMS = ['doradca', 'analiza', 'roadmapa', 'kreator'];
const args = process.argv.slice(2);
const stills = args.includes('--stills');
const named = args.filter((a) => FILMS.includes(a));
const fpsArg = args.find((a) => /^\d+$/.test(a));
const FPS = fpsArg ? Number(fpsArg) : 60;

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const path = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!path.startsWith(ROOT)) throw new Error('outside root');
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(await readFile(path));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await playwright.chromium.launch();
await mkdir(join(ROOT, 'out'), { recursive: true });

for (const film of named.length ? named : FILMS) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/${film}.html?render`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const duration = await page.evaluate(() => window.__duration);

  if (stills) {
    await mkdir(join(ROOT, 'out', 'stills'), { recursive: true });
    const marks = (process.env.AT ?? '').split(',').filter(Boolean).map(Number);
    const times = marks.length ? marks : Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => Math.min(i, duration));
    for (const t of times) {
      await page.evaluate((t) => window.__seek(t), t);
      await page.screenshot({ path: join(ROOT, 'out', 'stills', `${film}-${t.toFixed(1)}.png`) });
    }
    console.log(`${film}: ${times.length} stills`);
    await page.close();
    continue;
  }

  const out = join(ROOT, 'out', `vocare-${film}.mp4`);
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high',
    '-r', String(FPS), '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const frames = Math.round(duration * FPS);
  const started = Date.now();
  for (let i = 0; i <= frames; i++) {
    await page.evaluate((t) => window.__seek(t), i / FPS);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % FPS === 0) process.stdout.write(`\r${film}: ${i}/${frames} frames`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`\r${film}: ${frames} frames in ${((Date.now() - started) / 1000).toFixed(0)}s -> ${out}`);
  await page.close();
}

await browser.close();
server.close();
