const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the actual isolated Ladder factory. Only its UI boot is omitted, so the
// assertions exercise production model/planner functions without a browser or
// a second implementation of the training rules.
function ladder() {
  const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
  const start = app.indexOf('  cal: function(__root){');
  assert.ok(start >= 0, 'Ladder factory exists');
  const bodyStart = app.indexOf('\n', start);
  const end = app.indexOf('/* ==================== BOOT ==================== */', bodyStart);
  assert.ok(end > bodyStart, 'Ladder boot boundary exists');
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      innerHTML: '', textContent: '', scrollTop: 0,
      classList: {add() {}, remove() {}, toggle() {}, contains() {return false;}},
      querySelector() {return null;}, querySelectorAll() {return [];},
      addEventListener() {}, focus() {}, setAttribute() {},
    });
    return elements.get(selector);
  };
  const root = {querySelector: element, querySelectorAll: () => [], addEventListener() {}, getElementById: element};
  const noOp = () => {};
  const context = vm.createContext({
    __root: root, Date, Math, JSON, Set, Map, console,
    setTimeout: () => 1, clearTimeout: noOp, setInterval: () => 1, clearInterval: noOp,
    window: {scrollTo: noOp, addEventListener: noOp},
    document: {addEventListener: noOp}, navigator: {},
    localStorage: {getItem: () => null, setItem: noOp},
    MiloSecurity: {html: value => value, parseSection: value => JSON.parse(value)},
    Safe: {put: noOp, rescue: noOp}, __setTheme: noOp,
    TakeBack: {make: () => ({keep: noOp, seal: noOp, edited: noOp, deleted: noOp, clear: noOp, get: () => null, changed: () => false})},
    SheetNav: {make: () => ({reg: noOp, opening: noOp, opened: noOp, closed: noOp})},
    OpenSets: {left: () => [], join: value => value},
  });
  const instructionsEnd = app.indexOf('/* ==================== BACK ====================');
  assert.ok(instructionsEnd > 0, 'shared exercise instruction boundary exists');
  vm.runInContext(app.slice(0, instructionsEnd), context, {filename: 'app.js:HOWTO'});
  const openSetsStart = app.indexOf('/* ==================== SETS NOT TICKED OFF ====================');
  const openSetsEnd = app.indexOf('/* ==================== TAKE BACK ====================', openSetsStart);
  vm.runInContext(app.slice(openSetsStart, openSetsEnd), context, {filename: 'app.js:OpenSets'});
  context.OpenSets = context.window.OpenSets;
  context.Parked = context.window.Parked;
  vm.runInContext(`(function(__root) { ${app.slice(bodyStart, end)}
    state = defaultState();
    globalThis.ladderTest = {
      getState: () => state,
      setState: value => { state = normalize(value); },
      evaluate: expression => eval(expression),
    };
  })(__root);`, context, {filename: 'app.js:Ladder'});
  return context.ladderTest;
}

const plain = value => JSON.parse(JSON.stringify(value));
function record(ladderId, stepIdx, values, {date = Date.now(), setup = {}, clean = true, id, target} = {}) {
  return {
    id: id || `${ladderId}-${date}`, name: 'Regression session', date, durationSec: 120,
    entries: [{ladderId, stepIdx, setup, clean, target,
      sets: values.map(v => ({v, done: true, rir: 2, clean, setup: {...setup}}))}], cleared: [],
  };
}
function placed(api, id, i) {
  api.getState().placed[id] = true;
  api.getState().rung[id] = i;
}
const day = 86400000;
function setupFor(api, id, i, text = 'Light red band, knee support') {
  const fields = plain(api.evaluate(`setupFields(stepsOf(${JSON.stringify(id)})[${i}])`));
  return Object.fromEntries(fields.map(field => [field.key, field.type === 'number' ? Math.max(1, Number(field.min || 0)) : text]));
}

test('support pulling stays on an unmet exact rep standard instead of leaving it behind',()=>{
  const api=ladder(),state=api.getState();state.goals=[api.evaluate('makeGoal("muscleup")')];placed(api,'pull',4);
  state.history.push(record('pull',4,[8,8,8],{date:Date.now()-3*day}),record('pull',4,[8,8,8],{date:Date.now()-day}));
  assert.equal(api.evaluate('capFor("pull")'),4);
  assert.equal(api.evaluate('rungTarget("pull",4,"support")'),9);
  placed(api,'pull',6);
  const plans=plain(api.evaluate('Array.from({length:4},(_,ahead)=>todayPlan(ahead)).flat().filter(x=>x.id==="pull")'));
  assert.ok(plans.length>0);assert.ok(plans.every(x=>x.i===4),'past placement still schedules the exact unmet standard');
  state.history.push(record('pull',4,[12]));
  assert.equal(api.evaluate('pendingStandard("pull")'),null);
});

test('a main goal retains earlier exact supporting standards in its rotation',()=>{
  const api=ladder(),state=api.getState();state.goals=[api.evaluate('makeGoal("muscleup")'),api.evaluate('makeGoal("oapu")')];placed(api,'pull',8);
  const plans=plain(api.evaluate('Array.from({length:4},(_,ahead)=>todayPlan(ahead)).flat().filter(x=>x.id==="pull")'));
  assert.ok(plans.some(x=>x.i===4&&x.role==='need'));
  assert.ok(plans.some(x=>x.i===8),'the advanced main movement remains available');
});

test('higher rung placement and 3 × 8 pull-ups do not prove a 12-rep prerequisite', () => {
  const api = ladder(), state = api.getState();
  state.paths.pull = 'unilateral';
  placed(api, 'pull', 5);
  state.said.pull = 8;
  state.history.push(record('pull', 4, [8, 8, 8]));
  state.history.push(record('pull', 5, [5, 5, 5]));
  assert.equal(api.evaluate('needMet({l:"pull",r:4,v:12,q:"strength"})'), false);
  assert.equal(api.evaluate('meets("pull",4,12)'), false);
  state.history.push(record('pull', 4, [12]));
  assert.equal(api.evaluate('needMet({l:"pull",r:4,v:12,q:"strength"})'), true);
  assert.equal(api.evaluate('meets("pull",4,12)'), true);
});

test('a goal requires recent clean performance of its exact exercise and standard', () => {
  const api = ladder(), state = api.getState();
  state.paths.pull = 'unilateral';
  placed(api, 'pull', 8);
  state.history.push(record('pull', 4, [8, 8, 8]));
  assert.equal(api.evaluate('goalMet({l:"pull",r:4,std:10})'), false);
  assert.ok(api.evaluate('goalProgress({l:"pull",r:4,std:10})') < 1);
  state.history.push(record('pull', 4, [10], {clean: false}));
  assert.equal(api.evaluate('goalMet({l:"pull",r:4,std:10})'), false);
  state.history.push(record('pull', 4, [10], {date: Date.now() - 91 * day}));
  assert.equal(api.evaluate('goalMet({l:"pull",r:4,std:10})'), false);
  state.history.push(record('pull', 4, [10]));
  assert.equal(api.evaluate('goalMet({l:"pull",r:4,std:10})'), true);
});

test('legacy saves preserve original numeric indices, workouts and goals without granting unverified readiness', () => {
  const api = ladder();
  const legacy = {
    v: 2, rung: {pull: 5, row: 3, hinge: 4}, placed: {pull: true, row: true, hinge: true},
    history: [record('row', 3, [6, 6, 6]), record('pull', 4, [12])],
    tests: [{id: 'old-test', date: Date.now(), ladderId: 'pull', stepIdx: 4, v: 15}],
    goals: [{id: 'legacy-goal', key: 'nordic', l: 'hinge', r: 4, std: 1, sup: [], achieved: null}],
  };
  legacy.history.forEach(workout => workout.entries.forEach(entry => {
    delete entry.clean; delete entry.setup;
    entry.sets.forEach(set => {delete set.clean; delete set.setup;});
  }));
  api.setState(legacy);
  const state = api.getState();
  assert.equal(state.rung.pull, 5);
  assert.equal(state.rung.row, 3);
  assert.equal(state.rung.hinge, 4);
  assert.equal(state.history[0].entries[0].stepIdx, 3);
  assert.equal(api.evaluate('stepsOf("row")[3].id'), 'tuck-fl-row');
  assert.equal(api.evaluate('stepsOf("hinge")[4].id'), 'nordic-curl');
  assert.equal(state.goals[0].r, 4);
  assert.equal(api.evaluate('curIdx("pull")'), 5, 'migration keeps the familiar one-arm branch');
  assert.equal(api.evaluate('curIdx("row")'), 3, 'migration keeps the familiar lever-row branch');
  assert.equal(api.evaluate('bestFor("pull",4)'), 15, 'historical best stays available');
  assert.equal(api.evaluate('verifiedBestFor("pull",4)'), 0, 'old unconfirmed records are not proof');
  assert.equal(api.evaluate('needMet({l:"pull",r:4,v:12})'), false);
});

test('advancement requires repeatability on two separate days plus a next-exercise entry check', () => {
  const api = ladder(), state = api.getState();
  placed(api, 'dip', 0);
  state.history.push(record('dip', 0, [30, 30, 30], {id: 'first'}));
  state.history.push(record('dip', 0, [30, 30, 30], {id: 'same-day'}));
  assert.equal(api.evaluate('currentProof("dip",0).ready'), false);
  state.history.push(record('dip', 0, [30, 30, 30], {date: Date.now() - day}));
  assert.equal(api.evaluate('currentProof("dip",0).ready'), true);
  assert.equal(api.evaluate('entryReady("dip",1)'), false);
  const minimum = api.evaluate('entryMinimum("dip",1)');
  state.history.push(record('dip', 1, [minimum], {setup: setupFor(api, 'dip', 1)}));
  assert.equal(api.evaluate('entryReady("dip",1)'), true);
});

test('stale successful sessions cannot satisfy the two-session advancement rule', () => {
  const api = ladder(), state = api.getState();
  placed(api, 'dip', 0);
  state.history.push(record('dip', 0, [30, 30, 30], {date: Date.now() - 43 * day}));
  state.history.push(record('dip', 0, [30, 30, 30]));
  assert.equal(api.evaluate('currentProof("dip",0).ready'), false);
});

test('setup is not measured: sets count toward readiness without it, and assisted work still cannot prove an unassisted entry', () => {
  const api = ladder(), state = api.getState();
  assert.deepEqual(plain(api.evaluate('setupFields(stepsOf("pull")[3])')), [], 'no setup fields are asked for');
  state.history.push(record('pull', 3, [8, 8, 8], {setup: {}, date: Date.now() - 2 * day}));
  assert.equal(api.evaluate('verifiedBestFor("pull",3)'), 8);
  assert.equal(api.evaluate('currentProof("pull",3).ready'), false);
  state.history.push(record('pull', 3, [8, 8, 8], {setup: {band: 'Light red'}, date: Date.now() - day}));
  assert.equal(api.evaluate('currentProof("pull",3).ready'), true, 'old logs with a recorded setup count alongside new ones');
  assert.equal(api.evaluate('entryReady("pull",4)'), false, 'assisted performance cannot prove an unassisted entry');
});

test('logging a blank set records its target as clean form, and practice attempts stay separate', () => {
  const api = ladder(), state = api.getState();
  placed(api, 'pull', 3);
  const entry = api.evaluate('planEntry({id:"pull",i:3,sets:3,role:"goal",target:8})');
  state.route = 'train';
  state.active = {id: 'active-regression', name: 'Regression session', startedAt: Date.now(), entries: [entry]};
  assert.equal(entry.clean, true, 'new exercises assume clean form');
  api.evaluate('toggleDone(0,0)');
  assert.equal(entry.sets[0].done, true);
  assert.equal(entry.sets[0].v, 8, 'a blank set logs the target it shows');
  assert.equal(entry.sets[0].clean, true);
  entry.clean = false; entry.sets[1].v = 6;
  api.evaluate('toggleDone(0,1)');
  assert.equal(entry.sets[1].done, true, 'practice attempts remain loggable');
  assert.equal(entry.sets[1].v, 6, 'an entered value is kept');
  assert.equal(entry.sets[1].clean, false);
  assert.equal(entry.sets[0].clean, true, 'clearing the box leaves earlier sets clean');
});

test('handstand prescriptions grow toward the declared 30-second goal and 60-second support standard', () => {
  const api = ladder(), state = api.getState();
  placed(api, 'handstand', 3);
  state.goals.push(api.evaluate('makeGoal("handstand")'));
  const base = api.evaluate('stepsOf("handstand")[3].v');
  const sets = api.evaluate('stepsOf("handstand")[3].sets');
  assert.equal(base, 15);
  assert.equal(api.evaluate('rungTarget("handstand",3,"goal")'), 15);
  let elapsed = 12;
  for (const target of [15, 20, 25, 30]) {
    state.history.push(record('handstand', 3, Array(sets).fill(target), {target, date: Date.now() - elapsed-- * day}));
    state.history.push(record('handstand', 3, Array(sets).fill(target), {target, date: Date.now() - elapsed-- * day}));
    assert.equal(api.evaluate('rungTarget("handstand",3,"goal")'), Math.min(30, target + 5));
  }
  state.goals = [api.evaluate('makeGoal("oahs")')];
  assert.equal(api.evaluate('rungTarget("handstand",3,"support")'), 35, 'support reaches beyond the base rung target');
  for (const target of [35, 40, 45, 50, 55, 60]) {
    state.history.push(record('handstand', 3, Array(sets).fill(target), {target, date: Date.now() - (target + 1) * day / 2}));
    state.history.push(record('handstand', 3, Array(sets).fill(target), {target, date: Date.now() - (target - 1) * day / 2}));
  }
  assert.equal(api.evaluate('rungTarget("handstand",3,"support")'), 60);
  const entry = api.evaluate('planEntry({id:"handstand",i:3,sets:3,role:"support"})');
  assert.equal(entry.target, 60, 'session stores its prescribed target');
});

test('one successful day does not raise the prescription', () => {
  const api = ladder(), state = api.getState();
  state.goals.push(api.evaluate('makeGoal("handstand")'));
  state.history.push(record('handstand', 3, [15, 15, 15], {target: 15}));
  state.history.push(record('handstand', 3, [15, 15, 15], {target: 15, id: 'same-day-repeat'}));
  assert.equal(api.evaluate('rungTarget("handstand",3,"goal")'), 15);
});

test('self-reported prerequisites are dated and specific to the exercise and target', () => {
  const api = ladder(), state = api.getState();
  state.needClaims['pullup|12'] = {v:12, date: Date.now()};
  assert.equal(api.evaluate('needMet({l:"pull",r:4,v:12})'), true);
  assert.equal(api.evaluate('needMet({l:"pull",r:4,v:15})'), false);
  state.needClaims['pullup|12'].date = Date.now() - 91 * day;
  assert.equal(api.evaluate('needMet({l:"pull",r:4,v:12})'), false);
});

test('wrong-value, future, and malformed prerequisite confirmations cannot certify readiness', () => {
  const api = ladder(), state = api.getState();
  const invalid = [
    {v:8,date:Date.now()},
    {v:12,date:Date.now()+day},
    {v:12,date:'today'},
    {v:12,date:String(Date.now())},
    {v:12,date:NaN},
    {v:12,date:Infinity},
    {v:12},
    {date:Date.now()},
  ];
  for (const claim of invalid) {
    state.needClaims['pullup|12'] = claim;
    assert.equal(api.evaluate('needMet({l:"pull",r:4,v:12})'), false, 'invalid confirmation is not evidence');
  }
});

test('completed supporting qualities remain in rotating maintenance and return to training when proof expires', () => {
  const api = ladder(), state = api.getState();
  state.goals.push(api.evaluate('makeGoal("pistol")'));
  const needs = plain(api.evaluate('goalNeeds(activeGoals()[0])'));
  assert.ok(needs.length > 0);
  needs.forEach(need => {
    const exercise = api.evaluate(`rungId(${JSON.stringify(need.l)},${need.r})`);
    state.needClaims[exercise + '|' + need.v] = {v:need.v, date: Date.now()};
  });
  assert.equal(api.evaluate('planIds().needs.length'), 0);
  assert.ok(api.evaluate('planIds().maintenance.length') > 0);
  const plan = plain(api.evaluate('todayPlan()'));
  const maintenance = plan.find(item => item.role === 'maintenance');
  assert.ok(maintenance, 'a completed quality is retained in the session');
  assert.equal(maintenance.sets, 1);
  const first = needs[0], exercise = api.evaluate(`rungId(${JSON.stringify(first.l)},${first.r})`);
  state.needClaims[exercise + '|' + first.v].date = Date.now() - 91 * day;
  assert.ok(plain(api.evaluate('planIds().needs')).some(need => need.l === first.l));
});

test('catalog keeps every legacy exercise at its original saved index', () => {
  // Snapshot taken from the reviewed pre-update commit 6ae215dc0f752cc8e1765471fd4fe292c11a9b37.
  const original = require('./ladder-legacy-ids.json'), api = ladder();
  const catalog = plain(api.evaluate('LADDERS'));
  for (const [id, exercises] of Object.entries(original)) {
    assert.ok(catalog[id], `${id} still exists`);
    assert.deepEqual(catalog[id].steps.slice(0, exercises.length).map(step => step.id), exercises, `${id} preserves stored indices`);
  }
});

test('every route has valid unique exercise IDs and all catalog exercises remain reachable', () => {
  const api = ladder(), routes = plain(api.evaluate('LADDER_PATHS')), catalog = plain(api.evaluate('LADDERS'));
  for (const [id, paths] of Object.entries(routes)) {
    const ids = new Set(catalog[id].steps.map(step => step.id));
    assert.equal(new Set(paths.map(route => route.key)).size, paths.length, `${id} route keys are unique`);
    const reachable = new Set();
    for (const route of paths) {
      assert.ok(route.steps.length > 0, `${id}/${route.key} contains exercises`);
      assert.equal(new Set(route.steps).size, route.steps.length, `${id}/${route.key} has no repeated exercises`);
      route.steps.forEach(exercise => {
        assert.ok(ids.has(exercise), `${id}/${route.key} exercise ${exercise} exists`);
        reachable.add(exercise);
      });
    }
    assert.deepEqual([...reachable].sort(), [...ids].sort(), `${id} exercises are all reachable on a route`);
  }
});

test('new exercises have full setup, movement and form instructions', () => {
  const original = require('./ladder-legacy-ids.json'), old = new Set(Object.values(original).flat());
  const api = ladder(), catalog = plain(api.evaluate('LADDERS')), howto = plain(api.evaluate('window.HOWTO'));
  const newIds = new Set(Object.values(catalog).flatMap(value => value.steps.map(step => step.id)).filter(id => !old.has(id)));
  assert.ok(newIds.size > 0);
  for (const id of newIds) {
    assert.ok(howto[id]?.set?.length > 0, `${id} explains how to set up`);
    assert.ok(howto[id]?.steps?.length > 0, `${id} explains the movement`);
    assert.ok(howto[id]?.avoid?.length > 0, `${id} explains common form errors`);
  }
});

test('goal branches use specific bridges and weighted pulling remains independent of one-arm pulling', () => {
  const api = ladder(), state = api.getState();
  state.paths.pull = 'bilateral'; placed(api, 'pull', 4);
  assert.equal(api.evaluate('rungId("pull",nextRung("pull",4))'), 'weighted-pullup');
  assert.equal(api.evaluate('previousRung("pull",6)'), 4);
  state.goals.push(api.evaluate('makeGoal("oapu")'));
  assert.ok(plain(api.evaluate('pathFor("pull")')).includes(8));
  assert.equal(api.evaluate('rungId("pull",nextRung("pull",4))'), 'assisted-archer-pullup');
  const weighted = api.evaluate('entryFor("weightedpull",1)');
  assert.equal(weighted.ladderId, 'weightedpull');
  assert.equal(api.evaluate('rungId("weightedpull",1)'), 'weighted-pullup');
  state.goals = [api.evaluate('makeGoal("oapush")')];
  const pushing = plain(api.evaluate('pathFor("pushh").map(i=>rungId("pushh",i))'));
  assert.ok(pushing.includes('incline-one-arm-pushup') && pushing.includes('assisted-one-arm-pushup'));
  assert.ok(!pushing.includes('pseudo-planche-pushup'));
  state.goals = [api.evaluate('makeGoal("nordic")')];
  const nordic = plain(api.evaluate('pathFor("hinge").map(i=>rungId("hinge",i))'));
  assert.ok(nordic.includes('sliding-hamstring-curl') && nordic.includes('assisted-nordic-curl'));
  assert.ok(!nordic.includes('glute-bridge') && !nordic.includes('back-extension-hold'));
  state.goals = [api.evaluate('makeGoal("pistol")')];
  const pistol = plain(api.evaluate('pathFor("legs").map(i=>rungId("legs",i))'));
  assert.ok(pistol.includes('box-pistol') && pistol.includes('assisted-pistol') && pistol.includes('counterbalance-pistol'));
  assert.ok(!pistol.includes('shrimp-squat'));
});

test('volume days use an explicitly related movement instead of the preceding catalog index', () => {
  const api = ladder(), state = api.getState();
  state.paths.pull = 'bilateral'; placed(api, 'pull', 6);
  state.goals.push({id:'weighted-pull-goal',l:'pull',r:6,std:8,sup:[],achieved:null});
  const plan = plain(api.evaluate('todayPlan(1)'));
  const volume = plan.find(item => item.id === 'pull');
  assert.equal(volume.role, 'volume');
  assert.equal(volume.i, 4, 'weighted pull-up volume uses strict pull-ups, skipping raw index 5 archers');
  const catalog = plain(api.evaluate('LADDERS'));
  for (const [id, value] of Object.entries(catalog)) for (const step of value.steps) {
    if (step.volume) assert.ok(value.steps.some(candidate => candidate.id === step.volume), `${id}/${step.id} has a valid same-ladder volume movement`);
  }
});

test('every goal selects a route that can train each of its exact supporting standards', () => {
  const api = ladder(), state = api.getState(), order = plain(api.evaluate('GOAL_ORDER'));
  for (const key of order) {
    state.goals = [api.evaluate(`makeGoal(${JSON.stringify(key)})`)];
    const goal = state.goals[0];
    assert.ok(plain(api.evaluate(`pathFor(${JSON.stringify(goal.l)})`)).includes(goal.r), `${key} can reach its own exercise`);
    const needs = plain(api.evaluate('goalNeeds(activeGoals()[0])'));
    for (const need of needs) {
      assert.ok(plain(api.evaluate(`pathFor(${JSON.stringify(need.l)})`)).includes(need.r), `${key} can train ${need.l} rung ${need.r}`);
    }
  }
});

test('active-session migration and continuing a completed session preserve prescribed targets and per-set setup', () => {
  const api = ladder();
  const setup = setupFor(api, 'pull', 3), entry = record('pull', 3, [8], {setup, target: 9}).entries[0];
  entry.sets.push({v:9,done:false,setup:{...setup},clean:false});
  api.setState({v:2,onboarded:true,route:'train',rung:{pull:3},placed:{pull:true},
    active:{id:'migrated-active',name:'Migrated session',startedAt:Date.now(),entries:[entry]}});
  let state = api.getState();
  assert.equal(state.active.entries[0].target, 9);
  assert.deepEqual(plain(state.active.entries[0].sets[0].setup), setup);
  api.evaluate('finishWorkout()');
  const saved = plain(state.history[0]);
  assert.equal(saved.entries[0].target, 9);
  assert.deepEqual(saved.entries[0].sets[0].setup, setup);
  api.evaluate('continueSession("migrated-active")');
  state = api.getState();
  assert.equal(state.active.entries[0].target, 9);
  assert.deepEqual(plain(state.active.entries[0].sets[0].setup), setup);
  assert.equal(state.active.entries[0].sets[0].clean, true);
  assert.equal(state.active.entries[0].sets[0].done, true);
  assert.equal(state.active.entries[0].sets[1].done, false);
  api.evaluate('finishWorkout()');
  assert.equal(state.history[0].date, saved.date, 'continuing preserves the original training day');
  assert.equal(state.history[0].entries[0].target, 9);
});

test('an entirely unstarted exercise keeps its target and setup when a finished session is continued', () => {
  const api = ladder(), state = api.getState();
  const setup = setupFor(api, 'weightedpull', 1);
  const entry = record('pull', 4, [8], {target:8}).entries[0];
  const queued = api.evaluate('entryFor("weightedpull",1)');
  queued.target = 7; queued.setup = setup;
  state.active = {id:'queued-session',name:'Queued regression',startedAt:Date.now(),entries:[entry,queued]};
  api.evaluate('finishWorkout()');
  api.evaluate('continueSession("queued-session")');
  const resumed = state.active.entries.find(value => value.ladderId === 'weightedpull');
  assert.equal(resumed.target, 7);
  assert.deepEqual(plain(resumed.setup), setup);
});

test('route choices and exact prerequisite confirmations survive saving and restoring', () => {
  const api = ladder(), state = api.getState();
  state.paths.pull = 'unilateral';
  state.needClaims['pullup|12'] = {v:12, date: Date.now()};
  const saved = plain(api.evaluate('payload()'));
  assert.equal(saved.paths.pull, 'unilateral');
  assert.deepEqual(saved.needClaims['pullup|12'], plain(state.needClaims['pullup|12']));
  api.setState(saved);
  assert.equal(api.getState().paths.pull, 'unilateral');
  assert.equal(api.evaluate('needMet({l:"pull",r:4,v:12})'), true);
});

test('a failed new entry check cannot advance on an older successful test', () => {
  const api = ladder(), state = api.getState();
  placed(api, 'dip', 0);
  state.history.push(record('dip', 0, [30, 30, 30], {date: Date.now() - day}));
  state.history.push(record('dip', 0, [30, 30, 30]));
  state.tests.push({date:Date.now()-2*day,ladderId:'dip',stepIdx:1,v:3,clean:true,setup:setupFor(api,'dip',1)});
  assert.equal(api.evaluate('entryReady("dip",1)'), true, 'there is earlier supporting evidence');
  api.evaluate('testCtx={queue:[],results:[],id:"dip",i:1,advance:{from:0,manual:true}};recordTest(0)');
  assert.equal(state.rung.dip, 0, 'the failed check keeps the current training rung');
});

test('custom goals can train branch-specific standards borrowed from their closest standard goal', () => {
  const api = ladder(), state = api.getState();
  state.goals.push({id:'custom-oap',key:'custom',l:'pull',r:8,std:2,sup:[],achieved:null});
  const needs = plain(api.evaluate('goalNeeds(activeGoals()[0])'));
  assert.ok(needs.some(need => need.l === 'pullvar' && need.r === 3), 'custom one-arm pulling borrows its supporting standard');
  for (const need of needs) {
    assert.ok(plain(api.evaluate(`pathFor(${JSON.stringify(need.l)})`)).includes(need.r), `custom goal can train ${need.l} rung ${need.r}`);
  }
});

test('many goals take turns so every session stays within its caps, and every goal still comes round', () => {
  const api = ladder(), state = api.getState();
  const keys = ['pullup10', 'pushup20', 'dip10', 'pistol', 'frontlever', 'lsit', 'handstand', 'crow'];
  state.goals = keys.map(k => api.evaluate(`makeGoal(${JSON.stringify(k)})`));
  ['pull', 'pushh', 'dip', 'legs', 'frontlever', 'core', 'handstand', 'armbalance', 'row', 'pushv', 'hinge'].forEach(id => placed(api, id, 1));
  const caps = plain(api.evaluate('({S:SESSION_CAP, G:GOAL_CAP, B:BALANCE_CAP})'));
  const mains = plain(api.evaluate('planIds().mains'));
  const balance = mains.filter(id => api.evaluate(`practiceOf(${JSON.stringify(id)})`) === 'balance');
  const sessions = plain(api.evaluate('Array.from({length:8},(_,ahead)=>todayPlan(ahead))'));
  sessions.forEach((plan, k) => {
    const counted = plan.filter(x => x.id !== 'wrist' && x.role !== 'maintenance');
    const goalWork = plan.filter(x => mains.includes(x.id));
    assert.ok(counted.length <= caps.S, `session ${k} has ${counted.length} exercises`);
    assert.ok(goalWork.filter(x => !balance.includes(x.id)).length <= caps.G, `session ${k} holds at most ${caps.G} strength goals`);
    assert.ok(goalWork.filter(x => balance.includes(x.id)).length <= caps.B, `session ${k} holds at most ${caps.B} balance skills`);
  });
  const strength = mains.filter(id => !balance.includes(id));
  const rounds = Math.ceil(strength.length / caps.G);
  const seen = new Set(sessions.slice(0, rounds).flat().map(x => x.id));
  assert.ok(strength.every(id => seen.has(id)), 'every strength goal is trained within one full turn of the rotation');
  assert.ok(balance.every(id => sessions.every(plan => plan.some(x => x.id === id))), 'balance practice comes every session while it fits');
});

test('a goal that takes turns still alternates its target and volume days', () => {
  const api = ladder(), state = api.getState();
  state.goals = ['hspu', 'pullup10', 'pushup20', 'pistol', 'lsit'].map(k => api.evaluate(`makeGoal(${JSON.stringify(k)})`));
  ['pull', 'pushh', 'legs', 'core'].forEach(id => placed(api, id, 3));
  placed(api, 'pushv', api.evaluate('stepsOf("pushv").findIndex(s=>s.id==="elevated-pike-pushup")'));
  assert.ok(api.evaluate('stepsOf("pushv")[curIdx("pushv")].volume'), 'the overhead pressing rung has a volume day');
  const roles = plain(api.evaluate('Array.from({length:10},(_,ahead)=>todayPlan(ahead))')).flat().filter(x => x.id === 'pushv').map(x => x.role);
  assert.ok(roles.length >= 4 && roles.length < 10, 'the pressing goal takes turns but comes round regularly: ' + roles.length);
  assert.ok(roles.includes('goal') && roles.includes('volume'), 'both target and volume days still happen: ' + roles.join(','));
});

test('a couple of goals are all trained every session, as before', () => {
  const api = ladder(), state = api.getState();
  state.goals = ['pullup1', 'pushup20'].map(k => api.evaluate(`makeGoal(${JSON.stringify(k)})`));
  placed(api, 'pull', 2); placed(api, 'pushh', 3);
  const sessions = plain(api.evaluate('Array.from({length:4},(_,ahead)=>todayPlan(ahead))'));
  assert.ok(sessions.every(plan => ['pull', 'pushh'].every(id => plan.some(x => x.id === id))));
});
