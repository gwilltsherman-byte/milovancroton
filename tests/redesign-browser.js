(async function () {
  'use strict';
  const result=document.getElementById('result'), results=[];
  const managed=key=>/^(hyplog\.|strlog\.|proladder\.|trainer\.|milo\.)/.test(key);
  const take=storage=>Object.fromEntries(Object.keys(storage).filter(managed).map(key=>[key,storage.getItem(key)]));
  const original=take(localStorage), originalSession=take(sessionStorage);
  let frame=null, restored=false;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function clear(storage){ Object.keys(storage).filter(managed).forEach(key=>storage.removeItem(key)); }
  function restore(){
    if(restored) return;
    restored=true;
    // Destroy the app before restoring: its delayed saves and pagehide flush must not overwrite real data.
    if(frame){ frame.remove(); frame=null; }
    clear(localStorage); clear(sessionStorage);
    Object.entries(original).forEach(([key,value])=>localStorage.setItem(key,value));
    Object.entries(originalSession).forEach(([key,value])=>sessionStorage.setItem(key,value));
  }
  window.addEventListener('pagehide',restore,{once:true});
  function check(ok,message){
    if(!ok) throw new Error(message);
    results.push('PASS '+message); result.textContent=results.join('\n');
  }
  async function until(predicate,message){
    for(let i=0;i<100;i++){ if(predicate()) return; await pause(50); }
    throw new Error(message);
  }
  async function load(){
    if(frame) frame.remove();
    frame=document.createElement('iframe'); frame.title='Isolated redesign regression app';
    frame.src='../index.html?redesign-regression='+Date.now();
    document.getElementById('preview').appendChild(frame);
    await until(()=>typeof frame.contentWindow.__go==='function' && frame.contentWindow.__hub,'App did not start');
    // Muscle on the page it saved, through the one app's hub (its own navigation is hidden)
    let saved=null; try{ saved=JSON.parse(localStorage.getItem('hyplog.v1')||'null'); }catch(e){}
    const hub=frame.contentWindow.__hub; hub.go('lift'); hub.api('lift').go(saved&&saved.route||'today');
    await until(()=>frame.contentDocument.getElementById('m-lift')?.shadowRoot?.getElementById('view')?.children.length,'Muscle did not render');
    return {win:frame.contentWindow,doc:frame.contentDocument};
  }
  const rootOf=(doc,module)=>doc.getElementById('m-'+module).shadowRoot;
  const dialog=root=>root.querySelector('[role="dialog"][aria-modal="true"]');
  function closeDialog(root){
    const close=dialog(root)?.querySelector('[data-act="close-modal"]');
    if(!close) throw new Error('Open sheet has no close control');
    close.click();
  }
  function days(root){ return [...root.querySelectorAll('.day-strip > [aria-label]')]; }
  function dayCount(day){ return Number((day.getAttribute('aria-label').match(/: (\d+) sessions?$/)||[])[1]); }
  function light(doc){ return doc.documentElement.dataset.theme==='light' && ['lift','str','cal','mix'].every(m=>doc.getElementById('m-'+m).dataset.theme==='light'); }

  try {
    clear(localStorage); clear(sessionStorage);
    localStorage.setItem('trainer.shell.theme','dark');
    // Prevent a persistence permission request when the later saved-session fixture is loaded.
    localStorage.setItem('milo.persist','1');
    let {win,doc}=await load();
    let root=rootOf(doc,'lift');
    // A normal desktop viewport reports a zero inset. Supply the same CSS token
    // with an iPhone-sized value to exercise the actual sticky header geometry.
    const safeStyle=doc.createElement('style');
    safeStyle.textContent=':root{--shell-safe-top:59px}'; doc.head.appendChild(safeStyle);
    const bar=doc.querySelector('.shellbar'), side=doc.querySelector('.sidebar');
    for(const width of [430,360]){
      frame.style.width=width+'px';
      await until(()=>win.innerWidth===width && Number.parseFloat(doc.documentElement.style.getPropertyValue('--shell-bar-height'))===bar.offsetHeight,'Header height did not update');
      win.scrollTo(0,0);
      check([doc.querySelector('.milo-brand'),...doc.querySelectorAll('.shell-tools button')].filter(el=>el.getClientRects().length).every(el=>el.getBoundingClientRect().top>=59),'Header controls clear the iPhone status area at '+width+'px');
      check(side.getBoundingClientRect().top>=bar.getBoundingClientRect().bottom-1 && Math.abs(side.getBoundingClientRect().bottom-win.innerHeight)<=1,'The navigation sits at the bottom, clear of the full inset header at '+width+'px');
      win.scrollTo(0,400); await pause(50);
      check(Math.abs(side.getBoundingClientRect().bottom-win.innerHeight)<=1,'The bottom navigation stays put while scrolling at '+width+'px');
    }
    safeStyle.textContent=':root{--shell-safe-top:0px}';
    for(const width of [932,1100]){
      frame.style.width=width+'px'; win.scrollTo(0,0);
      await until(()=>win.innerWidth===width && Number.parseFloat(doc.documentElement.style.getPropertyValue('--shell-bar-height'))===bar.offsetHeight,'Zero-inset header did not update');
      check(bar.offsetHeight<=65,'No extra status-area gap with a zero inset at '+width+'px');
      check(side.getBoundingClientRect().top>=bar.getBoundingClientRect().bottom-1,'Navigation remains aligned after rotation or desktop resize at '+width+'px');
    }
    safeStyle.remove(); frame.style.width=''; win.scrollTo(0,0);
    await pause(450); // The previous automatic welcome sheet opened after 350 ms.
    check(!dialog(root) && !doc.querySelector('dialog[open]'),'Fresh Muscle opens without a blocking welcome dialog');
    check(days(root).length===7 && days(root).every(day=>dayCount(day)===0),'Fresh weekly strip contains seven days with zero saved sessions');

    const plan=root.querySelector('#view button[data-act="gen-open"]');
    check(!!plan,'First Today offers a direct training-plan action');
    plan.click();
    check(!!dialog(root)?.querySelector('[data-act="gen-create"]') && dialog(root).textContent.includes('Days per week'),'Today plan action opens the working program generator');
    closeDialog(root);

    check(doc.documentElement.dataset.theme==='dark','The app respects the saved dark preference');
    doc.getElementById('setbtn').click();
    const lightBtn=doc.querySelector('#set-body [data-s="theme"][data-v="light"]');
    check(doc.getElementById('bk').open && !!lightBtn && doc.querySelector('#set-body [data-s="theme"][data-v="dark"]').getAttribute('aria-pressed')==='true','Settings shows the theme in use');
    lightBtn.click(); doc.getElementById('bk-done').click();
    check(light(doc),'The theme in Settings applies light appearance to every section');

    const routes={lift:['today','train','plan','library','progress'],str:['today','train','program','progress','tools'],cal:['today','train','goals','progress','library'],mix:[]};
    const destOf=(m,r)=>r==='train'?'train':r==='progress'?'progress':r==='library'||r==='tools'?'library':'today';
    for(const [module,pages] of Object.entries(routes)){
      win.__hub.go(module);
      root=rootOf(doc,module);
      await pause(450);
      check(!doc.getElementById('m-'+module).hidden,'The hub shows '+module);
      check(!dialog(root) && !root.textContent.includes('This section failed to load'),'First visit to '+module+' renders without a blocking welcome or loading failure');
      for(const route of pages){
        const nav=root.querySelector('#tabbar [data-route="'+route+'"]');
        check(!!nav,'Route control exists: '+module+'/'+route);
        nav.click();
        const view=root.getElementById('view');
        check(view.children.length>0 && nav.getAttribute('data-route')===route && root.querySelector('#tabbar [aria-current="page"]')?.dataset.route===route,'Route renders and identifies the current page: '+module+'/'+route);
        check(doc.querySelector('.seg[aria-current="page"]')?.dataset.d===destOf(module,route),'The one navigation marks the place for '+module+'/'+route);
        check(light(doc),'Light theme survives render: '+module+'/'+route);
      }
      if(module==='mix'){
        check(!!root.querySelector('[data-a="f-go"]') && root.querySelectorAll('[data-a="f-sec"]').length===4,'A first run asks what you train, in two taps');
        win.__hub.api('mix').setup('secs'); await pause(100);
        check(!!root.querySelector('[data-a="d-save"]'),'Together setup retains its schedule workflow');
        const order=()=>[...root.querySelectorAll('.prow b')].map(b=>b.textContent).join(' > ');
        root.querySelector('[data-a="d-sec"][data-m="lift"]').click(); root.querySelector('[data-a="d-sec"][data-m="str"]').click();
        check(order()==='Strength > Muscle' && root.querySelector('[data-a="d-up"][data-m="str"]').disabled,'Together suggests an order for the picked sections');
        root.querySelector('[data-a="d-up"][data-m="lift"]').click();
        check(order()==='Muscle > Strength' && root.getElementById('prio-l').parentElement.textContent.includes('Your order'),'Together lets you choose which section comes first');
        root.querySelector('[data-a="d-prio-reset"]').click();
        check(order()==='Strength > Muscle' && root.getElementById('prio-l').parentElement.textContent.includes('Suggested'),'Together goes back to the suggested order');
        root.querySelector('[data-a="d-cancel"]').click();
      }
    }
    await pause(200);
    check(localStorage.getItem('trainer.shell.theme')==='light','Light preference survives deferred trainer saves');
    check(['hyplog.v1','strlog.v2','proladder.v1'].every(key=>JSON.parse(localStorage.getItem(key)).settings.theme==='light'),'Saved trainer settings agree with the global theme');

    win.__hub.go('lift'); root=rootOf(doc,'lift');
    root.querySelector('#tabbar [data-route="today"]').click();
    for(const key of ['Enter',' ']){
      const metric=root.querySelector('.metric[role="button"][data-act="sessions"]');
      check(!!metric && metric.tabIndex===0,'Session metric can receive keyboard focus');
      metric.focus(); metric.dispatchEvent(new win.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
      check(!!dialog(root) && dialog(root).textContent.includes('No finished sessions yet.'),(key===' '?'Space':'Enter')+' opens session history from the metric');
      closeDialog(root);
    }

    await pause(200);
    const fixture=JSON.parse(localStorage.getItem('hyplog.v1')); fixture.settings.sessionView='list';
    const date=new Date(); date.setDate(date.getDate()-2); date.setHours(12,0,0,0);
    fixture.route='today'; fixture.active=null; fixture.repeat=null;
    fixture.history=[{id:'redesign-test-session',name:'Redesign test fixture — one saved workout',date:date.getTime(),durationSec:600,prs:[],entries:[{
      exId:'bench',name:'Bench press',primary:['chest'],secondary:['tri','fdelt'],equipment:'Barbell',
      sets:[{type:'work',weight:40,reps:8,rir:2,done:true}]
    }]}];
    check(!!win.MiloSecurity.section(fixture,'hyplog.v1'),'Saved-session fixture is valid Milo data');
    // Remove the previous app first so a pagehide save cannot replace the fixture.
    frame.remove(); frame=null;
    localStorage.setItem('hyplog.v1',JSON.stringify(fixture));
    ({win,doc}=await load()); root=rootOf(doc,'lift');
    const week=days(root), full=date.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
    check(week.length===7 && week.reduce((sum,day)=>sum+dayCount(day),0)===1,'Weekly strip counts the one actual saved session');
    check(week.find(day=>day.getAttribute('aria-label').startsWith(full+':'))?.getAttribute('aria-label')===full+': 1 session','Saved session appears on its actual calendar day');
    root.querySelector('.training-week [data-act="sessions"]').click();
    check(!!dialog(root)?.querySelector('[data-id="redesign-test-session"]'),'Weekly history action opens the saved workout');
    closeDialog(root);

    // a bodyweight exercise counts bodyweight on its own; a bodyweight typed into its weight box is asked about once
    { frame.remove(); frame=null;
      const fx=JSON.parse(JSON.stringify(fixture)), d0=new Date(); d0.setDate(d0.getDate()-1); d0.setHours(12,0,0,0);
      const pull=sets=>({exId:'pullup',name:'Pull-Up',primary:['lat'],secondary:['bi','uback'],equipment:'Bodyweight',sets});
      fx.history.push({id:'bw-test-session',name:'Pull day',date:d0.getTime(),durationSec:600,prs:[],entries:[pull([{type:'work',weight:65,reps:6,rir:1,done:true},{type:'work',weight:65,reps:5,rir:0,done:true}])]});
      fx.bodylog=[]; fx.route='train';
      fx.active={id:'bw-active',name:'Pull day',startedAt:Date.now(),restEndsAt:null,restDuration:0,
        entries:[Object.assign(pull([{type:'work',weight:65,reps:null,rir:null,done:false}]),{target:{repLow:6,repHigh:10,rir:2,rest:180},mi:0})]};
      check(!!win.MiloSecurity.section(fx,'hyplog.v1'),'Bodyweight fixture is valid Milo data');
      localStorage.setItem('hyplog.v1',JSON.stringify(fx));
      ({win,doc}=await load()); root=rootOf(doc,'lift');
      await until(()=>root.querySelector('.excard'),'The session did not open');
      const card=()=>root.querySelector('.excard');
      check(!!card().querySelector('[data-act="bw-body"]') && card().textContent.includes('your bodyweight?'),'A bodyweight typed into a pull-up’s weight box is asked about');
      check(/^\+(Kg|Lb)$/.test(card().querySelector('.setrow-head span:nth-child(2)').textContent.trim()) && !card().querySelector('[data-act="loading"]'),'Its weight column is for added weight, with no plate maths');
      card().querySelector('[data-act="bw-body"]').click(); await pause(200);
      const saved=JSON.parse(localStorage.getItem('hyplog.v1')), hist=saved.history.find(h=>h.id==='bw-test-session').entries[0].sets;
      check(hist.every(x=>x.weight==null) && saved.active.entries[0].sets[0].weight==null && saved.settings.bwAsked.pullup==='body','Saying it was your bodyweight makes those sets bodyweight alone');
      check(saved.bodylog.some(b=>Math.abs(b.weight-65)<0.01),'and keeps the number as your bodyweight');
      const w=card().querySelector('input[data-field="weight"]');
      check(!card().querySelector('[data-act="bw-body"]') && w.value==='' && w.placeholder==='BW' && card().textContent.includes('Last: BW'),'The set shows BW, and the question does not come back');
      frame.remove(); frame=null; localStorage.setItem('hyplog.v1',JSON.stringify(fixture));
      ({win,doc}=await load()); root=rootOf(doc,'lift'); }

    // an exercise you haven't logged starts from your latest similar one, shown rather than filled in
    { frame.remove(); frame=null;
      const fx=JSON.parse(JSON.stringify(fixture)), d0=new Date(); d0.setDate(d0.getDate()-3); d0.setHours(12,0,0,0);
      const ex=(id,name,eq,sets)=>({exId:id,name,primary:['fdelt'],secondary:['sdelt','tri'],equipment:eq,sets});
      fx.history.push({id:'sim-test',name:'Push day',date:d0.getTime(),durationSec:600,prs:[],entries:[ex('db-shoulder-press','Dumbbell Shoulder Press','Dumbbell',[{type:'work',weight:20,reps:8,rir:2,done:true}])]});
      fx.route='train';
      fx.active={id:'sim-active',name:'Push day',startedAt:Date.now(),restEndsAt:null,restDuration:0,
        entries:[Object.assign(ex('machine-shoulder-press','Machine Shoulder Press','Machine',[{type:'work',weight:null,reps:null,rir:null,done:false}]),{target:{repLow:6,repHigh:10,rir:3,rest:180},mi:0})]};
      localStorage.setItem('hyplog.v1',JSON.stringify(fx));
      ({win,doc}=await load()); root=rootOf(doc,'lift');
      await until(()=>root.querySelector('.excard'),'The session did not open');
      const note=root.querySelector('.excard .newex'), w=root.querySelector('.excard input[data-field="weight"]');
      check(!!note && note.textContent.includes('Dumbbell Shoulder Press') && note.textContent.includes('×8') && w.value==='' && w.placeholder==='–','A new exercise shows your latest similar set to start from, and an empty weight box shows a dash, not 0');
      frame.remove(); frame=null; localStorage.setItem('hyplog.v1',JSON.stringify(fixture));
      ({win,doc}=await load()); root=rootOf(doc,'lift'); }

    // exercises in both Muscle and Ladder share their sets: Ladder's latest pull-ups start Muscle's, and Muscle's count in Ladder as volume, not proof
    { frame.remove(); frame=null;
      const day=n=>{ const d=new Date(); d.setDate(d.getDate()-n); d.setHours(12,0,0,0); return d.getTime(); };
      const pull=sets=>({exId:'pullup',name:'Pull-Up',primary:['lat'],secondary:['bi','uback'],equipment:'Bodyweight',sets});
      const fx=JSON.parse(JSON.stringify(fixture));
      fx.history.push(...[4,2].map(n=>({id:'mus-pull-'+n,name:'Pull day',date:day(n),durationSec:600,prs:[],entries:[pull([0,1,2].map(()=>({type:'work',weight:null,reps:10,rir:1,done:true})))]})));
      fx.route='train';
      fx.active={id:'share-active',name:'Pull day',startedAt:Date.now(),restEndsAt:null,restDuration:0,
        entries:[Object.assign(pull([{type:'work',weight:null,reps:null,rir:null,done:false}]),{target:{repLow:6,repHigh:12,rir:2,rest:180},mi:0})]};
      const lad={v:2, onboarded:true, route:'today', settings:{sessionView:'list',sound:false, vibrate:false, rest:0}, rung:{pull:4}, placed:{pull:true}, tests:[], active:null,
        goals:[{id:'g10', key:'pullup10', n:'10 strict pull-ups', l:'pull', r:4, std:10, sup:['row'], added:1, achieved:null}],
        history:[{id:'lad-1', name:'Ladder', date:day(1), entries:[{ladderId:'pull', stepIdx:4, kind:'reps', target:8, setup:{}, clean:true, role:'goal',
          sets:[7,7,6].map(v=>({v, done:true, clean:true}))}]}]};
      localStorage.setItem('hyplog.v1',JSON.stringify(fx)); localStorage.setItem('proladder.v1',JSON.stringify(lad));
      ({win,doc}=await load()); root=rootOf(doc,'lift');
      await until(()=>root.querySelector('.excard'),'The session did not open');
      check(root.querySelector('.excard').textContent.includes('Last: BW×7 @') || root.querySelector('.excard').textContent.includes('Last: BW×7 in Ladder'),'Muscle starts pull-ups from your newer Ladder set');
      check(root.querySelector('.excard').textContent.includes('in Ladder'),'and says it came from Ladder');
      const C=win.__hub.api('cal');
      check(C.catalog().find(c=>c.key==='pullup10').met===false,'Ladder counts the 10-rep pull-up sets logged in Muscle as volume, not proof, so the goal is not met from them');
      check(win.__hub.sets(day(10), null, ['cal']).direct.lat===3,'Ladder’s weekly sets still count only its own, so nothing is counted twice');
      frame.remove(); frame=null; localStorage.setItem('hyplog.v1',JSON.stringify(fixture)); localStorage.removeItem('proladder.v1');
      ({win,doc}=await load()); root=rootOf(doc,'lift'); }

    // a second workout can start while one is open: the first stays open, you switch between them, and ending one leaves the other
    { frame.remove(); frame=null;
      const fx=JSON.parse(JSON.stringify(fixture));
      fx.active={id:'multi-a',name:'Pull day',startedAt:Date.now()-600000,restEndsAt:null,restDuration:0,
        entries:[{exId:'bench',name:'Bench press',primary:['chest'],secondary:['tri','fdelt'],equipment:'Barbell',target:{repLow:6,repHigh:10,rir:2,rest:120},mi:0,
          sets:[{type:'work',weight:40,reps:8,rir:2,done:true},{type:'work',weight:40,reps:null,rir:null,done:false}]}]};
      localStorage.setItem('hyplog.v1',JSON.stringify(fx));
      ({win,doc}=await load()); root=rootOf(doc,'lift');
      const act=a=>root.querySelector(`[data-act="${a}"]`), saved=()=>JSON.parse(localStorage.getItem('hyplog.v1'));
      check(!!act('start-empty'),'With a session open, Muscle’s Today still offers to start another');
      act('start-empty').click(); await pause(150);
      check(!!dialog(root)?.querySelector('[data-act="park-active-confirm"]'),'Starting one offers to keep the open one going beside it');
      dialog(root).querySelector('[data-act="park-active-confirm"]').click(); await pause(250);
      if(dialog(root)) closeDialog(root);   // the exercise picker a free session opens with
      await pause(250);
      const second=saved().active.id;
      check(second!=='multi-a' && saved().parked.length===1 && saved().parked[0].id==='multi-a' && saved().parked[0].entries[0].sets[0].done,'The new workout is on screen and the first is kept open, sets and all');
      const bar=act('switch-session');
      check(!!bar && bar.closest('.card').textContent.includes('2 sessions in progress') && bar.closest('.card').textContent.includes('Pull day') && bar.closest('.card').textContent.includes('On screen'),'The Train tab lists both sessions in progress, the one on screen marked');
      act('leave-session').click(); await pause(200);
      check(!root.querySelector('#view [data-act="switch-session"]') && root.querySelector('#tabbar [data-route="train"]').classList.contains('live'),'Today doesn’t list them; the Train tab shows a dot');
      root.querySelector('#tabbar [data-route="train"]').click(); await pause(200);
      check(root.querySelector('#view').textContent.includes('2 sessions in progress') && root.querySelectorAll('#view [data-act="switch-session"]').length===1,'the Train tab lists both open sessions, the one on screen marked');
      act('switch-session').click(); await pause(250);
      check(saved().active.id==='multi-a' && saved().parked.map(p=>p.id).join()===second,'Resuming one brings it on screen and keeps the other open');
      check(win.__hub.api('lift').info().open.join()==='multi-a,'+second,'Together sees both as open');
      check(win.__hub.api('lift').end(false, second),'A session left open can be ended by name');
      await pause(250);
      check(saved().active.id==='multi-a' && saved().parked.length===0,'and the one you were on stays on screen');
      frame.remove(); frame=null; localStorage.setItem('hyplog.v1',JSON.stringify(fixture));
      ({win,doc}=await load()); root=rootOf(doc,'lift'); }

    // Ladder and Strength: Start another keeps the session going open beside the next one
    { frame.remove(); frame=null;
      const now=Date.now();
      localStorage.setItem('proladder.v1',JSON.stringify({v:2, onboarded:true, route:'today', settings:{sessionView:'list',sound:false, vibrate:false, rest:0}, rung:{pull:4}, placed:{pull:true}, tests:[], history:[],
        goals:[{id:'g10', key:'pullup10', n:'10 strict pull-ups', l:'pull', r:4, std:10, sup:['row'], added:1, achieved:null}],
        active:{id:'lad-open', name:'First one', startedAt:now-600000, restEndsAt:null, restDur:0, entries:[{ladderId:'pull', stepIdx:4, kind:'reps', target:8, setup:{}, sets:[{v:7, done:true}]}]}}));
      localStorage.setItem('strlog.v2',JSON.stringify({v:2, onboarded:true, route:'today', settings:{sessionView:'list',unit:'kg'}, history:[],
        active:{id:'str-open', name:'First one', startedAt:now-600000, restEndsAt:null, restDur:0, note:null, plan:null, entries:[]}}));
      ({win,doc}=await load());
      for(const [m,key] of [['cal','proladder.v1'],['str','strlog.v2']]){
        win.__go(m); await pause(300);
        const r=rootOf(doc,m), saved=()=>JSON.parse(localStorage.getItem(key)), first=m==='cal'? 'lad-open' : 'str-open';
        const name=m==='cal'?'Ladder':'Strength';
        check(!r.querySelector('#view').textContent.includes('First one') && r.querySelector('#tabbar [data-route="train"]').classList.contains('live'),`${name}: Today doesn’t list the session going; the Train tab shows a dot`);
        r.querySelector(m==='cal'? '[data-act="start-plan"]' : '[data-act="free"]').click(); await pause(300);
        const both=r.querySelector('#sheet.on [data-act="park-start"]'); check(!!both, `${name}: starting another asks, and offers to keep this one open`);
        both.click(); await pause(500);
        if(r.querySelector('#sheet.on [data-act="close-modal"]')) r.querySelector('#sheet.on [data-act="close-modal"]').click();
        await pause(200);
        check(saved().active && saved().active.id!==first && saved().parked[0].id===first,'the next session starts with the first still open');
        r.querySelector('#tabbar [data-route="train"]').click(); await pause(200);
        check(r.querySelector('#view').textContent.includes('2 sessions in progress'),'the Train tab lists both');
        r.querySelector('#view [data-act="switch-session"]').click(); await pause(250);
        check(saved().active.id===first && saved().parked.length===1 && saved().parked[0].id!==first,'and Switch swaps between them');
      }
      frame.remove(); frame=null; localStorage.removeItem('proladder.v1'); localStorage.removeItem('strlog.v2');
      ({win,doc}=await load()); root=rootOf(doc,'lift'); }

    // one choice for the app: units go to every trainer; Muscle and Strength share the lifts both have
    { frame.remove(); frame=null;
      const day=n=>{ const d=new Date(); d.setDate(d.getDate()-n); d.setHours(12,0,0,0); return d.getTime(); };
      const bench=sets=>({exId:'barbell-bench',name:'Barbell Bench Press',primary:['chest'],secondary:['tri','fdelt'],equipment:'Barbell',sets});
      const fx=JSON.parse(JSON.stringify(fixture)); fx.route='train';
      fx.history.push({id:'mus-bench',name:'Push',date:day(6),durationSec:600,prs:[],entries:[bench([{type:'work',weight:80,reps:8,rir:2,done:true}])]});
      fx.active={id:'share-str',name:'Push',startedAt:Date.now(),restEndsAt:null,restDuration:0,
        entries:[Object.assign(bench([{type:'work',weight:null,reps:null,rir:null,done:false}]),{target:{repLow:6,repHigh:10,rir:2,rest:180},mi:0})]};
      localStorage.setItem('hyplog.v1',JSON.stringify(fx));
      localStorage.setItem('strlog.v2',JSON.stringify({v:2, onboarded:true, route:'today', settings:{sessionView:'list',unit:'kg', sound:true, vibrate:true}, active:null,
        history:[{id:'str-bench',name:'Day A',date:day(1),entries:[{liftId:'bench',sets:[{kind:'work',w:100,reps:5,rpe:8,done:true}]}]}]}));
      ({win,doc}=await load()); root=rootOf(doc,'lift');
      await until(()=>root.querySelector('.excard'),'The session did not open');
      check(root.querySelector('.excard').textContent.includes('Last: 100kg×5 @2 in Strength'),'Muscle starts the bench press from your newer Strength set, and says so');
      // a smoothed estimate, not the best of recent sessions: both sets count, the newer more, each with its reps left
      const e1=win.__hub.api('str').lift('bench').e1, L=win.Lift;
      const want=L.estimate([{date:day(1), e1:100/L.pct(7), rated:true}, {date:day(6), e1:80/L.pct(10), rated:true}]).value;
      check(Math.abs(e1-want)<0.01 && e1<100/L.pct(7) && e1>80/L.pct(10),'Strength’s estimate averages its set with Muscle’s, the newer counting more, with the 2 reps left');
      const b=doc.createElement('button'); b.dataset.act='set-unit'; b.dataset.v='lb'; b.hidden=true; root.getElementById('view').appendChild(b); b.click(); b.remove();
      await pause(300);
      check(JSON.parse(localStorage.getItem('strlog.v2')).settings.unit==='lb' && win.Prefs.get('unit')==='lb','Pounds chosen in Muscle are Strength’s units too');
      frame.remove(); frame=null; localStorage.setItem('hyplog.v1',JSON.stringify(fixture)); localStorage.removeItem('strlog.v2'); localStorage.removeItem('trainer.shell.unit');
      ({win,doc}=await load()); root=rootOf(doc,'lift'); }

    // back after a break: lighter loads and fewer sets; warm-ups before the first heavy lift; short on time pairs exercises
    { frame.remove(); frame=null;
      const fx=JSON.parse(JSON.stringify(fixture)), d=new Date(); d.setDate(d.getDate()-35); d.setHours(12,0,0,0);
      fx.history=[{id:'old-bench',name:'Push',date:d.getTime(),durationSec:600,prs:[],entries:[{exId:'barbell-bench',name:'Barbell Bench Press',primary:['chest'],secondary:['tri','fdelt'],equipment:'Barbell',sets:[{type:'work',weight:80,reps:8,rir:2,done:true}]}]}];
      fx.route='today'; localStorage.setItem('hyplog.v1',JSON.stringify(fx));
      ({win,doc}=await load()); root=rootOf(doc,'lift');
      const L=win.__hub.api('lift'), ok={readiness:{flag:'ok',text:'Ready'}};
      L.startWith({name:'Back', exercises:[{exId:'barbell-bench',sets:3}]}, ok); await pause(250);
      let a=JSON.parse(localStorage.getItem('hyplog.v1')).active, en=a.entries[0], work=en.sets.filter(s=>s.type!=='warmup');
      check(work.length===2 && Math.abs(work[0].weight-72.5)<0.01 && /ease back in/.test(en.overloadNote),'Five weeks away: a third fewer sets, 10% lighter, and it says why');
      check(en.sets.filter(s=>s.type==='warmup').length>=2 && en.sets[0].type==='warmup' && en.sets[0].weight<work[0].weight,'Warm-up sets come before the first heavy lift');
      win.__hub.api('lift').end(false); await pause(250);
      L.startWith({name:'Quick', exercises:[{exId:'barbell-bench',sets:3},{exId:'barbell-curl',sets:3},{exId:'lat-pulldown',sets:3}]}, Object.assign({short:true}, ok)); await pause(250);
      a=JSON.parse(localStorage.getItem('hyplog.v1')).active;
      check(a.entries[0].sg && a.entries[0].sg===a.entries[1].sg && !a.entries[1].primary.some(q=>a.entries[0].primary.includes(q)) && a.entries.every(e=>e.sets.filter(s=>s.type!=='warmup').length>=2),'Short on time pairs exercises for different muscles as supersets and keeps the sets');
      frame.remove(); frame=null; localStorage.setItem('hyplog.v1',JSON.stringify(fixture));
      ({win,doc}=await load()); root=rootOf(doc,'lift'); }

    // in a session: a set much easier than planned moves the next ones up; the hard weeks take an isolation exercise's last set to failure
    { frame.remove(); frame=null;
      const fx=JSON.parse(JSON.stringify(fixture)), d=new Date(); d.setDate(d.getDate()-2); d.setHours(12,0,0,0);
      fx.history=[{id:'recent-bench',name:'Push',date:d.getTime(),durationSec:600,prs:[],entries:[{exId:'barbell-bench',name:'Barbell Bench Press',primary:['chest'],secondary:['tri','fdelt'],equipment:'Barbell',sets:[{type:'work',weight:80,reps:8,rir:2,done:true}]}]}];
      fx.route='train'; localStorage.setItem('hyplog.v1',JSON.stringify(fx));
      ({win,doc}=await load()); root=rootOf(doc,'lift');
      const ok={readiness:{flag:'ok',text:'Ready'}}, saved=()=>JSON.parse(localStorage.getItem('hyplog.v1')).active;
      win.__hub.api('lift').startWith({name:'Push', rir:1, exercises:[{exId:'barbell-bench',sets:3},{exId:'db-curl',sets:2}]}, ok); await pause(300);
      const ben=saved().entries.find(e=>e.exId==='barbell-bench'), wi=ben.sets.findIndex(x=>x.type!=='warmup'), ei=saved().entries.findIndex(e=>e.exId==='barbell-bench');
      const rir=root.querySelector(`input[data-field="rir"][data-ex="${ei}"][data-set="${wi}"]`); rir.value='4'; rir.dispatchEvent(new Event('input',{bubbles:true}));
      root.querySelector(`[data-act="toggle-done"][data-ex="${ei}"][data-set="${wi}"]`).click(); await pause(250);
      const after=saved().entries[ei].sets.filter(x=>x.type!=='warmup');
      check(after[1].weight>after[0].weight && after[2].weight===after[1].weight,'A set 3 reps easier than planned moves the next sets up a step');
      const ci=saved().entries.findIndex(e=>e.exId==='db-curl'), cu=saved().entries[ci];
      check(cu.lastFail && /last set to failure/.test(cu.overloadNote),'In a hard week the curl’s last set is marked to go to failure');
      const last=cu.sets.length-1; root.querySelector(`[data-act="toggle-done"][data-ex="${ci}"][data-set="${last}"]`).click(); await pause(250);
      check(saved().entries[ci].sets[last].rir===0,'and an unrated last set logs as taken to failure');
      win.__hub.api('lift').end(false); await pause(200);
      frame.remove(); frame=null; localStorage.setItem('hyplog.v1',JSON.stringify(fixture));
      ({win,doc}=await load()); root=rootOf(doc,'lift'); }

    // how-tos are written instructions only: no drawings or animation
    { const how=(m,id)=>{ const r=rootOf(doc,m), b=doc.createElement('button'); b.dataset.act='howto'; b.dataset.id=id; b.hidden=true;
        r.getElementById('view').appendChild(b); b.click(); b.remove(); return r; };
      const r=how('lift','barbell-bench');
      check(!!dialog(r)?.querySelector('.howto') && !dialog(r).querySelector('svg.mvfig, .mvcard') && !win.MiloVis,'Muscle’s how-to is text only');
      closeDialog(r); }

    await pause(200);
    const beforeInvalid=JSON.stringify(take(localStorage));
    doc.getElementById('bkbtn').click();
    check(doc.getElementById('bk').open,'Global backup control opens a usable dialog');
    doc.getElementById('bk-in').value=JSON.stringify({app:'milovancroton',version:1,data:{'hyplog.v1':JSON.stringify({v:1,history:'invalid'})}});
    doc.getElementById('bk-restore').click();
    check(doc.getElementById('bk-msg2').textContent.trim().length>0 && !sessionStorage.getItem('milo.restore'),'Invalid backup is refused with visible feedback before restore');
    check(JSON.stringify(take(localStorage))===beforeInvalid,'Rejected backup leaves all stored training data unchanged');
    doc.getElementById('bk-done').click();
    result.textContent=results.join('\n')+'\nALL TESTS PASSED';
  } catch(error){
    result.textContent=results.join('\n')+'\nFAIL '+error.stack;
  } finally {
    restore();
    window.removeEventListener('pagehide',restore);
    result.textContent+='\nOriginal Milo browser data restored.';
  }
})();
