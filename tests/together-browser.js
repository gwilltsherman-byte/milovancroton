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
  const tabs=doc=>[...doc.querySelectorAll('.seg')].filter(b=>!b.hidden).map(b=>b.dataset.m).join(',');
  const saved=()=>JSON.parse(localStorage.getItem('trainer.together'));
  const ladder={v:2, onboarded:true, route:'today', settings:{sound:false, vibrate:false, rest:0}, rung:{pull:2, pushh:3, core:1, row:1}, placed:{pull:true, pushh:true, core:true, row:true, scap:true},
    history:[], tests:[], active:null, goals:[{id:'goal-a', key:'pullup1', n:'First strict pull-up', l:'pull', r:4, std:1, sup:['row','core'], added:1, achieved:null}]};
  try {
    // a new person sees only Together, and it is where the app opens
    reset({'milo.persist':'1'});
    let {win,doc}=await load();
    check(tabs(doc)==='mix' && doc.querySelector('.seg.on').dataset.m==='mix', 'a new person opens on Together, with no other tabs');
    let root=doc.getElementById('m-mix').shadowRoot;
    root.querySelector('[data-a="d-sec"][data-m="str"]').click();
    check(!root.querySelector('[data-a="d-save"]').disabled, 'one kind of training is enough to build a program');
    root.querySelector('[data-a="d-save"]').click(); await pause(300);
    check(tabs(doc)==='mix,str', 'the trainer you choose appears as a tab');
    let P=saved().plan;
    check(P && P.dose.str==='build' && P.week===1 && P.weeks===5, 'Strength alone gets a building dose in a five-week block');
    const ex={}; P.days.forEach(d=>d.str.forEach(x=>{ (ex[x.id]||(ex[x.id]=[])).push(x.heavy); }));
    check(Object.values(ex).every(h=>h.filter(Boolean).length===1), 'each lift has exactly one heavy exposure a week');
    check(P.days.every(d=>!(d.str.some(x=>x.a==='legs'&&x.heavy)&&d.str.some(x=>x.a==='hips'))), 'heavy squats and deadlifts are on different days');

    // all three, ranked by the suggestion: Strength builds, Ladder moderate, Muscle maintains
    reset({'milo.persist':'1', 'proladder.v1':JSON.stringify(ladder), 'trainer.together':JSON.stringify({v:1, on:true, secs:['lift','str','cal'], days:4, mins:0})});
    ({win,doc}=await load()); root=doc.getElementById('m-mix').shadowRoot;
    check(tabs(doc)==='mix,lift,str,cal', 'all three chosen trainers show as tabs');
    P=saved().plan;
    check(P.dose.str==='build' && P.dose.cal==='moderate' && P.dose.lift==='maintain', 'the order sets the dose: build, moderate, maintain');
    const cov=new Set(P.days.flatMap(d=>d.lift.map(x=>x.mu)));
    check(!cov.has('quad') && !cov.has('chest'), 'Muscle leaves muscles the heavy lifts already cover');
    check(P.days.every(d=>d.lift.every(x=>x.sets>=1&&x.sets<=4)), 'no muscle gets more than four Muscle sets in a day');
    check(root.textContent.includes('Your program') && root.textContent.includes('Strength · Build'), 'the program card shows each section’s dose');

    // starting a day uses Together’s own content and leaves the trainers’ own plans alone
    const ci=root.querySelector('[data-a="ci-skip"]'); if(ci){ ci.click(); await pause(150); }
    const d=P.kinds.findIndex(k=>k.includes('str'));
    root.querySelector('[data-a="pickday"]').click(); await pause(100);
    root.querySelector(`[data-a="setnext"][data-d="${d}"]`).click(); await pause(150);
    root.querySelector('[data-a="start-day"]').click(); await pause(500);
    const st=JSON.parse(localStorage.getItem('strlog.v2'));
    check(st.active && st.active.plan===null && st.active.entries.length===P.days[d].str.length, 'Strength starts the lifts Together planned, not tied to a Strength program');
    check(st.active.entries.every(e=>e.sc && (e.sc.t==='rpe'||e.sc.t==='dp'||e.sc.t==='var')), 'each lift carries Together’s prescription');
    check(!st.program, 'Strength has no program of its own made for it');
    check(saved().run && saved().run.parts[0].m==='str', 'the day runs in your order, Strength first');
    result.textContent=results.join('\n')+'\nALL TESTS PASSED';
  } catch(error){
    result.textContent=results.join('\n')+'\nFAIL '+error.stack;
  } finally {
    if(frame){ frame.remove(); frame=null; }
    reset(original);
    result.textContent+='\nOriginal Milo browser data restored.';
  }
})();
