(async function () {
  'use strict';
  const result=document.getElementById('result'), results=[];
  const managed=key=>/^(hyplog\.|strlog\.|proladder\.|trainer\.|milo\.)/.test(key);
  const take=()=>Object.fromEntries(Object.keys(localStorage).filter(managed).map(key=>[key,localStorage.getItem(key)]));
  const original=take();
  let frame=null;
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function check(ok,message){ if(!ok) throw new Error(message); results.push('PASS '+message); result.textContent=results.join('\n'); }
  function reset(data){ Object.keys(localStorage).filter(managed).forEach(key=>localStorage.removeItem(key)); Object.entries(data).forEach(([k,v])=>localStorage.setItem(k,v)); }
  async function load(){
    if(frame) frame.remove();
    frame=document.createElement('iframe'); frame.title='Together test app'; frame.style.cssText='width:430px;height:800px;border:1px solid #777';
    frame.src='../index.html?together-regression='+Date.now();
    document.getElementById('preview').appendChild(frame);
    for(let i=0;i<100;i++){ const r=frame.contentDocument&&frame.contentDocument.getElementById('m-mix'); if(r&&r.shadowRoot&&r.shadowRoot.getElementById('view')&&r.shadowRoot.getElementById('view').children.length) return {win:frame.contentWindow, doc:frame.contentDocument}; await pause(50); }
    throw new Error('Together did not start');
  }
  const place=doc=>(doc.querySelector('.seg[aria-current="page"]')||{dataset:{}}).dataset.d;
  const saved=()=>JSON.parse(localStorage.getItem('trainer.together'));
  // Start Day: before the first workout the health check is offered once, and skipping it starts the day
  async function startDay(root){ root.querySelector('[data-a="start-day"]').click(); await pause(150); const sk=root.querySelector('[data-a="o-skip"]'); if(sk) sk.click(); }
  const ladder={v:2, onboarded:true, route:'today', settings:{sound:false, vibrate:false, rest:0}, rung:{pull:2, pushh:3, core:1, row:1}, placed:{pull:true, pushh:true, core:true, row:true, scap:true},
    history:[], tests:[], active:null, goals:[{id:'goal-a', key:'pullup1', n:'First strict pull-up', l:'pull', r:4, std:1, sup:['row','core'], added:1, achieved:null}]};
  try {
    // a new person opens on Today, at a first run of two taps
    reset({'milo.persist':'1'});
    let {win,doc}=await load();
    let root=doc.getElementById('m-mix').shadowRoot;
    check(place(doc)==='today' && !!root.querySelector('[data-a="f-go"]') && !root.querySelector('[data-a="d-mins"]'), 'a new person opens on Today, at a first run that asks only what, how often and units');
    root.querySelector('[data-a="f-sec"][data-m="str"]').click();
    check(!root.querySelector('[data-a="f-go"]').disabled, 'one kind of training is enough to build a program');
    root.querySelector('[data-a="f-go"]').click(); await pause(300);
    const go=root.querySelector('[data-a="start-day"]');
    check(!!go && go.textContent.includes('Start Day 1') && go.getBoundingClientRect().bottom<=800 && !root.textContent.includes('Make this block yours'), 'Build goes straight to Today, with Start Day 1 above the fold and no page forced open');
    check(saved().mins===60 && saved().exp==='intermediate' && !saved().kit, 'the first run assumes a full gym, an hour and some training behind you');
    root.querySelector('[data-a="t-new"]').click(); await pause(200);
    check(root.textContent.includes('Make this block yours') && !!root.querySelector('[data-a="t-pick"][data-t="lift"][data-k="legs"]') && !root.querySelector('[data-a="t-discard"]'), 'customizing a block is a link, and with no changes it has one Start');
    root.querySelector('[data-a="t-save"]').click(); await pause(300);
    let P=saved().plan;
    check(P && P.dose.str==='build' && P.week===1 && P.weeks===5, 'Strength alone gets a building dose in a five-week block');
    const ex={}; P.days.forEach(d=>d.str.forEach(x=>{ (ex[x.id]||(ex[x.id]=[])).push(x.heavy); }));
    check(Object.values(ex).every(h=>h.filter(Boolean).length===1), 'each lift has exactly one heavy exposure a week');
    check(P.days.every(d=>!(d.str.some(x=>x.a==='legs'&&x.heavy)&&d.str.some(x=>x.a==='hips'))), 'heavy squats and deadlifts are on different days');
    root.querySelector('[data-a="start-day"]').click(); await pause(150);
    const without=root.querySelector('[data-a="o-skip"]');
    check(!!without && without.getBoundingClientRect().bottom<=800, 'the optional health check can be skipped without scrolling past its questions');
    without.click(); await pause(250);
    check(saved().offered && !!saved().run && win.__hub.current()==='str', 'skipping the health check starts the workout and saves that it was offered');
    frame.remove(); frame=null;

    // all three, ranked by the suggestion: Strength builds, Ladder moderate, Muscle maintains
    reset({'milo.persist':'1', 'proladder.v1':JSON.stringify(ladder), 'trainer.together':JSON.stringify({v:1, on:true, secs:['lift','str','cal'], days:4, mins:0})});
    ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot;
    check(place(doc)==='today' && !!root.querySelector('[data-a="start-day"]'), 'with all three chosen, Today shows the next day');
    P=saved().plan;
    check(P.dose.str==='build' && P.dose.cal==='moderate' && P.dose.lift==='maintain', 'the order sets the dose: build, moderate, maintain');
    const cov=new Set(P.days.flatMap(d=>d.lift.map(x=>x.mu)));
    check(!cov.has('quad') && !cov.has('chest'), 'Muscle leaves muscles the heavy lifts already cover');
    check(P.days.every(d=>d.lift.every(x=>x.sets>=1&&x.sets<=4)), 'no muscle gets more than four Muscle sets in a day');
    check(root.textContent.includes('Your program') && root.textContent.includes('Strength · Build'), 'the program card shows each section’s dose');

    // customizing a block: more for a muscle group, an exercise you pick, a lift left out
    const setsOf=(P,mu)=>P.days.reduce((t,d)=>t+d.lift.filter(x=>x.mu===mu).reduce((a,x)=>a+x.sets,0),0);
    // a muscle's weekly sets: its own Muscle sets plus everything else, in full where it is a main muscle and half where it helps
    const weekOf=(P,mu)=>Math.round(setsOf(P,mu)+((P.cov||{})[mu]||0));
    const before=P.goal.bi;
    root.querySelector('[data-a="t-edit"]').click(); await pause(200);
    check(root.textContent.includes('Customize this block'), 'Customize this block opens the block’s parts');
    root.querySelector('[data-a="t-focus"][data-g="Arms"][data-v="more"]').click(); await pause(150);
    root.querySelector('[data-a="t-focus"][data-g="Core"][data-v="skip"]').click(); await pause(150);
    // one muscle of a group left out: traps in Back
    root.querySelector('[data-a="t-mu"][data-k="trap"]').click(); await pause(150);
    check(root.querySelector('[data-a="t-mu"][data-k="trap"]').getAttribute('aria-pressed')==='false' && root.textContent.includes('Traps is left out'), 'a muscle in a group can be tapped off on its own');
    check(root.textContent.includes('sets a week for each muscle, instead of') && root.querySelector('.tnums'), 'More, Normal, Less and Skip say what they mean in sets, and each group shows its weekly sets');
    // the exercise library for a muscle: every exercise that works it, and nothing that reopens after you choose
    const rows=()=>[...root.querySelectorAll('[data-a="t-pick"][data-t="ex"]')].map(b=>b.dataset.k);
    const k0=rows()[0]; let pickEx=null;
    check(!!k0 && !root.querySelector('select'), 'each muscle’s exercise opens a library, not a dropdown');
    root.querySelector(`[data-a="t-pick"][data-t="ex"][data-k="${k0}"]`).click(); await pause(150);
    check(root.textContent.includes('Exercises for') && root.querySelectorAll('[data-a="t-choose"]').length>1, 'the exercise library opens for the muscle');
    // several picks for one muscle, which Together places on its days
    const ids=[...root.querySelectorAll('[data-a="t-choose"]')].map(b=>b.dataset.id).filter(Boolean), picks=[ids[ids.length-1], ids[0]]; pickEx=picks[0];
    for(const id of picks){ root.querySelector(`[data-a="t-choose"][data-id="${id}"]`).click(); await pause(120); }
    check(picks.every(id=>root.querySelector(`[data-a="t-choose"][data-id="${id}"]`).getAttribute('aria-pressed')==='true') && root.querySelector('.tday'), 'you can pick more than one exercise, and each shows its days');
    // one day's exercise changed on its own, then handed back to Together
    { const dr=root.querySelector('[data-a="t-day"]'), d=dr&&dr.dataset.d, pin=ids.find(id=>!picks.includes(id));
      check(!!dr && !!pin, 'each day the muscle lands on is listed, to change on its own');
      win.scrollTo(0, 300); const y0=win.scrollY; dr.click(); await pause(150);
      check(root.textContent.includes('on Day '+(+d+1)) && !!root.querySelector('[data-a="t-day-cancel"]'), 'a day opens its own list');
      root.querySelector(`[data-a="t-choose"][data-id="${pin}"]`).click(); await pause(150);
      const row=()=>root.querySelector(`[data-a="t-day"][data-d="${d}"]`);
      check(row() && row().textContent.includes('Your pick for this day') && !!root.querySelector('[data-a="t-back"]'), 'the day takes the exercise you chose, back in the muscle’s list');
      check(y0>0 && Math.abs(win.scrollY-y0)<2, 'and back where you were in it, not at the top');
      row().click(); await pause(150); root.querySelector('[data-a="t-choose"][data-id=""]').click(); await pause(150);
      check(!row().textContent.includes('Your pick for this day'), 'and Let Together pick hands the day back'); }
    root.querySelector('[data-a="t-back"]').click(); await pause(150);
    check(root.textContent.includes('Customize this block') && root.querySelector(`[data-a="t-pick"][data-k="${k0}"]`).textContent.includes('your 2 picks'), 'Done goes back to the block, with your picks shown');
    // making your own exercise, which joins Muscle's library
    const k1=rows().find(k=>k!==k0);
    if(k1){ root.querySelector(`[data-a="t-pick"][data-t="ex"][data-k="${k1}"]`).click(); await pause(150);
      root.querySelector('[data-a="t-make"]').click(); await pause(150);
      const nm=root.getElementById('tmk-name'); nm.value='Test Own Exercise'; nm.dispatchEvent(new win.Event('input',{bubbles:true}));
      root.querySelector('[data-a="t-mk"][data-f="comp"][data-v="0"]').click(); await pause(100);
      root.querySelector('[data-a="t-mk-save"]').click(); await pause(400);
      const mine=(JSON.parse(localStorage.getItem('hyplog.v1')||'{}').exercises||[]).find(e=>e.name==='Test Own Exercise');
      check(mine && mine.custom && mine.primary.includes(k1) && !mine.comp, 'an exercise you make joins the Muscle library');
      check(root.querySelector(`[data-a="t-choose"][data-id="${mine.id}"]`).getAttribute('aria-pressed')==='true', 'and it is picked for the muscle, back in its list');
      root.querySelector('[data-a="t-back"]').click(); await pause(150); }
    // Ladder's goals, changed from the block: remove one, take it back, and add one without being left in Ladder
    { const rm=root.querySelector('[data-a="t-goal-rm"]'), lg=()=>JSON.parse(localStorage.getItem('proladder.v1')).goals.filter(g=>!g.achieved).length;
      check(!!rm && root.textContent.includes('First strict pull-up') && root.textContent.includes('% of the way'), 'Ladder’s goals show in the block, each with where you are');
      rm.click(); await pause(300);
      check(lg()===0 && root.querySelector('#toast [data-a="t-goal-back"]'), 'a goal can be removed here, with Undo');
      root.querySelector('#toast [data-a="t-goal-back"]').click(); await pause(300);
      check(lg()===1, 'Undo puts the goal back');
      root.querySelector('[data-a="t-goal-add"]').click(); await pause(300);
      const lad=doc.getElementById('m-cal').shadowRoot, shown=win.__hub.current()==='cal' && !!lad.querySelector('#sheet.on');
      lad.querySelector('#sheet.on .sheet-head [data-act="close-modal"]').click(); await pause(400);
      check(shown && win.__hub.current()==='mix' && root.textContent.includes('Customize this block'), 'Add a goal opens Ladder’s goal chooser, and closing it comes back to the block'); }
    const lats=root.querySelector('[data-a="t-pick"][data-t="lift"][data-k="lats"]');
    if(lats){ lats.click(); await pause(150);
        root.querySelector('[data-a="t-choose"][data-id="-"]').click(); await pause(150); }
    root.querySelector('[data-a="t-save"]').click(); await pause(300);
    P=saved().plan;
    check(P.goal.bi>before && weekOf(P,'bi')>=P.goal.bi-1, 'More for arms raises the biceps target, and the week meets it');
    check(!P.days.some(d=>d.lift.some(x=>x.mu==='abs'||x.mu==='obli')), 'Skip leaves core to the rest of the week');
    check(!P.days.some(d=>d.lift.some(x=>x.mu==='trap'||['rack-pull','shrug','barbell-shrug','cable-shrug','cable-upright-row'].includes(x.exId))) && saved().tune.mu.trap==='skip', 'a muscle left out gets no exercises, none aimed at it for other muscles either');
    { const xs=P.days.flatMap(d=>d.lift).filter(x=>x.mu===k0).map(x=>x.exId), mine=saved().tune.ex[k0];
      check(xs.length && xs.every(id=>mine.includes(id)), 'your picks train that muscle'); }
    check(!lats || !P.days.some(d=>d.str.some(x=>x.a==='lats')), 'a strength area you leave out is left out');
    check(P.week===1 && root.textContent.includes('Customized:'), 'customizing keeps the week and shows what you changed');
    // a new block starts again at week 1
    const t=saved(); t.plan.week=3; localStorage.setItem('trainer.together', JSON.stringify(t));
    ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot;
    root.querySelector('[data-a="t-edit"]').click(); await pause(150);
    check(!root.querySelector('[data-a="t-save"]') && !!root.querySelector('[data-a="t-cancel"]'), 'with nothing changed, customizing has one Done button');
    root.querySelector('[data-a="t-focus"][data-g="Legs"][data-v="less"]').click(); await pause(150);
    check(!!root.querySelector('[data-a="t-save"]') && !!root.querySelector('[data-a="t-discard"]'), 'with a change, it offers to save it or discard it');
    root.querySelector('[data-a="t-discard"]').click(); await pause(150);
    check(!root.querySelector('[data-a="t-save"]') && !!root.querySelector('[data-a="t-cancel"]'), 'Discard changes puts the block back as it was');
    root.querySelector('[data-a="t-focus"][data-g="Legs"][data-v="less"]').click(); await pause(150);
    root.querySelector('[data-a="t-save"]').click(); await pause(250);
    check(saved().plan.week===3, 'changes mid-block keep you on the same week');
    root.querySelector('[data-a="t-new"]').click(); await pause(150);
    check(root.textContent.includes('New block'), 'Start a new block opens the new block to customize');
    root.querySelector('[data-a="t-save"]').click(); await pause(250);
    check(saved().plan.week===1 && saved().tune.focus.Arms==='more', 'a new block starts at week 1 and keeps your choices');
    check(saved().next===0 && saved().roundAt>0 && !root.querySelector('.day.fin') && !root.querySelector('.dchip.skipped'), 'a new block starts on a fresh week at Day 1, with nothing marked done or skipped');

    // skipping a day, and taking it back
    { const c=root.querySelector('[data-a="ci-skip"]'); if(c){ c.click(); await pause(150); } }
    root.querySelector('[data-a="skip-day"]').click(); await pause(200);
    check(saved().next>0 && saved().log.slice(-1)[0].skipped && root.querySelector('.dchip.skipped'), 'Skip this day marks it skipped and moves on');
    root.querySelector('.undoline').click(); await pause(200);
    check(saved().next===0 && !saved().log.some(e=>e.skipped), 'Undo puts the skipped day back');
    // the block's weeks: skip ahead, go back, start one again, and undo
    root.querySelector('[data-a="w-next"]').click(); await pause(200);
    check(saved().plan.week===2 && saved().next===0, 'skipping ahead moves the block on a week, from Day 1');
    root.querySelector('[data-a="w-prev"]').click(); await pause(200);
    check(saved().plan.week===1, 'you can go back a week');
    root.querySelector('.undoline').click(); await pause(200);
    check(saved().plan.week===2, 'Undo takes a week change back');
    root.querySelector('[data-a="w-again"]').click(); await pause(200);
    check(saved().plan.week===2 && saved().next===0, 'a week can be started again from Day 1');
    P=saved().plan;

    // starting a day uses Together’s own content and leaves the trainers’ own plans alone
    const ci=root.querySelector('[data-a="ci-skip"]'); if(ci){ ci.click(); await pause(150); }
    const d=P.kinds.findIndex(k=>k.includes('str'));
    root.querySelector('[data-a="pickday"]').click(); await pause(100);
    root.querySelector(`[data-a="setnext"][data-d="${d}"]`).click(); await pause(150);
    await startDay(root); await pause(500);
    const st=JSON.parse(localStorage.getItem('strlog.v2'));
    check(st.active && st.active.plan===null && st.active.entries.length===P.days[d].str.length, 'Strength starts the lifts Together planned, not tied to a Strength program');
    check(st.active.entries.every(e=>e.sc && (e.sc.t==='rpe'||e.sc.t==='dp'||e.sc.t==='var')), 'each lift carries Together’s prescription');
    check(!st.program, 'Strength has no program of its own made for it');
    check(saved().run && saved().run.parts[0].m==='str', 'the day runs in your order, Strength first');
    { const hub=win.__hub, strip=doc.getElementById('tgstrip'), other=hub.current()!=='mix', shown=!strip.hidden;
      hub.go('mix'); await pause(250);
      check(other && shown && strip.hidden, 'the day strip shows on the trainer tabs, not over Together’s own page'); }
    // ending the day with a part still going: you choose what happens to its session
    root.querySelector('[data-a="end-day"]').click(); await pause(200);
    check(root.querySelector('[data-how="save"]') && root.querySelector('[data-how="leave"]') && root.querySelector('[data-how="drop"]'), 'ending the day with a part still going offers to save it, leave it open or drop it');
    root.querySelector('[data-a="end-day"][data-how="leave"]').click(); await pause(300);
    check(!saved().run && saved().log.slice(-1)[0].parts.some(p=>p[1]==='left') && !root.querySelector('[data-a="end-day"]'), 'the day ends, and its End button goes with it');
    check(!!JSON.parse(localStorage.getItem('strlog.v2')).active && root.textContent.includes('open'), 'the session left open is still there to finish, and the week says so');
    // the next Strength day starts beside the session left open, which stays open to finish
    { const old=JSON.parse(localStorage.getItem('strlog.v2')).active.id, d2=P.kinds.findIndex((k,i)=>i!==d && k.includes('str'));
      check(d2>=0, 'the week has a second Strength day');
      root.querySelector('[data-a="pickday"]').click(); await pause(100);
      root.querySelector(`[data-a="setnext"][data-d="${d2}"]`).click(); await pause(150);
      await startDay(root); await pause(500);
      const S=JSON.parse(localStorage.getItem('strlog.v2')), part=saved().run.parts.find(p=>p.m==='str');
      check(S.active.id!==old && S.parked.map(p=>p.id).join()===old && part.st==='run' && part.sid===S.active.id, 'a part starts with a session already open in its trainer, and that one stays open beside it');
      win.__hub.go('mix'); await pause(250);
      root.querySelector('[data-a="end-day"]').click(); await pause(200);
      root.querySelector('[data-a="end-day"][data-how="drop"]').click(); await pause(300);
      const S2=JSON.parse(localStorage.getItem('strlog.v2'));
      check(!S2.active && S2.parked.map(p=>p.id).join()===old, 'ending the day ends its own part’s session and leaves the other open');
      const ended=win.__hub.api('str').end(false, old); await pause(250);
      check(ended && !JSON.parse(localStorage.getItem('strlog.v2')).parked.length, 'the one left open ends by name too'); }
    // a new block, even mid-day
    win.__hub.api('str').end(false); await pause(200); win.__hub.go('mix'); await pause(250);
    await startDay(root); await pause(500); win.__hub.go('mix'); await pause(250);
    check(!!saved().run, 'the next day starts');
    root.querySelector('[data-a="t-new"]').click(); await pause(150); root.querySelector('[data-a="t-save"]').click(); await pause(300);
    check(!saved().run && saved().plan.week===1 && saved().next===0, 'a new block starts mid-day: the day ends and the block begins at Day 1');
    // finishing a part moves straight on to the next one, so the day runs as one session
    { const P2=saved().plan, d3=P2.kinds.findIndex(k=>k[0]==='str'&&k.length>1);
      check(d3>=0, 'the week has a day that starts with Strength and has more after it');
      root.querySelector('[data-a="pickday"]').click(); await pause(100);
      root.querySelector(`[data-a="setnext"][data-d="${d3}"]`).click(); await pause(150);
      { const c=root.querySelector('[data-a="ci-skip"]'); if(c){ c.click(); await pause(150); } }
      await startDay(root); await pause(500);
      sessionStorage.removeItem('milo.back');
      ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot; await pause(250);
      check(win.__hub.current()==='str' && place(doc)==='train', 'reloading mid-part returns to its session');
      const sr=doc.getElementById('m-str').shadowRoot;
      sr.querySelectorAll('input[data-field="w"]').forEach(i=>{ if(!i.value){ i.value='40'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); } }); await pause(150);
      { const n=sr.querySelectorAll('[data-act="toggle-done"]').length; for(let i=0;i<n;i++){ const t=sr.querySelectorAll('[data-act="toggle-done"]')[i]; if(t){ t.click(); await pause(60); } } }
      await pause(200);
      sr.querySelector('[data-act="finish"]').click(); await pause(400);
      { const nx=sr.querySelector('#sheet.on [data-act="tg-next"]'); check(!!nx && /^Next: /.test(nx.textContent.trim()), 'the finish screen’s main button is the next part'); nx.click(); await pause(300); }
      for(let i=0;i<4;i++){ const c=sr.querySelector('#sheet.on [data-act="close-modal"], [role="dialog"][aria-modal="true"] [data-act="close-modal"]'); if(!c) break; c.click(); await pause(300); }
      await pause(400);
      const run=saved().run;
      check(run && run.parts[0].st==='done' && run.parts[1].st==='run' && win.__hub.current()===run.parts[1].m, 'finishing Strength starts the day’s next part straight away');
      win.__hub.dest('today'); await pause(200);
      check(!!root.querySelector('.backto [data-a="resume"]') && root.querySelector('#view .stack').firstElementChild.classList.contains('backto'), 'Today leads with Resume for its own running part');
      check(root.textContent.includes('Tune your program'), 'Tune your program appears after the first finished part, before the whole day is done');
      win.__hub.api(run.parts[1].m).end(false); await pause(300); win.__hub.go('mix'); await pause(250); }
    // exercise choice for growth: each part of a muscle trained, and long-length exercises first
    { frame.remove(); frame=null;
      reset({'milo.persist':'1', 'trainer.together':JSON.stringify({v:1, on:true, secs:['lift'], days:4, mins:null, prio:['lift'], kit:null, exp:'intermediate', log:[], checkins:[], next:0})});
      ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot;
      const by={}; saved().plan.days.forEach(d=>d.lift.forEach(x=>{ (by[x.mu]||(by[x.mu]=[])).push(x.exId); }));
      check((by.quad||[]).includes('leg-extension') && (by.quad||[]).some(id=>id!=='leg-extension'), 'quads get a squat or press and a leg extension, which grows the part squats miss');
      check((by.tri||[]).includes('overhead-ext') && !(by.tri||[]).includes('tricep-pushdown') && (by.ham||[]).includes('leg-curl'), 'triceps and hamstrings start from the exercises that train them at long lengths');
      // re-optimize the other days around a day you set, on a muscle trained on two days or more; then hand the day back
      { root.querySelector('[data-a="t-edit"]').click(); await pause(150);
        root.querySelector('[data-a="t-pick"][data-t="ex"][data-k="tri"]').click(); await pause(150);
        check(['overhead-ext','seated-db-tri-ext'].includes(root.querySelector('[data-a="t-choose"]:not([data-id=""])').dataset.id) && root.textContent.includes('Grew it more in trials'), 'the library lists the exercises best for growth first, and says why');
        root.querySelector('[data-a="t-back"]').click(); await pause(150);
        const rows=()=>[...root.querySelectorAll('[data-a="t-pick"][data-t="ex"]')].map(b=>b.dataset.k); let done=false;
        for(const k of rows()){ root.querySelector(`[data-a="t-pick"][data-t="ex"][data-k="${k}"]`).click(); await pause(150);
          const ds=[...root.querySelectorAll('[data-a="t-day"]')];
          if(ds.length>1 && !done){ const d=ds[1].dataset.d, at=()=>root.querySelector(`[data-a="t-day"][data-d="${d}"]`);
            // more picks than days: every one is used, two of them sharing a day
            const ids=[...root.querySelectorAll('[data-a="t-choose"]')].map(b=>b.dataset.id).filter(Boolean), pk=ids.slice(0, ds.length+1), id=ids.find(x=>!pk.includes(x));
            for(const x of pk){ root.querySelector(`[data-a="t-choose"][data-id="${x}"]`).click(); await pause(120); }
            const vals=()=>[...root.querySelectorAll('[data-a="t-day"] .tval')].map(v=>v.textContent), nm=x=>root.querySelector(`[data-a="t-choose"][data-id="${x}"] b`).textContent;
            check(pk.every(x=>vals().join('|').includes(nm(x))) && vals().some(v=>v.includes(' + ')), 'with more picks than days, every pick is used, two of them sharing a day');
            check([...root.querySelectorAll('[data-a="t-day"]')].every(b=>(b.querySelector('.twhy')||{}).textContent), 'each day says why it has its exercise');
            const other=()=>[...root.querySelectorAll('[data-a="t-day"]')].filter(b=>b.dataset.d!==d).map(b=>b.querySelector('.tval').textContent).join('|'), was=other();
            at().click(); await pause(150);
            root.querySelector(`[data-a="t-choose"][data-id="${id}"]`).click(); await pause(150);
            check(other()===was && !!root.querySelector('[data-a="t-refit"]'), 'setting one day leaves the other days as they were, with a button to re-optimize them');
            check(at().querySelector('.tval').textContent===nm(id), 'a day you set has just the exercise you set, even with more picks than days');
            root.querySelector('[data-a="t-refit"]').click(); await pause(150);
            check(!root.querySelector('[data-a="t-refit"]') && /changed to go with|nothing changed/.test(root.querySelector('#toast').textContent), 'Re-optimize says what it changed, and the button goes once there is nothing left to do');
            check(at().textContent.includes('Your pick for this day') && at().querySelector('.tval').textContent===nm(id), 'Re-optimize never changes the day you set, or adds to it');
            // a second day you set: both stay as you set them, and your picks stay picked
            const d0=[...root.querySelectorAll('[data-a="t-day"]')].map(b=>b.dataset.d).find(x=>x!==d), id2=ids.find(x=>!pk.includes(x)&&x!==id), at0=()=>root.querySelector(`[data-a="t-day"][data-d="${d0}"]`);
            at0().click(); await pause(150); root.querySelector(`[data-a="t-choose"][data-id="${id2}"]`).click(); await pause(150);
            if(root.querySelector('[data-a="t-refit"]')){ root.querySelector('[data-a="t-refit"]').click(); await pause(150); }
            check(at().textContent.includes(nm(id)) && at0().textContent.includes('Your pick for this day') && at0().textContent.includes(nm(id2))
              && pk.every(x=>root.querySelector(`[data-a="t-choose"][data-id="${x}"]`).getAttribute('aria-pressed')==='true'), 'every day you set stays as you set it, and your picks stay picked');
            at().click(); await pause(150); root.querySelector('[data-a="t-choose"][data-id=""]').click(); await pause(150);
            at0().click(); await pause(150); root.querySelector('[data-a="t-choose"][data-id=""]').click(); await pause(150);
            for(const x of pk){ root.querySelector(`[data-a="t-choose"][data-id="${x}"]`).click(); await pause(120); }
            done=true; }
          root.querySelector('[data-a="t-back"]').click(); await pause(150); if(done) break; }
        check(done, 'a muscle trained on two days or more is there to re-optimize');
        root.querySelector('[data-a="t-cancel"]').click(); await pause(150); } }
    // recommended Ladder goals: more goals than Ladder has room for get a keep-and-pause recommendation
    { const G={pullup1:['First strict pull-up','pull',4,1], pushup20:['20 strict push-ups','pushh',3,20], frontlever:['Full front lever, 5 s','frontlever',4,5], tuckplanche:['Tuck planche, 10 s','planche',1,10]};
      const four=Object.assign({}, ladder, {goals:Object.keys(G).map((k,i)=>({id:'rg'+i, key:k, n:G[k][0], l:G[k][1], r:G[k][2], std:G[k][3], sup:['core'], added:1, achieved:null}))});
      frame.remove(); frame=null;   // first, so its exit save can't write over the new data
      reset({'milo.persist':'1', 'proladder.v1':JSON.stringify(four)});
      ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot;
      win.__hub.api('mix').setup('secs'); await pause(100);
      root.querySelector('[data-a="d-sec"][data-m="cal"]').click(); root.querySelector('[data-a="d-save"]').click(); await pause(300);
      root.querySelector('[data-a="t-edit"]').click(); await pause(200);
      const rec=root.querySelector('.trec'), C=win.__hub.api('cal'), lg=()=>JSON.parse(localStorage.getItem('proladder.v1')).goals.length;
      check(rec && /Recommended: (one goal|two goals) at a time/.test(rec.textContent) && rec.querySelector('[data-a="t-rec-keep"]'), 'with more goals than Ladder has room for, Together recommends which to keep');
      check(/each gets about \d+ sets? a week/.test(rec.textContent) && /each would get about \d+/.test(rec.textContent), 'it says how many sets each goal gets now, and kept to its recommendation');
      const kept=rec.querySelector('.tlist').textContent;
      check(!(kept.includes('front lever') && kept.includes('planche')), 'it never keeps two straight-arm skills together');
      const r=C.trial([{key:'frontlever'},{key:'tuckplanche'}], 2, k=>C.upcoming(k));
      check(r.length===2 && r.every(x=>x.sets>0) && lg()===4, 'trying out other goals plans a week for them without changing yours');
      rec.querySelector('[data-a="t-rec-keep"]').click(); await pause(300);
      const left=lg(); check(left>=1 && left<4 && root.querySelector('#toast [data-a="t-goal-back"]'), 'Keep pauses the other goals, with Undo');
      root.querySelector('#toast [data-a="t-goal-back"]').click(); await pause(300);
      check(lg()===4, 'Undo brings every paused goal back');
      // no goals yet: what to start with, on the block and on the main page, added through Ladder's own placement
      frame.remove(); frame=null;
      reset({'milo.persist':'1', 'proladder.v1':JSON.stringify(Object.assign({}, ladder, {goals:[]}))});
      ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot;
      win.__hub.api('mix').setup('secs'); await pause(100);
      root.querySelector('[data-a="d-sec"][data-m="cal"]').click(); root.querySelector('[data-a="d-save"]').click(); await pause(300);
      root.querySelector('[data-a="t-edit"]').click(); await pause(200);
      check(root.querySelector('.trec [data-a="t-rec-add"]') && root.querySelector('.trec').textContent.includes('Best fit'), 'with no goals, the block recommends some to start with');
      root.querySelector('[data-a="t-cancel"]').click(); await pause(300);
      const add=root.querySelector('.trec [data-a="t-rec-add"]'), key=add&&add.dataset.k;
      check(!!add && root.querySelector('.trec').textContent.includes('Recommended to start'), 'and so does the main page, until there is one');
      add.click(); await pause(400);
      const lad=doc.getElementById('m-cal').shadowRoot, there=win.__hub.current()==='cal' && !!lad.querySelector('#sheet.on');
      check(there && JSON.parse(localStorage.getItem('proladder.v1')).goals.some(g=>g.key===key), 'Add sets the goal and opens Ladder to place it');
      lad.querySelector('#sheet.on [data-act="close-modal"]').click(); await pause(400);
      check(win.__hub.current()==='mix', 'and closing Ladder comes back to Together'); }
    // Together keeps to exercises you have logged, so their weights carry on
    { frame.remove(); frame=null; reset({'milo.persist':'1'});
      ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot;
      win.__hub.api('mix').setup('secs'); await pause(100);
      root.querySelector('[data-a="d-sec"][data-m="lift"]').click(); root.querySelector('[data-a="d-save"]').click(); await pause(300);
      const cat=win.__hub.api('lift').catalog(), xs=saved().plan.days.flatMap(d=>d.lift), taken=new Set(xs.map(x=>x.exId));
      // another exercise just for the same muscle, of the same kind and equipment, that this block didn't choose
      const other=x=>{ const a=cat.find(e=>e.id===x.exId); return a && cat.find(e=>e.id!==a.id && !taken.has(e.id) && e.p.length===1 && e.p[0]===x.mu && e.comp===a.comp && e.equipment===a.equipment); };
      const x0=xs.find(other), alt=x0&&other(x0);
      check(!!alt, 'a muscle in the block has another exercise that would do');
      const hy=JSON.parse(localStorage.getItem('hyplog.v1')||'{"v":1}');
      hy.history=[{id:'logged-1', name:'Earlier', date:Date.now()-3*86400000, durationSec:600, prs:[], entries:[{exId:alt.id, name:alt.name, primary:alt.p, secondary:alt.s, equipment:alt.equipment,
        sets:[{type:'work', weight:20, reps:10, rir:2, done:true}]}]}];
      frame.remove(); frame=null; localStorage.setItem('hyplog.v1', JSON.stringify(hy));
      ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot;
      root.querySelector('[data-a="t-new"]').click(); await pause(150); root.querySelector('[data-a="t-save"]').click(); await pause(300);
      check(saved().plan.days.some(d=>d.lift.some(x=>x.exId===alt.id && x.mu===x0.mu)), 'a new block picks the exercise you have logged for a muscle, so its weights carry on'); }
    // the set-up asks for your weekdays, an optional life stage and a short health check; each day shows the stop signs,
    // the check-in asks whether you are unwell, and a sore joint offers a gentler swap
    { frame.remove(); frame=null; reset({'milo.persist':'1'});
      ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot;
      const tap=async sel=>{ root.querySelector(sel).click(); await pause(120); };
      win.__hub.api('mix').setup('secs'); await pause(100);
      await tap('[data-a="d-sec"][data-m="str"]'); await tap('[data-a="d-days"][data-v="2"]');
      await tap('[data-a="d-wd"][data-v="3"]');
      check(root.querySelectorAll('[data-a="d-wd"].on').length===2, 'two training days a week at least');
      for(const v of [5,0,6,3]) await tap(`[data-a="d-wd"][data-v="${v}"]`);
      check(root.querySelector('[data-a="d-days"][data-v="2"]').classList.contains('on'), 'the number of days follows the weekdays you tap');
      await tap('[data-a="d-stage"][data-v="older"]'); await tap('[data-a="d-q"][data-v="0"]');
      check(root.textContent.includes('Check with a doctor or physio'), 'a yes on the health check suggests seeing a professional, without blocking anything');
      await tap('[data-a="d-save"]');
      const t=saved();
      check(t.days===2 && t.wd.join()==='5,6' && t.stage==='older' && t.screen.yes.join()==='0', 'weekdays, life stage and the health check are kept');
      check(root.textContent.includes('Sat and Sun') && root.textContent.includes('This block stays gentle'), 'back-to-back weekdays are named, and the block stays gentle');
      check(!!root.querySelector('.redflag') && root.querySelector('.redflag').textContent.includes('chest pain'), 'the day shows when to stop and get help');
      check(!!root.querySelector('.ciline [data-a="ci-q"]'), 'the check-in is one line, How do you feel');
      await tap('[data-a="ci-edit"]');
      await tap('[data-a="ci-ill"][data-v="sick"]');
      check(!root.querySelector('#cisave').disabled, 'Unwell today is enough for a check-in');
      await tap('[data-a="ci-pain"][data-v="1"]'); await tap('[data-a="ci-add-pain"][data-k="back"]'); await tap('#cisave');
      check(saved().checkins.slice(-1)[0].ill==='sick' && root.textContent.includes('rest today'), 'a fever or symptoms below the neck suggest rest');
      const sw=root.querySelector('[data-a="swap-yes"]');
      check(!!sw && /instead of/.test(sw.closest('.note').textContent), 'a sore lower back offers a gentler swap for the day');
      sw.click(); await pause(200);
      check(saved().swap && saved().swap.ids.length>0 && !root.querySelector('[data-a="swap-yes"]'), 'the swap is taken for today');
      // a yes given mid-block, in a save that also starts a new block: that block ends and counts, and the new one is gentle
      const mid=saved(), now=Date.now(); mid.screen=null; mid.blocks=0; mid.plan.at=now-3*86400000;
      mid.log=[{date:now-3600000, start:now-7200000, day:0, parts:[['str','done','x1']]}];
      frame.remove(); frame=null; localStorage.setItem('trainer.together', JSON.stringify(mid));
      ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot;
      await tap('[data-a="edit"]'); await tap('[data-a="d-days"][data-v="3"]'); await tap('[data-a="d-q"][data-v="0"]');
      await tap('[data-a="d-save"]');
      const t2=saved();
      check(t2.blocks===1 && t2.screen.blk===1 && t2.plan.week===1 && root.textContent.includes('This block stays gentle'), 'a yes given with a change that starts a new block makes that new block gentle'); }
    result.textContent=results.join('\n')+'\nALL TESTS PASSED';
  } catch(error){
    result.textContent=results.join('\n')+'\nFAIL '+error.stack;
  } finally {
    if(frame){ frame.remove(); frame=null; }
    reset(original);
    result.textContent+='\nOriginal Milo browser data restored.';
  }
})();
