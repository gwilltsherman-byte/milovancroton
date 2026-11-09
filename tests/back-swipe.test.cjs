const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const start=app.indexOf('/* ==================== BACK'),end=app.indexOf('})();',app.indexOf('return {make, page:setPage};',start))+5;
const code=app.slice(start,end);
const iphone={userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',platform:'iPhone',maxTouchPoints:5};
const ipad={userAgent:'Mozilla/5.0 (Macintosh)',platform:'MacIntel',maxTouchPoints:5};
const android={userAgent:'Mozilla/5.0 (Linux; Android 14)',platform:'Linux armv8l',maxTouchPoints:5};
/* SheetNav on a device: its history entries, and what a back gesture (popstate) does. */
function nav(navigator,standalone){
  const entries=[{state:null}],listeners=[];let at=0;
  const history={get state(){return entries[at].state;},get length(){return entries.length;},
    pushState(s){entries.splice(at+1);entries.push({state:s});at++;},replaceState(s){entries[at].state=s;},back(){if(at>0)at--;}};
  const window={};
  vm.runInNewContext(code,{window,navigator,history,addEventListener:(type,fn)=>{if(type==='popstate')listeners.push(fn);},
    matchMedia:q=>({matches:q==='(display-mode: standalone)'&&standalone==='display-mode'}),setTimeout,clearTimeout,MiloSecurity:{html:x=>x}});
  return {SheetNav:window.SheetNav,history,popstate:()=>listeners.forEach(fn=>fn())};
}
const sheet=S=>S.make({sheet:()=>null,isOpen:()=>false,close(){},icon:''});
test('the installed app on an iPhone or iPad adds no history entries, so a back swipe has nothing to reveal',()=>{
  for(const [device,standalone] of [[{...iphone,standalone:true}],[iphone,'display-mode'],[{...ipad,standalone:true}]]){
    const n=nav(device,standalone);let paged=0;
    n.SheetNav.page(()=>{paged++;return true;});
    sheet(n.SheetNav).opened();
    assert.equal(n.history.length,1,'neither the page guard nor an open sheet pushes an entry');
    assert.equal(n.history.state,null);
    n.popstate();assert.equal(paged,0,'a stray back event does not move the page');
  }
});
test('Android and the iPhone browser keep back inside Milo and closing a sheet',()=>{
  for(const n of [nav(android,'display-mode'),nav(iphone,false)]){
    let paged=0,closed=0;n.SheetNav.page(()=>{paged++;return true;});
    assert.equal(n.history.length,2);assert.equal(n.history.state.milo,'guard');
    n.SheetNav.make({sheet:()=>null,isOpen:()=>true,close(){closed++;},icon:''}).opened();
    assert.equal(n.history.length,3);assert.equal(n.history.state.sheet,1);
    n.history.back();n.popstate();assert.equal(closed,1,'back closes the open sheet');assert.equal(paged,0);
    n.history.back();n.popstate();
    assert.equal(paged,1,'back with no sheet open steps back inside Milo');
    assert.equal(n.history.state.milo,'guard','and the guard goes back up for the next one');
  }
});
