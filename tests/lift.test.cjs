const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// The shared set maths every section uses, run from app.js itself.
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const ctx = {window: {}}; vm.createContext(ctx);
const a = app.indexOf('/* ==================== WHAT GROWS MORE'), b = app.indexOf('/* ==================== TAKE BACK');
vm.runInContext(app.slice(a, b), ctx); ctx.Lift = ctx.window.Lift; ctx.GROWTH = ctx.window.GROWTH;
const L = ctx.window.Lift;

test('a set left short of failure counts the reps you had left', () => {
  assert.equal(L.e1rm(100, 10, 0).toFixed(1), (100 * (1 + 10 / 30)).toFixed(1));
  assert.equal(L.e1rm(100, 8, 2).toFixed(1), L.e1rm(100, 10, 0).toFixed(1), '8 with 2 left is the 10 you could have done');
  assert.ok(L.e1rm(100, 8, 3) > L.e1rm(100, 8, 0), 'the same set done easier means you are stronger');
  assert.equal(L.e1rm(100, 1, 0), 100);
  assert.equal(L.e1rm(0, 5, 1), 0);
});

test('sets far from failure count part of a hard set, or none', () => {
  assert.deepEqual([null, 0, 3, 4, 5, 6, 8].map(L.hard), [1, 1, 1, 0.5, 0.5, 0, 0]);
});

test('sets to failure and new movements leave more to recover from', () => {
  assert.ok(L.tiring(0) > L.tiring(2) && L.tiring(2) > L.tiring(5));
  assert.equal(L.tiring(2, true), 1.5 * L.tiring(2));
  const day = 86400000, h = [{date: 0, ex: ['a']}, {date: 10 * day, ex: ['a', 'b']}, {date: 50 * day, ex: ['a']}];
  const novel = L.novelty(h, w => w.ex);
  assert.deepEqual([novel(h[0], 'a'), novel(h[1], 'a'), novel(h[1], 'b'), novel(h[2], 'a')], [true, false, true, true]);
});

test('reps in reserve are corrected by how you judge them, by half on low-rep sets', () => {
  L.bias = 2;
  try {
    assert.equal(L.trueRir(1, 8), 3);
    assert.equal(L.trueRir(1, 3), 2);
    assert.equal(L.e1rm(100, 8, 0).toFixed(2), L.pct(10) && (100 / L.pct(10)).toFixed(2), 'a set called at failure had 2 more in it');
    assert.equal(L.hard(2, 10), 0.5, 'called 2 short, really 4 short: half a hard set');
  } finally { L.bias = 0; }
});

test('a block covers each part of a muscle, and prefers training it at long lengths', () => {
  const G = ctx.window.GROWTH;
  assert.equal(G.region('leg-extension', 'quad'), 'rf');
  assert.equal(G.region('back-squat', 'quad'), 'squat');
  assert.deepEqual([...G.missing('quad', {quad: new Set(['squat'])})], ['rf']);
  assert.deepEqual([...G.missing('ham', {ham: new Set(['hinge', 'curl'])})], []);
  assert.ok(G.long['overhead-ext'] > (G.long['tricep-pushdown'] || 0) && G.long['leg-curl'] > (G.long['lying-leg-curl'] || 0));
});
