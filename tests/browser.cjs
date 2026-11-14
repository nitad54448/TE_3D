/* Full-page smoke tests using an installed Chromium browser and Node 24; no npm dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const browser = process.env.TE_BROWSER || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'
].find(file => fs.existsSync(file));
assert(browser, 'Set TE_BROWSER to an installed Chrome, Edge or Chromium executable.');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let checks = 0;
const passed = label => { checks++; console.log('PASS', label); };
async function until(fn, label, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (await fn()) return; await delay(25); }
  throw new Error('Timed out: ' + label);
}

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'te3d-browser-test-'));
  const server = http.createServer((request, response) => {
    try {
      const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (name !== '/' && name !== '/index.html' && !/^\/(assets|lib)\/[\w.-]+$/.test(name)) { response.writeHead(404).end(); return; }
      const file = path.join(root, name === '/' ? 'index.html' : name.slice(1));
      const types = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css'};
      response.writeHead(200, {'Content-Type': (types[path.extname(file)] || 'text/plain') + ';charset=utf-8', 'Cache-Control': 'public,max-age=86400'});
      response.end(fs.readFileSync(file));
    } catch { response.writeHead(404).end(); }
  });
  let child, socket, send;
  const pending = new Map();
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    let diagnostics = '', endpoint, launchError;
    child = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-background-networking', '--disable-extensions', '--remote-debugging-port=0', '--user-data-dir=' + profile,
      ...process.argv.slice(2), 'about:blank'], {windowsHide: true, stdio: ['ignore', 'ignore', 'pipe']});
    child.stderr.on('data', chunk => {
      diagnostics = (diagnostics + chunk).slice(-10000);
      endpoint = diagnostics.match(/DevTools listening on (ws:\/\/\S+)/)?.[1] ?? endpoint;
    });
    child.on('error', error => { launchError = error; });
    await until(() => {
      if (launchError) throw launchError;
      if (child.exitCode !== null) throw new Error('Browser exited: ' + diagnostics.slice(-2000));
      return endpoint;
    }, 'browser startup', 20000);
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once: true}); socket.addEventListener('error', reject, {once: true}); });
    let sequence = 0;
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data), call = pending.get(message.id);
      if (!call) return;
      pending.delete(message.id); clearTimeout(call.timer);
      if (message.error) call.reject(new Error(message.error.message)); else call.resolve(message.result);
    });
    send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(new Error('Protocol timeout: ' + method)); }, 25000);
      pending.set(id, {resolve, reject, timer}); socket.send(JSON.stringify({id, method, params, sessionId}));
    });
    const open = async (query = '') => {
      const {targetId} = await send('Target.createTarget', {url: 'about:blank'});
      const {sessionId} = await send('Target.attachToTarget', {targetId, flatten: true});
      const command = (method, params) => send(method, params, sessionId);
      await command('Page.enable');
      await command('Page.addScriptToEvaluateOnNewDocument', {source: `
        globalThis.__smoke = {errors: [], requests: [], workers: 0, hold: false};
        addEventListener('error', e => __smoke.errors.push(e.message || 'Script load failed'));
        addEventListener('unhandledrejection', e => __smoke.errors.push(String(e.reason)));
        Storage.prototype.getItem = function () { throw new DOMException('Storage blocked', 'SecurityError'); };
        Storage.prototype.setItem = function () { throw new DOMException('Storage blocked', 'SecurityError'); };
        const nativeFetch = fetch, NativeWorker = Worker;
        globalThis.fetch = (url, options) => {
          if (String(url).startsWith('lib/')) __smoke.requests.push({url, cache: options?.cache});
          return nativeFetch(url, options);
        };
        globalThis.Worker = class extends NativeWorker {
          constructor(...args) {
            if (__smoke.failStart) throw new Error('Test worker startup failure');
            super(...args); __smoke.workers++; __smoke.lastWorker = this;
          }
          postMessage(data) {
            if (__smoke.hold) __smoke.pending = {worker: this, data};
            else super.postMessage(data);
          }
        };
        __smoke.release = () => {
          const p = __smoke.pending; __smoke.pending = null;
          NativeWorker.prototype.postMessage.call(p.worker, p.data);
        };
      `});
      const evaluate = async expression => {
        const result = await command('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
        return result.result.value;
      };
      await command('Page.navigate', {url: origin + '/' + query});
      await until(() => evaluate('document.readyState === "complete" && Boolean(globalThis.TE_APP_READY)'), 'full page startup');
      const click = async selector => {
        const point = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'center'}); const r = e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
        await command('Input.dispatchMouseEvent', {type: 'mousePressed', button: 'left', clickCount: 1, ...point});
        await command('Input.dispatchMouseEvent', {type: 'mouseReleased', button: 'left', clickCount: 1, ...point});
      };
      const input = (selector, value) => evaluate(`(() => {const e=document.querySelector(${JSON.stringify(selector)}); e.value=${JSON.stringify(String(value))}; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      return {evaluate, command, click, input};
    };
    const page = await open(), {evaluate, click, input, command} = page;
    const noErrors = async p => assert.deepEqual(await p.evaluate('__smoke.errors'), []);
    const idle = () => evaluate(`!TEApp.busy && !TEApp.worker && TEApp.clock === null && !('calculating' in document.documentElement.dataset) && !document.querySelector('main').matches('[aria-busy="true"]') && [...document.querySelectorAll('.top,.tabs,.content,#logDrawer,#logToggle')].every(e=>!e.inert) && getComputedStyle(document.documentElement).cursor !== 'wait'`);
    const labelsCorrect = () => evaluate(`[...document.querySelectorAll('.field-with-tip')].every(w=>{const c=w.querySelector('input,select'),l=w.querySelector('label'); return l.control===c && c.labels.length===1 && !w.querySelector('.tip').closest('label');})`);
    assert(await evaluate('typeof TETheme.colors === "function" && typeof TEApp.updateShell === "function" && typeof TEApp.log === "function" && document.querySelectorAll(".tip").length > 0'));
    assert(await labelsCorrect());
    const slope = await evaluate('document.querySelector("[data-material] [data-key=alphaSlope]").id');
    await click(`label[for="${slope}"]`);
    assert.equal(await evaluate('document.activeElement.id'), slope);
    await click('.material-card .field-with-tip .tip');
    assert(await evaluate('Boolean(document.querySelector(".tip[aria-expanded=true]"))'));
    await command('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape'});
    assert(await evaluate('!document.querySelector(".tip[aria-expanded=true]")'));
    await click('#addMaterial'); await until(labelsCorrect, 'rebuilt material labels');
    const materialCount = await evaluate('TEApp.config.materials.length');
    await input('#presetMaterial', 'Ge_p_reference.json');
    await until(() => evaluate(`TEApp.config.materials.length === ${materialCount + 1}`), 'library fetch');
    assert(await evaluate('__smoke.requests.length >= 2 && __smoke.requests.every(r=>r.cache === "no-cache")'));
    passed('full script startup, native label associations, rebuilt tooltips and library cache policy');

    await command('Emulation.setEmulatedMedia', {features: [{name: 'prefers-color-scheme', value: 'dark'}]});
    await until(() => evaluate('document.documentElement.dataset.theme === "dark"'), 'dark system theme');
    await command('Emulation.setEmulatedMedia', {features: [{name: 'prefers-color-scheme', value: 'light'}]});
    await until(() => evaluate('document.documentElement.dataset.theme === "light"'), 'light system theme without storage');
    await noErrors(page);
    passed('blocked local storage and system theme changes');

    await click('#tab-boundaries');
    await input('[data-side="right"] [data-key="bias"]', 2200);
    assert(await evaluate('document.getElementById("run").disabled && document.getElementById("validationSummary").textContent.includes("1–2000 K")'));
    await input('[data-side="right"] [data-key="bias"]', 300);
    await click('#tab-geometry'); await input('#nx', 26); await click('#applyGrid');
    assert.equal(await evaluate('[...document.querySelectorAll("#historyList li")].filter(e=>e.textContent.includes("Apply mesh 26 × 8")).length'), 1);
    assert(await evaluate('document.getElementById("applyGrid").disabled'));
    passed('prescribed-temperature validation and successful mesh history');

    await evaluate('__smoke.hold = true'); await click('#run');
    assert(await evaluate(`TEApp.busy && document.querySelector('main').getAttribute('aria-busy')==='true' && [...document.querySelectorAll('.top,.tabs,.content,#logDrawer,#logToggle')].every(e=>e.inert) && getComputedStyle(document.documentElement).cursor==='wait' && getComputedStyle(document.getElementById('cancel')).cursor==='wait' && document.activeElement.id==='cancel'`));
    const before = await evaluate('JSON.stringify({config:TEApp.config,theme:document.documentElement.dataset.theme,tab:document.querySelector("[aria-selected=true]").id})');
    await click('#fill'); await click('#tab-boundaries');
    for (const key of ['t', 'l', '?']) await command('Input.dispatchKeyEvent', {type: 'keyDown', key});
    await command('Input.dispatchKeyEvent', {type: 'keyDown', key: '3', modifiers: 1});
    assert.equal(await evaluate('JSON.stringify({config:TEApp.config,theme:document.documentElement.dataset.theme,tab:document.querySelector("[aria-selected=true]").id})'), before);
    assert(await evaluate('document.getElementById("logDrawer").hidden && !document.getElementById("shortcutHelp").open'));
    await click('#cancel'); assert(await idle());
    passed('busy cursor, inert editing/navigation, blocked shortcuts and usable Stop');

    await click('#run'); await evaluate('__smoke.release()');
    await until(idle, 'worker completion');
    assert.equal(await evaluate('document.getElementById("badge").textContent'), 'CONVERGED');
    for (const failure of ['startup', 'message', 'worker']) {
      await evaluate(`__smoke.failStart=${failure === 'startup'}`); await click('#run');
      if (failure === 'message') await evaluate('__smoke.lastWorker.dispatchEvent(new MessageEvent("messageerror"))');
      if (failure === 'worker') await evaluate('__smoke.lastWorker.dispatchEvent(new ErrorEvent("error", {message:"Test worker failure"}))');
      assert(await idle(), failure + ': ' + await evaluate(`JSON.stringify({busy:TEApp.busy,worker:!!TEApp.worker,clock:TEApp.clock,root:document.documentElement.dataset,cursor:getComputedStyle(document.documentElement).cursor,inert:[...document.querySelectorAll('.top,.tabs,.content,#logDrawer,#logToggle')].map(e=>[e.className||e.id,e.inert]),badge:document.getElementById('badge').textContent,status:document.getElementById('status').textContent,errors:__smoke.errors})`));
      assert.equal(await evaluate('document.getElementById("badge").textContent'), 'ERROR');
    }
    await evaluate('__smoke.failStart=false'); await click('#run');
    await evaluate('dispatchEvent(new PageTransitionEvent("pagehide", {persisted:true}))');
    assert(await idle());
    passed('completion, worker startup/message/runtime failures and page-exit cleanup');

    await evaluate(`(() => {
      const c=TE.default2D(); Object.assign(c,{mode:'periodic',nx:4,ny:1,materialMap:[0,0,0,0],samples:64,frequency:1,maxPeriods:100});
      c.materials=[{name:'Browser test',rho:2000,Cp:500,k:2,sigma:1e5,alpha:0,color:'#73d8d0'}];
      c.electrical.value={bias:0,amplitude:.2,phase:0};
      c.thermal.left={kind:'temperature',value:300}; c.thermal.right={kind:'temperature',value:300};
      c.sweep={enabled:true,min:1,max:2,points:2,spacing:'linear'};
      TEApp.config=c; TEApp.fill(); __smoke.hold=false;
    })()`);
    await click('#run'); await until(idle, 'two-frequency sweep');
    assert(await evaluate('TEApp.sweepResult.results.length === 2 && document.getElementById("badge").textContent === "SWEEP COMPLETE"'));
    // In Sweep mode on the Solver tab, the entire single-frequency tooltip wrapper is hidden (no orphaned "?" or input).
    await click('#tab-solver');
    assert(await evaluate('document.getElementById("singleFrequencyLabel").closest(".field-with-tip").offsetParent === null && document.getElementById("frequency").offsetParent === null'));
    // Opening the log drawer with L and pressing Escape closes it and restores focus to #logToggle; backdrop click closes #shortcutHelp.
    await command('Input.dispatchKeyEvent', {type: 'keyDown', key: 'l', text: 'l'});
    assert(await evaluate('!document.getElementById("logDrawer").hidden'));
    await command('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape'});
    assert(await evaluate('document.getElementById("logDrawer").hidden && document.activeElement.id === "logToggle"'));
    await click('#helpButton');
    assert(await evaluate('document.getElementById("shortcutHelp").open'));
    await command('Input.dispatchMouseEvent', {type: 'mousePressed', button: 'left', clickCount: 1, x: 5, y: 5});
    await command('Input.dispatchMouseEvent', {type: 'mouseReleased', button: 'left', clickCount: 1, x: 5, y: 5});
    assert(await evaluate('!document.getElementById("shortcutHelp").open'));
    await noErrors(page);
    passed('real AC sweep completion, hidden single-frequency wrapper, Escape log close and backdrop dialog close');

    const autorun = await open('?run=1&tab=geometry');
    await until(() => autorun.evaluate('Boolean(TEApp.result) && !TEApp.busy && !TEApp.worker'), 'URL autorun');
    assert(await autorun.evaluate('__smoke.workers === 1 && document.getElementById("badge").textContent === "CONVERGED" && !("calculating" in document.documentElement.dataset)'));
    await noErrors(autorun);
    const invalidTab = await open('?tab=unknown');
    assert(await invalidTab.evaluate('!document.getElementById("materials").hidden'));
    await noErrors(invalidTab);
    passed('worker-based URL autorun and invalid-tab fallback');
    console.log(`\n${checks} browser smoke checks passed.`);
  } finally {
    if (socket?.readyState === WebSocket.OPEN) try { await send('Browser.close'); } catch {}
    for (const call of pending.values()) { clearTimeout(call.timer); call.reject(new Error('Browser test finished')); }
    socket?.close();
    await new Promise(resolve => server.close(resolve));
    // Only the exact temporary profile created above is removed; retry while browser handles close.
    if (child && child.exitCode === null) await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)]);
    if (child && child.exitCode === null) child.kill();
    assert(path.dirname(path.resolve(profile)) === path.resolve(os.tmpdir()) && path.basename(profile).startsWith('te3d-browser-test-'), 'Unexpected temporary profile path');
    try { fs.rmSync(profile, {recursive: true, force: true, maxRetries: 10, retryDelay: 100}); }
    catch (error) { console.error('Could not remove temporary browser profile: ' + error.message); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
