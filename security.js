/* Backup validation and HTML rendering boundary. No third-party runtime dependencies. */
(function (root) {
  'use strict';
  const MAX_BYTES = 2 * 1024 * 1024;
  const STATE_KEYS = ['hyplog.v1', 'strlog.v2', 'proladder.v1', 'trainer.together'];
  const SHELL_KEYS = ['trainer.shell.theme', 'trainer.shell.mod'];
  const BACKUP_KEYS = [...STATE_KEYS, ...SHELL_KEYS, ...STATE_KEYS.map(k => k + '.corrupt')];
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const record = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const bad = message => { throw new Error(message || 'This backup contains invalid data.'); };
  const bytes = text => new TextEncoder().encode(text).byteLength;
  const id = value => typeof value === 'string' && /^[A-Za-z0-9_.:@/+| -]{1,200}$/.test(value);
  const numeric = new Set(['date', 'startedAt', 'restEndsAt', 'weight', 'reps', 'rir', 'repLow', 'repHigh',
    'totalWeeks', 'currentWeek', 'stepIdx', 'vi', 'week', 'day', 'at', 'achieved', 'rest', 'barKg', 'bw', 'tmPct']);

  function bounded(value) {
    let nodes = 0;
    function visit(v, key, depth) {
      if (++nodes > 100000 || depth > 24) bad('This backup is too complex.');
      if (v === null) return;
      if (numeric.has(key) && (typeof v !== 'number' || !Number.isFinite(v))) bad();
      if (/^(id|exId|liftId|ladderId|mesoId|dayId)$/.test(key) && !id(v)) bad('An identifier in this backup is invalid.');
      if (typeof v === 'number') { if (!Number.isFinite(v) || Math.abs(v) > 1e15) bad(); return; }
      if (typeof v === 'boolean') return;
      if (typeof v === 'string') { if (v.length > 20000 || /\u0000/.test(v)) bad(); return; }
      if (Array.isArray(v)) {
        if (v.length > 20000) bad('This backup has too many records.');
        v.forEach(x => visit(x, '', depth + 1)); return;
      }
      if (!record(v) || Object.keys(v).length > 2000) bad();
      for (const k of Object.keys(v)) {
        if (['__proto__', 'prototype', 'constructor'].includes(k) || k.length > 200) bad('An object key in this backup is invalid.');
        visit(v[k], k, depth + 1);
      }
    }
    visit(value, '', 0);
    return value;
  }

  function section(value, key) {
    if (!STATE_KEYS.includes(key) || !record(value)) bad();
    bounded(value);
    const versions = key === 'hyplog.v1' ? [1] : [1, 2];
    if (own(value, 'v') && !versions.includes(value.v)) bad('This backup uses an unsupported version.');
    for (const k of ['settings', 'rung', 'placed', 'said', 'lifts', 'unlocked']) {
      if (own(value, k) && !record(value[k])) bad();
    }
    for (const k of ['history', 'exercises', 'mesos', 'bodylog', 'milestones', 'rirCal', 'advances', 'goals', 'tests', 'custom']) {
      if (own(value, k) && !(key === 'trainer.together' && k === 'custom' && value[k] === null) && !Array.isArray(value[k])) bad();
    }
    function session(s) {
      if (!record(s) || !id(s.id) || typeof s.name !== 'string' || !Array.isArray(s.entries)) bad('A session in this backup is invalid.');
      for (const e of s.entries) {
        if (!record(e) || !Array.isArray(e.sets) || !e.sets.every(record)) bad('A set in this backup is invalid.');
        if (key === 'hyplog.v1' && (!id(e.exId) || typeof e.name !== 'string')) bad();
        if (key === 'strlog.v2' && !id(e.liftId)) bad();
        if (key === 'proladder.v1' && !id(e.ladderId)) bad();
      }
    }
    if (value.history) value.history.forEach(session);
    if (value.active != null && key !== 'trainer.together') session(value.active);
    if (value.repeat != null && key !== 'trainer.together') {
      if (!record(value.repeat) || typeof value.repeat.name !== 'string') bad();
      if (key === 'hyplog.v1' && (!Array.isArray(value.repeat.items) || !value.repeat.items.every(x => Array.isArray(x) && id(x[0]) && typeof x[1] === 'number'))) bad();
      if (key === 'proladder.v1' && (!Array.isArray(value.repeat.ids) || !value.repeat.ids.every(id))) bad();
      if (key === 'strlog.v2' && value.repeat.lifts != null && (!Array.isArray(value.repeat.lifts) || !value.repeat.lifts.every(id))) bad();
    }
    if (value.exercises) for (const e of value.exercises) {
      if (!record(e) || !id(e.id) || typeof e.name !== 'string' || !Array.isArray(e.primary) ||
          !Array.isArray(e.secondary) || typeof e.equipment !== 'string' || !record(e.def)) bad('A custom exercise is invalid.');
    }
    if (key === 'proladder.v1' && value.custom) for (const c of value.custom) {
      if (!record(c) || !id(c.id) || typeof c.n !== 'string' || !Array.isArray(c.steps) || !c.steps.every(record)) bad('A custom ladder is invalid.');
    }
    return value;
  }

  function parseSection(text, key) {
    if (typeof text !== 'string' || bytes(text) > MAX_BYTES) bad('This backup is too large.');
    return section(JSON.parse(text), key);
  }

  function data(value) {
    if (!record(value) || Object.keys(value).length > BACKUP_KEYS.length) bad();
    const clean = Object.create(null);
    for (const k of Object.keys(value)) {
      if (!BACKUP_KEYS.includes(k) || typeof value[k] !== 'string') bad('This backup contains data from another app.');
      const v = value[k];
      if (bytes(v) > MAX_BYTES) bad('This backup is too large.');
      if (STATE_KEYS.includes(k)) parseSection(v, k);
      if (k === 'trainer.shell.theme' && !['system', 'light', 'dark'].includes(v)) bad();
      if (k === 'trainer.shell.mod' && !['lift', 'str', 'cal', 'mix'].includes(v)) bad();
      clean[k] = v;
    }
    if (bytes(JSON.stringify(clean)) > MAX_BYTES) bad('This backup is too large.');
    return clean;
  }

  function backup(text) {
    if (typeof text !== 'string' || bytes(text) > MAX_BYTES) bad('This backup is too large.');
    const value = JSON.parse(text);
    if (!record(value) || value.app !== 'milovancroton' || value.version !== 1) bad('This is not a supported Milo backup.');
    if (value.created != null && (typeof value.created !== 'string' || !Number.isFinite(Date.parse(value.created)))) bad();
    return {...value, data: data(value.data)};
  }

  function snapshot(storage) {
    const result = Object.create(null);
    for (const k of BACKUP_KEYS) { const v = storage.getItem(k); if (v !== null) result[k] = v; }
    return result;
  }

  function restore(storage, input, now = Date.now()) {
    const clean = data(input); // Validate every section before the first write.
    const before = snapshot(storage);
    const undo = Object.create(null);
    for (const k of STATE_KEYS.map(k => k + '.undo')) undo[k] = storage.getItem(k);
    // Reserve a durable recovery copy first. If it cannot fit, change no workout data.
    const recovery = JSON.stringify({at: now, data: before});
    storage.setItem('milo.before', recovery);
    try {
      for (const k of BACKUP_KEYS) {
        if (own(clean, k)) storage.setItem(k, clean[k]); else storage.removeItem(k);
      }
      for (const k of Object.keys(undo)) storage.removeItem(k);
    } catch (error) {
      // Release reserved space before restoring the original values.
      storage.removeItem('milo.before');
      let rolledBack = true;
      for (const [k, v] of Object.entries({...Object.fromEntries(BACKUP_KEYS.map(k => [k, null])), ...before, ...undo})) {
        try { if (v === null) storage.removeItem(k); else storage.setItem(k, v); } catch (_) { rolledBack = false; }
      }
      if (!rolledBack) {
        try { storage.setItem('milo.before', recovery); } catch (_) {}
        bad('Restore stopped. Some original data could not be put back; keep your backup and free browser storage before retrying.');
      }
      bad('Restore stopped. Your original workout data was kept.');
    }
  }

  function html(value) {
    // A final boundary for the existing template-based UI, including shadow roots.
    // Native template parsing is inert; executable elements and attributes are removed before insertion.
    const template = document.createElement('template');
    template.innerHTML = String(value);
    for (const el of template.content.querySelectorAll('*')) {
      if (['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'BASE', 'META', 'LINK', 'TEMPLATE', 'FOREIGNOBJECT', 'ANIMATE', 'SET'].includes(el.tagName.toUpperCase())) {
        el.remove(); continue;
      }
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction') el.removeAttribute(attr.name);
        if (['href', 'src', 'xlink:href', 'action'].includes(name)) {
          const url = attr.value.trim().replace(/[\u0000-\u0020]/g, '');
          if (/^(?:javascript|vbscript|data):/i.test(url) && !/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(url)) el.removeAttribute(attr.name);
        }
      }
      if (el.tagName === 'A' && el.getAttribute('target') === '_blank') el.setAttribute('rel', 'noopener noreferrer');
    }
    return template.innerHTML;
  }

  const api = Object.freeze({MAX_BYTES, STATE_KEYS, BACKUP_KEYS, section, parseSection, data, backup, snapshot, restore, html});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MiloSecurity = api;
})(typeof window === 'object' ? window : globalThis);
