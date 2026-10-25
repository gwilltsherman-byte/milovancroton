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
  context.Prefs = context.window.Prefs;
  context.Lift = context.window.Lift;
  context.SAME_LIFT = context.window.SAME_LIFT;
  // the shared engine: typed numbers, calendar days, kit and bodyweight
  ['Num', 'Day', 'Kit', 'Body'].forEach(k => { context[k] = context.window[k]; });
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

// Item 50 changed this: assisted steps now ask one number, a help level, and only sets with it are proof.
test('assisted steps ask one help level: sets without it are practice, and assisted work still cannot prove an unassisted entry', () => {
  const api = ladder(), state = api.getState();
  assert.deepEqual(plain(api.evaluate('setupFields(stepsOf("pull")[3])')).map(f => f.key), ['assist'], 'one help level is asked for');
  assert.deepEqual(plain(api.evaluate('setupFields(stepsOf("pull")[4])')), [], 'an unassisted step asks for nothing');
  state.history.push(record('pull', 3, [8, 8, 8], {setup: {}, date: Date.now() - 2 * day}));
  assert.equal(api.evaluate('verifiedBestFor("pull",3)'), 0, 'a set without its help level is not proof');
  assert.equal(api.evaluate('bestFor("pull",3)'), 8, 'it still shows in the logged best');
  state.history.push(record('pull', 3, [8, 8, 8], {setup: {assist: 3}, date: Date.now() - 2 * day}));
  state.history.push(record('pull', 3, [8, 8, 8], {setup: {assist: 2}, date: Date.now() - day}));
  assert.equal(api.evaluate('verifiedBestFor("pull",3)'), 8);
  assert.equal(api.evaluate('currentProof("pull",3).ready'), true, 'less help on the second day counts for the first day\'s level');
  assert.equal(api.evaluate('currentProof("pull",3).setup.assist'), 3);
  assert.equal(api.evaluate('entryReady("pull",4)'), false, 'assisted performance cannot prove an unassisted entry');
  state.history.splice(1, 2, record('pull', 3, [8, 8, 8], {setup: {assist: 4}, date: Date.now() - 2 * day}),
    record('pull', 3, [8, 8, 8], {setup: {assist: 1}, date: Date.now() - day}));
  assert.equal(api.evaluate('currentProof("pull",3).setup.assist'), 4, 'two days at 4 and 1 prove level 4, not level 1');
  state.history.splice(1, 1);
  assert.equal(api.evaluate('currentProof("pull",3).ready'), false, 'one day at a level is not yet repeatable');
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

/* ==== Wave 1: spacing, proof, progress, dose, gates, holds ==== */
const hour = 3600000;
const goals = (api, ...keys) => { api.getState().goals = keys.map(k => api.evaluate(`makeGoal(${JSON.stringify(k)})`)); };
const where = (api, sid) => plain(api.evaluate(`(()=>{ for(const l of Object.keys(LADDERS)){ const i=stepsOf(l).findIndex(s=>s.id===${JSON.stringify(sid)}); if(i>=0) return [l,i]; } return null; })()`));
const planFor = (api, id, ahead = 0) => plain(api.evaluate(`todayPlan(${ahead})`)).find(x => x.id === id);
const notesFor = (api, id, ahead = 0) => plain(api.evaluate(`todayPlan(${ahead}).notes`)).filter(n => n.id === id);
const withRir = (rec, rirs) => { rec.entries[0].sets.forEach((s, k) => { s.rir = rirs[k]; }); return rec; };
// Muscle, as Ladder reaches it through the hub: its ticked sets of shared exercises, and its bodyweight log
function muscle(api, sessions, body = []) {
  api.evaluate(`window.__hub={has:k=>k==='lift', api:()=>({sharedSets:ids=>${JSON.stringify(sessions)}.map(w=>({id:w.id, date:w.date, entries:w.entries.filter(e=>ids.includes(e.exId))})).filter(w=>w.entries.length),
    stamp:()=>${Date.now() + Math.random()}, bodyLog:()=>${JSON.stringify(body)}})}`);
}
const mset = (exId, reps, date, rir = 2) => ({id: 'm' + date + exId, date, entries: [{exId, sets: reps.map(r => ({reps: r, rir}))}]});

test('a hard straight-arm session waits about 48 hours, and Today says why', () => {
  const api = ladder(), state = api.getState();
  goals(api, 'tuckplanche'); placed(api, 'planche', 1);
  state.history.push(record('planche', 1, [10, 10, 10], {date: Date.now() - 24 * hour}));
  const p = planFor(api, 'planche');
  assert.ok(!p || (p.role === 'easy' && p.i !== 1), 'the day after a hard planche session plans an easier rung or nothing');
  if (p) assert.equal(p.i, api.evaluate('previousRung("planche",1)'), 'the easier rung is the step before');
  const n = notesFor(api, 'planche');
  assert.equal(n.length, 1); assert.equal(n[0].why, 'rest'); assert.equal(n[0].f, 'straight');
  assert.match(api.evaluate('noteText(todayPlan().notes.find(n=>n.id==="planche"))'), /rest until .*straight-arm/);
  state.history[0].date = Date.now() - 49 * hour;
  const q = planFor(api, 'planche');
  assert.ok(q && q.role !== 'easy', 'after 48 hours the goal trains hard again');
  assert.equal(notesFor(api, 'planche').length, 0);
});

test('planned straight-arm sessions never land on two days in a row, and an easier day is not a hard one', () => {
  const api = ladder();
  goals(api, 'tuckplanche'); placed(api, 'planche', 1);
  const hard = Array.from({length: 6}, (_, k) => { const p = planFor(api, 'planche', k); return !!p && p.role !== 'easy'; });
  assert.ok(hard.some(Boolean), 'it is still trained hard');
  hard.forEach((h, k) => { if (k) assert.ok(!(h && hard[k - 1]), `sessions ${k - 1} and ${k} are both hard: ${hard}`); });
  const api2 = ladder(), s2 = api2.getState();
  goals(api2, 'tuckplanche'); placed(api2, 'planche', 1);
  s2.history.push(Object.assign(record('planche', 5, [10, 10, 10], {date: Date.now() - 24 * hour}), {}));
  s2.history[0].entries[0].role = 'easy';
  assert.ok(planFor(api2, 'planche').role !== 'easy', 'sets on an easier day leave the next hard session where it was');
});

test('a session trains at most one straight-arm skill hard, and press is one of them', () => {
  const api = ladder();
  goals(api, 'tuckplanche', 'frontlever', 'tuckbl'); placed(api, 'planche', 1); placed(api, 'frontlever', 0); placed(api, 'backlever', 2);
  assert.ok(api.evaluate('STRAIGHT_ARM.includes("press")'));
  assert.equal(api.evaluate('hardFam("press",3)'), 'straight');
  assert.equal(api.evaluate('hardFam("press",0)'), null, 'pike compression is not straight-arm work');
  for (let k = 0; k < 4; k++) {
    const plan = plain(api.evaluate(`todayPlan(${k})`));
    const hard = plan.filter(x => x.role !== 'easy' && api.evaluate(`hardFam(${JSON.stringify(x.id)},${x.i})`) === 'straight');
    assert.ok(hard.length <= 1, `session ${k} trains ${hard.map(x => x.id)} hard`);
  }
  const notes = plain(api.evaluate('todayPlan().notes'));
  assert.ok(notes.some(n => n.why === 'one'), 'the others say why');
});

test('Nordics wait 72 hours in the first four weeks and 48 after, counting Muscle\'s Nordic sets', () => {
  const api = ladder(), state = api.getState();
  goals(api, 'nordic'); placed(api, 'hinge', 4);
  state.history.push(record('hinge', 4, [1, 1, 1], {date: Date.now() - 50 * hour}));
  let n = notesFor(api, 'hinge');
  assert.equal(n.length, 1, 'a first-month Nordic session 50 hours ago still rests'); assert.equal(n[0].f, 'nordic');
  assert.match(api.evaluate('noteText(todayPlan().notes[0])'), /Nordic work/);
  state.history.unshift(record('hinge', 4, [1, 1, 1], {date: Date.now() - 40 * day}));
  assert.equal(notesFor(api, 'hinge').length, 0, 'after the first month, 48 hours is enough');
  const api2 = ladder();
  goals(api2, 'nordic'); placed(api2, 'hinge', 4);
  muscle(api2, [mset('nordic-curl', [5, 5], Date.now() - 20 * hour)]);
  assert.equal(notesFor(api2, 'hinge')[0].why, 'rest', 'a Nordic set logged in Muscle counts for spacing');
});

test('sets imported from Muscle are volume, not proof, and Muscle\'s Nordic curl is Nordic lowering', () => {
  const api = ladder();
  goals(api, 'pullup10'); placed(api, 'pull', 4);
  muscle(api, [mset('pullup', [10, 10, 10], Date.now() - 3 * day), mset('pullup', [10, 10, 10], Date.now() - day), mset('nordic-curl', [6], Date.now() - day)]);
  assert.equal(api.evaluate('bestFor("pull",4)'), 10, 'they show in the logged best');
  assert.equal(api.evaluate('verifiedBestFor("pull",4)'), 0, 'but prove nothing');
  assert.equal(api.evaluate('goalMet(activeGoals()[0])'), false, 'ten pull-ups in Muscle do not meet the goal');
  assert.equal(api.evaluate('currentProof("pull",4).ready'), false);
  assert.equal(api.evaluate('rungTarget("pull",4,"goal")'), 10, 'they tell today\'s dose where you are');
  const imported = plain(api.evaluate('allHistory().filter(w=>w.muscle)')).flatMap(w => w.entries);
  assert.ok(imported.every(e => e.clean === false && e.sets.every(s => s.clean === false)));
  const nordic = imported.find(e => e.ladderId === 'hinge');
  assert.equal(api.evaluate(`rungId("hinge",${nordic.stepIdx})`), 'nordic-negative');
  assert.equal(api.evaluate('verifiedBestFor("hinge",4)'), 0);
});

test('goal progress and passed rungs never go backwards as the logs age', () => {
  const api = ladder(), state = api.getState();
  goals(api, 'pullup10'); placed(api, 'pull', 4);
  state.advances.push({date: Date.now() - 70 * day, id: 'pull', from: 3, to: 4, name: 'Pull-up'});
  state.history.push(record('pull', 3, [8, 8, 8], {date: Date.now() - 72 * day, setup: {assist: 1}}));
  state.history.push(record('pull', 4, [6, 6, 6], {date: Date.now() - 65 * day}));
  const before = api.evaluate('goalProgress(activeGoals()[0])');
  assert.ok(Math.abs(before - (4 + 0.6) / 5) < 1e-9, 'four steps behind you and 6 of 10 on the goal step: ' + before);
  state.history.forEach(w => { w.date -= 200 * day; });
  assert.equal(api.evaluate('goalProgress(activeGoals()[0])'), before, 'the same months later');
  assert.equal(api.evaluate('currentProof("pull",3).ready'), false, 'readiness still uses the 42-day window');
  assert.ok([0, 1, 2, 3].every(i => api.evaluate(`passed("pull",${i})`)), 'earlier steps show as passed');
  assert.equal(api.evaluate('passed("pull",4)'), false);
  assert.equal(api.evaluate('passed("pull",6)'), false);
});

test('the one-set maintenance check asks for the goal\'s standard, not the step\'s base target', () => {
  const api = ladder(), state = api.getState();
  goals(api, 'oapush');
  assert.equal(api.evaluate('stepsOf("sidecore")[0].v'), 30);
  assert.equal(api.evaluate('rungTarget("sidecore",0,"maintenance")'), 45);
  state.needClaims['side-plank|45'] = {v: 45, date: Date.now()};
  const m = plain(api.evaluate('Array.from({length:6},(_,k)=>todayPlan(k)).flat()')).find(x => x.role === 'maintenance' && x.id === 'sidecore');
  assert.ok(m, 'the side plank comes round as a maintenance check');
  assert.equal(m.sets, 1); assert.equal(m.target, 45);
});

test('entry checks are about 40% of the target, at most 3 reps or 5 s, and 1 rep only for first-rep steps', () => {
  const api = ladder();
  const e = (sid) => { const [l, i] = where(api, sid); return api.evaluate(`entryMinimum(${JSON.stringify(l)},${i})`); };
  assert.equal(e('pullup'), 1, 'first pull-up');
  assert.equal(e('oap'), 1, 'one-arm pull-up');
  assert.equal(e('strict-muscleup'), 1); assert.equal(e('kipping-muscleup'), 1);
  assert.equal(e('dip'), 3, '40% of 10 is 4, capped at 3');
  assert.equal(e('negative-pullup'), 2, '40% of 5');
  assert.equal(e('weighted-dip'), 2);
  assert.equal(e('full-planche-pushup'), 1, '40% of 2 rounds to 1');
  assert.equal(e('dead-hang'), 5, 'holds cap at 5 s');
  assert.equal(e('human-flag'), 2, '40% of 5 s');
  assert.equal(e('assisted-oap'), 1, '40% of 3 rounds to 1');
});

test('risky steps wait for their gate: in plans, unlocks, and what a goal takes', () => {
  const api = ladder(), state = api.getState();
  const gate = sid => { const [l, i] = where(api, sid); return api.evaluate(`gateMet(${JSON.stringify(l)},${i})`); };
  const log = (sid, v, ago = 200) => { const [l, i] = where(api, sid); state.history.push(record(l, i, [v], {date: Date.now() - ago * day})); };
  [['freestanding-hspu', 'freestanding-handstand', 30], ['partial-wall-hspu', 'chest-to-wall-handstand', 30], ['freestanding-handstand', 'cartwheel-bail', 3],
    ['clapping-pullup', 'explosive-pullup', 5], ['depth-jump', 'drop-landing', 5], ['dragon-squat', 'pistol-squat', 3]].forEach(([step, first, v]) => {
    assert.equal(gate(step), false, step + ' is gated');
    log(first, v - 1); assert.equal(gate(step), false, step + ' needs ' + v + ' of ' + first);
    log(first, v); assert.equal(gate(step), true, step + ' opens after ' + first + ', however long ago');
  });
  assert.equal(gate('wall-hspu'), true, 'an ungated step');
  const api2 = ladder(), s2 = api2.getState();
  goals(api2, 'hspu'); placed(api2, 'pushv', 3);
  const p = planFor(api2, 'pushv');
  assert.equal(p.i, api2.evaluate('previousRung("pushv",3)'), 'the plan trains the step before');
  assert.equal(notesFor(api2, 'pushv')[0].why, 'gate');
  assert.match(api2.evaluate('noteText(todayPlan().notes[0])'), /first 30 s chest-to-wall handstand/);
  const need = plain(api2.evaluate('goalNeeds(activeGoals()[0])')).find(n => n.gate);
  assert.deepEqual([need.l, need.r, need.v], ['handstand', 1, 30], 'the gate joins what the goal takes');
  s2.needClaims['chest-to-wall-handstand|30'] = {v: 30, date: Date.now()};
  assert.equal(planFor(api2, 'pushv').i, 3, 'ticking that you can do it opens it');
  const api3 = ladder(), s3 = api3.getState();
  s3.history.push(record('handstand', 2, [8]), record('handstand', 1, [45]));
  assert.ok(!plain(api3.evaluate('readyMoves()')).some(u => u.k === 'handstand'), 'no freestanding handstand unlock before the cartwheel bail');
  s3.history.push(record('hsdrill', 0, [3]));
  assert.ok(plain(api3.evaluate('readyMoves()')).some(u => u.k === 'handstand'));
});

test('rep steps train in a range with reps in reserve, and move on only at the top on two days 20 hours apart', () => {
  const api = ladder(), state = api.getState();
  assert.equal(api.evaluate('rungText("dip",3)'), '3 x 3&ndash;10');
  assert.equal(api.evaluate('rungText("pull",4)'), '3 x 1&ndash;8');
  placed(api, 'pull', 4);
  assert.equal(api.evaluate('rungTarget("pull",4)'), 1, 'nothing logged: the bottom of the range');
  state.tests.push({date: Date.now() - day, ladderId: 'pull', stepIdx: 4, v: 6, setup: {}, clean: true});
  assert.equal(api.evaluate('rungTarget("pull",4)'), 5, 'a test of 6 starts at 5, a rep in reserve');
  const at = (reps, rirs) => { state.history = [withRir(record('pull', 4, reps, {target: 5, date: Date.now() - day}), rirs)]; return api.evaluate('rungTarget("pull",4)'); };
  assert.equal(at([5, 5, 5], [2, 2, 2]), 6, 'every set at the target with reps in reserve: a rep more');
  assert.equal(at([5, 5, 5], [null, null, null]), 6, 'reps in reserve left blank count as fine');
  assert.equal(at([5, 5, 5], [3, 4, 3]), 7, 'plenty left: starts where you are, a rep short');
  assert.equal(at([5, 5, 5], [2, 2, 0]), 5, 'a set at 0 in reserve keeps the reps');
  assert.equal(at([5, 4, 4], [null, null, null]), 5, 'some short: the same again');
  assert.equal(at([3, 3, 2], [null, null, null]), 2, 'all short: where you are');
  assert.equal(at([8, 8, 8], [3, 3, 3]), 8, 'never past the top of the range');
  const proof = (dates, rirs) => { state.history = dates.map((d, k) => withRir(record('dip', 3, [10, 10, 10], {date: d}), rirs[k])); return api.evaluate('currentProof("dip",3).ready'); };
  assert.equal(proof([Date.now() - 3 * day, Date.now() - day], [[1, 1, 1], [2, 1, 3]]), true);
  assert.equal(proof([Date.now() - 3 * day, Date.now() - day], [[1, 1, 1], [2, 0, 3]]), false, 'a set called at 0 in reserve is not the top of the range');
  assert.equal(proof([Date.now() - 2 * day, Date.now() - 2 * day + 20 * 60000], [[1, 1, 1], [1, 1, 1]]), false, '23:50 and 00:10 are one training day');
  assert.equal(proof([Date.now() - 2 * day, Date.now() - 2 * day + 21 * hour], [[1, 1, 1], [1, 1, 1]]), true);
});

test('weighted steps ask for the weight added and go up by load at the top; assisted steps ask a help level and go down by one', () => {
  const api = ladder(), state = api.getState();
  assert.deepEqual(plain(api.evaluate('setupFields(stepsOf("pull")[6])')).map(f => f.key), ['load']);
  placed(api, 'pull', 6);
  state.history.push(record('pull', 6, [5, 5, 5], {date: Date.now() - 3 * day}));
  assert.equal(api.evaluate('verifiedBestFor("pull",6)'), 0, 'a weighted set without its weight is not proof');
  state.history = [withRir(record('pull', 6, [5, 5, 5], {date: Date.now() - day, setup: {load: 10}}), [1, 1, 1])];
  assert.equal(api.evaluate('verifiedBestFor("pull",6)'), 5);
  let d = plain(api.evaluate('dose("pull",6,"goal")'));
  assert.equal(d.setup.load, 12.5, 'the next weight up');
  assert.equal(d.target, 3, 'two reps fewer');
  assert.match(d.why, /12\.5 kg added/);
  state.history = [withRir(record('pull', 6, [4, 4, 4], {date: Date.now() - day, setup: {load: 10}, target: 4}), [1, 1, 1])];
  d = plain(api.evaluate('dose("pull",6,"goal")'));
  assert.equal(d.setup.load, 10, 'below the top the weight stays'); assert.equal(d.target, 5);
  placed(api, 'pull', 3);
  state.history = [withRir(record('pull', 3, [8, 8, 8], {date: Date.now() - day, setup: {assist: 3}}), [2, 2, 2])];
  d = plain(api.evaluate('dose("pull",3,"goal")'));
  assert.equal(d.setup.assist, 2, 'one level less help'); assert.equal(d.target, 6);
  const entry = plain(api.evaluate('entryFor("pull",3)'));
  assert.equal(entry.setup.assist, 2, 'a new session fills the number in'); assert.ok(entry.why);
});

test('holds train their total time in pieces, and balance skills as an 8-minute block of attempts', () => {
  const api = ladder(), state = api.getState();
  placed(api, 'frontlever', 0);
  const e = plain(api.evaluate('planEntry({id:"frontlever",i:0,sets:3,role:"goal"})'));
  assert.equal(e.total, e.target * 3);
  const hs = api.evaluate('planEntry({id:"handstand",i:3,sets:3,role:"goal"})');
  assert.equal(hs.block.min, 8); assert.equal(hs.sets.length, 1);
  state.active = {id: 'a', name: 'S', startedAt: Date.now(), entries: [hs]};
  hs.sets[0].v = 12; api.evaluate('toggleDone(0,0)');
  assert.ok(hs.block.start > 0, 'the block starts with the first attempt');
  assert.equal(hs.sets.length, 2, 'another attempt opens while time is left');
  assert.equal(plain(api.evaluate('trimExtra(state.active.entries)'))[0].sets.length, 1, 'an attempt never made is not a set left undone');
  hs.block.start = Date.now() - 9 * 60000; hs.sets[1].v = 15; api.evaluate('toggleDone(0,1)');
  assert.equal(hs.sets.length, 2, 'no more once the time is up');
  const tl = api.evaluate('planEntry({id:"frontlever",i:0,sets:3,role:"goal",target:10})');
  state.active.entries = [tl];
  [6, 6, 6].forEach((v, k) => { tl.sets[k].v = v; api.evaluate(`toggleDone(0,${k})`); });
  assert.equal(tl.sets.length, 4, '18 of 30 s: another piece');
});

test('per-side exercises log left and right, the weaker side counts, and the hold timer logs both', () => {
  const api = ladder(), state = api.getState();
  const i = where(api, 'oa-lockoff-top')[1];
  assert.ok(api.evaluate(`perSide(stepsOf("pull")[${i}])`));
  const e = api.evaluate(`planEntry({id:"pull",i:${i},sets:3,role:"goal",target:10})`);
  state.active = {id: 'a', name: 'S', startedAt: Date.now(), entries: [e]};
  e.sets[0].lr = [12, 8]; api.evaluate('toggleDone(0,0)');
  assert.equal(e.sets[0].v, 8, 'the weaker side');
  api.evaluate('toggleDone(0,2)');
  assert.deepEqual(plain(e.sets[2].lr), [10, 10], 'empty sides log the target');
  api.evaluate('holdGo(0,1)');
  assert.equal(api.evaluate('holdT.side'), 'l');
  api.evaluate('holdT.start=Date.now()-12000; holdGo(0,1)');
  assert.equal(e.sets[1].done, false); assert.equal(e.sets[1].lr[0], 12);
  api.evaluate('holdGo(0,1)');
  assert.equal(api.evaluate('holdT.side'), 'r');
  api.evaluate('holdT.start=Date.now()-9000; holdGo(0,1)');
  assert.deepEqual(plain(e.sets[1].lr), [12, 9]); assert.equal(e.sets[1].v, 9); assert.equal(e.sets[1].done, true);
  assert.equal(api.evaluate('holdT'), null);
  assert.equal(api.evaluate('clearsRung(state.active.entries[0])'), false, 'both sides must reach the target');
  const j = api.evaluate(`planEntry({id:"frontlever",i:0,sets:3,role:"goal",target:10})`);
  state.active.entries = [j];
  api.evaluate('holdGo(0,0)'); assert.equal(api.evaluate('holdT.side'), null, 'a two-sided hold is one time');
  api.evaluate('holdT.start=Date.now()-11000; toggleDone(0,0)');
  assert.equal(j.sets[0].v, 11, 'the tick stops the timer and logs it'); assert.equal(j.sets[0].done, true);
});

test('static stretches leave the warm-up for the end, and balance attempts are not hard sets', () => {
  const api = ladder(), state = api.getState();
  placed(api, 'ankle', 0);
  assert.deepEqual(plain(api.evaluate('orderIds(["ankle","pull"])')), ['pull', 'ankle'], 'a 45 s calf stretch comes last');
  placed(api, 'ankle', 1);
  assert.deepEqual(plain(api.evaluate('orderIds(["ankle","pull"])')), ['ankle', 'pull'], 'ankle rocks stay in the warm-up');
  state.history.push(record('handstand', 3, [20, 20, 20]), record('hsdrill', 2, [5, 5, 5]));
  assert.equal(api.evaluate('setsIn(7)'), 0);
  assert.equal(plain(api.evaluate('hubWork(0, Date.now()+1)')).length, 0);
  state.history.push(record('pull', 4, [5, 5, 5]));
  assert.equal(api.evaluate('setsIn(7)'), 3);
});

test('a pain hold trains the assisted step of straight-arm work for a week, and leaves out wrist work with none', () => {
  const api = ladder(), state = api.getState();
  goals(api, 'tuckplanche', 'handstand'); placed(api, 'planche', 1); placed(api, 'handstand', 3);
  state.history.push(record('hsdrill', 0, [3]));
  api.evaluate('holdJoint("elbow")');
  const p = planFor(api, 'planche');
  assert.equal(p.role, 'easy'); assert.equal(api.evaluate(`setupField(stepsOf("planche")[${p.i}]).key`), 'assist');
  assert.equal(notesFor(api, 'planche')[0].why, 'pain');
  assert.ok(planFor(api, 'handstand'), 'an elbow hold leaves the handstand alone');
  api.evaluate('holdJoint("wrist")');
  assert.equal(planFor(api, 'handstand'), undefined, 'a wrist hold leaves the handstand out');
  assert.deepEqual(plain(api.evaluate('state.hold.joints')).sort(), ['elbow', 'wrist']);
  assert.ok(api.evaluate('state.hold.until') > Date.now() + 7 * day - 1);
  assert.equal(planFor(api, 'planche', 9).role !== 'easy' || !notesFor(api, 'planche', 9).some(n => n.why === 'pain'), true, 'it ends after a week');
  assert.equal(api.evaluate('holdJoint("knee")'), null, 'only elbow, wrist and shoulder');
  assert.equal(api.evaluate('normalize({hold:{until:"x"}}).hold'), null, 'a malformed hold is dropped');
});

test('placement keeps your answers through a reload and starts from your current step', () => {
  const api = ladder(), state = api.getState();
  goals(api, 'pullup10'); placed(api, 'pull', 4);
  api.evaluate('startPlacement(activeGoals())');
  assert.equal(api.evaluate('surveyAns.pull'), 4, 'your current step is picked');
  const saved = JSON.parse(JSON.stringify(api.evaluate('payload()')));
  assert.deepEqual(saved.placing.survey[0], 'pull');
  api.evaluate('place=null; surveyAns={}');
  api.setState(saved);
  api.evaluate('resumePlacement()');
  assert.equal(api.evaluate('surveyAns.pull'), 4);
  assert.deepEqual(plain(api.evaluate('place.survey')), saved.placing.survey);
});

test('a renamed rung of your own starts fresh, and goal times are realistic', () => {
  const api = ladder(), state = api.getState();
  state.custom = [{id: 'c-x', n: 'Mine', like: 'core', steps: [{n: 'Renamed', k: 'reps', sets: 3, v: 5, since: Date.now() - 2 * day}]}];
  api.evaluate('registerCustom(state.custom)');
  state.history.push(record('c-x', 0, [6, 6, 6], {date: Date.now() - 3 * day}));
  assert.equal(api.evaluate('verifiedBestFor("c-x",0)'), 0, 'sets logged before the rename are not proof');
  state.history.push(record('c-x', 0, [6, 6, 6], {date: Date.now() - day}));
  assert.equal(api.evaluate('verifiedBestFor("c-x",0)'), 6);
  assert.equal(api.evaluate('goalHint("pullup1")'), 'Often a few months');
  assert.equal(api.evaluate('goalHint("handstand")'), 'Often 6 to 12 months');
});

test('new steps and goals: lock-offs, a strength base for one arm, a first muscle-up, a supported flag, Nordic lowering', () => {
  const api = ladder();
  const uni = plain(api.evaluate('LADDER_PATHS.pull.find(p=>p.key==="unilateral").steps'));
  assert.ok(['oa-lockoff-top', 'oa-lockoff-90', 'oa-negative'].every(x => uni.indexOf(x) > uni.indexOf('archer-pullup') && uni.indexOf(x) < uni.indexOf('oap')));
  assert.ok(plain(api.evaluate('LADDER_PATHS.flag[0].steps')).includes('support-flag'));
  assert.equal(api.evaluate('rungId(GOALS.nordiclower.l,GOALS.nordiclower.r)'), 'nordic-negative');
  assert.ok(plain(api.evaluate('pathFor("muscleup",GOALS.muscleup1)')).map(i => api.evaluate(`rungId("muscleup",${i})`)).includes('hip-to-bar-pull'));
  goals(api, 'oapu');
  const base = plain(api.evaluate('goalNeeds(activeGoals()[0])')).find(n => n.l === 'weightedpull');
  assert.deepEqual([base.r, base.v], [0, 15], '15 strict pull-ups');
  muscle(api, [], [{date: 0, kg: 80}]);
  const st = api.getState();
  st.history.push(record('weightedpull', 1, [1], {setup: {load: 30}}));
  assert.equal(api.evaluate(`needMet(${JSON.stringify(base)})`), false, '30 kg is under 40% of 80 kg');
  st.history.push(record('weightedpull', 1, [1], {setup: {load: 32.5}}));
  assert.equal(api.evaluate(`needMet(${JSON.stringify(base)})`), true, 'one rep with 40% of bodyweight added also counts');
});
