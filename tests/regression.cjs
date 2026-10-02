const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const load = name => vm.runInThisContext(fs.readFileSync(path.join(root, 'assets', name), 'utf8'), {filename: name});
for (const name of ['core.js', 'exports.js', 'worker.js', 'project.js']) load(name);
function model(periodic = false) {
  const c = TE.default2D();
  Object.assign(c, {mode: periodic ? 'periodic' : 'steady', nx: 4, ny: 1, lx: .001, ly: .001, depth: .001,
    materialMap: [0, 0, 0, 0], samples: 64, frequency: 2, maxPeriods: 100});
  c.materials = [{name: 'Reference', color: '#73d8d0', rho: 2000, Cp: 500, k: 2, sigma: 1e5, alpha: 0, beta: 0, alphaSlope: 0}];
  c.electrical.value = {bias: periodic ? 0 : .2, amplitude: periodic ? .2 : 0, phase: 0};
  c.thermal.left = {kind: 'temperature', value: 300}; c.thermal.right = {kind: 'temperature', value: 300};
  return c;
}
const elements = new Map();
function el(id) {
  if (!elements.has(id)) elements.set(id, {value: '', textContent: '', innerHTML: '', hidden: false, disabled: false, checked: false,
    max: 0, dataset: {}, style: {}, options: [], selectedOptions: [{text: 'Temperature'}], classList: {toggle(){}, remove(){}, add(){}},
    setAttribute(){}, removeAttribute(){}, setCustomValidity(){}, addEventListener(){}});
  return elements.get(id);
}
globalThis.document = {getElementById: el, querySelector: () => el('main'), querySelectorAll: () => []};
globalThis.window = {};
load('ui-state.js');
for (const name of ['ui-model.js', 'ui-plots.js', 'ui-sweep.js', 'ui-worker.js', 'ui-downloads.js', 'ui-project.js']) load(name);
const app = TEApp;
const noop = () => {};
function appContext(initial = {}) {
  const els = new Map(), ctx2d = new Proxy({}, {get: (t, k) => k === 'measureText' ? () => ({width: 10}) : k in t ? t[k] : noop, set: (t, k, v) => (t[k] = v, true)});
  const get = id => {
    if (!els.has(id)) els.set(id, {id, value: initial[id] ?? '', textContent: '', innerHTML: '', hidden: false, disabled: false, checked: false, type: '', max: 0,
      dataset: {}, style: {}, options: [{}, {}, {}], selectedOptions: [{text: 'Temperature'}], files: [], classList: {toggle(){}, remove(){}, add(){}}, listeners: {},
      setAttribute(){}, removeAttribute(){}, setCustomValidity(){}, addEventListener(type, fn) {this.listeners[type] = fn;}, focus(){}, click(){}, getContext: () => ctx2d,
      getBoundingClientRect: () => ({left: 0, top: 0}), clientWidth: 700, clientHeight: 400});
    return els.get(id);
  };
  const sandbox = {console, Blob, TextEncoder, TextDecoder, DecompressionStream, setTimeout, clearTimeout, setInterval, clearInterval, performance, structuredClone,
    devicePixelRatio: 1, requestAnimationFrame: () => 0, addEventListener: noop, fetch: () => Promise.reject(new Error('offline')),
    URL: {createObjectURL: () => 'blob:', revokeObjectURL: noop},
    document: {getElementById: get, querySelector: () => get('main'), querySelectorAll: () => [], listeners: {}, addEventListener(type, fn) {this.listeners[type] = fn;},
      documentElement: {dataset: {}}, createElement: () => ({click: noop})}};
  sandbox.globalThis = sandbox; sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const name of ['core.js', 'exports.js', 'worker.js', 'project.js', 'ui-state.js', 'ui-model.js', 'ui-plots.js', 'ui-sweep.js', 'ui-worker.js', 'ui-downloads.js', 'ui-project.js', 'app.js'])
    vm.runInContext(fs.readFileSync(path.join(root, 'assets', name), 'utf8'), sandbox, {filename: name});
  return {context: sandbox, app: sandbox.TEApp, el: get};
}
app.tab = noop;
app.notice = (s, error) => {el('status').textContent = s; el('badge').textContent = error ? 'ERROR' : 'READY';};
app.canvasFrame = () => ({ctx: new Proxy({}, {get: () => noop, set: () => true}), left: 50, top: 20, w: 400, h: 200});
app.contacts = noop;
function setView() {
  Object.assign(el('field'), {value: 'temperature', selectedOptions: [{text: 'Temperature'}]});
  el('harmonic').value = '2'; el('representation').value = 'imaginary'; el('profileField').value = 'temperature';
  el('profileTime').value = '16'; el('arrows').checked = true; app.probe = 7;
}
const bode = {quantity: 'temperature', harmonic: 2, reference: 'current', normalization: 'raw', phaseFloor: 1e-12,
  unwrap: false, x: .5, y: .5, scale: 'physical', dbReference: 1};
let checks = 0, failures = 0;
// A failing check is reported and the run continues, so one failure never hides the others.
async function check(label, fn) {
  try { await fn(); checks++; console.log('PASS', label); }
  catch (error) { failures++; process.exitCode = 1; console.log('FAIL', label); console.error(error); }
}
(async () => {
  for (const name of fs.readdirSync(path.join(root, 'assets')).filter(x => x.endsWith('.js'))) new vm.Script(fs.readFileSync(path.join(root, 'assets', name), 'utf8'));
  const dc = TE.run2D(model()), ac = TE.run2D(model(true));
  await check('DC / AC numerical smoke tests and imported-result dimensions', () => {
    assert(Math.abs(dc.terminalVoltage - .002) < 1e-12);
    assert(Math.abs(ac.harmonics.terminalVoltage[1].re - .002) < 1e-12);
    TE.checkProjectResult(dc); TE.checkProjectResult(ac);
  });
  await check('Passive sign convention: sink grounded, U = V(source) − V(sink), U = RI and P = UI', () => {
    // model(): source on the left edge (nodes 0, 5), sink on the right edge (nodes 4, 9), R = 0.01 Ω.
    for (const i of [4, 9]) assert.equal(dc.voltage[i], 0);
    for (const i of [0, 5]) assert.equal(dc.voltage[i], dc.terminalVoltage);
    assert(Math.abs(dc.current - .2) < 1e-15 && Math.abs(dc.electricalPower - 4e-4) < 1e-15);
    assert.equal(dc.electricalPower, dc.current * dc.terminalVoltage); assert(Math.abs(dc.energyResidual) < 1e-10);
    const v = model(); v.electrical = {...v.electrical, kind: 'voltage', value: {bias: .002, amplitude: 0, phase: 0}};
    const rv = TE.run2D(v); assert.equal(rv.terminalVoltage, .002); assert(Math.abs(rv.current - .2) < 1e-12);
    const o = model(); o.electrical = {...o.electrical, kind: 'open_circuit'}; assert(Math.abs(TE.run2D(o).current) < 1e-15);
  });
  await check('Ideal Peltier leg reproduces the analytic cooler solution', () => {
    // p-leg from a 300 K heat sink (sink electrode, left) to an insulated cold end (source electrode, right):
    // Tc = (K·Th + I²R/2) / (K + αI) and U = IR + α(Th − Tc). Implicit Peltier cooling needs few iterations.
    const I = 3, a = 2e-4, K = 1.6e-6 / 1.6e-3, R = 1.6e-3 / (1.1e5 * 1e-6), flux = () => ({kind: 'flux', value: 0});
    const c = TE.default2D(); Object.assign(c, {mode: 'steady', nx: 16, ny: 1, lx: 1.6e-3, ly: 1e-3, depth: 1e-3, materialMap: Array(16).fill(0)});
    c.materials = [{name: 'p-leg', color: '#73d8d0', rho: 7740, Cp: 154.4, k: 1.6, sigma: 1.1e5, alpha: a, beta: 0, alphaSlope: 0}];
    c.thermal = {left: {kind: 'temperature', value: 300}, right: flux(), top: flux(), bottom: flux()};
    c.electrical = {kind: 'current', value: {bias: I, amplitude: 0, phase: 0}, sourceSide: 'right', sinkSide: 'left', sourceRange: [0, 1], sinkRange: [0, 1]};
    const r = TE.run2D(c), Tc = (K * 300 + I * I * R / 2) / (K + a * I);
    for (const i of [16, 33]) assert(Math.abs(r.temperature[i] - Tc) < 1e-8);
    assert(Math.abs(r.terminalVoltage - (I * R + a * (300 - Tc))) < 1e-12);
    assert(Math.abs(r.energyResidual) < 1e-9 && r.diagnostics.iterations <= 5);
  });
  await check('Thermoelectric module example converges beyond its optimum current', async () => {
    const module = await app.moduleConfig(); // lib/ is not served here: built-in material copies
    const top = I => {
      const c = structuredClone(module); c.electrical.value.bias = I; const r = TE.run2D(c);
      assert(r.diagnostics.iterations <= 10 && Math.abs(r.energyResidual) < 1e-6 && r.terminalVoltage > 0);
      return Math.min(...r.temperature.slice(-(c.nx + 1)));
    };
    const t4 = top(4), t12 = top(12);
    assert(t4 < 240 && t12 > t4 && t12 < 300, `top plate ${t4} K at 4 A, ${t12} K at 12 A`);
  });
  await check('Electrodes must touch conducting material; unresolvable contrast is reported clearly', async () => {
    const module = await app.moduleConfig();
    assert.equal(TE.validate2DConfig(module).length, 0);
    const onPlate = structuredClone(module); // electrodes on the alumina plate (1E-12 S/m next to copper)
    Object.assign(onPlate.electrical, {sourceSide: 'bottom', sinkSide: 'bottom', sourceRange: [0, .4], sinkRange: [.6, 1]});
    assert.deepEqual(TE.validate2DConfig(onPlate).filter(i => /near-insulating/.test(i.message)).map(i => i.path), ['electrical.sourceRange', 'electrical.sinkRange']);
    const resistive = structuredClone(onPlate); resistive.materials[3] = {...resistive.materials[3], sigma: 1e-3}; // a resistive contact is fine
    assert.equal(TE.validate2DConfig(resistive).length, 0);
    const solver = TE.from2DConfig(model()), T = solver.initial(), graphSolve = TE.graphSolve;
    TE.graphSolve = () => { throw new Error('CG failed: matrix not positive definite.'); };
    try { assert.throws(() => solver.electric(T, solver.properties(T).p, 0), /^Error: Electrical solve failed .*Move the electrode onto a conductor/); }
    finally { TE.graphSolve = graphSolve; }
  });
  await check('Generated worker executes and decodes', () => {
    let message; const context = {self: {postMessage: m => {if (m.type === 'result' || m.type === 'error') message = structuredClone(m);}}};
    vm.runInNewContext(TE.workerSource(), context); context.self.onmessage({data: model()});
    assert.equal(message.type, 'result'); TE.checkProjectResult(TE.decodeWorkerMessage(message).result);
  });
  await check('Unknown thermal boundaries rejected; renderer whitelists sides', () => {
    const c = model(); c.thermal['extra" data-injected="yes'] = {kind: 'flux', value: 0};
    assert.throws(() => TE.checkEditorModel(c), /Unknown thermal boundary/);
    app.config = c; app.boundaryForm(); assert(!el('thermalCards').innerHTML.includes('data-injected'));
  });
  await check('Cell phasors cancel before magnitude; signed Re/Im; phase mask', () => {
    const r = structuredClone(ac); const row = r.harmonics.temperature[1];
    row.forEach(z => {z.re = 0; z.im = 0;});
    for (const i of [0, 5]) row[i] = {re: 1, im: 2}; for (const i of [1, 6]) row[i] = {re: -1, im: -2};
    assert.equal(TE.harmonicMap(r, 'temperature', 1).values[0], 0);
    assert.equal(TE.harmonicMap(r, 'temperature', 1, 'phase').values[0], null);
    row.forEach(z => {z.re = -3; z.im = 4;});
    assert.equal(TE.harmonicMap(r, 'temperature', 1).values[0], 5);
    assert.equal(TE.harmonicMap(r, 'temperature', 1, 'real').values[0], -3);
    assert.equal(TE.harmonicMap(r, 'temperature', 1, 'imaginary').values[0], 4);
    assert(Math.abs(TE.harmonicMap(r, 'temperature', 1, 'phase').values[0] - 126.86989764584402) < 1e-10);
  });
  await check('Probe readout under the map shows the displayed field at the probe', () => {
    const f = TE.formatInputNumber, readout = () => el('probeReadout').textContent;
    app.result = dc; setView(); el('results').hidden = false; app.drawResults(); // probe node 7: x = 0.5 mm, top edge
    assert.equal(el('probeReadout').hidden, false);
    assert.equal(readout(), `Probe x = 0.5 mm, y = 1 mm · Temperature · DC = ${f(dc.temperature[7])} K · V = ${f(dc.voltage[7])} V`);
    app.probe = 0; app.drawResults(); assert(readout().startsWith('Probe x = 0 mm, y = 0 mm'));
    // Cell fields: mean of the cells sharing the probe node (node 1 touches cells 0 and 1).
    assert.deepEqual(TE.probePhasor(dc, 'qx', 0, 1), {re: (dc.qx[0] + dc.qx[1]) / 2, im: 0});
    Object.assign(el('field'), {value: 'qx', selectedOptions: [{text: 'Heat flux qx'}]}); app.probe = 1; app.drawResults();
    assert(readout().includes(`Heat flux qx · DC = ${f((dc.qx[0] + dc.qx[1]) / 2)} W/m² · T = ${f(dc.temperature[1])} K · V = `));
    // Periodic: same harmonic and representation as the map; no DC extras.
    app.result = ac; setView(); app.drawResults();
    assert.equal(readout(), `Probe x = 0.5 mm, y = 1 mm · Temperature · 2ω imaginary part = ${f(ac.harmonics.temperature[2][7].im)} K`);
    el('representation').value = 'phase'; app.drawResults();
    assert(readout().endsWith(`2ω phase = ${f(app.phase(ac.harmonics.temperature[2][7]))} °`));
    el('harmonic').value = '1'; app.drawResults(); // no 1ω temperature without Seebeck/TCR: masked like the map
    assert(readout().endsWith('1ω phase = — (below the phase threshold)'));
    for (const id of ['resultCanvas', 'profileCanvas']) el(id).getContext = () => ({clearRect: noop});
    app.clearResults(); assert.equal(el('probeReadout').hidden, true); assert.equal(readout(), '');
  });
  await check('Colour scales of nodal fields span the nodal extremes', () => {
    const map = TE.harmonicMap(dc, 'temperature', 0);
    assert.equal(map.range.lo, 300); assert(Math.min(...map.values) > 300);
    assert.equal(map.range.hi, Math.max(...dc.temperature)); assert.deepEqual(TE.surfaceField(dc, 'temperature').range, map.range);
    app.result = dc; setView(); app.drawResults(); assert.equal(el('scaleMin').textContent, '300');
    assert.deepEqual(TE.harmonicMap(ac, 'temperature', 1, 'phase').range, {lo: -180, hi: 180});
  });
  await check('Sweep selection preserves harmonic, probe, representation and time fraction', () => {
    app.result = ac; setView(); const second = structuredClone(ac); second.frequency = 4; second.config.frequency = 4;
    app.sweepResult = {results: [ac, second]}; app.selectSweepPoint(1);
    assert.equal(app.result, second); assert.equal(el('harmonic').value, '2'); assert.equal(app.probe, 7);
    assert.equal(el('representation').value, 'imaginary'); assert.equal(el('profileTime').value, '16');
  });
  const dcFiles = await TE.completeResultsFiles(dc, {probe: 2}), acFiles = await TE.completeResultsFiles(ac, {probe: 7});
  await check('Exports include real and imaginary maps using shared rendering', () => {
    assert(acFiles.some(f => f.name === 'figures/temperature-1-real.svg'));
    assert(acFiles.some(f => f.name === 'figures/temperature-1-imaginary.svg'));
    assert(acFiles.find(f => f.name === 'report.html').data.includes('Complex nodal phasors are averaged'));
  });
  await check('Exports state the sign convention and the cycle diagnostics', () => {
    const report = acFiles.find(f => f.name === 'report.html').data, readme = acFiles.find(f => f.name === 'README.txt').data;
    assert(report.includes('terminal voltage U = V(source) − V(sink)') && report.includes('Cycle extrapolations') && report.includes('Terminal voltage tolerance (V)'));
    assert(readme.includes('Terminal voltage U = V(source) - V(sink)') && ac.convention.includes('V(source)-V(sink)'));
    assert.equal(JSON.parse(acFiles.find(f => f.name === 'manifest.json').data).formatVersion, 3);
  });
  const metadataFile = (kind = 'single', selectedIndex = 0, probe = 2) => ({name: 'project.json', data: JSON.stringify({
    format: 'thermoelectric-lab-project', version: TE.projectVersion, kind, selectedIndex, view: {probe}, bodeOptions: kind === 'sweep' ? bode : null
  })});
  await check('DC and AC project ZIPs restore exact data and probe', async () => {
    for (const [r, files, probe] of [[dc, dcFiles, 2], [ac, acFiles, 7]]) {
      const project = await TE.readProjectZip(await TE.zipFiles([...files, metadataFile('single', 0, probe)]));
      assert.deepEqual(project.result, r); assert.equal(project.view.probe, probe);
    }
  });
  const config = model(true); config.sweep = {enabled: true, min: 2, max: 4, points: 2, spacing: 'linear'};
  const results = []; TE.runSweep(config, m => {if (m.type === 'sweepPoint') results.push(m.result); if (m.type === 'sweepError') throw new Error(m.message);});
  const sweep = {config, results, frequencies: [2, 4], status: 'complete', message: 'Sweep completed.'};
  const sweepFiles = await app.sweepFiles(sweep, bode, results[0], 7);
  await check('Complete and stopped project sweeps import', async () => {
    const loaded = await TE.readProjectZip(await TE.zipFiles([...sweepFiles, metadataFile('sweep', 1, 7)])); assert.deepEqual(loaded.sweep, sweep);
    const stopped = {...sweep, results: [results[0]], status: 'stopped'};
    const loadedStopped = await TE.readProjectZip(await TE.zipFiles([...await app.sweepFiles(stopped, bode, results[0], 7), metadataFile('sweep', 0, 7)]));
    assert.equal(loadedStopped.sweep.results.length, 1); assert.equal(loadedStopped.sweep.status, 'stopped');
  });
  await check('Impedance is U/I with no phase correction', () => {
    for (const row of TE.bodeRows(results, {quantity: 'impedance'})) assert(Math.abs(row.magnitude - .01) < 1e-12 && Math.abs(row.phase) < 1e-9);
    for (const row of TE.bodeRows(results, {quantity: 'terminalVoltage', reference: 'current'})) assert(Math.abs(row.phase) < 1e-9);
  });
  const rc = {...await app.rcConfig(), sweep: {enabled: false}, frequency: 30};
  let rcRun;
  await check('Cycle extrapolation reaches the same periodic state in far fewer cycles', () => {
    const run = extrapolate => TE.from2DConfig(rc).solvePeriodic(30, {samples: 32, maxPeriods: 400, extrapolate});
    const fast = run(true), plain = run(false), a = fast.harmonics.terminalVoltage[1], b = plain.harmonics.terminalVoltage[1];
    assert(fast.periods <= 10 && plain.periods >= 50, `${fast.periods} vs ${plain.periods} cycles`);
    assert(fast.diagnostics.cycleExtrapolations >= 1 && plain.diagnostics.cycleExtrapolations === 0);
    assert(Math.hypot(a.re - b.re, a.im - b.im) / Math.hypot(b.re, b.im) < 1e-6);
    rcRun = TE.run2D(rc); // the application's path extrapolates by default
    assert(rcRun.converged && rcRun.periods <= 10 && rcRun.diagnostics.cycleExtrapolations >= 1, `run2D: ${rcRun.periods} cycles`);
    assert.deepEqual(TE.cycleExtrapolation([[0, 0], [1, 2], [1.5, 3]]).shift, [.5, 1]); // λ = 1/2: limit (2, 4)
    assert.equal(TE.cycleExtrapolation([[0], [1], [.5]]), null); // oscillating drift
    assert.equal(TE.cycleExtrapolation([[0], [1], [1.999]]), null); // λ ≥ 0.995: no reliable limit
    assert.equal(TE.cycleExtrapolation([[0, 0], [1, 0], [1, .5]]), null); // drift changes direction
  });
  await check('No extrapolation without a periodic state', () => {
    const c = model(true); c.maxPeriods = 10; for (const side of ['left', 'right', 'top', 'bottom']) c.thermal[side] = {kind: 'flux', value: 0};
    let last; assert.throws(() => TE.run2D(c, noop, r => {last = r;}), /Periodic state not reached/); // adiabatic: Joule heat accumulates
    assert.equal(last.periods, 10); assert.equal(last.diagnostics.cycleExtrapolations, 0);
  });
  await check('Terminal-voltage tolerance follows the largest Seebeck coefficient', () => {
    assert.equal(ac.diagnostics.harmonicVoltageAtol, 1e-12); // α = 0: floor
    assert(Math.abs(rcRun.diagnostics.harmonicVoltageAtol - 2e-4 * 2e-7) < 1e-25); // Bi₂Te₃ × temperature tolerance
  });
  await check('Archives without project.json are rejected for DC, AC and sweeps', async () => {
    for (const files of [dcFiles, acFiles, sweepFiles]) {
      await assert.rejects(() => TE.zipFiles(files).then(TE.readProjectZip), /not a supported project/);
    }
  });
  let newZip;
  await check('Actual UI ZIP export restores sweep, selected point and view', async () => {
    app.result = results[0]; app.sweepResult = sweep; setView(); app.bodeOptions = () => bode;
    app.download = (name, data) => {newZip = data;}; const view = app.captureResultView();
    await app.exportZip(); assert(newZip instanceof Blob, el('exportStatus').textContent);
    const loaded = await TE.readProjectZip(newZip); assert.equal(loaded.selected, 0); assert.deepEqual(loaded.view, view); assert.deepEqual(loaded.sweep, sweep);
    assert.deepEqual(loaded.bodeOptions, bode);
  });
  await check('Actual UI single-result project export round trip', async () => {
    app.result = dc; app.sweepResult = null; setView(); app.$('harmonic').value = '0';
    let zip; app.download = (name, data) => {zip = data;}; await app.exportZip();
    const loaded = await TE.readProjectZip(zip); assert.deepEqual(loaded.result, dc); assert.equal(loaded.sweep, null);
  });
  await check('UI import restores sweep and selection without running solver', async () => {
    const fill = app.fill, drawBode = app.drawBode, refresh = app.refreshSweepPoints;
    app.fill = noop; app.drawBode = noop; app.refreshSweepPoints = noop;
    el('projectFile').files = [newZip]; await app.importProject();
    assert.deepEqual(app.result, results[0]); assert.equal(el('sweepPoint').value, '0'); assert.equal(el('representation').value, 'imaginary');
    assert.equal(el('profileTime').value, '16'); assert.equal(app.probe, 7); assert.equal(app.importingProject, false);
    app.fill = fill; app.drawBode = drawBode; app.refreshSweepPoints = refresh;
  });
  await check('Bad input preserves the open project and unlocks import', async () => {
    const before = app.result; el('projectFile').files = [new Blob(['invalid zip'])]; await app.importProject();
    assert.equal(app.result, before); assert.equal(app.importingProject, false); assert(el('status').textContent.startsWith('Project import failed:'));
  });
  await check('Projects without results: saved at any time, reopened ready to run', async () => {
    const applyGeometry = app.applyGeometry, fill = app.fill; let zip;
    app.applyGeometry = () => (app.config = model()); app.fill = noop; app.download = (name, data) => {zip = data;};
    app.result = null; app.inputsChanged = false; await app.saveProject(); // nothing computed: model and settings only
    let loaded = await TE.readProjectZip(zip);
    assert.deepEqual(loaded.config, model()); assert.equal(loaded.result, null); assert.equal(loaded.sweep, null);
    assert(el('status').textContent.startsWith('Project saved without results'));
    app.result = dc; app.sweepResult = null; setView(); el('harmonic').value = '0'; await app.saveProject(); // current results: complete
    assert.deepEqual((await TE.readProjectZip(zip)).result, dc);
    app.inputsChanged = true; await app.saveProject(); // inputs edited after the run: model only again
    assert.equal((await TE.readProjectZip(zip)).result, null); assert(el('status').textContent.includes('inputs changed after the last run'));
    el('projectFile').files = [zip]; await app.importProject();
    assert.deepEqual(app.config, model()); assert.equal(app.result, null); assert.equal(el('resultEmpty').hidden, false);
    assert(el('status').textContent.startsWith('Imported project without results'));
    const mixed = [{name: 'project.json', data: JSON.stringify({format: 'thermoelectric-lab-project', version: TE.projectVersion, kind: 'model'})},
      {name: 'model.json', data: JSON.stringify(dc.config)}, {name: 'results.json', data: JSON.stringify(dc)}];
    await assert.rejects(() => TE.zipFiles(mixed).then(TE.readProjectZip), /Project kind disagrees/);
    app.applyGeometry = applyGeometry; app.fill = fill; app.inputsChanged = false;
  });
  const minimal = r => [metadataFile(), {name: 'model.json', data: JSON.stringify(r.config)}, {name: 'results.json', data: JSON.stringify(r)}];
  await check('Only the current model and project versions are accepted', async () => {
    assert.equal(TE.default2D().version, TE.modelVersion);
    for (const bad of [{...model(), version: 1}, (({version, ...rest}) => rest)(model())]) assert.throws(() => TE.checkEditorModel(bad), /Unsupported model version/);
    const oldMetadata = {name: 'project.json', data: JSON.stringify({format: 'thermoelectric-lab-project', version: 1, kind: 'single', selectedIndex: 0, view: {probe: 2}, bodeOptions: null})};
    await assert.rejects(() => TE.zipFiles([oldMetadata, ...minimal(dc).slice(1)]).then(TE.readProjectZip), /Unsupported project/);
    const oldModel = structuredClone(dc); oldModel.config.version = 1;
    await assert.rejects(() => TE.zipFiles(minimal(oldModel)).then(TE.readProjectZip), /Unsupported model version/);
    const oldModelProject = [{name: 'project.json', data: JSON.stringify({format: 'thermoelectric-lab-project', version: TE.projectVersion, kind: 'model'})},
      {name: 'model.json', data: JSON.stringify({...model(), version: 1})}];
    el('projectFile').files = [await TE.zipFiles(oldModelProject)]; await app.importProject();
    assert(el('status').textContent.startsWith('Project import failed: Unsupported model version'));
  });
  await check('Malformed arrays, metadata, JSON properties and unknown boundary rejected', async () => {
    const bad = structuredClone(ac); bad.temperature[0].pop();
    await assert.rejects(() => TE.zipFiles(minimal(bad)).then(TE.readProjectZip), /dimensions/);
    const badC = structuredClone(dc); badC.config.thermal.evil = {kind: 'flux', value: 0};
    await assert.rejects(() => TE.zipFiles(minimal(badC)).then(TE.readProjectZip), /Unknown thermal/);
    await assert.rejects(() => TE.zipFiles([...minimal(dc).filter(f => f.name !== 'project.json'), {name: 'project.json', data: '{"format":"thermoelectric-lab-project","version":99,"kind":"single"}'}]).then(TE.readProjectZip), /Unsupported project/);
    await assert.rejects(() => TE.zipFiles([metadataFile(), {name: 'model.json', data: '{"__proto__":{}}'}, {name: 'results.json', data: '{}'}]).then(TE.readProjectZip), /Unsafe JSON/);
  });
  await check('Deflate-compressed projects import with bounded decompression', async () => {
    const source = new Uint8Array(await (await TE.zipFiles(minimal(dc))).arrayBuffer());
    const sv = new DataView(source.buffer), end = source.length - 22;
    let at = sv.getUint32(end + 16, true), offset = 0;
    const body = [], directory = [];
    for (let i = 0; i < sv.getUint16(end + 10, true); i++) {
      const nl = sv.getUint16(at + 28, true), local = sv.getUint32(at + 42, true), len = sv.getUint32(at + 24, true);
      const data = source.subarray(local + 30 + nl, local + 30 + nl + len);
      const compressed = require('node:zlib').deflateRawSync(data);
      const header = source.slice(local, local + 30 + nl), hv = new DataView(header.buffer);
      hv.setUint16(8, 8, true); hv.setUint32(18, compressed.length, true);
      const cd = source.slice(at, at + 46 + nl), cv = new DataView(cd.buffer);
      cv.setUint16(10, 8, true); cv.setUint32(20, compressed.length, true); cv.setUint32(42, offset, true);
      body.push(header, compressed); directory.push(cd); offset += header.length + compressed.length; at += cd.length;
    }
    const footer = source.slice(end), fv = new DataView(footer.buffer);
    fv.setUint32(12, directory.reduce((n, a) => n + a.length, 0), true); fv.setUint32(16, offset, true);
    const loaded = await TE.readProjectZip(new Blob([...body, ...directory, footer]));
    assert.deepEqual(loaded.result, dc);
  });
  await check('Traversal, duplicate paths, truncated archives and CRC damage rejected', async () => {
    await assert.rejects(() => TE.zipFiles([{name: '../model.json', data: '{}'}]).then(TE.readProjectZip), /Unsafe archive/);
    await assert.rejects(() => TE.zipFiles([{name: 'model.json', data: '{}'}, {name: 'model.json', data: '{}'}]).then(TE.readProjectZip), /Duplicate/);
    await assert.rejects(() => TE.readProjectZip(newZip.slice(0, newZip.size - 5)), /truncated/);
    const good = await TE.zipFiles(minimal(dc)); const bytes = new Uint8Array(await good.arrayBuffer()); bytes[30 + 'project.json'.length] ^= 1;
    await assert.rejects(() => TE.readProjectZip(new Blob([bytes])), /Corrupt/);
  });
  // ---- 3D: magnetic field Bz perpendicular to the plane ----
  const hallBar = ({B = 1, mat = {}, nx = 60, ny = 12, L = 10e-3, W = 1e-3, t = .5e-3, thermal, electrical} = {}) => {
    const c = model(); const flux = () => ({kind: 'flux', value: 0});
    Object.assign(c, {nx, ny, lx: L, ly: W, depth: t, materialMap: Array(nx * ny).fill(0), magneticField: B,
      materials: [{name: 'm', color: '#73d8d0', rho: 5000, Cp: 300, k: 1.5, sigma: 160, beta: 0, alpha: 0, alphaSlope: 0, ...mat}],
      thermal: thermal ?? {left: {kind: 'temperature', value: 300}, right: {kind: 'temperature', value: 300}, top: flux(), bottom: flux()},
      electrical: electrical ?? {kind: 'current', value: {bias: 1e-3, amplitude: 0, phase: 0}, sourceSide: 'left', sinkSide: 'right', sourceRange: [0, 1], sinkRange: [0, 1]}});
    return c;
  };
  const at = (c, x, y) => Math.round(y * c.ny) * (c.nx + 1) + Math.round(x * c.nx);
  const oddInB = (make, f) => (f(TE.run2D(make(1))) - f(TE.run2D(make(-1)))) / 2;
  const close = (a, b, rel, label) => assert(Math.abs(a - b) <= rel * Math.abs(b), `${label}: ${a} vs ${b}`);
  await check('3D: banded direct solver matches dense elimination on non-symmetric systems', () => {
    let seed = 3; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    for (const [nx, ny] of [[7, 3], [3, 6]]) {
      const mesh = new TE.Mesh2D({nx, ny, lx: 1, ly: 1}), K = new Float64Array(16 * mesh.cells.length);
      mesh.cells.forEach((cell, c) => { for (let p = 0; p < 4; p++) for (let q = 0; q < 4; q++) K[16 * c + 4 * p + q] = (p === q ? 3 : -1) + (p !== q ? 2 * (rnd() - .5) : 0); });
      const fixed = new Map([[0, 1], [mesh.n - 1, -1]]), rhs = Array.from({length: mesh.n}, () => rnd() - .5), x = TE.cellSystem(mesh, K, Array(mesh.n).fill(0), fixed)(rhs, fixed);
      const out = Array(mesh.n).fill(0); // residual K·x − rhs at the free nodes
      mesh.cells.forEach((cell, c) => { for (let p = 0; p < 4; p++) for (let q = 0; q < 4; q++) out[cell.nodes[p]] += K[16 * c + 4 * p + q] * x[cell.nodes[q]]; });
      for (let i = 0; i < mesh.n; i++) if (!fixed.has(i)) assert(Math.abs(out[i] - rhs[i]) < 1e-12);
    }
  });
  await check('3D: with Bz = 0 the magnetic code paths stay off and results are unchanged', () => {
    const plain = TE.run2D(hallBar({B: 0, mat: {}})), withCoefficients = TE.run2D(hallBar({B: 0, mat: {hall: -6e-4, nernst: 1e-4, righiLeduc: .01, magnetoresistance: .1}}));
    assert.deepEqual({...withCoefficients, config: null}, {...plain, config: null});
    const s = TE.from2DConfig(hallBar({B: 0, mat: {hall: -6e-4, nernst: 1e-4, righiLeduc: .01}}));
    assert(!s.hallActive && !s.nernstActive && !s.righiLeducActive);
    assert.deepEqual({...TE.run2D(hallBar({B: 1, mat: {}})), config: null}, {...plain, config: null}); // field without coefficients
  });
  await check('3D: Hall bar and van der Pauw give R_H·I·B/t', () => {
    const RH = -6.24e-4, bar = TE.run2D(hallBar({mat: {hall: RH}}));
    close(TE.hallVoltage(bar).value, RH * 1e-3 * 1 / .5e-3, 1e-6, 'Hall bar');
    const vdp = B => hallBar({B, nx: 39, ny: 39, L: 5e-3, W: 5e-3, mat: {hall: 3e-4},
      electrical: {kind: 'current', value: {bias: 1e-3, amplitude: 0, phase: 0}, sourceSide: 'left', sinkSide: 'right', sourceRange: [0, .06], sinkRange: [.94, 1]}});
    const c = vdp(1), dV = oddInB(vdp, r => r.voltage[at(c, 1, 0)] - r.voltage[at(c, 0, 1)]);
    close(dV, 3e-4 * 1e-3 * 1 / .5e-3, .01, 'van der Pauw');
  });
  await check('3D: Nernst, Ettingshausen and Righi–Leduc match their analytic transverse responses', () => {
    const gradient = {left: {kind: 'temperature', value: 310}, right: {kind: 'temperature', value: 290}, top: {kind: 'flux', value: 0}, bottom: {kind: 'flux', value: 0}},
      open = {kind: 'open_circuit', value: 0, sourceSide: 'bottom', sinkSide: 'bottom', sourceRange: [0, .03], sinkRange: [.97, 1]}, g = -20 / 10e-3;
    const nernst = B => hallBar({B, mat: {nernst: 1e-4}, thermal: gradient, electrical: open}), cn = nernst(1);
    close(oddInB(nernst, r => r.voltage[at(cn, .5, 0)] - r.voltage[at(cn, .5, 1)]), 1e-4 * g * 1e-3, 1e-4, 'Nernst');
    const rl = B => hallBar({B, mat: {righiLeduc: .01}, thermal: gradient, electrical: open});
    close(oddInB(rl, r => r.temperature[at(cn, .5, 1)] - r.temperature[at(cn, .5, 0)]), .01 * g * 1e-3, 1e-4, 'Righi–Leduc');
    const ett = B => hallBar({B, mat: {nernst: 1e-4, sigma: 1e5}, electrical: {kind: 'current', value: {bias: .01, amplitude: 0, phase: 0}, sourceSide: 'left', sinkSide: 'right', sourceRange: [0, 1], sinkRange: [0, 1]}});
    let Tm; const dT = oddInB(ett, r => { Tm = (r.temperature[at(cn, .5, 1)] + r.temperature[at(cn, .5, 0)]) / 2; return r.temperature[at(cn, .5, 1)] - r.temperature[at(cn, .5, 0)]; });
    close(dT, Tm * 1e-4 * (.01 / (1e-3 * .5e-3)) * 1e-3 / 1.5, 1e-4, 'Ettingshausen (Bridgman P = TN/κ)');
    // Rotated: vertical bar with the gradient or current along y exercises the x-link transverse terms.
    const vertical = (B, mat, thermal, electrical) => hallBar({B, nx: 12, ny: 60, L: 1e-3, W: 10e-3, mat, thermal, electrical});
    const gy = {bottom: {kind: 'temperature', value: 310}, top: {kind: 'temperature', value: 290}, left: {kind: 'flux', value: 0}, right: {kind: 'flux', value: 0}},
      openY = {kind: 'open_circuit', value: 0, sourceSide: 'left', sinkSide: 'right', sourceRange: [0, .03], sinkRange: [0, .03]}, cv = vertical(1, {}, gy, openY);
    close(oddInB(B => vertical(B, {nernst: 1e-4}, gy, openY), r => r.voltage[at(cv, 0, .5)] - r.voltage[at(cv, 1, .5)]), -1e-4 * g * 1e-3, 1e-4, 'Nernst, gradient along y');
    close(oddInB(B => vertical(B, {righiLeduc: .01}, gy, openY), r => r.temperature[at(cv, 1, .5)] - r.temperature[at(cv, 0, .5)]), -.01 * g * 1e-3, 1e-4, 'Righi–Leduc, gradient along y');
    const upward = {kind: 'current', value: {bias: .01, amplitude: 0, phase: 0}, sourceSide: 'bottom', sinkSide: 'top', sourceRange: [0, 1], sinkRange: [0, 1]},
      ends = {bottom: {kind: 'temperature', value: 300}, top: {kind: 'temperature', value: 300}, left: {kind: 'flux', value: 0}, right: {kind: 'flux', value: 0}};
    const dTx = oddInB(B => vertical(B, {nernst: 1e-4, sigma: 1e5}, ends, upward), r => { Tm = (r.temperature[at(cv, 1, .5)] + r.temperature[at(cv, 0, .5)]) / 2; return r.temperature[at(cv, 1, .5)] - r.temperature[at(cv, 0, .5)]; });
    close(dTx, -Tm * 1e-4 * (.01 / (1e-3 * .5e-3)) * 1e-3 / 1.5, 1e-4, 'Ettingshausen, current along y');
  });
  await check('3D: Onsager symmetry, energy balance and strong Hall angles', () => {
    const narrow = B => hallBar({B, nx: 20, ny: 20, L: 2e-3, W: 2e-3, mat: {hall: -1e-4, sigma: 7e4},
      electrical: {kind: 'current', value: {bias: 1e-3, amplitude: 0, phase: 0}, sourceSide: 'left', sinkSide: 'right', sourceRange: [.2, .5], sinkRange: [.3, .9]}});
    close(TE.run2D(narrow(.5)).terminalVoltage, TE.run2D(narrow(-.5)).terminalVoltage, 1e-12, 'two-terminal R(B) = R(−B)');
    const all = TE.run2D(hallBar({B: 2, nx: 40, ny: 8, L: 5e-3, mat: {sigma: 1e5, beta: .002, alpha: 2e-4, alphaSlope: 2e-7, hall: 5e-5, nernst: 5e-5, righiLeduc: .02, magnetoresistance: .05},
      electrical: {kind: 'current', value: {bias: .02, amplitude: 0, phase: 0}, sourceSide: 'left', sinkSide: 'right', sourceRange: [0, 1], sinkRange: [0, 1]}}));
    assert(Math.abs(all.energyResidual) < 1e-9 * Math.max(1, all.electricalPower * 1e6), 'energy residual ' + all.energyResidual);
    const mr = B => TE.run2D(hallBar({B, mat: {magnetoresistance: .1}})).terminalVoltage; // no Hall: ρ·(1 + m·B²) exactly
    close(mr(2), 1.4 * mr(0), 1e-9, 'magnetoresistance');
    const strong = TE.run2D(hallBar({B: 1, nx: 60, ny: 6, mat: {hall: -1e-4, sigma: 7e4}})); // μB = 7
    close(TE.hallVoltage(strong).value, -1e-4 * 1e-3 / .5e-3, 1e-4, 'Hall voltage at μB = 7');
  });
  await check('3D: magnetic inputs are validated', () => {
    const issues = c => TE.validate2DConfig(c).map(i => i.path);
    assert(issues(hallBar({B: 150})).includes('magneticField'));
    assert(issues(hallBar({mat: {hall: NaN}})).includes('materials.0.hall'));
    assert(issues(hallBar({B: 2, mat: {magnetoresistance: -.5}})).includes('materials.0.magnetoresistance')); // 1 + m·B² ≤ 0
    assert(issues({...hallBar(), hallProbes: {plus: {x: 1.2, y: 0}, minus: {x: .5, y: 1}}}).includes('hallProbes.plus'));
    assert(issues({...hallBar(), hallProbes: {plus: {x: .5, y: .5}, minus: {x: .501, y: .5}}}).includes('hallProbes.minus')); // same node
    assert.equal(issues(hallBar()).length, 0);
  });
  await check('3D: Hall voltage reaches results, Bode rows, reports and CSV', async () => {
    const cfg = {...hallBar({nx: 24, ny: 4, mat: {hall: -6.24e-4}}), mode: 'periodic', frequency: 2, samples: 64,
      electrical: {kind: 'current', value: {bias: 0, amplitude: 1e-3, phase: 0}, sourceSide: 'left', sinkSide: 'right', sourceRange: [0, 1], sinkRange: [0, 1]}};
    const r = TE.run2D(cfg), h1 = TE.hallVoltage(r).harmonics[1];
    close(Math.hypot(h1.re, h1.im), 6.24e-4 * 1e-3 / .5e-3, 1e-3, 'AC Hall amplitude');
    const row = TE.bodeRows([r], {quantity: 'hallVoltage', reference: 'drive'})[0];
    close(row.magnitude, 6.24e-4 * 1e-3 / .5e-3, 1e-3, 'Bode Hall magnitude'); assert(Math.abs(Math.abs(row.phase) - 180) < .01 && row.unit === 'V');
    const files = await TE.completeResultsFiles(r, {probe: 0}), report = files.find(f => f.name === 'report.html').data;
    assert(report.includes('Hall voltage V(P+) − V(P−)') && report.includes('Magnetic field Bz (T)') && report.includes('Hall R_H m³/C'));
    assert((await files.find(f => f.name === 'terminal.csv').data.text()).startsWith('sample,time_in_cycle_s,absolute_time_s,voltage_V,current_A,hall_voltage_V'));
    TE.validateProjectBode({...bode, quantity: 'hallVoltage'});
  });
  await check('3D: the Hall bar example loads, validates and shows R_H·I·B/t', async () => {
    const {context, app: a, el: e} = appContext({preset: 'layers'});
    e('preset').value = 'hall'; await a.loadPreset();
    assert.equal(e('preset').value, 'hall'); assert.equal(context.TE.validate2DConfig(a.config).length, 0);
    const r = context.TE.run2D(a.config);
    close(context.TE.hallVoltage(r).value, -6.24e-4 * 1e-3 * 1 / .0005, 1e-4, 'example Hall voltage');
    a.accept(r);
    assert.equal(e('hMetric').textContent, '-1.248 mV'); assert(e('hNote').textContent.includes('Bz = 1 T'));
  });
  await check('Material library: every lib/ file parses and validates; built-in copies equal their files', () => {
    const lib = path.join(root, 'lib'), files = JSON.parse(fs.readFileSync(path.join(lib, 'index.json'), 'utf8')).files;
    assert(files.length >= 17 && files.includes('Si_n_1e15.json') && files.includes('Ge_p_1e19.json'));
    for (const file of files) {
      const m = app.parseMaterialJson(fs.readFileSync(path.join(lib, file), 'utf8'));
      assert(['hall', 'nernst', 'righiLeduc', 'magnetoresistance'].every(k => Number.isFinite(m[k])), file + ': magnetic coefficients');
      const c = {...model(), magneticField: 1, materials: [m]};
      assert.equal(TE.validate2DConfig(c).filter(i => i.path.startsWith('materials')).length, 0, file);
    }
    for (const [file, [, copy]] of Object.entries(app.libraryCopies)) {
      const m = app.parseMaterialJson(fs.readFileSync(path.join(lib, file), 'utf8'));
      for (const key of ['name', 'rho', 'Cp', 'k', 'sigma', 'alpha', 'beta', 'alphaSlope', 'hall', 'nernst', 'righiLeduc', 'magnetoresistance', 'color']) assert.equal(copy[key], m[key], file + ' ' + key);
    }
  });
  await check('3D: coupled effects in a bismuth Hall bar add up as the equations state', () => {
    const bi = app.parseMaterialJson(fs.readFileSync(path.join(root, 'lib', 'Bismuth.json'), 'utf8'));
    const make = mat => hallBar({nx: 64, ny: 8, L: .008, W: .001, mat, B: 1}), c = make(bi), mid = (x, y) => Math.round(y * c.ny) * (c.nx + 1) + Math.round(x * c.nx);
    const fullBi = m => ({...make(m), materials: [m]}), r = TE.run2D(fullBi(bi)), VH = TE.hallVoltage(r).value;
    const dTy = r.temperature[mid(.5, 1)] - r.temperature[mid(.5, 0)], RHIBt = bi.hall * 1e-3 * 1 / .5e-3;
    close(VH, RHIBt + bi.alpha * dTy, 2e-3, 'V_H = R_H·I·B/t + α·ΔT (Ettingshausen error)');
    const dTx = (r.temperature[mid(.5 + 2 / 64, .5)] - r.temperature[mid(.5 - 2 / 64, .5)]) / (4 / 64 * .008), T = (r.temperature[mid(.5, 1)] + r.temperature[mid(.5, 0)]) / 2;
    close(dTy / .001, T * bi.nernst * 1 * 2000 / bi.k + bi.righiLeduc * 1 * dTx, 1e-3, '∂T/∂y = T·N·B·J/κ + S·B·∂T/∂x');
    close(TE.hallVoltage(TE.run2D(fullBi({...bi, nernst: 0}))).value, RHIBt, 1e-4, 'without Nernst, V_H = R_H·I·B/t');
    close(r.electricalPower, r.terminalVoltage * r.current, 1e-12, 'P = U·I'); assert(Math.abs(r.energyResidual) < 1e-12);
  });
  await check('Material buttons keep the 12-material limit after a run', () => {
    const saved = app.config;
    app.config = {...model(), materials: Array.from({length: 12}, (_, i) => ({...model().materials[0], name: 'M' + i}))};
    app.updateMaterialCap(); app.lock(true); app.lock(false);
    for (const id of ['addMaterial', 'materialFilesButton', 'presetMaterial']) assert.equal(el(id).disabled, true, id);
    app.config = saved; app.updateMaterialCap(); app.lock(true); // below the limit: locked only while running
    for (const id of ['addMaterial', 'materialFilesButton', 'presetMaterial']) assert.equal(el(id).disabled, true, id);
    app.lock(false);
    for (const id of ['addMaterial', 'materialFilesButton', 'presetMaterial']) assert.equal(el(id).disabled, false, id);
  });
  await check('app.js starts; the Example selector shows Custom once the model changes', async () => {
    const {context, app: a, el: e} = appContext({preset: 'layers'});
    assert.equal(context.TE_APP_READY, true); assert.equal(a.presetShown, 'layers');
    a.dirty(); assert.equal(e('preset').value, 'custom'); // any edit
    e('preset').value = 'rc'; await a.loadPreset(); // examples built from library materials (built-in copies here)
    assert.equal(e('preset').value, 'rc'); assert.equal(a.config.sweep.enabled, true); a.dirty();
    e('preset').value = 'dc'; await a.loadPreset(); // choosing an example loads it and names it
    assert.equal(e('preset').value, 'dc'); assert.equal(a.config.ny, 1);
    e('preset').value = 'module'; a.moduleConfig = () => Promise.reject(new Error('offline'));
    await a.loadPreset(); // a failed load leaves the selector as it was
    assert.equal(e('preset').value, 'dc'); assert(e('status').textContent.startsWith('Could not load the example'));
    const zip = await context.TE.zipFiles([{name: 'project.json', data: JSON.stringify({format: 'thermoelectric-lab-project', version: context.TE.projectVersion, kind: 'model'})},
      {name: 'model.json', data: JSON.stringify(model())}]);
    e('projectFile').files = [zip]; await a.importProject(); // opening a project
    assert.equal(e('preset').value, 'custom'); assert(e('status').textContent.startsWith('Imported project without results'));
  });
  await check('HTML script paths and static IDs are consistent', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]); assert.equal(ids.length, new Set(ids).size);
    for (const m of html.matchAll(/<script src="([^"]+)"/g)) assert(fs.existsSync(path.join(root, m[1])));
    for (const name of fs.readdirSync(path.join(root, 'assets'))) {
      const code = fs.readFileSync(path.join(root, 'assets', name), 'utf8');
      for (const m of code.matchAll(/app\.\$\('([^']+)'\)/g)) assert(ids.includes(m[1]), 'Missing HTML ID ' + m[1]);
    }
    assert(html.includes('>Save project</button>') && html.includes('>Import project</button>') && !/id="(import|file)"/.test(html)); // no model import/export
    for (const name of ['index.html', ...fs.readdirSync(path.join(root, 'assets')).filter(x => x.endsWith('.js')).map(x => 'assets/' + x)])
      assert(!/Export model|Import model/.test(fs.readFileSync(path.join(root, name), 'utf8')), 'Stale model import/export wording in ' + name);
  });
  await check('Solver-tab equations match the shared report guide', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    for (const section of TE.equationGuide) for (const [, p] of section.html.matchAll(/<p>(.*?)<\/p>/g)) assert(html.includes(p), 'index.html differs: ' + p.slice(0, 60));
  });
  // ---- Review fixes: terminal current, Hall reporting, runs, library data and exports ----
  await check('Terminal current, power and impedance reach the results, report and CSVs', async () => {
    const t = TE.terminalQuantities(ac); // R = 0.01 Ω, 0.2 A peak: Z = 0.01 Ω, mean power ½·I²·R
    assert(Math.abs(t.impedance.re - .01) < 1e-12 && Math.abs(t.impedance.im) < 1e-12 && Math.abs(t.meanPower - 2e-4) < 1e-12);
    assert.equal(TE.terminalQuantities(dc).impedance, null); assert.equal(TE.terminalQuantities(dc).meanPower, dc.electricalPower);
    setView(); app.accept(ac);
    assert.equal(el('iMetric').textContent, '200 mA'); assert.equal(el('iNote').textContent, '0.000° · mean absorbed power 0.2 mW');
    assert(el('spectrum').innerHTML.includes('<td>Current I · A</td><td>1ω</td>') && el('spectrum').innerHTML.includes('<td>Impedance Z = U/I · Ω</td>'));
    const v = model(); v.electrical = {...v.electrical, kind: 'voltage', value: {bias: .002, amplitude: 0, phase: 0}};
    app.accept(TE.run2D(v)); // voltage control: the current is the response
    assert.equal(el('iMetric').textContent, '200 mA'); assert.equal(el('iNote').textContent, 'absorbed power U·I 0.4 mW');
    const o = model(); o.electrical = {...o.electrical, kind: 'open_circuit'}; app.accept(TE.run2D(o));
    assert.equal(el('iNote').textContent, 'Open circuit: no terminal current or power');
    const report = acFiles.find(f => f.name === 'report.html').data;
    assert(report.includes('Terminal current I, entering the source') && report.includes('Impedance Z = U₁/I₁ (Ω)') && report.includes('Mean absorbed power'));
    assert(acFiles.some(f => f.name === 'figures/terminal-current.svg'));
    assert((await acFiles.find(f => f.name === 'terminal_harmonics.csv').data.text()).startsWith('order,frequency_Hz,real_V,imag_V,peak_V,phase_deg,converged,real_A,imag_A,peak_A,current_phase_deg'));
    let csv; app.download = (name, data) => {csv = data;}; app.result = ac; app.exportSpectrum();
    assert(csv.startsWith('harmonic,frequency_Hz,peak_V,phase_deg,real_V,imag_V,converged,completed_cycles,peak_A,current_phase_deg,real_A,imag_A'));
  });
  await check('Hall voltage is reported only when the field acts transversely', async () => {
    const active = c => TE.hallStatus(c).active;
    assert(!active(model()) && TE.hallStatus(model()).reason === 'Bz = 0: no Hall voltage.');
    assert(!active(hallBar({mat: {}})) && !active(hallBar({mat: {magnetoresistance: .1}}))); // no transverse coefficient
    assert(active(hallBar({mat: {hall: -6e-4}})) && active(hallBar({mat: {nernst: 1e-4}})) && active(hallBar({mat: {righiLeduc: .01}})));
    const unpainted = hallBar({mat: {}}); unpainted.materials.push({...unpainted.materials[0], name: 'unused', hall: -6e-4}); assert(!active(unpainted));
    const r = TE.run2D(await app.moduleConfig()); app.accept(r); // Bz = 0, probes inside the floating alumina plates
    assert.equal(el('hMetric').textContent, '—'); assert.equal(el('hNote').textContent, 'Bz = 0: no Hall voltage.');
    const report = TE.resultReport(r).html;
    assert(report.includes('Not applicable: Bz = 0: no Hall voltage.') && report.includes('>P+</text>') && report.includes('>P−</text>'));
    const {context, app: a, el: e} = appContext({preset: 'layers'}); e('preset').value = 'hall'; await a.loadPreset();
    a.accept(context.TE.run2D(a.config)); assert(e('hNote').textContent.includes('R_xy = -1.248 Ω'));
  });
  await check('An exhausted cycle budget shows the last cycle as UNCONVERGED, not as an error', async () => {
    const c = model(true); c.maxPeriods = 3; for (const side of ['left', 'right', 'top', 'bottom']) c.thermal[side] = {kind: 'flux', value: 0}; // never periodic
    const messages = [], worker = {self: {postMessage: m => messages.push(structuredClone(m))}};
    vm.runInNewContext(TE.workerSource(), worker); worker.self.onmessage({data: c});
    assert.deepEqual([messages.at(-2).type, messages.at(-1).type, messages.at(-1).unconverged], ['checkpoint', 'error', true]);
    const applyGeometry = app.applyGeometry; app.applyGeometry = () => app.config; app.config = c; app.worker = null;
    globalThis.Worker = class { postMessage() { setTimeout(() => messages.forEach(data => this.onmessage({data: structuredClone(data)}))); } terminate() {} };
    try {
      app.runSimulation(); await new Promise(resolve => setTimeout(resolve, 20)); // the page replays the worker's messages
      assert.equal(el('badge').textContent, 'UNCONVERGED'); assert.equal(el('badge').className, 'warning');
      assert(app.worker === null && app.result.periods === 3 && !app.result.converged);
      // All edges adiabatic: more cycles cannot help, so the advice names the missing thermal anchor (once).
      const status = el('status').textContent;
      assert(status.includes(TE.anchorHint) && !status.includes('Raise Maximum cycles') && status.indexOf(TE.anchorHint) === status.lastIndexOf(TE.anchorHint), status);
      assert(app.unconvergedAdvice(model(true)).includes('Raise Maximum cycles')); // anchored: more cycles may help
    } finally { app.applyGeometry = applyGeometry; delete globalThis.Worker; }
  });
  await check('Painting and Fill re-run the electrode checks', () => {
    const {app: a, el: e} = appContext({preset: 'layers'}); let validations = 0; a.validateUI = () => validations++;
    a.config = {...model(), materials: [model().materials[0], {...model().materials[0], name: 'Other'}]}; a.selected = 1; a.geomFrame = {left: 0, top: 0, w: 400, h: 100};
    e('geometryCanvas').setPointerCapture = noop; e('geometryCanvas').onpointerdown({pointerId: 1, clientX: 10, clientY: 50});
    assert.deepEqual([a.config.materialMap[0], validations], [1, 0]); // validated once per stroke, when it ends
    e('geometryCanvas').onpointerup(); assert.equal(validations, 1);
    e('geometryCanvas').onpointerup(); assert.equal(validations, 1); // a stroke that painted nothing
    a.selected = 0; a.fillMaterial(); assert.equal(validations, 2);
  });
  await check('Saved views keep only valid choices', () => {
    el('terminalTrace').value = ''; assert.equal(app.captureResultView().terminalTrace, 'voltage');
    el('terminalTrace').value = 'current'; assert.equal(app.captureResultView().terminalTrace, 'current');
    assert.throws(() => TE.validateProjectView({terminalTrace: 'power'}, dc), /Invalid saved terminalTrace/);
  });
  await check('Bode phase unwrapping continues across gaps; the Bode CSV gives real and imaginary parts', () => {
    const point = (frequency, deg, converged = true) => ({...structuredClone(results[0]), frequency, converged, harmonics: {...results[0].harmonics,
      terminalVoltage: [{re: 0, im: 0}, {re: Math.cos(deg * Math.PI / 180), im: Math.sin(deg * Math.PI / 180)}, {re: 0, im: 0}, {re: 0, im: 0}]}});
    const rows = TE.bodeRows([point(1, 150), point(2, 170), point(3, -170, false), point(4, -150)], {quantity: 'terminalVoltage', reference: 'time', unwrap: true});
    assert.deepEqual(rows.map(r => r.phase === null ? null : Math.round(r.phase)), [150, 170, null, 210]);
    const [head, row] = TE.bodeCsv(TE.bodeRows(results, {quantity: 'impedance'})).split('\n'), cells = row.split(',').map(v => Number(v.replace(/"/g, '')));
    assert(head.endsWith(',status,real_part,imag_part') && Math.abs(cells.at(-2) - .01) < 1e-12 && Math.abs(cells.at(-1)) < 1e-12);
  });
  await check('Current arrows follow the phase of the terminal current', () => {
    const c = model(true); c.electrical.value.phase = 90; const r = TE.run2D(c), {theta, basis} = TE.arrowPhase(r, 1);
    assert(basis === 'terminal' && Math.abs(theta + Math.PI / 2) < 1e-9);
    const z = r.harmonics.Jx[1][0], size = Math.hypot(z.re, z.im), shown = z.re * Math.cos(theta) - z.im * Math.sin(theta);
    assert(Math.abs(z.re) < 1e-6 * size && Math.abs(shown - size) < 1e-9 * size); // Re alone would vanish at a 90° drive
    assert.deepEqual(TE.arrowPhase(dc, 0), {theta: 0, basis: 'dc'});
    const open = {method: 'periodic', config: {electrical: {kind: 'open_circuit'}}, harmonics: {current: Array(4).fill({re: 0, im: 0}), Jx: [[], [{re: 0, im: 2}]], Jy: [[], [{re: 0, im: 0}]]}};
    const pattern = TE.arrowPhase(open, 1); assert(pattern.basis === 'pattern' && Math.abs(Math.abs(pattern.theta) - Math.PI / 2) < 1e-12);
  });
  await check('Results and reports name the linear solvers actually used', () => {
    assert(dcFiles.find(f => f.name === 'report.html').data.includes('<td>Linear solvers</td><td>matrix-free CG (electrical), matrix-free CG (thermal)</td>'));
    assert.equal(ac.method, 'BDF2 / nonlinear Picard / matrix-free CG'); // Bz = 0: unchanged
    const r = TE.run2D({...hallBar({nx: 24, ny: 4, mat: {hall: -6.24e-4, righiLeduc: .01}}), mode: 'periodic', frequency: 2, samples: 64,
      electrical: {kind: 'current', value: {bias: 0, amplitude: 1e-3, phase: 0}, sourceSide: 'left', sinkSide: 'right', sourceRange: [0, 1], sinkRange: [0, 1]}});
    assert.equal(r.method, 'BDF2 / nonlinear Picard / banded LU (electrical), banded LU (thermal)');
    const report = TE.resultReport(r).html; assert(report.includes('Hall resistance R_xy = V_H₁/I₁ (Ω)') && report.includes('banded LU (electrical), banded LU (thermal)'));
  });
  await check('Material library: catalog.js mirrors the files and serves a page opened from disk', async () => {
    const lib = path.join(root, 'lib'), source = fs.readFileSync(path.join(lib, 'catalog.js'), 'utf8'), sandbox = {};
    vm.runInNewContext(source, sandbox); const files = JSON.parse(fs.readFileSync(path.join(lib, 'index.json'), 'utf8')).files;
    assert.deepEqual(Object.keys(sandbox.TE_MATERIAL_CATALOG), files);
    for (const file of files) assert.equal(JSON.stringify(sandbox.TE_MATERIAL_CATALOG[file]), JSON.stringify(JSON.parse(fs.readFileSync(path.join(lib, file), 'utf8'))), file + ': run python lib/build_catalog.py');
    const {context, app: a} = appContext({preset: 'layers'}); context.location = {protocol: 'file:'}; vm.runInContext(source, context);
    const {material, via} = await a.libraryRecord('Copper.json');
    assert.equal(via, 'catalog'); assert.equal(JSON.stringify(material), JSON.stringify(app.parseMaterialJson(fs.readFileSync(path.join(lib, 'Copper.json'), 'utf8'))));
    assert((await a.moduleConfig()).description.includes('from the lib/catalog.js copies of Bi2Te3.json'));
  });
  await check('Material data: metals rebased to 300 K alike; S and m follow σ·R_H; lightly doped Si has β', () => {
    const lib = file => app.parseMaterialJson(fs.readFileSync(path.join(root, 'lib', file), 'utf8'));
    for (const [file, rho293, tcr] of [['Aluminum.json', 2.65e-8, .00429], ['Copper.json', 1.69e-8, .0043], ['Gold.json', 2.2e-8, .004], ['Platinum.json', 1.058e-7, .00392]]) {
      const m = lib(file), S = m.sigma * m.hall; // ρ(300 K) = ρ(293.15 K)·(1 + α·6.85 K), β = α/(1 + α·6.85 K)
      close(1 / m.sigma, rho293 * (1 + tcr * 6.85), 1e-12, file + ' ρ(300 K)'); close(m.beta, tcr / (1 + tcr * 6.85), 1e-12, file + ' β');
      close(m.righiLeduc, S, 1e-3, file + ' S = σ·R_H'); close(m.magnetoresistance, S * S, 1e-2, file + ' m = (σ·R_H)²');
    }
    assert.equal(lib('Si_n_1e15.json').beta, .008); assert.equal(lib('Si_p_1e15.json').beta, .00733); // lattice mobility T^-2.4, T^-2.2
  });
  await check('Material names have 1 to 200 characters everywhere', () => {
    const long = model(); long.materials[0].name = 'x'.repeat(201);
    assert(TE.validate2DConfig(long).some(i => i.path === 'materials.0.name')); assert.throws(() => TE.checkEditorModel(long), /200 characters/);
    assert.throws(() => app.parseMaterialJson(JSON.stringify({...model().materials[0], name: 'x'.repeat(201)})), /1–200 characters/);
    long.materials[0].name = 'x'.repeat(200); assert.equal(TE.validate2DConfig(long).length, 0);
  });
  await check('Startup diagnostics ignore optional scripts (lib/catalog.js)', () => {
    const box = {hidden: true, textContent: ''}, handlers = {}, page = {window: {addEventListener: (type, fn) => {handlers[type] = fn;}}, document: {getElementById: () => box}, navigator: {userAgent: 'test'}};
    vm.runInNewContext(fs.readFileSync(path.join(root, 'assets', 'startup.js'), 'utf8'), page);
    handlers.error({target: {tagName: 'SCRIPT', src: 'lib/catalog.js', hasAttribute: name => name === 'data-optional'}}); assert.equal(box.hidden, true);
    handlers.error({target: {tagName: 'SCRIPT', src: 'assets/core.js', hasAttribute: () => false}}); assert(!box.hidden && box.textContent.includes('assets/core.js'));
    assert(fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('<script src="lib/catalog.js" data-optional>'));
  });
  await check('The 3ω example uses 256 steps per period', async () => {
    const {app: a, el: e} = appContext({preset: 'layers'}); e('preset').value = 'nonlinear'; await a.loadPreset();
    assert.equal(e('preset').value, 'nonlinear'); assert.equal(a.config.samples, 256);
  });
  await check('The Hall, p-Ge example: hole Hall voltage between side probes with isothermal side edges', async () => {
    const {context, app: a, el: e} = appContext({preset: 'layers'}); e('preset').value = 'hall-pge'; await a.loadPreset();
    assert.equal(e('preset').value, 'hall-pge'); assert.equal(context.TE.validate2DConfig(a.config).length, 0);
    const c = a.config, r = context.TE.run2D(c), VH = context.TE.hallVoltage(r).value, ideal = -c.materials[0].hall * c.electrical.value.bias * c.magneticField / c.depth;
    close(VH, -42.186e-6, 1e-4, 'saved project V_H'); close(VH, ideal, .01, 'long bar −R_H·I·B/t'); // narrow contacts: 0.6 % below
    const {plus, minus} = context.TE.hallProbeNodes(c); assert(r.temperature[plus] === 300 && r.temperature[minus] === 300); // isothermal probes
    a.accept(r); assert.equal(e('hMetric').textContent, '-0.042186 mV'); assert(e('hNote').textContent.includes('R_xy = -0.042186 Ω'));
  });
  await check('The export menu closes after a choice, on Escape and on a click outside', () => {
    const {context, el: e} = appContext({preset: 'layers'}), menu = e('exportMenu'); menu.contains = () => false;
    menu.hidden = false; menu.listeners.click({target: {closest: () => ({})}}); assert.equal(menu.hidden, true);
    menu.hidden = false; context.document.listeners.keydown({key: 'Enter'}); assert.equal(menu.hidden, false);
    context.document.listeners.keydown({key: 'Escape'}); assert.equal(menu.hidden, true);
    let focused = 0; e('exportMenuButton').focus = () => focused++; menu.contains = () => true; // focus inside the menu
    menu.hidden = false; context.document.listeners.pointerdown({target: {closest: () => ({})}}); assert.equal(menu.hidden, false); // in the menu or on its button
    context.document.listeners.pointerdown({target: {closest: () => null}}); assert.deepEqual([menu.hidden, focused], [true, 0]); // elsewhere: focus stays there
    menu.hidden = false; context.document.listeners.keydown({key: 'Escape'}); assert.deepEqual([menu.hidden, focused], [true, 1]); // Escape: back to the button
  });
  // ---- Second review: import robustness, warnings, exact inputs, export size, accessibility ----
  await check('Log sweeps saved by another JavaScript engine (last-bit differences) import with their saved frequencies', async () => {
    const c = model(true); c.sweep = {enabled: true, min: .1, max: 100, points: 3, spacing: 'log'};
    const points = []; TE.runSweep(c, m => {if (m.type === 'sweepPoint') points.push(m.result); if (m.type === 'sweepError') throw new Error(m.message);});
    const up = x => { const v = new DataView(new ArrayBuffer(8)); v.setFloat64(0, x); v.setBigUint64(0, v.getBigUint64(0) + 1n); return v.getFloat64(0); };
    const here = TE.sweepFrequencies(c.sweep), there = here.map((f, i) => i && i < here.length - 1 ? up(f) : f); // interior points 1 ulp apart
    assert.notDeepEqual(there, here);
    const results = points.map((r, i) => ({...structuredClone(r), frequency: there[i], config: {...structuredClone(r.config), frequency: there[i]}}));
    const saved = {config: c, frequencies: there, results, status: 'complete', message: 'Sweep completed.'};
    const files = [...await app.sweepFiles(saved, bode, results[0], 7), metadataFile('sweep', 0, 7)];
    const loaded = await TE.readProjectZip(await TE.zipFiles(files));
    assert.deepEqual(loaded.sweep.frequencies, there); assert.deepEqual(loaded.sweep.results.map(r => r.frequency), there);
    const status = files.find(f => f.name === 'sweep-status.json'), data = JSON.parse(status.data);
    data.requestedFrequencies[1] *= 1 + 1e-9; // beyond rounding: still rejected
    const tampered = files.map(f => f === status ? {...f, data: JSON.stringify(data)} : f);
    await assert.rejects(() => TE.zipFiles(tampered).then(TE.readProjectZip), /Invalid sweep frequency list/);
  });
  await check('Periodic models without a thermal anchor run, but are flagged before and after the run', () => {
    const c = model(true); for (const side of ['left', 'right', 'top', 'bottom']) c.thermal[side] = {kind: 'flux', value: 0};
    assert.equal(TE.validate2DConfig(c).length, 0); // non-blocking
    assert.deepEqual(TE.modelWarnings(c).map(w => w.path), ['thermal']); assert.equal(TE.modelWarnings(model(true)).length, 0);
    const convection = structuredClone(c); convection.thermal.right = {kind: 'convection', value: 300, h: 10};
    assert.equal(TE.modelWarnings(convection).length, 0); convection.thermal.right.h = 0; assert.equal(TE.modelWarnings(convection).length, 1);
    assert.equal(TE.modelWarnings({...model(), thermal: c.thermal}).length, 0); // steady: a validation error instead
    assert(TE.validate2DConfig({...model(), thermal: c.thermal}).some(i => i.path === 'thermal'));
    c.maxPeriods = 3; assert.throws(() => TE.run2D(c), e => e.unconverged && e.message.includes(TE.anchorHint));
  });
  await check('Imported colours are normalized for every project kind; result depth and Bode options are checked', async () => {
    const project = async (r, meta = metadataFile('single', 0, 2)) => TE.readProjectZip(await TE.zipFiles([...await TE.completeResultsFiles(r, {probe: 2}), meta]));
    const upper = structuredClone(dc); upper.config.materials[0].color = '#ABCDEF';
    const loaded = await project(upper);
    assert.equal(loaded.config.materials[0].color, '#abcdef'); assert.equal(loaded.result.config.materials[0].color, '#abcdef');
    const missing = structuredClone(dc); delete missing.config.materials[0].color;
    assert.equal((await project(missing)).config.materials[0].color, TE.defaultMaterialColor);
    const named = structuredClone(dc); named.config.materials[0].color = 'red';
    assert.equal((await project(named)).result.config.materials[0].color, TE.defaultMaterialColor);
    const deeper = structuredClone(dc); deeper.mesh.depth *= 2;
    await assert.rejects(() => project(deeper), /Result mesh disagrees with model/);
    const meta = {name: 'project.json', data: JSON.stringify({format: 'thermoelectric-lab-project', version: TE.projectVersion, kind: 'single', selectedIndex: 0, view: {probe: 2}, bodeOptions: {quantity: 'bogus'}})};
    await assert.rejects(() => project(dc, meta), /Invalid Bode quantity/);
    assert.equal(app.parseMaterialJson(JSON.stringify({...model().materials[0], color: '#ABCDEF'})).color, '#abcdef');
  });
  await check('A project zipped again inside one folder imports; mixed top-level entries do not', async () => {
    const inFolder = [...dcFiles, metadataFile('single', 0, 2)].map(f => ({...f, name: 'TE_3D_saved/' + f.name}));
    const loaded = await TE.readProjectZip(await TE.zipFiles([...inFolder, {name: '__MACOSX/TE_3D_saved/._project.json', data: 'x'}]));
    assert.deepEqual(loaded.result, dc);
    await assert.rejects(() => TE.zipFiles([...inFolder, {name: 'notes.txt', data: 'x'}]).then(TE.readProjectZip), /not a supported project/);
    const sweepInFolder = [...sweepFiles, metadataFile('sweep', 1, 7)].map(f => ({...f, name: 'sweep/' + f.name}));
    assert.deepEqual((await TE.readProjectZip(await TE.zipFiles(sweepInFolder))).sweep, sweep);
  });
  await check('The Example selector names the example actually loaded, even when the browser restored another', () => {
    const {context, app: a, el: e} = appContext({preset: 'hall'}); // e.g. Firefox restoring the last choice on reload
    assert.equal(e('preset').value, 'layers'); assert.equal(a.presetShown, 'layers');
    assert.equal(JSON.stringify(a.config), JSON.stringify(context.TE.default2D()));
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert(html.includes('<select id="preset" autocomplete="off">') && html.includes('<select id="presetMaterial" class="secondary preset-select" autocomplete="off">'));
  });
  await check('DC models keep the periodic settings; inactive fields never block a DC run', () => {
    const inputs = {sourceSide: 'left', sourceStart: '0', sourceEnd: '100', sinkSide: 'right', sinkStart: '0', sinkEnd: '100', electricalKind: 'current',
      bias: '0.2', amplitude: '0', phase: '0', excitationMode: 'steady', magneticField: '0', hallPlusX: '50', hallPlusY: '0', hallMinusX: '50', hallMinusY: '100',
      frequency: '7', samples: '256', maxPeriods: '40'};
    const {app: a, el: e} = appContext({preset: 'layers', ...inputs});
    for (const [id, value] of Object.entries(inputs)) e(id).value = value;
    let c = a.read(); assert.deepEqual([c.mode, c.frequency, c.samples, c.maxPeriods], ['steady', 7, 256, 40]);
    e('frequency').value = ''; e('maxPeriods').value = '2'; c = a.read(); // invalid but inactive: model values kept
    assert.deepEqual([c.frequency, c.maxPeriods], [a.config.frequency, a.config.maxPeriods]);
    e('amplitude').value = '0.1'; e('excitationMode').value = 'periodic'; // active again: strict
    assert.throws(() => a.read(), /frequency: value required/);
    a.config = {...a.config, mode: 'steady', frequency: 0}; a.fill(); // saved in DC by an earlier version
    assert.equal(Number(e('frequency').value), TE.default2D().frequency);
  });
  await check('Sweep archives hold reports and SVG figures for the selected point only', () => {
    const names = sweepFiles.map(f => f.name);
    assert(names.includes('frequency-001/report.html') && names.some(n => n.startsWith('frequency-001/figures/')));
    assert(!names.includes('frequency-002/report.html') && !names.some(n => n.startsWith('frequency-002/figures/')));
    assert(names.includes('frequency-002/results.json') && names.includes('frequency-002/histories/temperature.csv') && names.includes('report.html'));
    assert(sweepFiles.find(f => f.name === 'frequency-002/README.txt').data.includes('This sweep point has no report.html'));
    assert(JSON.parse(sweepFiles.find(f => f.name === 'frequency-002/manifest.json').data).files.every(n => names.includes('frequency-002/' + n) || n === 'project.json'));
  });
  await check('Unit-scaled inputs (mm, %, µV/K) read back exactly', () => {
    const input = (value = '') => ({value, dataset: {}});
    for (const [si, exponent] of [[1.014e-5, 6], [1.988e-5, 6], [4.21e-7, 6], [.45, 2], [6 / 34, 2], [.005061, 3], [.000175, 3]]) {
      const e = input(); TE.setScaledInput(e, si, exponent); assert.equal(TE.readScaledInput(e, exponent), si);
      TE.setNumberInput(e, TE.readNumberInput(e)); assert.equal(TE.readScaledInput(e, exponent), si); // focus-out normalization
    }
    assert.notEqual(10.14 / 1e6, 1.014e-5); assert.equal(TE.readScaledInput(input('10.14'), 6), 1.014e-5); // typed: no division error
    const edited = input(); TE.setScaledInput(edited, .45, 2); edited.value = '46'; assert.equal(TE.readScaledInput(edited, 2), .46);
    const {app: a} = appContext({preset: 'layers'});
    a.restoreBodeOptions({...bode, x: 1 / 3, y: .123456789012345, representation: 'polar'});
    assert.deepEqual([a.bodeOptions().x, a.bodeOptions().y], [1 / 3, .123456789012345]);
    assert(a.numberAttrs(1.014e-5, 6).includes('data-si-number="0.00001014"'));
  });
  await check('Live regions: polite validation boxes; run progress rewrites the status at most once a second per cycle', async () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert(html.includes('<div id="validationSummary" class="validation-summary" role="status" hidden>') && html.includes('<div id="validationWarnings" class="validation-summary validation-warning" role="status" hidden>'));
    const {context, app: a, el: e} = appContext({preset: 'layers'});
    let writes = 0, text = '';
    Object.defineProperty(e('status'), 'textContent', {get: () => text, set: v => {text = v; writes++;}});
    const progress = (cycle, step) => ({type: 'progress', progress: {cycle, maxPeriods: 10, step, samples: 64, error: null}});
    const messages = [...Array.from({length: 30}, (_, i) => progress(1, i + 1)), progress(2, 1)];
    context.Worker = class { postMessage() { setTimeout(() => messages.forEach(data => this.onmessage({data}))); } terminate() {} };
    a.applyGeometry = () => a.config;
    a.runSimulation(); const start = writes; await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(writes - start, 2, text); assert(text.startsWith('Cycle 2/10')); // cycle 1 once, then cycle 2
    a.cancelSimulation();
  });
  await check('One escape function and one colormap serve the page and the exports; dead code is gone', () => {
    assert.equal(app.esc, TE.escapeHtml); assert.equal(app.color, TE.heatColor);
    for (const name of ['MaterialCollection', 'spatialProfile']) assert.equal(TE[name], undefined, name);
    assert.equal(typeof new TE.ThermoelectricMaterial(model().materials[0]).thomson, 'undefined');
    assert.equal(TE.decodeWorkerMessage({result: {harmonics: {x: {encoding: 'complex128', scalar: true, orders: 1, width: 1, buffer: new Float64Array([1, 2]).buffer}}}}).result.harmonics.x[0].im, 2);
  });
  await check('Fallback material list equals lib/index.json', () => {
    const {app: a} = appContext({preset: 'layers'});
    assert.equal(JSON.stringify(a.libraryFallback), JSON.stringify(JSON.parse(fs.readFileSync(path.join(root, 'lib', 'index.json'), 'utf8')).files));
  });
  // ---- Third review: Bode references, legacy ZIP names, lazy checkpoints, worker messages, DC thermal AC ----
  await check('Bode references: an unconverged point never keeps an inactive reference selectable', () => {
    const {app: a, el: e} = appContext({preset: 'layers'}), open = c => ({...structuredClone(c), electrical: {...structuredClone(c.electrical), kind: 'open_circuit'}});
    a.sweepResult = {config: open(config), frequencies: [2, 4], status: 'stopped', message: '',
      results: results.map((r, i) => ({...structuredClone(r), converged: i === 0, config: open(r.config)}))}; // the second point is unconverged
    const options = ['drive', 'current', 'terminalVoltage', 'left', 'time'].map(value => ({value}));
    Object.assign(e('bodeReference'), {options, value: 'time'}); e('bodeQuantity').value = 'terminalVoltage'; e('bodeQuantity').querySelector = () => ({});
    a.drawBode(); // open circuit: no drive and no terminal current; the left side has no thermal AC
    assert.deepEqual(options.map(o => Boolean(o.disabled)), [true, true, false, true, false]);
    a.sweepResult.results.forEach(r => r.converged = false); a.drawBode(); // nothing converged: nothing to decide on
    assert(options.every(o => !o.disabled));
  });
  await check('A project zipped again by Windows Explorer (code-page folder name, no UTF-8 flag) imports', async () => {
    const files = [...dcFiles, metadataFile('single', 0, 2)].map(f => ({...f, name: 'R_sultats/' + f.name}));
    const recode = async clearFlag => {
      const zip = new Uint8Array(await (await TE.zipFiles(files)).arrayBuffer()), view = new DataView(zip.buffer);
      for (let i = 0; i + 46 < zip.length; i++) {
        const signature = view.getUint32(i, true), [flag, name] = signature === 0x04034b50 ? [6, 30] : signature === 0x02014b50 ? [8, 46] : [];
        if (flag === undefined || zip[i + name] !== 0x52 || zip[i + name + 1] !== 0x5f) continue;
        if (clearFlag) view.setUint16(i + flag, view.getUint16(i + flag, true) & ~0x800, true);
        zip[i + name + 1] = 0x82; // 'é' in code page 437, not valid UTF-8 on its own
      }
      return new Blob([zip]);
    };
    assert.deepEqual((await TE.readProjectZip(await recode(true))).result, dc);
    await assert.rejects(() => recode(false).then(TE.readProjectZip), /not valid UTF-8/); // a name flagged as UTF-8 must be UTF-8
  });
  await check('Checkpoints stay encoded until shown; anything thrown in the worker arrives as text', async () => {
    const c = model(true); c.maxPeriods = 3; for (const side of ['left', 'right', 'top', 'bottom']) c.thermal[side] = {kind: 'flux', value: 0};
    const messages = [], worker = {self: {postMessage: m => messages.push(structuredClone(m))}};
    vm.runInNewContext(TE.workerSource(), worker); worker.self.onmessage({data: c});
    const saved = messages.filter(m => m.type === 'checkpoint'); assert(saved.length >= 2);
    const {context, app: a, el: e} = appContext({preset: 'layers'}), decode = context.TE.decodeWorkerMessage;
    let decoded = 0; context.TE.decodeWorkerMessage = m => (m.type === 'checkpoint' && decoded++, decode(m));
    context.Worker = class { postMessage() { setTimeout(() => messages.filter(m => m.type !== 'error').forEach(data => this.onmessage({data: structuredClone(data)}))); } terminate() {} };
    a.applyGeometry = () => a.config; a.config = c;
    a.runSimulation(); await new Promise(resolve => setTimeout(resolve, 20));
    const whileRunning = decoded; a.cancelSimulation(); // Stop shows the latest saved cycle (and always stops the clock)
    assert.equal(whileRunning, 0); // received while running, never decoded
    assert.deepEqual([decoded, e('badge').textContent, a.result.periods], [1, 'STOPPED · UNCONVERGED', saved.at(-1).result.periods]);
    for (const thrown of ['plain text', null]) {
      const sent = [], sandbox = vm.createContext({self: {postMessage: m => sent.push(m)}, thrown});
      vm.runInContext(TE.workerSource(), sandbox); vm.runInContext('TE.run2D = () => { throw thrown; };', sandbox);
      sandbox.self.onmessage({data: model()});
      assert.deepEqual(sent.map(m => [m.type, m.message, m.unconverged]), [['error', String(thrown), false]]);
    }
  });
  await check('DC models clear only the thermal AC peaks that would make them periodic', () => {
    const {context, app: a} = appContext({preset: 'layers'}), fields = {};
    const card = side => {
      fields[side] = Object.fromEntries(['kind', 'bias', 'amplitude', 'phase', 'h'].map(key => [key, {value: key === 'kind' ? 'flux' : '0', dataset: {key}, disabled: false}]));
      return {dataset: {side}, querySelector: selector => fields[side][/data-key="(\w+)"/.exec(selector)[1]], querySelectorAll: () => Object.values(fields[side])};
    };
    const cards = ['left', 'right', 'bottom', 'top'].map(card);
    context.document.querySelectorAll = selector => selector === '[data-side]' ? cards : [];
    const c = model(); c.thermal.right = {kind: 'convection', value: {bias: 290, amplitude: 5, phase: 0}, h: 0}; // h = 0: inactive
    Object.assign(fields.left.kind, {value: 'temperature'}); Object.assign(fields.right.kind, {value: 'convection'});
    for (const side of ['left', 'right']) fields[side].amplitude.value = '5'; // as boundaryForm renders a thermal AC peak
    a.config = c; a.fill();
    assert.equal(c.mode, 'steady'); assert.equal(fields.left.amplitude.value, '0'); // active side: cleared, the model stays DC
    assert.equal(fields.right.amplitude.value, '5'); // inactive side: kept, like any disabled field, for when h is raised
  });
  await check('DC results: the selected-time panel is hidden and captions name nodal values, not phasors', () => {
    const {app: a, el: e} = appContext({preset: 'layers', field: 'temperature', representation: 'amplitude'});
    a.accept(dc); a.drawResults();
    assert.equal(e('profileCard').hidden, true);
    assert(e('fieldCaption').textContent.includes('DC · nodal values averaged per cell') && !e('fieldCaption').textContent.includes('phasor'), e('fieldCaption').textContent);
    assert.equal(e('representationHelp').textContent, 'Steady result: signed values.');
    e('profileCaption').textContent = 'untouched'; a.drawProfile(); assert.equal(e('profileCaption').textContent, 'untouched'); // hidden: not drawn
    a.accept(ac); assert.equal(e('profileCard').hidden, false); // periodic: the panel and its time slider
    a.drawResults(); assert(e('fieldCaption').textContent.includes('DC · nodal values averaged per cell')); // the mean of a periodic run is real too
    e('harmonic').value = '1'; a.drawResults(); assert(e('fieldCaption').textContent.includes('1ω · amplitude · complex phasors averaged per cell'), e('fieldCaption').textContent);
    a.accept(dc); a.clearResults(); assert.equal(e('profileCard').hidden, false); // no result: the page as it opens
  });
  await check('Current arrows are greyed out when the displayed component carries no current', () => {
    const {app: a, el: e} = appContext({preset: 'layers', field: 'temperature', representation: 'amplitude'});
    a.accept(dc); a.drawResults(); assert.equal(e('arrows').disabled, false); // DC current
    e('arrows').checked = true;
    a.accept(ac); a.drawResults(); // the mean of an AC run without DC bias carries no current
    assert.deepEqual([e('arrows').disabled, e('arrows').checked], [true, true]); // greyed, the choice kept
    assert(e('vectorNote').textContent.startsWith('No current arrows'), e('vectorNote').textContent);
    e('harmonic').value = '1'; a.drawResults(); assert.equal(e('arrows').disabled, false);
    assert(e('vectorNote').textContent.startsWith('Arrows: current at ωt'), e('vectorNote').textContent);
    e('harmonic').value = '2'; a.drawResults(); assert.equal(e('arrows').disabled, true); // absent from a linear current drive
    a.clearResults(); assert.equal(e('arrows').disabled, true); // no result, nothing to draw
  });
  console.log(failures ? `\n${failures} regression check(s) FAILED, ${checks} passed.` : `\n${checks} regression checks passed.`);
})().catch(e => {console.error(e); process.exitCode = 1;});
