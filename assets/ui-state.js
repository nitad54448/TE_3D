/* Shared UI state; modules expose their operations on TEApp. */
globalThis.TEApp = {};
(function (app) {
  'use strict';
  app.$ = id => document.getElementById(id);
  app.esc = TE.escapeHtml;
  app.clock = null;
  // Latest saved complete cycle of the running calculation. It is shown only after Stop or an exhausted
  // cycle budget, so the worker's message stays encoded until then: decoding every checkpoint (tens of MB
  // at the largest mesh, every few seconds) would stall the page. The solver checked it before sending.
  let checkpoint = null, encodedCheckpoint = null;
  Object.defineProperty(app, 'checkpoint', {
    enumerable: true,
    get() {
      if (encodedCheckpoint) {
        const message = encodedCheckpoint;
        encodedCheckpoint = null;
        try {
          checkpoint = TE.checkResult(TE.decodeWorkerMessage(message).result);
        } catch {
          checkpoint = null; // unreadable: treated as no saved cycle
        }
      }
      return checkpoint;
    },
    set(value) {
      encodedCheckpoint = null;
      checkpoint = value;
    }
  });
  app.holdCheckpoint = message => {
    encodedCheckpoint = message;
    checkpoint = null;
  };
  app.lastMeshEdit = null;
  app.sweepResult = null;
  app.activeSweep = null;
  app.config = TE.default2D();
  app.defaultPreset = 'layers'; // the example that TE.default2D() builds, shown by the selector at startup
  app.selected = 0;
  app.result = null;
  app.worker = null;
  app.probe = 0;
  app.started = 0;
  app.paint = false;
  app.paintChanged = false; // a paint stroke changed the material map: validate when it ends
  app.geomFrame = null;
  app.resultFrame = null;
  // Displayed numbers carry only the digits a result resolves; projects, CSV files and reports keep full
  // precision. Plain notation from 1E-3 to 1E5, E notation outside; a value that rounds to zero shows as 0.
  const plain = v => Math.abs(v) >= 1e-3 && Math.abs(v) < 1e5,
    eNotation = (v, decimals) => (decimals === undefined ? v.toExponential() : v.toExponential(decimals)).replace('e+', 'E').replace('e', 'E');
  // `digits` significant digits (4 by default: the discretization error is of order 0.1 %).
  app.fmt = (v, digits = 4) => {
    if (!Number.isFinite(v)) return String(v);
    const r = Number(v.toPrecision(digits));
    return r === 0 ? '0' : plain(r) ? String(r) : eNotation(r);
  };
  // Rounded to the decade of the resolution `res`, keeping that last digit (trailing zeros included), so that
  // values shown together end on the same digit: 229.61–300.13 K, not 229.6061283–300.1273 K.
  app.fixed = (v, res) => {
    if (!Number.isFinite(v)) return String(v);
    const e = Math.floor(Math.log10(res)), step = 10 ** e, r = Math.round(v / step) * step;
    if (Math.abs(r) < step / 2) return '0';
    return plain(r) ? r.toFixed(Math.min(100, Math.max(0, -e))) : eNotation(r, Math.min(100, Math.max(0, Math.floor(Math.log10(Math.abs(r))) - e)));
  };
  // Values of one range (a colour scale, a temperature range): three significant digits of the span, never
  // finer than the 1E-9 relative precision of the solution. A uniform field shows 4 significant digits.
  app.rangeFormat = (lo, hi) => {
    const size = Math.max(Math.abs(lo), Math.abs(hi)), span = Math.abs(hi - lo);
    if (!(span > size * 1e-9)) return v => app.fmt(v);
    const res = Math.max(span / 1000, size * 1e-9);
    return v => app.fixed(v, res);
  };
  // SI prefix for electrical quantities and fluxes, chosen from the size of the value or range; K and ° keep theirs.
  const prefixes = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
  app.prefixed = (size, unit) => {
    if (!['V', 'A', 'W', 'Ω', 'A/m²', 'W/m²'].includes(unit) || !(size > 0) || !Number.isFinite(size)) return {factor: 1, unit};
    const a = Number(size.toPrecision(4)), [factor, p] = prefixes.find(([f]) => a >= f) ?? prefixes.at(-1);
    return {factor, unit: p + unit};
  };
  app.si = (v, unit, digits = 4) => {
    const p = app.prefixed(Math.abs(v), unit);
    return app.fmt(v / p.factor, digits) + ' ' + p.unit;
  };
  // A field shown with its scale: one prefix and one last digit for the scale ends and the probe value.
  app.fieldFormat = (lo, hi, unit) => {
    const p = app.prefixed(Math.max(Math.abs(lo), Math.abs(hi)), unit), f = app.rangeFormat(lo / p.factor, hi / p.factor);
    return {unit: p.unit, format: v => f(v / p.factor), text: v => f(v / p.factor) + ' ' + p.unit};
  };
  app.extent = values => {
    let lo = Infinity, hi = -Infinity;
    for (const v of values) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    return {lo, hi};
  };
  // Axis ticks: two significant digits of the axis span.
  app.tick = (v, lo, hi) => hi > lo ? app.fixed(v, (hi - lo) / 40) : app.fmt(v);
  app.amp = z => Math.hypot(z.re, z.im);
  app.phase = z => Math.atan2(z.im, z.re) * 180 / Math.PI;
  // Phase text with fixed decimals (0.01°: finer than the time discretization resolves);
  // a value that rounds to zero is shown as 0, never as -0.00.
  app.degrees = (z, digits = 2) => {
    const text = app.phase(z).toFixed(digits);
    return Number(text) === 0 ? (0).toFixed(digits) : text;
  };
  app.num = id => {
    const e = app.$(id);
    TE.assert(e.value.trim() !== '', `${id}: value required.`);
    return TE.readNumberInput(e);
  };
  // Inputs shown in mm, % or µV/K: the SI value, exact (exponent 3, 2 or 6).
  app.scaledNum = (id, exponent) => {
    const e = app.$(id);
    TE.assert(e.value.trim() !== '', `${id}: value required.`);
    return TE.readScaledInput(e, exponent);
  };
  app.exporting = false;
  app.inputsChanged = false;
  app.geometryFrame = 0;
  app.presetToken = 0;
  app.timer = undefined;
})(globalThis.TEApp);
