const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Runs the real Strength section (everything but its UI boot) with the shared engine, a stand-in page, a stand-in
// Muscle hub (bodyweight log, RPE checks) and a clock the tests move, so whole programs can be trained through in
// simulated weeks with the production code.
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const DAY = 864e5;
function strength({prefs = {}, body = [], start = Date.UTC(2026, 0, 5, 9)} = {}) {
  let clock = start;
  class FakeDate extends Date {
    constructor(...a) { if (a.length) super(...a); else super(clock); }
    static now() { return clock; }
  }
  const store = new Map(Object.entries(prefs).map(([k, v]) => ['trainer.shell.' + k, JSON.stringify(v)]));
  const localStorage = {getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k)};
  const el = () => ({innerHTML: '', textContent: '', value: '', scrollTop: 0, dataset: {}, style: {},
    classList: {add() {}, remove() {}, toggle() {}, contains() { return false; }},
    querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, focus() {}, setAttribute() {}});
  const els = new Map(), get = s => { if (!els.has(s)) els.set(s, el()); return els.get(s); };
  const root = {querySelector: get, querySelectorAll: () => [], addEventListener() {}, getElementById: get};
  const noOp = () => {};
  const cals = [], regs = {}, hub = {
    has: m => m === 'lift', changed: noOp, closed: noOp, stay: noOp, reg: (m, api) => { regs[m] = api; },
    api: m => m === 'lift' ? {bodyLog: () => body.map(x => ({...x})), addCal: r => { cals.push(r); return true; }, logBody: (kg, ts) => { body.push({date: ts || clock, kg}); return true; }} : null,
  };
  const ctx = vm.createContext({
    __root: root, Date: FakeDate, Math, JSON, Set, Map, console, localStorage,
    setTimeout: () => 1, clearTimeout: noOp, setInterval: () => 1, clearInterval: noOp,
    window: {scrollTo: noOp, addEventListener: noOp, __hub: hub}, document: {addEventListener: noOp}, navigator: {},
    MiloSecurity: {html: v => v, parseSection: v => JSON.parse(v)}, Safe: {put: noOp, rescue: noOp}, __setTheme: noOp,
    TakeBack: {make: () => ({keep: noOp, seal: noOp, edited: noOp, deleted: noOp, clear: noOp, get: () => null, changed: () => false, take: noOp})},
    SheetNav: {make: () => ({reg: noOp, opening: noOp, opened: noOp, closed: noOp, back: noOp})},
  });
  vm.runInContext(app.slice(0, app.indexOf('/* ==================== BACK ====================')), ctx, {filename: 'app.js:HOWTO'});
  const a = app.indexOf('/* ==================== SETS NOT TICKED OFF ===================='), b = app.indexOf('/* ==================== TAKE BACK ====================', a);
  vm.runInContext(app.slice(a, b), ctx, {filename: 'app.js:shared'});
  for (const k of ['OpenSets', 'Parked', 'Prefs', 'Lift', 'SAME_LIFT', 'Num', 'Day', 'Kit', 'Body']) ctx[k] = ctx.window[k];
  ctx.window.MiloDesign = null;
  const s = app.indexOf('  str: function(__root){'), from = app.indexOf('\n', s), to = app.indexOf('/* ==================== BOOT ==================== */', from);
  vm.runInContext(`(function(__root){ ${app.slice(from, to)}
    state=defaultState(); state.onboarded=true;
    globalThis.T={ get state(){ return state; }, set state(v){ state=normalize(v); }, run: x=>eval(x) };
  })(__root);`, ctx, {filename: 'app.js:Strength'});
  const T = ctx.T;
  const fn = T.run(`({progDef, planSlot, schemeFor, makeEntry, startProgramDay, finishSession, progressEntry, currentE1, e1Est, setE1, setEffort,
    loadFor, upLoad, incKg, roundLoad, lighter, backF, awayDays, backList, resetProgram, followTop, fillOn, toggleDone, replay, saveEdit, openEditSession,
    tmDecide, plusLog, introOn, swapOrder, options, warmups, totalOf, boxOf, render, saveCheck, openCheck, markCheck, checkable, saveStart, liftSessions})`);
  return {T, fn, Lift: ctx.Lift, Kit: ctx.Kit, cals, body, store, hub: regs.str,
    get now() { return clock; }, set now(v) { clock = v; }, wait(days) { clock += days * DAY; }};
}
const plain = v => JSON.parse(JSON.stringify(v));
// A plan from the set-up's answers, with the program started now.
function plan(S, {model = 'linear', days = 3, exp = 'some', areas, choice} = {}) {
  areas = areas || Object.keys(choice);
  S.T.state.setup = {areas, equip: ['bar', 'db', 'machine', 'cable', 'pullup', 'dip', 'load'], choice, days, model, exp};
  S.fn.resetProgram();
}
// Trains the next plan day: perform(set, entry) fills each work set (reps, rpe) before it is ticked (0 reps: not done);
// the session is finished as the app finishes it, then the clock moves on gap days.
function train(S, perform, gap = 2) {
  const d = S.T.run('nextDayIdx()');
  S.fn.startProgramDay(d);
  const a = S.T.state.active;
  a.entries.forEach((en, ei) => en.sets.forEach((s, si) => {
    if (s.kind === 'warm') return;
    perform(s, en);
    if (s.reps !== 0 && s.reps !== null) S.fn.toggleDone(ei, si);
  }));
  S.fn.finishSession();
  const rec = S.T.state.history[S.T.state.history.length - 1];
  S.wait(gap);
  return {rec, day: d, active: a};
}

test('the Strength section draws every view and sheet, with the new lifts, kit settings and set-up in them', () => {
  const S = strength({body: [{date: Date.UTC(2026, 0, 1), kg: 80}]});
  const sheet = () => S.T.run("$('#sheet').innerHTML"), view = () => S.T.run("$('#view').innerHTML");
  plan(S, {model: 'topset', choice: {chest: 'bench', legs: 'goblet', hips: 'tbdl', back: 'dbrow', lats: 'wpull', shoulders: 'pikechain'}, exp: 'exp'});
  Object.values(S.T.state.lifts).forEach(L => Object.assign(L, {work: 30, tm: 40, seed: {v: 60, date: S.now - DAY, rated: true}}));
  for (let i = 0; i < 4; i++) train(S, s => { s.reps = s.tr; if (s.w == null && s.kind !== 'warm') s.w = 20; });
  for (const r of ['today', 'program', 'tools']) { S.T.state.route = r; S.fn.render(); assert.ok(view().length > 100, r); }
  for (const t of ['lifts', 'records', 'standards', 'history']) for (const id of ['bench', 'goblet', 'tbdl', 'wpull', 'pikechain']) {
    S.T.state.route = 'progress'; S.T.state.progTab = t; S.T.state.progLift = id; S.fn.render(); assert.ok(view().length > 100, t + ' ' + id);
  }
  assert.ok(view().includes('class="auto"'), 'an RPE logged from the target shows apart in the history');
  for (const t of ['max', 'plates', 'warm']) { S.T.state.route = 'tools'; S.T.state.toolTab = t; S.fn.render(); }
  S.T.state.progTab = 'standards'; S.T.state.route = 'progress'; S.fn.render();
  assert.ok(view().includes('shared with every section') && view().includes('value="80"'), 'bodyweight from the one log');
  // a session going: every set row, the exercise and set menus, swaps, plates, the RPE check
  S.T.state.calLast = null; S.fn.startProgramDay(0); S.T.state.route = 'train'; S.fn.render();
  assert.ok(view().includes('data-act="toggle-done"'));
  S.T.state.active.entries.forEach((en, ei) => { S.T.run(`openExMenu(${ei}); openSetMenu(${ei},0); openSessionSwap(${ei})`); });
  S.T.run(`openPlates(85, 'trap')`);
  assert.ok(sheet().includes('25 kg trap bar + 25 + 5 a side'), 'plates on the trap bar');
  S.T.run(`openPicker(); openSessionMenu(); openEnd(); openNote('session')`);
  S.T.run(`openCheckWhy(0, 1); openCheck(0, 1)`);
  assert.ok(sheet().includes('RPE check'));
  // settings: bars in both units, the trap and EZ bars, micro plates, how many of each, collars, your dumbbells
  S.T.run('openSettings()');
  for (const t of ['45 lb', '35 lb', '15 lb', '10 kg', 'Trap bar', 'EZ bar', 'data-v="0.25"', 'Pairs of each', 'Collars, each', 'Your dumbbells']) assert.ok(sheet().includes(t), t);
  // set-up: step 1 can be closed and starts with "Everything, all six"; the kit starts from the shared kit
  S.T.run('openSetup()');
  assert.ok(sheet().includes('data-act="close-modal"'));
  assert.ok(sheet().indexOf('Everything, all six') < sheet().indexOf('data-act="wz-area"'));
  for (let st = 1; st < 4; st++) { S.T.run(`wz.step=${st}; renderSetup()`); assert.ok(sheet().includes('data-act="close-modal"'), 'step ' + (st + 1)); }
  S.T.run('openStart(false)');
  assert.ok(sheet().includes('RPE is how hard a set was'), 'one line on RPE where it is first asked');
  S.T.run('openSwap("legs"); openSwap("hips"); openEditSession(state.history[0].id); openSessionList()');
  // with nothing saved, the kit is all of it, not none; with a kit saved anywhere, that one
  const F = strength(); F.T.run('openSetup()'); assert.equal(F.T.run('wz.equip.size'), 7);
  const K = strength({prefs: {kit: ['db', 'pullup']}}); K.T.run('openSetup()'); assert.deepEqual(plain(K.T.run('[...wz.equip]')), ['db', 'pullup']);
});

// The lifter in these simulations: a true max that the app doesn't know, and as many reps as that allows, up to the target.
const canDo = (S, T, w, cls = 'upper') => Math.floor(S.Lift.reps(T, w, 0, cls) + 1e-9);

test('the estimated max does not ratchet: 48 top-set sessions stay near the true max (item 2)', () => {
  // Before: a set ticked without an RPE was scored at its target with the reps-in-reserve correction added, loads were
  // prescribed without it, and the estimate was the best of the last 3 sessions: 100 -> 128 kg in 12 sessions with a
  // correction of +1, and 100 -> 111 kg in 48 with none.
  for (const corr of [0, 1]) for (const rated of [false, true]) for (const start of [100, 110]) {
    const S = strength(); S.Lift.bias = corr;
    plan(S, {model: 'topset', choice: {chest: 'bench'}, exp: 'exp'});
    S.T.state.lifts.bench.seed = {v: start, date: S.now - DAY, rated: true};
    const T = 100, seen = [];
    for (let i = 0; i < 48; i++) {
      train(S, s => { const max = canDo(S, T, s.w); s.reps = Math.min(s.tr, max); if (rated) s.rpe = Math.min(10, Math.max(5, 10 - (max - s.reps))); }, i % 3 === 2 ? 3 : 2);
      seen.push(S.fn.currentE1('bench'));
    }
    const top = Math.max(start, T), last = seen[seen.length - 1], tag = `correction ${corr}, ${rated ? 'rated' : 'unrated'}, from ${start}`;
    assert.ok(Math.max(...seen) <= top * 1.025, `${tag}: never runs more than 2.5% over where it started or the truth (${Math.max(...seen).toFixed(1)})`);
    assert.ok(last <= top * 1.02 && last >= T * 0.97, `${tag}: ends near the truth (${last.toFixed(1)})`);
    if (start > T) assert.ok(last < start - 4, `${tag}: an estimate that was too high comes down (${last.toFixed(1)})`);
    // the same 12 sessions later: it has settled, not crept
    assert.ok(Math.abs(seen[47] - seen[35]) < 1, `${tag}: settled (${seen[35].toFixed(1)} then ${seen[47].toFixed(1)})`);
  }
});

test('how a set counts toward the estimate: typed, left at the target, short of it, or with nothing to go on (items 2 and 48)', () => {
  const S = strength(), {setEffort, setE1} = S.fn;
  assert.deepEqual(plain(setEffort({rpe: 8, reps: 5, tr: 5, trpe: 7})), {rir: 2, rated: true});
  // left untouched: the target, saved as assumed (ra), counts at it but weighs half; a rep over the target is a rep less in reserve
  assert.deepEqual(plain(setEffort({rpe: 8, ra: true, reps: 5, tr: 5, trpe: 8})), {rir: 2, rated: false});
  assert.deepEqual(plain(setEffort({rpe: 8, ra: true, reps: 6, tr: 5, trpe: 8})), {rir: 1, rated: false});
  // short of the target reps: all-out, whatever the box said
  assert.deepEqual(plain(setEffort({rpe: 10, ra: true, reps: 3, tr: 5, trpe: 8})), {rir: 0, rated: false});
  assert.deepEqual(plain(setEffort({reps: 3, tr: 5, trpe: 8})), {rir: 0, rated: false});
  // no RPE and no target: all-out, no correction, half weight
  S.Lift.bias = 1;
  assert.deepEqual(plain(setEffort({reps: 5, tr: 5})), {rir: 0, rated: false});
  assert.equal(setE1({done: true, kind: 'work', w: 100, reps: 5, tr: 5}, 'bench'), S.Lift.e1rm(100, 5, 0, 'upper'));
  // sets that say little about the max are left out: 12 reps at RPE 4 is not a 160 kg bench
  assert.equal(setE1({done: true, kind: 'work', w: 100, reps: 12, rpe: 4}, 'bench'), 0);
  assert.equal(setE1({done: true, kind: 'work', w: 100, reps: 10, rpe: 6}, 'bench'), 0);
  assert.ok(setE1({done: true, kind: 'work', w: 100, reps: 8, rpe: 8}, 'bench') > 0);
});

test('ticking an untouched RPE box saves the target as assumed, 10 when the reps fell short, and a typed one is kept (item 48)', () => {
  const S = strength();
  plan(S, {model: 'topset', choice: {chest: 'bench'}, exp: 'exp'});
  S.T.state.lifts.bench.seed = {v: 100, date: S.now - DAY, rated: true};
  S.fn.startProgramDay(0);
  const en = S.T.state.active.entries[0], i = en.sets.findIndex(s => s.kind === 'top'), b = en.sets.findIndex(s => s.kind === 'bo');
  S.fn.toggleDone(0, i);
  assert.equal(en.sets[i].rpe, 7); assert.equal(en.sets[i].ra, true);
  en.sets[b].reps = 3; S.fn.toggleDone(0, b);
  assert.equal(en.sets[b].rpe, 10, 'short of the target: all-out');
  en.sets[b + 1].rpe = 8.5; en.sets[b + 1].reps = 5; S.fn.toggleDone(0, b + 1);
  assert.equal(en.sets[b + 1].rpe, 8.5); assert.ok(!en.sets[b + 1].ra);
  S.fn.toggleDone(0, i);
  assert.equal(en.sets[i].rpe, null, 'ticking it off again clears an assumed RPE');
  S.fn.toggleDone(0, i);
  S.fn.finishSession();
  const kept = S.T.state.history[0].entries[0].sets;
  assert.ok(kept.some(s => s.kind === 'top' && s.rpe === 7 && s.ra === true), 'the finished session keeps the assumed RPE, marked');
});

test('back-offs follow the top set: set from today’s estimate once it is ticked, and from a top-set weight you change (item 39)', () => {
  const S = strength();
  plan(S, {model: 'topset', choice: {chest: 'bench'}, exp: 'exp'});
  S.T.state.lifts.bench.seed = {v: 100, date: S.now - DAY, rated: true};
  S.fn.startProgramDay(0);
  const en = S.T.state.active.entries[0], top = en.sets.find(s => s.kind === 'top'), bos = () => en.sets.filter(s => s.kind === 'bo');
  assert.ok(bos().every(s => s.trpe === 7 && s.w <= top.w && s.w >= top.w - 2.5), 'back-offs carry a target RPE and sit at or just under the top set, not 8% under it');
  // the top set felt like RPE 9, not 7: today's estimate is lower and the back-offs drop to match
  top.reps = 5; top.rpe = 9; S.fn.toggleDone(0, en.sets.indexOf(top));
  const e = S.fn.setE1(top, 'bench');
  assert.ok(e < 100);
  for (const s of bos()) assert.equal(s.w, S.fn.roundLoad(Math.min(top.w, S.fn.loadFor(e, 5, 7, 'bench')), 'bar'));
  assert.ok(bos()[0].w < top.w - 2, 'lighter than the top set');
  // a fresh day: typing a heavier top-set weight before it is done takes the back-offs with it
  S.T.state.active = null; S.fn.startProgramDay(0);
  const en2 = S.T.state.active.entries[0], top2 = en2.sets.find(s => s.kind === 'top'), was = en2.sets.find(s => s.kind === 'bo').w;
  const old = top2.w; top2.w = old + 10; top2.edited = true;
  S.fn.fillOn(en2, en2.sets.indexOf(top2), old); S.fn.followTop(en2);
  assert.ok(en2.sets.filter(s => s.kind === 'bo').every(s => s.w > was), 'back-offs follow a heavier top set');
});

test('a weight typed in a set fills the later undone sets of the same kind that are blank or still show the old weight (item 67)', () => {
  const S = strength();
  plan(S, {model: 'linear', choice: {chest: 'dbbench'}});
  S.fn.startProgramDay(0);
  const en = S.T.state.active.entries[0], w = en.sets.filter(s => s.kind === 'work');
  assert.ok(w.every(s => s.w == null), 'a new lift starts blank');
  const i0 = en.sets.indexOf(w[0]);
  w[0].w = 20; S.fn.fillOn(en, i0, null);
  assert.deepEqual(plain(w.map(s => s.w)), [20, 20, 20]);
  w[1].done = true; w[2].w = 24; w[0].w = 22; S.fn.fillOn(en, i0, 20);
  assert.deepEqual(plain(w.map(s => s.w)), [22, 20, 24], 'done sets and sets you set yourself stay');
});

test('progression goes to the next weight your plates make, and reps first when that is a big jump (item 40)', () => {
  // Before: with 5 kg the smallest plate the bench never moved from 60 and the squat jumped 10 kg a session; with 2.5 kg
  // the bench jumped 5 kg a session.
  const runs = {};
  for (const [name, plates] of [['1.25', [25, 20, 15, 10, 5, 2.5, 1.25]], ['2.5', [25, 20, 15, 10, 5, 2.5]], ['5', [25, 20, 15, 10, 5]]]) {
    const S = strength({prefs: {platesKg: plates}});
    plan(S, {model: 'linear', choice: {chest: 'bench', legs: 'squat', shoulders: 'ohp'}});
    Object.assign(S.T.state.lifts.bench, {work: 60}); Object.assign(S.T.state.lifts.squat, {work: 100}); Object.assign(S.T.state.lifts.ohp, {work: 30});
    const seq = {bench: [], squat: [], ohp: []};
    for (let i = 0; i < 9; i++) {
      const {rec} = train(S, s => { s.reps = s.tr; });
      rec.entries.forEach(en => { const s = en.sets.find(x => x.kind === 'work'); seq[en.liftId].push(s.w + 'x' + s.reps); });
    }
    runs[name] = seq;
  }
  assert.deepEqual(runs['1.25'].bench.slice(0, 4), ['60x5', '62.5x5', '65x5', '67.5x5']);
  assert.deepEqual(runs['1.25'].squat.slice(0, 3), ['100x5', '105x5', '110x5']);
  // a 30 kg press can't take 2.5 kg (over 8%) straight away: a rep a set first
  assert.deepEqual(runs['1.25'].ohp.slice(0, 5), ['30x5', '30x6', '30x7', '32.5x5', '35x5']);
  assert.deepEqual(runs['2.5'].bench.slice(0, 7), ['60x5', '60x6', '60x7', '65x5', '65x6', '65x7', '70x5']);
  assert.deepEqual(runs['2.5'].squat.slice(0, 3), ['100x5', '105x5', '110x5']);
  assert.deepEqual(runs['5'].bench.slice(0, 7), ['60x5', '60x6', '60x7', '70x5', '70x6', '70x7', '80x5']);
  assert.deepEqual(runs['5'].squat.slice(0, 4), ['100x5', '100x6', '100x7', '110x5']);
});

test('a missed linear weight holds, and three misses reset it 10% lighter to a weight you can load', () => {
  const S = strength({prefs: {platesKg: [25, 20, 15, 10, 5]}});
  plan(S, {model: 'linear', choice: {chest: 'bench'}});
  S.T.state.lifts.bench.work = 70;
  const seen = [];
  for (let i = 0; i < 4; i++) { const {rec} = train(S, s => { s.reps = s.tr - 1; }); seen.push(rec.entries[0].sets.find(s => s.kind === 'work').w); }
  assert.deepEqual(seen, [70, 70, 70, 60]);
  assert.equal(S.T.state.lifts.bench.fails, 1, 'and counts again from there');
});

test('wave cycles: the training max rises only when the plus sets support it, and a missed 5s or 3s plus set resets it (item 41)', () => {
  const run = (grow, cycles) => {
    const S = strength();
    plan(S, {model: 'wave', days: 3, choice: {chest: 'bench'}});
    S.T.state.lifts.bench.tm = 90;
    let T = 100; const tms = [];
    for (let c = 0; c < cycles; c++) {
      for (let w = 0; w < 4; w++) for (let d = 0; d < 3; d++) train(S, s => {
        const max = canDo(S, T, s.w); s.reps = s.kind === 'plus' ? max : Math.min(s.tr, max); if (s.kind === 'plus') s.rpe = 10;
      }, d === 2 ? 3 : 2);
      tms.push(S.T.state.lifts.bench.tm); T *= 1 + grow;
    }
    return tms;
  };
  // Before: the training max went up 2.5 kg every cycle the heavy single was made (about RPE 5 to 6), so it climbed past
  // the true max. A lifter who isn't getting stronger now keeps a training max of 90% of their max.
  assert.deepEqual(run(0, 5), [90, 90, 90, 90, 90]);
  const growing = run(0.03, 5);
  assert.ok(growing[4] > 90 && growing.every((v, i) => !i || v - growing[i - 1] <= 2.5 + 1e-9), `a stronger lifter's training max moves up a step at a time (${growing})`);
  // a 5s-week plus set short of 5: the training max drops to 90% of what that set shows, not rounded to plates
  const S = strength();
  plan(S, {model: 'wave', days: 3, choice: {chest: 'bench'}});
  S.T.state.lifts.bench.tm = 110;
  const {rec} = train(S, s => { const max = canDo(S, 100, s.w); s.reps = s.kind === 'plus' ? max : Math.min(s.tr, max); if (s.kind === 'plus') s.rpe = 10; });
  const plus = rec.entries[0].sets.find(s => s.kind === 'plus');
  assert.ok(plus.reps < 5);
  assert.ok(Math.abs(S.T.state.lifts.bench.tm - 0.9 * S.Lift.e1rm(plus.w, plus.reps, 0, 'upper')) < 1e-9);
  assert.ok(S.T.state.lifts.bench.tm < 90);
});

test('back after a break: every program’s first session is lighter, the estimated max is not, and a long break suggests a retest (item 42)', () => {
  for (const model of ['linear', 'wave', 'topset']) for (const [away, f] of [[10, 1], [25, 0.95], [50, 0.9], [100, 0.9]]) {
    const S = strength();
    plan(S, {model, days: 3, choice: {chest: 'bench', back: 'dbrow', legs: 'squat'}, exp: 'exp'});
    const L = S.T.state.lifts;
    Object.assign(L.bench, {work: 80, tm: 90, seed: {v: 100, date: S.now - DAY, rated: true}});
    Object.assign(L.squat, {work: 100, tm: 120, seed: {v: 130, date: S.now - DAY, rated: true}});
    Object.assign(L.dbrow, {work: 30, tm: 30, seed: {v: 40, date: S.now - DAY, rated: true}});
    train(S, s => { s.reps = s.tr; s.rpe = 8; });
    const D = S.fn.progDef(), sets = () => Object.fromEntries(D.days[0].slots.map(([id, sc]) => [id, S.fn.planSlot(id, sc, 1, model)]));
    const e1 = () => ['bench', 'squat', 'dbrow'].map(S.fn.currentE1);
    const before = sets(), eb = e1(), work = L.bench.work;
    S.wait(away);
    const after = sets();
    assert.deepEqual(e1(), eb, `${model}, ${away} days: the estimated max stands`);
    for (const id of Object.keys(before)) before[id].forEach((s, i) => {
      if (s.w == null) return;
      const want = S.fn.roundLoad(after[id][i].w, id === 'dbrow' ? 'db' : 'bar');
      assert.equal(after[id][i].w, want);
      if (f === 1) assert.equal(after[id][i].w, s.w, `${model}, ${away} days: no change`);
      // about that much lighter, to the nearest weight you can load (a dumbbell rack may not have one)
      else assert.ok((id === 'dbrow' ? after[id][i].w <= s.w : after[id][i].w < s.w) && after[id][i].w >= s.w * f - 2.6, `${model}, ${away} days, ${id}: about ${Math.round((1 - f) * 100)}% lighter (${s.w} -> ${after[id][i].w})`);
    });
    const back = S.fn.backList(['bench', 'squat', 'dbrow']);
    assert.equal(back.length, f < 1 ? 3 : 0);
    if (away >= 84) assert.ok(back.every(x => x.d >= 84), 'past 12 weeks: the Today card offers a retest');
    // the first session back moves nothing on: the next one is back to the numbers
    if (f < 1 && model === 'linear') {
      train(S, s => { s.reps = s.tr; });
      assert.equal(L.bench.work, work); assert.equal(S.fn.backF('bench'), 1);
    }
  }
});

test('lift frequency: with 4 to 6 areas each lift averages 1.5 sessions a week on 3 days, twice on 2 or 4, and the deadlift at most twice (item 43)', () => {
  const CH = {chest: 'bench', back: 'row', legs: 'squat', shoulders: 'ohp', hips: 'deadlift', lats: 'pulldown'};
  for (const model of ['linear', 'wave', 'topset']) for (const days of [2, 3, 4]) for (const n of [3, 4, 5, 6]) {
    const S = strength();
    const areas = n === 3 ? ['chest', 'legs', 'hips'] : Object.keys(CH).slice(0, n), choice = {};
    areas.forEach(a => { choice[a] = CH[a]; });
    plan(S, {model, days, choice});
    Object.values(S.T.state.lifts).forEach(L => Object.assign(L, {work: 50, tm: 50, seed: {v: 60, date: S.now - DAY}}));
    const heavy = {}, light = {}, weeks = 4;
    for (let w = 0; w < weeks; w++) for (let d = 0; d < days; d++) {
      const {rec} = train(S, s => { s.reps = s.tr; }, d === days - 1 ? 7 - 2 * (days - 1) : 2);
      rec.entries.forEach(en => { const t = en.sc.lite ? light : heavy; t[en.liftId] = (t[en.liftId] || 0) + 1; });
    }
    const tag = `${model}, ${days} days, ${n} areas`;
    for (const a of areas) {
      const id = CH[a], h = (heavy[id] || 0) / weeks, l = (light[id] || 0) / weeks;
      if (n <= 3) {
        if (id === 'deadlift' && model === 'linear' && days >= 3) assert.equal(h, days / 2, `${tag}: the deadlift in every other session`);
        else assert.equal(h, days, `${tag}: ${id} every session`);
      } else if (days === 2) { assert.equal(h, 1, `${tag}: ${id} heavy once`); assert.equal(l, 1, `${tag}: ${id} and light once`); }
      else assert.equal(h, days / 2, `${tag}: ${id} ${days / 2} times a week`);
      if (id === 'deadlift' && model === 'linear') assert.ok(h + l <= 2, `${tag}: the deadlift at most twice a week`);
    }
  }
});

test('editing a finished session works progression out again from history: a 600 typed for 60 doesn’t stay your weight (item 44)', () => {
  const S = strength();
  plan(S, {model: 'linear', choice: {chest: 'bench'}});
  S.T.state.lifts.bench.work = 60;
  const first = train(S, s => { s.reps = s.tr; s.w = s.w === 60 ? 600 : s.w; }).rec;   // a typo on every set
  assert.equal(S.T.state.lifts.bench.work, 602.5);
  for (let i = 0; i < 2; i++) train(S, s => { s.reps = s.tr; s.w = 62.5; });
  S.fn.openEditSession(first.id);
  S.T.run('edit.rec.entries[0].sets.forEach(s=>{ if(s.w===600) s.w=60; })');
  S.fn.saveEdit();
  // 60 made, then 62.5 made twice: the next is 65, the misses none
  assert.equal(S.T.state.lifts.bench.work, 65);
  assert.equal(S.T.state.lifts.bench.fails, 0);
  // deleting the last session puts it back to where that one started from
  const last = S.T.state.history[S.T.state.history.length - 1];
  S.fn.replay(last); S.T.state.history.pop(); S.fn.replay(last);
  assert.equal(S.T.state.lifts.bench.work, 65, 'replaying again changes nothing');
});

test('editing a wave session works the training max out again, and so does deleting the one that ended a cycle (items 41 and 44)', () => {
  const S = strength();
  plan(S, {model: 'wave', days: 3, choice: {chest: 'bench'}});
  S.T.state.lifts.bench.tm = 90;
  let ender = null;
  for (let w = 0; w < 4; w++) for (let d = 0; d < 3; d++) {
    const {rec} = train(S, s => { const max = canDo(S, 106, s.w); s.reps = s.kind === 'plus' ? max : Math.min(s.tr, max); if (s.kind === 'plus') s.rpe = 10; });
    if (rec.cyc) ender = rec;
  }
  assert.ok(ender, 'the last session of the cycle is marked');
  assert.equal(S.T.state.lifts.bench.tm, 92.5, 'plus sets near 106 support a 92.5 training max');
  // the first 5s-week plus set was really a miss: the training max drops from there, and the cycle end is judged again
  const firstPlus = S.T.state.history.find(h => h.entries[0].sets.some(s => s.kind === 'plus'));
  S.fn.openEditSession(firstPlus.id);
  S.T.run('edit.rec.entries[0].sets.forEach(s=>{ if(s.kind==="plus"){ s.reps=3; s.rpe=10; } })');
  S.fn.saveEdit();
  const plus = S.T.state.history.find(h => h.id === firstPlus.id).entries[0].sets.find(s => s.kind === 'plus');
  assert.ok(S.T.state.lifts.bench.tm < 90, `a missed plus set resets the training max (${S.T.state.lifts.bench.tm})`);
  const reset = 0.9 * S.Lift.e1rm(plus.w, 3, 0, 'upper');
  assert.ok(S.T.state.lifts.bench.tm >= reset - 1e-9);
  // deleting the session that ended the cycle still judges the cycle at its place
  const tm = S.T.state.lifts.bench.tm, gone = S.T.state.history.find(h => h.id === ender.id);
  S.T.state.history = S.T.state.history.filter(h => h.id !== ender.id); S.fn.replay(gone);
  assert.equal(S.T.state.lifts.bench.tm, tm);
});

test('bodyweight-heavy lifts count a share of your bodyweight from the one log, and the box stays what you hold (items 45 and 38)', () => {
  const S = strength({body: [{date: Date.UTC(2026, 0, 1), kg: 80}]});
  const {totalOf, boxOf, setE1} = S.fn;
  assert.equal(totalOf('dbsplit', 20), 0.9 * 80 + 40, 'two dumbbells of 20 and 90% of 80 kg');
  assert.equal(totalOf('goblet', 20), 0.9 * 80 + 20);
  assert.equal(totalOf('backext', 10), 0.6 * 80 + 10);
  assert.equal(totalOf('bench', 100), 100);
  assert.equal(boxOf('dbsplit', totalOf('dbsplit', 17.5)), 17.5);
  // so 20 kg dumbbells for 12 and 30 kg for 5 tell a similar story, where the weights alone would not
  const a = setE1({done: true, kind: 'work', w: 20, reps: 10, rpe: 8}, 'dbsplit'), b = setE1({done: true, kind: 'work', w: 30, reps: 5, rpe: 8}, 'dbsplit');
  assert.ok(Math.abs(a / b - 1) < 0.08, `${a.toFixed(1)} and ${b.toFixed(1)}`);
  // Strength's old single bodyweight only while nothing is logged
  const old = strength(); old.T.state.settings.bw = 90;
  assert.equal(old.fn.totalOf('goblet', 0), 0.9 * 90);
  // for Muscle's split squat (bodyweight plus what you add) the last set is both dumbbells, and an RPE box left blank on
  // a set with a target counts at the target, as the estimate counts it
  S.T.state.history.push({id: 'x', name: 'A', date: S.now - DAY, entries: [{liftId: 'dbsplit', sets: [{kind: 'work', w: 20, reps: 8, trpe: 8, tr: 8, done: true}]}]});
  assert.deepEqual(plain(S.hub.lastSet('dbsplit')), {weight: 40, reps: 8, rir: 2, date: S.now - DAY});
  S.T.state.history[0].entries[0].sets[0].reps = 6;
  assert.equal(S.hub.lastSet('dbsplit').rir, 0, 'short of the target: all-out');
});

test('kit: a trap bar has its own weight, a pull from the floor warms up from full-size plates, and a dumbbell set needs a weight (item 46)', () => {
  const S = strength();
  assert.equal(S.Kit.bar('trap', 'kg'), 25);
  assert.equal(S.T.run('eqOf("tbdl")'), 'trap');
  assert.equal(S.fn.roundLoad(26, 'trap'), 25, 'never under the trap bar');
  assert.deepEqual(plain(S.T.run('platesFor(85, "trap")')), {ok: true, per: [{p: 25, c: 1}, {p: 5, c: 1}], left: 0});
  const ramp = S.fn.warmups('deadlift', 140, true);
  assert.equal(ramp[0].w, 60, 'a 20 kg bar with 20 kg plates on, at the proper height');
  assert.ok(ramp.every((x, i) => !i || x.w > ramp[i - 1].w));
  assert.equal(S.fn.warmups('deadlift', 55, true)[0].w, 20, 'under that, the empty bar');
  assert.equal(S.fn.warmups('squat', 140, true)[0].w, 20, 'a squat starts from the empty bar');
  // a 0 kg dumbbell set can't be ticked
  plan(S, {model: 'linear', choice: {chest: 'dbbench'}});
  S.fn.startProgramDay(0);
  const s = S.T.state.active.entries[0].sets.find(x => x.kind === 'work');
  s.w = 0; s.reps = 8; S.fn.toggleDone(0, S.T.state.active.entries[0].sets.indexOf(s));
  assert.equal(s.done, false);
  // the new lifts have instructions, and Strength's split squat is Muscle's split squat
  for (const id of ['tbdl', 'ssquat', 'sbench', 'thrust', 'hack', 'belt', 'dbsplit']) assert.ok(S.T.run(`!!window.HOWTO[EX.${id}.h]`), id);
  assert.equal(S.T.run('window.SAME_LIFT.dbsplit'), 'split-squat');
  assert.equal(S.T.run('EX.dbsplit.h'), 'split-squat');
});

test('swaps list the same movement first, then its family, then the rest (item 47)', () => {
  const S = strength();
  const legs = S.fn.swapOrder('squat', S.fn.options('legs', true).filter(id => id !== 'squat'));
  assert.deepEqual(plain(legs.slice(0, 4)), ['fsquat', 'psquat', 'goblet', 'ssquat']);
  assert.ok(legs.indexOf('legpress') > legs.indexOf('psquat') && legs.indexOf('legpress') < legs.indexOf('dbsplit'));
  const hips = S.fn.swapOrder('deadlift', S.fn.options('hips', true).filter(id => id !== 'deadlift'));
  assert.deepEqual(plain(hips.slice(0, 2)), ['sumo', 'tbdl']);
});

test('new to it: three weeks at RPE 7 at most, no set to failure, a starting test that is easy for 8 (item 10)', () => {
  for (const model of ['linear', 'topset', 'wave']) {
    const S = strength();
    plan(S, {model, days: 3, choice: {chest: 'bench', legs: 'squat'}, exp: 'new'});
    Object.values(S.T.state.lifts).forEach(L => Object.assign(L, {work: 40, tm: 60, seed: {v: 70, date: S.now - DAY}}));
    assert.ok(S.fn.introOn());
    for (let i = 0; i < 9; i++) {
      const {active} = train(S, s => { s.reps = s.tr; });
      for (const en of active.entries) for (const s of en.sets) if (s.kind !== 'warm') {
        // wave cycles' lighter percentage sets have no target; their plus set stops at RPE 7 for now
        assert.ok(s.trpe == null ? s.kind !== 'plus' && model === 'wave' : s.trpe <= 7, `${model}, session ${i + 1}: target RPE 7 or easier (${s.kind} ${s.trpe})`);
        assert.ok(!s.chk, 'no RPE check to failure');
      }
    }
    assert.ok(!S.fn.introOn(), `${model}: after three weeks the plan is as chosen`);
  }
  // the starting test: a weight that feels easy for 8, which is where the work starts
  const S = strength();
  plan(S, {model: 'linear', choice: {chest: 'bench'}, exp: 'new'});
  const box = (k, v) => ({dataset: {id: 'bench', num: k}, value: v});
  S.T.run('__root').querySelectorAll = () => [box('w', '40'), box('r', ''), box('rpe', '')];
  S.fn.saveStart();
  const L = S.T.state.lifts.bench;
  assert.equal(L.work, 40);
  assert.ok(Math.abs(L.seed.v - S.Lift.e1rm(40, 8, 0, 'upper')) < 1e-9, 'reps left blank: the 8');
});

test('an RPE check now and then on a set short of failure goes to Muscle’s record as a compound check (F6)', () => {
  const S = strength();
  plan(S, {model: 'topset', choice: {chest: 'bench', legs: 'squat'}, exp: 'exp'});
  S.T.state.lifts.bench.seed = {v: 100, date: S.now - DAY, rated: true};
  S.T.state.lifts.squat.seed = {v: 140, date: S.now - DAY, rated: true};
  assert.ok(!S.fn.checkable('squat') && !S.fn.checkable('deadlift') && S.fn.checkable('bench'));
  S.fn.startProgramDay(0);
  const en = S.T.state.active.entries.find(e => e.liftId === 'bench'), ei = S.T.state.active.entries.indexOf(en);
  const si = en.sets.findIndex(s => s.chk);
  assert.ok(si >= 0 && en.sets[si].kind === 'bo', 'one back-off set asks for the check');
  assert.ok(!S.T.state.active.entries.find(e => e.liftId === 'squat').sets.some(s => s.chk));
  const s = en.sets[si]; s.reps = 8;   // 5 to the planned stop, 3 more
  S.fn.toggleDone(ei, si);
  const els = new Map([['chk-call', {value: '2'}], ['chk-extra', {value: '3'}]]);
  S.T.run('__root').getElementById = id => els.get(id) || {value: ''};
  S.fn.saveCheck(ei, si);
  assert.equal(S.cals.length, 1);
  assert.equal(S.cals[0].predictedRir, 2); assert.equal(S.cals[0].actualExtra, 3); assert.equal(S.cals[0].reps, 5);
  assert.equal(S.cals[0].cls, 'upper'); assert.equal(S.cals[0].from, 'Strength');
  assert.equal(s.reps, 8); assert.equal(s.rpe, 10);
  // not again for three weeks
  S.T.state.active = null; S.fn.startProgramDay(0);
  assert.ok(!S.T.state.active.entries.some(e => e.sets.some(x => x.chk)));
});
