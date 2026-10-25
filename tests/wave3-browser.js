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
  async function seed(data={},query=''){
    if(frame)frame.remove();
    Object.keys(localStorage).filter(managed).forEach(k=>localStorage.removeItem(k));sessionStorage.clear();
    localStorage.setItem('milo.persist','1');Object.entries(data).forEach(([k,v])=>localStorage.setItem(k,JSON.stringify(v)));
    frame=document.createElement('iframe');frame.title='UI regression app';frame.style.cssText='width:390px;height:844px;border:0';frame.src='../index.html?'+query+'&ui-test='+Date.now();document.getElementById('preview').appendChild(frame);
    await until(()=>frame.contentWindow.__hub&&frame.contentDocument.querySelector('.seg[aria-current]'),'app did not load');await pause(150);
    return {win:frame.contentWindow,doc:frame.contentDocument};
  }
  const base={onboarded:true,route:'train',settings:{unit:'kg',sound:false,vibrate:false},history:[]};
  const active=entries=>({id:'ui-test',name:'UI test workout',startedAt:Date.now(),entries,restEndsAt:null});
  async function group(name,fn){try{await fn();}catch(e){check(false,name+': '+e.message);}}
  try{
    await group('Conditioning and goals',async()=>{
      let {win,doc}=await seed();let root=rootOf(doc,'mix');
      root.querySelector('[data-a="f-sec"][data-m="cond"]').click();
      check(!!root.querySelector('#cond-target'),'Conditioning has target and style controls on first setup');
      root.querySelector('[data-a="f-go"]').click();
      check(!/hit a problem/.test(root.textContent),'conditioning-only week renders');
      root.querySelector('[data-a="start-day"]').click();await pause(100);
      check(!!root.querySelector('[data-cond-clock]'),'planned conditioning opens the timer');
      root.querySelector('[data-a="cond-done"]').click();root.querySelector('#ca-min').value='20';root.querySelector('#cond-form').requestSubmit();await pause(150);
      let saved=JSON.parse(localStorage.getItem('trainer.together'));
      check(saved.conditioning.log.length===1&&!saved.conditioning.active,'planned session saves and closes');
      root.querySelector('[data-a="cond-log"]').click();root.querySelector('#ca-min').value='90';root.querySelector('#ca-act').value='sport';root.querySelector('#ca-rpe').value='8';root.querySelector('#ca-int').value='vigorous';root.querySelector('#cond-form').requestSubmit();await pause(150);
      saved=JSON.parse(localStorage.getItem('trainer.together'));check(saved.conditioning.log.length===2&&saved.conditioning.log[1].rpe===8,'outside sport saves minutes and effort');
      doc.querySelector('.seg[data-d="progress"]').click();doc.querySelector('[data-f="cond"]').click();
      check(root.querySelectorAll('.cond-history tbody tr').length===12,'Conditioning filter shows twelve weeks');
      doc.querySelector('[data-f="all"]').click();root.querySelector('[data-a="goal-new"]').click();
      root.querySelector('#goal-target').value='100';root.querySelector('#goal-form').requestSubmit();await pause(200);
      check(win.__hub.api('str').outcomes().length===1,'goal is saved in its owning Strength state');
      check(/Not enough sessions/.test(root.textContent),'an empty history does not invent a projected date');
      check(doc.documentElement.scrollWidth<=391,'new forms and progress fit a phone');
      saved.conditioning.log[0].date=Date.now()-8*864e5;saved.conditioning.active=null;saved.run=null;
      ({win,doc}=await seed({'trainer.together':saved,'strlog.v2':JSON.parse(localStorage.getItem('strlog.v2'))}));root=rootOf(doc,'mix');
      check(!!root.querySelector('[data-a="summary-dismiss"]'),'first visit in a new week shows a summary');
      root.querySelector('[data-a="summary-dismiss"]').click();check(!root.querySelector('[data-a="summary-dismiss"]'),'weekly summary dismisses');
    });
    await group('Old workout list',async()=>{
      const a=active([{exId:'db_row_cs',name:'Chest-Supported Dumbbell Row',target:{repLow:6,repHigh:10,rir:3,rest:180},sets:[{weight:25,reps:6,rir:1,done:true},{weight:null,reps:null,rir:null,done:false}]}]);a.startedAt=Date.now()-2238*60000;
      const {win,doc}=await seed({'hyplog.v1':{...base,settings:{sessionView:'list'},active:a}},'m=lift');const root=rootOf(doc,'lift');
      check(win.getComputedStyle(doc.querySelector('.shellbar')).display==='none','old saved list hides the global header');
      check(win.getComputedStyle(doc.querySelector('.sidebar')).display==='none','old saved list hides bottom navigation');
      check(/Open since/.test(root.querySelector('#elapsed').textContent),'old workout shows its start date instead of thousands of elapsed minutes');
      check(!!root.querySelector('.train-head [data-session="focus"]'),'Next set is grouped with workout controls');
    });
  }finally{
    if(frame)frame.remove();Object.keys(localStorage).filter(managed).forEach(k=>localStorage.removeItem(k));Object.entries(original).forEach(([k,v])=>localStorage.setItem(k,v));sessionStorage.clear();Object.entries(originalSession).forEach(([k,v])=>sessionStorage.setItem(k,v));
    result.textContent=results.join('\n')+'\n'+(failures?'FAIL '+failures+' UI regressions':'ALL TESTS PASSED');
  }
})();
