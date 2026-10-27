// Reopening must not paint the wrong theme or briefly expose the normal shell over a saved workout.
// Disposable server/browser storage only. Delay assets to make the intermediate paint observable.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
const repo=path.resolve(__dirname,'../../..');
let checks=0;
const check=(ok,label)=>{assert.ok(ok,label);console.log('PASS '+label);checks++;};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html',file=path.resolve(repo,name);
  if(!file.startsWith(repo+path.sep)){res.writeHead(403).end();return;}
  const send=()=>{try{
    const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.ttf':'font/ttf','.woff2':'font/woff2'}[path.extname(name)]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(fs.readFileSync(file));
  }catch(e){res.writeHead(404).end();}};
  if(name==='app.js'||name==='trainer.css')setTimeout(send,450);else send();
});
(async()=>{
  let browser;
  try{
    await new Promise(r=>server.listen(0,'127.0.0.1',r));
    browser=await chromium.launch();
    const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'light',serviceWorkers:'block'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const workout={v:1,onboarded:true,route:'train',settings:{theme:'dark',sessionView:'list',unit:'kg',sound:false,vibrate:false},history:[],active:{id:'reopen-test',name:'Together · Day 2',startedAt:Date.now()-20*3600e3,restEndsAt:null,entries:[{exId:'rear-delt-row',name:'Rear-Delt Dumbbell Row',primary:['rdelt'],secondary:['uback'],equipment:'Dumbbell',target:{repLow:6,repHigh:10,rir:3,rest:180},sets:[{type:'work',weight:20,reps:8,rir:3,done:true},{type:'work',weight:null,reps:null,rir:3,done:false}]}]}};
    await context.addInitScript(value=>{
      if(!localStorage.getItem('reopen-seeded')){
        localStorage.setItem('reopen-seeded','1');localStorage.setItem('hyplog.v1',JSON.stringify(value));
        localStorage.setItem('trainer.shell.mod','lift');localStorage.setItem('trainer.shell.theme','dark');localStorage.setItem('milo.persist','1');
      }
      window.reopenFrames=[];
      const frame=()=>{
        const b=document.body;
        if(b){const s=getComputedStyle(b),root=document.getElementById('m-lift')?.shadowRoot,bar=document.querySelector('.shellbar'),own=root?.querySelector('.appbar');
          window.reopenFrames.push({visible:s.visibility!=='hidden'&&s.opacity!=='0',bg:s.backgroundColor,
            chrome:!!bar&&getComputedStyle(bar).display!=='none',own:!!own&&getComputedStyle(own).display!=='none'});}
        if(window.reopenFrames.length<240)requestAnimationFrame(frame);
      };requestAnimationFrame(frame);
    },workout);
    const url='http://127.0.0.1:'+server.address().port+'/index.html';
    for(const round of ['open','reopen']){
      await page.goto(url);
      await page.waitForFunction(()=>{const r=document.getElementById('m-lift')?.shadowRoot;return r?.querySelector('.train-head')&&getComputedStyle(r.querySelector('.appbar')).display==='none'&&getComputedStyle(document.body).visibility!=='hidden';});
      await page.waitForTimeout(100);
      const frames=await page.evaluate(()=>window.reopenFrames.filter(f=>f.visible));
      console.log('Observed '+round+': '+JSON.stringify({frames:frames.length,wrongTheme:frames.filter(f=>f.bg!=='rgb(23, 27, 31)').length,shellFrames:frames.filter(f=>f.chrome||f.own).length}));
      check(frames.length>0,round+' paints the saved session');
      check(frames.every(f=>f.bg==='rgb(23, 27, 31)'),round+' never paints the wrong saved theme');
      check(frames.every(f=>!f.chrome&&!f.own),round+' never paints transient navigation or trainer headers');
      const a=await page.evaluate(()=>JSON.parse(localStorage.getItem('hyplog.v1')).active);
      check(a.id===workout.active.id&&a.entries[0].sets[0].weight===20&&a.entries[0].sets[0].done,round+' keeps the unfinished workout and logged sets');
    }
    check(!errors.length,'reopening has no page errors');
    console.log('ALL '+checks+' STARTUP CHECKS PASSED');
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
