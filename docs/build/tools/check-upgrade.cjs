// A real cache-first worker from the previous release must not retain stale layout CSS.
// Run only against a disposable local origin and browser context; never user storage.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
const repo=path.resolve(__dirname,'../../..');
const read=name=>fs.readFileSync(path.join(repo,name));
let release='old',allowWorkerUpdate=false,checks=0;
const check=(ok,label)=>{assert.ok(ok,label);console.log('PASS '+label);checks++;};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),name=decodeURIComponent(url.pathname).slice(1)||'index.html';
  const file=path.resolve(repo,name);
  if(!file.startsWith(repo+path.sep)){res.writeHead(403).end();return;}
  try{
    let body;
    if(name==='sw.js'&&!allowWorkerUpdate)body=read('tests/fixtures/pre-style-version-sw.js');
    else if(name==='index.html'&&release==='old')body=read(name).toString().replace(/((?:fonts|shell|trainer)\.css)\?v=[a-f0-9]+/g,'$1');
    else if(release==='old'&&['shell.css','trainer.css'].includes(name))body=read('tests/fixtures/pre-safe-area-'+name);
    else body=fs.readFileSync(file);
    const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.ttf':'font/ttf','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'}[path.extname(name)]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);
  }catch(e){res.writeHead(404).end();}
});
(async()=>{
 let browser;
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch();const context=await browser.newContext({viewport:{width:430,height:932}}),page=await context.newPage();
  const workout={v:1,onboarded:true,route:'train',settings:{sessionView:'list',unit:'kg',sound:false,vibrate:false},history:[],active:{id:'upgrade-unfinished',name:'Together · Day 2',startedAt:Date.now(),restEndsAt:null,entries:[{exId:'db_row_cs',name:'Chest-Supported Dumbbell Row',target:{repLow:6,repHigh:10,rir:3,rest:180},sets:[{weight:25,reps:6,rir:1,done:true},{weight:25,reps:null,rir:null,done:false}]}]}};
  // Seed once; subsequent navigations must preserve the actual persisted workout.
  await page.goto(origin+'/favicon.svg');
  await page.evaluate(value=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('hyplog.v1',JSON.stringify(value));localStorage.setItem('milo.persist','1');},workout);
  const load=async()=>{await page.goto(origin+'/index.html?m=lift');await page.locator('#m-lift .train-head').waitFor();await page.evaluate(()=>document.documentElement.style.setProperty('--shell-safe-top','59px'));await page.waitForTimeout(200);};
  await load();await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await load();
  check(await page.locator('#m-lift .appbar').isVisible(),'cached pre-fix CSS reproduces the duplicate heading');
  const oldCache=await page.evaluate(async()=>{const keys=await caches.keys();return keys.find(k=>k.startsWith('milo-app-'));});
  check(!!oldCache,'a real previous-release offline cache controls the app');
  release='new';await load();
  check(await page.locator('#m-lift .appbar').isHidden(),'fresh HTML gets corrected trainer CSS while the old worker still controls it');
  check((await page.locator('#m-lift .train-head').boundingBox()).y>=59,'fresh shell CSS reserves the iPhone status area');
  check(await page.evaluate(async old=>(await caches.keys()).includes(old),oldCache),'the successful upgrade did not require worker replacement');
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hyplog.v1')).active);
  let active=await saved();check(active.id===workout.active.id&&active.entries[0].sets[0].weight===25&&active.entries[0].sets[0].done,'unfinished workout and logged sets survive the update');
  await context.setOffline(true);await load();
  check(await page.locator('#m-lift .appbar').isHidden()&&(await page.locator('#m-lift .train-head').boundingBox()).y>=59,'the updated layout also reloads offline under the older worker');
  await context.setOffline(false);allowWorkerUpdate=true;
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await page.waitForFunction(async old=>!(await caches.keys()).includes(old),oldCache,{timeout:30000});
  const cssURLs=[...read('index.html').toString().matchAll(/href="([^" ]+\.css\?v=[a-f0-9]+)"/g)].map(m=>m[1]);
  check(await page.evaluate(async urls=>{const keys=await caches.keys(),c=await caches.open(keys.find(k=>k.startsWith('milo-app-')));return (await Promise.all(urls.map(u=>c.match(new URL(u,location.href))))).every(Boolean);},cssURLs),'the new worker precaches every exact stylesheet version, including templates');
  await context.setOffline(true);await load();active=await saved();
  check(await page.locator('#m-lift .appbar').isHidden()&&active.id===workout.active.id,'the replacement worker preserves the corrected offline layout and active workout');
  console.log('ALL '+checks+' UPGRADE CHECKS PASSED');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
