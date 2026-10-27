const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const guard=app.slice(app.indexOf('/* ==================== IOS APP SCALE'),app.indexOf("if('serviceWorker' in navigator)",app.indexOf('/* ==================== IOS APP SCALE')));
function setup(navigator){
  const surface=()=>({classList:new Set(),listeners:{},addEventListener(type,fn,options){(this.listeners[type]??=[]).push({fn,options});}});
  const document=surface(),win=surface(),viewport={content:'width=device-width, initial-scale=1, viewport-fit=cover'};
  const hosts=Object.fromEntries(['lift','str','cal','mix'].map(id=>['m-'+id,{...surface(),shadowRoot:surface()}]));
  document.documentElement=surface();document.querySelector=()=>viewport;document.getElementById=id=>hosts[id];
  let now=10000;
  vm.runInNewContext(guard,{navigator,document,addEventListener:win.addEventListener.bind(win),Date:{now:()=>now},Math});
  return {document,win,hosts,viewport,advance(){now+=100;}};
}
const phone={userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',platform:'iPhone',maxTouchPoints:5};
function emit(root,type,extra={}){
  const e={cancelable:true,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra};
  for(const {fn,options} of root.listeners[type]||[]){fn(e);if(e.defaultPrevented)assert.equal(options.passive,false);}
  return e;
}
test('iPhone and desktop-mode iPad keep a fixed viewport across every trainer',()=>{
  for(const nav of [phone,{userAgent:'Mozilla/5.0 (Macintosh)',platform:'MacIntel',maxTouchPoints:5}]){
    const s=setup(nav);assert.match(s.viewport.content,/maximum-scale=1, user-scalable=no/);
    assert.ok(s.document.documentElement.classList.has('ios-fixed-scale'));
    for(const host of Object.values(s.hosts))assert.ok(host.classList.has('ios-fixed-scale'));
  }
});
test('desktop and Android retain their normal viewport and pinch gestures',()=>{
  for(const nav of [{userAgent:'Macintosh',platform:'MacIntel',maxTouchPoints:0},{userAgent:'Android',platform:'Linux armv8l',maxTouchPoints:5}]){
    const s=setup(nav);assert.doesNotMatch(s.viewport.content,/user-scalable/);
    assert.equal(emit(s.document,'gesturestart').defaultPrevented,false);
    assert.equal(emit(s.document,'touchmove',{touches:[{},{}]}).defaultPrevented,false);
  }
});
test('iOS pinch gestures are cancelled in the shell and within isolated trainer roots',()=>{
  const s=setup(phone);
  for(const root of [s.document,...Object.values(s.hosts).map(h=>h.shadowRoot)]){
    for(const type of ['gesturestart','gesturechange'])assert.ok(emit(root,type).defaultPrevented);
    for(const type of ['touchstart','touchmove'])assert.ok(emit(root,type,{touches:[{},{}]}).defaultPrevented);
  }
});
test('iOS single-finger scrolling and editing are not cancelled',()=>{
  const s=setup(phone);
  for(const root of [s.document,...Object.values(s.hosts).map(h=>h.shadowRoot)]){
    for(const type of ['touchstart','touchmove'])assert.equal(emit(root,type,{touches:[{}]}).defaultPrevented,false);
    assert.equal(emit(root,'gesturechange',{cancelable:false}).defaultPrevented,false);
  }
});
test('rapid button taps retain their second click, while field taps remain native',()=>{
  const s=setup(phone),p={clientX:40,clientY:40};let clicks=0;
  const button={closest:selector=>selector.startsWith('input')?null:{click(){clicks++;}}};
  const tap=el=>{emit(s.win,'touchstart',{touches:[p]});return emit(s.win,'touchend',{touches:[],changedTouches:[p],composedPath:()=>[el]});};
  assert.equal(tap(button).defaultPrevented,false);s.advance();assert.ok(tap(button).defaultPrevented);assert.equal(clicks,1);
  s.advance();const field={closest:()=>({})};assert.equal(tap(field).defaultPrevented,false);
});
test('a pinch ending over a button cannot become a synthetic double-tap click',()=>{
  const s=setup(phone),p={clientX:40,clientY:40};let clicks=0;
  const button={closest:selector=>selector.startsWith('input')?null:{click(){clicks++;}}};
  const end=touches=>emit(s.win,'touchend',{touches,changedTouches:[p],composedPath:()=>[button]});
  emit(s.win,'touchstart',{touches:[p]});end([]);s.advance();
  emit(s.win,'touchstart',{touches:[p,p]});end([p]);end([]);s.advance();
  emit(s.win,'touchstart',{touches:[p]});assert.equal(end([]).defaultPrevented,false);assert.equal(clicks,0);
});
