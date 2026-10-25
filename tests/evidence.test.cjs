const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// The three evidence libraries (Muscle, Ladder, Strength) and the shared exercise instructions, run from app.js itself.
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
function libraries() {
  const out = [];
  for (let at = 0; ;) {
    const a = app.indexOf('/* ==================== EVIDENCE', at);
    if (a < 0) break;
    const b = app.indexOf('/* ====', a + 10);
    const src = app.slice(a, b);
    if (src.includes('const EVIDENCE')) out.push(vm.runInContext(src + '\n;EVIDENCE', vm.createContext({}), {filename: 'app.js:evidence'}));
    at = b;
  }
  return out;
}
const [muscle, ladder, strength] = libraries();
const all = {muscle, ladder, strength};
// [section, card, citation, url] for every source; Muscle's are [citation, url], the others [citation, journal, url]
const sources = Object.entries(all).flatMap(([lib, E]) => Object.entries(E).flatMap(([k, e]) => e.src.map(s => [lib, k, s[0], s[s.length - 1]])));

// Sources with neither a DOI nor a PubMed record that could be found: linked to the publisher's page or the book's catalogue entry.
const NO_DOI_OR_PUBMED = [
  'https://journals.lww.com/acsm-msse/Abstract/1993/08000/The_effects_of_detraining_on_power_athletes.8.aspx',
  'https://journals.lww.com/nsca-jscr/abstract/1997/11000/the_accuracy_of_prediction_equations_for.1.aspx',
  'https://www.worldcat.org/isbn/9780736037785',
];
// Sources that could not be resolved to the paper at all and so still link to a search. Keep this empty if you can.
const UNRESOLVED_SEARCHES = [];

test('the three evidence libraries load, with every card the sections link to', () => {
  assert.ok(muscle && ladder && strength, 'three libraries');
  for (const k of ['volume', 'effort', 'load', 'progression', 'deload', 'rom', 'advanced', 'sleep', 'protein', 'selection', 'comeback']) assert.ok(muscle[k], 'Muscle ' + k);
  for (const k of ['nordic', 'works', 'stretchtime', 'session', 'qualities', 'goals', 'ankle', 'balance', 'landing', 'mobility', 'scap', 'wrists']) assert.ok(ladder[k], 'Ladder ' + k);
  for (const k of ['specific', 'estimate', 'warmup', 'rpe', 'deload', 'taper', 'comeback']) assert.ok(strength[k], 'Strength ' + k);
});

test('every evidence source links to the paper itself, never to a search', () => {
  const paper = [/^https:\/\/doi\.org\/10\.\d{4,9}\/\S+$/, /^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/, /^https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC\d+\/$/];
  assert.ok(sources.length > 100);
  for (const [lib, k, c, url] of sources) {
    const where = `${lib}.${k}: ${c}`;
    if (/[?&]term=/.test(url)) { assert.ok(UNRESOLVED_SEARCHES.includes(url), 'a PubMed search instead of the paper: ' + where); continue; }
    assert.ok(paper.some(re => re.test(url)) || NO_DOI_OR_PUBMED.includes(url), 'not a DOI, PubMed or PMC link: ' + where + ' ' + url);
  }
});

test('a link always names the same paper', () => {
  // first word and year of the citation, so "Kikuchi & Nakazato 2017" and "Kikuchi et al. 2017" would agree
  const who = c => c.split(/\s/)[0] + ' ' + (c.match(/\b(19|20)\d\d\b/) || [''])[0];
  const seen = new Map();
  for (const [lib, k, c, url] of sources) {
    const w = who(c);
    if (seen.has(url)) assert.equal(w, seen.get(url), `${lib}.${k} cites ${url} as ${w}`);
    else seen.set(url, w);
  }
});

test('cards say one sentence of finding and one of what to do; nuance goes in the detail', () => {
  const sentences = t => t.split(/[.!?](?=\s+[A-Z])/).length;
  for (const [lib, E] of Object.entries(all)) for (const [k, e] of Object.entries(E)) {
    assert.ok(e.t && e.s && e.a && e.src.length, `${lib}.${k} has a title, finding, advice and sources`);
    assert.equal(sentences(e.s), 1, `${lib}.${k} finding is one sentence`);
    assert.equal(sentences(e.a), 1, `${lib}.${k} advice is one sentence`);
  }
});

test('confidence ratings use the badges each section styles', () => {
  for (const e of Object.values(muscle)) assert.ok(['high', 'mod', 'low'].includes(e.c), e.t);
  for (const e of [...Object.values(ladder), ...Object.values(strength)]) assert.ok(['high', 'mod', 'early'].includes(e.c), e.t);
});

test('the review fixes stay fixed', () => {
  // the deload trial tested a week off, and the card is rated at the lowest level
  assert.equal(muscle.deload.c, 'low');
  assert.match(muscle.deload.s + muscle.deload.d, /week off/);
  assert.match(strength.deload.s + strength.deload.d, /week off/);
  assert.match(muscle.protein.a, /1\.6 g\/kg.*2\.2/);
  assert.match(muscle.rom.d, /21 untrained adults/);
  assert.doesNotMatch(muscle.progression.s, /drives growth/);
  assert.equal(ladder.works.c, 'mod');
  assert.equal(strength.warmup.c, 'early');
  assert.doesNotMatch(JSON.stringify(strength), /Attempts tool/);
  assert.match(JSON.stringify(strength.specific.src), /Mattocks et al\. 2017[^']*untrained/);
  assert.match(JSON.stringify(strength.periodization), /undulating/);
  assert.ok(ladder.works.src.some(s => /Kikuchi/.test(s[0]) && s[1] === 'J Exerc Sci Fit'));
  for (const k of ['frequency', 'session']) assert.ok(ladder[k].src.some(s => /Schoenfeld et al\. 2019/.test(s[0]) && s[1] === 'J Sports Sci'));
  assert.doesNotMatch(JSON.stringify(ladder), /Bakhach|Sports Health/);
  assert.ok(ladder.leverage.src.some(s => /Bernasconi/.test(s[0]) && /iron cross/.test(s[0]) && s[1] === 'J Sports Med Phys Fitness'));
  // the estimate card matches how Strength's estimate works
  assert.match(strength.estimate.d, /smoothed average/);
  assert.match(strength.estimate.d, /RPE 6\.5/);
});

const howto = (() => {
  const a = app.indexOf('/* ==================== EXERCISE INSTRUCTIONS'), b = app.indexOf('/* ==================== BACK ====================');
  const ctx = vm.createContext({window: {}});
  vm.runInContext(app.slice(a, b), ctx, {filename: 'app.js:HOWTO'});
  return ctx.window.HOWTO;
})();
const text = id => JSON.stringify(howto[id]);

test('barbell presses grip with the thumbs round the bar, and benching alone uses the safety arms on every set', () => {
  for (const id of ['barbell-bench', 'close-grip-bench', 'pause-bench', 'incline-bench', 'ohp', 'push-press', 'smith-press', 'skullcrusher']) assert.match(text(id), /thumbs? wrapped round/i, id);
  for (const id of ['barbell-bench', 'close-grip-bench', 'pause-bench', 'incline-bench']) assert.match(howto[id].note, /on every set/, id);
  for (const id of ['back-squat', 'pause-squat', 'front-squat']) assert.match(howto[id].note, /safety pins/, id);
  for (const id of ['barbell-bench', 'ohp', 'back-squat', 'front-squat', 'deadlift', 'leg-press', 'hip-thrust']) assert.match(howto[id].note, /High blood pressure/, id);
});

test('handstand and weighted-step instructions match the Ladder', () => {
  assert.match(text('wall-hspu'), /forward of the hands, toward the wall/);
  assert.doesNotMatch(text('wall-hspu'), /away from the wall/);
  assert.match(text('freestanding-handstand'), /the way you kicked up/);
  assert.doesNotMatch(app.slice(0, app.indexOf('/* ==================== BACK')), /fall back toward your feet/);
  assert.match(text('weighted-pullup'), /3 sets of 8 strict pull-ups/);
  assert.match(text('weighted-chin-up'), /3 sets of 10 strict chin-ups/);
  assert.match(text('weighted-dip'), /3 sets of 10 strict dips/);
});
