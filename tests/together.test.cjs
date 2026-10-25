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
  assert.deepEqual(plain(T.call('strScheme', x, 3, null)), {t: 'lp', sets: 3, reps: 5, intro: true});
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
  assert.equal(step({states: ['flat', 'flat'], stall: true, ...good}).to, 2, 'stalled and recovering well: +2');
  assert.equal(step({states: ['flat', 'flat'], ...good}), null, 'flat only because the noise hides any trend: no change');
  assert.equal(step({states: ['flat', 'flat'], stall: true, n: 0, sore: null, hurt: false, low: null}), null, 'no check-ins: unknown, no change');
  assert.equal(step({states: ['flat', 'flat'], stall: true, ...good, cur: 6}), null, 'capped');
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
  for (const n of ['Bench Press', 'Incline Dumbbell Press', 'Overhead Press', 'Push-up', 'Dips']) assert.ok(loads(n, 'wrist'), `${n} loads the wrist`);
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

// A repeatable random series, so the noisy-data checks below give the same answer every run.
function rng(seed) { let s = seed; const u = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return () => { let a = 0, b = 0; while (!a) a = u(); while (!b) b = u(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); }; }

test('a muscle still gaining is not called stalled because the noise hides its trend', () => {
  const T = together(), now = Date.now(), start = T.evaluate('Day.start')(now), randn = rng(7);
  const series = (n, perWeek, sd) => Array.from({length: n}, (_, k) => { const d = 35 - k * (34 / (n - 1)); return {date: now - d * DAY, e1: 100 * Math.pow(1 + perWeek, (35 - d) / 7) * (1 + sd * randn()), rated: true}; });
  const ci = Array.from({length: 10}, (_, k) => ({day: start - (33 - k * 3) * DAY, w: {sleep: 5, energy: 5, stress: 5, mood: 5}, sore: {chest: 2}}));
  const share = (n, perWeek, sd) => { let plus = 0; const N = 200;
    for (let i = 0; i < N; i++) {
      T.apis.lift = {points: () => [{id: 'barbell-bench', p: ['chest'], pts: series(n, perWeek, sd)}, {id: 'incline-db', p: ['chest'], pts: series(n, perWeek, sd)}],
        table: () => null, catalog: () => [], info: () => ({ready: true}), work: () => []};
      T.reset({on: true, secs: ['lift'], checkins: ci});
      T.tg().plan = {at: now - 35 * DAY, week: 5, weeks: 5};
      T.evaluate('learnVolume()');
      if ((T.tg().adj || {}).chest === 2) plus++;
    }
    return plus / N; };
  // gaining 1% a week (5% a block), with 2 to 2.5% noise a session: almost never +2
  assert.ok(share(8, 0.01, 0.02) < 0.1, 'eight sessions an exercise');
  assert.ok(share(6, 0.01, 0.025) < 0.1, 'six sessions an exercise');
  // really stalled, with steady numbers: +2 in most blocks
  assert.ok(share(8, 0, 0.01) > 0.6, 'a real stall still gets two more sets');
  // the stall test itself: two flat exercises with a narrow range, or one that can't rule progress out
  const tr = (slope, se, n) => ({slope, se, n, state: 'flat'});
  assert.equal(T.call('stalled', [tr(0, 0.001, 8), tr(0.001, 0.001, 8)]), true);
  assert.equal(T.call('stalled', [tr(0.002, 0.005, 6), tr(0, 0.005, 6)]), false, 'too wide to tell');
  assert.equal(T.call('stalled', [tr(0, 0.001, 8)]), false, 'one exercise is not enough');
  assert.equal(T.call('stalled', [tr(0, 0.001, 8), {slope: 0.02, se: 0.002, n: 8, state: 'up'}]), false);
});

test('straight-arm skills count calendar days, and goal work stays on the day after one', () => {
  const T = together();
  const monEve = new Date(2026, 9, 19, 19, 0).getTime(), tue = new Date(2026, 9, 20, 18, 0).getTime(), wedEarly = new Date(2026, 9, 21, 7, 0).getTime();
  T.apis.cal = {work: (a, b) => [{date: monEve, key: 'tuck-planche', group: 'planche', n: 3}].filter(w => w.date >= a && w.date < b), info: () => ({ready: true})};
  T.reset({on: true, secs: ['cal']});
  assert.equal(T.call('straightRecent', tue), true, 'the next day waits');
  assert.equal(T.call('straightRecent', wedEarly), false, 'Monday evening to Wednesday morning is far enough, as the planner counts it');
  assert.equal(T.call('tight', [0, 1], [0, 2]), 0);
  const I = {cal: {ready: true, goals: ['Planche'], picks: [
    {id: 'planche', key: 'tuck-planche', step: 'Tuck planche', target: '3 × 10 s', sets: 3, goal: true, skill: true},
    {id: 'frontlever', key: 'tuck-fl', step: 'Tuck front lever', target: '3 × 8 s', sets: 3}]}};
  const day = (at) => plain(T.call('planDay', [{m: 'cal'}], I, false, {carry: T.call('carryOver', at), runAt: at}).parts[0]);
  let p = day(tue);
  assert.deepEqual(p.drop, ['frontlever'], 'support work for a straight-arm skill waits');
  assert.ok(p.notes.some(n => /keep Tuck planche easy/.test(n[1])), 'goal work stays, kept easy');
  p = day(wedEarly);
  assert.deepEqual(p.drop, []);
});

test('gentler blocks keep Muscle at 3 or more reps in reserve; new lifters at 2 or more', () => {
  const T = together();
  for (const stage of ['preg', 'u18']) {
    T.reset({on: true, secs: ['lift'], stage});
    assert.deepEqual([1, 2, 3, 4, 5].map(w => T.call('liftRir', w)), [3, 3, 3, 3, 3], stage);
  }
  T.reset({on: true, secs: ['lift'], screen: {at: 1, yes: [0], blk: 0}, blocks: 0});
  assert.equal(T.call('liftRir', 5), 3, 'a yes on the health check');
  T.reset({on: true, secs: ['lift'], exp: 'beginner'});
  assert.deepEqual([3, 5].map(w => T.call('liftRir', w)), [2, 2]);
  T.reset({on: true, secs: ['lift']});
  assert.equal(T.call('liftRir', 5), 1, 'a top week otherwise keeps week 4’s 1 in reserve');
});

test('a new lifter’s first block has no top week: linear practice carries on, with a light start', () => {
  const T = together();
  T.apis.str = strApi();
  T.reset({on: true, secs: ['str'], days: 3, kit: ['bar'], exp: 'beginner', blocks: 0, mins: 0});
  const P = T.evaluate('plan()');
  P.week = 5; P.w5 = {kind: 'top', why: [], at: Date.now()}; T.evaluate('fresh()');
  const I = T.call('dayInfo', 0);
  assert.equal(I.str.top, false);
  assert.ok(!/top week/.test(I.str.weekName));
  assert.ok(I.str.next.slots.filter(x => x.heavy).every(x => x.sc.t === 'lp'));
  const notes = plain(T.call('planDay', [{m: 'str'}], I, false, {}).parts[0].notes).map(n => n[1]);
  assert.ok(!notes.some(t => /Top week/.test(t)), 'no top-week note');
  assert.ok(notes.some(t => /Linear practice/.test(t) && /RPE 7/.test(t)));
  // with no numbers yet for a lift, the first weight starts light
  T.apis.str.lift = id => EX[id] ? {id, n: EX[id].n, a: EX[id].a, k: 'load', key: id, e1: null, work: null, bar: true} : null;
  T.evaluate('fresh()');
  const notes2 = plain(T.call('planDay', [{m: 'str'}], T.call('dayInfo', 0), false, {}).parts[0].notes).map(n => n[1]);
  assert.ok(notes2.some(t => /about 10 times/.test(t)));
  // after the first block, week 5 is a top week again
  T.reset({on: true, secs: ['str'], days: 3, kit: ['bar'], exp: 'beginner', blocks: 1, mins: 0});
  const P2 = T.evaluate('plan()'); P2.week = 5; P2.w5 = {kind: 'top', why: [], at: Date.now()}; T.evaluate('fresh()');
  assert.equal(T.call('dayInfo', 0).str.top, true);
});

test('from 65 the lighter lifts are power work at about half the max; lighter weeks are marked', () => {
  const T = together();
  const x = {id: 'squat', a: 'legs', k: 'load', heavy: false, sets: 2, bar: true};
  T.reset({on: true, secs: ['str'], stage: 'older'});
  const sc = plain(T.call('strScheme', x, 2, null));
  assert.equal(sc.fast, true);
  assert.ok(sc.pct >= 0.4 && sc.pct <= 0.6, 'power work under 60% of the max');
  assert.equal(T.call('strScheme', Object.assign({}, x, {heavy: true}), 5, 'light').dl, true, 'a lighter week’s sets say so');
  // a gentler block caps rep ranges and bodyweight progressions too
  T.reset({on: true, secs: ['str'], stage: 'u18'});
  assert.equal(T.call('strScheme', {id: 'wpull', a: 'lats', k: 'added', heavy: true, sets: 3}, 2, null).intro, true);
  assert.equal(T.call('strScheme', {id: 'pushchain', a: 'chest', k: 'bw', heavy: true, sets: 3}, 2, null).intro, true);
});

test('Ladder’s core work goes last, after Muscle', () => {
  const T = together();
  T.reset({on: true, secs: ['lift', 'str', 'cal']});
  const core = {id: 'core', goal: true}, row = {id: 'row'}, skill = {id: 'planche', skill: true};
  const parts = (ms, picks) => plain(T.call('dayParts', ms, {cal: {picks}}));
  assert.deepEqual(parts(['str', 'cal', 'lift'], [core]), [{m: 'str'}, {m: 'lift'}, {m: 'cal'}]);
  assert.deepEqual(parts(['str', 'cal', 'lift'], [skill, row, core]), [{m: 'cal', seg: 'skill'}, {m: 'str'}, {m: 'cal', seg: 'mid'}, {m: 'lift'}, {m: 'cal', seg: 'core'}]);
  assert.deepEqual(parts(['cal', 'lift'], [skill, row, core]), [{m: 'cal', seg: 'pre'}, {m: 'lift'}, {m: 'cal', seg: 'core'}]);
  assert.deepEqual(parts(['str', 'cal'], [skill, row, core]), [{m: 'cal', seg: 'skill'}, {m: 'str'}, {m: 'cal', seg: 'main'}], 'with no Muscle, core stays in Ladder’s strength work');
  assert.deepEqual(parts(['cal', 'lift'], []), [{m: 'cal'}, {m: 'lift'}], 'a Ladder with nothing planned keeps its place');
  const picks = [skill, row, core];
  assert.deepEqual(plain(T.call('segPicks', picks, 'mid')).map(x => x.id), ['row']);
  assert.deepEqual(plain(T.call('segPicks', picks, 'pre')).map(x => x.id), ['planche', 'row']);
  assert.deepEqual(plain(T.call('segPicks', picks, 'core')).map(x => x.id), ['core']);
  assert.deepEqual(plain(T.call('segPicks', picks, 'main')).map(x => x.id), ['row', 'core']);
});

test('the default four days keep the lifts even: the once-a-week deadlift isn’t squeezed', () => {
  const T = together();
  T.apis.str = strApi();
  for (const mins of [0, 60, 75]) {
    T.reset({on: true, secs: ['str'], days: 4, kit: ['bar', 'db', 'machine', 'cable'], mins});
    const P = T.evaluate('buildPlan()'), n = P.days.filter(d => d.str.length).map(d => d.str.length);
    assert.ok(Math.max(...n) - Math.min(...n) <= 1, `${mins} min: lifts per day ${n}`);
    const dl = P.days.flatMap(d => d.str).find(x => x.id === 'deadlift');
    assert.equal(dl.sets, 4, `${mins} min: the week’s only deadlift keeps its sets`);
  }
});

test('old check-ins are fitted on the carry they would have now, not the scale they were saved with', () => {
  const T = together(), now = Date.now(), start = T.evaluate('Day.start')(now);
  // chest trained every other day, 6 hard sets; each check-in two days after a session, chest 3 of 10 sore
  const trained = Array.from({length: 42}, (_, k) => start - (82 - 2 * k) * DAY + 12 * 3600e3);
  T.apis.lift = {work: (a, b) => trained.filter(t => t >= a && t < b).map(() => ({p: ['chest'], s: [], n: 6, f: 6})), table: () => null, info: () => ({ready: true})};
  const ci = (x, cw) => Array.from({length: 40}, (_, k) => Object.assign({day: start - (80 - 2 * k) * DAY, at: start - (80 - 2 * k) * DAY, w: {sleep: 5, energy: 5, stress: 5, mood: 5}, sore: {chest: 3}, x: {chest: x}}, cw ? {cw} : {}));
  const thr = list => { T.reset({on: true, secs: ['lift'], checkins: list}); T.evaluate('fitMemo=null'); return T.evaluate('fitModel()').by.chest.T; };
  const old = thr(ci(3)), now2 = thr(ci(6, 2)), wrong = thr(ci(3, 2));
  assert.ok(Math.abs(old - now2) < 1e-9, `old ${old} vs new ${now2}`);
  assert.ok(wrong < now2 - 1, 'read at the old scale it would have been far lower');
  assert.equal(T.tg().checkins[0].cw, 2, 'the carry version is kept when saved data loads');
});

test('a section in pieces is done only when every piece is', () => {
  const T = together(), now = Date.now();
  const recs = {s1: 'done', s2: 'done'};
  T.apis.cal = {rec: id => recs[id] || null, recsIn: () => [{id: 's1', date: now - 3600e3}], info: () => ({ready: true})};
  T.apis.str = Object.assign(strApi(), {rec: id => recs[id] || null, recsIn: () => [{id: 's2', date: now - 1800e3}]});
  T.reset({on: true, secs: ['str', 'cal'], days: 3, log: [{date: now, start: now - 2 * 3600e3, day: 0,
    parts: [['cal', 'done', 's1', 'skill'], ['str', 'done', 's2'], ['cal', 'skip', null, 'main']]}]});
  assert.deepEqual(plain(T.call('doneParts', 0, 3)), {cal: {sid: 's1', part: true}, str: {sid: 's2'}});
  T.reset({on: true, secs: ['str', 'cal'], days: 3, run: {day: 0, at: now, parts: [{m: 'cal', st: 'done', sid: 's1', seg: 'skill'}, {m: 'str', st: 'todo', sid: null}, {m: 'cal', st: 'todo', sid: null, seg: 'main'}]}});
  assert.deepEqual(plain(T.call('doneParts', 0, 3)), {}, 'Ladder isn’t ticked while its strength work is still to do');
});

test('a yes on the health check given mid-block keeps the next block gentle too', () => {
  const T = together(), now = Date.now();
  T.reset({on: true, secs: ['str'], blocks: 1, plan: null, log: [{date: now - DAY, start: now - DAY, day: 0, parts: [['str', 'done', 'a']]}]});
  T.tg().plan = {at: now - 3 * DAY, week: 2, weeks: 5};
  assert.equal(T.call('screenBlk'), 2, 'trained in this block: this one and the next');
  T.tg().plan = {at: now, week: 1, weeks: 5};
  assert.equal(T.call('screenBlk'), 1, 'a block not trained in yet: that one');
  T.tg().screen = {at: now, yes: [0], blk: 1};
  assert.equal(T.evaluate('gentle()'), true);
  T.call('blockEnds');
  assert.equal(T.evaluate('gentle()'), true, 'still gentle when that block began without training');
});

test('All Progress combines a lift across trainers and includes lifts trained only in Muscle', () => {
  const T = together(), now = Date.now();
  const points = n => [{date: now - 2 * DAY, e1: n, rated: true}, {date: now - DAY, e1: n + 2, rated: true}];
  T.apis.lift = {
    catalog: () => [{id: 'barbell-bench', name: 'Bench Press', comp: true}, {id: 'muscle-only', name: 'Muscle-only lift', comp: true}],
    points: () => [{id: 'barbell-bench', p: ['chest'], pts: points(100)}, {id: 'muscle-only', p: ['back'], pts: points(70)}],
  };
  T.apis.str = {name: () => 'Bench Press', points: () => [{id: 'bench', a: 'chest', key: 'barbell-bench', pts: points(102)}]};
  const merged = T.call('liftPoints', 0);
  assert.equal(merged.find(x => x.id === 'barbell-bench').pts.length, 4);
  const html = T.call('liftsCard');
  assert.equal((html.match(/<b>Bench Press<\/b>/g) || []).length, 1);
  assert.match(html, /Muscle-only lift/);
});

test('All Progress shows each program target, including muscles with no sets yet', () => {
  const T = together();
  T.apis.lift = {table: () => ({groups: ['Chest', 'Arms'], muscles: {chest: {n: 'Chest', g: 'Chest'}, bi: {n: 'Biceps', g: 'Arms'}}}), catalog: () => []};
  T.reset({on: true, secs: ['lift'], days: 3});
  T.call('plan').goal = {chest: 12, bi: 6};
  const html = T.call('volCard', {lift: {target: 10}});
  assert.match(html, /Chest: 0 of 12 hard sets/);
  assert.match(html, /Biceps: 0 of 6 hard sets/);
});

test('the Progress week follows the locale and spans calendar days', () => {
  const T = together();
  T.evaluate("navigator.language='en-US'");
  assert.equal(new Date(T.call('weekStart')).getDay(), 0);
  T.evaluate("navigator.language='en-GB'");
  assert.equal(new Date(T.call('weekStart')).getDay(), 1);
});


test('conditioning target, fatigue and conservative interval placement',()=>{
  const T=together();
  assert.equal(T.call('condTarget',{target:150},0),150);
  assert.equal(T.call('condTarget',{target:150},1),100);
  assert.equal(T.call('condTarget',{target:150},2),50);
  assert.equal(T.call('condEquivalent',{minutes:30,intensity:'vigorous'}),60);
  assert.equal(T.call('condEquivalent',{minutes:30,intensity:'light'}),0);
  assert.ok(T.call('condFatigue',{minutes:90,rpe:8,activity:'sport'})>8);
  assert.ok(T.call('condFatigue',{minutes:60,rpe:2,activity:'cycle'})<1);
  const days=[{heavy:false,minutes:20},{heavy:true,minutes:40},{heavy:false,minutes:10}];
  const p=T.call('condPlacement',days,[0,1,4],60,150,'intervals');
  assert.equal(p[0].style,'easy','adjacent day before heavy legs uses easy work');
  assert.equal(p[1].style,'easy','heavy lifting day uses easy work');
  assert.equal(p[2].style,'intervals');
  p.forEach((x,i)=>assert.ok(!x||x.minutes+days[i].minutes<=60));
});
test('conditioning remains last and outside hard-set totals',()=>{
  const T=together();T.reset({on:true,secs:['cond','str','lift'],prio:['cond','str','lift','cal']});
  assert.deepEqual(plain(T.call('dayParts',['cond','lift','str'],{})),[{m:'str'},{m:'lift'},{m:'cond'}]);
  assert.equal(T.call('doses').str,'moderate');
  assert.equal(T.call('doses').lift,'maintain');
  const now=Date.now();T.evaluate(`tg.conditioning.log=[{date:${now},minutes:90,rpe:8,activity:'sport'}]`);
  const C=T.call('fatigue',now-1,now+1);assert.ok(C.quad.cond>8);assert.equal(C.chest,undefined);
  assert.ok(T.call('tiredFrom',{by:C},['lift','str','cal']).quad>0);
});
test('outcome projections require evidence and summary deduplicates sessions',()=>{
  const T=together(),now=Date.now();
  assert.equal(T.call('outcomeProjection',[],100,now).projected,null);
  assert.equal(T.call('outcomeProjection',[{date:now,e1:100,rated:true}],120,now).projected,null);
  const pts=Array.from({length:8},(_,i)=>({date:now-(7-i)*7*DAY,e1:80+i*3,rated:true}));
  assert.ok(T.call('outcomeProjection',pts,120,now).projected>now);
  const n=T.call('summaryNumbers',[{m:'lift',id:'a',date:now},{m:'lift',id:'a',date:now}],now-1,now+1,3,{},1,[{date:now,minutes:30,intensity:'vigorous'}]);
  assert.equal(n.sessions,1);assert.equal(n.days,1);assert.equal(n.minutes,60);
});

test('changing Conditioning priority rebuilds doses and the saved plan',()=>{
  const T=together();T.apis.str=strApi();
  T.reset({on:true,secs:['str','cond'],prio:['str','lift','cal','cond'],days:3,mins:60});
  const first=T.call('plan');assert.equal(first.dose.str,'build');
  T.evaluate("tg.prio=['cond','str','lift','cal']");const next=T.call('plan');
  assert.notEqual(next.sig,first.sig);assert.equal(next.dose.str,'moderate');assert.equal(next.dose.cond,'build');
});
test('goal dates do not use repeated sets as independent sessions or revive stale trends',()=>{
  const T=together(),now=Date.now();
  const repeated=[...Array.from({length:6},()=>({date:now-7*DAY,e1:80,rated:true})),...Array.from({length:6},()=>({date:now,e1:100,rated:true}))];
  assert.equal(T.call('outcomeProjection',repeated,120,now).projected,null);
  const stale=Array.from({length:8},(_,i)=>({date:now-(200-i*7)*DAY,e1:80+i*3,rated:true}));
  assert.equal(T.call('outcomeProjection',stale,120,now).projected,null);
});
test('conditioning placement preserves time and next-day guards across weekly calendars',()=>{
  const T=together();for(let n=2;n<=7;n++)for(const budget of [45,60,90])for(const style of ['easy','intervals','mixed']){
    const weekdays=Array.from({length:n},(_,i)=>Math.floor(i*7/n));
    for(let phase=0;phase<4;phase++){
      const days=weekdays.map((_,i)=>({minutes:10+(i*11+phase*7)%budget,heavy:(i+phase)%3===0}));
      const out=T.call('condPlacement',days,weekdays,budget,150,style);
      out.forEach((x,i)=>{if(!x)return;assert.ok(x.minutes+days[i].minutes<=budget);if(x.style==='intervals')assert.ok(!days.some((d,j)=>d.heavy&&(weekdays[j]-weekdays[i]+7)%7<=1));});
      assert.deepEqual(plain(out),plain(T.call('condPlacement',days,weekdays,budget,150,style)));
    }
  }
});
test('unlimited conditioning days have no hidden ninety-minute cap and mixed intervals count correctly',()=>{
  const T=together(),p=T.call('condPlacement',[{minutes:120,heavy:false},{minutes:120,heavy:false}],[0,3],0,150,'easy');
  assert.equal(p.reduce((n,x)=>n+x.minutes,0),150);
  assert.equal(T.call('condEquivalent',{minutes:24,intensity:'intervals'}),36);
  assert.equal(T.call('condEquivalent',{minutes:3,intensity:'intervals'}),5);
});
