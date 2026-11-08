/* Apply before CSS loads to avoid a theme flash; local storage is optional. */
(function () {
  'use strict';
  const root = document.documentElement;
  const themeKey = 'TE_3D_theme';

  // Read URL query params if provided (for screenshots, deep links, testing)
  const urlParams = new URLSearchParams(window.location.search);
  const paramTheme = urlParams.get('theme');

  const system = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: light)') : null;
  let savedTheme;
  try { savedTheme = localStorage.getItem(themeKey); } catch {}
  const explicitTheme = savedTheme === 'light' || savedTheme === 'dark';
  
  const activeTheme = (paramTheme === 'light' || paramTheme === 'dark')
    ? paramTheme
    : (explicitTheme ? savedTheme : (system?.matches ? 'light' : 'dark'));

  root.dataset.theme = activeTheme;

  function syncControls() {
    const button = document.getElementById('themeToggle');
    if (button) {
      const light = root.dataset.theme === 'light';
      button.setAttribute('aria-pressed', String(light));
      button.title = light ? 'Switch to dark mode' : 'Switch to light mode';
    }
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    syncControls();
    requestAnimationFrame(() => {
      const app = globalThis.TEApp;
      if (!app || !globalThis.TE_APP_READY) return;
      app.drawGeometry(); app.drawResults(); app.drawProfile(); app.drawBode();
    });
  }

  globalThis.TETheme = {
    colors() {
      const css = getComputedStyle(root), get = name => css.getPropertyValue('--' + name).trim();
      return {
        text: get('plot-text'),
        grid: get('plot-grid'),
        line: get('plot-line'),
        point: get('plot-point'),
        background: get('panel'),
        source: get('contact-source'),
        sink: get('contact-sink'),
        halo: get('contact-halo'),
        mesh: get('mesh-line')
      };
    },
    applyTheme
  };

  document.addEventListener('DOMContentLoaded', () => {
    syncControls();
    
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = root.dataset.theme === 'light' ? 'dark' : 'light';
        try { localStorage.setItem(themeKey, nextTheme); } catch {}
        applyTheme(nextTheme);
      });
    }

    // Deep link parameters: ?tab=geometry&run=1
    const targetTab = urlParams.get('tab');
    const shouldRun = urlParams.get('run');
    if (targetTab || shouldRun) {
      const checkReady = setInterval(() => {
        if (globalThis.TE_APP_READY && globalThis.TEApp && globalThis.TE) {
          clearInterval(checkReady);
          if (shouldRun === '1') {
            try {
              const cfg = globalThis.TEApp.read();
              const result = globalThis.TE.run2D(cfg);
              globalThis.TEApp.accept(result);
            } catch (err) {
              if (typeof globalThis.TEApp.runSimulation === 'function') {
                globalThis.TEApp.runSimulation();
              }
            }
          }
          if (targetTab && typeof globalThis.TEApp.tab === 'function') {
            globalThis.TEApp.tab(targetTab);
          }
        }
      }, 50);
    }
  });

  system?.addEventListener?.('change', event => {
    if (!paramTheme && !localStorage.getItem(themeKey)) applyTheme(event.matches ? 'light' : 'dark');
  });
})();
