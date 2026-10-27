const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');

// The shared engine every section uses (Prefs, Lift, Num, Day, Kit, Body), run from app.js itself with a stand-in
// localStorage. Each call gives a fresh copy, so Kit's first-use set-up can be tested more than once.
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const from = app.indexOf('/* ==================== ONE CHOICE FOR THE WHOLE APP');
const to = app.indexOf('/* ==================== TAKE BACK ====================', from);
const SRC = app.slice(from, to);
function engine(saved = {}) {
  const store = new Map(Object.entries(saved));
  const localStorage = {getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k)};
  const ctx = {window: {}, localStorage, console, Date, Math, JSON};
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx, {filename: 'app.js:engine'});
  for (const k of ['Prefs', 'Lift', 'Num', 'Day', 'Kit', 'Body']) ctx[k] = ctx.window[k];
  return {...ctx.window, store, ctx};
}
const DAY = 864e5;
// a seeded random number generator, and normal noise from it
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const normal = r => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r());

test('typed numbers read with a comma or a point, spaces ignored', () => {
  const {Num} = engine();
  const ok = {'62.5': 62.5, '62,5': 62.5, ' 62 ': 62, '1 000,5': 1000.5, '1 000,5': 1000.5, '1.000,5': 1000.5, '1,000.5': 1000.5, '8,': 8, ',5': 0.5, '-2,5': -2.5};
  for (const [s, v] of Object.entries(ok)) assert.equal(Num.parse(s), v, s);
  for (const s of ['', '   ', 'abc', '1,2,3', ',', '-', '62kg', '1,000,5', null, undefined, NaN, Infinity]) assert.equal(Num.parse(s), null, String(s));
  assert.equal(Num.parse(7), 7);
  assert.equal(Num.int('8,9'), 8);
  assert.equal(Num.int(''), null);
});

// Runs fn's body in a child process with the given time zone; it gets the engine as E and returns JSON.
function inZone(tz, body) {
  const script = `const fs=require('fs'),vm=require('vm');const app=fs.readFileSync(${JSON.stringify(path.join(__dirname, '..', 'app.js'))},'utf8');
    const a=app.indexOf('/* ==================== ONE CHOICE FOR THE WHOLE APP'),b=app.indexOf('/* ==================== TAKE BACK ====================',a);
    const ctx={window:{},localStorage:{getItem:()=>null,setItem(){}},console,Date,Math,JSON};vm.createContext(ctx);vm.runInContext(app.slice(a,b),ctx);
    const E=ctx.window; const trainingDayMap=(function(){ const src=app.slice(app.indexOf('function trainingDayMap(){'), app.indexOf('function volumeBalance('));
      return (state,isWork,Day)=>eval('('+src.trim()+')')(); })();
    const out=(function(){ ${body} })(); process.stdout.write(JSON.stringify(out));`;
  const r = spawnSync(process.execPath, ['-e', script], {env: {...process.env, TZ: tz}, encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

for (const [tz, spring, autumn] of [['Europe/London', [2026, 2, 29], [2026, 9, 25]], ['America/New_York', [2026, 2, 8], [2026, 10, 1]]]) {
  test(`calendar days hold across clock changes (${tz})`, () => {
    const r = inZone(tz, `
      const D=E.Day, out={};
      for(const [name,[y,m,d]] of Object.entries({spring:${JSON.stringify(spring)}, autumn:${JSON.stringify(autumn)}})){
        const before=new Date(y,m,d-1,12,0).getTime(), day=new Date(y,m,d,0,0).getTime(), after=new Date(y,m,d+1,0,30).getTime();
        out[name]={len:(D.start(after)-D.start(day))/36e5, key:D.key(day), next:D.key(D.add(day,1)), add2:new Date(D.add(before,2)).getHours(),
          diff:D.diff(after,before), back:D.diff(before,after), range:D.range(before,after).map(D.key), startHour:new Date(D.start(after)).getHours()};
      }
      // the history heatmap: a session every day, just after midnight and just before, for 140 days around both changes
      const today=new Date(${autumn[0]},${autumn[1]},${autumn[2]}+20,15,0).getTime(), sessions=[];
      for(let i=0;i<140;i++){ const d=new Date(today); d.setDate(d.getDate()-i); const a=new Date(d); a.setHours(0,20,0,0); const b=new Date(d); b.setHours(23,40,0,0);
        sessions.push({date:a.getTime(), entries:[{sets:[{done:true}]}]}, {date:b.getTime(), entries:[{sets:[{done:true},{done:true}]}]}); }
      const map=trainingDayMap({history:sessions}, s=>s.type!=='warmup', D);
      const start=D.add(D.start(today),-111), grid=D.range(start, today);
      out.heat={cells:grid.length, trained:grid.filter(t=>map[D.key(t)]).length, sets:grid.map(t=>map[D.key(t)]||0).filter(n=>n!==3).length,
        week:grid.filter(t=>map[D.key(t)]&&D.diff(today,t)<7).length, month:grid.filter(t=>map[D.key(t)]&&D.diff(today,t)<28).length};
      return out;`);
    assert.equal(r.spring.len, 23, 'the spring day is 23 hours');
    assert.equal(r.autumn.len, 25, 'the autumn day is 25 hours');
    for (const k of ['spring', 'autumn']) {
      const x = r[k];
      assert.equal(x.diff, 2, k + ': noon the day before to just after midnight the day after is 2 days');
      assert.equal(x.back, -2);
      assert.equal(x.add2, 12, k + ': two days later is the same time of day');
      assert.equal(x.range.length, 3);
      assert.equal(new Set(x.range).size, 3, k + ': each day once');
      assert.equal(x.startHour, 0);
      assert.notEqual(x.key, x.next);
    }
    assert.deepEqual(r.heat, {cells: 112, trained: 112, sets: 0, week: 7, month: 28}, 'every day of the heatmap shows its sessions');
  });
}

test('each kind of exercise has a smooth, falling reps-to-max curve; only the leg press has its own', () => {
  const {Lift: L} = engine();
  for (const cls of ['upper', 'lower', 'iso', 'sled']) {
    let prev = L.pct(1, cls);
    assert.equal(prev, 1);
    for (let e = 1.01; e <= 40; e += 0.01) {
      const p = L.pct(e, cls);
      assert.ok(p <= prev + 1e-12, `${cls} falls at ${e}`);
      assert.ok(prev - p < 0.01, `${cls} has no jump at ${e}`);
      prev = p;
    }
    // no flat stretch where most sets are: a rep more is a real step down in load
    for (let e = 6; e < 13; e += 0.5) assert.ok(L.pct(e, cls) - L.pct(e + 1, cls) >= 0.015, `${cls} falls at least 1.5% a rep at ${e}`);
  }
  for (const cls of ['lower', 'iso']) for (let e = 1; e <= 40; e += 0.25) assert.equal(L.pct(e, cls), L.pct(e), `${cls} is the main table, which Epley matches`);
  assert.equal(L.pct(10).toFixed(4), (1 / (1 + 10 / 30)).toFixed(4), 'upper is Epley');
  assert.equal(L.pct(13.1, 'sled').toFixed(3), '0.800', 'leg press: 13.1 reps at 80%');
  assert.equal(L.pct(19, 'sled').toFixed(3), '0.700', 'and 19.0 at 70%');
  assert.ok(L.pct(12, 'sled') > L.pct(12), 'a leg press set of 12 is a bigger share of the max than a bench set of 12');
  assert.deepEqual([L.cls({comp: true, primary: ['quad']}), L.cls({comp: false, primary: ['quad']}), L.cls({comp: 1, primary: ['chest']}),
    L.cls({lower: true}), L.cls({}), L.cls('iso'), L.cls('sled'), L.cls('nonsense'), L.cls(null)], ['lower', 'iso', 'upper', 'lower', 'upper', 'iso', 'sled', 'upper', 'upper']);
  // the leg press curve is for the leg press and sleds like it, not squats, hinges or lunges (Nuzzo et al. 2024)
  const muscle = (id, name, eq, primary, comp) => L.cls({id, name, equipment: eq, primary, comp});
  assert.deepEqual([muscle('leg-press', 'Leg Press', 'Machine', ['quad', 'glute'], 1), muscle('hack-squat', 'Hack Squat', 'Machine', ['quad'], 1),
    muscle('smith-squat', 'Smith Machine Squat', 'Machine', ['quad', 'glute'], 1), muscle('back-squat', 'Barbell Back Squat', 'Barbell', ['quad', 'glute'], 1),
    muscle('romanian-deadlift', 'Romanian Deadlift', 'Barbell', ['ham', 'glute'], 1), muscle('leg-press-calf', 'Leg Press Calf Raise', 'Machine', ['calf'], 0)],
  ['sled', 'sled', 'lower', 'lower', 'lower', 'iso']);
  assert.equal(L.cls({n: 'Leg Press', h: 'leg-press', lower: true}), 'sled', "Strength's leg press");
  assert.equal(L.cls({n: 'Back Squat', h: 'back-squat', lower: true}), 'lower');
  assert.ok(L.e1rm(100, 12, 0, 'sled') < L.e1rm(100, 12, 0), 'Epley overstates the max from a long leg press set');
  assert.equal(L.e1rm(100, 10, 2, 'lower'), L.e1rm(100, 10, 2), 'a squat set means the same max in Muscle and Strength');
});

test('predicted reps after a small load change stay close for every kind', () => {
  const {Lift: L} = engine();
  // Muscle's predictReps: the reps at a new load with the same effort as last time
  const predict = (w, r, rir, nw, cls) => Math.max(1, Math.round(L.reps(L.e1rm(w, r, rir, cls), nw, L.trueRir(rir, r, cls), cls)));
  for (const cls of ['lower', 'iso', 'sled']) for (const [w, r, rir, nw] of [[100, 10, 2, 102.5], [100, 8, 2, 105], [100, 6, 2, 95], [100, 12, 1, 102.5], [140, 5, 2, 142.5]]) {
    const a = predict(w, r, rir, nw, cls), b = predict(w, r, rir, nw, 'upper');
    assert.ok(Math.abs(a - b) <= 1, `${cls} ${w}x${r} @${rir} then ${nw}: ${a} against ${b}`);
  }
  assert.equal(predict(100, 10, 2, 102.5, 'lower'), 9, 'all sets at the top, add 2.5 kg: about 9');
});

test('only sets near failure and of 12 reps or fewer count toward the max', () => {
  const {Lift: L} = engine();
  assert.deepEqual([[5, 2], [10, 2], [12, 0], [10, 3], [8, 4], [13, 0], [12, null], [13, null], [0, 0], [5, -1]].map(([r, x]) => L.usable(r, x)),
    [true, true, true, false, false, false, true, false, false, true]);
});

test('the reps-in-reserve correction: per kind, recent checks first, pulled toward none, capped', () => {
  const {Lift: L} = engine();
  const now = Date.UTC(2026, 9, 1), chk = (error, ago, cls) => ({date: now - ago * DAY, error, cls});
  assert.deepEqual(JSON.parse(JSON.stringify(L.model([], now))), {c: 0, i: 0, nc: 0, ni: 0});
  assert.equal(L.model([chk(2, 0)], now).i, 0.5, 'one check of +2 counts a quarter');
  assert.equal(L.model([chk(2, 0), chk(2, 0), chk(2, 0)], now).i, 1, 'three count half');
  assert.equal(L.model([chk(2, 90)], now).i, 0.29, 'a check 90 days old counts half as much');
  assert.equal(L.model([chk(2, 0, 'lower'), chk(2, 0, 'upper'), chk(2, 0, 'upper')], now).c, 1, 'compound checks go to the compound correction');
  assert.equal(L.model([chk(2, 0)], now).c, 0, 'a check with no kind is single-joint');
  assert.equal(L.model(Array(40).fill(chk(9, 0)), now).i, 3, 'never more than 3');
  assert.equal(L.model(Array(40).fill(chk(-9, 0)), now).i, -3);
  // a check on a set called at failure can only show reps left over, so it is left out, as the card says
  const at0 = {date: now, predictedRir: 0, actualExtra: 2, error: 2};
  assert.deepEqual(JSON.parse(JSON.stringify(L.model([at0, at0, at0], now))), {c: 0, i: 0, nc: 0, ni: 0}, 'every set called at 0: nothing to correct');
  assert.equal(L.model([at0, {date: now, predictedRir: 2, actualExtra: 4, error: 2}], now).i, 0.5, 'only the other checks count');

  L.use({c: 2, i: -1});
  try {
    assert.equal(L.trueRir(0, 8), 0, 'a set called at failure is never changed');
    assert.equal(L.trueRir(0, 8, 'iso'), 0);
    assert.equal(L.trueRir(2, 8), 4, 'compounds take the compound correction');
    assert.equal(L.trueRir(2, 8, 'iso'), 1, 'single-joint sets take theirs');
    assert.equal(L.trueRir(2, 3), 3, 'at most 1 rep on sets of 5 or fewer');
    assert.equal(L.trueRir(null, 8), null);
    L.use({c: 5, i: 0});
    assert.equal(L.trueRir(1, 8), 4, 'at most 3 on any set');
    assert.equal(L.e1rm(100, 8, 0).toFixed(3), (100 / L.pct(8)).toFixed(3));
  } finally { L.use({c: 0, i: 0}); }
});

test('a check from any section reaches Muscle through the hub', () => {
  const E = engine(), got = [];
  E.ctx.window.__hub = {api: m => m === 'lift' ? {addCal: r => { got.push(r); return true; }} : null};
  const r = E.Lift.calibrate({predictedRir: 2, actualExtra: 3, cls: 'lower', reps: 3, from: 'Strength'});
  assert.equal(r.error, 1); assert.equal(r.cls, 'lower'); assert.equal(got.length, 1);
  assert.equal(E.Lift.calibrate({predictedRir: 'x', actualExtra: 1}), null);
});

test('hard sets fall smoothly from 3 reps short to nothing at 7', () => {
  const {Lift: L} = engine();
  assert.deepEqual([null, 0, 1, 3, 3.5, 4, 5, 6, 7, 9].map(r => L.hard(r, 8)), [1, 1, 1, 1, 0.875, 0.75, 0.5, 0.25, 0, 0]);
});

test('the estimated max does not ratchet itself up on its own prescriptions', () => {
  const {Lift: L} = engine(), r = rng(7), T = 100, round = kg => Math.round(kg / 2.5) * 2.5;
  // a lifter whose true max stays at 100, given 5 reps at 2 in reserve from the estimate each session
  for (const start of [100, 115]) {
    const pts = []; let est = start;
    for (let i = 0; i < 48; i++) {
      const load = round(est * L.pct(7)), cap = L.reps(T, load, 0) + normal(r) * 0.7;
      const reps = Math.max(1, Math.min(5, Math.floor(cap))), rir = Math.max(0, Math.round(cap - reps));
      pts.push({date: i * 3 * DAY, e1: L.e1rm(load, reps, rir), rated: true});
      est = L.estimate(pts).value;
      if (i >= 12) assert.ok(est < 106, `session ${i}: ${est.toFixed(1)} from a start of ${start}`);
    }
    assert.ok(est > 92 && est < 106, `settles near the true max: ${est.toFixed(1)}`);
  }
  // doing exactly what it prescribes, rounded to the plates, holds it where it is
  let est = 100; const pts = [];
  for (let i = 0; i < 48; i++) { const load = round(est * L.pct(7)); pts.push({date: i * 3 * DAY, e1: L.e1rm(load, 5, 2), rated: true}); est = L.estimate(pts).value; }
  assert.ok(Math.abs(est - 100) < 3, `no climb: ${est.toFixed(1)}`);
});

test('the estimated max shrugs off one odd session and says how sure it is', () => {
  const {Lift: L} = engine();
  const pts = [100, 101, 99, 100, 140, 100].map((e1, i) => ({date: i * 3 * DAY, e1, rated: true}));
  const e = L.estimate(pts);
  assert.ok(e.value < 104, 'one high session moves it little: ' + e.value.toFixed(1));
  assert.ok(e.lo < e.value && e.hi > e.value);
  assert.equal(e.n, 6); assert.equal(e.last, 5 * 3 * DAY);
  assert.equal(L.estimate([]), null);
  const one = L.estimate([{date: 0, e1: 100, rated: false}]);
  assert.ok(one.hi - one.lo >= 9.9, 'one session: about one rep either way, twice');
  const rated = L.estimate([{date: 0, e1: 100, rated: true}, {date: DAY, e1: 110, rated: false}]);
  assert.ok(rated.value < 105, 'a rated set counts more than an unrated one');
  // two sessions: no telling which one is odd, so neither is pulled toward the other
  const two = L.estimate([{date: 0, e1: 100, rated: true}, {date: 3 * DAY, e1: 150, rated: true}]);
  const back = L.estimate([{date: 0, e1: 150, rated: true}, {date: 3 * DAY, e1: 100, rated: true}]);
  assert.ok(two.value > 120 && two.value < 130 && back.value > 120 && back.value < 130, `averaged: ${two.value.toFixed(1)}, ${back.value.toFixed(1)}`);
  assert.ok(two.hi - two.lo > 40, 'and it says how unsure it is');
  // unrated sessions left out
  const un = [0, 1, 2, 3].map(i => ({date: i * 7 * DAY, e1: 100 * Math.pow(1.05, i)}));
  assert.equal(L.estimate(un, {unrated: 0}), null, 'nothing that counts: no estimate');
  assert.equal(L.estimate(un.concat({date: 30 * DAY, e1: 90, rated: true}), {unrated: 0}).value, 90);
  assert.equal(L.trend(un, {unrated: 0}).state, 'unknown', 'nothing that counts: no trend, not a false flat');
  assert.equal(L.trend(un).state, 'up');
});

test('a trend is called only beyond the noise', () => {
  const {Lift: L} = engine(), r = rng(11);
  let quiet = 0, up = 0; const N = 500;
  for (let k = 0; k < N; k++) {
    const flat = [], rising = [];
    for (let i = 0; i < 8; i++) {
      flat.push({date: i * 3.5 * DAY, e1: 100 * (1 + 0.025 * normal(r)), rated: true});
      rising.push({date: i * 3.5 * DAY, e1: 100 * (1 + 0.01 * i) * (1 + 0.015 * normal(r)), rated: true});
    }
    const t = L.trend(flat).state; if (t === 'flat' || t === 'unknown') quiet++;
    if (L.trend(rising).state === 'up') up++;
  }
  assert.ok(quiet / N >= 0.9, `flat noise stays flat ${(100 * quiet / N).toFixed(0)}% of the time`);
  assert.ok(up / N >= 0.8, `a real gain of 2% a week shows ${(100 * up / N).toFixed(0)}% of the time`);
  assert.equal(L.trend([1, 2, 3].map(i => ({date: i * DAY, e1: 100}))).state, 'unknown', 'fewer than 4 sessions');
  assert.equal(L.trend([1, 2, 3, 4].map(() => ({date: DAY, e1: 100}))).state, 'unknown', 'all on one day');
  const down = L.trend([0, 1, 2, 3, 4, 5].map(i => ({date: i * 7 * DAY, e1: 100 - 3 * i, rated: true})));
  assert.equal(down.state, 'down'); assert.ok(down.slope < -0.02);
});

test('assisted and weighted bodyweight sets move what they move', () => {
  const {Lift: L} = engine();
  assert.equal(L.load({bw: 80, share: 0.95}), 76);
  assert.equal(L.load({bw: 80, share: 0.95, added: 10}), 86);
  assert.equal(L.load({bw: 80, share: 0.95, assist: 30}), 46, 'less help is more load');
  assert.ok(L.load({bw: 80, share: 0.95, assist: 20}) > L.load({bw: 80, share: 0.95, assist: 30}));
  assert.equal(L.load({bw: 80, share: 0.5, assist: 60}), 0, 'never below nothing');
  assert.equal(L.load({share: 0.95, added: 10}), null, 'needs your bodyweight');
  assert.equal(L.load({share: 0, added: 10}), 10);
});

test('predicted reps are the inverse of the max curve', () => {
  const {Lift: L} = engine();
  for (const cls of ['upper', 'lower', 'iso']) for (const eff of [1, 2.5, 5, 8, 12, 17, 25]) {
    assert.ok(Math.abs(L.reps(100, 100 * L.pct(eff, cls), 0, cls) - eff) < 1e-6, `${cls} ${eff}`);
    assert.ok(Math.abs(L.reps(100, 100 * L.pct(eff, cls), 2, cls) - Math.max(0, eff - 2)) < 1e-6);
  }
  const e = L.e1rm(80, 8, 2);
  assert.ok(Math.abs(L.reps(e, 80, 2) - 8) < 1e-6, 'the same load and effort gives the same reps');
  assert.equal(L.reps(100, 120, 0), 0);
  assert.equal(L.reps(0, 50, 0), null);
});

test('the kit rounds to weights you can load, as before for the default kit', () => {
  const {Kit} = engine();
  // the old rules, for the default plates: bar plus pairs of 1.25 kg, machines in 2.5, plates on a belt in 1.25
  const oldBar = kg => kg <= 20 ? 20 : 20 + Math.round((kg - 20) / 2.5) * 2.5, grid = st => kg => Math.max(0, Math.round(kg / st) * st);
  for (let kg = 0; kg <= 300; kg += 0.3713) {
    assert.equal(Kit.round(kg, 'bar', 'near', 'kg'), oldBar(kg), 'bar ' + kg);
    assert.equal(Kit.round(kg, 'stack', 'near', 'kg'), grid(2.5)(kg), 'stack ' + kg);
    assert.equal(Kit.round(kg, 'added', 'near', 'kg'), grid(1.25)(kg), 'added ' + kg);
    assert.equal(Kit.round(kg, 'plate', 'near', 'kg'), grid(2.5)(kg), 'plate ' + kg);
    if (kg >= 20) assert.equal(Kit.round(kg, 'bar', 'near', 'kg'), grid(2.5)(kg), "Muscle's barbell above the bar " + kg);
  }
  const lb = x => x * 0.45359237, inLb = kg => Math.round(kg / 0.45359237 * 1000) / 1000;
  assert.equal(inLb(Kit.round(lb(137), 'bar', 'near', 'lb')), 135);
  assert.equal(inLb(Kit.round(lb(30), 'bar', 'near', 'lb')), 45, 'never under the 45 lb bar');
  assert.equal(Kit.step('bar', 'kg'), 2.5); assert.equal(Kit.step('bar', 'lb'), 5); assert.equal(Kit.step('stack', 'kg'), 2.5); assert.equal(Kit.step('stack', 'lb'), 5);
  assert.equal(Kit.round(null, 'bar'), null);
});

test('dumbbells come from a real rack: no 22 or 24 kg, never 0', () => {
  const {Kit} = engine();
  const seen = new Set(); for (let kg = 0; kg <= 50; kg += 0.25) seen.add(Kit.round(kg, 'db', 'near', 'kg'));
  assert.deepEqual([...seen].sort((a, b) => a - b), [2, 4, 6, 8, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50]);
  assert.equal(Kit.next(10, 2, 'db', 'kg').kg, 12.5);
  assert.equal(Kit.next(12.5, -2, 'db', 'kg').kg, 10);
  const lbs = new Set(); for (let kg = 0; kg <= 30; kg += 0.2) lbs.add(Math.round(Kit.round(kg, 'db', 'near', 'lb') / 0.45359237 * 100) / 100);
  assert.ok([...lbs].every(x => x >= 5 && x % 5 === 0), 'lb dumbbells go 5, 10, 15...');
  Kit.set({dbStepKg: 1});
  assert.equal(Kit.round(7.4, 'db', 'near', 'kg'), 7); assert.equal(Kit.round(11.4, 'db', 'near', 'kg'), 12.5);
  Kit.set({dbRackKg: [5, 7.5, 12, 16]});
  assert.equal(Kit.round(14, 'db', 'near', 'kg'), 16, 'a tie goes up'); assert.equal(Kit.round(30, 'db', 'near', 'kg'), 16, 'the heaviest you have');
});

test('the next loadable weight, and when the jump is too big', () => {
  const {Kit} = engine();
  assert.deepEqual({...Kit.next(60, 2.5, 'bar', 'kg')}, {kg: 62.5, big: false, max: false, min: false});
  Kit.set({platesKg: [25, 20, 10, 5]});
  assert.deepEqual({...Kit.next(60, 2.5, 'bar', 'kg')}, {kg: 70, big: true, max: false, min: false}, 'smallest plate 5 kg: the next step is 10');
  assert.deepEqual({...Kit.next(100, 5, 'bar', 'kg')}, {kg: 110, big: false, max: false, min: false});
  assert.equal(Kit.round(64, 'bar', 'down', 'kg'), 60); assert.equal(Kit.round(61, 'bar', 'up', 'kg'), 70);
  // at the end of your kit it says so, rather than passing off the same weight as the next one
  assert.deepEqual({...Kit.next(20, -2.5, 'bar', 'kg')}, {kg: 20, big: false, max: false, min: true}, 'nothing under the bar');
  Kit.set({platesKg: [20], plateCount: {kg: {20: 1}}});
  assert.deepEqual({...Kit.next(60, 2.5, 'bar', 'kg')}, {kg: 60, big: false, max: true, min: false}, 'one pair of 20s: 60 is the most');
  Kit.set({platesKg: null, plateCount: null, dbRackKg: [2, 4, 6, 8, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30]});
  assert.deepEqual({...Kit.next(30, 2, 'db', 'kg')}, {kg: 30, big: false, max: true, min: false}, 'the heaviest dumbbells you have');
  assert.equal(Kit.next(27.5, 2, 'db', 'kg').max, false);
});

test('every jump setting moves a dumbbell up and down at every point of the rack', () => {
  for (const step of [1, 2, 2.5]) {
    const {Kit} = engine({'trainer.shell.dbStepKg': String(step)});
    let w = Kit.round(1, 'db', 'near', 'kg');
    const path = [w];
    for (let i = 0; i < 30; i++) { const n = Kit.next(w, step, 'db', 'kg').kg; assert.ok(n > w, `jump ${step}: up from ${w}`); w = n; path.push(w); }
    for (let i = path.length - 1; i > 0; i--) assert.equal(Kit.next(path[i], -step, 'db', 'kg').kg < path[i], true, `jump ${step}: down from ${path[i]}`);
    if (step === 1) assert.deepEqual(path.slice(8, 13), [9, 10, 12.5, 15, 17.5], 'past 10 kg, the rack goes up in 2.5');
  }
  const lb = engine({'trainer.shell.dbStepLb': '5'}).Kit;
  let w = lb.round(5 * 0.45359237, 'db', 'near', 'lb');
  for (let i = 0; i < 20; i++) { const n = lb.next(w, 5 * 0.45359237, 'db', 'lb').kg; assert.ok(n > w); w = n; }
});

test('plates for each side use the plates you have, their counts and collars', () => {
  const {Kit} = engine();
  assert.deepEqual(JSON.parse(JSON.stringify(Kit.plates(100, 'bar', 'kg'))), [{p: 25, c: 1}, {p: 15, c: 1}]);
  assert.deepEqual(JSON.parse(JSON.stringify(Kit.plates(20, 'bar', 'kg'))), []);
  assert.equal(Kit.plates(101, 'bar', 'kg'), null, 'can’t be made');
  assert.equal(Kit.plates(10, 'bar', 'kg'), null, 'under the bar');
  Kit.set({plateCount: {kg: {25: 0, 20: 1}}});
  assert.deepEqual(JSON.parse(JSON.stringify(Kit.plates(100, 'bar', 'kg'))), [{p: 20, c: 1}, {p: 15, c: 1}, {p: 5, c: 1}], 'no 25s, one pair of 20s');
  Kit.set({plateCount: null, collarKg: 2.5});
  assert.deepEqual(JSON.parse(JSON.stringify(Kit.plates(100, 'bar', 'kg'))), [{p: 25, c: 1}, {p: 10, c: 1}, {p: 2.5, c: 1}], 'collars count');
  assert.equal(Kit.round(21, 'bar', 'near', 'kg'), 25, 'the empty bar is heavier with collars on');
  Kit.set({collarKg: 0, platesKg: [2.5, 2]});
  assert.deepEqual(JSON.parse(JSON.stringify(Kit.plates(28, 'bar', 'kg'))), [{p: 2, c: 2}], 'finds 2 + 2 where 2.5 first fails');
  assert.deepEqual(JSON.parse(JSON.stringify(Kit.plates(60, 'trap', 'kg'))).length > 0, true);
  assert.equal(Kit.bar('trap', 'kg'), 25); assert.equal(Kit.bar('ez', 'lb'), 25);
});

test('any bar in either unit', () => {
  const {Kit} = engine();
  assert.equal(Kit.bar('bar', 'lb'), 45);
  Kit.setBar(35, 'lb', 'lb'); assert.equal(Kit.bar('bar', 'lb'), 35); assert.ok(Kit.barIs(35, 'lb', 'lb'));
  Kit.setBar(20, 'kg', 'lb'); assert.ok(Math.abs(Kit.bar('bar', 'lb') - 44.0925) < 1e-3); assert.ok(Kit.barIs(20, 'kg', 'lb'));
  Kit.setBar(45, 'lb', 'kg'); assert.ok(Math.abs(Kit.bar('bar', 'kg') - 20.4117) < 1e-3);
  assert.equal(Kit.BARS.length, 6);
});

test("the kit starts from what you set in Strength or Muscle, so nothing changes on upgrade", () => {
  const strength = JSON.stringify({settings: {platesKg: [20, 10, 5], platesLb: [45, 10], barKg: 15}});
  const muscle = JSON.stringify({settings: {platesKg: [25, 2.5], barKg: 10}});
  let E = engine({'strlog.v2': strength, 'hyplog.v1': muscle});
  assert.deepEqual([...E.Kit.get('kg').plates], [20, 10, 5]); assert.equal(E.Kit.get('kg').bar, 15); assert.deepEqual([...E.Kit.get('lb').plates], [45, 10]);
  E = engine({'hyplog.v1': muscle});
  assert.deepEqual([...E.Kit.get('kg').plates], [25, 2.5]); assert.equal(E.Kit.get('kg').bar, 10);
  // Strength opened once saves its defaults; what you set in Muscle still wins, one setting at a time
  const strDefault = JSON.stringify({settings: {barKg: 20, platesKg: [25, 20, 15, 10, 5, 2.5, 1.25], platesLb: [45, 35, 25, 10, 5, 2.5]}});
  E = engine({'strlog.v2': strDefault, 'hyplog.v1': JSON.stringify({settings: {barKg: 15, platesKg: [20, 10, 5, 2.5], platesLb: [45, 25, 10, 5, 2.5, 1.25]}})});
  assert.equal(E.Kit.get('kg').bar, 15); assert.deepEqual([...E.Kit.get('kg').plates], [20, 10, 5, 2.5]); assert.deepEqual([...E.Kit.get('lb').plates], [45, 25, 10, 5, 2.5, 1.25]);
  assert.equal(E.Kit.step('bar', 'kg'), 5, "Muscle's 2.5 kg plates, two at a time");
  E = engine({'strlog.v2': JSON.stringify({settings: {barKg: 15}}), 'hyplog.v1': JSON.stringify({settings: {platesKg: [20, 10, 5]}})});
  assert.equal(E.Kit.get('kg').bar, 15, "Strength's bar"); assert.deepEqual([...E.Kit.get('kg').plates], [20, 10, 5], "and Muscle's plates, which Strength never saved");
  E = engine({'strlog.v2': JSON.stringify({settings: {platesKg: [25, 20, 15, 10, 5, 2.5, 1.25]}}), 'hyplog.v1': JSON.stringify({settings: {platesKg: [1.25, 2.5, 25, 20, 15, 10, 5]}})});
  assert.deepEqual([...E.Kit.get('kg').plates], [25, 20, 15, 10, 5, 2.5, 1.25], 'the same plates in another order are still the defaults');
  E = engine({'trainer.shell.dbStepKg': '2.5', 'trainer.shell.stackStepKg': '5'});
  assert.equal(E.Kit.step('db', 'kg'), 2.5); assert.equal(E.Kit.step('stack', 'kg'), 5, 'the jumps you chose are kept');
  E = engine();
  assert.equal(E.Kit.get('kg').stack, 2.5, 'one machine default'); assert.equal(E.Kit.get('lb').stack, 5);
});

test('one bodyweight log: the 7-day average and its trend, Strength’s weight until then', () => {
  const now = Date.UTC(2026, 9, 1, 8), log = [];
  for (let i = 35; i >= 0; i--) log.push({date: now - i * DAY, kg: 80 - 0.1 * (35 - i) + (i % 2 ? 0.3 : -0.3)});
  const {Body} = engine({'strlog.v2': JSON.stringify({settings: {bw: 82}})});
  const t = Body.trend(28, log, now);
  assert.equal(t.n, 29);
  assert.ok(Math.abs(t.kgPerWeek + 0.7) < 0.05, 'losing about 0.7 kg a week: ' + t.kgPerWeek.toFixed(2));
  assert.ok(Math.abs(t.smoothed - 76.8) < 0.15, 'the 7-day average: ' + t.smoothed.toFixed(2));
  assert.equal(Body.trend(28, log.slice(-3), now).kgPerWeek, null, 'under a week of readings');
  assert.equal(Body.at(now - 5 * DAY, log), log[30].kg);
  assert.equal(Body.at(now - 100 * DAY, log), log[0].kg, 'before the log: the first reading');
  assert.equal(Body.at(now, []), 82, "nothing logged: Strength's weight");
  assert.deepEqual({...Body.latest([])}, {date: null, kg: 82});
  assert.equal(Body.latest(log).kg, log[log.length - 1].kg);
  const E = engine(), saved = [];
  E.ctx.window.__hub = {has: () => true, api: () => ({bodyLog: () => [{date: 1, kg: 70}], logBody: (kg, ts) => { saved.push([kg, ts]); return true; }})};
  assert.equal(E.Body.at(5), 70, 'the log is read through Muscle');
  assert.equal(E.Body.log(71, 99), true); assert.deepEqual(saved, [[71, 99]]);
});

// Muscle's and Strength's own kit helpers, run from app.js with the engine's Kit.
function muscleKit(E, unit) {
  const a = app.indexOf('function kitEq(eq, kg)'), b = app.indexOf('function suggestLoad(', a);
  return new Function('Kit', 'unit', 'KG_PER_LB', app.slice(a, b) + '; return {kitEq, roundLoad, lighter};')(E.Kit, () => unit, 0.45359237);
}
function strengthKit(E, EX) {
  const a = app.indexOf("function roundLoad(kg, eq){ return Kit.round(kg, eq, 'near', u()); }"), b = app.indexOf('function platesFor(', a);
  return new Function('Kit', 'u', 'EX', 'isLb', 'fromDisp', 'stepDisp', 'eqOf', app.slice(a, b) + '; return {upLoad, lighter, roundLoad};')(
    E.Kit, () => 'kg', EX, () => false, v => v, eq => E.Kit.step(eq, 'kg'), id => EX[id].k === 'added' ? 'added' : EX[id].eq || 'none');
}

test('a bar picked in the other unit still counts as the bar in Muscle', () => {
  for (const [unit, n, bu] of [['kg', 45, 'lb'], ['lb', 20, 'kg']]) {
    const E = engine({'trainer.shell.unit': JSON.stringify(unit)}), M = muscleKit(E, unit);
    E.Kit.setBar(n, bu, unit);
    const bar = E.Kit.round(0, 'bar', 'near', unit);
    assert.equal(M.kitEq('Barbell', bar), 'bar', `${n} ${bu} bar in ${unit}`);
    assert.ok(Math.abs(M.roundLoad(bar, 'Barbell') - bar) < 1e-4, `the empty bar stays the empty bar: ${M.roundLoad(bar, 'Barbell')}`);
    assert.ok(Math.abs(M.roundLoad(bar - 0.004, 'Barbell') - bar) < 1e-4, 'and so does what it shows as');
  }
  const M = muscleKit(engine(), 'kg');
  assert.equal(M.kitEq('Barbell', 15), 'plate', 'under the bar: plates alone, as before');
});

test('deloads and resets always come out lighter, and progressions heavier, on a dumbbell rack', () => {
  const E = engine(), M = muscleKit(E, 'kg');
  assert.equal(M.lighter(12.5, 0.9, 'Dumbbell'), 10, '11.25 rounds back up to 12.5, so the next one down');
  assert.equal(M.lighter(15, 0.95, 'Dumbbell'), 12.5);
  assert.equal(M.lighter(2, 0.9, 'Dumbbell'), 2, 'nothing lighter than the lightest');
  assert.equal(M.lighter(100, 0.9, 'Barbell'), 90, 'the default bar as before');
  assert.equal(M.lighter(62.5, 0.9, 'Barbell'), 57.5);
  const S1 = engine({'trainer.shell.dbStepKg': '1'}), S = strengthKit(S1, {db: {eq: 'db', k: 'load'}, squat: {eq: 'bar', k: 'load', lower: true}});
  let w = 6; const path = [w];
  for (let i = 0; i < 7; i++) { w = S.upLoad(w, 'db').kg; path.push(w); }
  assert.deepEqual(path, [6, 7, 8, 9, 10, 12.5, 15, 17.5], "Strength's 1 kg dumbbell jumps don't stall at 10 kg");
  assert.equal(S.lighter(12.5, 0.9, 'db'), 10, "Strength's reset after three misses");
  assert.equal(strengthKit(engine(), {squat: {eq: 'bar', k: 'load', lower: true}}).upLoad(100, 'squat').kg, 100 + 5, 'the barbell as before (incKg 5 for lower body)');
});
