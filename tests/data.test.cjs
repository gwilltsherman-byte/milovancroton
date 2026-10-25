const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const security = require('../security.js');

// Your data (YOUR DATA in app.js) run from app.js itself, on top of the shared engine it uses (Day, Lift, SAME_LIFT).
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const slice = (a, b) => { const i = app.indexOf(a); assert.ok(i >= 0, a); const j = app.indexOf(b, i); assert.ok(j > i, b); return app.slice(i, j); };
const ENGINE = slice('/* ==================== ONE CHOICE FOR THE WHOLE APP', '/* ==================== TAKE BACK ====================');
const DATA = slice('/* ==================== YOUR DATA ====================', '/* ==================== YOUR DATA ON SCREEN');
function load() {
  const store = new Map();
  const localStorage = {getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k)};
  const ctx = {window: {}, localStorage, console, Date, Math, JSON, TextEncoder};
  vm.createContext(ctx);
  vm.runInContext(ENGINE, ctx, {filename: 'app.js:engine'});
  for (const k of ['Prefs', 'Lift', 'Num', 'Day', 'Kit', 'Body', 'SAME_LIFT']) ctx[k] = ctx.window[k];
  vm.runInContext(DATA, ctx, {filename: 'app.js:your-data'});
  return ctx.window;
}
const W0 = load(), {Day, Lift} = W0;
// what MiloData gives, as plain values of this realm, so deep equality compares contents
const plain = v => v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v;
const D = new Proxy(W0.MiloData, {get: (t, k) => typeof t[k] === 'function' ? (...a) => plain(t[k](...a)) : plain(t[k])});
// Muscle's exercise catalogue as the hub's catalog() gives it (id, name, equipment), from RAW_EX in app.js
const RAW = vm.runInNewContext('(' + slice('const RAW_EX = [', '];').replace('const RAW_EX = ', '') + '])');
const CATALOGUE = RAW.map(r => ({id: r[0], name: r[1], equipment: r[2]}));
const at = (y, m, d, h = 18, mi = 0) => new Date(y, m - 1, d, h, mi).getTime();

/* ---- every set as a spreadsheet ---- */
const S = {
  lift: {history: [{id: 'm1', name: 'Push, heavy', date: at(2026, 10, 20), note: '=1+1', entries: [
    {exId: 'barbell-bench', name: 'Barbell Bench Press', note: 'Felt "easy"', sets: [
      {type: 'warmup', weight: 40, reps: 10, rir: null, done: true},
      {type: 'work', weight: 80, reps: 8, rir: 2, done: true, assumed: true},
      {type: 'work', weight: 80, reps: 7, rir: 1, done: true, tag: 'Drop set', segments: [{weight: 60, reps: 6}, {weight: null, reps: null}]},
      {type: 'work', weight: 85, reps: 5, rir: 1, done: false}]},
    {exId: 'plank', name: 'Plank', sets: [{type: 'work', weight: null, reps: 45, rir: 2, done: true}]}]}]},
  str: {history: [{id: 's1', name: 'Day A', date: at(2026, 10, 18), entries: [{liftId: 'squat', vi: 0, sets: [
    {kind: 'warm', w: 60, reps: 5, rpe: null, done: true}, {kind: 'top', w: 120, reps: 3, rpe: 8.5, ra: true, done: true}, {kind: 'bo', w: 100, reps: 5, rpe: 7, done: true}]}]}]},
  cal: {history: [{id: 'c1', name: 'Pull', date: at(2026, 10, 22), entries: [
    {ladderId: 'pull', stepIdx: 6, kind: 'reps', setup: {load: 10}, sets: [{v: 5, rir: 2, done: true}, {v: 4, rir: 1, done: false}]},
    {ladderId: 'pull', stepIdx: 3, kind: 'reps', setup: {band: 'Red, 2 cm', anchor: ''}, sets: [{v: 8, rir: 1, done: true}]},
    {ladderId: 'core', stepIdx: 1, kind: 'hold', sets: [{v: 30, rir: null, done: true}]}]}]},
};
const names = {str: (id, vi) => ({squat: 'Back Squat'})[id], cal: (id, i) => ({'pull|6': 'Weighted pull-up', 'pull|3': 'Band-assisted pull-up', 'core|1': 'Hollow hold'})[id + '|' + i]};

test('the spreadsheet has one row per ticked set, oldest first, in kg and lb', () => {
  const rows = D.rows(S, names);
  assert.deepEqual(D.HEAD, ['date', 'section', 'session', 'exercise', 'set type', 'weight kg', 'weight lb', 'reps or seconds', 'RIR or RPE', 'assumed', 'notes']);
  assert.equal(rows.length, 3 + 5 + 3);   // Strength 3, Muscle 4 sets and a drop step (unticked left out), Ladder 3
  assert.deepEqual(rows.map(r => r[1]), ['Strength', 'Strength', 'Strength', 'Muscle', 'Muscle', 'Muscle', 'Muscle', 'Muscle', 'Ladder', 'Ladder', 'Ladder']);
  assert.deepEqual(rows[1], ['2026-10-18 18:00', 'Strength', 'Day A', 'Back Squat', 'top set', 120, 264.55, 3, 'RPE 8.5', 'yes', '']);
  assert.deepEqual(rows[2].slice(4, 9), ['back-off', 100, 220.46, 5, 'RPE 7']);   // Strength keeps back-off sets as 'bo'
  assert.deepEqual(rows[3].slice(3, 11), ['Barbell Bench Press', 'warm-up', 40, 88.18, 10, '', 'no', '=1+1 · Felt "easy"']);
  assert.deepEqual(rows[4].slice(4, 10), ['work', 80, 176.37, 8, 'RIR 2', 'yes']);
  assert.deepEqual(rows[5].slice(4, 8), ['drop set', 80, 176.37, 7]);
  assert.deepEqual(rows[6].slice(4, 11), ['drop', 60, 132.28, 6, '', 'no', '']);
  assert.deepEqual(rows[7].slice(3, 9), ['Plank', 'hold', '', '', 45, 'RIR 2']);
  assert.deepEqual(rows[8].slice(3, 9), ['Weighted pull-up', 'work', 10, 22.05, 5, 'RIR 2']);
  assert.deepEqual(rows[9].slice(3, 11), ['Band-assisted pull-up', 'work', '', '', 8, 'RIR 1', 'no', 'band Red, 2 cm']);
  assert.deepEqual(rows[10].slice(3, 9), ['Hollow hold', 'hold', '', '', 30, '']);
});

test('mini-sets are named by their set, and Ladder sets carry the set-up each was done with', () => {
  const h = (m, entries) => ({[m]: {history: [{id: m, name: 'X', date: at(2026, 10, 20), entries}]}});
  const rp = D.rows(h('lift', [{exId: 'leg-extension', name: 'Leg Extension', sets: [
    {type: 'work', weight: 50, reps: 12, rir: 0, done: true, tag: 'Rest-pause', segments: [{weight: 50, reps: 4}, {weight: 50, reps: 3}]},
    {type: 'work', weight: 50, reps: 10, rir: 0, done: true, tag: 'Drop set', segments: [{weight: 35, reps: 8}]},
    {type: 'work', weight: 50, reps: 10, rir: 0, done: true, segments: [{weight: 35, reps: 6}]}]}]), names);
  assert.deepEqual(rp.map(r => [r[4], r[5], r[7]]), [['rest-pause', 50, 12], ['rest-pause', 50, 4], ['rest-pause', 50, 3], ['drop set', 50, 10], ['drop', 35, 8], ['work', 50, 10], ['drop', 35, 6]]);
  // the load changed between sets, and one set's band was corrected in history: each row says what that set used
  const lad = D.rows(h('cal', [{ladderId: 'pull', stepIdx: 6, kind: 'reps', setup: {load: 12.5, band: 'Red'}, sets: [
    {v: 5, rir: 2, done: true, setup: {load: 10, band: 'Red'}}, {v: 4, rir: 1, done: true, setup: {load: 12.5, band: 'Red'}},
    {v: 3, rir: 0, done: true, setup: {load: 12.5, band: 'Green'}}, {v: 3, rir: 0, done: true}]}]), names);
  assert.deepEqual(lad.map(r => [r[5], r[7], r[10]]), [[10, 5, 'band Red'], [12.5, 4, ''], [12.5, 3, 'band Green'], [12.5, 3, 'band Red']]);
});

test('the CSV file quotes what needs it, defuses formulas and opens as UTF-8', () => {
  const text = D.csv(S, names);
  assert.ok(text.startsWith('﻿date,section,session,exercise,set type,weight kg,weight lb,reps or seconds,RIR or RPE,assumed,notes\r\n'));
  assert.ok(text.endsWith('\r\n') && !/[^\r]\n/.test(text));
  const lines = text.split('\r\n');
  assert.ok(lines.includes('2026-10-20 18:00,Muscle,"Push, heavy",Barbell Bench Press,warm-up,40,88.18,10,,no,"\'=1+1 · Felt ""easy"""'));
  assert.equal(D.field('-5', true), "'-5");
  assert.equal(D.field(-5, false), '-5');
  assert.equal(D.field(' padded'), '" padded"');
  assert.equal(D.field('a;b'), '"a;b"');
  assert.equal(D.field('two\nlines'), '"two\nlines"');
  // the file reads back, through the same parser imports use, to the same rows
  const back = security.csv(text);
  assert.equal(back.length, 12);
  assert.equal(back.find(r => r[4] === 'warm-up' && r[1] === 'Muscle')[10], '\'=1+1 · Felt "easy"');
  assert.deepEqual(D.rows({}, names), []);
});

/* ---- Strong and Hevy ---- */
// The headers and formats of real exports: Strong's from its CSV export (12-hour times with am/pm, the workout's length
// as 1h 4m, weights in the unit you use there); Hevy's with weight_kg or weight_lbs and day month year, 24-hour times.
const STRONG = ['Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
  '2025-01-29 5:30:00 pm,"Evening Legs",1h 4m,"Squat (Barbell)",W,60,5,0,0,"","",',
  '2025-01-29 5:30:00 pm,"Evening Legs",1h 4m,"Squat (Barbell)",1,100,5,0,0,"Belt on","Felt good, slept well",8',
  '2025-01-29 5:30:00 pm,"Evening Legs",1h 4m,"Squat (Barbell)",2,100,5,0,0,"","Felt good, slept well",8.5',
  '2025-01-29 5:30:00 pm,"Evening Legs",1h 4m,"Squat (Barbell)",Rest Timer,0,0,0,90,"","",',
  '2025-01-29 5:30:00 pm,"Evening Legs",1h 4m,"Plank",1,0,0,0,60,"","",',
  '2025-01-29 5:30:00 pm,"Evening Legs",1h 4m,"Running",1,0,0,5000,1500,"","",',
  '2025-01-30 12:34:56 am,"Push",49m,"Bench Press (Barbell)",1,62.5,8,0,0,"","",',
  '2025-01-30 12:34:56 am,"Push",49m,"Bench Press (Barbell)",D,50,10,0,0,"","",'].join('\n');
const HEVY = ['"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_lbs","reps","distance_miles","duration_seconds","rpe"',
  '"Upper A","30 Jan 2025, 12:34","30 Jan 2025, 13:23","Long day","Bench Press (Barbell)",,"Paused reps",0,"warmup",95,10,,,',
  '"Upper A","30 Jan 2025, 12:34","30 Jan 2025, 13:23","Long day","Bench Press (Barbell)",,"Paused reps",1,"normal",185,8,,,8',
  '"Upper A","30 Jan 2025, 12:34","30 Jan 2025, 13:23","Long day","Bench Press (Barbell)",,"",2,"failure",185,6,,,10',
  '"Upper A","30 Jan 2025, 12:34","30 Jan 2025, 13:23","Long day","Lat Pulldown (Cable)",0,"",0,"dropset",120,12,,,',
  '"Upper A","30 Jan 2025, 12:34","30 Jan 2025, 13:23","Long day","Plank",,"",0,"normal",,,,45,'].join('\r\n');

test('a Strong export reads as workouts, with its 12-hour times, warm-ups, notes and length', () => {
  const W = security.workouts(STRONG);
  assert.equal(W.app, 'strong');
  assert.equal(W.unitKnown, false);   // Strong writes the number in whatever unit you use, without saying which
  assert.equal(W.sessions.length, 2);
  const [legs, push] = W.sessions;
  assert.equal(legs.start, at(2025, 1, 29, 17, 30));
  assert.equal(push.start, new Date(2025, 0, 30, 0, 34, 56).getTime());   // 12:34 am is just after midnight
  assert.equal(legs.durationSec, 3840);
  assert.equal(legs.note, 'Felt good, slept well');
  assert.deepEqual(legs.entries.map(e => e.name), ['Squat (Barbell)', 'Plank', 'Running']);
  const squat = legs.entries[0];
  assert.equal(squat.note, 'Belt on');
  assert.deepEqual(squat.sets.map(s => [s.type, s.w, s.reps, s.rpe]), [['warmup', 60, 5, null], ['work', 100, 5, 8], ['work', 100, 5, 8.5]]);   // the rest timer is not a set
  assert.deepEqual(legs.entries[1].sets.map(s => [s.reps, s.secs]), [[null, 60]]);
  assert.equal(push.entries[0].sets[1].type, 'drop');
  assert.equal(W.sets, 7);
  assert.deepEqual(W.exercises.map(x => [x.name, x.sets]), [['Squat (Barbell)', 3], ['Plank', 1], ['Running', 1], ['Bench Press (Barbell)', 2]]);
  // an older Strong export: semicolons, its own unit column and 24-hour times
  const old = security.workouts('Date;Workout Name;Exercise Name;Set Order;Weight;Weight Unit;Reps;RPE;Distance;Distance Unit;Seconds;Notes;Workout Notes;Workout Duration\n' +
    '2021-03-04 07:05:00;Morning;Deadlift (Barbell);1;315;lbs;3;;;;;;;45m\n2021-03-04 07:05:00;Morning;Deadlift (Barbell);2;140,5;kg;3;;;;;;;45m');
  assert.equal(old.sessions[0].start, at(2021, 3, 4, 7, 5));
  assert.deepEqual(old.sessions[0].entries[0].sets.map(s => [s.w, s.u]), [[315, 'lb'], [140.5, 'kg']]);
  assert.equal(old.sessions[0].durationSec, 2700);
});

test('a Hevy export reads as workouts, in pounds when the file says so', () => {
  const W = security.workouts(HEVY);
  assert.equal(W.app, 'hevy');
  assert.equal(W.unit, 'lb');
  assert.equal(W.sessions.length, 1);
  const s = W.sessions[0];
  assert.equal(s.start, at(2025, 1, 30, 12, 34));
  assert.equal(s.durationSec, 49 * 60);
  assert.equal(s.note, 'Long day');
  assert.deepEqual(s.entries[0].sets.map(x => [x.type, x.w, x.u, x.reps, x.rpe]), [['warmup', 95, 'lb', 10, null], ['work', 185, 'lb', 8, 8], ['failure', 185, 'lb', 6, 10]]);
  assert.equal(s.entries[0].note, 'Paused reps');
  assert.equal(s.entries[1].sets[0].type, 'drop');
  assert.deepEqual(s.entries[2].sets.map(x => [x.w, x.secs]), [[null, 45]]);
  assert.ok(security.workouts(HEVY.replace('weight_lbs', 'weight_kg')).unit === 'kg');
});

test('files that are not Strong or Hevy exports, or hold bad values, are refused before anything is added', () => {
  assert.throws(() => security.workouts('name,value\nx,1'), /Strong or Hevy/);
  assert.throws(() => security.workouts(STRONG.split('\n')[0]), /no workouts/);
  assert.throws(() => security.workouts(STRONG.replace(',100,5,0,0,"Belt on"', ',1OO,5,0,0,"Belt on"')), /Row 3: .* is not a number/);
  assert.throws(() => security.workouts(STRONG.replace('2025-01-29 5:30:00 pm,"Evening Legs",1h 4m,"Plank"', 'yesterday,"Evening Legs",1h 4m,"Plank"')), /date .* is not one Milo can read/);
  assert.throws(() => security.workouts(STRONG.replace(',62.5,8,', ',62.5,8000,')), /out of range/);
  assert.throws(() => security.workouts('"title,start_time\n'), /never ends/);
  assert.throws(() => security.workouts('x'.repeat(security.IMPORT_BYTES + 1)), /too large/);
  assert.throws(() => security.workouts(42), /couldn’t be read/);
  // quoted fields keep their commas, quotes and line breaks
  assert.deepEqual(security.csv('a,"b, ""c""\nd",e\r\n'), [['a', 'b, "c"\nd', 'e']]);
});

/* ---- backups with a passphrase ---- */
const backup = JSON.stringify({app: 'milovancroton', version: 1, created: '2026-10-24T08:00:00.000Z', data: {'hyplog.v1': JSON.stringify({v: 1, history: []})}});
test('an encrypted backup opens with its passphrase and with nothing else', async () => {
  const sealed = await security.seal(backup, 'correct horse battery');
  assert.ok(security.sealed(sealed) && !security.sealed(backup));
  const v = JSON.parse(sealed);
  assert.equal(v.sealed.kdf, 'PBKDF2-SHA256');
  assert.ok(v.sealed.iter >= 310000);
  assert.equal(v.sealed.cipher, 'AES-256-GCM');
  assert.ok(!sealed.includes('hyplog'));
  assert.equal(await security.unseal(sealed, 'correct horse battery'), backup);
  assert.ok(security.backup(await security.unseal(sealed, 'correct horse battery')).data['hyplog.v1']);
  await assert.rejects(security.unseal(sealed, 'correct horse batterY'), /passphrase doesn’t open this backup/);
  await assert.rejects(security.unseal(sealed, ''), /Enter the backup’s passphrase/);
  // a fresh salt and IV every time, so the same backup never encrypts the same way twice
  const again = JSON.parse(await security.seal(backup, 'correct horse battery'));
  assert.notEqual(again.sealed.salt, v.sealed.salt); assert.notEqual(again.sealed.iv, v.sealed.iv);
  // a changed file fails the check instead of opening as something else
  const bytes = Buffer.from(v.sealed.data, 'base64'); bytes[3] ^= 1;
  await assert.rejects(security.unseal(JSON.stringify({...v, sealed: {...v.sealed, data: bytes.toString('base64')}}), 'correct horse battery'), /passphrase doesn’t open/);
  await assert.rejects(security.unseal(JSON.stringify({...v, sealed: {...v.sealed, iter: 1000}}), 'x'), /damaged, or from a newer Milo/);
  await assert.rejects(security.seal(backup, ''), /Enter a passphrase/);
  // plain backups keep working as before
  assert.ok(security.backup(backup).data['hyplog.v1']);
});

/* ---- erase everything ---- */
test('Erase everything covers every key Milo writes, and nothing of other apps', () => {
  // every storage key app.js and security.js name, written out or built from a prefix
  const src = app + fs.readFileSync(path.join(__dirname, '..', 'security.js'), 'utf8');
  const literal = new Set([...src.matchAll(/'((?:hyplog|strlog|proladder|trainer|milo)\.[A-Za-z0-9_.]*)'/g)].map(m => m[1]));
  ['hyplog.v1', 'strlog.v2', 'proladder.v1', 'trainer.together', 'trainer.shell.', 'milo.restore', 'milo.erase', 'milo.before', 'milo.backup', 'milo.since', 'milo.persist', 'milo.caltime']
    .forEach(k => assert.ok(literal.has(k), k + ' is written somewhere'));
  // a prefix ('trainer.shell.' + a choice, SK + '.theme') stands for the keys made from it; a section's key has undo and unreadable copies
  const keys = [...literal].flatMap(k => k === 'trainer.shell' || k.endsWith('.') ? [k.replace(/\.?$/, '.') + 'theme', k.replace(/\.?$/, '.') + 'platesKg'] : [k, k + '.undo', k + '.corrupt']);
  keys.forEach(k => assert.ok(security.owned(k), k));
  security.STATE_KEYS.forEach(k => { assert.ok(security.owned(k + '.undo')); assert.ok(security.owned(k + '.corrupt')); });
  ['other-app.token', 'hyplog', 'trainer', 'trainer.shellfish', 'milo', 'Milo.before', 'hyplog.v1 ', 'xhyplog.v1', 'trainerXtogether'].forEach(k => assert.ok(!security.owned(k), k));
  class Storage { constructor(o) { this.m = new Map(Object.entries(o)); } get length() { return this.m.size; } key(i) { return [...this.m.keys()][i] ?? null; }
    getItem(k) { return this.m.get(k) ?? null; } removeItem(k) { this.m.delete(k); } }
  const st = new Storage({'hyplog.v1': '{}', 'hyplog.v1.undo': '{}', 'strlog.v2.corrupt': 'x', 'proladder.v1': '{}', 'trainer.together': '{}', 'trainer.together.undo': '{}',
    'trainer.shell.unit': '"kg"', 'trainer.shell.theme': 'dark', 'milo.before': '{}', 'milo.backup': '1', 'milo.caltime': '07:00', 'other-app.token': 'keep', 'theme': 'keep'});
  const gone = security.erase(st);
  assert.equal(gone.length, 11);
  assert.deepEqual([...st.m.keys()].sort(), ['other-app.token', 'theme']);
});

/* ---- planned days, the calendar file and the badge ---- */
// Monday 2 November 2026 and the four weeks after it
const MON = at(2026, 11, 2, 9);
const T3 = {on: true, secs: ['lift', 'str'], days: 3, mins: 50, wd: [5, 1, 3], plan: {kinds: [['str'], ['lift'], ['str', 'lift', 'cal']]}};
test('planned days fall on the weekdays you picked in Together, or each section’s own days', () => {
  const days = D.planned(T3, {}, MON, 28);
  assert.equal(days.length, 12);
  assert.deepEqual(days.slice(0, 3).map(d => [new Date(d.date).getDay(), d.day, d.title]), [[2, 0, 'Day 1: Strength'], [4, 1, 'Day 2: Muscle'], [6, 2, 'Day 3: Strength + Muscle']]);
  assert.ok(days.every(d => d.date === Day.start(d.date)));
  // without picked weekdays, Together's suggested ones (Monday, Wednesday, Friday for three)
  assert.deepEqual(D.planned({...T3, wd: null}, {}, MON, 7).map(d => new Date(d.date).getDay()), [1, 3, 5]);
  assert.deepEqual(D.planned({...T3, wd: [1, 1, 3]}, {}, MON, 7).map(d => new Date(d.date).getDay()), [1, 3, 5]);   // not one a day: suggested
  // Together off: Muscle's block of four days and Strength's three, each on its own suggested weekdays
  const own = {lift: {mesos: [{status: 'active', days: [{name: 'Upper'}, {name: 'Lower'}, {name: 'Upper 2'}, {name: 'Lower 2'}]}]}, str: {program: {}, setup: {days: 3}}, cal: {goals: [{achieved: 123}]}};
  const week = D.planned({on: false}, own, MON, 7);
  assert.deepEqual(week.map(d => [new Date(d.date).getDay(), d.title]), [[1, 'Muscle (Upper) + Strength'], [2, 'Muscle (Lower)'], [3, 'Strength'], [4, 'Muscle (Upper 2)'], [5, 'Muscle (Lower 2) + Strength']]);
  assert.deepEqual(D.planned(null, {}, MON, 28), []);
});

test('the calendar file is valid iCalendar, with a reminder 30 minutes before each day', () => {
  const days = D.planned(T3, {}, MON, 28), text = D.ics(days, {time: '06:45', mins: 50, now: Date.UTC(2026, 10, 1, 12)});
  const lines = text.split('\r\n');
  assert.equal(lines.pop(), '');
  assert.ok(!/[^\r]\n/.test(text));
  assert.ok(lines.every(l => Buffer.byteLength(l) <= 75), 'lines are folded at 75 octets');
  const unfolded = text.replace(/\r\n /g, '').split('\r\n').filter(Boolean);
  assert.deepEqual(unfolded.slice(0, 2), ['BEGIN:VCALENDAR', 'VERSION:2.0']);
  assert.ok(unfolded.some(l => /^PRODID:/.test(l)));
  assert.equal(unfolded[unfolded.length - 1], 'END:VCALENDAR');
  // every BEGIN has its END, in order
  const stack = []; unfolded.forEach(l => { const m = /^(BEGIN|END):(.*)$/.exec(l); if (!m) return; if (m[1] === 'BEGIN') stack.push(m[2]); else assert.equal(stack.pop(), m[2]); });
  assert.equal(stack.length, 0);
  const events = text.split('BEGIN:VEVENT').slice(1);
  assert.equal(events.length, 12);
  const uids = new Set();
  events.forEach((e, i) => {
    const f = k => (new RegExp('\\r\\n' + k + ':([^\\r]*)').exec('\r\n' + e.replace(/\r\n /g, '')) || [])[1];
    const d = new Date(days[i].date);
    assert.equal(f('DTSTART'), d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + 'T064500');
    assert.match(f('DTEND'), /T073500$/);
    assert.equal(f('DTSTAMP'), '20261101T120000Z');
    assert.equal(f('TRIGGER'), '-PT30M');
    assert.equal(f('ACTION'), 'DISPLAY');
    assert.ok(f('SUMMARY').startsWith('Milo: Day '));
    uids.add(f('UID'));
  });
  assert.equal(uids.size, 12);
  // text is escaped, and long lines fold without splitting a character
  const long = D.ics([{date: MON, title: 'Strength, Muscle; and a very long name with ünïcödé letters that goes on well past seventy-five bytes'}], {now: 0});
  assert.ok(long.includes('SUMMARY:Milo: Strength\\, Muscle\\; and'));
  assert.ok(long.split('\r\n').every(l => Buffer.byteLength(l) <= 75));
  assert.ok(long.replace(/\r\n /g, '').includes('ünïcödé letters that goes on well past seventy-five bytes'));
  assert.match(long, /DTSTART:20261102T180000/);   // 6 pm when no time is given
});

test('the badge shows on a planned day until its training is done, and not on a rest day', () => {
  const tue = at(2026, 11, 3, 8), wed = at(2026, 11, 4, 8);
  assert.equal(D.badge(T3, {}, tue), 1);
  assert.equal(D.badge(T3, {}, wed), 0);
  const did = m => ({[m]: {history: [{id: 'x', name: 'X', date: at(2026, 11, 3, 7), entries: []}]}});
  assert.equal(D.badge(T3, did('str'), tue), 0);
  assert.equal(D.badge(T3, did('lift'), tue), 1);   // something else trained: Strength still to do
  assert.equal(D.badge(T3, {str: {history: [{id: 'y', name: 'Y', date: at(2026, 11, 2, 7), entries: []}]}}, tue), 1);   // yesterday's doesn't count
  assert.equal(D.badge({...T3, log: [{date: at(2026, 11, 3, 6), skipped: true}]}, {}, tue), 0);
  const sat = at(2026, 11, 7, 8);
  assert.equal(D.badge(T3, {str: did('str').str}, sat), 1);
  // Together leaves out a section on a day its plan found no work for: not in the calendar, and not waited for
  const T2 = {on: true, secs: ['lift', 'str'], days: 2, plan: {kinds: [['str', 'lift'], ['lift']], days: [{str: [{id: 'squat'}], lift: []}, {str: [], lift: [{exId: 'db-bench'}]}]}};
  const mon = at(2026, 11, 2, 8), monS = {str: {history: [{id: 'a', name: 'Day 1', date: at(2026, 11, 2, 7), entries: []}]}};
  assert.equal(D.planned(T2, {}, mon, 1)[0].title, 'Day 1: Strength');
  assert.equal(D.badge(T2, {}, mon), 1);
  assert.equal(D.badge(T2, monS, at(2026, 11, 2, 21)), 0);
  assert.equal(D.planned({...T2, plan: {kinds: T2.plan.kinds}}, {}, mon, 1)[0].title, 'Day 1: Strength + Muscle');   // a plan without its days: as it says
  // a Together day finished with a part not started (logged as skip, without skipped:true), or another day of the week done
  // today, is today's training done
  assert.equal(D.badge({...T3, log: [{date: at(2026, 11, 3, 19), start: at(2026, 11, 3, 18), day: 0, parts: [['str', 'skip', null]]}]}, {}, tue), 0);
  assert.equal(D.badge({...T3, log: [{date: at(2026, 11, 3, 19), start: at(2026, 11, 3, 18), day: 2, parts: [['lift', 'done', 'x']]}]}, did('lift'), tue), 0);
  // a day left open overnight and closed this morning was yesterday's training, not today's
  assert.equal(D.badge({...T3, log: [{date: at(2026, 11, 3, 7), start: at(2026, 11, 2, 19), day: 2, parts: [['str', 'done', 'y']]}]}, {}, tue), 1);
  assert.equal(D.badge({...T3, on: false, log: [{date: at(2026, 11, 3, 6), skipped: true}]}, {}, tue), 0);   // off, and nothing of its own planned
  assert.equal(D.badge(T3, {...did('str'), lift: {history: [{id: 'z', name: 'Z', date: at(2026, 11, 7, 10), entries: []}]}, str: {history: [{id: 'w', name: 'W', date: at(2026, 11, 7, 9), entries: []}]}}, sat), 0);
});

/* ---- names from other apps, and what the sections add ---- */
test('exercise names from Strong and Hevy find the right Milo exercise', () => {
  const want = {
    'Squat (Barbell)': 'back-squat', 'Bench Press (Barbell)': 'barbell-bench', 'Deadlift (Barbell)': 'deadlift', 'Overhead Press (Barbell)': 'ohp',
    'Bent Over Row (Barbell)': 'barbell-row', 'Pull Up': 'pullup', 'Chin Up': 'chin-up', 'Push Up': 'pushup', 'Romanian Deadlift (Barbell)': 'romanian-deadlift',
    'Hip Thrust (Barbell)': 'hip-thrust', 'Front Squat (Barbell)': 'front-squat', 'Leg Press': 'leg-press', 'Leg Extension (Machine)': 'leg-extension',
    'Lat Pulldown (Cable)': 'lat-pulldown', 'Lateral Raise (Dumbbell)': 'lateral-raise', 'Lateral Raise (Cable)': 'cable-lateral', 'Bench Press (Dumbbell)': 'db-bench',
    'Seated Leg Curl (Machine)': 'leg-curl', 'Pull Up (Assisted)': 'assisted-pullup', 'Pull Up (Weighted)': 'pullup', 'Lying Leg Curl (Machine)': 'lying-leg-curl', 'Plank': 'plank', 'Bicep Curl (Barbell)': 'barbell-curl',
    // an assisted version gets the assisted exercise, never the bodyweight one (its weight is the help, not load)
    'Chin Up (Assisted)': 'assisted-pullup', 'Assisted Chin Up': 'assisted-pullup', 'Assisted Pull Up': 'assisted-pullup', 'Pull Up (Band)': 'assisted-pullup', 'Chin Up (Weighted)': 'chin-up',
    // the word that names the exercise wins over a shared equipment word, and over a word every press or row has
    'Incline Bench Press (Dumbbell)': 'incline-db-press', 'Incline Bench Press (Barbell)': 'incline-bench', 'Overhead Press (Dumbbell)': 'db-shoulder-press',
    'Shoulder Press (Dumbbell)': 'db-shoulder-press', 'Shoulder Press (Machine)': 'machine-shoulder-press', 'Preacher Curl (Barbell)': 'preacher-curl',
    'Bent Over Row (Dumbbell)': 'db-row',
  };
  Object.entries(want).forEach(([n, id]) => assert.equal(D.guess(n, CATALOGUE), id, n));
  assert.equal(D.guess('Zercher Wobble Thing', CATALOGUE), null);
  assert.equal(D.guess('Running', CATALOGUE), null);
  ['Dip (Assisted)', 'Assisted Dip', 'Triceps Dip (Assisted)'].forEach(n => assert.equal(D.guess(n, CATALOGUE), null, n));   // no assisted dip: skipped
  assert.equal(D.guess('Bench Wobble Thing Extra', CATALOGUE), null);   // one word in common is not a match
  assert.equal(D.canon('DB Curls'), 'dumbbell curl');
  assert.equal(D.canon('Pull-Ups'), 'pullup');
});

test('workouts become past sessions for Muscle and Strength, in kg, with stable ids', () => {
  const W = security.workouts(HEVY), map = {'bench press (barbell)': {sec: 'str', id: 'bench'}, 'plank': {sec: 'lift', id: 'plank'}, 'lat pulldown (cable)': {sec: 'lift', id: 'lat-pulldown'}};
  const P = D.toPast(W, map, 'kg');
  assert.equal(P.str.length, 1); assert.equal(P.lift.length, 1);
  const b = P.str[0];
  assert.equal(b.date, at(2025, 1, 30, 12, 34)); assert.equal(b.from, 'hevy'); assert.equal(b.name, 'Upper A'); assert.equal(b.durationSec, 49 * 60);
  assert.match(b.id, /^imp-hevy-str-[a-z0-9]+-0$/);
  assert.equal(b.w, 0); assert.equal(P.lift[0].w, 0);   // both from the file's first workout
  assert.ok(security.section({history: [{...b, entries: [{liftId: 'bench', sets: []}]}]}, 'strlog.v2'));   // an id the backup check accepts
  assert.deepEqual(b.entries[0].sets.map(s => [s.warm, s.kind, s.kg, s.reps, s.rpe]), [[true, 'warmup', 43.0913, 10, null], [false, 'work', 83.9146, 8, 8], [false, 'failure', 83.9146, 6, 10]]);
  assert.equal(b.entries[0].note, 'Paused reps');
  assert.deepEqual(P.lift[0].entries.map(e => [e.id, e.sets.map(s => [s.kg, s.reps, s.secs, s.kind])]), [['lat-pulldown', [[54.4311, 12, null, 'drop']]], ['plank', [[null, null, 45, 'work']]]]);
  assert.deepEqual(D.toPast(W, map, 'kg'), P);   // the same file gives the same ids, so importing it twice adds nothing twice
  // a skipped name is left out; two names for one exercise make one entry; the unit asked for applies when the file has none
  const SW = security.workouts(STRONG), Q = D.toPast(SW, {'squat (barbell)': {sec: 'str', id: 'squat'}, 'bench press (barbell)': {sec: 'str', id: 'squat'}}, 'lb');
  assert.equal(Q.str.length, 2); assert.equal(Q.lift.length, 0);
  assert.deepEqual(Q.str[0].entries[0].sets.map(s => s.kg), [27.2155, 45.3592, 45.3592]);
  assert.equal(D.toPast(SW, {}, 'kg').str.length, 0);
});

test('a history too big for one section goes in only as far as it still loads, newest first, with room to spare', () => {
  // four years of four workouts a week in Strong, six exercises of a warm-up and three sets each, all sent to Muscle
  const EXS = [['Squat (Barbell)', 'back-squat'], ['Bench Press (Barbell)', 'barbell-bench'], ['Deadlift (Barbell)', 'deadlift'], ['Overhead Press (Barbell)', 'ohp'],
    ['Lat Pulldown (Cable)', 'lat-pulldown'], ['Leg Extension (Machine)', 'leg-extension'], ['Lateral Raise (Dumbbell)', 'lateral-raise'], ['Bicep Curl (Barbell)', 'barbell-curl']];
  const lines = ['Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE'], t0 = at(2022, 1, 3);
  for (let w = 0; w < 4 * 52; w++) for (let d = 0; d < 4; d++) {
    const day = new Date(Day.add(t0, w * 7 + d * 2)), ds = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0') + ' 6:00:00 pm';
    for (let e = 0; e < 6; e++) { const ex = EXS[(d * 2 + e) % EXS.length][0];
      lines.push(`${ds},"Workout ${d + 1}",1h 5m,"${ex}",W,40,10,0,0,"","",`);
      for (let k = 1; k <= 3; k++) lines.push(`${ds},"Workout ${d + 1}",1h 5m,"${ex}",${k},80,8,0,0,"","",8`); }
  }
  const W = security.workouts(lines.join('\n')), map = Object.fromEntries(EXS.map(([n, id]) => [n.toLowerCase(), {sec: 'lift', id}]));
  // the sessions as Muscle's past() keeps them
  const recs = D.toPast(W, map, 'kg').lift.map(s => ({id: s.id, name: s.name, date: s.date, durationSec: s.durationSec, prs: [], note: null, from: s.from,
    entries: s.entries.map(x => ({exId: x.id, name: x.id, primary: ['quad'], secondary: ['glute'], equipment: 'Barbell', target: {repLow: 6, repHigh: 10, rir: 2, rest: 150}, note: null,
      sets: x.sets.map(t => ({type: t.warm ? 'warmup' : 'work', weight: t.kg, reps: t.reps, rir: t.rpe != null ? 10 - t.rpe : null, done: true, tag: null, segments: []}))}))}))
    .sort((a, b) => b.date - a.date);
  const mine = {v: 1, settings: {unit: 'kg'}, history: [{id: 'mine', name: 'Mine', date: Date.now(), entries: [{exId: 'barbell-bench', name: 'Bench', sets: [{type: 'work', weight: 80, reps: 8, rir: 2, done: true}]}]}]};
  assert.equal(recs.length, 832);
  assert.throws(() => security.parseSection(JSON.stringify({...mine, history: mine.history.concat(recs)}), 'hyplog.v1'), /too (complex|large)/);   // all of it would not load
  const k = security.room(mine, recs);
  assert.ok(k > 100 && k < recs.length, String(k));
  const kept = JSON.stringify({...mine, history: mine.history.concat(recs.slice(0, k))});
  assert.ok(security.parseSection(kept, 'hyplog.v1'));
  assert.ok(Buffer.byteLength(kept) <= 0.75 * security.MAX_BYTES);
  assert.throws(() => security.parseSection(JSON.stringify({...mine, history: mine.history.concat(recs.slice(0, Math.ceil(k / 0.75) + 20))}), 'hyplog.v1'), /too (complex|large)/);   // 3/4 of the limit, not all of it
  assert.equal(security.room(mine, recs.slice(0, 10)), 10);
  assert.equal(security.room(mine, []), 0);
});

test('the coach summary counts the last four weeks: sessions, main lifts, Ladder and notes', () => {
  const now = at(2026, 10, 25, 20), info = {lift: id => ({'barbell-bench': {comp: true, bw: false, p: ['chest']}, plank: {comp: false}})[id] || null, str: id => ({squat: {n: 'Back Squat', k: 'load'}})[id] || null};
  const S2 = JSON.parse(JSON.stringify(S));
  S2.str.history.unshift({id: 's0', name: 'Old', date: at(2026, 8, 1), entries: [{liftId: 'squat', sets: [{kind: 'work', w: 90, reps: 5, rpe: 8, done: true}]}]});
  S2.cal.advances = [{date: at(2026, 10, 22, 19), id: 'pull', from: 5, to: 6, name: 'Weighted pull-up'}, {date: at(2026, 9, 1), name: 'Too old'}];
  const C = D.coach(S2, now, {unit: 'kg', muscles: [{n: 'Chest', sets: 10}], goals: [{n: 'First one-arm pull-up', step: 'Weighted pull-up', pct: 40}], info, names});
  assert.equal(C.days, 28); assert.deepEqual(C.muscles, [{n: 'Chest', perWeek: 2.5}]);
  assert.equal(C.to, at(2026, 10, 26, 0)); assert.equal(C.from, Day.add(C.to, -28));
  assert.deepEqual(C.sessions.map(s => [s.sec, s.name, s.sets]), [['Strength', 'Day A', 2], ['Muscle', 'Push, heavy', 3], ['Ladder', 'Pull', 3]]);
  assert.deepEqual(C.lifts.map(l => [l.name, l.sec, l.n]), [['Back Squat', 'Strength', 1], ['Barbell Bench Press', 'Muscle', 1]]);
  const sq = C.lifts[0];
  assert.deepEqual([sq.best.kg, sq.best.reps, sq.best.eff], [120, 3, 'RPE 8.5']);
  assert.ok(Math.abs(sq.best.e1 - Lift.e1rm(120, 3, 1.5, 'lower')) < 1e-9);
  assert.ok(sq.e1 > 100 && sq.e1 < sq.best.e1 + 1, 'the estimate weighs the older session too');
  assert.deepEqual(C.rungs.map(r => r.name), ['Weighted pull-up']);
  assert.deepEqual(C.notes.map(n => n.text), ['=1+1', 'Barbell Bench Press: Felt "easy"']);
  const parts = D.summary(C), text = D.text(C);
  assert.deepEqual(parts.map(p => p.h), ['Sessions: 3', 'Hard sets a week, per muscle', 'Main lifts', 'Ladder', 'Notes']);
  assert.equal(parts[0].lines[0], 'Strength 1, Muscle 1, Ladder 1');
  assert.ok(parts[2].lines[0].startsWith('Back Squat: estimated max ') && parts[2].lines[0].includes('best set 120 kg × 3 at RPE 8.5 (1 session)'));
  assert.equal(parts[3].lines[0], 'First one-arm pull-up: on Weighted pull-up, 40% of the way');
  assert.ok(text.startsWith('Training summary from Milo, ') && text.includes('\n- Chest: 2.5\n'));
  assert.ok(D.summary({...C, unit: 'lb'})[2].lines[0].includes('best set 264.6 lb × 3'));
  assert.deepEqual(D.summary(D.coach({}, now, {}))[0], {h: 'Sessions: 0', lines: ['No sessions in these four weeks.']});
  // six days of training: the sets are that week's, not a quarter of them
  const S3 = {lift: {history: [{id: 'n', name: 'New', date: at(2026, 10, 20), entries: []}]}}, C3 = D.coach(S3, now, {muscles: [{n: 'Glutes', sets: 11}]});
  assert.equal(C3.days, 6); assert.equal(C3.muscles[0].perWeek, 11);
  assert.equal(D.summary(C3)[1].h, 'Hard sets a week, per muscle (from the 6 days you have logged)');
  assert.equal(D.coach({lift: {history: [{id: 'n', name: 'N', date: at(2026, 10, 9), entries: []}]}}, now, {muscles: [{n: 'Q', sets: 14}]}).muscles[0].perWeek, 14 / (17 / 7));
});

test('the summary’s estimated max for a Strength lift is Strength’s own, from the sets as Strength counts them', () => {
  // four weekly 3x5 squats at a target RPE of 8 with the RPE box left empty: Strength reads them at RPE 8, not all-out
  const now = at(2026, 10, 25, 20), hist = [0, 1, 2, 3].map(i => ({id: 'q' + i, name: 'Day A', date: at(2026, 10, 4 + 7 * i), entries: [{liftId: 'squat', sets: [1, 2, 3].map(() => ({kind: 'work', w: 100 + 2.5 * i, reps: 5, trpe: 8, rpe: null, done: true}))}]}));
  const S4 = {str: {history: hist}}, hub = 132.6;
  const C = D.coach(S4, now, {info: {str: id => id === 'squat' ? {n: 'Back Squat', k: 'load', e1: hub} : null}});
  assert.equal(C.lifts[0].e1, hub);
  assert.ok(Math.abs(C.lifts[0].best.e1 - Lift.e1rm(107.5, 5, 2, 'lower')) < 1e-9, 'the best set is read at its target RPE');
  // without Strength's number (it has none yet), the estimate from the sets, still read at RPE 8
  const own = D.coach(S4, now, {info: {str: id => id === 'squat' ? {n: 'Back Squat', k: 'load', e1: null} : null}}).lifts[0].e1;
  assert.ok(own > Lift.e1rm(100, 5, 2, 'lower') && own < Lift.e1rm(107.5, 5, 2, 'lower') + 1e-9);
  // a Muscle set with more than 3.5 reps left says little about a max, and is left out as Muscle leaves it out
  const M = {lift: {history: [{id: 'm', name: 'Push', date: at(2026, 10, 20), entries: [{exId: 'barbell-bench', name: 'Bench', sets: [
    {type: 'work', weight: 60, reps: 8, rir: 5, done: true}, {type: 'work', weight: 80, reps: 6, rir: 2, done: true}]}]}]}};
  const b = D.coach(M, now, {info: {lift: () => ({comp: true, bw: false, p: ['chest']})}}).lifts[0];
  assert.deepEqual([b.best.kg, b.best.reps], [80, 6]);
});
