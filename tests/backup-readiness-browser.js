(async function () {
  'use strict';
  const result=document.getElementById('result'), results=[];
  const managed=k=>/^(hyplog\.|strlog\.|proladder\.|trainer\.|milo\.)/.test(k);
  const take=s=>Object.fromEntries(Object.keys(s).filter(managed).map(k=>[k,s.getItem(k)]));
  const original=take(localStorage), originalSession=take(sessionStorage);
  let frame=null, restored=false;
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  const clear=s=>Object.keys(s).filter(managed).forEach(k=>s.removeItem(k));
  const saved=()=>JSON.parse(localStorage.getItem('hyplog.v1'));
  function restore() {
    if(restored) return; restored=true;
    if(frame) { frame.remove(); frame=null; }
    clear(localStorage); clear(sessionStorage);
    Object.entries(original).forEach(([k,v])=>localStorage.setItem(k,v));
    Object.entries(originalSession).forEach(([k,v])=>sessionStorage.setItem(k,v));
  }
  window.addEventListener('pagehide',restore,{once:true});
  function check(ok,msg) { if(!ok) throw Error(msg); results.push('PASS '+msg); result.textContent=results.join('\n'); }
  async function until(fn,msg) {
    for(let i=0;i<160;i++) { let v; try { v=fn(); } catch(e) {} if(v) return v; await pause(50); }
    throw Error(msg);
  }
  function started() {
    return frame?.contentWindow.__hub && frame.contentDocument.getElementById('m-lift')?.shadowRoot?.querySelector('#view')?.children.length;
  }
  async function load() {
    if(frame) frame.remove();
    frame=document.createElement('iframe'); frame.title='Readiness and backup test app'; frame.style.cssText='width:390px;height:844px;border:0';
    frame.src='../index.html?m=lift&backup-readiness='+Date.now(); document.getElementById('preview').appendChild(frame);
    await until(started,'Muscle did not load'); return {win:frame.contentWindow,doc:frame.contentDocument};
  }
  async function reloaded(old) {
    await until(()=>frame.contentDocument!==old&&started(),'Restored app did not load');
    return {win:frame.contentWindow,doc:frame.contentDocument};
  }
  const muscle={v:1,onboarded:true,route:'train',settings:{unit:'kg',sessionView:'list',sound:false,vibrate:false},exercises:[],mesos:[],bodylog:[],
    history:[{id:'kept-session',name:'Previous training',date:Date.now()-864e5,entries:[]}],
    active:{id:'open-session',name:'Current training',startedAt:Date.now(),entries:[],restEndsAt:null}};
  try {
    for(const mode of ['answered','skipped']) {
      if(frame) { frame.remove(); frame=null; } clear(localStorage); clear(sessionStorage);
      localStorage.setItem('milo.persist','1'); localStorage.setItem('hyplog.v1',JSON.stringify(muscle));
      let {win,doc}=await load(), root=doc.getElementById('m-lift').shadowRoot;
      root.querySelector('.session-prep>summary').click();
      root.querySelector('[data-act="open-readiness"]').click();
      if(mode==='answered') {
        for(const f of ['sleep','energy','soreness']) root.querySelector('[data-act="readi"][data-f="'+f+'"][data-v="good"]').click();
        root.querySelector('[data-act="readi-done"]').click();
      } else root.querySelector('button[data-act="readi-skip"]').click();
      await until(()=>saved()?.readyAns,'Readiness answer did not save');
      const answer=JSON.stringify(saved().readyAns);
      check(/^\d{4}-\d{2}-\d{2}$/.test(saved().readyAns.day),mode+': the real readiness control saves a calendar day');
      ({win,doc}=await load());
      check(JSON.stringify(saved().readyAns)===answer&&saved().history[0].id==='kept-session'&&!localStorage.getItem('hyplog.v1.corrupt'),mode+': reload keeps readiness and workout history');
      let shared;
      Object.defineProperty(win.navigator,'canShare',{value:()=>true,configurable:true});
      Object.defineProperty(win.navigator,'share',{value:async o=>{shared=o;},configurable:true});
      doc.getElementById('bkbtn').click(); doc.getElementById('bk-save').click();
      await until(()=>shared,'Backup was not saved');
      const text=await shared.files[0].text(), backup=win.MiloSecurity.backup(text);
      check(JSON.stringify(JSON.parse(backup.data['hyplog.v1']).readyAns)===answer,mode+': Save as a file produces a restorable backup');
      // Put different data in the disposable origin, so Restore and Undo both have something to prove.
      frame.remove(); frame=null;
      const other={...muscle,active:null,history:[{id:'replacement-session',name:'Later training',date:Date.now(),entries:[]}]};
      localStorage.setItem('hyplog.v1',JSON.stringify(other));
      ({win,doc}=await load()); doc.getElementById('bkbtn').click();
      if(mode==='answered') {
        doc.getElementById('bk-in').value=text; doc.getElementById('bk-in').dispatchEvent(new win.Event('input'));
      } else {
        const dt=new win.DataTransfer(); dt.items.add(new win.File([text],'milo-backup.json',{type:'application/json'}));
        const fin=doc.getElementById('bk-fin'); fin.files=dt.files; fin.dispatchEvent(new win.Event('change'));
        await until(()=>doc.getElementById('bk-in').value===text,'Backup file did not load');
      }
      doc.getElementById('bk-restore').click();
      await until(()=>doc.getElementById('bk-ask').open,'Valid backup did not reach confirmation');
      check(doc.activeElement===doc.getElementById('bk-ask-no'),mode+': restore asks for confirmation with Cancel focused');
      doc.getElementById('bk-ask-no').click();
      check(saved().history[0].id==='replacement-session'&&!sessionStorage.getItem('milo.restore'),mode+': cancelling leaves current workouts untouched');
      doc.getElementById('bk-restore').click(); await until(()=>doc.getElementById('bk-ask').open,'Second confirmation did not open');
      let old=doc; doc.getElementById('bk-ask-yes').click(); ({win,doc}=await reloaded(old));
      check(JSON.stringify(saved().readyAns)===answer&&saved().history[0].id==='kept-session'&&saved().active.id==='open-session',mode+': restore and reload recover readiness, history and the unfinished session');
      doc.getElementById('bkbtn').click(); doc.getElementById('bk-undo').click();
      await until(()=>doc.getElementById('bk-ask').open,'Undo confirmation did not open');
      old=doc; doc.getElementById('bk-ask-yes').click(); ({win,doc}=await reloaded(old));
      check(saved().history[0].id==='replacement-session'&&!saved().active&&!saved().readyAns,mode+': Undo restores the replaced workouts');
      check(doc.documentElement.scrollWidth<=391,mode+': restored app fits the phone width');
    }
    result.textContent=results.join('\n')+'\nALL TESTS PASSED';
  } catch(e) { result.textContent=results.join('\n')+'\nFAIL '+e.stack; }
  finally { restore(); window.removeEventListener('pagehide',restore); }
})();
