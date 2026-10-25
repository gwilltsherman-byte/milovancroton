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
    if (own(value, 'parked') && key !== 'trainer.together') {
      if (!Array.isArray(value.parked)) bad();
      value.parked.forEach(session);
    }
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

  /* ---- Backups with a passphrase ----
     PBKDF2-SHA256 (600,000 iterations, a random 16-byte salt) turns the passphrase into an AES-256-GCM key, and each
     backup gets a random 12-byte IV. GCM checks what it decrypts, so a wrong passphrase or a changed file fails
     instead of giving garbage. The text inside is an ordinary backup and goes through backup() like any other. */
  const KDF_ITER = 600000;
  const SEALED_BYTES = Math.ceil(MAX_BYTES * 4 / 3) + 4096;
  function subtle() {
    const c = typeof crypto === 'object' ? crypto : globalThis.crypto;
    if (!c || !c.subtle || !c.getRandomValues) bad('This browser can’t encrypt backups. Save it without a passphrase.');
    return c;
  }
  function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { const t = atob(s), u8 = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u8[i] = t.charCodeAt(i); return u8; }
  async function passKey(pass, salt, iter, use) {
    const c = subtle();
    const base = await c.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
    return c.subtle.deriveKey({name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter}, base, {name: 'AES-GCM', length: 256}, false, [use]);
  }
  async function seal(text, pass) {
    if (typeof text !== 'string' || bytes(text) > MAX_BYTES) bad('This backup is too large.');
    if (typeof pass !== 'string' || !pass) bad('Enter a passphrase.');
    const c = subtle(), salt = c.getRandomValues(new Uint8Array(16)), iv = c.getRandomValues(new Uint8Array(12));
    const k = await passKey(pass, salt, KDF_ITER, 'encrypt');
    const data = new Uint8Array(await c.subtle.encrypt({name: 'AES-GCM', iv}, k, new TextEncoder().encode(text)));
    return JSON.stringify({app: 'milovancroton', version: 1,
      sealed: {v: 1, kdf: 'PBKDF2-SHA256', iter: KDF_ITER, salt: b64(salt), cipher: 'AES-256-GCM', iv: b64(iv), data: b64(data)}});
  }
  /* Whether text is a backup with a passphrase (a quick look: unseal checks it properly). */
  function sealed(text) {
    if (typeof text !== 'string' || bytes(text) > SEALED_BYTES) return false;
    try { const v = JSON.parse(text); return record(v) && v.app === 'milovancroton' && record(v.sealed); } catch (e) { return false; }
  }
  async function unseal(text, pass) {
    if (typeof text !== 'string' || bytes(text) > SEALED_BYTES) bad('This backup is too large.');
    let v = null; try { v = JSON.parse(text); } catch (e) { bad('This is not a supported Milo backup.'); }
    const s = record(v) && v.app === 'milovancroton' && v.version === 1 ? v.sealed : null;
    const b64ok = x => typeof x === 'string' && /^[A-Za-z0-9+/]*={0,2}$/.test(x);
    if (!record(s) || s.v !== 1 || s.kdf !== 'PBKDF2-SHA256' || s.cipher !== 'AES-256-GCM' || !Number.isInteger(s.iter) ||
        s.iter < 100000 || s.iter > 5000000 || !b64ok(s.salt) || !b64ok(s.iv) || !b64ok(s.data)) bad('This encrypted backup is damaged, or from a newer Milo.');
    const salt = unb64(s.salt), iv = unb64(s.iv), data = unb64(s.data);
    if (salt.length !== 16 || iv.length !== 12 || data.length < 17) bad('This encrypted backup is damaged, or from a newer Milo.');
    if (typeof pass !== 'string' || !pass) bad('Enter the backup’s passphrase.');
    let out;
    try { out = await subtle().subtle.decrypt({name: 'AES-GCM', iv}, await passKey(pass, salt, s.iter, 'decrypt'), data); }
    catch (e) { bad('That passphrase doesn’t open this backup. Check it and try again.'); }
    return new TextDecoder().decode(out);
  }

  /* ---- Erase everything ----
     Every key Milo keeps: the four sections, their undo and unreadable copies, the shell's notes (milo.*) and the
     app-wide choices (trainer.shell.*). Keys of other apps on the same web address are left alone. */
  const MINE = /^(?:(?:hyplog|strlog|proladder)\.[A-Za-z0-9_.]+|trainer\.together(?:\.[A-Za-z0-9_.]+)?|trainer\.shell\.[A-Za-z0-9_.]+|milo\.[A-Za-z0-9_.]+)$/;
  function owned(key) { return typeof key === 'string' && MINE.test(key); }
  function erase(storage) {
    const keys = [];
    for (let i = 0; i < storage.length; i++) { const k = storage.key(i); if (owned(k)) keys.push(k); }
    keys.forEach(k => storage.removeItem(k));
    return keys;
  }

  /* ---- Workouts from other apps ----
     Strong and Hevy export one row per set as CSV. The file is read as text and checked field by field: quoted
     fields as in RFC 4180, a size limit, and numbers only where numbers belong. Nothing here touches storage; the
     shell maps the exercises and each section adds the sessions. */
  const IMPORT_BYTES = 8 * 1024 * 1024;
  function csv(text) {
    if (typeof text !== 'string') bad('That file couldn’t be read.');
    if (bytes(text) > IMPORT_BYTES) bad('That file is too large (maximum 8 MB).');
    text = text.replace(/^﻿/, '');
    // the delimiter: a comma, or a semicolon when the header has more of those (Strong on some phones)
    let commas = 0, semis = 0;
    for (let i = 0, q = false; i < text.length; i++) {
      const c = text[i];
      if (c === '"') q = !q; else if (!q && (c === '\n' || c === '\r')) break;
      else if (!q && c === ',') commas++; else if (!q && c === ';') semis++;
    }
    const d = semis > commas ? ';' : ',', rows = [];
    let row = [], field = '', quoted = false, was = false;
    const endField = () => {
      if (field.length > 10000) bad('A field in this file is too long.');
      row.push(field); field = ''; was = false;
      if (row.length > 100) bad('This file has too many columns.');
    };
    const endRow = () => {
      endField();
      if (!(row.length === 1 && row[0] === '')) { rows.push(row); if (rows.length > 200000) bad('This file has too many rows.'); }
      row = [];
    };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; was = true; } }
        else field += c;
      } else if (c === '"' && field === '' && !was) quoted = true;
      else if (c === d) endField();
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; endRow(); }
      else field += c;
    }
    if (quoted) bad('A quoted field in this file never ends.');
    if (field !== '' || row.length) endRow();
    return rows;
  }
  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  /* A local date and time: 2025-01-30 12:34:56 pm (Strong; older exports 2024-01-15 07:30:00, and a narrow space
     before pm on some phones) or 30 Jan 2025, 12:34 (Hevy). */
  function when(v) {
    v = String(v).replace(/[   ]/g, ' ');
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?: ?([ap])\.?m\.?)?)?/i.exec(v), y, mo, da, h = 12, mi = 0, se = 0, ap = null;
    if (m) { y = +m[1]; mo = +m[2] - 1; da = +m[3]; if (m[4] != null) { h = +m[4]; mi = +m[5]; se = +(m[6] || 0); ap = m[7]; } }
    else if ((m = /^(\d{1,2}) ([A-Za-z]{3})[A-Za-z]*\.? (\d{4}),? (\d{1,2}):(\d{2})(?: ?([ap])\.?m\.?)?/i.exec(v))) {
      y = +m[3]; mo = MONTHS.indexOf(m[2].toLowerCase()); da = +m[1]; h = +m[4]; mi = +m[5]; ap = m[6];
    } else return null;
    if (ap) { if (h < 1 || h > 12) return null; h = h % 12 + (ap.toLowerCase() === 'p' ? 12 : 0); }
    const t = new Date(y, mo, da, h, mi, se);
    return mo >= 0 && y >= 1990 && y <= 2100 && t.getDate() === da && h < 24 && mi < 60 ? t.getTime() : null;
  }
  /* Strong's workout length: 1h 5m, 45m or 30s. */
  function span(v) {
    let s = 0, any = false; String(v).replace(/(\d+)\s*([hms])/gi, (_, n, u) => { any = true; s += +n * ({h: 3600, m: 60, s: 1})[u.toLowerCase()]; return ''; });
    return any ? s : null;
  }
  function workouts(text) {
    const rows = csv(text);
    if (rows.length < 2) bad('This file has no workouts in it.');
    const head = rows[0].map(h => h.trim().toLowerCase());
    const col = (...names) => { for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i; } return -1; };
    const hevy = col('exercise_title') >= 0 && col('start_time') >= 0;
    const strong = !hevy && col('exercise name') >= 0 && col('date') >= 0 && col('set order') >= 0;
    if (!hevy && !strong) bad('This doesn’t look like a Strong or Hevy export. Export a CSV from either app and pick that file.');
    const C = hevy ? {
      date: col('start_time'), end: col('end_time'), name: col('title'), note: col('description'), ex: col('exercise_title'), exNote: col('exercise_notes'),
      order: -1, type: col('set_type'), w: col('weight_kg', 'weight_lbs'), unit: -1, reps: col('reps'), secs: col('duration_seconds'), rpe: col('rpe'), dur: -1, durSec: -1
    } : {
      date: col('date'), end: -1, name: col('workout name'), note: col('workout notes'), ex: col('exercise name'), exNote: col('notes'),
      order: col('set order'), type: -1, w: col('weight', 'weight (kg)', 'weight (lbs)', 'weight (lb)'), unit: col('weight unit'), reps: col('reps'),
      secs: col('seconds', 'duration (sec)'), rpe: col('rpe'), dur: col('duration', 'workout duration'), durSec: col('duration (sec)')
    };
    const fileUnit = hevy ? (head.includes('weight_lbs') ? 'lb' : 'kg') : head.includes('weight (kg)') ? 'kg' : head.includes('weight (lbs)') || head.includes('weight (lb)') ? 'lb' : null;
    const txt = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
    const sessions = new Map();
    let sets = 0;
    rows.slice(1).forEach((r, k) => {
      const at = k + 2, get = i => i >= 0 && i < r.length ? r[i].trim() : '';
      const num = (i, label, lo, hi) => {
        const v = get(i); if (v === '') return null;
        if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(v)) bad('Row ' + at + ': “' + txt(v, 24) + '” under ' + label + ' is not a number.');
        const n = Number(v.replace(',', '.'));
        if (!(n >= lo && n <= hi)) bad('Row ' + at + ': ' + label + ' ' + n + ' is out of range.');
        return n;
      };
      if (r.every(x => x.trim() === '')) return;
      const order = get(C.order).toLowerCase();
      if (!hevy && (order === 'rest timer' || order === 'note')) return;     // Strong's rest timers and notes are not sets
      const ex = txt(get(C.ex), 120); if (!ex) return;
      const start = when(get(C.date)); if (start == null) bad('Row ' + at + ': the date “' + txt(get(C.date), 30) + '” is not one Milo can read.');
      const end = C.end >= 0 && get(C.end) ? when(get(C.end)) : null;
      const w = num(C.w, 'weight', -2000, 5000), reps = num(C.reps, 'reps', 0, 1000), secs = num(C.secs, 'seconds', 0, 86400), rpe = num(C.rpe, 'RPE', 0, 10);
      if (!(reps > 0) && !(secs > 0)) return;                               // distance only, or an empty set
      const ru = get(C.unit).toLowerCase(), u = /^lbs?$/.test(ru) ? 'lb' : ru === 'kg' ? 'kg' : fileUnit;
      const st = hevy ? get(C.type).toLowerCase() : order;
      // Hevy: normal, warmup, dropset, failure; Strong marks the set order W, D or F
      const type = /^warm/.test(st) || st === 'w' ? 'warmup' : /^drop/.test(st) || st === 'd' ? 'drop' : st === 'failure' || st === 'f' ? 'failure' : 'work';
      const key = hevy ? get(C.name) + '|' + get(C.date) + '|' + get(C.end) : get(C.date) + '|' + get(C.name);
      let s = sessions.get(key);
      if (!s) {
        if (sessions.size >= 10000) bad('This file has too many workouts.');
        const dur = C.durSec >= 0 ? num(C.durSec, 'duration', 0, 172800) : C.dur >= 0 ? span(get(C.dur)) : null;
        s = {start, end: end != null && end >= start ? end : null, name: txt(get(C.name), 120) || 'Workout', note: txt(get(C.note), 2000),
          durationSec: end != null && end >= start ? Math.round((end - start) / 1000) : dur, entries: new Map()};
        sessions.set(key, s);
      }
      if (!s.note) s.note = txt(get(C.note), 2000);                          // Strong repeats the workout's notes on each row
      let e = s.entries.get(ex.toLowerCase());
      if (!e) { e = {name: ex, note: '', sets: []}; s.entries.set(ex.toLowerCase(), e); }
      const n = txt(get(C.exNote), 2000); if (n && !e.note.includes(n)) e.note = e.note ? (e.note + ' · ' + n).slice(0, 2000) : n;
      if (e.sets.length >= 500) bad('Row ' + at + ': too many sets of one exercise in one workout.');
      e.sets.push({type, w, u, reps: reps > 0 ? Math.round(reps) : null, secs: secs > 0 ? Math.round(secs) : null, rpe: rpe > 0 ? rpe : null});
      sets++;
    });
    const list = [...sessions.values()].map(s => Object.assign(s, {entries: [...s.entries.values()]})).sort((a, b) => a.start - b.start);
    if (!list.length) bad('This file has no sets with reps or seconds in it.');
    const counts = new Map();
    list.forEach(s => s.entries.forEach(e => { const c = counts.get(e.name.toLowerCase()) || {name: e.name, sets: 0}; c.sets += e.sets.length; counts.set(e.name.toLowerCase(), c); }));
    return {app: hevy ? 'hevy' : 'strong', unit: fileUnit, unitKnown: !!fileUnit || C.unit >= 0, sessions: list, sets, exercises: [...counts.values()]};
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

  const api = Object.freeze({MAX_BYTES, STATE_KEYS, BACKUP_KEYS, section, parseSection, data, backup, snapshot, restore, html,
    KDF_ITER, SEALED_BYTES, seal, sealed, unseal, owned, erase, IMPORT_BYTES, csv, workouts});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MiloSecurity = api;
})(typeof window === 'object' ? window : globalThis);
