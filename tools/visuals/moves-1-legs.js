/* ---- The movements ----
   Coordinates: x across (side view faces right), y down, floor at 114; a standing ankle sits at y 110.5.
   Each move is its frames (two or more poses played back and forth, or one for a hold) and its props. */
const AN=110.5, HIPY=63.5, LEG=LN.th+LN.sh, BODY=LEG+LN.tor;
const sho=(hip,t,k)=>at(hip, upv(t), LN.tor*(k||1));
const def=(id, frames, pr, o)=>{ MOVES[id]=Object.assign({frames, props:(o&&o.nofloor?[]:[['floor']]).concat(pr||[])}, o||{}); };
const same=(id, src, edit)=>{ const m=MOVES[src]; if(!m) throw new Error('no move '+src); const c=JSON.parse(JSON.stringify(m)); delete c.vb; if(edit) edit(c); MOVES[id]=c; };
const each=(m, f)=>m.frames.forEach(f);
const cp=o=>JSON.parse(JSON.stringify(o));
const behind=(sh,t,d)=>at(sh, upv(t-90), d), ahead=(sh,t,d)=>at(sh, upv(t+90), d);
/* Where two circles meet (around a with radius ra, around b with rb), the one most toward pick (u, d, l, r). */
function meet(a, ra, b, rb, pick){
  const dx=b[0]-a[0], dy=b[1]-a[1], d=Math.hypot(dx,dy)||1e-6, dd=Math.min(ra+rb-1e-3, Math.max(Math.abs(ra-rb)+1e-3, d));
  const x=(ra*ra-rb*rb+dd*dd)/(2*dd), y=Math.sqrt(Math.max(0, ra*ra-x*x)), ux=dx/d, uy=dy/d;
  const p1=[a[0]+ux*x-uy*y, a[1]+uy*x+ux*y], p2=[a[0]+ux*x+uy*y, a[1]+uy*x-ux*y], pv={r:[1,0], l:[-1,0], u:[0,-1], d:[0,1]}[pick||'u'];
  return (p1[0]*pv[0]+p1[1]*pv[1])>=(p2[0]*pv[0]+p2[1]*pv[1])? p1 : p2;
}
/* A straight body from a base (ankles or knees) to the shoulders: the hips sit on that line. */
const lineHip=(base, sh)=>at(sh, upv(ang(base, sh)), -LN.tor);
const onArcY=(base, r, y, dir)=>[base[0]+(dir||1)*Math.sqrt(Math.max(0, r*r-(base[1]-y)**2)), y];
const onArcX=(base, r, x)=>[x, base[1]-Math.sqrt(Math.max(0, r*r-(x-base[0])**2))];
const STAND=(x,o)=>Object.assign({hip:[x,HIPY], t:3, a:[4,2], l:{to:[x+1,AN], b:'f'}}, o||{});
/* A limb given by angles, turned into one reaching for the same point, so it can blend with frames that use targets. */
const reachOf=(p, limb, b)=>{ const J=solve(p), end={a:'wr', a2:'wr2', l:'an', l2:'an2'}[limb]; p[limb]={to:J[end].slice(), b, s:(p[limb]&&p[limb].s)||[1,1]}; return p; };
const straightTo=(from, to, len)=>{ const d=Math.hypot(to[0]-from[0], to[1]-from[1])||1; return [from[0]+(to[0]-from[0])/d*len, from[1]+(to[1]-from[1])/d*len]; };

/* ===== Squats ===== */
function squat(id, o){
  const k=o.k||'bb', ax=82, d=o.deep? 93 : 87, lean=o.lean!=null? o.lean : (k==='fs'||k==='gob'? 22 : 40);
  const mk=(hip,t,low)=>{ const sh=sho(hip,t), p={hip, t, l:{to:[ax,AN], b:'f'}, eq:o.eq||'', f:90};
    if(k==='bb'||k==='smith'||k==='hack'){ p.a={to:at(behind(sh,t,3.5), upv(t), -0.5), b:'d'}; p.eq='bb'; }
    else if(k==='fs'){ p.a={to:ahead(sh,t,6), b:'f'}; p.eq='bb'; }
    else if(k==='gob'){ p.a={to:at(ahead(sh,t,8), upv(t), -9), b:'d'}; p.eq='kb'; }
    else if(k==='db'){ p.a={to:[hip[0]+3, hip[1]+(low?10:14)], b:'b'}; p.eq='db'; }
    else if(k==='bw'){ p.a={a:[low? 86:8, low? 86:6]}; }
    else if(k==='hold'){ p.a={to:[99, low? 74:62], b:'d'}; }
    else if(k==='cb'){ p.a={to:ahead(sh,t,9), b:'d'}; p.eq='kb'; }
    if(o.heel){ p.f=o.heel; }
    return p; };
  const top=mk([80,HIPY], k==='hack'?-14:4, false), bot=mk([k==='hack'?76:68, d], k==='hack'?-14:lean, true);
  const pr=[]; if(k==='smith') pr.push(['rack',73,22]); if(k==='hack') pr.push(['back',64,98,-14,64]); if(k==='hold') pr.push(['rack',100,52]);
  def(id, [top, bot], pr.concat(o.props||[]));
}
squat('back-squat',{k:'bb'}); squat('front-squat',{k:'fs'}); squat('goblet-squat',{k:'gob'}); squat('smith-squat',{k:'smith', lean:26});
squat('hack-squat',{k:'hack'}); squat('bodyweight-squat',{k:'bw', lean:30}); squat('pause-squat',{k:'bb'}); squat('assisted-squat',{k:'hold', lean:18});
/* Jumps from the squat */
{ const m=MOVES['bodyweight-squat'], bot=m.frames[1], air=cp(m.frames[0]);
  air.hip=[80,HIPY-12]; air.l={to:[82,AN-12], b:'f'}; air.f=150; air.a={a:[172,176]};
  const crouch=cp(bot); crouch.a={a:[-40,-30]};
  def('squat-jump', [crouch, air], []);
  const tuck=cp(air); tuck.hip=[80,HIPY-18]; tuck.l={to:[94,72], b:'f'}; tuck.f=150; tuck.a={a:[60,100]};
  def('tuck-jump', [crouch, tuck], []);
  const fly=cp(air); fly.hip=[112,HIPY-8]; fly.t=30; fly.l={to:[100,AN-30], b:'f'}; fly.a={a:[150,160]};
  def('broad-jump', [crouch, fly], []);
  const onBox=cp(bot); onBox.hip=[118,66]; onBox.l={to:[124,AN-30], b:'f'}; onBox.a={a:[40,40]};
  def('box-jump', [crouch, onBox], [['box',108,84,34]]);
  const high=cp(m.frames[0]); high.hip=[56,HIPY-30]; high.l={to:[57,AN-30], b:'f'};
  const land=cp(bot); land.hip=[86,82]; land.t=30; land.l={to:[96,AN], b:'f'}; land.a={a:[30,40]};
  def('depth-jump', [high, land], [['box',38,84,32]]); def('drop-landing', [cp(high), cp(land)], [['box',38,84,32]]);
  const sl=cp(m.frames[0]); sl.l2={a:[50,-60]}; sl.f2=40; const slLow=cp(sl); slLow.hip=[76,72]; slLow.t=24; slLow.a={a:[40,40]}; slLow.l={to:[82,AN], b:'f'};
  const slAir=cp(sl); slAir.hip=[96,HIPY-6]; slAir.l={to:[98,AN-8], b:'f'}; slAir.f=130;
  def('hop-stick', [slAir, slLow], []);
  const tall=cp(m.frames[0]); tall.a={a:[176,178]}; tall.f=125; tall.hip=[80,HIPY-4]; tall.l={to:[81,AN-4], b:'f'};
  const snap=cp(bot); snap.hip=[72,80]; snap.t=34; snap.a={a:[-34,-24]};
  def('snap-down', [tall, snap], []);
}

/* ===== Hinges ===== */
function hinge(id, o){
  const k=o.k||'bb';
  const mk=(hip,t,by,top)=>{ const sh=sho(hip,t);
    const p={hip, t, l:{to:[81,AN], b:'f'}, a:{to:[sh[0]+1.5, by], b:'b'}, eq:k==='gm'?'bb':k==='db'?'db':k==='kb'?'kb':k==='none'?'':k==='cb'?'cb':'bb', f:90};
    if(k==='gm'){ p.a={to:at(behind(sh,t,3.5), upv(t), -0.5), b:'d'}; }
    if(top&&k!=='gm'){ p.a={to:[sh[0]+2, sh[1]+31.5], b:'b'}; }
    if(k==='cb'){ p.from=[18,FL-2]; p.a= top? {to:[hip[0]+4, hip[1]+10], b:'b'} : {to:[hip[0]-6, hip[1]+20], b:'b'}; }
    if(o.sl){ p.l2= top? {a:[0,0]} : {a:[-(t-6), -(t-6)]}; p.f2= top? 90 : 180-t; }
    return p; };
  const b=o.bottom||[70,82,62];
  const A=mk([b[0],b[1]], b[2], o.barY!=null? o.barY : 103, false), B=mk([80,HIPY], 3, 0, true);
  def(id, [A, B], (o.props||[]).concat(k==='cb'? [['pulley',18,FL-2]] : []));
}
hinge('deadlift',{}); hinge('sumo-deadlift',{bottom:[71,90,50]}); hinge('romanian-deadlift',{bottom:[66,66,72], barY:84});
hinge('db-rdl',{k:'db', bottom:[66,66,72], barY:86}); hinge('single-leg-rdl',{k:'db', sl:true, bottom:[70,64,80], barY:90});
hinge('good-morning',{k:'gm', bottom:[66,66,74]}); hinge('rack-pull',{bottom:[69,70,36], barY:80, props:[['rack',96,85]]});
hinge('sl-reach',{k:'none', sl:true, bottom:[70,64,72], barY:96}); hinge('cable-pull-through',{k:'cb', bottom:[64,70,70]});
/* Back extension on a 45-degree bench: hips on the pad, ankles hooked */
{ const hip=[84,66], mk=t=>({hip, t, hd:t>90?20:0, l:{a:[-45,-45]}, f:45, a:{a:[-t+30, -t+160]}});
  // legs run down and back at 45 degrees to the foot plate; the torso goes from hanging to in line with them
  def('back-extension', [mk(165), mk(45)], [['back',76,76,-135,-34],['pad',47,96,8,8]]);
  def('back-extension-hold', [mk(45)], [['back',76,76,-135,-34],['pad',47,96,8,8]]); }
/* Glute-ham raise: knees on the pad, body from level to upright */
{ // knees on the pad, feet locked behind; the body goes from level (face down) to upright
  const kn=[84,80], ank=[62,73], P=t=>({hip:at(kn, upv(t), LN.th), t, l:{to:ank, b:'d'}, f:-150, a:{a:[-t+25, -t+150]}});
  def('glute-ham-raise', [P(86), P(4)], [['pad',76,83,16,5],['pad',56,67,6,10]]); }
/* Nordics: kneeling, the body falls forward from the knees */
function nordic(id, o){
  const kn=[64,FL-4], ank=[41,FL-4], P=t=>{ const hip=at(kn, upv(t), LN.th), sh=sho(hip,t), lean=t>30;
    // arms crossed while upright; reaching for the floor as the body comes down
    return {hip, t, l:{to:ank, b:'d'}, f:-90, a:{to: t<0? at(ahead(sh,t,5), upv(t), -12) : lean? [sh[0]+16, FL-2] : at(ahead(sh,t,6), upv(t), -12), b:'d'}}; };
  def(id, [P(o.from!=null?o.from:4), P(o.to||70)], [['mat',30,90]].concat(o.props||[]));
}
nordic('nordic-curl',{}); nordic('nordic-negative',{}); nordic('partial-nordic-curl',{to:36}); nordic('assisted-nordic-curl',{to:66});
/* Reverse Nordic: kneeling, lean back from the knees */
nordic('reverse-nordic',{from:2, to:-55}); nordic('partial-reverse-nordic',{from:2, to:-28});


/* ===== Lunges and single-leg squats (near leg in front) ===== */
function split(id, o){
  const fa=o.front||[96,AN], ra=o.rear||[56,AN-3], mk=(hip,t,a)=>({hip, t, l:{to:fa, b:'f'}, l2:{to:ra, b:'f'}, f:90, f2:o.rf!=null?o.rf:40, a:a||(o.arms||{to:[hip[0]+2,hip[1]+12], b:'b'}), eq:o.eq||''});
  const top=mk(o.topHip||[76,HIPY+4], 4), bot=mk(o.botHip||[76,84], 8);
  if(o.k==='db'){ top.a={to:[top.hip[0]+3, top.hip[1]+13], b:'b'}; bot.a={to:[bot.hip[0]+3, bot.hip[1]+13], b:'b'}; top.eq=bot.eq='db'; }
  def(id, [top, bot], o.props||[]);
}
split('split-squat',{}); split('reverse-lunge',{}); split('walking-lunge',{k:'db'}); split('bw-walking-lunge',{});
split('bulgarian-split-squat',{k:'db', rear:[52,86], rf:-90, topHip:[78,HIPY+2], botHip:[76,82], props:[['bench',38,92,58]]});
split('calf-wall-stretch',{front:[100,AN], rear:[58,AN], rf:90, topHip:[82,HIPY+4], botHip:[84,HIPY+6], arms:{to:[118,46], b:'d'}, props:[['wall',121]]});
MOVES['calf-wall-stretch'].frames=[MOVES['calf-wall-stretch'].frames[1]];
/* Step-up onto a box */
{ const box=[90,86,30], mk=(hip,t,rear)=>({hip, t, l:{to:[101,box[1]-3.5], b:'f'}, l2:{to:rear, b:'f'}, f:90, f2:rear[1]<AN?40:90, a:{to:[hip[0]+3,hip[1]+13], b:'b'}, eq:'db'});
  def('db-step-up', [mk([82,82],18,[66,AN]), mk([98,40],4,[93,AN-26])], [['box',...box]]); }
/* Pistol and its builders: the free leg reaches forward */
function pistol(id, o){
  const mk=(hip,t,low)=>({hip, t, l:{to:[84,AN], b:'f'}, l2: low? {a:[86,88]} : {a:[40,40]}, f:90, f2:150, a: low? {a:[84,86]} : {a:[60,60]}, eq:o.eq||''});
  const A=mk([80,HIPY], 6, false), B=mk([70,o.low||98], 46, true);
  if(o.hold){ A.a=B.a={to:[101,58], b:'d'}; }
  def(id, [A,B], o.props||[]);
}
pistol('pistol-squat',{}); pistol('assisted-pistol',{hold:true, props:[['rack',102,52]]}); pistol('counterbalance-pistol',{eq:'pl'});
pistol('box-pistol',{low:88, props:[['box',54,92,20]]});
/* Shrimp and skater: the free knee bends behind */
function shrimp(id, o){
  const mk=(hip,t,low)=>({hip, t, l:{to:[84,AN], b:'f'}, l2: o.dragon? {a:[-30,-10]} : {a:[low?-10:-20, low?-100:-90]}, f:90, f2:o.dragon?40:-150, a:{a:low? [70,80] : [20,30]}});
  const A=mk([80,HIPY], 6, false), B=mk([70,94], 40, true);
  if(o.hold){ A.a=B.a={to:[101,58], b:'d'}; }
  def(id, [A,B], o.props||[]);
}
shrimp('shrimp-squat',{}); shrimp('skater-squat',{}); shrimp('assisted-shrimp-squat',{hold:true, props:[['rack',102,52]]}); shrimp('dragon-squat',{dragon:true});
/* Sissy squat: knees forward, lean back, heels up */
{ const mk=(hip,t,kn)=>({hip, t, l:{to:[84,AN-3], b:'f'}, f:40, a:{a:[60,70]}});
  def('sissy-squat', [{hip:[80,HIPY], t:0, l:{to:[84,AN-3], b:'f'}, f:40, a:{a:[60,70]}}, {hip:[70,86], t:-30, l:{to:[84,AN-3], b:'f'}, f:40, a:{a:[60,70]}}]);
  same('assisted-sissy-squat','sissy-squat', m=>{ each(m, f=>{ f.a={to:[84,52], b:'d'}; }); m.props.push(['rack',86,48]); }); }
/* Lateral lunge and Cossack (front view) */
{ const mk=(hx,hy,lean)=>({v:'f', hip:[hx,hy], t:lean, a:{a:[25,25]}, a2:{a:[25,25]}, l:{to:[52,AN+2], b:'f'}, l2:{to:[108,AN+2], b:'u'}});
  def('lateral-lunge', [mk(80,HIPY+6,0), mk(64,84,-8)]); def('cossack-squat', [mk(80,HIPY+8,0), mk(60,94,-10)]);
  each(MOVES['lateral-lunge'], (f,i)=>{ if(i) f.l={to:[52,AN+2], b:'l'}; }); each(MOVES['cossack-squat'], (f,i)=>{ if(i) f.l={to:[52,AN+2], b:'l'}; }); }

/* ===== Leg press, extension, curls ===== */
{ const hip=[56,94], dir=48, mk=k=>{ const toe=at(hip, upv(dir), k), ank=at(toe, upv(dir+90), 5); return {hip, t:-58, hd:10, l:{to:ank, b:'u'}, f:dir+90+90, plat:dir, a:{a:[30,40]}}; };
  def('leg-press', [mk(34), mk(50)], [['back',62,100,-58,40],['seat',44,100,22]]);
  const c=k=>{ const p=mk(50); p.f=k; return p; }; def('leg-press-calf', [c(170), c(120)], [['back',62,100,-58,40],['seat',44,100,22]]); }
def('leg-extension', [{hip:[66,84], t:-6, l:{a:[90,4]}, f:90, a:{a:[20,20]}}, {hip:[66,84], t:-6, l:{a:[90,84]}, f:170, a:{a:[20,20]}}], [['seat',54,90,26],['back',58,90,-12,30]]);
def('leg-curl', [{hip:[66,84], t:-12, l:{a:[90,82]}, f:170, a:{a:[24,24]}}, {hip:[66,84], t:-12, l:{a:[90,-10]}, f:80, a:{a:[24,24]}}], [['seat',54,90,26],['back',58,90,-20,30],['pad',84,78,14,4]]);
def('lying-leg-curl', [{hip:[66,92], t:-90, hd:8, l:{a:[90,90]}, f:-180, a:{a:[-150,-130]}}, {hip:[66,92], t:-90, hd:8, l:{a:[90,190]}, f:-80, a:{a:[-150,-130]}}], [['bench',30,98,100]]);
def('sliding-hamstring-curl', [{sh:[38,108], hip:[64,96], hd:-6, l:{to:[106,AN], b:'u'}, f:150, a:{a:[88,90]}}, {sh:[38,108], hip:[62,88], hd:-6, l:{to:[86,AN], b:'u'}, f:150, a:{a:[88,90]}}], [['pad',100,FL-1,10,2]]);
MOVES['sliding-hamstring-curl'].frames.reverse();
/* Hip thrust and bridges */
{ const thr=(up,sh)=>({sh, hip:up? [76,88]:[74,104], hd:-6, l:{to:[100,AN], b:'u'}, f:90, a:{to:up? [78,84]:[76,100], b:'d'}, eq:'bb'});
  def('hip-thrust', [thr(false,[50,90]), thr(true,[50,88])], [['bench',28,95,54]]);
  const br=(up)=>({sh:[44,FL-6], hip:up? [70,92]:[70,FL-6], hd:-4, l:{to:[96,AN], b:'u'}, f:90, a:{a:[88,90]}});
  def('glute-bridge', [br(false), br(true)]);
  const sl=up=>{ const p=br(up); p.l2={a:[up?96:72, up?96:76]}; p.f2=180; return p; }; def('single-leg-glute-bridge', [sl(false), sl(true)]); }
/* Cable glute kickback: hinged a little, one leg kicks back */
def('cable-glute-kickback', [STAND(82,{t:20, a:{to:[100,58], b:'d'}, l2:{a:[2,2]}, f2:90, eq:'', from:[30,FL-2]}), STAND(82,{t:20, a:{to:[100,58], b:'d'}, l2:{a:[-50,-40]}, f2:60, eq:'', from:[30,FL-2]})], [['rack',100,54],['pulley',30,FL-2]]);
each(MOVES['cable-glute-kickback'], f=>{ f.eq='cb'; f.from=[30,FL-2]; });
/* Hip abduction machine, from the front: knees out */
def('hip-abduction', [{v:'f', hip:[80,86], t:0, a:{a:[12,12]}, l:{a:[70,0], s:[0.45,1]}, l2:{a:[70,0], s:[0.45,1]}}, {v:'f', hip:[80,86], t:0, a:{a:[12,12]}, l:{a:[100,20], s:[0.55,1]}, l2:{a:[100,20], s:[0.55,1]}}], [['seat',62,94,36]]);
/* Calf raises: the toes stay put, the heels rise */
function calf(id, o){
  const toe=o.toe||[89,FL-0.5], mk=fa=>{ const an=at(toe, dn(fa), -LN.ft); const p= o.seated? {hip:[62,an[1]-23-4], t:-2, l:{to:an, b:'f'}, f:fa, a:{a:[50,90]}} : {hip:[an[0]-1, an[1]-LEG], t:3, l:{to:an, b:'f'}, f:fa, a:o.hold? {to:[104,52], b:'d'}:{a:[4,2]}, eq:o.eq||''};
    if(o.sl){ p.l2={a:[20,-70]}; p.f2=20; } return p; };
  def(id, [mk(o.low||90), mk(o.high||52)], o.props||[]);
}
calf('standing-calf',{eq:'bb'}); calf('bw-calf-raise',{toe:[89,FL-6], low:118, props:[['box',84,FL-5,20]]}); calf('single-leg-calf-raise',{toe:[89,FL-6], low:118, sl:true, hold:true, props:[['box',84,FL-5,20],['wall',108]]});
calf('weighted-calf-raise',{toe:[89,FL-6], low:118, sl:true, eq:'db', props:[['box',84,FL-5,20]]}); calf('deficit-calf-raise',{toe:[89,FL-6], low:122, sl:true, hold:true, props:[['box',84,FL-5,20],['wall',108]]});
calf('seated-calf',{seated:true, props:[['seat',46,90,26],['pad',70,82,16,4]]});
/* Ankle rocks: half-kneeling facing a wall, the front knee travels over the toes */
function rock(id, cm){
  const an=[92,AN], wall=an[0]+LN.ft+cm/1.6, kx=wall-4, kn=[kx, an[1]-Math.sqrt(LN.sh**2-(kx-an[0])**2)], hy=87, hip=[kn[0]-Math.sqrt(LN.th**2-(hy-kn[1])**2), hy];
  const mk=h=>({hip:h, t:8, l:{to:an, b:'f'}, l2:{to:[h[0]-30,FL-4], b:'d'}, f:90, f2:-90, a:{to:[wall-2.5,60], b:'d'}});
  def(id, [mk([hip[0]-9, hy]), mk(hip)], [['wall',wall+1.5],['pad',hip[0]-40,FL-2,22,3]]);
}
rock('ankle-rock-8', 8); rock('ankle-rock-10', 10); rock('ankle-rock-12', 12);
/* Balance on one leg */
{ const sl=STAND(80,{l2:{a:[80,0]}, f2:90, a:{a:[20,20]}}); def('sl-stand', [sl]); def('sl-stand-eyes-closed', [cp(sl)]);
  const soft=cp(sl); soft.hip=[80,HIPY-4]; soft.l={to:[81,AN-4], b:'f'}; def('sl-stand-soft', [soft], [['pad',70,FL-3,24,7]]); }
/* Walking with weights */
{ const mk=s=>({hip:[80,HIPY+1], t:3, l:{to:[80+14*s,AN], b:'f'}, l2:{to:[80-14*s,AN-1], b:'f'}, f:90, f2:60, a:{a:[4,2]}, eq:'db'});
  def('farmers-carry', [mk(1), mk(-1)]); }
