/* ===== Pulling: hangs and pull-ups (side view, bar overhead) ===== */
const BAR=[80,6];
function hang(id, o){
  const bar=o.bar||BAR, mk=(shY, el, legs)=>{ const sh=[bar[0]-(o.lean||0), shY], hip=[sh[0]-(o.hipx!=null?o.hipx:1), shY+30];
    const p={sh, hip, a:{to:[bar[0]+1,bar[1]+2], b:el||'f'}, l:legs||o.l||{a:[o.straight?2:-8, o.straight?2:-62]}, f:o.straight?20:30, eq:o.eq||'', from:o.from};
    if(o.belt) p.belt=1; return p; };
  const hangY=bar[1]+31.5+(o.dy||0), topY=o.top||bar[1]+11;
  let fr;
  if(o.hold) fr=[mk(hangY)];
  else if(o.legs) fr=[mk(hangY,'f',o.legs[0]), mk(hangY,'f',o.legs[1])];
  else fr=[mk(hangY), mk(topY, 'f')];
  def(id, fr, (o.props||[]).concat(o.rings? [] : [['bar',...bar]]));
}
hang('pullup',{}); hang('chin-up',{}); hang('wide-pullup',{}); hang('weighted-pullup',{belt:true}); hang('weighted-chin-up',{belt:true});
hang('negative-pullup',{}); hang('band-pullup',{}); hang('assisted-pullup',{props:[['pad',58,92,26,6]]}); hang('chest-to-bar',{top:BAR[1]+19});
hang('explosive-pullup',{top:BAR[1]+21}); hang('commando-pullup',{}); hang('clapping-pullup',{});
hang('lsit-pullup',{l:{a:[90,90]}}); each(MOVES['lsit-pullup'], f=>{ f.f=170; });
hang('dead-hang',{hold:true}); hang('towel-hang',{hold:true}); hang('scap-pullup',{top:BAR[1]+28});
hang('false-grip-hang',{hold:true, rings:true, eq:'ring', from:[80,-14]}); hang('feet-assisted-false-grip-hang',{hold:true, rings:true, eq:'ring', from:[80,-14]});
each(MOVES['feet-assisted-false-grip-hang'], f=>{ f.sh=[80,58]; f.hip=[78,88]; f.a={to:[81,28], b:'f'}; f.l={to:[108,AN], b:'u'}; f.f=90; });
hang('false-grip-pullup',{rings:true, eq:'ring', from:[80,-14]});
/* Leg raises from a hang */
hang('hanging-knee-raise',{legs:[{a:[2,2]}, {a:[100,0]}], straight:true}); hang('hanging-leg-raise',{legs:[{a:[2,2]}, {a:[92,92]}], straight:true});
hang('toes-to-bar',{legs:[{a:[2,2]}, {a:[158,160]}], straight:true}); each(MOVES['toes-to-bar'], (f,i)=>{ if(i){ f.sh=[86,f.sh[1]]; } });
/* Front view: archer, typewriter, one-arm */
function hangFront(id, o){
  const y0=8, mk=(dx,up)=>{ const sy= up? y0+13 : y0+31, sh=[80+dx, sy];
    return {v:'f', hip:[80+dx, sy+30], t:0, hd:0, a:{to:[o.one?80:(o.wide?56:66), y0], b:up?'d':'u'}, a2: o.one? {a:[30,10]} : {to:[o.wide?104:94, y0], b:up?'d':'u'}, l:[2,1]}; };
  const fr= o.shift? [mk(-o.shift,true), mk(o.shift,true)] : [mk(0,false), mk(o.dx||0,true)];
  def(id, fr, [['bar',80,y0]], {nofloor:true});
  if(o.one){ each(MOVES[id], f=>{ f.a={to:[80,y0], b:'d'}; f.hip=[86,f.hip[1]]; }); }
}
hangFront('archer-pullup',{wide:true, dx:-12}); hangFront('assisted-archer-pullup',{wide:true, dx:-10}); hangFront('typewriter-pullup',{wide:true, shift:12});
hangFront('oap',{one:true}); hangFront('assisted-oap',{one:true});
def('one-arm-hang', [{v:'f', hip:[84,68], t:4, a:{to:[80,8], b:'u'}, a2:{a:[30,10]}, l:[2,1]}], [['bar',80,8]], {nofloor:true});
def('assisted-one-arm-hang', [{v:'f', hip:[84,68], t:4, a:{to:[80,8], b:'u'}, a2:{to:[96,30], b:'d'}, l:[2,1]}], [['bar',80,8],['strap',96,30]], {nofloor:true});
/* Muscle-ups: hang, pull to the bar, turn over to a support */
function muscleUp(id, o){
  const bar=o.bar||[80,30], hand=[bar[0]+1, bar[1]+2];
  const hangP={sh:[bar[0]-2, bar[1]+31.5], hip:[bar[0]-6, bar[1]+61], a:{to:hand, b:'f'}, l:{a:[-6,-40]}, f:30, eq:o.eq||'', from:o.from};
  const pull={sh:[bar[0]-6, bar[1]+4], hip:[bar[0]-16, bar[1]+30], a:{to:hand, b:'b'}, l:{a:[20,-20]}, f:30, eq:o.eq||'', from:o.from};
  const sup={sh:[bar[0]+2, bar[1]-29], hip:[bar[0]+0, bar[1]+1], a:{to:hand, b:'b'}, l:{a:[-4,-10]}, f:30, eq:o.eq||'', from:o.from};
  const fr= o.low? [ {sh:[bar[0]-8, bar[1]+16], hip:[bar[0]-14, bar[1]+44], a:{to:hand, b:'f'}, l:{to:[bar[0]+18,AN], b:'f'}, f:90, eq:o.eq||'', from:o.from}, pull, sup ] : [hangP, pull, sup];
  if(o.low){ fr[1]=Object.assign(cp(pull), {l:{to:[bar[0]+10,AN], b:'f'}, f:90}); fr[2]=Object.assign(cp(sup), {l:{to:[bar[0]+4,AN], b:'f'}, f:90}); }   // on a low bar the feet stay on the floor
  def(id, o.rev? fr.slice().reverse() : fr, o.rings? [] : [['bar',...bar]], o.low? {} : {nofloor:!o.floor});
}
muscleUp('strict-muscleup',{}); muscleUp('jumping-muscleup',{floor:true, bar:[80,52]}); muscleUp('band-muscleup',{}); muscleUp('muscleup-negative',{rev:true});
muscleUp('low-bar-transition',{low:true, bar:[80,66]}); muscleUp('ring-muscleup',{rings:true, eq:'ring', from:[80,-14]});
muscleUp('assisted-ring-muscleup',{rings:true, eq:'ring', from:[80,-14]}); muscleUp('low-ring-transition',{low:true, rings:true, bar:[80,66], eq:'ring', from:[80,26]});

/* ===== Rows ===== */
function bentRow(id, o){
  const hip=o.hip||[70,66], t=o.t||68, sh=sho(hip,t);
  const mk=pull=>{ const p={hip, t, l:{to:[80,AN], b:'f'}, f:90, a: pull? {to:[sh[0]-(o.wideEl?2:8), sh[1]+(o.wideEl?10:14)], b:o.wideEl?'u':'b'} : {to:[sh[0]+1, sh[1]+31.5], b:'b'}, eq:o.eq||'bb', from:o.from};
    if(o.free) p.a2=o.free; if(o.stag){ p.l2={to:[60,AN], b:'f'}; p.f2=90; } return p; };
  def(id, [mk(false), mk(true)], o.props||[]);
}
bentRow('barbell-row',{}); bentRow('pendlay-row',{t:84}); bentRow('tbar-row',{t:55, eq:'lm', from:[24,FL-1], props:[['lm',24]]});
bentRow('db-row',{t:84, eq:'db', hip:[66,68], free:{to:[104,86], b:'b'}, props:[['bench',96,90,130]]});
bentRow('meadows-row',{t:70, eq:'lm', from:[132,FL-1], stag:true, free:{to:[96,80], b:'b'}, props:[['lm',132]]});
bentRow('rear-delt-row',{t:84, eq:'db', hip:[66,68], wideEl:true, free:{to:[104,86], b:'b'}, props:[['bench',96,90,130]]});
/* Chest on an incline bench: arms hang, then row */
function proneRow(id, o){
  const hip=[66,82], t=58, sh=sho(hip,t), mk=pull=>({hip, t, hd:10, l:{to:[54,AN], b:'f'}, f:90,
    a: o.y? (pull? {a:[150,150]} : {a:[4,4]}) : o.curl? (pull? {a:[0,150]} : {a:[0,2]}) : pull? {to:[sh[0]-(o.wide?2:7), sh[1]+(o.wide?9:12)], b:o.wide?'u':'b'} : {to:[sh[0]+1, sh[1]+31.5], b:'b'}, eq:o.eq===undefined?'db':o.eq});
  def(id, [mk(false), mk(true)], [['ibench',58,92,58,42]]);
}
proneRow('incline-db-row',{}); proneRow('prone-y-raise',{y:true}); proneRow('spider-curl',{curl:true});
/* Seated rows: handles in front */
function cableRow(id, o){
  const hip=o.hip||[60,96], pul=o.pul||[134,96];
  const mk=(t,pull)=>{ const s=sho(hip,t); return {hip, t, l:o.legs||{to:[104,104], b:'u'}, f:20, a: pull? {to:[s[0]+(o.high?6:8), s[1]+(o.high?6:16)], b:o.wideEl?'u':'b'} : {to:[s[0]+(o.reach||30), s[1]+(o.high?-16:12)], b:'b'}, eq:o.eq!==undefined?o.eq:'cb', from:pul}; };
  def(id, [mk(o.t0!=null?o.t0:12,false), mk(o.t1!=null?o.t1:-6,true)], o.props||[['pulley',...pul],['seat',40,103,40],['pad',104,96,4,14]]);
}
cableRow('seated-cable-row',{}); cableRow('wide-cable-row',{wideEl:true});
cableRow('chest-supported-row',{hip:[66,90], legs:{a:[86,8]}, t0:18, t1:18, eq:'', props:[['seat',54,96,26],['pad',90,56,5,22]]});
cableRow('machine-high-row',{hip:[66,90], legs:{a:[86,8]}, t0:10, t1:4, eq:'', high:true, reach:22, props:[['seat',54,96,26],['pad',88,58,5,20]]});
/* Face pull: rope at head height, pulled toward the face with the elbows high */
def('face-pull', [STAND(78,{t:-2, a:{to:[110,40], b:'d'}, eq:'cb', from:[134,38]}), STAND(78,{t:-4, a:{to:[86,30], b:'u'}, eq:'cb', from:[134,38]})], [['pulley',134,38]]);
/* Inverted rows: hanging under a bar, heels down */
function invRow(id, o){
  const bar=o.bar||[110,70], ank=o.ank||[36,FL-8], mk=pull=>{ const d= pull? 12 : 31.5, sh=meet(ank, BODY, bar, d, 'd'); return {sh, hip:lineHip(ank, sh), hd:-6, a:{to:bar, b:pull?'d':'d'}, l:{to:ank, b:'d'}, f:180, eq:o.eq||'', from:o.from}; };
  def(id, [mk(false), mk(true)], o.rings? [] : [['bar',...bar]]);
  MOVES[id].props.push(['rack', bar[0], bar[1]]);
}
invRow('inverted-row',{}); invRow('feet-elevated-row',{ank:[34,FL-24]}); MOVES['feet-elevated-row'].props.push(['box',22,FL-22,22]);
invRow('incline-row',{bar:[110,52], ank:[52,FL-8]}); invRow('archer-row',{}); invRow('one-arm-row',{bar:[110,58], ank:[48,FL-8]}); invRow('incline-one-arm-row',{bar:[110,44], ank:[58,FL-8]});
invRow('assisted-archer-row',{bar:[110,52], ank:[52,FL-8]});
/* Bodyweight curls: lean back from a bar, curl the forehead to it */
function bwCurl(id, o){
  const bar=o.bar||[110,64], ank=o.ank||[44,FL-8], mk=up=>{ const d= up? 14 : 31.5, sh=meet(ank, BODY, bar, d, 'd'); return {sh, hip:lineHip(ank, sh), hd:-6, a:{to:bar, b:'u'}, l:{to:ank, b:'d'}, f:180}; };
  def(id, [mk(false), mk(true)], [['rack',bar[0],bar[1]],['bar',...bar]]);
}
bwCurl('bw-curl',{}); bwCurl('bw-curl-incline',{bar:[110,50], ank:[56,FL-8]});
/* Front lever rows: a tucked, level body pulls to the bar */
{ // the back level and face up, knees tight to the chest; the arms pull the body up to the bar
  const bar=[80,10], mk=up=>{ const sh=[80, up?bar[1]+12:bar[1]+31], hip=[sh[0]+30, sh[1]]; return {sh, hip, hd:0, a:{to:[bar[0]+1,bar[1]+2], b:'d'}, l:{a:[-108,72]}, f:0}; };
  def('tuck-fl-row', [mk(false), mk(true)], [['bar',...bar]], {nofloor:true});
  same('assisted-tuck-fl-row','tuck-fl-row', m=>{ m.props.push(['strap',108,40]); }); }

/* ===== Pulldowns ===== */
function pulldown(id, o){
  const hip=[78,90], t=-8, sh=sho(hip,t), pul=[82,-6];
  const mk=down=>({hip, t, l:{a:[86,8]}, f:90, a: down? {to:[sh[0]+5, sh[1]+2], b:'b'} : {to:[sh[0]+4, sh[1]-31], b:'f'}, eq:'cb', from:pul});
  def(id, [mk(false), mk(true)], [['seat',66,96,28],['pad',96,74,10,5],['pulley',...pul]]);
}
pulldown('lat-pulldown',{}); pulldown('close-grip-pulldown',{}); pulldown('single-arm-pulldown',{});
/* Straight-arm pulldown: straight arms sweep from head height to the thighs */
def('straight-arm-pulldown', [STAND(76,{t:16, l:{to:[80,AN], b:'f'}, a:{a:[150,152]}, eq:'cb', from:[118,-6]}), STAND(76,{t:16, l:{to:[80,AN], b:'f'}, a:{a:[12,14]}, eq:'cb', from:[118,-6]})], [['pulley',118,-6]]);

/* ===== Curls ===== */
function curl(id, o){
  const st=o.seat? {hip:[80,88], t:o.t||0, l:{a:[86,6]}, f:90} : STAND(80,{t:o.t!=null?o.t:2}), ua=o.ua||4;
  const mk=a2=>Object.assign(cp(st), {a:{a:[ua, a2]}, eq:o.eq||'bb', from:o.from});
  def(id, [mk(ua+2), mk(o.top||ua+140)], (o.seat? [['seat',66,94,28]] : []).concat(o.props||[]));
}
curl('barbell-curl',{}); curl('ez-curl',{}); curl('db-curl',{eq:'db'}); curl('hammer-curl',{eq:'db'}); curl('reverse-curl',{});
curl('cable-curl',{eq:'cb', from:[102,FL-2], props:[['pulley',102,FL-2]]});
curl('bayesian-curl',{eq:'cb', ua:-24, from:[40,FL-2], props:[['pulley',40,FL-2]]});
curl('incline-db-curl',{eq:'db', seat:true, t:-40, ua:-10, top:120}); MOVES['incline-db-curl'].props=[['floor'],['ibench',82,92,-40,40]];
curl('preacher-curl',{seat:true, ua:40, top:160}); MOVES['preacher-curl'].props.push(['back',86,64,-130,-16]);
curl('machine-curl',{seat:true, ua:40, top:160, eq:''}); MOVES['machine-curl'].props.push(['back',86,64,-130,-16]);
curl('concentration-curl',{seat:true, t:34, ua:-6, top:150, eq:'db'});
/* Wrist curl: forearms on the thighs, the wrists curl */
def('wrist-curl', [{hip:[78,88], t:30, l:{a:[86,6]}, f:90, a:{a:[50,92]}, eq:'bb'}, {hip:[78,88], t:30, l:{a:[86,6]}, f:90, a:{a:[50,108]}, eq:'bb'}], [['seat',64,94,28]]);

/* ===== Shoulders, from the front ===== */
function lateral(id, o){
  const mk=up=>({v:'f', hip:[80,HIPY], t:o.tilt||0, a:{a:[up?(o.top||84):10, up?(o.top||84)+6:12]}, a2:o.one? {a:[10,12]} : {a:[up?(o.top||84):10, up?(o.top||84)+6:12]}, l:[2,1], eq:o.eq||'db', from:o.from});
  def(id, [mk(false), mk(true)], o.props||[]);
}
lateral('lateral-raise',{}); lateral('cable-lateral',{eq:'cb'}); lateral('machine-lateral',{eq:''}); lateral('cable-y-raise',{eq:'cb', top:135});
/* Lean-away: one hand on a post, the body tilts away from it, the other arm raises */
{ const mk=up=>({v:'f', hip:[84,HIPY+3.5], t:12, a:{to:[50,40], b:'d'}, a2:{a:[up?84:10, up?90:12]}, l:{to:[74,AN+2], b:'f'}, l2:{to:[86,AN+2], b:'f'}, eq:'db', eq2:false});
  def('lean-away-lateral', [mk(false), mk(true)], [['rack',48,38]]); }
/* Side-lying lateral raise: lying on one side, the top arm lifts */
def('lying-lateral', [{v:'f', hip:[96,92], t:-74, rig:true, a:{a:[0,0]}, a2:{a:[0,6]}, l:[2,0], eq:'db'}, {v:'f', hip:[96,92], t:-74, rig:true, a:{a:[0,0]}, a2:{a:[96,100]}, l:[2,0], eq:'db'}], [['ibench',112,98,-74,60]]);
/* Upright row and shrugs */
def('cable-upright-row', [{v:'f', hip:[80,HIPY], t:0, a:{to:[76,64], b:'u'}, a2:{to:[84,64], b:'u'}, l:[2,1], eq:'cb'}, {v:'f', hip:[80,HIPY], t:0, a:{to:[76,40], b:'u'}, a2:{to:[84,40], b:'u'}, l:[2,1], eq:'cb'}]);
function shrug(id, o){ const mk=up=>({v:'f', hip:[80,HIPY], t:0, shr:up?4:0, a:{a:[6,4]}, l:[2,1], eq:o.eq||'db'}); def(id, [mk(false), mk(true)]); }
shrug('shrug',{}); shrug('barbell-shrug',{eq:'bb'}); shrug('cable-shrug',{eq:'cb'});
