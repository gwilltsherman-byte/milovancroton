(async function(){
  'use strict';
  const result=document.getElementById('result'), results=[], managed=k=>/^(hyplog\.|strlog\.|proladder\.|trainer\.|milo\.)/.test(k);
  const original=Object.fromEntries(Object.keys(localStorage).filter(managed).map(k=>[k,localStorage.getItem(k)]));
  const originalSession=Object.fromEntries(Object.keys(sessionStorage).map(k=>[k,sessionStorage.getItem(k)]));
  let frame=null, failures=0;
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  function check(ok,msg){results.push((ok?'PASS ':'BAD ')+msg);if(!ok)failures++;result.textContent='Running…\n'+results.join('\n');}
  async function until(fn,msg){for(let i=0;i<120;i++){let v;try{v=fn();}catch(e){}if(v)return v;await pause(50);}throw Error(msg);}
  const rootOf=(doc,m)=>doc.getElementById('m-'+m).shadowRoot;
  async function seed(data={},query='',raw=false){
    if(frame)frame.remove();
    Object.keys(localStorage).filter(managed).forEach(k=>localStorage.removeItem(k));sessionStorage.clear();
    localStorage.setItem('milo.persist','1');Object.entries(data).forEach(([k,v])=>localStorage.setItem(k,raw?v:JSON.stringify(v)));
    frame=document.createElement('iframe');frame.title='UI regression app';frame.style.cssText='width:390px;height:844px;border:0';frame.src='../index.html?'+query+'&ui-test='+Date.now();document.getElementById('preview').appendChild(frame);
    await until(()=>frame.contentWindow.__hub&&frame.contentDocument.querySelector('.seg[aria-current]'),'app did not load');await pause(150);
    return {win:frame.contentWindow,doc:frame.contentDocument};
  }
  const base={onboarded:true,route:'train',settings:{unit:'kg',sound:false,vibrate:false},history:[]};
  const active=entries=>({id:'ui-test',name:'UI test workout',startedAt:Date.now(),entries,restEndsAt:null});
  async function group(name,fn){try{await fn();}catch(e){check(false,name+': '+e.message);}}
  try{
    await group('Original app migration',async()=>{
      const legacy=await (await fetch('fixtures/legacy-bd25f38.json')).json();
      const {win,doc}=await seed(legacy.data,'m=str');const sr=rootOf(doc,'str');
      check(!!sr.querySelector('.session-card'),'the original app’s unfinished Strength session resumes in focus mode');
      check(JSON.parse(localStorage.getItem('strlog.v2')).active.id===legacy.data['strlog.v2'].active.id,'legacy active session identity survives');
      check(JSON.stringify(JSON.parse(localStorage.getItem('hyplog.v1')).history)===JSON.stringify(legacy.data['hyplog.v1'].history),'legacy Muscle history survives byte-for-byte');
      sr.querySelector('[data-session="list"]').click();
      for(let i=0;i<10;i++){const b=sr.querySelector('[data-act="toggle-done"][aria-pressed="false"]');if(!b)break;b.click();await pause(30);}
      sr.querySelector('[data-act="finish"]').click();await pause(300);
      check(JSON.parse(localStorage.getItem('strlog.v2')).history.some(h=>h.id===legacy.data['strlog.v2'].active.id),'the original unfinished session can be completed');
      const sec=win.MiloSecurity,snapshot=sec.snapshot(localStorage),text=JSON.stringify({app:'milovancroton',version:1,created:new Date().toISOString(),data:snapshot});
      const locked=await sec.seal(text,'local-test-passphrase');const plain=await sec.unseal(locked,'local-test-passphrase');
      check(JSON.stringify(sec.backup(plain).data)===JSON.stringify(snapshot),'encrypted backup preserves migrated sessions');
      const csv=win.MiloData.csv({lift:JSON.parse(localStorage.getItem('hyplog.v1')),str:JSON.parse(localStorage.getItem('strlog.v2'))});
      check(csv.includes('Legacy muscle session')&&csv.includes('Legacy open strength session'),'CSV includes both migrated sessions');
      for(const dest of ['today','train','progress','library']){win.__hub.dest(dest);await pause(60);check(doc.documentElement.scrollWidth<=391,'migrated '+dest+' fits the phone');}
      win.__hub.filter('progress','str');await pause(50);rootOf(doc,'str').querySelector('[data-outcome-owner]').click();
      check(!!rootOf(doc,'mix').querySelector('#goal-form'),'a goal can start from a section-specific Progress filter');
    });
    await group('Combined day including Conditioning',async()=>{
      const ladder={v:2,onboarded:true,route:'today',settings:{unit:'kg',sound:false,vibrate:false},rung:{pull:0,row:0,core:0},placed:{pull:true,row:true,core:true},history:[],tests:[],goals:[{id:'goal-a',key:'pullup1',n:'First strict pull-up',l:'pull',r:4,std:1,sup:['row','core'],added:1,achieved:null}]};
      const tg={v:1,on:true,secs:['str','lift','cal','cond'],prio:['str','lift','cal','cond'],days:2,mins:0,offered:true,log:[],checkins:[],tuned:true};
      const {win,doc}=await seed({'trainer.together':tg,'proladder.v1':ladder});let root=rootOf(doc,'mix');
      root.querySelector('[data-a="start-day"]').click();await pause(150);
      let seen=new Set();
      for(let guard=0;guard<10;guard++){
        const run=JSON.parse(localStorage.getItem('trainer.together')).run;if(!run)break;const part=run.parts.find(p=>p.st==='run');
        if(!part){const next=run.parts.findIndex(p=>p.st==='todo');if(next<0)break;win.__hub.dest('today');root=rootOf(doc,'mix');root.querySelector('[data-a="part"][data-k="'+next+'"]').click();await pause(100);continue;}
        seen.add(part.m);
        if(part.m==='cond'){
          root=rootOf(doc,'mix');check(!!root.querySelector('[data-cond-clock]'),'Conditioning starts after all lifting parts');
          root.querySelector('[data-a="cond-back"]').click();root.querySelector('[data-a="open"][data-m="cond"]').click();
          check(!!root.querySelector('[data-cond-clock]'),'a conditioning part resumes from its day card');
          root.querySelector('[data-a="cond-done"]').click();root.querySelector('#ca-min').value='15';root.querySelector('#cond-form').requestSubmit();await pause(100);break;
        }
        const r=rootOf(doc,part.m), list=r.querySelector('[data-session="list"]');if(list)list.click();
        // Fill only sample weights; leave the displayed rep/effort targets to the real logger.
        r.querySelectorAll('input[data-field="w"],input[data-field="weight"]').forEach(x=>{if(!x.value){x.value='20';x.dispatchEvent(new win.Event('input',{bubbles:true}));x.dispatchEvent(new win.Event('change',{bubbles:true}));}});
        for(let j=0;j<100;j++){const b=r.querySelector('[data-act="toggle-done"][aria-pressed="false"]');if(!b)break;b.click();await pause(10);}
        r.querySelector('[data-act="finish"]').click();await pause(200);
        const next=r.querySelector('[data-act="tg-next"]');if(next){next.click();await pause(100);}else win.__hub.next(part.m);
      }
      check(['str','lift','cal','cond'].every(m=>seen.has(m)),'one combined day runs every selected training section');
      const saved=JSON.parse(localStorage.getItem('trainer.together'));check(saved.conditioning.log.length===1&&!saved.run,'finishing Conditioning closes the combined day');
      win.__hub.dest('progress');win.__hub.filter('progress','cond');root=rootOf(doc,'mix');
      root.querySelector('[data-a="cond-record"]').click();
      check(/Activity/.test(root.textContent)&&/15 minutes/.test(root.textContent),'a completed conditioning activity opens its own record');
      root.querySelector('[data-a="cond-back"]').click();win.__hub.filter('progress','all');root.querySelector('[data-a="goal-new"]').click();
      root.querySelector('#goal-target').value='100';root.querySelector('#goal-form').requestSubmit();
      await until(()=>JSON.parse(localStorage.getItem('strlog.v2')).outcomeGoals?.length===1,'the new goal did not save');
      const sec=win.MiloSecurity,snapshot=sec.snapshot(localStorage),text=JSON.stringify({app:'milovancroton',version:1,created:new Date().toISOString(),data:snapshot});
      const plain=await sec.unseal(await sec.seal(text,'wave-five-test'),'wave-five-test');
      // Exercise the same validation/restore path as the backup dialog, then boot the restored app.
      sec.restore(localStorage,sec.backup(plain).data);const restored=sec.snapshot(localStorage);
      const next=await seed(restored,'',true);const goals=next.win.__hub.api('str').outcomes();
      check(goals.length===1&&JSON.parse(localStorage.getItem('trainer.together')).conditioning.log[0].id===saved.conditioning.log[0].id,'encrypted restore and reload retain outcome goals and conditioning records');
      check(frame.contentDocument.documentElement.scrollWidth<=391,'combined-day review stays inside the phone');
    });
  }finally{
    if(frame)frame.remove();Object.keys(localStorage).filter(managed).forEach(k=>localStorage.removeItem(k));Object.entries(original).forEach(([k,v])=>localStorage.setItem(k,v));sessionStorage.clear();Object.entries(originalSession).forEach(([k,v])=>sessionStorage.setItem(k,v));
    result.textContent=results.join('\n')+'\n'+(failures?'FAIL '+failures+' UI regressions':'ALL TESTS PASSED');
  }
})();
