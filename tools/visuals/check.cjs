// Checks every exercise figure without a browser: it renders, its frames can blend (same shape in each),
// and the hands and feet given a target reach it. A miss means a limb is too short for the pose: a hand
// floating above the floor or bar, a foot off the box. Free hands aimed at a spot (hanging at the sides,
// reaching) and cables, which attach at the hand wherever it ends up, miss harmlessly, so it reports rather than fails.
//   node tools/visuals/check.cjs           report figures off by more than 1.2 units (a unit is about 1.6 cm)
const vm = require('node:vm');
const {bundle} = require('./build.cjs');

function load() {
  const ctx = {console, Math, JSON, Object, Array, String, Number, Set, Map, Error, performance: {now: () => 0}, matchMedia: () => ({matches: false}),
    document: {querySelectorAll: () => [], addEventListener: () => {}, hidden: false}, setInterval: () => 0, setTimeout: () => 0, requestAnimationFrame: () => 0, innerHeight: 900};
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(bundle(), ctx, {filename: 'visuals.js'});
  return ctx.MiloVis;
}
// the shape of a pose: its keys, and the length of each list, all the way down
const shape = v => Array.isArray(v) ? '[' + v.length + (v.length && typeof v[0] === 'object' ? ':' + shape(v[0]) : '') + ']'
  : v && typeof v === 'object' ? '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => k + ':' + shape(v[k])).join(',') + '}' : typeof v;
function problems(V) {
  const out = [], D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  for (const [id, m] of Object.entries(V.MOVES)) {
    const s0 = shape(m.frames[0]);
    m.frames.forEach((p, k) => {
      if (k && shape(p) !== s0) out.push({id, k, what: 'frame ' + k + ' has a different shape from frame 0, so it cannot blend'});
      const J = V.solve(p), miss = [];
      const chk = (spec, end, name) => { if (spec && !Array.isArray(spec) && spec.to) { const e = D(J[end], spec.to); if (e > 1.2) miss.push(name + ' ' + e.toFixed(1)); } };
      chk(p.a, 'wr', 'hand'); chk(p.a2 || p.a, 'wr2', 'far hand'); chk(p.l, 'an', 'foot'); chk(p.l2 || p.l, 'an2', 'far foot');
      if (p.sh && p.hip) { const e = Math.abs(D(p.sh, p.hip) - 30 * (p.tl || 1)); if (e > 1.2) miss.push('shoulder off by ' + e.toFixed(1)); }
      if (Object.values(J).some(v => Array.isArray(v) && v.some(n => !Number.isFinite(n)))) miss.push('a joint is not a number');
      if (miss.length) out.push({id, k, what: miss.join(', ')});
    });
  }
  return out;
}
if (require.main === module) {
  const V = load(), list = problems(V);
  console.log(Object.keys(V.MOVES).length + ' figures; ' + list.length + ' to look at');
  list.forEach(p => console.log('  ' + p.id + ' #' + p.k + ': ' + p.what));
}
module.exports = {load, problems, shape};
