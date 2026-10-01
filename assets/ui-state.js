/* Shared UI state; modules expose their operations on TEApp. */
globalThis.TEApp = {};
(function (app) {
  'use strict';
  app.$ = id => document.getElementById(id);
  app.esc = TE.escapeHtml;
  app.clock = null;
  app.checkpoint = null;
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
  app.fmt = v => Math.abs(v) > 1e4 || v !== 0 && Math.abs(v) < .001 ? v.toExponential(3) : Number(v.toPrecision(5)).toString();
  app.amp = z => Math.hypot(z.re, z.im);
  app.phase = z => Math.atan2(z.im, z.re) * 180 / Math.PI;
  // Phase text with fixed decimals; a value that rounds to zero is shown as 0, never as -0.000.
  app.degrees = (z, digits = 3) => {
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
