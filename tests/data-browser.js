(async function () {
  'use strict';
  const result=document.getElementById('result'), results=[];
  const managed=key=>/^(hyplog\.|strlog\.|proladder\.|trainer\.|milo\.)/.test(key);
  const take=storage=>Object.fromEntries(Object.keys(storage).filter(managed).map(key=>[key,storage.getItem(key)]));
  const original=take(localStorage), originalSession=take(sessionStorage);
  const FOREIGN='other-app.keep', foreign=localStorage.getItem(FOREIGN);
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
    if(foreign==null) localStorage.removeItem(FOREIGN); else localStorage.setItem(FOREIGN,foreign);
  }
  window.addEventListener('pagehide',restore,{once:true});
  function check(ok,message){
    if(!ok) throw new Error(message);
    results.push('PASS '+message); result.textContent=results.join('\n');
  }
  async function until(predicate,message,tries){
    for(let i=0;i<(tries||100);i++){ let v=null; try{ v=predicate(); }catch(e){} if(v) return v; await pause(50); }
    throw new Error(message);
  }
  function started(){ const w=frame&&frame.contentWindow, d=frame&&frame.contentDocument;
    return !!(w && d && typeof w.__go==='function' && w.MiloData && d.getElementById('m-mix')?.shadowRoot?.getElementById('view')?.children.length); }
  async function load(){
    if(frame) frame.remove();
    frame=document.createElement('iframe'); frame.title='Isolated data regression app';
    frame.src='../index.html?data-regression='+Date.now();
    document.getElementById('preview').appendChild(frame);
    await until(started,'App did not start');
    return {win:frame.contentWindow,doc:frame.contentDocument};
  }
  // the app reloading itself (a restore, Erase everything): wait for the old page to go and the new one to start
  async function reloaded(old){ await until(()=>frame.contentDocument!==old && started(),'App did not start again',300); return {win:frame.contentWindow,doc:frame.contentDocument}; }
  const saved=k=>JSON.parse(localStorage.getItem(k)||'null');
  const DAY=864e5, at=(daysAgo,h)=>{ const d=new Date(); d.setHours(h||18,0,0,0); d.setDate(d.getDate()-daysAgo); return d.getTime(); };
  const dup=new Date(2025,0,30,9,0).getTime();
  const muscle={v:1, onboarded:true, route:'today', settings:{unit:'kg', sound:false, vibrate:false}, mesos:[], bodylog:[], exercises:[], history:[
    {id:'m-1', name:'Push', date:at(3), durationSec:3000, prs:[], note:'=SUM(A1)', entries:[
      {exId:'barbell-bench', name:'Barbell Bench Press', primary:['chest'], secondary:['fdelt','tri'], equipment:'Barbell', target:{repLow:6,repHigh:10,rir:2,rest:180}, note:'Felt strong, "solid"', sets:[
        {type:'warmup', weight:40, reps:10, rir:null, done:true, tag:null, segments:[]},
        {type:'work', weight:80, reps:8, rir:2, done:true, tag:null, segments:[], assumed:true},
        {type:'work', weight:80, reps:7, rir:1, done:true, tag:'Drop set', segments:[{weight:60, reps:6}]},
        {type:'work', weight:85, reps:null, rir:null, done:false, tag:null, segments:[]}]}]}]};
  const strength={v:2, onboarded:true, route:'today', settings:{sound:false, vibrate:false}, history:[
    {id:'s-dup', name:'Bench day', date:dup, durationSec:2400, prs:[], entries:[{liftId:'bench', label:'', sc:null, sets:[{kind:'work', w:70, reps:5, rpe:8, done:true}]}]},
    {id:'s-1', name:'Day A', date:at(2), durationSec:3600, prs:[], entries:[{liftId:'squat', label:'', sc:null, sets:[
      {kind:'warm', w:60, reps:5, rpe:null, done:true}, {kind:'work', w:100, reps:5, rpe:8, ra:true, done:true}]}]}]};
  const ladder={v:2, onboarded:true, route:'today', settings:{sound:false, vibrate:false, rest:0}, rung:{pull:6}, placed:{pull:true}, goals:[], tests:[],
    advances:[{date:at(1), id:'pull', from:5, to:6, name:'Weighted pull-up'}], history:[
    {id:'c-1', name:'Pull', date:at(1), durationSec:1800, cleared:[], entries:[{ladderId:'pull', stepIdx:6, kind:'reps', target:5, setup:{load:10}, sets:[{v:5, rir:2, done:true}]}]}]};
  const togetherOn={v:1, on:true, secs:['lift','str'], days:3, mins:60, wd:[0,2,4]};
  const strong=['Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE',
    '2025-01-29 5:30:00 pm,"Leg Day",64m,"Squat (Barbell)",W,60,5,0,0,"","",',
    '2025-01-29 5:30:00 pm,"Leg Day",64m,"Squat (Barbell)",1,100,5,0,0,"Belt","",8',
    '2025-01-29 5:30:00 pm,"Leg Day",64m,"Leg Extension (Machine)",1,50,12,0,0,"","",',
    '2025-01-30 12:34:56 pm,"Push",49m,"Bench Press (Barbell)",1,80,8,0,0,"Paused","",',
    '2025-01-30 12:34:56 pm,"Push",49m,"Lateral Raise (Dumbbell)",1,10,15,0,0,"","",',
    '2025-01-30 12:34:56 pm,"Push",49m,"Zercher Wobble Thing",1,20,10,0,0,"","",'].join('\n');

  try {
    clear(localStorage); clear(sessionStorage);
    localStorage.setItem('milo.persist','1');
    localStorage.setItem('hyplog.v1',JSON.stringify(muscle));
    localStorage.setItem('strlog.v2',JSON.stringify(strength));
    localStorage.setItem('proladder.v1',JSON.stringify(ladder));
    localStorage.setItem('trainer.together',JSON.stringify(togetherOn));
    localStorage.setItem(FOREIGN,'yours');
    let {win,doc}=await load();
    const sent=[]; win.__deliver=async(txt,name,type,share)=>{ sent.push({txt,name,type,share}); return share===false? 'saved' : 'shared'; };
    doc.getElementById('bkbtn').click();
    const bk=doc.getElementById('bk');
    check(bk.open && bk.textContent.includes('check-in answers') && bk.textContent.includes('Your data'), 'the backup sheet says it holds check-in answers and has a Your data part');

    // every set as a spreadsheet
    doc.getElementById('yd-csv').click();
    const csv=await until(()=>sent.find(f=>/\.csv$/.test(f.name)),'no spreadsheet was made');
    const lines=csv.txt.replace(/^﻿/,'').split('\r\n');
    check(csv.type==='text/csv' && lines[0]==='date,section,session,exercise,set type,weight kg,weight lb,reps or seconds,RIR or RPE,assumed,notes', 'Export your sets makes a CSV with the agreed columns');
    check(lines.some(l=>/,Muscle,Push,Barbell Bench Press,work,80,176\.37,8,RIR 2,yes,/.test(l)) && lines.some(l=>/,Muscle,Push,Barbell Bench Press,drop,60,132\.28,6,,no,$/.test(l)),
      'Muscle sets come out in kg and lb with RIR, the assumed flag and drop-set steps');
    check(lines.some(l=>l.includes(",Muscle,Push,Barbell Bench Press,warm-up,40,88.18,10,,no,\"'=SUM(A1) · Felt strong, \"\"solid\"\"\"")), 'a note that looks like a formula is defused, and quotes and commas are quoted');
    check(lines.some(l=>/,Strength,Day A,Back Squat,work,100,220\.46,5,RPE 8,yes,$/.test(l)) && lines.some(l=>/,Ladder,Pull,Weighted pull-up,work,10,22\.05,5,RIR 2,no,$/.test(l)),
      'Strength and Ladder sets carry their lift and rung names, RPE, and Ladder’s added load');
    check(lines.filter(Boolean).length===1+8 && !lines.some(l=>l.includes(',85,')), 'one row per ticked set, unticked sets left out');

    // planned days in the calendar, on Together's weekdays
    doc.getElementById('yd-time').value='07:15';
    doc.getElementById('yd-cal').click();
    const cal=await until(()=>sent.find(f=>/\.ics$/.test(f.name)),'no calendar file was made');
    const ev=cal.txt.split('BEGIN:VEVENT').length-1, T=saved('trainer.together');
    const want=win.MiloData.planned(T, {}, Date.now(), 28);
    const starts=[...cal.txt.matchAll(/DTSTART:(\d{4})(\d{2})(\d{2})T0715/g)].map(m=>(new Date(+m[1],+m[2]-1,+m[3]).getDay()+6)%7);
    check(cal.type==='text/calendar' && cal.share===false && /^BEGIN:VCALENDAR\r\n/.test(cal.txt) && /END:VCALENDAR\r\n$/.test(cal.txt), 'the calendar file is a VCALENDAR, downloaded so a phone offers to add it');
    check(ev>=12 && ev===want.length && starts.length===ev && starts.every(d=>[0,2,4].includes(d)), 'four weeks of Together’s days, at the time you chose, on the weekdays you picked');
    check((cal.txt.match(/TRIGGER:-PT30M/g)||[]).length===ev && localStorage.getItem('milo.caltime')==='07:15', 'each day has a reminder 30 minutes before, and the time is remembered');

    // the coach summary
    doc.getElementById('yd-sum').click();
    const sum=doc.getElementById('sum');
    await until(()=>sum.open,'the summary did not open');
    const st=sum.textContent;
    check(/Sessions: 3/.test(st) && st.includes('Main lifts') && st.includes('Bench Press') && st.includes('Back Squat') && st.includes('estimated max'), 'Share a summary lists the four weeks’ sessions and each main lift’s estimated max and best set');
    check(st.includes('Hard sets a week, per muscle') && st.includes('moved up to Weighted pull-up') && st.includes('=SUM(A1)'), 'it has weekly sets per muscle, Ladder rungs and your notes, as text');
    doc.getElementById('sum-done').click();

    // importing from Strong, with a preview, a changed match, and Undo
    const fin=doc.getElementById('yd-fin'), dt=new win.DataTransfer();
    dt.items.add(new win.File([strong],'strong.csv',{type:'text/csv'})); fin.files=dt.files; fin.dispatchEvent(new win.Event('change'));
    const imp=doc.getElementById('imp');
    await until(()=>imp.open,'the import preview did not open');
    const row=name=>[...imp.querySelectorAll('.imx')].find(x=>x.querySelector('.imx-n b').textContent===name);
    check(doc.getElementById('imp-title').textContent==='Import from Strong' && imp.textContent.includes('2 workouts and 6 sets'), 'the preview names the app and counts the workouts and sets');
    check(!!imp.querySelector('[data-imp="unit"][data-v="kg"][aria-pressed="true"]'), 'Strong doesn’t say its unit, so the preview asks, starting from yours');
    check(row('Squat (Barbell)').textContent.includes('Milo: Barbell Back Squat') && row('Squat (Barbell)').querySelector('[data-imp="sec"][data-v="str"]').getAttribute('aria-pressed')==='true',
      'each name gets its closest Milo exercise, and a Strength lift goes to Strength');
    check(row('Zercher Wobble Thing').textContent.includes('Skipped') && row('Leg Extension (Machine)').textContent.includes('Milo: Leg Extension'), 'a name with no close match is skipped until you choose one');
    row('Lateral Raise (Dumbbell)').querySelector('[data-imp="open"]').click();
    const q=doc.getElementById('imp-q'); q.value='cable lateral'; q.dispatchEvent(new win.Event('input',{bubbles:true}));
    const choice=doc.querySelector('#imp-list [data-imp="choose"][data-id="cable-lateral"]');
    check(!!choice && !doc.querySelector('#imp-list [data-id="barbell-bench"]'), 'the exercise list can be searched');
    choice.click();
    check(row('Lateral Raise (Dumbbell)').textContent.includes('Milo: Cable Lateral Raise'), 'and the match changes to the one you pick');
    const before={lift:saved('hyplog.v1').history.length, str:saved('strlog.v2').history.length};
    doc.getElementById('imp-go').click();
    await until(()=>imp.textContent.includes('Added'),'the import did not finish');
    await pause(300);
    const L=saved('hyplog.v1'), S=saved('strlog.v2'), legs=S.history.find(h=>h.from==='strong'&&h.name==='Leg Day');
    check(L.history.length===before.lift+2 && S.history.length===before.str+1 && imp.textContent.includes('Added 3 sessions'), 'Import adds the workouts as past sessions in Muscle and Strength');
    check(legs && legs.entries[0].liftId==='squat' && legs.entries[0].sets.length===2 && legs.entries[0].sets[1].w===100 && legs.entries[0].sets[1].rpe===8 && legs.entries[0].sets[0].kind==='warm'
      && new Date(legs.date).getHours()===17, 'sets keep their weights, RPE and warm-ups, at the workout’s time (5:30 pm)');
    check(L.history.some(h=>h.from==='strong'&&h.entries.some(e=>e.exId==='cable-lateral')) && imp.textContent.includes('1 exercise already in Milo'), 'an exercise already logged that day is left out, and says so');
    imp.querySelector('[data-imp="undo"]').click(); await pause(300);
    check(saved('hyplog.v1').history.length===before.lift && saved('strlog.v2').history.length===before.str && !saved('hyplog.v1').history.some(h=>h.from), 'Undo takes exactly the imported sessions out again');
    doc.getElementById('imp-cancel').click();
    // a file from neither app is refused with a reason
    const dt2=new win.DataTransfer(); dt2.items.add(new win.File(['a,b\n1,2'],'x.csv',{type:'text/csv'})); fin.files=dt2.files; fin.dispatchEvent(new win.Event('change'));
    await until(()=>doc.getElementById('yd-msg').textContent.includes('Strong or Hevy'),'a foreign CSV was not refused');
    check(!imp.open, 'a CSV from another app is refused with a plain reason');

    // a backup with a passphrase
    Object.defineProperty(win.navigator,'canShare',{value:()=>true, configurable:true});
    let shared=null; Object.defineProperty(win.navigator,'share',{value:async o=>{ shared=o; }, configurable:true});
    doc.getElementById('bk-pass').value='correct horse';
    doc.getElementById('bk-save').click();
    await until(()=>shared,'the encrypted backup was not saved',200);
    const lockedTxt=await shared.files[0].text();
    check(/-locked\.json$/.test(shared.files[0].name) && MiloSecurity.sealed(lockedTxt) && !lockedTxt.includes('Barbell Bench'), 'Save as a file with a passphrase gives an encrypted backup');
    const opened=JSON.parse(await MiloSecurity.unseal(lockedTxt,'correct horse'));
    check(opened.app==='milovancroton' && JSON.parse(opened.data['hyplog.v1']).history.length===1, 'and the passphrase opens it again');
    // restoring one: asks for the passphrase, says plainly when it is wrong, then asks in the app before replacing
    const backup=JSON.stringify({app:'milovancroton', version:1, created:new Date(2026,0,2,9,30).toISOString(), data:{'hyplog.v1':JSON.stringify({v:1, onboarded:true, history:[], mesos:[], bodylog:[]})}});
    const box=doc.getElementById('bk-in'); box.value=await MiloSecurity.seal(backup,'open sesame'); box.dispatchEvent(new win.Event('input'));
    check(!doc.getElementById('bk-lock').hidden, 'a pasted backup with a passphrase asks for it');
    doc.getElementById('bk-restore').click();
    check(/passphrase/.test(doc.getElementById('bk-msg2').textContent) && doc.getElementById('bk-msg2').classList.contains('bad'), 'Restore without the passphrase says it is needed');
    doc.getElementById('bk-rpass').value='open says me';
    doc.getElementById('bk-restore').click();
    await until(()=>/doesn’t open/.test(doc.getElementById('bk-msg2').textContent),'a wrong passphrase was not reported',200);
    check(!sessionStorage.getItem('milo.restore'), 'a wrong passphrase says so plainly and changes nothing');
    doc.getElementById('bk-rpass').value='open sesame';
    doc.getElementById('bk-restore').click();
    const ask=doc.getElementById('bk-ask');
    await until(()=>ask.open,'the restore was not confirmed in the app',200);
    check(doc.getElementById('bk-ask-text').textContent.includes(new Date(2026,0,2,9,30).toLocaleString(undefined,{dateStyle:'medium', timeStyle:'short'})), 'the app’s own sheet asks before replacing, with the backup’s date in your format');
    doc.getElementById('bk-ask-no').click(); await pause(100);
    check(!ask.open && !sessionStorage.getItem('milo.restore'), 'Cancel leaves everything as it was');
    doc.getElementById('bk-restore').click();
    await until(()=>ask.open,'the restore was not confirmed a second time',200);
    const d0=doc; doc.getElementById('bk-ask-yes').click();
    ({win,doc}=await reloaded(d0));
    await until(()=>saved('milo.before'),'no copy of the replaced data was kept');
    check(saved('hyplog.v1').history.length===0 && localStorage.getItem('strlog.v2')===null, 'Replace restores the encrypted backup');

    // erase everything
    localStorage.setItem('strlog.v2',JSON.stringify(strength)); localStorage.setItem('strlog.v2.undo','{}'); localStorage.setItem('hyplog.v1.corrupt','x');
    localStorage.setItem('trainer.together',JSON.stringify(togetherOn)); localStorage.setItem('trainer.shell.unit','"lb"');
    doc.querySelector('#guide [data-open-privacy]').click();
    const pv=doc.getElementById('privacy');
    check(pv.open && pv.textContent.includes('GitHub Pages') && pv.textContent.includes('check-in answers'), 'the privacy page opens from the guide and says what is kept and who sees what');
    check(doc.getElementById('er-go').disabled, 'Erase everything waits until you type erase');
    const er=doc.getElementById('er-in'); er.value='Erase '; er.dispatchEvent(new win.Event('input'));
    check(!doc.getElementById('er-go').disabled, 'typing erase lets you erase');
    const d1=doc; doc.getElementById('er-go').click();
    ({win,doc}=await reloaded(d1));
    await pause(300);
    const left=Object.keys(localStorage).filter(k=>/^(hyplog|strlog|proladder|trainer\.together)/.test(k)||['milo.before','milo.backup','milo.caltime','trainer.shell.unit'].includes(k));
    check(!left.length && localStorage.getItem(FOREIGN)==='yours', 'Erase everything removes every Milo key, with undo and unreadable copies, and leaves other apps’ keys');
    const tabs=[...doc.querySelectorAll('.seg')].filter(b=>!b.hidden).map(b=>b.dataset.m).join(',');
    check(tabs==='mix' && !sessionStorage.getItem('milo.erase'), 'and Milo starts again as on its first run');
    result.textContent=results.join('\n')+'\nALL TESTS PASSED';
  } catch(error){
    result.textContent=results.join('\n')+'\nFAIL '+error.stack;
  } finally {
    restore();
    window.removeEventListener('pagehide',restore);
    result.textContent+='\nOriginal Milo browser data restored.';
  }
})();
