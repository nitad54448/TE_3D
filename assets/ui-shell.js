/* Workbench shell: workflow-rail summaries, "changes not applied" flag, keyboard shortcuts.
   Loaded last; it only reads the form and wraps TEApp.validateUI, so the model code is untouched. */
(function (app) {
  'use strict';
  if (!app || typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const val = id => String($(id)?.value ?? '').trim();
  const set = (name, text) => {
    const el = document.querySelector(`[data-summary="${name}"]`);
    if (el && el.textContent !== text) el.textContent = text;
  };

  app.updateShell = function updateShell() {
    const mats = document.querySelectorAll('[data-material]').length;
    set('materials', mats ? `${mats} defined · 300 K` : '');
    set('geometry', val('nx') && val('ny') ? `${val('nx')} × ${val('ny')} · ${val('lx')} × ${val('ly')} mm` : '');
    const mode = {periodic: 'AC', sweep: 'AC sweep', steady: 'DC'}[val('excitationMode')] ?? '';
    set('boundaries', mode ? `${mode} · Bz ${val('magneticField') || 0} T` : '');
    set('solver', $('solverMethod')?.textContent.trim() ?? '');
    const state = $('badge')?.textContent.trim().toLowerCase() ?? '';
    set('results', !app.result ? 'no result yet' : (!state || state === 'ready') ? 'result shown' : state);
  };

  // A pending mesh edit is shown on the rail until it is applied (Apply mesh, Run or Save apply it).
  const validate = app.validateUI;
  app.validateUI = function validateUI(...args) {
    const ok = validate.apply(this, args);
    const pending = Boolean($('applyGrid')?.classList.contains('mesh-pending'));
    $('pendingBadge').hidden = !pending;
    document.documentElement.toggleAttribute('data-mesh-pending', pending);
    app.updateShell();
    return ok;
  };

  const observe = id => {
    const el = $(id);
    if (el && globalThis.MutationObserver) new MutationObserver(() => app.updateShell()).observe(el, {childList: true, characterData: true, subtree: true});
  };
  observe('badge');
  observe('solverMethod');
  observe('cycleMetric'); // changes whenever a result is displayed or cleared
  document.addEventListener('change', e => { if (e.target?.id === 'excitationMode') app.updateShell(); });

  // Vertical tablist: Up/Down move between steps (Left/Right are handled in app.js).
  const tabs = () => [...document.querySelectorAll('[role=tab]')];
  document.querySelector('.tabs')?.addEventListener('keydown', e => {
    const all = tabs(), i = all.indexOf(document.activeElement);
    if (i < 0 || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const next = all[(i + (e.key === 'ArrowDown' ? 1 : all.length - 1)) % all.length];
    app.tab(next.dataset.tab);
    next.focus();
  });

  const typing = () => /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName ?? '');
  const help = $('shortcutHelp');
  $('helpButton')?.addEventListener('click', () => help?.showModal?.());
  document.addEventListener('keydown', e => {
    if (help?.open) return;
    if (e.altKey && !e.ctrlKey && !e.metaKey && /^[1-5]$/.test(e.key)) {
      e.preventDefault();
      const tab = tabs()[Number(e.key) - 1];
      if (tab) { app.tab(tab.dataset.tab); tab.focus(); }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const run = $('run');
      if (run && !run.disabled && !run.hidden) { e.preventDefault(); run.click(); }
    } else if (!e.ctrlKey && !e.altKey && !e.metaKey && !typing()) {
      if (e.key === 't' || e.key === 'T') $('themeToggle')?.click();
      else if (e.key === '?') help?.showModal?.();
    }
  });

  app.updateShell();
})(globalThis.TEApp);
