/* ===== Pressing: bench, machines, flies ===== */
function bench(id, o){
  const inc=o.inc||0, hip=[90,88], t=-90+inc, sh=sho(hip,t), top=[sh[0]+(inc?5:2), sh[1]-31.5+(o.cg?0:0)], low=[sh[0]+(inc?7:5), sh[1]-6];
  const mk=w=>({hip, t, hd:-4, l:{to:[112,AN], b:'u'}, f:90, a:{to:w, b:'d'}, eq:o.eq||'bb'});
  def(id, [mk(top), mk(low)], (inc? [['ibench',94,94,-90+inc,46]] : [['bench',44,95,104]]).concat(o.props||[]));
}
bench('barbell-bench',{}); bench('pause-bench',{}); bench('close-grip-bench',{}); bench('db-bench',{eq:'db'}); bench('incline-db-press',{inc:35, eq:'db'});
bench('incline-bench',{inc:35}); bench('smith-press',{props:[['rack',62,30]]});
/* Flies lying: from the side the arms open out toward you, so they shorten as they lower */
{ const hip=[90,88], t=-90, sh=sho(hip,t), mk=(down)=>({hip, t, hd:-4, l:{to:[112,AN], b:'u'}, f:90, a:{a:[down?180:178, down?178:176], s:down?[0.35,0.4]:[1,1]}, eq:'db'});
  def('db-fly', [mk(false), mk(true)], [['bench',44,95,104]]);
  const pmk=d=>({hip, t, hd:-4, l:{to:[112,AN], b:'u'}, f:90, a:{a:[-152,180], s:d?[0.4,0.45]:[1,1]}, eq:'db'});
  def('db-pullover', [{hip, t, hd:-4, l:{to:[112,AN], b:'u'}, f:90, a:{a:[178,178]}, eq:'db'}, {hip, t, hd:-4, l:{to:[112,AN], b:'u'}, f:90, a:{a:[-120,-118]}, eq:'db'}], [['bench',44,95,104]]); }
/* Seated presses: push the handles forward (chest) */
function seatPress(id, o){
  const hip=[70,90], t=o.t||-8, sh=sho(hip,t), mk=f=>({hip, t, l:{a:[88,4]}, f:90, a:{to:f? [sh[0]+31, sh[1]+(o.up||2)] : [sh[0]+8, sh[1]+4], b:'d'}, eq:o.eq||''});
  def(id, [mk(false), mk(true)], [['seat',56,96,30],['back',62,96,-8+(o.t||0)+8,36]]);
}
seatPress('machine-chest-press',{}); seatPress('incline-machine-press',{up:-14, t:-22});
/* Flies from the front: arms open wide, then come together in front of the chest */
function frontFly(id, o){
  const hy=o.seat?88:HIPY, shY=hy-LN.tor, mk=(open,side)=>open? {a:o.open||[88,92]} : {to:[80+side*3.5, shY+(o.closeDy!=null?o.closeDy:7)], b:'d', s:[0.5,0.5]};
  const pose=open=>({v:'f', hip:[80,hy], t:0, l:o.seat? {a:[0,0], s:[0.35,1]} : [2,1], a:mk(open,-1), a2:mk(open,1), eq:o.eq||'', from:o.from});
  const A=reachOf(reachOf(pose(true), 'a', 'd'), 'a2', 'd'), B=pose(false);
  def(id, o.rev? [B,A] : [A,B], o.props||[]);
}
frontFly('pec-deck',{seat:true, props:[['seat',62,96,36]]}); frontFly('cable-fly',{eq:'cb', closeDy:12}); frontFly('low-cable-fly',{eq:'cb', open:[40,44], closeDy:-2});
frontFly('rear-delt-fly',{seat:true, rev:true, props:[['seat',62,96,36]]}); frontFly('cable-reverse-fly',{eq:'cb', rev:true});
/* Bent-over reverse fly, from the front: the torso leans toward you, the arms open out to the sides */
def('db-reverse-fly', [{v:'f', hip:[80,58], tl:0.45, t:0, hd:0, l:[2,1], a:{a:[4,4]}, eq:'db'}, {v:'f', hip:[80,58], tl:0.45, t:0, hd:0, l:[2,1], a:{a:[84,88]}, eq:'db'}]);

/* ===== Push-ups: the body pivots on the feet (or knees) ===== */
function pushup(id, o){
  const handY=o.handY!=null? o.handY : FL-1.5, ank=o.ank||[30,FL-8], knee=!!o.knee;
  const base= knee? [ank[0]+24, FL-4] : ank, r= knee? LN.th+LN.tor : BODY;
  const topSh=onArcY(base, r, handY-31.5+(o.topDy||0)), hand=[topSh[0]+(o.handDx||0), handY];
  const mk=(shY, air)=>{ const sh=onArcY(base, r, shY), hip=lineHip(base, sh);
    const p={sh, hip, hd:4, a: air? {to:[sh[0]+(o.reach?18:4), shY+(o.reach?-4:20)], b:'b'} : {to:hand, b:'b'}, f:0, eq:o.eq||''};
    if(knee){ p.l={to:at(base, upv(-62), LN.sh), b:'d'}; p.f=-150; } else p.l={to:ank, b:'u'};
    if(o.belt) p.belt=1; return p; };
  const fr=[mk(handY-31.5+(o.topDy||0)), mk(handY-(o.low!=null?o.low:9))];
  if(o.air) fr.push(mk(handY-36, true));
  def(id, o.air? [fr[1], fr[0], fr[2]] : fr, o.props||[]);
}
pushup('pushup',{}); pushup('knee-pushup',{knee:true}); pushup('close-grip-pushup',{}); pushup('diamond-pushup',{}); pushup('weighted-pushup',{});
pushup('deficit-pushup',{handY:FL-7, low:-2, props:[['box',94,FL-6,12]]});
pushup('incline-pushup',{handY:82, ank:[34,FL-8], props:[['box',100,83,22]]}); pushup('explosive-incline-pushup',{handY:82, ank:[34,FL-8], air:true, props:[['box',100,83,22]]});
pushup('clap-pushup',{air:true}); pushup('double-clap-pushup',{air:true}); pushup('behind-back-clap-pushup',{air:true}); pushup('superman-pushup',{air:true, reach:true});
pushup('pseudo-planche-pushup',{handDx:-10}); pushup('ring-pushup',{handY:FL-8, eq:'ring', props:[['strap',100,FL-14]]});
pushup('scap-pushup',{low:28}); pushup('wrist-lean',{handDx:-8, low:29}); pushup('palm-pulses',{low:30});
each(MOVES['palm-pulses'], f=>{ f.f=0; });
/* Wall push-up: hands on the wall */
{ const ank=[62,FL-8], hand=[118,44], mk=x=>{ const sh=onArcX(ank, BODY, x); return {sh, hip:lineHip(ank, sh), hd:4, a:{to:hand, b:'d'}, l:{to:ank, b:'u'}, f:0}; };
  def('wall-pushup', [mk(118-31), mk(118-13)], [['wall',121]]); }
/* Archer and one-arm push-ups, head-on: the body leans toward you and shifts over one arm */
function frontPush(id, o){
  const hy=o.hy||FL-1, hx=o.wide?54:58, topY=hy-Math.sqrt(32.2**2-(80-9-hx)**2)+0.18*LN.tor;
  // one-arm: the free hand rests on the lower back, elbow out to the side
  const mk=(dx,low)=>{ const hy0= low? hy-9 : topY; return {v:'f', hip:[80+dx, hy0], tl:0.18, t:0, hd:0, l:{a:[0,0], s:[0.12,0.12]}, a:{to:[hx,hy], b:'u'}, a2:o.one? {to:[86+dx, hy0-3], b:'u'} : {to:[o.wide?106:102,hy], b:'u'}}; };
  def(id, [mk(0,false), mk(o.shift||0,true)], o.props||[]);
}
frontPush('archer-pushup',{wide:true, shift:-10}); frontPush('one-arm-pushup',{one:true, shift:-6}); frontPush('assisted-one-arm-pushup',{shift:-8, props:[['box',100,FL-10,12]]});
each(MOVES['assisted-one-arm-pushup'], f=>{ f.a2={to:[106,FL-11], b:'u'}; });
frontPush('incline-one-arm-pushup',{one:true, shift:-6, hy:FL-25, props:[['box',46,FL-24,24]]});
/* Sphinx push-up: forearms down, press up onto the hands */
{ const ank=[30,FL-8], mk=up=>{ const shY=up? FL-31.5 : FL-17, sh=onArcY(ank, BODY, shY), hip=lineHip(ank, sh);
    return {sh, hip, hd:4, l:{to:ank, b:'u'}, f:0, a:{to: up? [sh[0]+1, FL-1.5] : [sh[0]+15, FL-2], b:'d'}}; };
  def('sphinx-pushup', [mk(false), mk(true)]); }
/* Tiger bend: from a forearm stand to a handstand, back to the wall */
{ const mk=up=>{ const sh= up? [82,FL-32] : [82,FL-18], hip=[80, sh[1]-30]; return {sh, hip, hd:180, l:{a:[178,178]}, f:180, a:{to: up? [82,FL-1.5] : [96,FL-2], b:'f'}}; };
  def('tiger-bend', [mk(false), mk(true)], [['wall',72]]); }
/* Knees and hands: wrist rocks */
{ const mk=dx=>{ const hip=[62+dx*0.6, FL-27], t=ang(hip, [92+dx, FL-31.5]); return {hip, t, hd:6, a:{to:[92,FL-1.5], b:'b'}, l:{to:[40,FL-4], b:'d'}, f:-90}; };
  def('wrist-rocks', [mk(0), mk(8)]); }

/* ===== Dips ===== */
function dip(id, o){
  const BY=o.by||66, hand=[80,BY], mk=(shY,t)=>{ const sh=[80+(o.shx||1), shY], hip=at(sh, upv(t), -LN.tor);
    const p={sh, hip, hd:0, a:{to:hand, b:'b'}, l:o.feet? {to:o.feet, b:'f'} : {a:[-14,-74]}, f:o.feet?90:20, eq:o.eq||'', from:o.from};
    if(o.belt) p.belt=1; return p; };
  const top=mk(BY-31.5, (o.lean||14)*0.4), bot=mk(BY-(o.deep||11), o.lean||16);
  def(id, o.hold? [top] : o.small? [top, mk(BY-27, (o.lean||14)*0.4)] : [top, bot], [['dips',80,BY]].concat(o.props||[]));
}
dip('dip',{lean:24}); dip('weighted-dip',{belt:true}); dip('negative-dip',{}); dip('band-dip',{}); dip('support-hold',{hold:true}); dip('scap-dip',{small:true});
dip('ring-support',{hold:true, eq:'ring', from:[80,30]}); dip('rto-support',{hold:true, eq:'ring', from:[80,30]}); dip('ring-dip',{eq:'ring', from:[80,30]});
dip('feet-assisted-ring-dip',{eq:'ring', from:[80,44], by:80, feet:[108,AN]});
each(MOVES['ring-support'], f=>{ f.l={a:[2,2]}; f.f=30; }); each(MOVES['rto-support'], f=>{ f.l={a:[2,2]}; f.f=30; });
['ring-support','rto-support','ring-dip','feet-assisted-ring-dip'].forEach(id=>{ MOVES[id].props=MOVES[id].props.filter(q=>q[0]!=='dips'); });
/* Straight-bar dip: the bar in front of the hips */
function barDip(id, o){
  const BY=o.by||70, hand=[84,BY], mk=(shY,t)=>{ const sh=[78, shY], hip=at(sh, upv(t), -LN.tor);
    return {sh, hip, a:{to:hand, b:'b'}, l:o.feet? {to:o.feet, b:'f'} : {a:[-4,-30]}, f:o.feet?90:20}; };
  def(id, [mk(BY-29, 4), mk(BY-8, 34)], [['bar',84,BY]]);
}
barDip('straight-bar-dip',{}); barDip('feet-assisted-straight-bar-dip',{by:86, feet:[108,AN]});
MOVES['feet-assisted-straight-bar-dip'].props=[['floor'],['rack',84,86]];
/* Bench dip: hands on the bench behind, legs forward */
{ const hand=[60,82], mk=shY=>{ const sh=[62,shY], hip=[64, shY+30]; return {sh, hip, a:{to:hand, b:'b'}, l:{to:[100,AN], b:'u'}, f:90}; };
  def('bench-dip', [mk(82-31), mk(82-14)], [['bench',30,85,62]]); }
/* Seated dip machine */
{ const hip=[74,88], sh=sho(hip,0), mk=d=>({hip, t:0, l:{a:[86,6]}, f:90, a:{to:[sh[0]+3, sh[1]+(d?31:16)], b:'b'}});
  def('machine-dip', [mk(false), mk(true)], [['seat',60,94,30],['back',62,94,-4,34]]); }

/* ===== Overhead pressing ===== */
function ohp(id, o){
  const seat=!!o.seat, hip=seat? [80,88] : [80,HIPY], t=o.t||0, sh=sho(hip,t);
  const mk=(up,dip)=>{ const h=dip? [hip[0]-2, hip[1]+6] : hip, s=sho(h,t);
    const p={hip:h, t, hd:0, l: seat? {a:[86,6]} : {to:[81,AN], b:'f'}, f:90, a:{to: up? [s[0]+(o.lm?24:1.5), s[1]-(o.lm?20:31)] : [s[0]+(o.lm?9:6), s[1]+3], b:'f'}, eq:o.eq||'bb', from:o.from};
    return p; };
  const fr= o.push? [mk(false,false), mk(false,true), mk(true,false)] : [mk(false), mk(true)];
  def(id, fr, (seat? [['seat',66,94,28],['back',70,94,-2,34]] : []).concat(o.props||[]));
}
ohp('ohp',{}); ohp('push-press',{push:true}); ohp('db-shoulder-press',{seat:true, eq:'db'}); ohp('arnold-press',{seat:true, eq:'db'}); ohp('machine-shoulder-press',{seat:true, eq:''});
ohp('landmine-press',{lm:true, eq:'lm', from:[22,FL-1], props:[['lm',22]]});
/* Front raise: a straight arm from the thigh to shoulder height */
def('front-raise', [STAND(80,{a:{a:[6,8]}, eq:'db'}), STAND(80,{a:{a:[88,90]}, eq:'db'})]);
/* Pike push-ups: hips high, the head comes down between the hands */
function pike(id, o){
  const hand=o.hand||[100,FL-1.5], ank=o.ank||[48,FL-8], hip=o.hip||meet(ank, LEG, hand, o.reach||52, 'u');
  const mk=d=>{ const sh=meet(hip, LN.tor, hand, d, o.pick||'r'); return {hip, sh, hd:-10, a:{to:hand, b:'b'}, l:{to:ank, b:'u'}, f:o.ft!=null?o.ft:0}; };
  def(id, [mk(31.5), mk(12)], o.props||[]);
}
pike('pike-pushup',{}); pike('elevated-pike-pushup',{ank:[60,83], reach:60, ft:20, props:[['box',50,90,20]]});
pike('incline-pike-pushup',{hand:[104,84], ank:[48,FL-8], props:[['box',96,85,22]]});
/* Handstand push-ups against the wall (back to it) and free */
function hspu(id, o){
  const hand=[84,FL-1.5], mk=d=>{ const sh=[84,FL-d], hip=[o.free?84:80, sh[1]-30]; return {sh, hip, hd:180, l:{a:[178,178]}, f:180, a:{to:hand, b:'f'}}; };
  def(id, [mk(32), mk(o.low||14)], o.free? [] : [['wall',72]]);
}
hspu('wall-hspu',{}); hspu('partial-wall-hspu',{low:22}); hspu('freestanding-hspu',{free:true});

/* ===== Triceps ===== */
{ const st=STAND(78,{t:4}), sh=sho(st.hip,st.t);
  def('tricep-pushdown', [Object.assign(cp(st), {a:{a:[4,92]}, eq:'cb', from:[100,-6]}), Object.assign(cp(st), {a:{a:[4,6]}, eq:'cb', from:[100,-6]})], [['pulley',100,-6]]);
  // facing away from a high pulley, arms overhead; the forearms straighten forward
  const lean=STAND(80,{t:26, l:{to:[86,AN], b:'f'}, l2:{to:[66,AN], b:'f'}});
  def('overhead-ext', [Object.assign(cp(lean), {a:{a:[160,30]}, eq:'cb', from:[34,-6]}), Object.assign(cp(lean), {a:{a:[150,150]}, eq:'cb', from:[34,-6]})], [['pulley',34,-6]]);
  const seat={hip:[80,88], t:0, l:{a:[86,6]}, f:90};
  def('seated-db-tri-ext', [Object.assign(cp(seat), {a:{a:[178,10]}, eq:'db'}), Object.assign(cp(seat), {a:{a:[178,178]}, eq:'db'})], [['seat',66,94,28],['back',70,94,-2,34]]);
  const lie={hip:[90,88], t:-90, hd:-4, l:{to:[112,AN], b:'u'}, f:90};
  def('skullcrusher', [Object.assign(cp(lie), {a:{a:[-172,-172]}, eq:'bb'}), Object.assign(cp(lie), {a:{a:[-172,-60]}, eq:'bb'})], [['bench',44,95,104]]);
  const hinge={hip:[72,68], t:68, l:{to:[80,AN], b:'f'}, f:90};
  def('db-kickback', [Object.assign(cp(hinge), {a:{a:[-60,4]}, eq:'db'}), Object.assign(cp(hinge), {a:{a:[-60,-62]}, eq:'db'})]); }
/* Bodyweight triceps extension: leaning on a bar, the head goes under it */
function bwExt(id, o){
  const bar=o.bar||[110,62], ank=o.ank||[50,FL-8], mk=bent=>{ const d=bent? 15 : 31.5, sh=meet(ank, BODY, bar, d, 'l'); return {sh, hip:lineHip(ank, sh), hd:4, a:{to:bar, b:'d'}, l:{to:ank, b:'u'}, f:0}; };
  def(id, [mk(false), mk(true)], [['bar',...bar]]);
  MOVES[id].props=[['floor'],['rack',bar[0],bar[1]]];
}
bwExt('bw-tricep-ext-high',{}); bwExt('bw-tricep-ext-low',{bar:[104,84], ank:[44,FL-8]});
