// Steuert Symcon-Weboberflächen (Kachel-Visualisierung, WebFront, Konsole) per Edge headless (DevTools-Protokoll) und speichert PNG-Screenshots.
// Aufruf: node tile-screenshot.mjs <Ausgabeordner> <Breite> <Hoehe> <Aktion>...
// Umgebungsvariablen: TILE_URL (Startseite, Standard http://127.0.0.1:3777/tile/), EDGE (Pfad zu msedge.exe)
// Aktionen: wait:<ms>  click:<x>,<y>  dblclick:<x>,<y>  move:<x>,<y>  drag:<x1>,<y1>,<x2>,<y2>  size:<Breite>,<Hoehe>
//           type:<Text>  key:Enter|Escape  nav:<URL>  eval:<JS (URL-kodiert)>  targets
//           shot:<Name>  shotel:<Name>:<Titel> (WebFront-Rahmen .ipsInstance mit diesem Titel)
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [outDir, width, height, ...actions] = process.argv.slice(2);
// Zufälliger Port, damit parallele Läufe (andere Sitzungen) nicht kollidieren
const port = 9400 + Math.floor(Math.random() * 500);
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
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  // JavaScript-Dialoge (confirm/alert) protokollieren und ablehnen
  if (m.method === 'Page.javascriptDialogOpening') {
    console.log('DIALOG ' + m.params.type + ': ' + m.params.message);
    ws.send(JSON.stringify({ id: 999999, method: 'Page.handleJavaScriptDialog', params: { accept: false } }));
  }
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Page.enable');
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
  if (cmd === 'eval') {
    const r = await send('Runtime.evaluate', { expression: decodeURIComponent(a.substring(5)), returnByValue: true, awaitPromise: true });
    console.log(JSON.stringify(r.result.result.value ?? r.result));
  }
  if (cmd === 'nav') {
    await send('Page.navigate', { url: decodeURIComponent(a.substring(4)) });
  }
  if (cmd === 'targets') {
    const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    console.log(t.map((x) => x.type + ' ' + x.url).join(' ;; '));
  }
  if (cmd === 'shotel') {
    // shotel:<Name>:<Titeltext> nimmt den WebFront-Rahmen (.ipsInstance) mit diesem Titel auf
    const [, name, ...rest] = a.split(':');
    const title = decodeURIComponent(rest.join(':'));
    const expr = `(() => { const t = [...document.querySelectorAll('.ipsInstance > .content > .title')].find(e => e.textContent.trim() === ${JSON.stringify(title)}); if (!t) return null; const r = t.closest('.ipsInstance').getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height }; })()`;
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    const rect = r.result.result.value;
    if (!rect) { console.log('NOT FOUND ' + title); continue; }
    const m = 6;
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: Math.max(0, rect.x - m), y: Math.max(0, rect.y - m), width: rect.width + 2 * m, height: rect.height + 2 * m, scale: 1 } });
    writeFileSync(join(outDir, name + '.png'), Buffer.from(shot.result.data, 'base64'));
    console.log(name + ' ' + Math.round(rect.width) + 'x' + Math.round(rect.height));
  }
  if (cmd === 'type') {
    await send('Input.insertText', { text: decodeURIComponent(a.substring(5)) });
  }
  if (cmd === 'key') {
    const keys = { Enter: [13, 'Enter', String.fromCharCode(13)], Escape: [27, 'Escape', ''] };
    const [code, key, text] = keys[arg];
    await send('Input.dispatchKeyEvent', { type: 'keyDown', windowsVirtualKeyCode: code, key, code: key, text });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: code, key, code: key });
  }
  if (cmd === 'dblclick') {
    const [x, y] = arg.split(',').map(Number);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    for (const c of [1, 2]) {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: c });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: c });
    }
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
ws.close();
// Edge startet Kindprozesse; nur proc.kill() lässt sie weiterlaufen (Profil und Port bleiben belegt)
// Alle Edge-Prozesse mit diesem Profil beenden (nur dieses Profil, nicht den Browser des Nutzers)
spawnSync('powershell', ['-NoProfile', '-Command',
  `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${profile.replace(/'/g, "''")}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`]);
process.exit(0);
