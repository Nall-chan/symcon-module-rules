// Steuert die Kachel-Visualisierung per Edge headless (DevTools-Protokoll) und speichert PNG-Screenshots.
// Aufruf: node tile-screenshot.mjs <Ausgabeordner> <Breite> <Hoehe> <Aktion>...
// Umgebungsvariable TILE_URL (Standard http://127.0.0.1:3777/tile/), EDGE (Pfad zu msedge.exe)
// Aktionen: wait:<ms>  click:<x>,<y>  move:<x>,<y>  drag:<x1>,<y1>,<x2>,<y2>  size:<Breite>,<Hoehe>  shot:<Name>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [outDir, width, height, ...actions] = process.argv.slice(2);
const port = 9333;
const edge = process.env.EDGE ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const profile = join(outDir, 'profile');
mkdirSync(profile, { recursive: true });
const proc = spawn(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targets;
for (let i = 0; i < 50; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch { }
  await sleep(200);
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Emulation.setDeviceMetricsOverride', { width: +width, height: +height, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: process.env.TILE_URL ?? 'http://127.0.0.1:3777/tile/' });
for (const a of actions) {
  const [cmd, arg] = a.split(':');
  if (cmd === 'wait') await sleep(+arg);
  if (cmd === 'click') {
    const [x, y] = arg.split(',').map(Number);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  }
  if (cmd === 'move') {
    const [x, y] = arg.split(',').map(Number);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  }
  if (cmd === 'size') {
    const [w, h] = arg.split(',').map(Number);
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  }
  if (cmd === 'drag') {
    const [x1, y1, x2, y2] = arg.split(',').map(Number);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x1, y: y1 });
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x1, y: y1, button: 'left', clickCount: 1 });
    for (let s = 1; s <= 20; s++) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x1 + (x2 - x1) * s / 20, y: y1 + (y2 - y1) * s / 20, button: 'left', buttons: 1 });
      await sleep(30);
    }
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x2, y: y2, button: 'left', clickCount: 1 });
  }
  if (cmd === 'shot') {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(outDir, arg + '.png'), Buffer.from(r.result.data, 'base64'));
  }
}
ws.close(); proc.kill();
process.exit(0);
