(async function () {
  'use strict';
  // One app: the navigation (Today, Train, Progress, Library), deep links, the Settings sheet, and the pages Together draws.
  const result=document.getElementById('result'), results=[];
  const managed=key=>/^(hyplog\.|strlog\.|proladder\.|trainer\.|milo\.)/.test(key);
  const take=()=>Object.fromEntries(Object.keys(localStorage).filter(managed).map(key=>[key,localStorage.getItem(key)]));
  const original=take(), originalSession=Object.fromEntries(Object.keys(sessionStorage).map(k=>[k,sessionStorage.getItem(k)]));
  let frame=null;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function check(ok,message){ if(!ok) throw new Error(message); results.push('PASS '+message); result.textContent=results.join('\n'); }
  function reset(data){ Object.keys(localStorage).filter(managed).forEach(key=>localStorage.removeItem(key)); sessionStorage.clear(); Object.entries(data||{}).forEach(([k,v])=>localStorage.setItem(k,v)); }
  async function until(f,message){ for(let i=0;i<120;i++){ let v=null; try{ v=f(); }catch(e){} if(v) return v; await pause(50); } throw new Error(message); }
  async function load(query){
    if(frame){ frame.remove(); frame=null; }
    frame=document.createElement('iframe'); frame.title='One-app test app'; frame.style.cssText='width:390px;height:844px;border:1px solid #777';
    frame.src='../index.html?'+(query? query+'&' : '')+'shell-regression='+Date.now();
    document.getElementById('preview').appendChild(frame);
    await until(()=>frame.contentWindow.__hub && frame.contentDocument.querySelector('.seg[aria-current="page"]'),'the app did not start');
    await pause(250);
    return {win:frame.contentWindow, doc:frame.contentDocument};
  }
  const place=doc=>doc.querySelector('.seg[aria-current="page"]').dataset.d;
  const rootOf=(doc,m)=>doc.getElementById('m-'+m).shadowRoot;
  const together={v:1, on:true, secs:['lift','str'], days:3, mins:60, prio:['str','lift','cal'], kit:null, exp:'intermediate', log:[], checkins:[], next:0, offered:true};
  const strAt=(route,active)=>JSON.stringify({v:2, onboarded:true, route, settings:{unit:'kg', sound:false, vibrate:false}, history:[], active:active||null});
  try {
    // deep links: ?m=mix is Today, ?m=str Strength on Progress, or its session when one is going; ?go= a place
    reset({'milo.persist':'1', 'trainer.together':JSON.stringify(together)});
    let {win,doc}=await load('m=mix');
    check(place(doc)==='today' && win.__hub.current()==='mix' && !!rootOf(doc,'mix').querySelector('[data-a="start-day"]'), '?m=mix opens Today');
    check(doc.querySelectorAll('.seg').length===4 && [...doc.querySelectorAll('.seg')].map(b=>b.dataset.d).join()==='today,train,progress,library', 'one navigation: Today, Train, Progress, Library');
    ({win,doc}=await load('m=str'));
    check(place(doc)==='progress' && win.__hub.current()==='str' && doc.querySelector('#subchips [data-f="str"]').getAttribute('aria-pressed')==='true', '?m=str opens Progress, filtered to Strength');
    check(location.search.indexOf('m=str')<0 && frame.contentWindow.location.search.indexOf('m=str')<0, 'the link is tidied away once it is used');
    ({win,doc}=await load('go=library'));
    check(place(doc)==='library' && !doc.getElementById('libq-wrap').hidden, '?go=library opens the Library, with its one search box');
    frame.remove(); frame=null;
    localStorage.setItem('strlog.v2', strAt('train', {id:'s-open', name:'Bench day', startedAt:Date.now()-60000, entries:[], restEndsAt:null}));
    ({win,doc}=await load('m=str'));
    check(place(doc)==='train' && win.__hub.current()==='str', '?m=str with a Strength session going opens that session on Train');
    check(doc.querySelector('.seg[data-d="train"]').classList.contains('live') && /in progress/.test(doc.querySelector('.seg[data-d="train"]').getAttribute('aria-label')), 'Train carries a dot, and says so, while a session is open');
    // Today leads with the way back to a session going outside today's day
    doc.querySelector('.seg[data-d="today"]').click(); await pause(300);
    let root=rootOf(doc,'mix');
    const back=root.querySelector('.backto [data-a="resume"][data-m="str"]');
    check(!!back && root.querySelector('#view .stack').firstElementChild.classList.contains('backto'), 'Today leads with Back to your session');
    back.click(); await pause(300);
    check(win.__hub.current()==='str' && place(doc)==='train', 'Back to your session opens it on Train');
    win.__hub.api('str').end(false); await pause(250);

    // arrow keys move along the navigation; Enter opens a place
    doc.querySelector('.seg[data-d="today"]').click(); await pause(250);
    const segs=[...doc.querySelectorAll('.seg')]; segs[0].focus();
    segs[0].dispatchEvent(new win.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
    check(doc.activeElement===segs[1], 'the right arrow moves to Train');
    segs[1].dispatchEvent(new win.KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));
    check(doc.activeElement===segs[3], 'End moves to Library');
    check(segs.every(b=>b.getBoundingClientRect().height>=44 && b.getBoundingClientRect().width>=44), 'every place in the navigation is at least 44 px');

    // Train with no session: today's workout and one section on its own
    doc.querySelector('.seg[data-d="train"]').click(); await pause(300);
    root=rootOf(doc,'mix');
    check(win.__hub.current()==='mix' && !!root.querySelector('[data-a="tr-day"]') && root.querySelectorAll('[data-a="tr-quick"]').length>=2, 'Train with nothing open offers today’s workout and quick starts');

    // Progress, All: one summary across everything
    doc.querySelector('.seg[data-d="progress"]').click(); await pause(100);
    doc.querySelector('#subchips [data-f="all"]').click(); await pause(400);
    root=rootOf(doc,'mix');
    const txt=root.getElementById('view').textContent;
    check(/This week/.test(txt) && /Hard sets per muscle/.test(txt) && /Your main lifts/.test(txt), 'Progress, All: sessions this week, hard sets per muscle and the main lifts');
    for(const f of ['lift','str','cal']){ doc.querySelector('#subchips [data-f="'+f+'"]').click(); await pause(450);
      check(win.__hub.current()===f && place(doc)==='progress' && rootOf(doc,f).getElementById('view').children.length>0, 'the '+f+' filter shows that section’s own progress'); }

    // Library: All lists every section; one search finds exercises anywhere; Muscle's own library takes the same search
    doc.querySelector('.seg[data-d="library"]').click(); await pause(100);
    doc.querySelector('#subchips [data-f="all"]').click(); await pause(300);
    const q=doc.getElementById('libq'); q.focus(); q.value='pull'; q.dispatchEvent(new win.Event('input',{bubbles:true})); await pause(400);
    root=rootOf(doc,'mix');
    check(root.querySelectorAll('.librow').length>3 && [...root.querySelectorAll('.librow')].some(b=>b.dataset.m==='cal') && [...root.querySelectorAll('.librow')].some(b=>b.dataset.m==='lift'), 'one search finds exercises in every section');
    check(doc.activeElement===q, 'typing keeps the focus in the search box');
    root.querySelector('.librow[data-m="str"]').click(); await pause(350);
    check(win.__hub.current()==='str' && !!rootOf(doc,'str').querySelector('#sheet.on'), 'a Strength exercise opens its how-to');
    rootOf(doc,'str').querySelector('#sheet.on [data-act="close-modal"]').click(); await pause(400);
    check(win.__hub.current()==='mix' && place(doc)==='library', 'closing it comes back to the Library');
    doc.querySelector('#subchips [data-f="lift"]').click(); await pause(400);
    check(win.__hub.current()==='lift' && rootOf(doc,'lift').getElementById('view').textContent.includes('Pull') && getComputedStyle(rootOf(doc,'lift').querySelector('.searchbar')).display==='none', 'Muscle’s library uses the same search, with no second box');

    // Settings: one sheet for everything, and Backup opens its Your data part
    doc.getElementById('setbtn').click(); await pause(200);
    const bk=doc.getElementById('bk'), groups=[...doc.querySelectorAll('#set-body details.grp')].map(d=>d.dataset.g);
    check(bk.open && ['general','program','kit','warm','lift','str'].every(g=>groups.includes(g)) && !!doc.getElementById('bk-copy'), 'Settings is one sheet: general, program, kit, warm-ups, each section, and Your data');
    doc.querySelector('#set-body [data-s="unit"][data-v="lb"]').click(); await pause(150);
    check(JSON.parse(localStorage.getItem('trainer.shell.unit'))==='lb' && JSON.parse(localStorage.getItem('strlog.v2')).settings.unit==='lb', 'units change for every section from one place');
    doc.querySelector('#set-body [data-s="plate"][data-v="2.5"]').click(); await pause(150);
    check(!JSON.parse(localStorage.getItem('trainer.shell.platesLb')).includes(2.5) && doc.querySelector('#set-body [data-s="plate"][data-v="2.5"]').getAttribute('aria-pressed')==='false', 'the kit is set here, for every section');
    doc.querySelector('#set-body [data-s="opt"][data-m="str"][data-k="rest"][data-v="240"]').click(); await pause(150);
    check(JSON.parse(localStorage.getItem('strlog.v2')).settings.rest===240, 'a section’s own option is set from its group');
    doc.querySelector('#set-body [data-s="wake"][data-v="0"]').click(); await pause(100);
    check(JSON.parse(localStorage.getItem('trainer.shell.wake'))===false, 'keeping the screen on is a setting');
    doc.getElementById('bk-done').click(); await pause(100);
    doc.getElementById('bkbtn').click(); await pause(250);
    check(bk.open && doc.activeElement===doc.getElementById('bk-title'), 'the header’s Backup button opens Settings at Your data');
    doc.getElementById('bk-done').click();
    // a section's own settings button opens the one sheet at its group
    win.__hub.go('cal'); await pause(200);
    rootOf(doc,'cal').querySelector('[data-act="settings"]').click(); await pause(250);
    check(bk.open && doc.querySelector('#set-body details[data-g="cal"]').open, 'a section’s settings button opens the sheet at its own group');
    doc.getElementById('bk-done').click();

    // program type: one section on its own makes Today that section's own
    doc.getElementById('setbtn').click(); await pause(150);
    doc.querySelector('#set-body [data-s="type"][data-v="str"]').click(); await pause(200);
    doc.getElementById('bk-done').click();
    doc.querySelector('.seg[data-d="today"]').click(); await pause(400);
    check(win.__hub.current()==='str' && place(doc)==='today' && !doc.getElementById('subnav').hidden && !!doc.querySelector('#subchips [data-f="program"]'), 'Strength only: Today is Strength’s own, with its plan a tap away');
    doc.getElementById('setbtn').click(); await pause(150);
    doc.querySelector('#set-body [data-s="type"][data-v="mix"]').click(); await pause(200);
    doc.getElementById('bk-done').click();
    doc.querySelector('.seg[data-d="today"]').click(); await pause(400);
    check(win.__hub.current()==='mix' && JSON.parse(localStorage.getItem('trainer.together')).on===true, 'back to Together, the week is as it was');

    // the check-in is one line on Today
    root=rootOf(doc,'mix');
    root.querySelector('.ciline [data-a="ci-q"][data-v="rough"]').click(); await pause(250);
    const c=JSON.parse(localStorage.getItem('trainer.together')).checkins.slice(-1)[0];
    check(c.quick==='rough' && c.w.sleep===2 && c.w.mood===2, 'one tap checks in: Rough counts as a low answer to each question');
    check(!root.querySelector('.ciline'), 'and the line gives way to today’s check-in');

    // focus mode's frame: the header and the navigation step back while it's on
    win.__sessionMode(true);
    check(getComputedStyle(doc.querySelector('.shellbar')).display==='none' && getComputedStyle(doc.querySelector('.sidebar')).display!=='none', 'focus mode hides the header and keeps the navigation, so a session is never a dead end');
    win.__sessionMode(false);
    check(getComputedStyle(doc.querySelector('.sidebar')).display!=='none', 'and they come back when it ends');

    // A person who trained one section before this navigation keeps that program from the first paint.
    frame.remove(); frame=null;
    const legacy={v:2, onboarded:true, route:'today', settings:{unit:'kg',sound:false,vibrate:false}, history:[{id:'old-str',name:'Old workout',date:Date.now()-864e5,entries:[],prs:[]}]};
    reset({'milo.persist':'1','strlog.v2':JSON.stringify(legacy)});
    ({win,doc}=await load());
    check(win.__hub.type()==='str' && win.__hub.current()==='str' && place(doc)==='today', 'legacy single-section history opens its own Today immediately');
    check(!rootOf(doc,'str').querySelector('[data-act="f-go"]'), 'legacy training does not force a new Together program');
    let prompted=0;
    const install=new win.Event('beforeinstallprompt',{cancelable:true});
    install.prompt=()=>{ prompted++; }; install.userChoice=Promise.resolve({outcome:'accepted'});
    win.dispatchEvent(install); await pause(100);
    check(!!rootOf(doc,'str').querySelector('[data-install-card]'), 'a standalone program offers installation after its first finished session');
    rootOf(doc,'str').querySelector('[data-install-go]').click(); await pause(150);
    check(prompted===1 && !rootOf(doc,'str').querySelector('[data-install-card]'), 'Install uses the browser prompt and removes the card after acceptance');

    // At 200% phone zoom the header folds, while all its actions remain available.
    frame.style.width='195px'; await pause(200);
    check(doc.documentElement.scrollWidth<=195, 'the shell fits a 195 px viewport without sideways scrolling');
    doc.getElementById('morebtn').click(); await pause(50);
    const settingBox=doc.getElementById('setbtn').getBoundingClientRect();
    check(doc.getElementById('morebtn').getAttribute('aria-expanded')==='true' && settingBox.left>=0 && settingBox.right<=195, 'More options keeps Settings on screen at high zoom');
    doc.getElementById('setbtn').click(); await pause(100);
    check(doc.getElementById('bk').open && doc.getElementById('morebtn').getAttribute('aria-expanded')==='false', 'the narrow header opens Settings and closes its options');
    check(doc.getElementById('bk').scrollWidth<=doc.getElementById('bk').clientWidth+1, 'Settings fits the narrow viewport');
    doc.getElementById('bk-done').click();
    frame.remove(); frame=null; reset({'milo.persist':'1','trainer.together':JSON.stringify(together)});
    ({win,doc}=await load('m=mix')); frame.style.width='195px'; await pause(200);
    check(doc.documentElement.scrollWidth<=195, 'Together’s workout prescriptions and program actions wrap at 195 px');

    result.textContent=results.join('\n')+'\nALL TESTS PASSED';
  } catch(error){
    result.textContent=results.join('\n')+'\nFAIL '+error.stack;
  } finally {
    if(frame){ frame.remove(); frame=null; }
    reset(original); Object.entries(originalSession).forEach(([k,v])=>sessionStorage.setItem(k,v));
    result.textContent+='\nOriginal Milo browser data restored.';
  }
})();
