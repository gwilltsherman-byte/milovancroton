const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
const code=fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8');
function worker(overrides={}) {
  const handlers={},deleted=[];
  const current='milovancroton-'+code.match(/const CACHE = PREFIX \+ '([^']+)'/)[1];
  vm.runInNewContext(code,{URL,Request,Set,Promise,setTimeout,
    self:{registration:{scope:'https://example.test/milo/'},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{}},skipWaiting:async()=>{}},
    caches:{keys:async()=>['other-app-cache','trainlog-v58','milovancroton-v58',current],delete:async k=>deleted.push(k)},
    ...overrides,
  });
  return {handlers,deleted};
}
test('activation removes only obsolete Milo caches',async()=>{
  const {handlers,deleted}=worker(); let work;
  handlers.activate({waitUntil:p=>work=p}); await work;
  assert.deepEqual(deleted,['milovancroton-v58']);
});
test('foreign origins, sibling apps and unknown paths are never intercepted',()=>{
  const {handlers}=worker();
  for(const url of ['https://attacker.test/milo/index.html','https://example.test/other/index.html','https://example.test/milo/untrusted.html']) {
    let intercepted=false;
    handlers.fetch({request:{url,method:'GET',mode:'navigate'},respondWith:()=>intercepted=true});
    assert.equal(intercepted,false,url);
  }
});

test('an updated offline shell gets fresh scripts instead of stale HTTP-cache entries',async()=>{
  const saved=new Map(),appPath='/milo/app.js';
  const cache={
    async addAll(requests) {
      for(const request of requests) {
        const url=new URL(typeof request==='string'?request:request.url,'https://example.test/milo/');
        const body=url.pathname===appPath
          ? (request.cache==='reload'?'current-script':'old-http-cache-script')
          : 'current-asset';
        saved.set(url.pathname,body);
      }
    },
    async match() {return {text:async()=>"url(assets/fonts/example.ttf)"};},
  };
  const {handlers}=worker({caches:{open:async()=>cache}});let work;
  handlers.install({waitUntil:p=>work=p});await work;
  assert.equal(saved.get(appPath),'current-script');
  assert.equal(saved.get('/milo/assets/fonts/example.ttf'),'current-asset');
  assert.equal(saved.has('/milo/index.html'),true);
});

