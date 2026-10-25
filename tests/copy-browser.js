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
  const counts={};
  function words(doc){let text='';const walk=root=>{for(const el of root.querySelectorAll('*')){if(el.shadowRoot)walk(el.shadowRoot);for(const n of el.childNodes){if(n.nodeType!==3||!n.textContent.trim()||['SCRIPT','STYLE'].includes(el.tagName))continue;let hidden=false;for(let a=el;a;a=a.parentElement){if(a.tagName==='DETAILS'&&!a.open&&!a.querySelector('summary')?.contains(el)){hidden=true;break;}}if(hidden)continue;const r=doc.createRange();r.selectNodeContents(n);if(r.getClientRects().length&&doc.defaultView.getComputedStyle(el).visibility!=='hidden')text+=' '+n.textContent;}}};walk(doc);return text.trim().split(/\s+/).filter(Boolean).length;}
  const measure=(name,doc)=>{counts[name]=words(doc);};
  try{
    await group('Main screens and sheets',async()=>{
      const {win,doc}=await seed({'trainer.together':{v:1,on:true,secs:['lift','str','cond'],prio:['str','lift','cal','cond'],days:3,mins:60,offered:true,log:[],checkins:[],tuned:true},'milo.persist':1});
      const root=rootOf(doc,'mix');measure('Today',doc);
      for(const dest of ['train','progress','library']){doc.querySelector('.seg[data-d="'+dest+'"]').click();await pause(60);measure(dest,doc);}
      doc.getElementById('setbtn').click();measure('Settings',doc);doc.getElementById('bk-done').click();
      doc.querySelector('.seg[data-d="today"]').click();root.querySelector('[data-a="t-edit"]').click();measure('Customize',doc);
      root.querySelector('[data-a="t-cancel"]').click();root.querySelector('[data-a="edit"]').click();measure('Program setup',doc);root.querySelector('[data-a="d-cancel"]').click();
      root.querySelector('[data-a="ci-edit"]').click();measure('Full check-in',doc);
      win.__hub.dest('progress');root.querySelector('[data-a="goal-new"]').click();measure('Goal form',doc);root.querySelector('[data-a="goal-cancel"]').click();
      root.querySelector('[data-a="cond-log"]').click();measure('Activity form',doc);root.querySelector('[data-a="cond-back"]').click();
      check(Object.values(counts).every(n=>n>0),'visible words measured on main screens and forms');
      check(counts.Today<=150,'Today keeps the default screen under 150 visible words');
      check(counts.Customize<=250,'folded customization stays under 250 visible words');
      check(doc.documentElement.scrollWidth<=391,'copy remains within the phone viewport');
    });
  }finally{
    if(frame)frame.remove();Object.keys(localStorage).filter(managed).forEach(k=>localStorage.removeItem(k));Object.entries(original).forEach(([k,v])=>localStorage.setItem(k,v));sessionStorage.clear();Object.entries(originalSession).forEach(([k,v])=>sessionStorage.setItem(k,v));
    result.textContent=results.join('\n')+'\n'+(failures?'FAIL '+failures+' copy checks':'ALL TESTS PASSED')+'\nCOUNTS '+JSON.stringify(counts);
  }
})();
