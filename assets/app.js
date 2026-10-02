(function (app) {
  'use strict';
  app.notice = function notice(text, error = false) {
    app.$('status').textContent = text;
    app.$('badge').textContent = error ? 'ERROR' : 'READY';
    app.$('badge').className = error ? 'error' : '';
  };
  app.dirty = function dirty() {
    if (app.worker) return;
    app.showPreset('custom'); // the model no longer matches the loaded example
    // Exports stay disabled until a new result is displayed, including while browsing sweep points.
    app.setExports(false);
    if (app.result) app.inputsChanged = true;
    app.$('badge').textContent = app.result ? 'INPUTS CHANGED' : 'READY';
    app.$('badge').className = '';
    if (app.result) app.$('status').textContent = 'Inputs changed. Run again to update the displayed result.';
  };
  app.tab = function tab(name) {
    document.querySelectorAll('[role=tab]').forEach(t => {
      const active = t.dataset.tab === name;
      t.setAttribute('aria-selected', active);
      t.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('[role=tabpanel]').forEach(p => p.hidden = p.id !== name);
    requestAnimationFrame(() => {
      if (name === 'geometry') app.drawGeometry();
      if (name === 'results') {
        app.drawResults();
        app.drawProfile();
        app.drawBode();
      }
    });
  };
  document.querySelectorAll('[role=tab]').forEach(t => {
    t.onclick = () => app.tab(t.dataset.tab);
    t.onkeydown = e => {
      const tabs = [...document.querySelectorAll('[role=tab]')],
        i = tabs.indexOf(t);
      let next;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i + tabs.length - 1) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs.at(-1);
      if (next) {
        e.preventDefault();
        app.tab(next.dataset.tab);
        next.focus();
      }
    };
  });
  app.$('geometryCanvas').onpointerdown = e => {
    app.paint = true;
    app.$('geometryCanvas').setPointerCapture(e.pointerId);
    app.paintAt(e);
  };
  app.$('geometryCanvas').onpointermove = e => {
    if (app.paint) app.paintAt(e);
  };
  // The electrode checks depend on the painted materials: validate once per stroke.
  const endPaint = () => {
    app.paint = false;
    if (!app.paintChanged) return;
    app.paintChanged = false;
    app.validateUI();
  };
  app.$('geometryCanvas').onpointerup = endPaint;
  app.$('geometryCanvas').onpointercancel = endPaint;
  app.$('palette').onclick = e => {
    const b = e.target.closest('[data-select]');
    if (b) {
      app.selected = Number(b.dataset.select);
      app.palette();
    }
  };
  app.$('applyGrid').onclick = app.applyMesh;
  app.$('fill').onclick = app.fillMaterial;
  app.$('addMaterial').onclick = app.addMaterial;
  app.$('materialFilesButton').onclick = () => app.$('materialFiles').click();
  app.$('materialFiles').onchange = app.importMaterialJson;
  app.$('presetMaterial').onchange = async () => {
    const select = app.$('presetMaterial');
    const file = select.value;
    if (!file) return;
    try {
      TE.assert(!app.worker && !app.importingProject, 'Wait until the current operation finishes.');
      TE.assert(app.read().materials.length < 12, 'Maximum 12 materials.');
      const {material} = await app.libraryRecord(file);
      // A run or import may have started, or inputs changed, while the file was loading.
      TE.assert(!app.worker && !app.importingProject, 'Wait until the current operation finishes, then add the material again.');
      const config = app.read();
      TE.assert(config.materials.length < 12, 'Maximum 12 materials.');
      config.materials.push(material);
      app.config = config;
      app.materialsForm();
      app.drawGeometry();
      app.dirty();
      app.validateUI();
    } catch (e) {
      app.notice(e.message, true);
    } finally {
      select.value = '';
    }
  };
  app.$('materials').addEventListener('click', e => {
    const btn = e.target.closest('.remove-material');
    if (btn) app.removeMaterial(Number(btn.dataset.remove));
  });
  app.$('resultCanvas').onclick = e => {
    if (!app.result || !app.resultFrame) return;
    const r = app.$('resultCanvas').getBoundingClientRect(),
      f = app.resultFrame,
      c = app.result.config,
      x = (e.clientX - r.left - f.left) / f.w,
      y = 1 - (e.clientY - r.top - f.top) / f.h;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    app.probe = Math.round(y * c.ny) * (c.nx + 1) + Math.round(x * c.nx);
    app.drawResults();
  };
  for (const id of ['field', 'harmonic', 'representation', 'arrows', 'terminalTrace']) app.$(id).onchange = app.drawResults;
  for (const id of ['profileField', 'profileTime']) app.$(id).addEventListener('input', app.drawProfile);
  app.$('excitationMode').addEventListener('change', app.modes);
  app.$('run').onclick = app.runSimulation;
  app.$('cancel').onclick = app.cancelSimulation;
  // Sweep selections always refer to the saved computed model.

  app.$('sweepPoint').onchange = () => app.selectSweepPoint(Number(app.$('sweepPoint').value));
  for (const id of ['bodeQuantity', 'bodeHarmonic', 'bodeRepresentation', 'bodeReference', 'bodeNormalization', 'bodeScale', 'bodeDb', 'bodeX', 'bodeY', 'bodeFloor', 'bodeUnwrap']) app.$(id).addEventListener('input', app.drawBode);
  for (const id of ['bodeMagnitude', 'bodePhase']) app.$(id).onclick = e => {
    const node = e.target.closest('[data-bode-point]');
    if (node) app.selectSweepPoint(Number(node.dataset.bodePoint));
  };
  app.$('bodeCsv').onclick = () => {
    try {
      app.download('thermoelectric-bode.csv', TE.bodeCsv(TE.bodeRows(app.sweepResult.results, app.bodeOptions())), 'text/csv');
    } catch (e) {
      app.$('bodeNote').textContent = e.message;
    }
  };
  app.$('save').onclick = app.saveProject;
  app.$('exportMenuButton').onclick = () => {
    const open = app.$('exportMenu').hidden;
    app.$('exportMenu').hidden = !open;
    app.$('exportMenuButton').setAttribute('aria-expanded', String(open));
  };
  // Choosing an export, or pressing Escape, closes the menu; focus returns to its button when it was inside.
  // A click anywhere else closes it too and leaves focus where the user clicked.
  const closeExportMenu = ({restoreFocus = true} = {}) => {
    const menu = app.$('exportMenu');
    if (menu.hidden) return;
    const refocus = restoreFocus && menu.contains(document.activeElement);
    menu.hidden = true;
    app.$('exportMenuButton').setAttribute('aria-expanded', 'false');
    if (refocus) app.$('exportMenuButton').focus();
  };
  app.$('exportMenu').addEventListener('click', e => {
    if (e.target.closest('button')) closeExportMenu();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeExportMenu();
  });
  document.addEventListener('pointerdown', e => {
    if (!e.target?.closest?.('#exportMenu, #exportMenuButton')) closeExportMenu({restoreFocus: false});
  });
  app.$('exportPdf').onclick = app.exportPdf;
  app.$('exportZip').onclick = app.exportZip;
  app.$('exportResults').onclick = app.exportResults;
  app.$('exportCsv').onclick = app.exportSpectrum;
  app.$('importProject').onclick = () => app.$('projectFile').click();
  app.$('projectFile').onchange = app.importProject;
  app.$('preset').onchange = app.loadPreset;
  document.querySelectorAll('.settings').forEach(e => {
    e.addEventListener('input', event => {
      if (event.target.type === 'number') {
        for (const key of ['rawNumber', 'displayNumber', 'siNumber', 'siDisplay']) delete event.target.dataset[key];
      }
      app.modes();
      app.dirty();
      app.meshPreview();
      app.validateUI();
    });
    e.addEventListener('change', () => {
      app.modes();
      try {
        app.config = app.read();
        app.palette();
        app.drawGeometry();
      } catch {}
      app.dirty();
      app.meshPreview();
      app.validateUI();
    });
  });
  // Normalize completed numeric edits, retaining the full raw number behind the display.
  document.addEventListener('focusout', e => {
    if (e.target.matches('input[type=number]') && e.target.value.trim() !== '') {
      try {
        TE.setNumberInput(e.target, TE.readNumberInput(e.target));
        app.meshPreview();
        app.validateUI();
      } catch {}
    }
  });
  window.addEventListener('resize', () => {
    clearTimeout(app.timer);
    app.timer = setTimeout(() => {
      app.drawGeometry();
      app.drawResults();
      app.drawProfile();
      app.drawBode();
    }, 120);
  });

  // Used only when neither lib/catalog.js nor lib/index.json can be read; must equal lib/index.json.
  app.libraryFallback = ["Air.json", "Alumina.json", "Aluminum.json", "Bi2Te3.json", "Bi2Te3_n_type.json", "Bismuth.json", "Copper.json", "Ge_n_1e15.json", "Ge_n_1e19.json", "Ge_p_1e15.json", "Ge_p_1e19.json", "Ge_p_reference.json", "Gold.json", "PbTe.json", "Platinum.json", "Si_n_1e15.json", "Si_n_1e19.json", "Si_p_1e15.json", "Si_p_1e19.json"];
  const initPresets = async () => {
    const catalog = globalThis.TE_MATERIAL_CATALOG ?? null;
    let files = catalog ? Object.keys(catalog) : app.libraryFallback;
    // Opened from disk, browsers block reading lib/: the list then comes from lib/catalog.js.
    if (globalThis.location?.protocol !== 'file:') try {
      const res = await fetch('lib/index.json');
      if (res.ok) {
        const listed = (await res.json()).files;
        if (Array.isArray(listed)) files = listed;
      }
    } catch {}
    const select = app.$('presetMaterial');
    if (select) {
      select.innerHTML += files.map(f => {
        const record = catalog && Object.hasOwn(catalog, f) ? catalog[f] : null,
          name = typeof record?.material?.name === 'string' ? record.material.name : f.replace('.json', '').replace(/_/g, ' ');
        return `<option value="${app.esc(f)}">${app.esc(name)}</option>`;
      }).join('');
    }
  };
  initPresets();

  // Name the example that is actually loaded: browsers (Firefox) may restore an earlier selection on reload.
  app.showPreset(app.defaultPreset);
  // Likewise for Current arrows: no result yet, so no current to draw, whatever state was restored.
  app.$('arrows').disabled = true;
  app.fill();
  globalThis.TE_APP_READY = true;
})(globalThis.TEApp);
