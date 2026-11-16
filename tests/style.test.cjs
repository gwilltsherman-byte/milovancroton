const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const html=read('index.html'),trainer=read('trainer.css'),shell=read('shell.css');
/* Every declaration for sel, from each rule whose selector list names it exactly, later ones winning as in the
   browser, written back out as "prop:value; ..." so a test can match a property's final value. */
function decl(css,sel){
  const flat=css.replace(/\/\*[\s\S]*?\*\//g,''), props=new Map();
  for(const m of flat.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
    const sels=m[1].trim().replace(/^:is\(|\)$/g,'').split(',').map(s=>s.trim());
    if(!sels.includes(sel)) continue;
    m[2].split(';').map(d=>d.trim()).filter(Boolean).forEach(d=>{ const i=d.indexOf(':'); props.set(d.slice(0,i).trim(), d.slice(i+1).trim()); });
  }
  assert.ok(props.size,'a rule for '+sel);
  return [...props].map(([k,v])=>k+':'+v).join('; ');
}
test('every sheet the shell opens has a header with a close button that does what its own Done or Cancel does',()=>{
  const dialogs=[...html.matchAll(/<dialog class="bk[^"]*" id="([^"]+)"[^>]*>([\s\S]*?)<\/dialog>/g)];
  assert.ok(dialogs.length>=5);
  for(const [,id,body] of dialogs){
    if(id==='bk-ask'){assert.doesNotMatch(body,/bk-x/,'the confirm stays a plain question with its own two answers');continue;}
    const x=body.match(/<div class="bk-head"><h2 id="[^"]+"[^>]*>[^<]+<\/h2><button class="bk-x[^"]*" type="button" data-close="([^"]+)" aria-label="[^"]+">/);
    assert.ok(x,id+' has a title and a labelled close button');
    assert.match(body,new RegExp('<button[^>]*id="'+x[1]+'"'),id+' closes through a button of its own');
  }
});
test('a picked choice looks the same everywhere: the selected tint, never the accent of a main action',()=>{
  for(const sel of ['.pillpick button.on','.pills button.on','.scale button.on','.liftpick button.on','.fchip.on','.seg2 button.on','.optrow button.on.n','.dchip.on','.session-effort button[aria-pressed=true]']){
    const d=decl(trainer,sel);
    assert.match(d,/background:var\(--selected\)/,sel+' uses the selected tint');
    assert.doesNotMatch(d,/var\(--accent\)|--on-accent/,sel+' is not an accent fill');
  }
  for(const sel of ['.fchips button[aria-pressed="true"]','.set .pills .b[aria-pressed="true"]','.bk .b[aria-pressed="true"]'])
    assert.match(decl(shell,sel),/background:var\(--sh-selection\)/,sel+' uses the selected tint');
});
test('secondary buttons are one outline in every section, and controls share one corner radius',()=>{
  for(const sel of ['.btn','.tinybtn']){
    const d=decl(trainer,sel);
    assert.match(d,/background:var\(--surface\)/,sel+' sits on the surface');
    assert.match(d,/border:1px solid var\(--border-2\)/,sel+' has the outline');
    assert.match(d,/border-radius:8px/,sel+' has the shared radius');
  }
  for(const sel of ['.iconbtn','.sinput','.searchbar']) assert.match(decl(trainer,sel),/border-radius:8px/,sel+' has the shared radius');
  assert.match(decl(shell,'.bk .b'),/background:var\(--sh-solid\)/,'buttons in the shell’s sheets are outlines too');
  assert.match(decl(trainer,'.banner.info'),/var\(--steel-soft\)/,'information is blue-grey in every section');
});
