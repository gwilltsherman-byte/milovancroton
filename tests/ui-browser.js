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
    await group('Fresh combined workout',async()=>{
      const {win,doc}=await seed();let root=rootOf(doc,'mix');
      for(const m of ['str','lift'])root.querySelector('[data-a="f-sec"][data-m="'+m+'"]').click();
      root.querySelector('[data-a="f-go"]').click();root.querySelector('[data-a="start-day"]').click();root.querySelector('[data-a="o-skip"]').click();await pause(250);
      root=rootOf(doc,'str');
      check(win.__hub.current()==='str'&&!!root.querySelector('.session-card'),'a fresh combined day opens the next-set card');
      check(win.getComputedStyle(doc.querySelector('.shellbar')).display==='none'&&win.getComputedStyle(doc.querySelector('.sidebar')).display==='none','starting from Together immediately hides the shell in focus mode');
      check(win.getComputedStyle(doc.getElementById('tgstrip')).display==='none','starting from Together folds the day strip into the focus header');
      check(/Day 1 · Strength/.test(root.querySelector('[data-session-day]').textContent),'the focus header separates day and program names');
      root.querySelector('[data-session="list"]').click();await pause(50);
      check(win.getComputedStyle(doc.querySelector('.sidebar')).display!=='none','List restores the main navigation');
      for(const width of [390,360]){
        frame.style.width=width+'px';await pause(60);
        const row=root.querySelector('.setrow'), idx=row.querySelector('.sidx').getBoundingClientRect(), weight=row.querySelector('[data-field="w"]').getBoundingClientRect();
        check(idx.right+7<=weight.left,'Strength set numbers do not overlap their weight fields at '+width+' px');
      }
      root.querySelector('[data-session="focus"]').click();doc.querySelector('.seg[data-d="today"]').click();await pause(150);
      check(!doc.documentElement.classList.contains('session-focus-active')&&!doc.documentElement.classList.contains('focus-mode'),'leaving a focus session clears both focus layout flags');
    });
    await group('Effort controls',async()=>{
      const {doc,win}=await seed({'strlog.v2':{...base,v:2,active:active([{liftId:'bench',sets:[{kind:'work',w:40,reps:null,tr:5,trpe:8,done:false},{kind:'work',w:40,reps:null,tr:5,trpe:8,done:false}]}])}},'m=str');
      const root=rootOf(doc,'str'), input=root.querySelector('[data-field="rpe"]');
      input.value='9';input.dispatchEvent(new win.Event('input',{bubbles:true}));
      check(root.querySelector('[data-session="effort"][aria-pressed="true"]')?.dataset.v==='9','typing effort updates the selected effort chip');
      input.parentElement.querySelector('[data-step]:last-child').click();
      check(!root.querySelector('[data-session="effort"][aria-pressed="true"]'),'a half-step effort does not leave a whole-number chip selected');
      input.value='';input.dispatchEvent(new win.Event('input',{bubbles:true}));
      check(!root.querySelector('[data-session="effort"][aria-pressed="true"]'),'clearing effort clears the chip selection');
      root.querySelector('[data-session="effort"][data-v="7"]').click();
      check(root.querySelector('[data-field="rpe"]').value==='7','tapping an effort chip updates its input');
      check(/weight \(kg\)/i.test(root.querySelector('[data-field="w"]').closest('label').textContent),'a filled weight retains a visible unit label');
      root.querySelector('[data-session="list"]').click();root.querySelector('[data-session="focus"]').click();
      const rpe=root.querySelector('[data-field="rpe"]');rpe.value='';rpe.dispatchEvent(new win.Event('input',{bubbles:true}));
      const rp=root.querySelector('[data-field="reps"]');rp.value='3';rp.dispatchEvent(new win.Event('input',{bubbles:true}));
      check(root.querySelector('[data-field="rpe"]').placeholder==='10','untouched effort shows the value that a short set will actually save');
    });
    await group('Set descriptions',async()=>{
      let {doc}=await seed({'strlog.v2':{...base,v:2,active:active([{liftId:'bench',sets:[{kind:'warm',w:20,reps:8,tr:8,done:false},{kind:'plus',w:40,reps:null,tr:5,trpe:null,done:false}]}])}},'m=str');
      let root=rootOf(doc,'str');
      check(/Warm-up 1 of 1/.test(root.querySelector('.session-count').textContent),'warm-ups are explicitly labelled and counted separately');
      root.querySelector('[data-session="done"]').click();root.querySelector('[data-session="skip"]').click();
      check(/5\+ reps/.test(root.querySelector('.session-target').textContent),'plus sets keep their plus-reps instruction in focus mode');
      check(/Set 1 of 1/.test(root.querySelector('.session-count').textContent),'working-set counts exclude warm-ups');
      const entry={exId:'bench',name:'Bench Press',equipment:'Barbell',primary:['chest'],secondary:['tri'],target:{repLow:8,repHigh:12,rir:2,rest:120},sets:[{type:'warmup',weight:20,reps:5,done:false},{type:'work',weight:40,reps:null,done:false}]};
      ({doc}=await seed({'hyplog.v1':{...base,v:1,exercises:[],mesos:[],bodylog:[],active:active([entry])}},'m=lift'));root=rootOf(doc,'lift');
      check(/Warm-up/.test(root.querySelector('.session-count').textContent)&&/^5 reps/.test(root.querySelector('.session-target').textContent),'Muscle warm-ups show their own reps instead of the working-set target');
      check(!root.querySelector('.session-card [data-field="rir"]'),'Muscle warm-ups do not ask for working-set effort');
    });
    await group('Phone layout',async()=>{
      let {doc,win}=await seed({'strlog.v2':{...base,v:2,active:active([{liftId:'bench',sets:[{kind:'work',w:420,reps:5,tr:5,trpe:8,done:false}]}])}},'m=str');let root=rootOf(doc,'str');
      frame.style.width='195px';await pause(100);
      check([...root.querySelectorAll('.session-plate')].every(p=>p.getBoundingClientRect().right<=win.innerWidth),'a heavily loaded bar does not push plate graphics outside a zoomed phone viewport');
      check(doc.documentElement.scrollWidth<=196,'heavy-load focus mode has no horizontal page scrolling at 195 px');
      root.querySelector('[data-session="list"]').click();await pause(100);
      check([...root.querySelectorAll('.setrow input')].every(el=>el.getBoundingClientRect().width>=44),'zoomed List inputs retain usable widths');
    });
    await group('Navigation layout',async()=>{
      const {doc,win}=await seed();
      for(const width of [1440,768,390,360,195]){
        frame.style.width=width+'px';await pause(60);
        for(const dest of ['today','train','progress','library']){
          doc.querySelector('.seg[data-d="'+dest+'"]').click();await pause(80);
          const filters=dest==='progress'||dest==='library'?['all','lift','str','cal']:[];
          if(!filters.length)check(doc.documentElement.scrollWidth<=width+1,dest+' fits '+width+' px');
          for(const f of filters){
            doc.querySelector('#subchips [data-f="'+f+'"]').click();await pause(80);
            check(doc.documentElement.scrollWidth<=width+1,dest+' / '+f+' fits '+width+' px');
          }
        }
      }
      frame.style.width='390px';doc.querySelector('.seg[data-d="today"]').click();
      doc.getElementById('setbtn').click();
      doc.querySelector('[data-s="type"][data-v="str"]').click();doc.getElementById('bk-done').click();await pause(100);
      check(win.__hub.current()==='str','changing the program on Today immediately shows the chosen program');
    });
    await group('Desktop focus dialog',async()=>{
      const {doc}=await seed({'proladder.v1':{...base,v:2,rung:{legs:5},placed:{legs:true},tests:[],goals:[],active:active([{ladderId:'legs',stepIdx:5,kind:'reps',target:5,setup:{},clean:true,sets:[{v:null,done:false}]}])}},'m=cal');
      frame.style.width='1440px';await pause(80);const root=rootOf(doc,'cal');
      root.querySelector('[data-act="ex-menu"]').click();await pause(350);
      const sheet=root.querySelector('.sheet.on').getBoundingClientRect();
      check(Math.abs((sheet.left+sheet.right)/2-720)<2,'a dialog in desktop focus mode is centered without reserving the hidden sidebar');
    });
  }finally{
    if(frame)frame.remove();Object.keys(localStorage).filter(managed).forEach(k=>localStorage.removeItem(k));Object.entries(original).forEach(([k,v])=>localStorage.setItem(k,v));sessionStorage.clear();Object.entries(originalSession).forEach(([k,v])=>sessionStorage.setItem(k,v));
    result.textContent=results.join('\n')+'\n'+(failures?'FAIL '+failures+' UI regressions':'ALL TESTS PASSED');
  }
})();
