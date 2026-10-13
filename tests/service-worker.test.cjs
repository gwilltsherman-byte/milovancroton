const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
const path = require('node:path'), os = require('node:os'), crypto = require('node:crypto'), {execFileSync} = require('node:child_process');
const code=fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8');
function worker(overrides={}) {
  const handlers={},deleted=[];
  const prefix=code.match(/const PREFIX = '([^']+)'/)[1];
  const current=prefix+code.match(/const CACHE = PREFIX \+ '([^']+)'/)[1];
  vm.runInNewContext(code,{URL,Request,Set,Promise,setTimeout,
    self:{registration:{scope:'https://example.test/milo/'},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim:async()=>{}},skipWaiting:async()=>{}},
    caches:{keys:async()=>['other-app-cache','trainlog-v58','milovancroton-v58',prefix+'v58',current],delete:async k=>deleted.push(k)},
    ...overrides,
  });
  return {handlers,deleted,prefix};
}
test('activation removes only obsolete Milo caches',async()=>{
  const {handlers,deleted,prefix}=worker(); let work;
  handlers.activate({waitUntil:p=>work=p}); await work;
  assert.deepEqual(deleted,[prefix+'v58']);
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

test('installation caches the exact reviewed script versions and rejects foreign or unknown script URLs', async()=>{
  const cached = new Map(), requests = [];
  const html = '<script defer src="app.js?v=aaaaaaaaaaaaaaaaaaaa"></script>' +
    '<script defer src="security.js?v=bbbbbbbbbbbbbbbbbbbb"></script>' +
    '<script src="https://attacker.test/milo/app.js?v=foreign"></script>' +
    '<script src="../other/app.js?v=sibling"></script><script src="unknown.js?v=unknown"></script>' +
    '<script src="icon-192.png?v=not-a-script"></script>';
  const cache = {
    async addAll(items) {
      items.forEach(request=>{ requests.push(request); cached.set(request.url, request.url); });
    },
    async match(request) {
      const url = new URL(typeof request==='string'?request:request.href||request.url,'https://example.test/milo/');
      return {text:async()=>url.pathname.endsWith('index.html')?html:'url(assets/fonts/example.ttf)'};
    },
  };
  const {handlers} = worker({caches:{open:async()=>cache}}); let work;
  handlers.install({waitUntil:promise=>work=promise}); await work;
  assert.ok(cached.has('https://example.test/milo/app.js?v=aaaaaaaaaaaaaaaaaaaa'));
  assert.ok(cached.has('https://example.test/milo/security.js?v=bbbbbbbbbbbbbbbbbbbb'));
  assert.ok(cached.has('https://example.test/milo/app.js'), 'plain shell scripts remain cached');
  assert.ok(requests.every(request=>request.cache==='reload'), 'both script forms bypass the HTTP cache during installation');
  assert.equal([...cached.keys()].some(url=>/foreign|sibling|unknown|not-a-script/.test(url)), false);
});

test('a script version cannot reuse another query version or a cached unversioned script', async()=>{
  const oldURL = 'https://example.test/milo/app.js?v=old', newURL = 'https://example.test/milo/app.js?v=new';
  const cached = new Map([[oldURL,{body:'old script'}],['https://example.test/milo/app.js',{body:'unversioned old script'}]]);
  const fetched = [], response = {ok:true,type:'basic',url:newURL,body:'new script',clone(){return this;}};
  const cache = {match:async request=>cached.get(request.url),put:async(request,value)=>cached.set(request.url,value)};
  const {handlers} = worker({caches:{open:async()=>cache},fetch:async request=>{fetched.push(request.url);return response;}});
  let work;
  handlers.fetch({request:{url:newURL,method:'GET',mode:'cors'},respondWith:promise=>work=promise});
  assert.equal((await work).body,'new script');
  assert.deepEqual(fetched,[newURL]);
  assert.equal(cached.get(oldURL).body,'old script');
  assert.equal(cached.get(newURL).body,'new script');
  handlers.fetch({request:{url:newURL,method:'GET',mode:'cors'},respondWith:promise=>work=promise});
  assert.equal((await work).body,'new script', 'exact version is available offline after caching');
  assert.equal(fetched.length,1);
});

test('integrity generation versions script URLs by content and stays idempotent',()=>{
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(),'milo-integrity-'));
  try {
    fs.mkdirSync(path.join(fixture,'tools')); fs.mkdirSync(path.join(fixture,'assets/fonts'),{recursive:true});
    fs.copyFileSync(path.join(__dirname,'../tools/update-integrity.cjs'),path.join(fixture,'tools/update-integrity.cjs'));
    fs.writeFileSync(path.join(fixture,'sw.js'),code);
    fs.writeFileSync(path.join(fixture,'index.html'),'<meta charset="utf-8">\n<script defer src="security.js"></script>\n<script defer src="app.js?v=old-version"></script>\n');
    const security = 'window.fixtureSecurity=true;', app = 'window.fixtureApp=1;';
    fs.writeFileSync(path.join(fixture,'security.js'),security); fs.writeFileSync(path.join(fixture,'app.js'),app);
    for (const name of ['fonts.css','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png']) fs.writeFileSync(path.join(fixture,name),'fixture');
    const generator = path.join(fixture,'tools/update-integrity.cjs');
    const run = (...args)=>execFileSync(process.execPath,[generator,...args],{cwd:fixture,timeout:10000});
    run();
    const html = fs.readFileSync(path.join(fixture,'index.html'),'utf8');
    const digest = value=>crypto.createHash('sha256').update(value).digest();
    for (const [file,value] of [['security.js',security],['app.js',app]]) {
      assert.ok(html.includes('src="'+file+'?v='+digest(value).toString('hex').slice(0,20)+'"'));
      assert.ok(html.includes('integrity="sha256-'+digest(value).toString('base64')+'"'));
      assert.ok(html.includes("'sha256-"+digest(value).toString('base64')+"'"), 'CSP retains the reviewed source hash');
    }
    assert.ok(html.includes("script-src-attr 'none'"));
    assert.equal(html.includes("script-src 'self'"),false);
    const sw = fs.readFileSync(path.join(fixture,'sw.js'),'utf8');
    run(); run('--check');
    assert.equal(fs.readFileSync(path.join(fixture,'index.html'),'utf8'),html);
    assert.equal(fs.readFileSync(path.join(fixture,'sw.js'),'utf8'),sw);
    fs.writeFileSync(path.join(fixture,'app.js'),'window.fixtureApp=2;');
    run(); run('--check');
    assert.notEqual(fs.readFileSync(path.join(fixture,'index.html'),'utf8'),html, 'changed content changes the script URL');
  } finally {fs.rmSync(fixture,{recursive:true,force:true});}
});

