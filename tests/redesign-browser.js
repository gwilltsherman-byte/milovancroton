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
    frame.src='../index.html?m=lift&redesign-regression='+Date.now();
    document.getElementById('preview').appendChild(frame);
    await until(()=>typeof frame.contentWindow.__go==='function' && frame.contentDocument.getElementById('m-lift')?.shadowRoot?.getElementById('view')?.children.length,'App did not start');
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
      check([doc.querySelector('.milo-brand'),...doc.querySelectorAll('.shell-tools button')].every(el=>el.getBoundingClientRect().top>=59),'Header controls clear the iPhone status area at '+width+'px');
      check(side.getBoundingClientRect().top>=bar.getBoundingClientRect().bottom-1,'Trainer tabs follow the full inset header at '+width+'px');
      win.scrollTo(0,400); await pause(50);
      check(side.getBoundingClientRect().top>=bar.getBoundingClientRect().bottom-1,'Sticky trainer tabs remain below the header while scrolling at '+width+'px');
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

    const toggle=doc.getElementById('theme-toggle');
    check(!!toggle && doc.documentElement.dataset.theme==='dark','Global theme control respects the saved dark preference');
    toggle.click();
    check(light(doc),'Global theme control applies light appearance to every trainer');

    const routes={lift:['today','train','plan','library','progress'],str:['today','train','program','progress','tools'],cal:['today','train','goals','progress','library'],mix:[]};
    for(const [module,pages] of Object.entries(routes)){
      doc.querySelector('.seg[data-m="'+module+'"]').click();
      root=rootOf(doc,module);
      await pause(450);
      check(!doc.getElementById('m-'+module).hidden && doc.querySelector('.seg[data-m="'+module+'"]').getAttribute('aria-selected')==='true','Trainer navigation selects '+module);
      check(!dialog(root) && !root.textContent.includes('This section failed to load'),'First visit to '+module+' renders without a blocking welcome or loading failure');
      for(const route of pages){
        const nav=root.querySelector('#tabbar [data-route="'+route+'"]');
        check(!!nav,'Route control exists: '+module+'/'+route);
        nav.click();
        const view=root.getElementById('view');
        check(view.children.length>0 && nav.getAttribute('data-route')===route && root.querySelector('#tabbar [aria-current="page"]')?.dataset.route===route,'Route renders and identifies the current page: '+module+'/'+route);
        check(light(doc),'Light theme survives render: '+module+'/'+route);
      }
      if(module==='mix'){
        check(!!root.querySelector('[data-a="d-save"]'),'Together setup retains its schedule workflow');
        const order=()=>[...root.querySelectorAll('.prow b')].map(b=>b.textContent).join(' > ');
        root.querySelector('[data-a="d-sec"][data-m="lift"]').click(); root.querySelector('[data-a="d-sec"][data-m="str"]').click();
        check(order()==='Strength > Muscle' && root.querySelector('[data-a="d-up"][data-m="str"]').disabled,'Together suggests an order for the picked sections');
        root.querySelector('[data-a="d-up"][data-m="lift"]').click();
        check(order()==='Muscle > Strength' && root.getElementById('prio-l').parentElement.textContent.includes('Your order'),'Together lets you choose which section comes first');
        root.querySelector('[data-a="d-prio-reset"]').click();
        check(order()==='Strength > Muscle' && root.getElementById('prio-l').parentElement.textContent.includes('Suggested'),'Together goes back to the suggested order');
      }
    }
    await pause(200);
    check(localStorage.getItem('trainer.shell.theme')==='light','Light preference survives deferred trainer saves');
    check(['hyplog.v1','strlog.v2','proladder.v1'].every(key=>JSON.parse(localStorage.getItem(key)).settings.theme==='light'),'Saved trainer settings agree with the global theme');

    doc.querySelector('.seg[data-m="lift"]').click(); root=rootOf(doc,'lift');
    root.querySelector('#tabbar [data-route="today"]').click();
    for(const key of ['Enter',' ']){
      const metric=root.querySelector('.metric[role="button"][data-act="sessions"]');
      check(!!metric && metric.tabIndex===0,'Session metric can receive keyboard focus');
      metric.focus(); metric.dispatchEvent(new win.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
      check(!!dialog(root) && dialog(root).textContent.includes('No finished sessions yet.'),(key===' '?'Space':'Enter')+' opens session history from the metric');
      closeDialog(root);
    }

    await pause(200);
    const fixture=JSON.parse(localStorage.getItem('hyplog.v1'));
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
