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
      root.querySelector('[data-a="f-unit"][data-v="kg"]').click();root.querySelector('[data-a="f-go"]').click();root.querySelector('[data-a="start-day"]').click();await pause(250);
      root=rootOf(doc,'str');
      check(win.__hub.current()==='str'&&!!root.querySelector('.session-card'),'a fresh combined day opens the next-set card');
      check(win.getComputedStyle(doc.querySelector('.shellbar')).display==='none'&&win.getComputedStyle(doc.querySelector('.sidebar')).display!=='none','starting from Together hides the header in focus mode and keeps the navigation');
      check(win.getComputedStyle(doc.getElementById('tgstrip')).display==='none','starting from Together folds the day strip into the focus header');
      check(/Day 1\s·\sStrength\s\+\sMuscle/.test(root.querySelector('[data-session-day]').textContent),'the focus header separates day and program names');
      root.querySelector('[data-session="list"]').click();await pause(50);
      check(win.getComputedStyle(doc.querySelector('.sidebar')).display!=='none'&&root.querySelector('.session-views [data-session="focus"]')&&root.querySelector('.session-views [aria-pressed="true"]').textContent==='All sets','List keeps the navigation and shows both views side by side');
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
    await group('Exercise targets are set for you',async()=>{
      const entry={exId:'db_row_cs',name:'Chest-Supported Dumbbell Row',target:{repLow:6,repHigh:10,rir:3,rest:180},sets:[{weight:25,reps:6,rir:1,done:true},{weight:25,reps:null,done:false}]};
      const {doc}=await seed({'hyplog.v1':{...base,v:1,settings:{...base.settings,sessionView:'list'},active:active([entry,{...entry,exId:'plank',name:'Plank',target:{repLow:30,repHigh:60,rir:0,rest:90}}])}},'m=lift');
      const root=rootOf(doc,'lift'),targets=root.querySelector('.exercise-targets');
      check(/6–10 reps.*3 RIR.*3 min rest/.test(targets.textContent),'exercise targets show as a compact readable summary');
      check(/30–60 s hold.*0 RIR.*90 s rest/.test(root.querySelectorAll('.target-summary')[1].textContent),'hold seconds, zero RIR and partial-minute rests retain their meaning');
      check(!root.querySelector('[data-field="tRepLow"],[data-field="tRepHigh"],[data-field="tRir"],[data-field="tRest"]')&&!targets.querySelector('input,summary,button'),'rep range, reps in reserve and rest cannot be edited');
      for(const width of [1440,430,390,320,195]){
        frame.style.width=width+'px';await pause(60);
        check(doc.documentElement.scrollWidth<=width+1&&targets.getBoundingClientRect().right<=width,'the targets fit at '+width+' px');
      }
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
    await group('Compact session context',async()=>{
      const a=active([{exId:'rear-delt-row',name:'Rear-Delt Dumbbell Row',primary:['rdelt','uback'],secondary:['bi'],equipment:'Dumbbell',target:{repLow:6,repHigh:10,rir:3,rest:180},sets:[{type:'work',weight:null,reps:null,rir:3,done:false},{type:'work',weight:null,reps:null,rir:3,done:false}]}]);
      a.name='Together · Day 2';a.readiness={flag:'ok',text:'Recovery looks good. Train as planned.'};
      let {win,doc}=await seed({'hyplog.v1':{...base,v:1,settings:{...base.settings,sessionView:'list'},active:a}},'m=lift');let root=rootOf(doc,'lift');
      doc.documentElement.style.setProperty('--shell-safe-top','59px');
      check(!root.querySelector('.session-prep').open,'routine recovery and warm-up share one closed disclosure');
      const timeNode=root.querySelector('#elapsed .session-when'),countNode=root.querySelector('#elapsed .session-tally');
      check(timeNode&&countNode&&/0 sets/.test(countNode.textContent),'session time and set count are separate readable text groups');
      await pause(1100);
      check(root.querySelector('#elapsed .session-when')===timeNode&&root.querySelector('#elapsed .session-tally')===countNode,'timer ticks update text without rebuilding the status line');
      check(root.querySelector('.excard .setrow').getBoundingClientRect().bottom<844,'the first logging row stays within the phone viewport with an iPhone safe area');
      const tools=root.querySelector('.session-tools'), next=tools.querySelector('[data-session="focus"]'), note=tools.querySelector('[data-act="session-note"]');
      check(next&&note&&Math.abs(next.getBoundingClientRect().top-note.getBoundingClientRect().top)<2,'Next set and Session note share one utility row');
      check([...tools.querySelectorAll('button')].every(b=>b.getBoundingClientRect().height>=44),'compact session tools keep 44px touch targets');
      root.querySelector('.session-prep>summary').click();
      check(root.querySelector('.session-prep').open&&root.querySelector('.warmline').getClientRects().length,'expanding prep reveals the original warm-up guidance');
      const readiness=root.querySelector('[data-act="open-readiness"]');readiness.focus();
      check(readiness.tagName==='BUTTON'&&root.activeElement===readiness,'readiness is a keyboard-focusable button');
      readiness.click();check(/Readiness check/.test(root.querySelector('#modal-root').textContent),'readiness still opens its editor');
      root.querySelector('[data-act="readi"][data-f="sleep"][data-v="good"]').click();root.querySelector('[data-act="readi-done"]').click();await pause(180);
      check(JSON.parse(localStorage.getItem('hyplog.v1')).active.readiness.sleep==='good','the compact readiness control still saves the answer');
      root.querySelector('.session-tools [data-act="session-note"]').click();root.querySelector('[data-field="note-text"]').value='Training note retained';root.querySelector('[data-act="save-note"]').click();await pause(180);
      check(JSON.parse(localStorage.getItem('hyplog.v1')).active.note==='Training note retained'&&!root.querySelector('.session-prep [data-act="session-note"]'),'a saved session note remains visible outside prep');
      root.querySelector('.session-prep>summary').click();root.querySelector('[data-act="warm-hide"]').click();await pause(180);
      check(!root.querySelector('.warmline')&&JSON.parse(localStorage.getItem('hyplog.v1')).active.warmSeen,'warm-up dismissal still persists');
      root.querySelector('[data-session="focus"]').click();check(!!root.querySelector('.session-card'),'Next set still opens the focused logger');
      root.querySelector('[data-session="list"]').click();check(!!root.querySelector('.session-tools'),'List restores the compact session controls');
      const input=root.querySelector('input[data-field="weight"]');input.value='20';input.dispatchEvent(new win.Event('input',{bubbles:true}));
      root.querySelector('[data-act="toggle-done"]').click();await pause(180);
      const stored=JSON.parse(localStorage.getItem('hyplog.v1')).active;
      check(stored.entries[0].sets[0].done&&stored.entries[0].sets[0].weight===20&&stored.note==='Training note retained','set logging and saved notes survive the new grouping');
      a.name='Together · Day 2 · Upper-body pulling and shoulder accessories';a.readiness={flag:'low',text:'Recovery looks low today. Consider adding a rep of RIR.'};
      a.trim={cuts:[{name:'Rear-Delt Dumbbell Row',from:3,to:2,why:'your check-in'}]};
      ({win,doc}=await seed({'hyplog.v1':{...base,v:1,settings:{...base.settings,sessionView:'list'},active:a}},'m=lift'));root=rootOf(doc,'lift');
      check(root.querySelector('.session-prep').open&&root.querySelector('.session-readiness.warn').getClientRects().length,'low-recovery advice is expanded by default');
      check(root.querySelector('[data-act="trim-undo"]')&&!root.querySelector('.session-prep [data-act="trim-undo"]'),'Together training adjustments and Put back stay outside the disclosure');
      for(const width of [1440,768,430,390,320,195]){
        frame.style.width=width+'px';await pause(60);win.scrollTo(0,0);
        check(doc.documentElement.scrollWidth<=width+1,'long session names and open prep fit '+width+'px');
      }
      frame.style.width='1440px';await pause(60);
      check(Math.abs(root.querySelector('.session-prep').getBoundingClientRect().right-root.querySelector('.excard').getBoundingClientRect().right)<2,'desktop prep aligns with the exercise column');
    });
    await group('Installed iPhone session safe area',async()=>{
      const fixtures=[
        ['lift','hyplog.v1',{...base,v:1,active:active([{exId:'db_row_cs',name:'Chest-Supported Dumbbell Row',target:{repLow:6,repHigh:10,rir:3,rest:180},sets:[{weight:25,reps:6,rir:1,done:true},{weight:25,reps:null,rir:null,done:false}]}])}],
        ['str','strlog.v2',{...base,v:2,active:active([{liftId:'bench',sets:[{kind:'work',w:40,reps:null,tr:5,trpe:8,done:false}]}])}],
        ['cal','proladder.v1',{...base,v:2,rung:{legs:5},placed:{legs:true},tests:[],goals:[],active:active([{ladderId:'legs',stepIdx:5,kind:'reps',target:5,setup:{},clean:true,sets:[{v:null,done:false}]}])}]
      ];
      for(const [m,key,data] of fixtures){
        const {win,doc}=await seed({[key]:data},'m='+m),root=rootOf(doc,m);
        // Chromium has no device notch. Override the production inset token, as the shell tests do.
        doc.documentElement.style.setProperty('--shell-safe-top','59px');
        for(const view of ['focus','list']){
          if(view==='list')root.querySelector('[data-session="list"]').click();
          for(const width of [430,390,195]){
            frame.style.width=width+'px';await pause(60);win.scrollTo(0,0);
            const head=root.querySelector(view==='focus'?'.session-top':'.train-head');
            check(win.getComputedStyle(root.querySelector('.appbar')).display==='none',m+' '+view+' hides its duplicate section header at '+width+'px');
            check(head&&head.getBoundingClientRect().top>=59&&[...head.querySelectorAll('button')].filter(x=>x.getClientRects().length).every(x=>x.getBoundingClientRect().top>=59),m+' '+view+' controls clear the 59px iPhone status area at '+width+'px');
            check(doc.documentElement.scrollWidth<=width+1,m+' '+view+' with an inset fits '+width+'px');
          }
          if(view==='focus'){win.scrollTo(0,180);await pause(50);check(root.querySelector('.session-top').getBoundingClientRect().top>=59,m+' sticky controls stay below the status area after scrolling');}
        }
        const cover=win.getComputedStyle(doc.documentElement,'::before');
        check(cover.position==='fixed'&&parseFloat(cover.height)===59&&cover.pointerEvents==='none',m+' keeps scrolled content out of the system status area');
        doc.documentElement.style.setProperty('--shell-safe-top','0px');frame.style.width='1440px';win.scrollTo(0,0);await pause(60);
        check(root.querySelector('.train-head').getBoundingClientRect().top<40,m+' desktop list does not retain an iPhone-sized gap');
      }
      const {win,doc}=await seed({'trainer.together':{v:1,on:true,secs:['cond'],prio:['cond'],days:2,mins:60,offered:true,tuned:true,conditioning:{target:150,style:'easy',log:[],active:{id:'safe-area-cond',startedAt:Date.now(),minutes:30,style:'easy'}}}}),root=rootOf(doc,'mix');
      doc.documentElement.style.setProperty('--shell-safe-top','59px');root.querySelector('[data-a="cond-resume"]').click();await pause(60);win.scrollTo(0,0);
      check(win.getComputedStyle(root.querySelector('.appbar')).display==='none'&&root.querySelector('[data-a="cond-back"]').getBoundingClientRect().top>=59,'Conditioning also hides its header and clears the status area');
      root.querySelector('[data-a="cond-back"]').click();await pause(60);
      check(win.getComputedStyle(doc.querySelector('.shellbar')).display!=='none'&&parseFloat(win.getComputedStyle(doc.getElementById('main')).paddingTop)===0,'leaving the session restores the normal header without double safe-area spacing');
    });
  }finally{
    if(frame)frame.remove();Object.keys(localStorage).filter(managed).forEach(k=>localStorage.removeItem(k));Object.entries(original).forEach(([k,v])=>localStorage.setItem(k,v));sessionStorage.clear();Object.entries(originalSession).forEach(([k,v])=>sessionStorage.setItem(k,v));
    result.textContent=results.join('\n')+'\n'+(failures?'FAIL '+failures+' UI regressions':'ALL TESTS PASSED');
  }
})();
