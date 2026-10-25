const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the actual Muscle factory (its boot and screen left out), so these check the production block builder, loads and
// survey rule rather than a copy of them.
function muscle({bodyKg = null} = {}) {
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const start = app.indexOf('  lift: function(__root){');
  assert.ok(start >= 0, 'Muscle factory exists');
  const bodyStart = app.indexOf('\n', start);
  const end = app.indexOf('/* ==================== BOOT ==================== */', bodyStart);
  assert.ok(end > bodyStart, 'Muscle boot boundary exists');
  const noOp = () => {};
  const element = () => ({innerHTML: '', textContent: '', value: '', classList: {add: noOp, remove: noOp, toggle: noOp, contains: () => false},
    querySelector: () => null, querySelectorAll: () => [], addEventListener: noOp, focus: noOp, setAttribute: noOp, closest: () => null});
  const root = {querySelector: element, querySelectorAll: () => [], addEventListener: noOp, getElementById: element};
  const store = {};
  const context = vm.createContext({
    __root: root, Date, Math, JSON, Set, Map, console, Intl,
    setTimeout: () => 1, clearTimeout: noOp, setInterval: () => 1, clearInterval: noOp,
    window: {scrollTo: noOp, addEventListener: noOp, matchMedia: () => ({matches: false, addEventListener: noOp})},
    document: {addEventListener: noOp, createElement: element}, navigator: {},
    localStorage: {getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }},
    MiloSecurity: {html: value => value, parseSection: value => JSON.parse(value)},
    Safe: {put: noOp, rescue: noOp}, __setTheme: noOp,
    TakeBack: {make: () => ({keep: noOp, seal: noOp, edited: noOp, deleted: noOp, clear: noOp, get: () => null, changed: () => false})},
    SheetNav: {make: () => ({reg: noOp, opening: noOp, opened: noOp, closed: noOp})},
  });
  vm.runInContext(app.slice(0, app.indexOf('/* ==================== BACK ====================')), context, {filename: 'app.js:HOWTO'});
  const shared = app.indexOf('/* ==================== SETS NOT TICKED OFF ====================');
  vm.runInContext(app.slice(shared, app.indexOf('/* ==================== TAKE BACK ====================', shared)), context, {filename: 'app.js:shared'});
  ['OpenSets', 'Parked', 'Prefs', 'Lift', 'SAME_LIFT', 'GROWTH', 'Num', 'Day', 'Kit', 'Body'].forEach(k => { context[k] = context.window[k]; });
  vm.runInContext(`(function(__root) { ${app.slice(bodyStart, end)}
    state = defaultState(); state.onboarded = true;
    globalThis.muscleTest = { state: () => state, evaluate: expression => eval(expression) };
  })(__root);`, context, {filename: 'app.js:Muscle'});
  const api = context.muscleTest;
  if (bodyKg != null) api.state().bodylog.push({date: Date.now() - 86400000, weight: bodyKg});
  return api;
}
const plain = value => JSON.parse(JSON.stringify(value));
const day = 86400000;

/* ---- blocks built from weekly targets ---- */
function credit(api, draft) {
  return plain(api.evaluate(`daysCredit(${JSON.stringify(draft.days)}, (d,e)=>e.sets)`));
}
function perSession(api, draft) {
  return draft.days.map(d => plain(api.evaluate(`daysCredit([${JSON.stringify(d)}], (d,e)=>e.sets)`)));
}
const cases = [];
for (const days of [3, 4, 5, 6]) for (const experience of ['beginner', 'intermediate', 'advanced']) cases.push({days, experience, emphasis: ['balanced']});
cases.push({days: 4, experience: 'intermediate', emphasis: ['arms']}, {days: 5, experience: 'intermediate', emphasis: ['glutes']},
  {days: 3, experience: 'advanced', emphasis: ['upper']}, {days: 6, experience: 'intermediate', emphasis: ['lower']});

test('a block meets each muscle’s weekly target within a set, helpers counted at half', () => {
  const api = muscle();
  for (const o of cases) {
    const d = plain(api.evaluate(`generateDraft(${JSON.stringify(o)})`)), C = credit(api, d);
    for (const [mu, t] of Object.entries(d.targets)) {
      assert.ok(Math.abs((C[mu] || 0) - t) <= 1, `${o.days} days, ${o.experience}, ${o.emphasis}: ${mu} gets ${C[mu]} for a target of ${t}`);
    }
  }
});

test('weekly targets: about 8 new, 10–12 with some experience, 12–14 advanced, and 3–4 more for an emphasised muscle', () => {
  const api = muscle(), T = o => plain(api.evaluate(`weeklyTargets(${JSON.stringify(o)})`));
  assert.equal(T({days: 4, experience: 'beginner'}).chest, 8);
  assert.ok([10, 11, 12].includes(T({days: 3, experience: 'intermediate'}).quad) && [10, 11, 12].includes(T({days: 6, experience: 'intermediate'}).quad));
  assert.ok(T({days: 6, experience: 'intermediate'}).quad >= T({days: 3, experience: 'intermediate'}).quad, 'more days, the top of the range');
  assert.ok([12, 13, 14].includes(T({days: 3, experience: 'advanced'}).chest) && [12, 13, 14].includes(T({days: 6, experience: 'advanced'}).chest));
  const plain4 = T({days: 4, experience: 'intermediate'}), arms = T({days: 4, experience: 'intermediate', emphasis: ['arms']});
  assert.ok([3, 4].includes(arms.bi - plain4.bi) && [3, 4].includes(arms.tri - plain4.tri) && arms.chest === plain4.chest);
});

test('no muscle gets more than the session cap in one session, and each is trained on about two days', () => {
  const api = muscle(), cap = api.evaluate('SESSION_CAP');
  assert.ok(cap >= 8 && cap <= 10);
  for (const o of cases) {
    const d = plain(api.evaluate(`generateDraft(${JSON.stringify(o)})`));
    perSession(api, d).forEach((S, i) => Object.entries(S).forEach(([mu, v]) => assert.ok(v <= cap + 1e-9, `${o.days}-day ${o.experience}, day ${i + 1}: ${mu} ${v} sets`)));
    for (const mu of ['chest', 'quad', 'lat', 'uback', 'ham']) {
      const on = d.days.filter(x => x.exercises.some(e => e.primary.includes(mu))).length;
      assert.ok(on >= 2, `${o.days}-day ${o.experience}: ${mu} on ${on} day(s)`);
    }
  }
});

test('every part of a muscle is covered: the quad that crosses the hip, the hamstrings’ curl, the triceps’ long head', () => {
  const api = muscle();
  for (const o of cases) {
    const d = plain(api.evaluate(`generateDraft(${JSON.stringify(o)})`)), ids = d.days.flatMap(x => x.exercises.map(e => e.exId));
    const regs = {};
    ids.forEach(id => ['quad', 'ham', 'tri'].forEach(mu => { const e = api.evaluate(`exById(${JSON.stringify(id)})`); if (e && e.primary.includes(mu)) (regs[mu] || (regs[mu] = new Set())).add(api.evaluate(`GROWTH.region(${JSON.stringify(id)}, ${JSON.stringify(mu)})`)); }));
    for (const mu of ['quad', 'ham', 'tri']) assert.deepEqual([...api.evaluate(`GROWTH.missing(${JSON.stringify(mu)}, ${'{'}[${JSON.stringify(mu)}]: new Set(${JSON.stringify([...(regs[mu] || [])])})${'}'})`)], [], `${o.days}-day ${o.experience}: ${mu}`);
    assert.ok(ids.includes('leg-extension') || ids.includes('sissy-squat'), `${o.days}-day ${o.experience}: a knee extension for the quad that crosses the hip`);
  }
});

test('a block picks the long-length versions and puts the big lifts first', () => {
  const api = muscle();
  const d = plain(api.evaluate(`generateDraft({days:4, experience:'intermediate', emphasis:['balanced']})`)), ids = d.days.flatMap(x => x.exercises.map(e => e.exId));
  assert.ok(ids.includes('overhead-ext') && ids.includes('leg-curl') && ids.includes('standing-calf'), ids.join());
  assert.ok(!ids.includes('lying-leg-curl') || ids.includes('leg-curl'));
  assert.ok(ids.includes('lat-pulldown') || ids.includes('pullup') || ids.includes('chin-up'), 'lats get a vertical pull, not only rows');
  // with room for three curls, one of each: long (incline), short (preacher) and behind the body (Bayesian)
  const arms = plain(api.evaluate(`generateDraft({days:4, experience:'intermediate', emphasis:['arms']})`)).days.flatMap(x => x.exercises.map(e => e.exId));
  assert.deepEqual(['incline-db-curl', 'preacher-curl', 'bayesian-curl'].filter(id => arms.includes(id)), ['incline-db-curl', 'preacher-curl', 'bayesian-curl'], arms.join());
  for (const x of d.days) {
    const comp = x.exercises.map(e => !!e.comp), firstIso = comp.indexOf(false);
    assert.ok(firstIso < 0 || comp.slice(firstIso).every(c => !c), `${x.name}: compounds before single-joint work`);
  }
});

test('ready-made blocks: four weeks with no lighter week planned, effort starting 2 short of failure', () => {
  const api = muscle();
  for (const t of plain(api.evaluate('MESO_TEMPLATES'))) { assert.equal(t.deload, false); assert.equal(t.weeks, 4); }
  const d = plain(api.evaluate(`generateDraft({days:4, experience:'intermediate', emphasis:['balanced']})`));
  assert.equal(d.hasDeload, false); assert.equal(d.startRir, 2); assert.equal(d.totalWeeks, 4);
});

test('reps in reserve by kind of exercise: isolation to 0, machine compounds to 1, barbell squat, deadlift and bench at 1–2', () => {
  const api = muscle(), r = (rir, id) => api.evaluate(`exRir(${rir}, {exId:${JSON.stringify(id)}})`);
  assert.deepEqual([2, 1, 0].map(x => r(x, 'leg-extension')), [2, 1, 0]);
  assert.deepEqual([2, 1, 0].map(x => r(x, 'leg-press')), [2, 1, 1]);
  assert.deepEqual([2, 1, 0].map(x => r(x, 'back-squat')), [2, 2, 1]);
  assert.deepEqual([3, 0].map(x => r(x, 'barbell-bench')), [3, 1]);
});

/* ---- assisted and weighted bodyweight exercises ---- */
test('an assisted exercise moves what your bodyweight share less the help is, so less help is stronger', () => {
  const api = muscle({bodyKg: 80});
  assert.equal(api.evaluate(`setLoad('assisted-pullup', {weight:30, reps:8})`), 80 * 0.95 - 30);
  assert.ok(api.evaluate(`setScore('assisted-pullup', {weight:20, reps:8, rir:2}) > setScore('assisted-pullup', {weight:30, reps:8, rir:2})`));
  const none = muscle();
  assert.ok(none.evaluate(`setScore('assisted-pullup', {weight:20, reps:8, rir:2}) > setScore('assisted-pullup', {weight:30, reps:8, rir:2})`), 'with no bodyweight logged too');
});

test('an assisted exercise progresses by taking help away, and eases off by adding it', () => {
  const api = muscle({bodyKg: 80}), S = api.state();
  const entry = {exId: 'assisted-pullup', equipment: 'Machine', target: {repLow: 6, repHigh: 10, rir: 2}};
  const log = (sets, ago) => S.history.push({id: 'h' + S.history.length, name: 'x', date: Date.now() - ago * day, entries: [{exId: 'assisted-pullup', name: 'Assisted Pull-Up', sets: sets.map(([w, r]) => ({type: 'work', done: true, weight: w, reps: r, rir: 2}))}]});
  log([[30, 10], [30, 10], [30, 10]], 3);
  const up = plain(api.evaluate(`suggestLoad('assisted-pullup', ${JSON.stringify(entry)}, true, false)`));
  assert.ok(up.weight < 30, 'every set at the top: less help, ' + up.weight);
  const deload = plain(api.evaluate(`suggestLoad('assisted-pullup', ${JSON.stringify(entry)}, true, true)`));
  assert.ok(deload.weight > 30, 'a lighter week: more help, ' + deload.weight);
  S.history.length = 0; log([[30, 4], [30, 4]], 3);
  const below = plain(api.evaluate(`suggestLoad('assisted-pullup', ${JSON.stringify(entry)}, true, false)`));
  assert.ok(below.weight > 30, 'under the range: more help, ' + below.weight);
  S.history.length = 0; log([[30, 8]], 30);
  const back = plain(api.evaluate(`suggestLoad('assisted-pullup', ${JSON.stringify(entry)}, true, false)`));
  assert.ok(back.weight > 30, 'back after a month: more help, ' + back.weight);
  const recs = plain(api.evaluate(`(state.history=[{id:'a',name:'x',date:Date.now()-9*${day},entries:[{exId:'assisted-pullup',name:'A',sets:[{type:'work',done:true,weight:40,reps:9}]}]},{id:'b',name:'x',date:Date.now()-2*${day},entries:[{exId:'assisted-pullup',name:'A',sets:[{type:'work',done:true,weight:25,reps:6}]}]}], repRecords('assisted-pullup'))`));
  assert.equal(recs.least.weight, 25, 'the record shows the least help');
});

test('a weighted pull-up predicts reps from bodyweight plus the belt, not the belt alone', () => {
  const api = muscle({bodyKg: 80}), S = api.state();
  S.history.push({id: 'w1', name: 'x', date: Date.now() - 3 * day, entries: [{exId: 'pullup', name: 'Pull-Up', sets: [{type: 'work', done: true, weight: 10, reps: 8, rir: 2}]}]});
  const en = {exId: 'pullup', target: {repLow: 6, repHigh: 12, rir: 2}, sets: []};
  const r = api.evaluate(`repHint(${JSON.stringify(en)}, {weight:12.5})`);
  assert.ok(r >= 7 && r <= 8, 'about a rep fewer, not 1: ' + r);
  assert.equal(api.evaluate(`realLoad('pullup', 10)`), 80 * 0.95 + 10);
});

test('below the range, weight on the belt comes off a step before any help goes on', () => {
  const api = muscle({bodyKg: 80}), S = api.state();
  S.history.push({id: 'w1', name: 'x', date: Date.now() - 3 * day, entries: [{exId: 'pullup', name: 'Pull-Up', sets: [{type: 'work', done: true, weight: 10, reps: 3, rir: 1}]}]});
  const s = plain(api.evaluate(`suggestLoad('pullup', {exId:'pullup', equipment:'Bodyweight', target:{repLow:6, repHigh:12, rir:2}}, true, false)`));
  assert.equal(s.weight, 7.5);
});

test('rep hints aim for this week’s planned effort: one more rep when it goes from 3 in reserve to 2 at the same load', () => {
  const api = muscle(), S = api.state();
  S.history.push({id: 'r1', name: 'x', date: Date.now() - 3 * day, entries: [{exId: 'leg-extension', name: 'Leg Extension', sets: [{type: 'work', done: true, weight: 50, reps: 10, rir: 3}]}]});
  const en = {exId: 'leg-extension', target: {repLow: 8, repHigh: 15, rir: 2}, sets: [{type: 'work'}]};
  assert.equal(api.evaluate(`repHint(${JSON.stringify(en)}, {weight:50})`), 11);
});

/* ---- the after-session survey ---- */
function block(api) {
  return api.evaluate(`(()=>{ const m=makeMesoFromDraft({name:'T', totalWeeks:4, hasDeload:false, startRir:2, endRir:0, days:[
    {id:'d1', name:'Upper', exercises:[exById('barbell-bench'), exById('incline-db-press'), exById('cable-fly')].map(x=>({exId:x.id,name:x.name,primary:x.primary,secondary:x.secondary,equipment:x.equipment,comp:x.comp,sets:4,repLow:8,repHigh:12}))},
    {id:'d2', name:'Upper 2', exercises:[exById('machine-chest-press')].map(x=>({exId:x.id,name:x.name,primary:x.primary,secondary:x.secondary,equipment:x.equipment,comp:x.comp,sets:3,repLow:8,repHigh:12}))}]}, true); return m.id; })()`);
}
test('the survey moves a muscle’s weekly sets by 1 or 2, a fifth at most, from how its lifts went', () => {
  const api = muscle(), id = block(api), m = `mesoById(${JSON.stringify(id)})`;
  const chest = ans => plain(api.evaluate(`feedbackPlan(${m}, 1, {chest:${JSON.stringify(ans)}})`)).muscles[0];
  assert.equal(chest({perf: 'same', soreness: 'none', pain: 'none'}).delta, 2, 'held, recovered early: two more');
  assert.equal(chest({perf: 'same', soreness: 'ok', pain: 'none'}).delta, 1);
  assert.equal(chest({perf: 'up', soreness: 'none', pain: 'none'}).delta, 0, 'going up: it is working');
  assert.equal(chest({perf: 'down', soreness: 'ok', pain: 'none'}).delta, -1);
  assert.equal(chest({perf: 'down', soreness: 'high', pain: 'none'}).delta, -2);
  assert.equal(chest({perf: 'same', soreness: 'none', pain: 'some'}).delta, 0, 'a joint that hurt blocks an increase');
  assert.equal(chest({perf: 'up', soreness: 'none', pain: 'significant'}).delta, -1);
  assert.equal(chest({perf: 'same', soreness: 'high', pain: 'none'}).delta, 0, 'soreness only breaks ties');
  const r = chest({perf: 'same', soreness: 'none', pain: 'none'});
  assert.equal(r.from, 15); assert.equal(r.to, 17);
  assert.ok(Math.abs(r.to - r.from) <= Math.max(1, Math.round(r.from * 0.2)));
  // a small muscle moves by a set at most: a fifth of 4 rounds to 1
  assert.equal(api.evaluate(`deltaFor({perf:'same', soreness:'none', pain:'none'}, 4).delta`), 1);
  assert.equal(api.evaluate(`deltaFor({perf:'same', soreness:'none', pain:'none', pump:'low'}, 15).delta`), api.evaluate(`deltaFor({perf:'same', soreness:'none', pain:'none', pump:'high'}, 15).delta`), 'pump is not an input');
});

test('applying the survey changes the plan once a week per muscle, split across its exercises', () => {
  const api = muscle(), id = block(api), m = `mesoById(${JSON.stringify(id)})`;
  const total = w => api.evaluate(`${m}.days.reduce((a,d)=>a+d.exercises.reduce((b,e,i)=>b+plannedSets(${m},d.id,i,${w}),0),0)`);
  assert.equal(total(2), 15);
  plain(api.evaluate(`applyFeedback(${m}, 1, 'd1', {chest:{perf:'same', soreness:'none', pain:'none'}})`));
  assert.equal(total(2), 17); assert.equal(total(4), 17); assert.equal(total(1), 15, 'this week stays as it was');
  const sets = plain(api.evaluate(`${m}.days.flatMap(d=>d.exercises.map((e,i)=>plannedSets(${m},d.id,i,2)))`));
  assert.ok(Math.max(...sets) - 4 <= 1, 'spread over the exercises, not two on one: ' + sets.join());
  const again = plain(api.evaluate(`applyFeedback(${m}, 1, 'd2', {chest:{perf:'same', soreness:'none', pain:'none'}})`));
  assert.equal(again.muscles[0].delta, 0, 'a second day in the same week does not move it again');
  assert.equal(total(2), 17);
});

test('how a muscle’s lifts went comes from the estimated max of its best sets against last time', () => {
  const api = muscle(), S = api.state();
  const rec = (id, date, w, r) => ({id, name: 'x', date, entries: [{exId: 'barbell-bench', name: 'Bench', primary: ['chest'], secondary: ['tri'], sets: [{type: 'work', done: true, weight: w, reps: r, rir: 2}]}]});
  S.history.push(rec('a', Date.now() - 4 * day, 80, 8));
  assert.equal(api.evaluate(`musclePerf(${JSON.stringify(rec('b', Date.now(), 80, 10))}, 'chest')`), 'up');
  assert.equal(api.evaluate(`musclePerf(${JSON.stringify(rec('b', Date.now(), 80, 8))}, 'chest')`), 'same');
  assert.equal(api.evaluate(`musclePerf(${JSON.stringify(rec('b', Date.now(), 80, 6))}, 'chest')`), 'down');
});
