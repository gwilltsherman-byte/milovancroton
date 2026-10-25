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

/* Two muscles share one exercise: an incline press (chest and front delts), a chest-supported row (upper back and lats), a
   back squat (quads and glutes). Each line must say what the plan really gives the muscle afterwards, helpers at half as on
   the block's card, and keep to its limit and to a joint that hurt. */
function surveyCase(make, dayIndex, answers) {
  const api = muscle(), id = api.evaluate(make), m = `mesoById(${JSON.stringify(id)})`, dayId = api.evaluate(`${m}.days[${dayIndex}].id`);
  const C = w => plain(api.evaluate(`daysCredit(${m}.days, (d,e,i)=>plannedSets(${m},d.id,i,${w}))`));
  const ans = typeof answers === 'function' ? answers(plain(api.evaluate(`musclesTrained(${m}.days[${dayIndex}])`))) : answers;
  const before = C(2), plan = plain(api.evaluate(`applyFeedback(${m}, 1, ${JSON.stringify(dayId)}, ${JSON.stringify(ans)})`)), after = C(2);
  const half = v => Math.round((v || 0) * 2) / 2, lines = {};
  for (const c of plan.muscles) {
    lines[c.mu] = c;
    assert.equal(c.from, half(before[c.mu]), `${c.mu}: from`); assert.equal(c.to, half(after[c.mu]), `${c.mu}: to`);
    assert.ok(Math.abs(c.to - c.from) <= Math.max(1, Math.min(2, Math.round(c.from * 0.2))), `${c.mu}: ${c.from} → ${c.to} is past its limit`);
    const a = ans[c.mu];
    if (a && a.pain !== 'none') assert.ok(c.to <= c.from, `${c.mu}: a joint hurt, yet ${c.from} → ${c.to}`);
  }
  for (const q of Object.keys(after)) if (half(after[q]) !== half(before[q])) assert.ok(lines[q], `${q} moved without a line`);
  return lines;
}
const generated = `makeMesoFromDraft(generateDraft({days:4, experience:'intermediate', emphasis:['balanced']}), true).id`;
const every = o => mus => Object.fromEntries(mus.map(mu => [mu, Object.assign({perf: 'same', soreness: 'ok', pain: 'none'}, o)]));
test('the survey counts every muscle an exercise trains: the lines say what really changes, within each one’s limit', () => {
  const upper = mus => every({})(mus);
  let L = surveyCase(generated, 0, mus => Object.assign(upper(mus), {chest: {perf: 'same', soreness: 'ok', pain: 'significant'}, fdelt: {perf: 'same', soreness: 'none', pain: 'none'}}));
  assert.ok(L.chest.to < L.chest.from, 'joint pain takes a set off, even with the front delts asking for more: ' + JSON.stringify(L.chest));
  L = surveyCase(generated, 0, mus => Object.assign(upper(mus), {chest: {perf: 'same', soreness: 'none', pain: 'some'}}));
  assert.equal(L.chest.to, L.chest.from, 'a joint that hurt blocks an increase');
  surveyCase(generated, 0, every({soreness: 'none'}));
  surveyCase(generated, 0, every({perf: 'down', soreness: 'high'}));
  L = surveyCase(generated, 0, mus => Object.assign(every({perf: 'up'})(mus), {uback: {perf: 'same', soreness: 'ok', pain: 'none'}, lat: {perf: 'same', soreness: 'ok', pain: 'none'}}));
  assert.ok(L.lat.to > L.lat.from);
  // the ready-made Push/Pull/Legs block: quads recovered early, glutes and hamstrings on time
  L = surveyCase(`makeMesoFromTemplate(MESO_TEMPLATES[1]).id`, 2, {quad: {perf: 'same', soreness: 'none', pain: 'none'}, glute: {perf: 'same', soreness: 'ok', pain: 'none'}, ham: {perf: 'same', soreness: 'ok', pain: 'none'}});
  assert.ok(L.quad.to - L.quad.from <= 2 && L.quad.to > L.quad.from, JSON.stringify(L.quad));
});

test('a muscle that moved as a helper is held for the rest of the week too', () => {
  const api = muscle(), id = block(api), m = `mesoById(${JSON.stringify(id)})`;
  const P = plain(api.evaluate(`applyFeedback(${m}, 1, 'd1', {chest:{perf:'same', soreness:'none', pain:'none'}})`));
  const moved = P.muscles.filter(c => c.delta).map(c => c.mu);
  assert.ok(moved.includes('chest'));
  for (const mu of moved) assert.ok(api.evaluate(`'1:${mu}' in ${m}.adj`), mu);
});

test('how a muscle’s lifts went comes from the estimated max of its best sets against last time', () => {
  const api = muscle(), S = api.state();
  const rec = (id, date, w, r) => ({id, name: 'x', date, entries: [{exId: 'barbell-bench', name: 'Bench', primary: ['chest'], secondary: ['tri'], sets: [{type: 'work', done: true, weight: w, reps: r, rir: 2}]}]});
  S.history.push(rec('a', Date.now() - 4 * day, 80, 8));
  assert.equal(api.evaluate(`musclePerf(${JSON.stringify(rec('b', Date.now(), 80, 10))}, 'chest')`), 'up');
  assert.equal(api.evaluate(`musclePerf(${JSON.stringify(rec('b', Date.now(), 80, 8))}, 'chest')`), 'same');
  assert.equal(api.evaluate(`musclePerf(${JSON.stringify(rec('b', Date.now(), 80, 6))}, 'chest')`), 'down');
});

/* ---- during a session ---- */
test('ticking a set with an empty reps box logs the bottom of the range, marked as assumed', () => {
  const api = muscle(), S = api.state();
  S.active = {id: 'a1', name: 'T', startedAt: Date.now(), entries: [{exId: 'leg-extension', name: 'Leg Extension', primary: ['quad'], secondary: [], equipment: 'Machine',
    target: {repLow: 10, repHigh: 15, rir: 2, rest: 90}, sets: [{type: 'work', weight: 40, reps: null, rir: null, done: false}]}]};
  try { api.evaluate('toggleDone(0,0)'); } catch (e) { /* the screen isn't there; the set is changed before it draws */ }
  const s = plain(S.active.entries[0].sets[0]);
  assert.equal(s.done, true); assert.equal(s.reps, 10); assert.equal(s.assumed, true);
});

test('the reps-in-reserve check is offered on the last set of the first isolation exercise and logged to failure', () => {
  const api = muscle(), S = api.state();
  const en = (id, name, n) => ({exId: id, name, primary: ['quad'], secondary: [], equipment: 'Machine', target: {repLow: 10, repHigh: 15, rir: 2, rest: 90},
    sets: Array.from({length: n}, () => ({type: 'work', weight: 40, reps: null, rir: null, done: false}))});
  S.active = {id: 'a1', name: 'T', startedAt: Date.now(), entries: [en('leg-press', 'Leg Press', 3), en('leg-extension', 'Leg Extension', 3)]};
  assert.equal(api.evaluate('calSet(state.active.entries[0], 0)'), -1, 'not on a compound');
  assert.equal(api.evaluate('calSet(state.active.entries[1], 1)'), 2, 'the last set of the isolation exercise');
  const set = S.active.entries[1].sets[2]; set.reps = 12; set.rir = 2; set.calx = 3;
  const msg = api.evaluate('recordCheck(state.active.entries[1], state.active.entries[1].sets[2])');
  const rec = plain(S.rirCal[S.rirCal.length - 1]);
  assert.equal(rec.cls, 'iso'); assert.equal(rec.predictedRir, 2); assert.equal(rec.actualExtra, 3); assert.equal(rec.error, 1);
  assert.equal(set.reps, 15); assert.equal(set.rir, 0);
  assert.match(msg, /1 more/);
  assert.equal(api.evaluate('calSet(state.active.entries[1], 1)'), -1, 'once checked, not again for a while');
});

test('a check left with the reps-in-reserve box blank is logged to failure, not kept as a call of 0', () => {
  const api = muscle(), S = api.state();
  const en = id => ({exId: id, name: id, primary: ['quad'], secondary: [], equipment: 'Machine', lastFail: true, target: {repLow: 10, repHigh: 15, rir: 1, rest: 90},
    sets: [0, 1].map(() => ({type: 'work', weight: 40, reps: null, rir: null, done: false}))});
  S.active = {id: 'a1', name: 'T', startedAt: Date.now(), entries: [en('leg-extension'), en('leg-curl'), en('lateral-raise')]};
  assert.equal(api.evaluate('calSet(state.active.entries[0], 0)'), 1);
  const set = S.active.entries[0].sets[1]; set.reps = 12; set.calx = 3;
  try { api.evaluate('toggleDone(0,1)'); } catch (e) { /* the screen isn't there */ }
  assert.equal(S.rirCal.length, 0, 'no check saved without a call');
  assert.equal(set.done, true); assert.equal(set.reps, 15); assert.equal(set.rir, 0);
  assert.equal(api.evaluate('calSet(state.active.entries[1], 1)'), -1, 'and it does not move on to the next exercise');
});

test('the check is offered once a session: ticked without it, it does not move on to the next isolation exercise', () => {
  const api = muscle(), S = api.state();
  const en = id => ({exId: id, name: id, primary: ['quad'], secondary: [], equipment: 'Machine', target: {repLow: 10, repHigh: 15, rir: 2, rest: 90},
    sets: [0, 1].map(() => ({type: 'work', weight: 40, reps: 12, rir: 2, done: false}))});
  S.active = {id: 'a1', name: 'T', startedAt: Date.now(), entries: [en('leg-extension'), en('leg-curl'), en('lateral-raise')]};
  const at = () => [0, 1, 2].map(i => api.evaluate(`calSet(state.active.entries[${i}], ${i})`));
  assert.deepEqual(at(), [1, -1, -1]);
  try { api.evaluate('toggleDone(0,1)'); } catch (e) { /* the screen isn't there */ }
  assert.deepEqual(at(), [-1, -1, -1]);
  // one picked from a set's menu is still offered
  S.active.entries[1].sets[1].check = true;
  assert.equal(api.evaluate('calSet(state.active.entries[1], 1)'), 1);
});

test('a session started after today’s check-in starts with its answer, here or from Together', () => {
  const start = api => {
    try { api.evaluate(`startDayFrom('Legs', [{ex:{exId:'leg-extension', name:'Leg Extension', primary:['quad'], secondary:[], equipment:'Machine', comp:false, repLow:10, repHigh:15}, n:2}], 2, false, null, null)`); } catch (e) { /* the screen isn't there */ }
    return plain(api.state().active.readiness || null); };
  const api = muscle();
  api.evaluate(`localStorage.setItem('trainer.together', JSON.stringify({checkins:[{day:Day.start(), at:Date.now(), w:{sleep:1, energy:1, stress:1, mood:1}, sore:{quad:7}}]}))`);
  const r = start(api);
  assert.equal(r.flag, 'low'); assert.equal(r.soreness, 'low'); assert.match(r.text, /check-in/);
  const own = muscle();
  own.state().readyDay = own.evaluate('Day.key()');
  own.state().readyAns = {day: own.evaluate('Day.key()'), r: {sleep: 'good', energy: 'good', soreness: 'good', flag: 'good', text: 'x'}};
  assert.equal(start(own).flag, 'good', 'the answer from an earlier session today');
  const skipped = muscle();
  skipped.evaluate(`localStorage.setItem('trainer.together', JSON.stringify({checkins:[{day:Day.start(), at:Date.now(), skip:true}]}))`);
  assert.equal(start(skipped), null, 'skipped: nothing made up');
});

test('the swap list puts split squats ahead of hinges for a squat', () => {
  const api = muscle(), list = id => plain(api.evaluate(`swapCandidates(Object.assign({exId:'${id}'}, exById('${id}')))`)).map(e => e.id);
  const squat = list('back-squat');
  assert.ok(squat.indexOf('bulgarian-split-squat') >= 0 && squat.indexOf('bulgarian-split-squat') < squat.indexOf('romanian-deadlift'), squat.join());
  const press = list('leg-press');
  assert.ok(press.indexOf('bulgarian-split-squat') < press.indexOf('hip-abduction'), press.join());
});

test('one check-in a day: answered or skipped here or in Together, a session does not ask again', () => {
  const api = muscle();
  assert.equal(api.evaluate('askedToday()'), false);
  api.state().readyDay = api.evaluate('Day.key()');
  assert.equal(api.evaluate('askedToday()'), true);
  const other = muscle();
  other.evaluate(`localStorage.setItem('trainer.together', JSON.stringify({checkins:[{day:Day.start(), at:Date.now(), skip:true}]}))`);
  assert.equal(other.evaluate('askedToday()'), true, 'skipped in Together counts');
});

test('warm-up sets go before the first loaded compound of each part of the body, not only the first', () => {
  const api = muscle();
  const en = (id, w) => { const x = api.evaluate(`exById(${JSON.stringify(id)})`); return {exId: id, name: x.name, primary: x.primary, secondary: x.secondary, equipment: x.equipment,
    target: {repLow: 6, repHigh: 10, rir: 2}, sets: [0, 1, 2].map(() => ({type: 'work', weight: w}))}; };
  const es = [en('back-squat', 100), en('barbell-bench', 80), en('incline-db-press', 30), en('barbell-row', 70), en('leg-extension', 50)];
  api.state().active = {entries: es};
  api.evaluate('warmUp(state.active.entries)');
  const warm = plain(api.state().active.entries).map(e => e.sets.filter(s => s.type === 'warmup').map(s => s.weight));
  assert.ok(warm[0].length >= 2 && warm[0][0] === 20, 'the first lift starts from the bar: ' + warm[0]);
  assert.ok(warm[1].length >= 1 && warm[1].every(w => w > 20 && w < 80), 'the bench after squats gets ramp sets too: ' + warm[1]);
  assert.equal(warm[2].length, 0, 'a second push is warm already');
  assert.ok(warm[3].length >= 1, 'the first pull gets ramp sets');
  assert.equal(warm[4].length, 0, 'single-joint work has none');
});
