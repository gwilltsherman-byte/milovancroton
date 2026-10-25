const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run Together's own factory from app.js (its UI boot left out) against a stand-in hub, so these check the production
// planner: the order of a day, heavy squats and hinges apart, week 5, the end-of-block rule, sore joints, the 4 a.m.
// cutoff and real weekdays.
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const DAY = 864e5;

// Strength's lifts as the stand-in hub knows them: area, name, and the kit each needs.
const EX = {
  squat: {n: 'Back Squat', a: 'legs', need: 'bar'}, legpress: {n: 'Leg Press', a: 'legs', need: 'machine'},
  deadlift: {n: 'Deadlift', a: 'hips', need: 'bar'}, bench: {n: 'Bench Press', a: 'chest', need: 'bar'},
  dbbench: {n: 'Dumbbell Bench Press', a: 'chest', need: 'db'}, row: {n: 'Barbell Row', a: 'back', need: 'bar'},
  mrow: {n: 'Chest-Supported Row', a: 'back', need: 'machine'}, ohp: {n: 'Overhead Press', a: 'shoulders', need: 'bar'},
  pulldown: {n: 'Lat Pulldown', a: 'lats', need: 'cable'},
};
const GROUP = {legs: {p: ['quad', 'glute'], s: ['ham']}, hips: {p: ['ham', 'glute'], s: ['lback']}, chest: {p: ['chest'], s: ['fdelt', 'tri']},
  back: {p: ['uback', 'lat'], s: ['bi', 'rdelt']}, shoulders: {p: ['fdelt'], s: ['sdelt', 'tri']}, lats: {p: ['lat'], s: ['bi', 'uback']}};

function together() {
  const start = app.indexOf('  mix: function(__root){');
  assert.ok(start >= 0, 'Together factory exists');
  const bodyStart = app.indexOf('\n', start);
  const end = app.indexOf('/* ==================== BOOT ==================== */', bodyStart);
  assert.ok(end > bodyStart, 'Together boot boundary exists');
  const noOp = () => {};
  const element = () => ({innerHTML: '', classList: {add: noOp, remove: noOp, toggle: noOp}, addEventListener: noOp, focus: noOp, setAttribute: noOp});
  const root = {querySelector: element, querySelectorAll: () => [], addEventListener: noOp};
  const apis = {};
  const hub = {
    api: m => apis[m] || null, has: m => !!apis[m], reg: (m, a) => { apis[m] = a; },
    sets: () => ({direct: {}, frac: {}, by: {}, fby: {}, keys: {}, total: 0}),
    muscles: (key, group) => GROUP[group] || {p: [], s: []},
    changed: noOp, on: noOp, go: noOp, away: noOp, current: () => 'mix',
  };
  const context = vm.createContext({
    __root: root, Date, Math, JSON, Set, Map, console, Intl,
    setTimeout: () => 1, clearTimeout: noOp, setInterval: () => 1, clearInterval: noOp,
    window: {scrollTo: noOp, addEventListener: noOp, __hub: hub, scrollY: 0},
    document: {addEventListener: noOp, getElementById: () => null}, navigator: {},
    localStorage: {getItem: () => null, setItem: noOp, removeItem: noOp},
    MiloSecurity: {html: value => value, parseSection: value => JSON.parse(value)},
    Safe: {put: noOp, rescue: noOp},
  });
  vm.runInContext(app.slice(0, app.indexOf('/* ==================== BACK ====================')), context, {filename: 'app.js:HOWTO'});
  const shared = app.indexOf('/* ==================== SETS NOT TICKED OFF ====================');
  vm.runInContext(app.slice(shared, app.indexOf('/* ==================== TAKE BACK ====================', shared)), context, {filename: 'app.js:shared'});
  ['Prefs', 'Lift', 'Num', 'Day', 'Kit', 'Body', 'GROWTH', 'SAME_LIFT', 'OpenSets', 'Parked'].forEach(k => { context[k] = context.window[k]; });
  vm.runInContext(`(function(__root) { ${app.slice(bodyStart, end)}
    globalThis.tgTest = {
      reset: o => { tg = Object.assign(load(), o || {}); fresh(); },
      tg: () => tg,
      evaluate: expression => eval(expression),
    };
  })(__root);`, context, {filename: 'app.js:Together'});
  const T = context.tgTest;
  T.apis = apis;
  T.call = (name, ...args) => T.evaluate(name)(...args);
  return T;
}

// A stand-in Strength: every lift your kit allows, its numbers, and its sessions for Lift.trend.
function strApi(points = []) {
  const allowed = (a, kit) => Object.keys(EX).filter(id => EX[id].a === a && (kit || []).includes(EX[id].need));
  return {
    pick: (a, kit) => allowed(a, kit)[0] || null,
    options: (a, kit) => allowed(a, kit).map(id => ({id, n: EX[id].n})),
    lift: id => EX[id] ? {id, n: EX[id].n, a: EX[id].a, k: 'load', key: id, e1: 100, work: null, bar: EX[id].need === 'bar'} : null,
    preview: (id, sc) => ({sets: sc.sets || (sc.n || 0) + 1, sum: ''}),
    info: () => ({ready: true}), work: () => [], points: () => points,
  };
}
const plain = v => JSON.parse(JSON.stringify(v));
// Heavy lifts by day, as a list of areas: [['legs','chest'], ['hips'], ...]
const heavyByDay = P => P.days.map(d => d.str.filter(x => x.heavy).map(x => x.a));

test('every day runs in one order whatever your ranking: skills, heavy lifts, Ladder strength, then Muscle', () => {
  const T = together();
  const I = {cal: {picks: [{id: 'planche', skill: true}, {id: 'wrist', prep: true, when: 'warm'}, {id: 'dip', goal: true}, {id: 'row'}]}};
  // Muscle ranked first changes nothing about the order of the day
  T.reset({on: true, secs: ['lift', 'str', 'cal'], prio: ['lift', 'cal', 'str']});
  assert.deepEqual(plain(T.call('dayParts', ['lift', 'str', 'cal'], I)), [{m: 'cal', seg: 'skill'}, {m: 'str'}, {m: 'cal', seg: 'main'}, {m: 'lift'}]);
  // Ladder's skills and their warm-up go first, its strength work after the heavy lifts
  assert.deepEqual(plain(T.call('segPicks', I.cal.picks, 'skill')).map(x => x.id), ['planche', 'wrist']);
  assert.deepEqual(plain(T.call('segPicks', I.cal.picks, 'main')).map(x => x.id), ['dip', 'row']);
  // only skills: Ladder goes first, whole; no skills: after the heavy lifts
  assert.deepEqual(plain(T.call('dayParts', ['str', 'cal', 'lift'], {cal: {picks: [{id: 'handstand', skill: true}]}})), [{m: 'cal'}, {m: 'str'}, {m: 'lift'}]);
  assert.deepEqual(plain(T.call('dayParts', ['lift', 'cal', 'str'], {cal: {picks: [{id: 'pull'}]}})), [{m: 'str'}, {m: 'cal'}, {m: 'lift'}]);
  // where two parts overlap, the earlier in the day keeps its work
  assert.equal(T.call('ahead', 'str', 'lift'), true);
  assert.equal(T.call('ahead', 'lift', 'cal'), false);
  // Muscle: compounds, then isolation, then core; the muscles you want more of first within each
  const xs = [{n: 'crunch', p: ['abs'], comp: false}, {n: 'curl', p: ['bi'], comp: false}, {n: 'raise', p: ['sdelt'], comp: false, more: true},
    {n: 'squat', p: ['quad'], comp: true}, {n: 'row', p: ['uback'], comp: true, more: true}];
  assert.deepEqual(xs.slice().sort((a, b) => T.call('liftRank', a) - T.call('liftRank', b)).map(x => x.n), ['row', 'squat', 'raise', 'curl', 'crunch']);
});

test('a heavy squat and a heavy hinge never share a day, and sit 48 hours apart when the weekdays allow', () => {
  const T = together();
  T.apis.str = strApi();
  const kit = ['bar', 'db', 'machine', 'cable'];
  const ranks = {build: ['str', 'lift', 'cal'], moderate: ['lift', 'str', 'cal'], maintain: ['lift', 'cal', 'str']};
  for (const [dose, prio] of Object.entries(ranks)) for (let days = 2; days <= 6; days++) {
    T.reset({on: true, secs: dose === 'build' ? ['str'] : ['str', 'lift', 'cal'], prio, days, kit, mins: 0});
    const P = T.evaluate('buildPlan()'), PW = plain(T.call('wdays', days)), heavy = heavyByDay(P);
    const sd = P.days.map((d, i) => d.str.length ? i : -1).filter(i => i >= 0);
    const sq = heavy.findIndex(h => h.includes('legs')), hi = heavy.findIndex(h => h.includes('hips'));
    assert.ok(sq >= 0 && hi >= 0, `${dose} ${days}: both have a heavy day`);
    if (sd.length < 2) {
      // one Strength day: they take turns, week by week
      const both = P.days[sq].str.filter(x => x.heavy && (x.a === 'legs' || x.a === 'hips'));
      assert.deepEqual(plain(both.map(x => x.alt)).sort(), [0, 1], `${dose} ${days}: squat and hinge alternate`);
      continue;
    }
    assert.notEqual(sq, hi, `${dose} ${days}: different days`);
    const gap = T.call('gapOf', PW, sq, hi), best = Math.max(...sd.flatMap(i => sd.map(j => i === j ? 0 : T.call('gapOf', PW, i, j))));
    if (best >= 2) assert.ok(gap >= 2, `${dose} ${days}: ${gap} days between heavy squat and hinge`);
    // heavy lifts spread over the Strength days: no day has two more heavy lifts than another
    const n = sd.map(i => heavy[i].length);
    assert.ok(Math.max(...n) - Math.min(...n) <= 1, `${dose} ${days}: heavy lifts balanced ${n}`);
  }
});

test('your weekdays set the spacing: Saturday and Sunday are back to back', () => {
  const T = together();
  T.reset({on: true, secs: ['str'], days: 2});
  assert.deepEqual(plain(T.call('wdays', 2)), [0, 3]);
  T.reset({on: true, secs: ['str'], days: 2, wd: [5, 6]});
  assert.deepEqual(plain(T.call('wdays', 2)), [5, 6]);
  // the gap that wraps into next week counts too
  assert.equal(T.call('gapOf', [5, 6], 0, 1), 1);
  assert.equal(T.call('gapOf', [0, 6], 0, 1), 1);
  assert.equal(T.call('gapOf', [0, 3], 0, 1), 3);
  assert.equal(T.call('tight', [0, 1], [5, 6]), 1);
  assert.equal(T.call('tight', [0, 1], [0, 3]), 0);
  assert.equal(T.call('adjacent', [5, 6], 0), true);
  assert.equal(T.call('adjacent', [0, 3], 0), false);
  assert.ok(T.call('spacing', [0, 1], [5, 6]) > T.call('spacing', [0, 1], [0, 3]));
  // three of Monday, Tuesday, Thursday, Friday: the spread one wins
  const best = T.call('choose', 3, 4, sel => T.call('spacing', sel, [0, 1, 3, 4]));
  assert.ok(T.call('tight', plain(best), [0, 1, 3, 4]) <= 1);
  // weekdays you pick are kept, sorted, only when they match your number of days
  assert.deepEqual(plain(T.tg().wd), [5, 6]);
  T.apis.str = strApi();
  T.reset({on: true, secs: ['str'], days: 2, wd: [5, 6], kit: ['bar'], mins: 0});
  const P = T.evaluate('buildPlan()'), heavy = heavyByDay(P);
  assert.notEqual(heavy.findIndex(h => h.includes('legs')), heavy.findIndex(h => h.includes('hips')));
});

test('week 5 is decided once: lighter when you need it, otherwise a top week', () => {
  const T = together();
  const rule = o => plain(T.call('w5Rule', o));
  assert.deepEqual(rule({down: 0, z: 0.2, joint: 0}), {kind: 'top', why: []});
  assert.deepEqual(rule({down: 2, z: null, joint: 0}), {kind: 'light', why: ['perf']});   // no check-ins: performance still decides
  assert.deepEqual(rule({down: 1, z: -0.9, joint: 1}), {kind: 'top', why: []});
  assert.deepEqual(rule({down: 0, z: -1, joint: 0}), {kind: 'light', why: ['well']});
  assert.deepEqual(rule({down: 0, z: null, joint: 2}), {kind: 'light', why: ['joint']});
  // from logged sessions: two lifts falling outside the noise make it lighter, and it stays decided
  const now = Date.now(), pts = drop => Array.from({length: 8}, (_, k) => ({date: now - (28 - k * 3.5) * DAY, e1: 100 * (1 - drop * k), rated: true}));
  const falling = [{id: 'squat', a: 'legs', key: 'squat', pts: pts(0.02)}, {id: 'bench', a: 'chest', key: 'bench', pts: pts(0.02)}];
  T.apis.str = strApi(falling);
  T.reset({on: true, secs: ['str'], days: 3, kit: ['bar']});
  const P = T.evaluate('plan()');
  P.at = now - 35 * DAY; P.week = 4;
  assert.equal(T.call('w5Of', P), null, 'not decided before week 5');
  P.week = 5;
  const w5 = plain(T.call('w5Of', P));
  assert.equal(w5.kind, 'light');
  assert.deepEqual(w5.why, ['perf']);
  T.apis.str.points = () => [];
  assert.equal(T.call('w5Of', P).kind, 'light', 'kept once decided');
  // the top week: a single at RPE 8 then back-off sets; a gentler block works up to a triple at RPE 7
  const x = {id: 'squat', a: 'legs', k: 'load', heavy: true, sets: 4, bar: true};
  assert.deepEqual(plain(T.call('strScheme', x, 5, 'top')), {t: 'top', reps: 1, n: 3, drop: 0.1, bor: 3, rpe: 8});
  assert.equal(T.call('strScheme', x, 5, 'light').sets, 2);
  assert.equal(T.call('strScheme', x, 5, 'light').rpe, 6);
  // never a copy of week 4
  assert.notDeepEqual(plain(T.call('strScheme', x, 5, 'top')), plain(T.call('strScheme', x, 4, null)));
  T.reset({on: true, secs: ['str'], stage: 'u18'});
  assert.equal(T.call('strScheme', x, 5, 'top').rpe, 7);
  assert.ok(T.call('strScheme', x, 4, null).rpe <= 7, 'gentle blocks stay at RPE 7 or less');
});

test('new lifters start with linear practice, and nothing goes to failure', () => {
  const T = together();
  const x = {id: 'squat', a: 'legs', k: 'load', heavy: true, sets: 4, bar: true};
  T.reset({on: true, secs: ['str', 'lift'], exp: 'beginner'});
  assert.deepEqual(plain(T.call('strScheme', x, 3, null)), {t: 'lp', sets: 3, reps: 5});
  assert.equal(T.call('strScheme', Object.assign({}, x, {heavy: false}), 3, null).rpe, 6);
  assert.equal(T.evaluate('noFail()'), true);
  assert.ok(T.evaluate('LIFT_RIR_EASY').every(r => r >= 2), 'Muscle keeps 2 or more reps in reserve');
  // a health-check yes: a gentler block, without blocking anything
  T.reset({on: true, secs: ['str'], screen: {at: 1, yes: [2], blk: 0}});
  assert.equal(T.evaluate('gentle()'), true);
  T.reset({on: true, secs: ['str'], screen: {at: 1, yes: [], blk: 0}});
  assert.equal(T.evaluate('gentle()'), false);
});

test('the end-of-block rule changes a muscle only with enough data, and only with recovery data to add', () => {
  const T = together();
  const step = o => { const r = T.call('volStep', o); return r ? plain(r) : null; };
  const good = {n: 4, sore: 2, hurt: false, low: 0};
  assert.equal(step({states: ['flat'], ...good}), null, 'one exercise is not enough');
  assert.equal(step({states: ['flat', 'unknown'], ...good}), null);
  assert.equal(step({states: ['flat', 'flat'], ...good}).to, 2, 'stalled and recovering well: +2');
  assert.equal(step({states: ['flat', 'flat'], n: 0, sore: null, hurt: false, low: null}), null, 'no check-ins: unknown, no change');
  assert.equal(step({states: ['flat', 'flat'], ...good, cur: 6}), null, 'capped');
  assert.equal(step({states: ['down', 'down'], n: 3, sore: 6, hurt: false}).to, -2, 'falling while sore: −2');
  assert.equal(step({states: ['down', 'flat'], n: 0, sore: null, hurt: true}).to, -2, 'falling with a sore joint: −2');
  assert.equal(step({states: ['down', 'down'], n: 0, sore: null, hurt: false}), null, 'falling, recovery unknown');
  assert.equal(step({states: ['up', 'up'], ...good, cur: 2}).to, 1, 'progressing: an earlier change eases back');
  assert.equal(step({states: ['up', 'flat'], ...good, cur: -2}).to, -1);
  assert.equal(step({states: ['up', 'up'], ...good}), null);
  // from Muscle's and Strength's lifts: a muscle needs two exercises with four sessions each
  const now = Date.now(), flat = n => Array.from({length: n}, (_, k) => ({date: now - (30 - k * 4) * DAY, e1: 100 + (k % 2) * 0.3, rated: true}));
  T.apis.lift = {points: () => [{id: 'barbell-bench', p: ['chest'], pts: flat(6)}, {id: 'db-fly', p: ['chest'], pts: flat(6)}, {id: 'curl', p: ['bi'], pts: flat(3)}],
    table: () => null, catalog: () => [], info: () => ({ready: true}), work: () => []};
  T.apis.str = strApi([{id: 'row', a: 'back', key: 'row', pts: flat(6)}]);
  const at = now - 35 * DAY, ci = Array.from({length: 4}, (_, k) => ({day: T.evaluate('Day.start')(now - (20 - k * 5) * DAY), w: {sleep: 5, energy: 5, stress: 5, mood: 5}, sore: {chest: 2, bi: 2, uback: 2}}));
  T.reset({on: true, secs: ['str', 'lift'], checkins: ci});
  T.tg().plan = {at, week: 5, weeks: 5};
  T.evaluate('learnVolume()');
  assert.deepEqual(plain(T.tg().adj), {chest: 2}, 'chest stalled on two exercises; biceps has too few sessions; upper back one lift');
  // no check-ins: nothing changes
  T.reset({on: true, secs: ['str', 'lift'], checkins: []});
  T.tg().plan = {at, week: 5, weeks: 5};
  T.evaluate('learnVolume()');
  assert.deepEqual(plain(T.tg().adj), {});
});

test('joint pain changes the movements that load the joint, Strength included', () => {
  const T = together();
  const loads = (name, j) => T.call('loads', {name}, j), lad = (gid, j) => T.call('loads', {gid}, j);
  for (const n of ['Barbell Row', 'Deadlift', 'Romanian Deadlift', 'Good Morning', 'Back Squat', 'Front Squat']) assert.ok(loads(n, 'back'), `${n} loads the lower back`);
  for (const n of ['Leg Press', 'Chest-Supported Row', 'Bench Press', 'Leg Extension', 'Bulgarian Split Squat']) assert.ok(!loads(n, 'back'), `${n} spares the lower back`);
  for (const n of ['Bench Press', 'Overhead Press', 'Push-up', 'Dips']) assert.ok(loads(n, 'wrist'), `${n} loads the wrist`);
  for (const n of ['Back Squat', 'Leg Press', 'Walking Lunge', 'Leg Extension', 'Leg Curl', 'Box Jump']) assert.ok(loads(n, 'knee'), `${n} loads the knee`);
  for (const n of ['Calf Raise', 'Deadlift', 'Bench Press']) assert.ok(!loads(n, 'knee'), `${n} spares the knee`);
  for (const n of ['Overhead Press', 'Dips', 'Bench Press', 'Pull-up', 'Lat Pulldown']) assert.ok(loads(n, 'shoulder'), `${n} loads the shoulder`);
  for (const n of ['Straight-Arm Pulldown', 'Pull-up', 'Seated Cable Row', 'Barbell Curl']) assert.ok(loads(n, 'elbow'), `${n} loads the elbow`);
  assert.ok(!loads('Lateral Raise', 'elbow') && !loads('Leg Curl', 'elbow'), 'a lateral raise and a leg curl spare the elbow');
  assert.ok(lad('planche', 'wrist') && lad('planche', 'elbow') && lad('handstand', 'wrist') && lad('frontlever', 'elbow') && lad('legs', 'knee') && lad('hinge', 'back'));
  assert.ok(!lad('frontlever', 'wrist') && !lad('core', 'knee'));
  // Strength: at 6 or more the swap is made (a supported row); with no gentler lift in your kit, capped at RPE 6
  T.apis.str = strApi();
  T.reset({on: true, secs: ['str'], kit: ['bar', 'machine']});
  const day = T.evaluate('Day.start')(Date.now());
  const slot = (id, sc) => ({id, name: EX[id].n, area: EX[id].a, key: id, k: 'load', sets: sc.sets || 4, sum: '', sc, heavy: true});
  const I = {str: {next: {slots: [slot('row', {t: 'rpe', sets: 4, reps: 5, rpe: 8}), slot('deadlift', {t: 'rpe', sets: 4, reps: 5, rpe: 8}), slot('bench', {t: 'rpe', sets: 4, reps: 5, rpe: 8})]}}};
  let A = T.call('jointAdjust', I, {day, joints: {back: {p: 7, lv: 'high'}}});
  let s = plain(A.I.str.next.slots);
  assert.equal(s[0].id, 'mrow', 'barbell row swapped for a supported row');
  assert.equal(s[1].id, 'deadlift');
  assert.deepEqual([s[1].sc.t, s[1].sc.rpe], ['rpe', 6], 'the deadlift capped at RPE 6');
  assert.equal(s[2].sc.rpe, 8, 'the bench is left alone');
  assert.ok(A.notes.str.length >= 2);
  // at 3 to 5 a swap is offered, and taken only when you say so
  A = T.call('jointAdjust', I, {day, joints: {back: {p: 4, lv: 'watch'}}});
  assert.equal(A.I.str.next.slots[0].id, 'row');
  assert.deepEqual(plain(A.offers).map(o => [o.from, o.to]), [['row', 'mrow']]);
  T.tg().swap = {day, ids: ['row']};
  assert.equal(T.call('jointAdjust', I, {day, joints: {back: {p: 4, lv: 'watch'}}}).I.str.next.slots[0].id, 'mrow');
  // a badly sore wrist, elbow or shoulder asks Ladder to hold that work for a week; a Ladder without it carries on
  A = T.call('jointAdjust', {cal: {picks: [{id: 'planche', step: 'Tuck planche'}, {id: 'legs', step: 'Pistol'}]}}, {day, joints: {wrist: {p: 7, lv: 'high'}}});
  assert.deepEqual(plain(A.I.cal.picks).map(x => x.id), ['legs']);
  assert.deepEqual(plain(A.hold), ['wrist']);
  const held = [];
  T.reset({on: true, secs: ['cal']});
  T.apis.cal = {hold: (j, d) => held.push([j, d])};
  T.call('holdLadder', ['wrist', 'elbow']);
  assert.deepEqual(held, [['wrist', 7], ['elbow', 7]]);
  delete T.apis.cal.hold;
  assert.doesNotThrow(() => T.call('holdLadder', ['wrist']));
});

test('a day stays open until 4 a.m., or 6 hours after its last part', () => {
  const T = together();
  const at = new Date(2026, 2, 10, 19, 0).getTime(), four = new Date(2026, 2, 11, 4, 0).getTime();
  assert.equal(T.call('closesAt', {at, last: new Date(2026, 2, 10, 21, 0).getTime()}), four);
  assert.equal(T.call('closesAt', {at, last: new Date(2026, 2, 10, 23, 30).getTime()}), new Date(2026, 2, 11, 5, 30).getTime());
  // a part finished after midnight is still the same day
  assert.ok(new Date(2026, 2, 11, 0, 40).getTime() < T.call('closesAt', {at, last: new Date(2026, 2, 10, 23, 0).getTime()}));
  // an old run with no last activity closes at 4 a.m. after the day it began
  assert.equal(T.call('closesAt', {date: new Date(2026, 2, 10).getTime()}), four);
});

test('fatigue carries in the shape of soreness, helping muscles at half, Muscle’s own sets too', () => {
  const T = together();
  const now = Date.now(), t0 = T.evaluate('Day.start')(now);
  const W = [{at: t0 - 0.5 * DAY, w: {p: ['chest'], s: ['tri'], n: 3, f: 3}}, {at: t0 - 1.5 * DAY, w: {p: ['quad'], s: [], n: 3, f: 3}}];
  T.apis.lift = {work: (a, b) => W.filter(x => x.at >= a && x.at < b).map(x => x.w), table: () => null, info: () => ({ready: true})};
  T.reset({on: true, secs: ['lift']});
  const C = plain(T.call('carryOver', now));
  assert.equal(C.by.chest.lift, 3 * 0.6, 'yesterday at 0.6');
  assert.equal(C.by.tri.lift, 1.5 * 0.6, 'a helping muscle at half');
  assert.equal(C.by.quad.lift, 3, 'the day before in full');
});

test('a low day needs a bigger drop, or two low answers', () => {
  const T = together();
  const start = T.evaluate('Day.start')(Date.now()), w = v => ({sleep: v, energy: v, stress: v, mood: v});
  const ci = Array.from({length: 14}, (_, k) => ({day: start - (14 - k) * DAY, w: w(k % 2 ? 5 : 4)}));
  T.reset({on: true, secs: ['lift'], checkins: ci});
  const ready = c => plain(T.call('readyOf', c));
  assert.equal(ready({day: start, w: w(4)}).ease, 0, 'an ordinary swing');
  assert.equal(ready({day: start, w: {sleep: 2, energy: 2, stress: 5, mood: 5}}).ease, 1, 'two answers at 1 or 2');
  assert.equal(ready({day: start, w: w(3)}).ease, 1, 'well below your usual');
});
