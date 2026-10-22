/* ===== Core, lying and kneeling (on the back, the head is to the left) ===== */
{ const hip=[76,FL-6], mk=t=>{ const sh=sho(hip,t); return {hip, t, hd:t>-80?14:0, l:{to:[100,AN], b:'u'}, f:90, a:{to:at(sh, upv(t), 7), b:'u'}}; };
  def('crunch', [mk(-90), mk(-60)]); }
{ const hip=[80,FL-28], mk=t=>{ const sh=sho(hip,t); return {hip, t, hd:t>40?20:0, l:{to:[57,FL-4], b:'d'}, f:-90, a:{to:at(sh, upv(t), 5), b:'d'}, eq:'cb', from:[100,-6]}; };
  def('cable-crunch', [mk(14), mk(78)], [['pulley',100,-6]]); }
{ const hip=[70,88], mk=t=>({hip, t, hd:t>30?16:0, l:{a:[88,6]}, f:90, a:{to:at(sho(hip,t), upv(t+90), 8), b:'d'}});
  def('machine-crunch', [mk(-4), mk(42)], [['seat',56,94,28],['pad',82,50,4,18]]); }
def('reverse-crunch', [{hip:[80,FL-6], t:-90, l:{a:[178,90]}, f:90, a:{a:[88,90]}}, {hip:[82,FL-12], t:-80, l:{a:[-140,170]}, f:120, a:{a:[88,90]}}]);
def('lying-leg-raise', [{hip:[78,FL-6], t:-90, l:{a:[90,90]}, f:180, a:{a:[88,90]}}, {hip:[78,FL-6], t:-90, l:{a:[178,178]}, f:-90, a:{a:[88,90]}}]);
def('dead-bug', [{hip:[78,FL-6], t:-90, a:{a:[178,178]}, a2:{a:[178,178]}, l:{a:[178,90]}, l2:{a:[178,90]}, f:90, f2:90},
                 {hip:[78,FL-6], t:-90, a:{a:[-104,-104]}, a2:{a:[178,178]}, l:{a:[98,98]}, l2:{a:[178,90]}, f:180, f2:90}]);
def('hollow-hold', [{hip:[80,FL-6], t:-80, hd:10, a:{a:[-112,-112]}, l:{a:[100,100]}, f:180}]);
def('neck-curl', [{hip:[90,88], t:-90, hd:-34, l:{to:[112,AN], b:'u'}, f:90, a:{a:[88,90]}}, {hip:[90,88], t:-90, hd:46, l:{to:[112,AN], b:'u'}, f:90, a:{a:[88,90]}}], [['bench',58,95,104]]);
/* Plank on the forearms, straight from the ankles */
{ const sh=[100,FL-20], ank=[100-Math.sqrt(BODY*BODY-(FL-8-sh[1])**2), FL-8];
  def('plank', [{sh, hip:lineHip(ank, sh), hd:4, a:{to:[115,FL-3], b:'d'}, l:{to:ank, b:'u'}, f:0}]); }
/* Side planks, from the front: the body tilts as one piece */
function sidePlank(id, o){
  const hip=o.hip||[70,96], t=o.t||70, mk=up=>({v:'f', hip, t, rig:true, a:o.star? {a:[up?150:20, up?150:20]} : {to:[hip[0]+4, hip[1]-4], b:'d'}, a2:{to:[hip[0]+33, FL-2], b:'d', s:[1,0.3]},
    l: o.star? {a:[up?30:0, up?30:0]} : {a:[0, o.knee?60:0], s:[1, o.knee?0.5:1]}, l2:{a:[0,0]}});
  def(id, o.star? [mk(false), mk(true)] : [mk(false)], o.props||[]);
}
sidePlank('side-plank',{}); sidePlank('star-side-plank',{star:true}); sidePlank('copenhagen-plank',{t:80, hip:[70,92], props:[['bench',12,100,44]]}); sidePlank('short-copenhagen',{t:78, knee:true, hip:[70,92], props:[['bench',30,100,52]]});
/* Twists and anti-rotation, from the front */
{ const legs={a:[150,15], s:[0.4,0.8]}, mk=s=>({v:'f', hip:[80,FL-6], tl:0.85, t:s*10, a:{to:[78+s*12,FL-26], b:'d'}, a2:{to:[82+s*12,FL-26], b:'d'}, l:legs, l2:legs, eq:'pl'});
  def('russian-twist', [mk(-1), mk(1)]); }
def('cable-woodchop', [{v:'f', hip:[80,HIPY], t:8, a:{to:[104,22], b:'d'}, a2:{to:[108,24], b:'d'}, l:[8,4], eq:'cb', from:[130,6]},
                       {v:'f', hip:[78,HIPY+3], t:-10, a:{to:[60,80], b:'d'}, a2:{to:[64,80], b:'d'}, l:[8,4], eq:'cb', from:[130,6]}], [['pulley',130,6]]);
// side-on to the cable: the handle goes from the chest straight out toward you, and the cable tries to turn you
{ const mk=out=>({v:'f', hip:[80,HIPY], t:0, a:{to:[79, out?46:50], b:'d', s:out?[0.45,0.45]:[1,1]}, a2:{to:[81, out?46:50], b:'d', s:out?[0.45,0.45]:[1,1]}, l:{a:[4,2]}, l2:{a:[4,2]}, eq:'cb', from:[22,46]});
  def('pallof-press', [mk(false), mk(true)], [['pulley',22,46]]); }
def('db-side-bend', [{v:'f', hip:[80,HIPY], t:0, a:{a:[6,4]}, a2:{to:[90,58], b:'u'}, l:[4,2], eq:'db', eq2:false}, {v:'f', hip:[80,HIPY], t:-16, a:{a:[6,4]}, a2:{to:[90,58], b:'u'}, l:[4,2], eq:'db', eq2:false}]);
/* Windshield wipers from a hang, from the front: the straight legs, raised to the bar, sweep side to side */
{ const mk=s=>({v:'f', hip:[80,66], tl:0.85, t:0, a:{to:[72,10], b:'u'}, a2:{to:[88,10], b:'u'}, l:{a:[s*130,s*130]}, l2:{a:[-s*130,-s*130]}});
  def('windshield-wiper', [mk(1), mk(-1)], [['bar',80,8]], {nofloor:true}); }
/* Ab wheel rollouts: the wheel rolls out along the floor while the arms stay straight */
function rollout(id, o){
  const wy=FL-6, kn=[70,FL-4], ank=[40,AN], wheel=sh=>[sh[0]+Math.sqrt(Math.max(0, 32.2**2-(wy-sh[1])**2)), wy];
  const mk=(lean, t)=>{ if(o.stand){ const hip=at(ank, upv(lean), LEG), sh=sho(hip,t); return {hip, t, hd:0, l:{to:ank, b:'f'}, f:90, a:{to:wheel(sh), b:'d'}, eq:'wheel'}; }
    const hip=at(kn, upv(lean), LN.th), sh=sho(hip,t); return {hip, t, hd:0, l:{a:[-lean,-90]}, f:-90, a:{to:wheel(sh), b:'d'}, eq:'wheel'}; };
  const A= o.stand? mk(4,150) : mk(30,65), B= o.stand? (o.wall? mk(55,100) : mk(78,84)) : (o.wall? mk(52,74) : mk(70,82));
  def(id, [A,B], o.wall? [['wall', B.a.to[0]+8]] : []);
}
rollout('kneeling-rollout',{}); rollout('short-rollout',{wall:true}); rollout('standing-rollout',{stand:true}); rollout('standing-rollout-wall',{stand:true, wall:true});
/* Dragon flags: shoulders on the bench, a straight body lowers like a lever */
function dragon(id, o){
  const sh=[44,90], mk=phi=>{ const hip=at(sh, upv(phi), LN.tor); return {sh, hip, hd:0, a:{to:[30,92], b:'u'}, l:o.tuck? {a:[180-phi-150, 180-phi+10]} : {a:[180-phi, 180-phi]}, l2:o.one? {a:[180-phi-150, 180-phi+10]} : undefined, f:180-phi}; };
  const A=mk(12), B=mk(o.low||74); if(!o.one){ delete A.l2; delete B.l2; }
  def(id, [A,B], [['bench',20,96,96]]);
}
dragon('dragon-flag',{}); dragon('dragon-flag-negative',{}); dragon('tuck-dragon-flag',{tuck:true}); dragon('one-leg-dragon-flag',{one:true});
/* L-sits on parallettes: hands beside the hips, arms locked, shoulders pushed down */
function lsit(id, o){
  const tuck={a:[135,-10]}, legs={l:{a:[90,90]}, t:tuck, one:{a:[90,90]}, v:{a:[140,140]}}[o.k||'l'];
  const hip= o.k==='v'? [80,97] : [82,97], sh= o.k==='v'? at(hip, upv(-18), LN.tor) : [82,67];
  const p={sh, hip, hd:o.k==='v'?6:0, a:{to:[o.k==='v'?74:82, 99], b:'b'}, l:legs, f:o.k==='t'?-10:(o.k==='v'?140:90)};
  if(o.k==='one'){ p.l2=tuck; p.f2=-10; }
  def(id, [p], [['pad',o.k==='v'?68:76,99,12,15]]);
}
lsit('lsit',{}); lsit('tuck-lsit',{k:'t'}); lsit('one-leg-lsit',{k:'one'}); lsit('vsit',{k:'v'});
/* Seated compression: palms beside the knees, chest a little forward, the heels lift a few centimetres */
{ const mk=(lift,both)=>({hip:[66,FL-6], t:25, hd:6, a:{to:[86,FL-1.5], b:'b'}, l:{a:[lift?97:90, lift?97:90]}, l2:{a:[lift&&both?97:90, lift&&both?97:90]}, f:170, f2:170});
  def('pike-compression', [mk(false,true), mk(true,true)]); def('seated-leg-lift', [mk(false,false), mk(true,false)]); }
def('straddle-lift', [{v:'f', hip:[80,FL-8], tl:0.9, t:0, a:{to:[72,FL-2.5], b:'u'}, a2:{to:[88,FL-2.5], b:'u'}, l:{a:[84,84]}, l2:{a:[84,84]}}, {v:'f', hip:[80,FL-8], tl:0.9, t:0, a:{to:[72,FL-2.5], b:'u'}, a2:{to:[88,FL-2.5], b:'u'}, l:{a:[98,98]}, l2:{a:[98,98]}}]);

/* ===== Handstands (side view: upside down, the chest faces left, the back right) ===== */
const HSH=[84,FL-1.5], HS=(o)=>Object.assign({sh:[84,HSH[1]-32.2], hip:[84,HSH[1]-62.2], hd:0, a:{to:HSH, b:'f'}, l:{a:[180,180]}, f:180}, o||{});
const BTW=HS({sh:[84.5,HSH[1]-32.2], hip:[86.5,HSH[1]-62.1], l:{a:[176,176]}}), CTW=HS({sh:[83.5,HSH[1]-32.2], hip:[82,HSH[1]-62.1], l:{a:[185,185]}, f:195});
def('wall-handstand-hold', [BTW], [['wall',95]]); def('freestanding-handstand', [HS()]); def('chest-to-wall-handstand', [CTW], [['wall',74]]);
def('heel-pulls', [cp(CTW), HS({f:195})], [['wall',74]]); def('btw-heel-pulls', [cp(BTW), HS()], [['wall',95]]);
/* Kick-up: a lunge with the arms by the ears, tip forward as one piece onto the hands, swing the legs over */
{ const H=[121,FL-1.5], hs={hip:[121,H[1]-62.2], t:180, hd:0, a:{a:[0,0]}, l:{to:[121,H[1]-62.2-46.9], b:'f'}, l2:{to:[121,H[1]-62.2-46.9], b:'f'}, f:180, f2:180};
  def('kick-up', [{hip:[76,HIPY+6], t:0, hd:0, a:{a:[180,180]}, l:{to:[96,AN], b:'f'}, l2:{to:[56,AN-2], b:'f'}, f:90, f2:40},
                  {hip:[90,60], t:155, hd:0, a:{a:[35,35]}, l:{to:[98,AN-4], b:'f'}, l2:{to:at([90,60], dn(-150), LEG), b:'f'}, f:20, f2:-150}, hs]); }
/* Handstands from the front: hands shoulder width, straight arms */
const FHS=(o)=>Object.assign({v:'f', hip:[80,HSH[1]-62.3], t:180, rig:true, a:{to:[89,HSH[1]], b:'u'}, a2:{to:[71,HSH[1]], b:'u'}, l:{a:[2,2]}, l2:{a:[2,2]}}, o||{});
const STR={a:[44,44]};
def('straddle-handstand', [FHS({l:STR, l2:STR})]);
def('weight-shift-hs', [FHS({hip:[76,50.2], l:STR, l2:STR}), FHS({hip:[84,50.2], l:STR, l2:STR})]);
def('hs-shoulder-tap', [FHS({hip:[83,50.2]}), FHS({hip:[83,50.2], a2:{to:[88,83], b:'d'}})]);
def('fingertip-oahs', [FHS({hip:[78,50.2], l:{a:[46,46]}, l2:{a:[46,46]}, a:{to:[86,HSH[1]], b:'u'}, a2:{to:[62,HSH[1]], b:'u'}})]);
def('oahs', [FHS({hip:[78,50.2], l:{a:[46,46]}, l2:{a:[46,46]}, a:{to:[86,HSH[1]], b:'u'}, a2:{a:[90,90]}})]);
// the shoulders sink, then push tall to the ears: the body rises while the locked arms stay put
def('hs-shrug', [FHS({shr:0}), FHS({hip:[80,47.2], shr:-3})]);
// bail out: the weight goes onto one hand, the other lifts, the hips turn and the legs come down to that side
def('cartwheel-bail', [FHS({}), FHS({hip:[76.2,60.4], t:150, a2:{to:[66,98], b:'u'}, l:{a:[30,30]}, l2:{a:[70,70]}})]);
/* Wall plank: from a push-up with the feet at the wall, walk the feet up */
{ const mk=(ank, hx)=>{ const h=[hx,FL-1.5], sh=meet(ank, BODY, h, 31.5, 'u'); return {sh, hip:lineHip(ank, sh), hd:4, a:{to:h, b:'b'}, l:{to:ank, b:'u'}, f:0}; };
  def('wall-plank', [mk([24,FL-8], 98), mk([24,30], 76)], [['wall',18]]); }

/* ===== Levers under the bar =====
   The hands sit over the body's centre of mass: near the hips for a full lever, closer to the shoulders for a tuck.
   A front lever faces up (head left); a back lever faces down (head right), the same shapes turned half a circle. */
const LB=[80,10], LH=[80,12];
function lever(id, o){
  const back=!!o.back, k=o.k||'full', d={tuck:15, adv:18, straddle:21, half:20, full:24}[k], v=Math.sqrt(32.2**2-d*d);
  const sh= back? [LH[0]+d, LH[1]+v] : [LH[0]-d, LH[1]+v], hip= back? [sh[0]-LN.tor, sh[1]] : [sh[0]+LN.tor, sh[1]];
  const F={tuck:[[-125,64],64], adv:[[180,90],90], straddle:[[90,90],90], half:[[90,0],0], full:[[90,90],90]}[k];
  const p={sh, hip, hd:0, a:{to:LH, b:back?'b':'f'}, l:{a:back? F[0].map(a=>a+180) : F[0], s:k==='straddle'?[0.72,0.72]:[1,1]}, f:back? F[1]+180 : F[1]};
  def(id, [p], [['bar',...LB]].concat(o.assist? [['strap', hip[0]+(back?6:-6), hip[1]+7]] : []), {nofloor:true});
}
for(const [n,k] of [['tuck','tuck'],['adv-tuck','adv'],['straddle','straddle'],['half-lay','half'],['full','full']]) lever(n+'-fl',{k});
for(const [n,k] of [['tuck','tuck'],['adv-tuck','adv'],['straddle','straddle'],['full','full']]) lever(n+'-bl',{k, back:true});
lever('assisted-tuck-fl',{k:'tuck', assist:true}); lever('assisted-straddle-fl',{k:'straddle', assist:true}); lever('assisted-full-fl',{k:'full', assist:true});
lever('assisted-tuck-bl',{k:'tuck', back:true, assist:true}); lever('assisted-straddle-bl',{k:'straddle', back:true, assist:true}); lever('assisted-full-bl',{k:'full', back:true, assist:true});
/* German hang and skin the cat: hands fixed on the bar, the body rolls backward about the shoulders.
   In the German hang the arms run up behind the back, the chest faces down and forward, the hips sit under the bar. */
{ const hang={sh:[LH[0],LH[1]+32.2], t:0, hd:0, a:{to:LH, b:'f'}, l:{a:[0,0]}, f:20};
  const inv={sh:[LH[0],LH[1]+32.2], t:-180, hd:0, a:{to:LH, b:'f'}, l:{a:[-30,150]}, f:150};
  const gh={sh:[LH[0]+18,LH[1]+26.8], t:-300, hd:20, a:{to:LH, b:'f'}, l:{a:[-10,-10]}, f:10};
  def('german-hang', [gh], [['bar',...LB]], {nofloor:true});
  def('skin-the-cat', [hang, inv, cp(gh)], [['bar',...LB]], {nofloor:true});
  // a bar at hip height behind you: walk the feet forward and sink the hips, the arms rise up behind
  const bar=[58,66], sh=[bar[0]+30.4, bar[1]-11.2];
  def('german-hang-feet', [{sh, hip:at(sh, upv(8), -LN.tor), hd:4, a:{to:bar, b:'u'}, l:{to:[106,AN], b:'f'}, f:90}], [['rack',...bar]]); }

/* ===== Planche: hands down, shoulders forward of them, body level, face down (head right) =====
   The lean grows as the legs lengthen, so the hands stay under the centre of mass. */
function planche(id, o){
  const k=o.k||'full', H=[84,FL-1.5], d={tuck:12, adv:15, straddle:18, full:21}[k];
  const legs={tuck:[[55,-116],-116], adv:[[0,-90],-90], straddle:[[-90,-90],-90], full:[[-90,-90],-90]}[k];
  const mk=bent=>{ const sh= bent? [H[0]+15, FL-14] : [H[0]+d, H[1]-Math.sqrt(32.2**2-d*d)], hip= k==='tuck'? [sh[0]-Math.sqrt(LN.tor**2-36), sh[1]-6] : [sh[0]-LN.tor, sh[1]];
    return {sh, hip, hd:4, a:{to:H, b:'b'}, l:{a:legs[0], s:k==='straddle'?[0.72,0.72]:[1,1]}, f:legs[1]}; };
  const fr= o.push? [mk(false), mk(true)] : [mk(false)];
  def(id, fr, o.assist? [['strap', fr[0].hip[0]+4, fr[0].hip[1]+7]] : []);
}
for(const [n,k] of [['tuck','tuck'],['adv-tuck','adv'],['straddle','straddle'],['full','full']]){ planche(n+'-planche',{k}); planche(n+'-planche-pushup',{k, push:true}); }
planche('assisted-tuck-planche',{k:'tuck', assist:true}); planche('assisted-straddle-planche',{k:'straddle', assist:true}); planche('assisted-full-planche',{k:'full', assist:true});
planche('assisted-tuck-planche-pushup',{k:'tuck', push:true, assist:true}); planche('assisted-straddle-planche-pushup',{k:'straddle', push:true, assist:true}); planche('assisted-full-planche-pushup',{k:'full', push:true, assist:true});
// planche lean: a push-up on the toes with the shoulders about 15 to 20 cm past the hands
{ const H=[96,FL-1.5], sh=[H[0]+11, H[1]-Math.sqrt(32.2**2-121)], ank=[sh[0]-Math.sqrt(BODY**2-(FL-8-sh[1])**2), FL-8];
  def('planche-lean', [{sh, hip:lineHip(ank, sh), hd:4, a:{to:H, b:'b'}, l:{to:ank, b:'u'}, f:0}]); }

/* ===== Flags on a pole, from the front: the top arm pulls, the bottom arm pushes, both locked ===== */
function flag(id, o){
  const pole=118, t=o.t, shc=o.sh, px=[Math.cos(t*R), Math.sin(t*R)], sR=at(shc, px, -9), sL=at(shc, px, 9);
  const reach=(s, dir)=>[pole, s[1]+dir*Math.sqrt(Math.max(0, 32.2**2-(pole-s[0])**2))];
  def(id, [{v:'f', hip:at(shc, upv(t), -LN.tor), t, rig:true, a:{to:reach(sR,-1), b:'u'}, a2:{to:reach(sL,1), b:'d'}, l:o.l||{a:[0,0]}, l2:o.l||{a:[0,0]}}], [['post',pole+3]]);
}
flag('human-flag',{sh:[89.4,60], t:90}); flag('straddle-flag',{sh:[89.4,60], t:90, l:{a:[30,30]}});
// tuck flag: knees to the chest (toward you), hips lowered sideways to the height of the bottom hand
flag('tuck-flag',{sh:[96,60], t:37, l:{a:[165,10], s:[0.45,0.7]}});
flag('vertical-flag',{sh:[102,60], t:180});

/* ===== Arm balances: hands down, the knees rest on the backs of the upper arms ===== */
function balance(id, o){
  const H=[96,FL-1.5], sh=o.sh, hip=at(sh, [-Math.cos(o.tor*R), -Math.sin(o.tor*R)], LN.tor);
  const kn=at(hip, [Math.cos((o.tor+o.kn)*R), Math.sin((o.tor+o.kn)*R)], LN.th), sd=[-Math.cos(o.sn*R), -Math.sin(o.sn*R)], an=at(kn, sd, LN.sh);
  def(id, [{sh, hip, hd:16, a:{to:H, b:'b'}, l:{to:an, b:'f'}, f:Math.atan2(sd[0], sd[1])/R}]);
}
balance('frog-stand',{sh:[106,86], tor:25, kn:25, sn:15});
balance('crow-pose',{sh:[106,84], tor:30, kn:15, sn:20});
balance('crane-pose',{sh:[104.3,81.4], tor:38, kn:18, sn:25});
// elbow lever: forearms vertical, elbows in the front of the hips, the body level from head to heels
{ const H=[84,FL-1.5], sh=[99.9,91], p={sh, hip:[sh[0]-LN.tor, sh[1]], hd:4, a:{to:H, b:'b'}, l:{a:[-90,-90]}, f:-90};
  def('elbow-lever', [p]); def('one-arm-elbow-lever', [Object.assign(cp(p), {a2:{a:[96,92]}})]); }

/* ===== Presses to handstand: from a standing pike or straddle, the hips rise over the hands ===== */
function press(id, o){
  const sk=o.straddle?0.74:1, H=[94, o.hy||FL-1.5], ank=[H[0]-(o.straddle?8:20), AN];
  const hip0=[ank[0]+2, AN-LEG*sk+1], sh0=meet(hip0, LN.tor, H, 32.2, 'r'), sh1=[H[0]+1, H[1]-32.2], hip1=[H[0]+1, sh1[1]-LN.tor];
  const pk={sh:sh0, hip:hip0, hd:0, a:{to:H, b:'f'}, l:{to:ank, b:'f', s:[sk,sk]}, f:90};
  const hs={sh:sh1, hip:hip1, hd:0, a:{to:H, b:'f'}, l:{to:[hip1[0], hip1[1]-LEG*sk+0.5], b:'f', s:[sk,sk]}, f:180};
  def(id, o.rev? [hs,pk] : [pk,hs], (o.props||[]).concat(o.assist? [['strap', hip1[0]+5, hip1[1]]] : []));
}
press('pike-press',{}); press('straddle-press',{straddle:true}); press('press-negative',{straddle:true, rev:true});
press('elevated-straddle-press',{straddle:true, hy:FL-13, props:[['pad',88,FL-11.5,12,14]]}); press('assisted-straddle-press',{straddle:true, assist:true});

/* ===== Bridges (face up, head left) ===== */
{ // straight bridge: hands and heels stay put; the arms end vertical under the shoulders
  const hand=[52,FL-1.5], ank=[121,FL-6], up=meet(ank, BODY, hand, 32.2, 'u'), sit=[74,FL-6];
  def('straight-bridge', [{sh:sho(sit,-30), hip:sit, hd:0, a:{to:hand, b:'b'}, l:{to:ank, b:'u'}, f:180}, {sh:up, hip:lineHip(ank, up), hd:-8, a:{to:hand, b:'b'}, l:{to:ank, b:'u'}, f:180}]);
  // table top: shins vertical, thighs and torso level, hands under the shoulders
  const th=[53,FL-1.5], tk=[106,AN], tsit=[80,FL-6];
  def('table-bridge', [{sh:sho(tsit,-34), hip:tsit, hd:0, a:{to:th, b:'b'}, l:{to:tk, b:'u'}, f:90}, {sh:[53,80.3], hip:[82,87.5], hd:-10, a:{to:th, b:'b'}, l:{to:tk, b:'u'}, f:90}]);
  // full bridge: hands by the ears, heels near the glutes, the chest pushed over the hands
  const bsh=[46,82.3], bhip=[73.8,71.1], fb={sh:bsh, hip:bhip, hd:-30, a:{to:[44,FL-1.5], b:'f'}, l:{to:[92,AN], b:'u'}, f:90};
  def('full-bridge', [fb]);
  // stand to stand: arch back from standing, reach for the floor, land in the bridge
  def('stand-to-stand-bridge', [{hip:[91,HIPY], t:3, hd:0, a:{a:[178,178]}, l:{to:[92,AN], b:'f'}, f:90},
    {hip:[97,70], t:-45, hd:-20, a:{a:[210,210]}, l:{to:[92,AN], b:'f'}, f:90},
    {hip:bhip, t:ang(bhip,bsh), hd:-30, a:{a:[356,356]}, l:{to:[92,AN], b:'f'}, f:90}]);
  // wall walk: back to the wall, the hands walk down it into a bridge
  def('wall-walk-bridge', [{hip:[82,HIPY+2], t:-28, hd:-10, a:{to:[52,14], b:'u'}, l:{to:[90,AN], b:'f'}, f:90}, {hip:[84,70], t:-110, hd:-30, a:{to:[52,108], b:'u'}, l:{to:[90,AN], b:'f'}, f:90}], [['wall',49]]); }

/* ===== Mobility ===== */
{ const sit=(t,reach)=>({hip:[66,FL-6], t, hd:t>30?10:0, a:{to:reach, b:'d'}, l:{a:[90,90]}, f:170});
  def('long-sit', [sit(0,[84,101])]); def('pike-fold-toes', [sit(42,[114,100])]); def('pike-fold-palms', [sit(64,[120,FL-1.5])]); def('pike-fold-chest', [sit(78,[124,FL-3])]); }
{ const st=(tl,ry)=>({v:'f', hip:[80,FL-8], tl, t:0, a:{to:[72,ry], b:'u'}, a2:{to:[88,ry], b:'u'}, l:{a:[84,84]}, l2:{a:[84,84]}});
  def('straddle-fold-hands', [st(0.62,FL-1)]); def('straddle-fold-elbows', [st(0.4,FL-2)]); def('straddle-fold-chest', [st(0.2,FL-2)]); }
// frog: on the forearms, knees wide (pointing toward you), shins along the floor, hips back toward the knees
def('frog-stretch', [{sh:[96,FL-18], hip:[66,FL-12], hd:6, a:{to:[110,FL-3], b:'d'}, l:{a:[0,-90], s:[0.3,1]}, f:-90}]);
def('half-kneel-hip-flexor', [{hip:[76,FL-28], t:-4, a:{to:[88,64], b:'d'}, l:{to:[100,AN], b:'f'}, l2:{to:[54,FL-4], b:'d'}, f:90, f2:-90}]);
def('couch-stretch', [{hip:[66,FL-30], t:30, a:{to:[96,80], b:'d'}, l:{to:[104,AN], b:'f'}, l2:{to:[46,FL-28], b:'d'}, f:90, f2:180}], [['wall',42]]);
def('couch-stretch-upright', [{hip:[64,FL-28], t:-6, a:{to:[76,72], b:'d'}, l:{to:[100,AN], b:'f'}, l2:{to:[46,FL-28], b:'d'}, f:90, f2:180}], [['wall',42]]);
// back to a bench, heels of the hands on its edge, knees bend so the hips sink: the arms extend behind
def('shoulder-ext-stretch', [{sh:[86,66], hip:at([86,66], upv(4), -LN.tor), hd:2, a:{to:[60,82], b:'u'}, l:{to:[106,AN], b:'f'}, f:90}], [['bench',20,85,62]]);
// kneeling, elbows on a bench, palms together behind the head, hips over the knees, chest sinks below the elbows
def('bench-lat-stretch', [{sh:[92,92], hip:[62,88], hd:10, a:{to:[92,70], b:'f'}, l:{a:[3,-90]}, f:-90}], [['bench',98,82,140]]);
def('wall-arm-raise', [STAND(80,{hip:[80,HIPY+2], t:-4, a:{a:[90,92]}, l:{to:[86,AN], b:'f'}}), STAND(80,{hip:[80,HIPY+2], t:-4, a:{a:[176,178]}, l:{to:[86,AN], b:'f'}})], [['wall',72]]);
// face down, a stick held overhead lifts about 5 cm with the arms straight
def('overhead-stick-lift', [{hip:[56,FL-6], t:90, hd:-6, a:{a:[90,90]}, l:{a:[-90,-90]}, f:0, eq:'stick'}, {hip:[56,FL-6], t:90, hd:-6, a:{a:[96,96]}, l:{a:[-90,-90]}, f:0, eq:'stick'}]);
