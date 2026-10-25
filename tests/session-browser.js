(async function(){
  'use strict';
  const result=document.getElementById('result'), results=[], keys=/^(hyplog\.|strlog\.|proladder\.|trainer\.|milo\.)/;
  const original=Object.fromEntries(Object.keys(localStorage).filter(k=>keys.test(k)).map(k=>[k,localStorage.getItem(k)]));
  const originalSession=Object.fromEntries(Object.keys(sessionStorage).map(k=>[k,sessionStorage.getItem(k)]));
  let frame=null;
  const pause=ms=>new Promise(r=>setTimeout(r,ms)), check=(ok,msg)=>{if(!ok)throw Error(msg);results.push('PASS '+msg);result.textContent=results.join('\n');};
  async function until(fn,msg){for(let i=0;i<150;i++){let v;try{v=fn();}catch(e){}if(v)return v;await pause(50);}throw Error(msg);}
  async function seed(m,data){
    if(frame){frame.remove();frame=null;}
    Object.keys(localStorage).filter(k=>keys.test(k)).forEach(k=>localStorage.removeItem(k));sessionStorage.clear();
    localStorage.setItem('milo.persist','1');localStorage.setItem({lift:'hyplog.v1',str:'strlog.v2',cal:'proladder.v1'}[m],JSON.stringify(data));
    frame=document.createElement('iframe');frame.title='Workout session under test';frame.style.cssText='width:390px;height:844px;border:0';frame.src='../index.html?m='+m+'&session-test='+Date.now();document.getElementById('preview').appendChild(frame);
    const root=await until(()=>frame.contentDocument.getElementById('m-'+m)?.shadowRoot?.querySelector('.session-card')&&frame.contentDocument.getElementById('m-'+m).shadowRoot,'focus card did not load');
    return {root,win:frame.contentWindow,doc:frame.contentDocument};
  }
  const base={onboarded:true,route:'train',settings:{unit:'kg',sound:false,vibrate:false},history:[]};
  const active=(entries)=>({id:'session-focus-test',name:'Test workout',startedAt:Date.now(),restEndsAt:null,restDur:0,restDuration:0,entries});
  const entry={exId:'bench',name:'Bench Press',equipment:'Barbell',primary:['chest'],secondary:['tri'],target:{repLow:8,repHigh:10,rir:2,rest:120},sets:[{type:'work',weight:40,reps:null,rir:null,done:false},{type:'work',weight:40,reps:null,rir:null,done:false}]};
  try{
    let {root,win,doc}=await seed('lift',{...base,v:1,exercises:[],mesos:[],bodylog:[],active:active([entry])});
    check(root.querySelector('.session-card h2').textContent==='Bench Press','Muscle starts in next-set mode');
    check(root.querySelector('[data-field="reps"]').value==='8','Muscle shows the reps it will log');
    root.querySelector('[data-session="done"]').click();await pause(250);
    let saved=JSON.parse(localStorage.getItem('hyplog.v1'));
    check(saved.active.entries[0].sets[0].done&&saved.active.entries[0].sets[0].reps===8&&saved.active.entries[0].sets[0].assumed,'Muscle one-tap logging retains assumed reps');
    check(!root.querySelector('.session-rest').hidden&&root.querySelector('.session-card').hidden,'rest takes the place of the set card');
    check(root.activeElement?.dataset.session==='add','focus moves to rest controls');
    root.querySelector('[data-session="skip"]').click();await pause(250);
    check(!root.querySelector('.session-card').hidden&&root.querySelector('.session-count').textContent.includes('Set 2'),'skipping rest opens the next set');
    check(root.activeElement?.dataset.field==='weight','focus moves to the next set’s first input');
    root.querySelector('[data-session="list"]').click();await pause(250);
    check(root.querySelectorAll('[data-act="toggle-done"]').length===2&&root.querySelector('[data-act="toggle-done"]').getAttribute('aria-pressed')==='true','List keeps both editable sets and announces logged state');
    check(JSON.parse(localStorage.getItem('hyplog.v1')).settings.sessionView==='list','the chosen view is saved');
    for(const width of [390,195]){frame.style.width=width+'px';await pause(250);check(doc.documentElement.scrollWidth<=width+1,'Muscle list has no horizontal scrolling at '+width+' px');}
    root.querySelector('[data-session="focus"]').click();await pause(250);frame.style.width='195px';await pause(250);
    check(doc.documentElement.scrollWidth<=196,'Muscle focus fits a 195 px viewport');
    check([...root.querySelectorAll('.session-step input')].every(i=>i.getBoundingClientRect().width>=44),'zoomed focus inputs stay usable');
    root.querySelector('[data-session="list"]').click();
    root.querySelector('[data-act="toggle-done"][data-set="1"]').click();await pause(250);
    check(root.activeElement!==doc.body,'logging in List retains focus');
    ({root,win,doc}=await seed('str',{...base,v:2,active:active([{liftId:'bench',sets:[{kind:'work',w:40,reps:null,tr:5,trpe:8,done:false},{kind:'work',w:40,reps:null,tr:5,trpe:8,done:false}]}])}));
    check(root.querySelector('[data-field="w"]').getAttribute('aria-label')==='Set 1 weight','Strength set fields name their set');
    const inc=root.querySelector('[data-field="w"]').parentElement.querySelector('[data-step]:last-child');inc.click();await pause(250);
    check(JSON.parse(localStorage.getItem('strlog.v2')).active.entries[0].sets[0].w===42.5,'Strength weight stepper uses the available kit jump');
    root.querySelector('[data-session="done"]').click();await pause(250);saved=JSON.parse(localStorage.getItem('strlog.v2'));
    check(saved.active.entries[0].sets[0].done&&saved.active.entries[0].sets[0].rpe===8&&saved.active.entries[0].sets[0].ra,'Strength logs the untouched effort target as assumed');
    root.querySelector('[data-session="skip"]').click();
    const effort=root.querySelector('[data-field="rpe"]'); effort.value='10'; effort.dispatchEvent(new win.Event('input',{bubbles:true}));
    effort.parentElement.querySelector('[data-step]:last-child').click(); await pause(250);
    check(root.querySelector('[data-field="rpe"]').value==='10','the effort stepper stops at RPE 10');
    root.querySelector('[data-session="list"]').click();await pause(50);
    frame.style.width='195px';await pause(250);check(doc.documentElement.scrollWidth<=196,'Strength list fits 195 px');
    ({root,win,doc}=await seed('cal',{...base,v:2,rung:{legs:5},placed:{legs:true},tests:[],goals:[],active:active([{ladderId:'legs',stepIdx:5,kind:'reps',target:5,setup:{},clean:true,sets:[{v:null,done:false},{v:null,done:false}]}])}));
    check(root.querySelector('.session-count').textContent.includes('Left')&&!root.querySelector('[data-field="r"]'),'Ladder presents the left side first');
    root.querySelector('[data-session="done"]').click();await pause(250);saved=JSON.parse(localStorage.getItem('proladder.v1'));
    check(saved.active.entries[0].sets[0].lr[0]===5&&!saved.active.entries[0].sets[0].done&&root.querySelector('.session-count').textContent.includes('Right'),'left-side completion advances without logging both sides');
    const right=root.querySelector('[data-field="r"]');right.value='3';right.dispatchEvent(new win.Event('input',{bubbles:true}));root.querySelector('[data-session="done"]').click();await pause(250);saved=JSON.parse(localStorage.getItem('proladder.v1'));
    check(saved.active.entries[0].sets[0].done&&saved.active.entries[0].sets[0].v===3,'Ladder logs the weaker side after both sides');
    root.querySelector('[data-session="skip"]').click();root.querySelector('[data-session="list"]').click();frame.style.width='195px';await pause(250);check(doc.documentElement.scrollWidth<=196,'Ladder list fits 195 px');
    win.MiloSession.restOver(root);await pause(50);check(root.querySelector('[role="status"][data-rest-status]').textContent==='Rest over','rest completion is announced to assistive technology');
    ({root,win,doc}=await seed('cal',{...base,v:2,rung:{pull:0},placed:{pull:true},tests:[],goals:[],active:active([{ladderId:'pull',stepIdx:0,kind:'hold',target:5,setup:{},clean:true,sets:[{v:null,done:false},{v:null,done:false}]}])}));
    root.querySelector('[data-act="hold-go"]').click(); await pause(1100);
    check(Number(root.querySelector('[data-hold-live]').value)>=1,'a hold timer runs inside the focus card');
    root.querySelector('[data-session="done"]').click(); await pause(250);
    saved=JSON.parse(localStorage.getItem('proladder.v1'));
    check(saved.active.entries[0].sets[0].done&&saved.active.entries[0].sets[0].v>=1&&saved.active.entries[0].sets[0].v<5,'stopping a hold logs its measured seconds');

    ({root,win,doc}=await seed('lift',{...base,v:1,exercises:[],mesos:[],bodylog:[],active:active([{...entry,sg:'pair'},{...entry,sg:'pair',exId:'partner',name:'Partner row'}])}));
    const weight=root.querySelector('[data-field="weight"]'), shown=Number(root.querySelector('[data-field="reps"]').value);
    weight.value='50';weight.dispatchEvent(new win.Event('input',{bubbles:true}));
    root.querySelector('[data-session="done"]').click();await pause(250);saved=JSON.parse(localStorage.getItem('hyplog.v1'));
    check(saved.active.entries[0].sets[0].reps===shown&&saved.active.entries[0].sets[0].assumed,'changing weight still logs the untouched reps shown on the card');
    check(saved.active.restDuration===20||saved.active.restDur===20,'supersets keep the short transition rest');
    root.querySelector('[data-session="skip"]').click();await pause(150);
    check(root.querySelector('.session-card h2').textContent==='Partner row','the focus card alternates exercises in a superset');
    result.textContent=results.join('\n')+'\nALL TESTS PASSED';
  }catch(e){result.textContent=results.join('\n')+'\nFAIL '+e.stack;}
  finally{if(frame)frame.remove();Object.keys(localStorage).filter(k=>keys.test(k)).forEach(k=>localStorage.removeItem(k));Object.entries(original).forEach(([k,v])=>localStorage.setItem(k,v));sessionStorage.clear();Object.entries(originalSession).forEach(([k,v])=>sessionStorage.setItem(k,v));}
})();
