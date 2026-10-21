const test = require('node:test');
const assert = require('node:assert/strict');
const security = require('../security.js');
const state = {v: 1, settings: {unit: 'kg'}, exercises: [], history: [
  {id: 'session-1', name: "O'Brien <Gym>", date: 1700000000000, entries: [
    {exId: 'squat', name: 'Squat', sets: [{weight: 50, reps: 5, rir: 2, done: true}]}
  ]}
]};
const envelope = data => JSON.stringify({app: 'milovancroton', version: 1, data});
class Storage {
  constructor(data = {}, failure = ()=>false) { this.values = {...data}; this.failure = failure; }
  getItem(k) { return this.values[k] ?? null; }
  setItem(k,v) { if (this.failure(k,v)) throw new Error('quota'); this.values[k]=String(v); }
  removeItem(k) { delete this.values[k]; }
}

test('valid backups preserve text, version and records', () => {
  const parsed = security.backup(envelope({'hyplog.v1': JSON.stringify(state)}));
  assert.deepEqual(JSON.parse(parsed.data['hyplog.v1']),state);
  assert.doesNotThrow(()=>security.section({v:2, history:[], repeat:{name:'Next',ids:['pullup']}},'proladder.v1'));
  assert.doesNotThrow(()=>security.section({v:1, custom:[['lift'],['str']],days:2},'trainer.together'));
  assert.doesNotThrow(()=>security.section({v:1, custom:null, days:2},'trainer.together'));
  assert.doesNotThrow(()=>security.section({v:1, custom:null, prio:['cal','lift','str'], days:2},'trainer.together'));
  assert.doesNotThrow(()=>security.section({v:1, history:[], repeat:{name:'Next',items:[['squat',3]]}},'hyplog.v1'));
});
test('foreign storage, future versions, malformed sessions, injected identifiers and prototype keys are refused', () => {
  assert.throws(()=>security.backup(envelope({'other-app.token':'secret'})));
  assert.throws(()=>security.backup(JSON.stringify({app:'milovancroton',version:2,data:{}})));
  assert.throws(()=>security.parseSection('{"history":[{"id":"x","name":"X","entries":{}}]}','hyplog.v1'));
  const poisoned=structuredClone(state); poisoned.history[0].id='" onmouseover="alert(1)';
  assert.throws(()=>security.section(poisoned,'hyplog.v1'));
  assert.throws(()=>security.parseSection('{"settings":{"__proto__":{"polluted":true}}}','strlog.v2'));
  assert.throws(()=>security.parseSection('{"settings":{"rest":"<img onerror=alert(1)>"}}','strlog.v2'));
  assert.throws(()=>security.parseSection('{"v":99}','strlog.v2'));
});
test('oversized and deeply nested inputs fail before storage changes', () => {
  assert.throws(()=>security.backup(' '.repeat(security.MAX_BYTES+1)));
  let value={}; for(let i=0;i<30;i++) value={child:value};
  assert.throws(()=>security.section(value,'hyplog.v1'));
});
test('snapshot and restore are confined to this app', () => {
  const storage=new Storage({'hyplog.v1':JSON.stringify(state),'other-app.token':'secret','other.undo':'keep','hyplog.v1.undo':'old'});
  assert.equal(security.snapshot(storage)['other-app.token'],undefined);
  security.restore(storage,{'strlog.v2':JSON.stringify({v:2,history:[]})});
  assert.equal(storage.getItem('other-app.token'),'secret');
  assert.equal(storage.getItem('other.undo'),'keep');
  assert.equal(storage.getItem('hyplog.v1.undo'),null);
  assert.equal(storage.getItem('hyplog.v1'),null);
  assert.equal(JSON.parse(storage.getItem('milo.before')).data['hyplog.v1'],JSON.stringify(state));
});
test('invalid or unreservable restore leaves workouts untouched', () => {
  const before={'hyplog.v1':JSON.stringify(state)};
  for(const failure of [()=>false,k=>k==='milo.before']) {
    const storage=new Storage(before,failure);
    assert.throws(()=>security.restore(storage, failure('milo.before')? {'strlog.v2':'{"v":2,"history":[]}'} : {'hyplog.v1':'{"history":[false]}'}));
    assert.equal(storage.getItem('hyplog.v1'),before['hyplog.v1']);
  }
});
test('quota failure during writes rolls back without touching other apps', () => {
  const before={'hyplog.v1':JSON.stringify(state),'other.token':'secret','hyplog.v1.undo':'old'};
  const storage=new Storage(before,k=>k==='strlog.v2');
  assert.throws(()=>security.restore(storage,{'strlog.v2':'{"v":2,"history":[]}'}));
  assert.deepEqual(storage.values,before);
});
