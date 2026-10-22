const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {block} = require('../tools/visuals/build.cjs');
const {load, problems} = require('../tools/visuals/check.cjs');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const howto = () => { const i = app.indexOf('window.HOWTO = {'), j = app.indexOf('\n};', i); return vm.runInNewContext('(' + app.slice(app.indexOf('{', i), j + 2) + ')'); };
const ladders = () => { const i = app.indexOf('const LADDERS='); let d = 0, j = i + 14;
  for (; j < app.length; j++) { if (app[j] === '{') d++; else if (app[j] === '}' && !--d) break; }
  return vm.runInNewContext('(' + app.slice(i + 14, j + 1) + ')'); };
const V = load();

test('app.js holds the current build of the exercise visuals', () => {
  assert.ok(app.includes(block()), 'run node tools/visuals/build.cjs, then node tools/update-integrity.cjs');
});

test('every exercise with instructions has a figure, and every figure has instructions', () => {
  const H = Object.keys(howto()), M = Object.keys(V.MOVES);
  assert.deepEqual(H.filter(id => !V.MOVES[id]), [], 'instructions without a figure');
  assert.deepEqual(M.filter(id => !H.includes(id)), [], 'figures without instructions');
});

test('every figure renders, its frames blend, and its joints are numbers', () => {
  assert.deepEqual(problems(V).filter(p => /shape|not a number/.test(p.what)), []);
  for (const id of Object.keys(V.MOVES)) {
    const html = V.card(id, {p: ['chest'], s: ['tri']}, id);
    assert.match(html, /<svg class="mvfig/, id);
    assert.doesNotMatch(html, /NaN|undefined/, id);
    V.MOVES[id].frames.forEach((f, k) => assert.doesNotMatch(V._still(id, k), /NaN|undefined/, id + ' frame ' + k));
  }
});

test('hands and feet meant to rest on something reach it', () => {
  // Figures checked by eye where the hand is meant to be free (hanging, reaching) or a cable meets it wherever it is.
  const free = /^(deadlift|rack-pull|sl-reach|cable-pull-through|partial-nordic-curl|split-squat|reverse-lunge|walking-lunge|bw-walking-lunge|bulgarian-split-squat|calf-wall-stretch|db-step-up|lateral-lunge|leg-press|leg-press-calf|sliding-hamstring-curl|hip-thrust|glute-bridge|single-leg-glute-bridge|single-leg-calf-raise|deficit-calf-raise|incline-machine-press|overhead-ext|archer-pullup|assisted-archer-pullup|strict-muscleup|jumping-muscleup|band-muscleup|muscleup-negative|low-bar-transition|ring-muscleup|assisted-ring-muscleup|low-ring-transition|cable-woodchop)$/;
  assert.deepEqual(problems(V).filter(p => !free.test(p.id)).map(p => p.id + ' #' + p.k + ': ' + p.what), []);
});

test('every progression shows muscles the map can draw, stretches labelled as stretches', () => {
  const L = ladders();
  for (const [lid, l] of Object.entries(L)) for (const st of l.steps) {
    const mus = V.muscles(st.id, {p: [], s: []}, l.like || lid);
    for (const k of [...mus.p, ...(mus.s || [])]) assert.ok(V.names[k], st.id + ' names ' + k);
    if (l.prep && l.q === 'mobility' && !['wall-arm-raise', 'overhead-stick-lift', 'ankle-rock-8', 'ankle-rock-10', 'ankle-rock-12'].includes(st.id))
      assert.match(V.card(st.id, null, st.n, l.like || lid), />Stretched</, st.id);
  }
  // handstands count toward no muscle's sets, yet the drawing still shows the shoulders working
  assert.deepEqual([...V.muscles('freestanding-handstand', {p: [], s: []}, 'handstand').p], ['fdelt', 'trap']);
  // a section's own muscles are used when it has them
  const own = V.muscles('pushup', {p: ['chest'], s: ['tri']}, 'pushh');
  assert.deepEqual([own.p, own.s], [['chest'], ['tri']]);
});

test('the card names its muscles for screen readers and marks them on the map', () => {
  const html = V.card('back-squat', {p: ['quad', 'glute'], s: ['ham']}, 'Back Squat');
  assert.match(html, /aria-label="Back Squat: the movement, start to finish\. Main: quads, glutes\. Helps: hamstrings\."/);
  assert.equal((V.map({p: ['quad'], s: ['ham']}).match(/class="mvmainf"/g) || []).length, 2, 'quads, both sides');
  assert.equal((V.map({p: ['quad'], s: ['ham']}).match(/class="mvhelpf"/g) || []).length, 2, 'hamstrings, both sides');
});

test('with reduced motion a card shows the first and last positions side by side', () => {
  const ctx = {console, Math, JSON, Object, Array, String, Number, Set, Map, Error, performance: {now: () => 0}, matchMedia: () => ({matches: true}),
    document: {querySelectorAll: () => [], addEventListener: () => {}, hidden: false}, setInterval: () => 0, setTimeout: () => 0, requestAnimationFrame: () => 0, innerHeight: 900};
  ctx.window = ctx; vm.createContext(ctx);
  const i = app.indexOf('/* @@visuals-start'), j = app.indexOf('/* @@visuals-end */');
  vm.runInContext(app.slice(i, j), ctx);
  const html = ctx.MiloVis.card('back-squat', {p: ['quad'], s: []}, 'Back Squat');
  assert.equal((html.match(/class="mvfig mvhalf"/g) || []).length, 2);
  assert.doesNotMatch(html, /data-mv=/, 'still figures are not animated');
});
