// Builds the exercise visuals into app.js: engine.js with every moves-*.js file, between the two marker lines.
// Edit the files here, then run: node tools/visuals/build.cjs && node tools/update-integrity.cjs
//   --check          fail if app.js does not hold the current build (the tests run this)
//   --sheet <file>   also write a page showing every figure's first and last position, for checking poses by eye;
//                    a comma list of ids after it limits the page to those
const fs = require('node:fs');
const path = require('node:path');
const dir = __dirname, appPath = path.join(dir, '..', '..', 'app.js');
const START = '/* @@visuals-start: built by tools/visuals/build.cjs from the files there; edit those, not this block */';
const END = '/* @@visuals-end */';

function bundle() {
  const engine = fs.readFileSync(path.join(dir, 'engine.js'), 'utf8');
  if (!engine.includes('/* @@MOVES@@ */')) throw new Error('engine.js has lost its /* @@MOVES@@ */ line');
  const moves = fs.readdirSync(dir).filter(f => /^moves-.+\.js$/.test(f)).sort().map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  return engine.replace('/* @@MOVES@@ */', () => moves);
}
function block() { return START + '\n' + bundle().trimEnd() + '\n' + END; }
function withBlock(app) {
  const a = app.indexOf(START), b = app.indexOf(END);
  if (a >= 0 && b > a) return app.slice(0, a) + block() + app.slice(b + END.length);
  // first build: just after the shared exercise instructions, which every figure is keyed by
  const at = app.indexOf('/* ==================== BACK ====================');
  if (at < 0) throw new Error('app.js has no BACK section to insert the visuals before');
  return app.slice(0, at) + block() + '\n\n' + app.slice(at);
}
function sheet(ids) {
  const js = bundle();
  return `<!doctype html><meta charset="utf-8"><title>Exercise figures</title><style>
:root{--mv-body:#3b4650;--mv-far:#a3adb4;--mv-main:#e0662c;--mv-help:#f0a57a;--mv-floor:#c4cbd0;--mv-prop:#b9c1c6;--mv-gear:#5b6670;--mv-bg:#f6f7f7;--mv-sil:#e2e6e8;--mv-off:#cfd5d9}
body{font:11px system-ui;margin:8px;background:#fff;color:#222} .g{display:grid;grid-template-columns:repeat(${process.env.COLS || 4},1fr);gap:6px}
.c{border:1px solid #ddd;border-radius:6px;padding:4px} .c b{display:block;font-size:10.5px;margin-bottom:2px} .r{display:flex;gap:2px}
.r svg.mvfig{width:48%;height:auto;background:var(--mv-bg)}
</style><body><div class="g" id="g"></div><script>${js}</script><script>
const ids=${JSON.stringify(ids)}||Object.keys(MiloVis.MOVES);
document.getElementById('g').innerHTML=ids.map(id=>{ const m=MiloVis.MOVES[id]; if(!m) return '<div class="c"><b>MISSING '+id+'</b></div>'; const n=m.frames.length;
  return '<div class="c"><b>'+id+(n<2?' (hold)':'')+'</b><div class="r">'+MiloVis._still(id,0)+(n>1?MiloVis._still(id,n-1):'')+'</div></div>'; }).join('');
</script>`;
}

if (require.main === module) {
  const app = fs.readFileSync(appPath, 'utf8'), next = withBlock(app), argv = process.argv.slice(2);
  if (argv.includes('--check')) {
    if (next !== app) { console.error('app.js holds an old build of the visuals. Run node tools/visuals/build.cjs.'); process.exit(1); }
  } else if (next !== app) { fs.writeFileSync(appPath, next); console.log('Visuals written into app.js. Now run node tools/update-integrity.cjs.'); }
  const s = argv.indexOf('--sheet');
  if (s >= 0) { const ids = argv[s + 2] ? argv[s + 2].split(',') : null; fs.writeFileSync(argv[s + 1], sheet(ids)); }
}
module.exports = {bundle, block, START, END};
