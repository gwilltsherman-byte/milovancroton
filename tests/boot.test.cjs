const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../boot.js'),'utf8');
function boot(theme,links=[]){
  const classes=new Set(),root={dataset:{},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)}},window={};
  let fallback,cleared=false;
  const context={window,document:{documentElement:root,getElementById:id=>id==='m-lift'?{shadowRoot:{querySelectorAll:()=>links}}:null},
    localStorage:{getItem(){if(theme instanceof Error)throw theme;return theme;},setItem(){throw Error('must not write user data');}},
    setTimeout:fn=>{fallback=fn;return 1;},clearTimeout:()=>cleared=true,requestAnimationFrame:fn=>fn()};
  vm.runInNewContext(code,context);
  return {root,classes,window,fallback:()=>fallback(),cleared:()=>cleared};
}
test('startup applies only a supported saved theme and never writes preferences',()=>{
  for(const theme of ['dark','light','system','unexpected',null,new Error('blocked storage')]){
    const b=boot(theme);assert.equal(b.root.dataset.theme,['dark','light'].includes(theme)?theme:undefined);
    assert.ok(b.classes.has('app-starting'));
  }
});
test('the saved app is revealed only after its trainer stylesheet and final appearance are ready',async()=>{
  const handlers={},link={sheet:null,addEventListener:(name,fn)=>handlers[name]=fn},b=boot('dark',[link]);
  let prepared=false,focused=false;
  b.window.MiloBoot.focus({isConnected:true,focus(){assert.equal(b.classes.has('app-starting'),false);focused=true;}});
  b.window.MiloBoot.ready(()=>{assert.ok(b.classes.has('app-starting'));prepared=true;});
  assert.equal(focused,false);
  assert.equal(prepared,false);assert.ok(b.classes.has('app-starting'));
  handlers.load();await new Promise(setImmediate);
  assert.ok(prepared&&b.cleared()&&focused);assert.equal(b.classes.has('app-starting'),false);
});
test('a missing main script or failed stylesheet cannot leave the app permanently hidden',async()=>{
  const missing=boot('dark');missing.fallback();assert.equal(missing.classes.has('app-starting'),false);
  const handlers={},b=boot('light',[{sheet:null,addEventListener:(name,fn)=>handlers[name]=fn}]);
  b.window.MiloBoot.ready();handlers.error();await new Promise(setImmediate);
  assert.equal(b.classes.has('app-starting'),false);
});
