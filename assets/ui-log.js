/* Session log and project history. Both are append-only, capped, and rendered as text (never markup).
   The log records what the application said and decided; the history records what the user changed and ran.
   Entries come from watching the status bar, badge and validation boxes, so the model code stays untouched. */
(function (app) {
  'use strict';
  if (!app || typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const MAX = 500;
  const logEntries = [], historyEntries = [];
  const pad = n => String(n).padStart(2, '0');
  const stamp = d => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  function render(listId, entry, replaceLast) {
    const ol = $(listId);
    if (!ol) return;
    const atEnd = ol.scrollTop + ol.clientHeight >= ol.scrollHeight - 24;
    const make = () => {
      const li = document.createElement('li');
      li.className = 'lv-' + entry.level;
      for (const [cls, text, tag] of [['time', stamp(entry.time), 'time'], ['cat', entry.cat, 'span'], ['msg', entry.msg, 'span']]) {
        const el = document.createElement(tag);
        el.className = cls;
        el.textContent = text;
        li.appendChild(el);
      }
      return li;
    };
    if (replaceLast && ol.lastElementChild) ol.replaceChild(make(), ol.lastElementChild);
    else {
      ol.appendChild(make());
      while (ol.children.length > MAX) ol.removeChild(ol.firstElementChild);
    }
    if (atEnd) ol.scrollTop = ol.scrollHeight;
  }

  // Progress lines (cycle counters) overwrite the previous progress line instead of flooding the log.
  app.log = function log(level, cat, msg, {progress = false} = {}) {
    const entry = {time: new Date(), level, cat, msg, progress};
    const replace = progress && logEntries.at(-1)?.progress;
    if (replace) logEntries[logEntries.length - 1] = entry;
    else logEntries.push(entry);
    while (logEntries.length > MAX) logEntries.shift();
    render('logList', entry, replace);
    const warn = logEntries.filter(e => e.level === 'warn' || e.level === 'error').length;
    const count = $('logCount');
    if (count) count.textContent = warn ? String(warn) : '';
  };
  app.history = function history(kind, msg) {
    const entry = {time: new Date(), level: 'info', cat: kind, msg};
    historyEntries.push(entry);
    while (historyEntries.length > MAX) historyEntries.shift();
    render('historyList', entry, false);
  };

  // ---- Sources -------------------------------------------------------------------------------
  const badge = () => $('badge');
  const levelNow = text => {
    if (/failed:/i.test(text)) return 'error';
    if (/did not converge|Sweep completed with \d+ unconverged/i.test(text)) return 'warn';
    const b = badge();
    if (!b) return 'info';
    if (b.classList.contains('error')) return 'error';
    if (b.classList.contains('warning') || /UNCONVERGED|STOPPED/.test(b.textContent)) return 'warn';
    if (app.worker) return 'info';
    if (/CONVERGED|COMPLETE/.test(b.textContent)) return 'ok';
    return 'info';
  };
  const isProgress = t => /^(Frequency \d+\/\d+: |.*Cycle \d+\/\d+ ·)/.test(t);
  // Run outcomes are recognized by how they start: several mention a "saved cycle" or an export, which
  // would otherwise file them under project.
  const category = t => /^Mesh applied/.test(t) ? 'mesh'
    : /^(Stopped by user|Calculation |Computed successfully|Sweep completed|Frequency \d+\/\d+|Periodic state not reached|Worker error|Unable to (start|decode|process|read))/.test(t) ? 'run'
    : /^Sweep map/.test(t) ? 'status'
    : /project|import|saved|ZIP|PDF|export/i.test(t) ? 'project' : app.worker ? 'run' : 'status';
  const setting = () => {
    const v = id => String($(id)?.value ?? '').trim();
    const mode = v('excitationMode') === 'sweep' ? 'AC sweep' : (app.config?.mode ?? v('mode')) === 'periodic' ? 'AC single frequency' : 'DC';
    return `${mode}${mode.startsWith('AC single') ? ` ${v('frequency')} Hz, ${v('samples')} steps/period` : ''} · mesh ${v('nx')} × ${v('ny')} · Bz ${v('magneticField')} T`;
  };

  let lastStatus = '';
  const onStatus = () => {
    const text = ($('status')?.textContent ?? '').trim();
    if (!text || text === lastStatus) return;
    lastStatus = text;
    if (/^Solving coupled/.test(text)) app.log('info', 'run', 'Run started: ' + setting());
    app.log(levelNow(text), category(text), text, {progress: isProgress(text)});
  };

  let lastBadge = '', runActive = false;
  const onBadge = () => {
    const text = (badge()?.textContent ?? '').trim();
    if (!text || text === lastBadge) return;
    lastBadge = text;
    if (text === 'COMPUTING') {
      runActive = true;
    } else if (runActive) {
      runActive = false;
      if (/^(CONVERGED|UNCONVERGED|STOPPED|PREVIOUS RESULT|SWEEP|ERROR)/.test(text)) {
        app.history('Run', `${text}${$('elapsed')?.textContent ? ' · ' + $('elapsed').textContent.trim() : ''}`);
      }
    }
  };

  // Debounce validation boxes while the user is actively typing in a text/number input so intermediate
  // keystrokes do not inflate the warning/error badge; flush immediately on commit (change / focusout).
  const boxTimers = new Map(), lastBoxLogged = new Map();
  const flushBox = (id, level, intro) => {
    const timer = boxTimers.get(id);
    if (timer) { clearTimeout(timer); boxTimers.delete(id); }
    const box = $(id);
    if (!box || box.hidden) {
      lastBoxLogged.delete(id);
      return;
    }
    const items = [...box.querySelectorAll('li')].map(li => li.textContent.trim());
    const msg = intro + (items.length ? items.slice(0, 3).join(' | ') + (items.length > 3 ? ` (+${items.length - 3} more)` : '') : '');
    if (lastBoxLogged.get(id) === msg) return;
    lastBoxLogged.set(id, msg);
    app.log(level, 'validation', msg);
  };
  const onBox = (id, level, intro) => () => {
    const box = $(id);
    if (!box || box.hidden) {
      const timer = boxTimers.get(id);
      if (timer) { clearTimeout(timer); boxTimers.delete(id); }
      lastBoxLogged.delete(id);
      return;
    }
    if (document.activeElement?.tagName === 'INPUT' && !/^(checkbox|color|file|range)$/i.test(document.activeElement.type ?? '')) {
      const prev = boxTimers.get(id);
      if (prev) clearTimeout(prev);
      boxTimers.set(id, setTimeout(() => flushBox(id, level, intro), 450));
    } else {
      flushBox(id, level, intro);
    }
  };
  const flushAllBoxes = () => {
    if (boxTimers.has('validationSummary')) flushBox('validationSummary', 'error', 'Invalid input: ');
    if (boxTimers.has('validationWarnings')) flushBox('validationWarnings', 'warn', 'Check: ');
  };
  document.addEventListener('change', flushAllBoxes);
  document.addEventListener('focusout', flushAllBoxes);

  const observe = (el, fn) => { if (el && globalThis.MutationObserver) new MutationObserver(fn).observe(el, {childList: true, characterData: true, subtree: true}); };
  observe($('status'), onStatus);
  observe(badge(), onBadge);
  observe($('validationSummary'), onBox('validationSummary', 'error', 'Invalid input: '));
  observe($('validationWarnings'), onBox('validationWarnings', 'warn', 'Check: '));

  // Parameter edits become history entries as they are committed.
  const describe = el => {
    const label = el.labels?.[0] ?? el.closest('label');
    let name = el.id || el.dataset.key || 'field', unit = '';
    if (label) {
      const c = label.cloneNode(true);
      unit = c.querySelector('span')?.textContent.trim() ?? '';
      c.querySelectorAll('span,.tip,.tt,input,select').forEach(n => n.remove());
      name = c.textContent.trim() || name;
    }
    const value = el.tagName === 'SELECT' ? (el.selectedOptions?.[0]?.textContent ?? el.value).trim() : String(el.value).trim();
    const card = el.closest('[data-material]'), side = el.closest('[data-side]'), electrode = el.closest('.electrode');
    const electrodeName = electrode?.querySelector('h3')?.textContent.trim().toLowerCase();
    const where = card ? (card.querySelector('[data-key="name"]')?.value || 'Material') + ' · '
      : side ? side.dataset.side + ' side · '
      : electrodeName ? electrodeName + ' · ' : '';
    return `${where}${name} = ${value}${unit && el.tagName !== 'SELECT' ? ' ' + unit : ''}`;
  };
  document.addEventListener('change', e => {
    const el = e.target;
    if (!el?.closest || !el.closest('.settings') || el.type === 'file') return;
    app.history('Edit', describe(el));
  });

  // ---- Drawer --------------------------------------------------------------------------------
  const drawer = $('logDrawer'), toggle = $('logToggle');
  const setOpen = open => {
    if (!drawer) return;
    drawer.hidden = !open;
    toggle?.setAttribute('aria-expanded', String(open));
    if (open) for (const id of ['logList', 'historyList']) { const ol = $(id); if (ol) ol.scrollTop = ol.scrollHeight; }
  };
  toggle?.addEventListener('click', () => setOpen(drawer.hidden));
  $('logClose')?.addEventListener('click', () => { setOpen(false); toggle?.focus(); });
  document.querySelectorAll('[data-pane]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-pane]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('logList').hidden = b.dataset.pane !== 'log';
    $('historyList').hidden = b.dataset.pane !== 'history';
    $('logLevel').hidden = b.dataset.pane !== 'log';
  }));
  $('logLevel')?.addEventListener('change', () => { $('logList').dataset.filter = $('logLevel').value; });

  const asText = () => {
    const f = e => `${e.time.toISOString()}  ${e.cat.padEnd(10)} ${e.level.toUpperCase().padEnd(5)} ${e.msg}`;
    return 'Thermoelectric Lab 3D session log\n' + logEntries.map(f).join('\n') + '\n\nProject history\n' + historyEntries.map(f).join('\n') + '\n';
  };
  $('logCopy')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(asText()); app.log('ok', 'log', `Copied ${logEntries.length} log lines and ${historyEntries.length} history lines to the clipboard.`); }
    catch { app.log('warn', 'log', 'The browser did not allow copying; use Export instead.'); }
  });
  $('logExport')?.addEventListener('click', () => {
    if (typeof app.download === 'function') app.download('thermoelectric-session-log.txt', asText(), 'text/plain');
    app.log('info', 'log', 'Session log exported.');
  });
  document.addEventListener('keydown', e => {
    if (app.busy) return;
    if (e.key === 'Escape' && !e.defaultPrevented && drawer && !drawer.hidden && !$('shortcutHelp')?.open) {
      setOpen(false);
      toggle?.focus();
      return;
    }
    if (e.ctrlKey || e.altKey || e.metaKey || !(e.key === 'l' || e.key === 'L')) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName ?? '') || $('shortcutHelp')?.open) return;
    setOpen(drawer?.hidden ?? false);
  });

  app.log('info', 'session', 'Session started. Example: ' + ($('preset')?.selectedOptions?.[0]?.textContent ?? 'default') + '.');
  lastStatus = ($('status')?.textContent ?? '').trim();
  lastBadge = (badge()?.textContent ?? '').trim();
})(globalThis.TEApp);
