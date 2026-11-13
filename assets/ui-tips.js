/* Label tooltips: a "?" next to every non-obvious label, one sentence of physical or practical meaning.
   Material, electrode and thermal cards are rebuilt by the model code, so tips are (re)attached idempotently. */
(function (app) {
  'use strict';
  if (!app || typeof document === 'undefined') return;
  const byId = {
    excitationMode: 'A single frequency solves one periodic state, the sweep repeats it over a range of frequencies, DC solves the steady state.',
    sweepMin: 'Lowest frequency of the sweep.',
    sweepMax: 'Highest frequency of the sweep.',
    sweepPoints: 'Number of frequencies solved. Each one is a full periodic run, so more points take proportionally longer.',
    sweepSpacing: 'Logarithmic spacing suits wide ranges, linear spacing suits narrow ones.',
    electricalKind: 'Which terminal quantity you set. The other one is solved for; open circuit forces zero net current.',
    magneticField: 'Uniform field perpendicular to the plane. Positive Bz points out of the screen, toward the viewer. At zero the model is exactly the 2D model.',
    frequency: 'One shared frequency applies to every periodic electrical and thermal input.',
    samples: 'More time steps per period lower the integration error, which is largest for the higher harmonics.',
    maxPeriods: 'Cycle budget. A run that uses all of it is kept but flagged as unconverged.',
    bodeQuantity: 'Quantity plotted against frequency.',
    bodeHarmonic: 'Fourier component shown. 1ω is the drive frequency, 2ω and 3ω are nonlinear distortion.',
    bodeRepresentation: 'Magnitude and phase, or real and imaginary parts.',
    bodeReference: 'Signal that the phase and the normalization are measured against.',
    bodeNormalization: 'Divides by the reference amplitude, or by its n-th power, so drives of different size compare.',
    bodeScale: 'Physical units, or decibels relative to the reference level below.',
    bodeDb: 'Level that counts as 0 dB, in the units of the plotted magnitude.',
    bodeX: 'Probe position in % of the width.',
    bodeY: 'Probe position in % of the height.',
    bodeFloor: 'Amplitudes below this are too small for a meaningful phase and are left out of the phase plot.',
    bodeUnwrap: 'Wrapped keeps the phase within ±180°; unwrapped removes the jumps.',
    sweepPoint: 'Frequency whose spatial maps and report are shown.',
    profileField: 'Field drawn in the map below.',
    profileTime: 'Instant within the saved cycle.'
  };
  const material = {
    alphaSlope: 'How fast the Seebeck coefficient changes with temperature. It drives Thomson heating.',
    nernst: 'Transverse voltage produced by a heat flow in a field. It only acts when Bz is not zero.',
    righiLeduc: 'Sideways deflection of the heat flow in a field. It only acts when Bz is not zero.',
    magnetoresistance: 'Relative rise of resistivity with field, as 1 + m·B².'
  };
  const thermal = {
    kind: 'Temperature fixes T on this side, flux sets the total heat leaving it, convection exchanges heat with an ambient at the given temperature.',
  };

  const tipFor = control => {
    if (control.closest('[data-material]')) return material[control.dataset.key];
    if (control.closest('[data-side]')) return thermal[control.dataset.key];
    return byId[control.id];
  };
  let serial = 0;
  const attach = () => {
    for (const label of document.querySelectorAll('label')) {
      if (label.closest('.field-with-tip')) continue;
      const control = label.querySelector('input,select');
      const text = control && tipFor(control);
      if (!text) continue;
      const name = [...label.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim() || control.id;
      const id = 'tip-' + (++serial);
      if (!control.id) control.id = id + '-control';
      label.htmlFor = control.id;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tip';
      button.textContent = '?';
      button.setAttribute('aria-label', 'About ' + name);
      button.setAttribute('aria-describedby', id);
      button.setAttribute('aria-expanded', 'false');
      const tt = document.createElement('small');
      tt.className = 'tt';
      tt.id = id;
      tt.setAttribute('role', 'tooltip');
      tt.textContent = text;
      // Keep the native help button outside the label: the label belongs only to the input/select.
      const wrapper = document.createElement('div'), heading = document.createElement('div');
      wrapper.className = 'field-with-tip';
      heading.className = 'tip-label';
      label.replaceWith(wrapper);
      wrapper.append(heading, control);
      heading.append(label, button, tt);
    }
  };
  attach();
  if (globalThis.MutationObserver) for (const id of ['materialCards', 'thermalCards', 'electrodes']) {
    const el = document.getElementById(id);
    if (el) new MutationObserver(attach).observe(el, {childList: true});
  }

  // A tooltip opens when its "?" is clicked and closes on a second click, a click elsewhere, or Escape.
  const closeAll = except => document.querySelectorAll('.tip[aria-expanded="true"]').forEach(b => { if (b !== except) b.setAttribute('aria-expanded', 'false'); });
  document.addEventListener('click', e => {
    if (app.busy) return;
    const tip = e.target.closest?.('.tip');
    closeAll(tip);
    if (!tip) return;
    e.preventDefault();
    const open = tip.getAttribute('aria-expanded') !== 'true';
    tip.setAttribute('aria-expanded', String(open));
    if (!open) return;
    const tt = tip.nextElementSibling;
    tt.classList.remove('flip', 'up');
    const r = tt.getBoundingClientRect();
    if (r.right > innerWidth - 8) tt.classList.add('flip');
    if (r.bottom > innerHeight - 40) tt.classList.add('up');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
})(globalThis.TEApp);
