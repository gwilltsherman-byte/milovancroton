/* ==================== EXERCISE VISUALS ====================
   Every movement gets a drawn figure and a muscle map, made here from numbers: nothing to download, so it works
   offline and follows the light and dark themes. A pose is where the hips are, how the torso leans, and where each
   hand and foot goes; the arms and legs bend to reach (two-bone IK), so feet stay on the floor and hands on the bar
   as the figure moves. Frames play back and forth; with reduced motion, the first and last frames show side by side.
   Side view faces right. Front view faces you; its arms and legs can point toward you (s < 1 shortens them). */
(function(){
'use strict';
const R=Math.PI/180, FL=114;                          // floor line
const LN={tor:30, nk:4, hd:6.6, ua:17, fa:15.5, th:24, sh:23, ft:9};
const WD={tor:14, ua:7, fa:6, th:10, sh:8, ft:4.5, nk:6};
const dn=a=>[Math.sin(a*R), Math.cos(a*R)];          // angle from straight down, + toward the front
const upv=a=>[Math.sin(a*R), -Math.cos(a*R)];        // angle from straight up, + toward the front
const at=(p,v,l)=>[p[0]+v[0]*l, p[1]+v[1]*l];
const ang=(a,b)=>Math.atan2(b[0]-a[0], -(b[1]-a[1]))/R;   // angle of a→b from straight up
/* Two-bone IK: from base to target with lengths l1, l2; the joint goes the way of bend (f, b, u, d). */
function two(b, t, l1, l2, bend){
  const dx=t[0]-b[0], dy=t[1]-b[1], d=Math.hypot(dx,dy)||1e-6;
  const dc=Math.min(l1+l2-1e-3, Math.max(Math.abs(l1-l2)+1e-3, d)), a=Math.atan2(dy,dx);
  const c=Math.acos(Math.max(-1, Math.min(1, (l1*l1+dc*dc-l2*l2)/(2*l1*dc))));
  const j1=[b[0]+Math.cos(a+c)*l1, b[1]+Math.sin(a+c)*l1], j2=[b[0]+Math.cos(a-c)*l1, b[1]+Math.sin(a-c)*l1];
  const pv={f:[1,0], b:[-1,0], u:[0,-1], d:[0,1]}[bend||'f']||[1,0], j=(j1[0]*pv[0]+j1[1]*pv[1])>=(j2[0]*pv[0]+j2[1]*pv[1])? j1 : j2;
  const ex=t[0]-j[0], ey=t[1]-j[1], e=Math.hypot(ex,ey)||1e-6;
  return [j, [j[0]+ex/e*l2, j[1]+ey/e*l2]];
}
/* A limb: [angle1, angle2] from straight down, {to:[x,y], b} reached by IK, optionally s:[k1,k2] to shorten (front view). */
function limb(base, sp, l1, l2, side, rot){
  const s=(sp&&sp.s)||[1,1], a=Array.isArray(sp)? sp : sp.a;
  if(a){ const a1=a[0]*side+(rot||0), a2=a[1]*side+(rot||0), j=at(base, dn(a1), l1*s[0]); return [j, at(j, dn(a2), l2*s[1])]; }
  return two(base, sp.to, l1*s[0], l2*s[1], sp.b);
}
/* Joint positions for one pose. */
function solve(p){
  const fv=p.v==='f';
  let hip=p.hip, t=p.t||0;
  if(p.sh&&hip) t=ang(hip, p.sh);
  else if(p.sh) hip=at(p.sh, upv(t), -LN.tor*(p.tl||1));
  const tl=LN.tor*(p.tl||1), shc=at(hip, upv(t), tl), nk=at(shc, upv(t+(p.hd||0)*0.4), LN.nk), head=at(nk, upv(t+(p.hd||0)), LN.hd);
  const J={hip, sh:shc, nk, head, t};
  if(!fv){
    const A=p.a||[4,4], A2=p.a2||A, Lg=p.l||[0,0], Lg2=p.l2||Lg;
    [J.el,J.wr]=limb(shc, A, LN.ua, LN.fa, 1); [J.el2,J.wr2]=limb(shc, A2, LN.ua, LN.fa, 1);
    [J.kn,J.an]=limb(hip, Lg, LN.th, LN.sh, 1); [J.kn2,J.an2]=limb(hip, Lg2, LN.th, LN.sh, 1);
    J.to=at(J.an, dn(p.f==null?90:p.f), LN.ft); J.to2=at(J.an2, dn(p.f2==null?(p.f==null?90:p.f):p.f2), LN.ft);
  } else {
    // front: shoulders and hips spread across the torso; arm and leg angles point outward on each side
    const px=[Math.cos(t*R), Math.sin(t*R)], sw=9, hw=5.5;
    J.shR=at(shc, px, -sw); J.shL=at(shc, px, sw); J.hpR=at(hip, px, -hw); J.hpL=at(hip, px, hw);
    if(p.shr){ J.shR[1]-=p.shr; J.shL[1]-=p.shr; }
    // arm angles turn with the torso; leg angles too when the body moves as one piece (rig), as in a side plank
    const A=p.a||[8,8], A2=p.a2||A, Lg=p.l||[2,2], Lg2=p.l2||Lg, lr=p.rig? -t : 0;
    [J.el,J.wr]=limb(J.shR, A, LN.ua, LN.fa, -1, -t*0+(-t)); [J.el2,J.wr2]=limb(J.shL, A2, LN.ua, LN.fa, 1, -t);
    [J.kn,J.an]=limb(J.hpR, Lg, LN.th, LN.sh, -1, lr); [J.kn2,J.an2]=limb(J.hpL, Lg2, LN.th, LN.sh, 1, lr);
  }
  return J;
}
/* Muscles shown on the figure: which body part each one tints. */
const PART={chest:'tor', abs:'tor', obli:'tor', lat:'tor', uback:'tor', lback:'tor', serr:'tor', trap:'nk', neck:'nk', fdelt:'dl', sdelt:'dl', rdelt:'dl',
  bi:'ua', tri:'ua', fore:'fa', glute:'gl', quad:'th', ham:'th', add:'th', calf:'sh'};
/* Which muscles a figure shows. Each section passes the muscles it counts sets toward; these tables cover what that
   can't say. Skill holds count toward no muscle's weekly sets, yet clearly work some; stretches lengthen muscles
   rather than train them, so they are labelled as stretched. Two muscles appear here that no section tracks:
   the adductors (inner thigh) and serratus anterior (the side of the ribs, which moves the shoulder blade forward). */
const FIG_GROUP={
  // handstands: shoulder flexion overhead (front and side delts), upper traps and serratus rotating the shoulder
  // blades up; triceps keep the elbows locked; wrists and forearms make the balance corrections
  handstand:{p:['fdelt','trap'], s:['sdelt','serr','tri','fore','abs']}, hsdrill:{p:['fdelt','trap'], s:['sdelt','serr','tri','fore','abs']},
  onearmhs:{p:['fdelt','trap'], s:['sdelt','serr','tri','fore','obli']},
  // crow and frog stands: bent-arm support on the wrists, the core rounds and holds the knees on the arms
  armbalance:{p:['fore','fdelt'], s:['tri','chest','serr','abs']},
  ankle:{p:['calf'], s:[], k:'stretch'}, balance:{p:['glute','calf'], s:['quad','abs']},
  overhead:{p:['lat'], s:['chest','tri'], k:'stretch'}, pike:{p:['ham'], s:['calf'], k:'stretch'},
  compression:{p:['abs','quad'], s:['obli']}, straddle:{p:['add'], s:['ham'], k:'stretch'},
  hipflex:{p:['quad'], s:[], k:'stretch'}, shoulderext:{p:['fdelt','chest'], s:['bi'], k:'stretch'},
  wrist:{p:['fore'], s:[]}, scap:{p:['serr','trap'], s:['uback']}, landing:{p:['quad','glute'], s:['calf','ham']},
};
const FIG_KEY={
  'copenhagen-plank':{p:['add','obli'], s:['abs','glute']}, 'short-copenhagen':{p:['add','obli'], s:['abs','glute']},
  'lateral-lunge':{p:['quad','glute'], s:['add','ham']}, 'cossack-squat':{p:['quad','glute'], s:['add','ham']},
  'german-hang':{p:['fdelt','chest'], s:['bi'], k:'stretch'}, 'german-hang-feet':{p:['fdelt','chest'], s:['bi'], k:'stretch'},
  'elbow-lever':{p:['fore','abs'], s:['tri','fdelt','lback']}, 'one-arm-elbow-lever':{p:['fore','abs','obli'], s:['tri','fdelt','lback']},
  'pike-compression':{p:['abs','quad'], s:['obli']}, 'seated-leg-lift':{p:['abs','quad'], s:['obli']}, 'straddle-lift':{p:['abs','quad'], s:['glute']},
  'straight-bridge':{p:['glute','ham'], s:['lback','rdelt','tri']}, 'table-bridge':{p:['glute'], s:['ham','lback','rdelt']},
  'wall-arm-raise':{p:['fdelt','trap'], s:['sdelt','serr']}, 'overhead-stick-lift':{p:['fdelt','trap'], s:['sdelt','serr']},
  'bench-lat-stretch':{p:['lat'], s:['tri','chest'], k:'stretch'},
  'scap-pushup':{p:['serr'], s:['chest','fdelt']}, 'scap-dip':{p:['lat'], s:['chest','trap']}, 'hs-shrug':{p:['trap','serr'], s:['fdelt','tri']},
};
const has=m=>!!(m&&((m.p||[]).length||(m.s||[]).length));
const MNAME={chest:'chest', fdelt:'front delts', sdelt:'side delts', rdelt:'rear delts', lat:'lats', uback:'upper back', trap:'traps', bi:'biceps', tri:'triceps', fore:'forearms',
  quad:'quads', ham:'hamstrings', glute:'glutes', calf:'calves', abs:'abs', obli:'obliques', lback:'lower back', neck:'neck', add:'adductors', serr:'serratus anterior'};
function musFor(id, mus, group){ return FIG_KEY[id] || (has(mus)? mus : FIG_GROUP[group]) || mus || {p:[], s:[]}; }
const r1=n=>Math.round(n*10)/10;
/* The drawing for one pose: a list of shapes in the same order every frame, so a frame only moves them. */
function shapes(p, J, tint){
  const out=[], tc=part=>tint[part]||'', L=(a,b,w,c)=>out.push(['l',a,b,w,c]), C=(a,r,c)=>out.push(['c',a,r,0,c]);
  const eq=p.eq||'', both=p.eq2!==false;
  // equipment that moves with the hands, behind the near arm
  const gear=(w, far)=>{
    if(!eq) return;
    const k=eq.split(':')[0];
    if(k==='bb'&&!far){ C(w,9,'mvplate'); }
    if(k==='db'&&(both||!far)){ L([w[0]-4.5,w[1]],[w[0]+4.5,w[1]],3,'mvgear'); C([w[0]-4.5,w[1]],3,'mvgearf'); C([w[0]+4.5,w[1]],3,'mvgearf'); }
    if(k==='kb'&&!far){ C([w[0],w[1]+4],4.5,'mvgearf'); }
    if((k==='cb'||k==='lm')&&!far&&p.from){ L(p.from, w, k==='lm'?3:1.2, k==='lm'?'mvgear':'mvcable'); }
    if(k==='ring'&&(both||!far)){ C([w[0],w[1]-2],4,'mvring'); if(p.from) L([w[0],w[1]-6],[w[0],p.from[1]],1,'mvcable'); }
    if(k==='wheel'&&!far){ C([w[0],w[1]+2.5],5.5,'mvgearf'); }
    if(k==='pl'&&!far){ C(w,6,'mvplate'); }
    if(k==='stick'&&!far){ C(w,2,'mvgearf'); }
  };
  if(p.v!=='f'){
    if(p.belt) C([J.hip[0]+1, J.hip[1]+13], 6.5, 'mvplate');
    if(p.plat!=null){ const c=at(J.to, upv(p.plat), 2.5); L(at(c, upv(p.plat+90), 11), at(c, upv(p.plat-90), 11), 3.5, 'mvgear'); }
    L(J.hip, J.kn2, WD.th, 'mvfar'); L(J.kn2, J.an2, WD.sh, 'mvfar'); L(J.an2, J.to2, WD.ft, 'mvfar');
    L(J.sh, J.el2, WD.ua, 'mvfar'); L(J.el2, J.wr2, WD.fa, 'mvfar'); C(J.wr2, 2.8, 'mvfarf'); gear(J.wr2, true);
    L(J.hip, J.sh, WD.tor, tc('tor')||'mvbody'); C(J.hip, 6.5, tc('gl')||'mvbodyf');
    L(J.sh, J.nk, WD.nk, tc('nk')||'mvbody'); C(J.head, LN.hd, 'mvbodyf');
    L(J.hip, J.kn, WD.th, tc('th')||'mvbody'); L(J.kn, J.an, WD.sh, tc('sh')||'mvbody'); L(J.an, J.to, WD.ft, 'mvbody');
    gear(J.wr, false); C(J.sh, 5, tc('dl')||'mvbodyf');
    L(J.sh, J.el, WD.ua, tc('ua')||'mvbody'); L(J.el, J.wr, WD.fa, tc('fa')||'mvbody'); C(J.wr, 2.8, 'mvbodyf');
  } else {
    L(J.hip, J.sh, 17, tc('tor')||'mvbody'); C(J.hpR, 5.5, tc('gl')||'mvbodyf'); C(J.hpL, 5.5, tc('gl')||'mvbodyf');
    L(J.sh, J.nk, WD.nk, tc('nk')||'mvbody'); C(J.head, LN.hd, 'mvbodyf');
    for(const [h,k,a] of [[J.hpR,J.kn,J.an],[J.hpL,J.kn2,J.an2]]){ L(h,k,WD.th,tc('th')||'mvbody'); L(k,a,WD.sh,tc('sh')||'mvbody'); L(a,[a[0],a[1]+2],5,'mvbody'); }
    for(const [s,e,w] of [[J.shR,J.el,J.wr],[J.shL,J.el2,J.wr2]]){ C(s,5,tc('dl')||'mvbodyf'); L(s,e,WD.ua,tc('ua')||'mvbody'); L(e,w,WD.fa,tc('fa')||'mvbody'); C(w,2.8,'mvbodyf'); }
    gear(J.wr, false); gear(J.wr2, true);
  }
  return out;
}
/* Props that stay put: floor, bench, bar, box, wall and so on. */
function props(list, vb){
  const o=[], X0=vb[0], X1=vb[0]+vb[2], Y0=vb[1];
  for(const q of list||[]){
    const [k,...a]=q;
    if(k==='floor') o.push(`<line class="mvfloor" x1="${r1(X0)}" y1="${FL+2.5}" x2="${r1(X1)}" y2="${FL+2.5}"/>`);
    else if(k==='bench'){ const [x1,y,x2]=a; o.push(`<line class="mvprop" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke-width="6"/><line class="mvprop" x1="${x1+4}" y1="${y}" x2="${x1+4}" y2="${FL+3}" stroke-width="2.5"/><line class="mvprop" x1="${x2-4}" y1="${y}" x2="${x2-4}" y2="${FL+3}" stroke-width="2.5"/>`); }
    else if(k==='ibench'){ const [x,y,deg,len]=a, e=at([x,y], upv(deg), len); o.push(`<line class="mvprop" x1="${r1(x)}" y1="${r1(y)}" x2="${r1(e[0])}" y2="${r1(e[1])}" stroke-width="6"/><line class="mvprop" x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x)}" y2="${FL+3}" stroke-width="2.5"/>`); }
    else if(k==='pad'){ const [x,y,w,h]=a; o.push(`<rect class="mvpropf" x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/>`); }
    else if(k==='box'){ const [x,y,w]=a; o.push(`<rect class="mvpropf" x="${x}" y="${y}" width="${w}" height="${FL+2.5-y}" rx="1.5"/>`); }
    else if(k==='bar'){ const [x,y]=a; o.push(`<line class="mvprop" x1="${x-12}" y1="${y}" x2="${x+12}" y2="${y}" stroke-width="2"/><line class="mvprop" x1="${x-12}" y1="${y}" x2="${x-12}" y2="${r1(Y0)}" stroke-width="2"/><circle class="mvpropf" cx="${x}" cy="${y}" r="2.6"/>`); }
    else if(k==='rack'){ const [x,y]=a; o.push(`<line class="mvprop" x1="${x}" y1="${y}" x2="${x}" y2="${FL+3}" stroke-width="2.5"/><line class="mvprop" x1="${x-6}" y1="${y}" x2="${x+6}" y2="${y}" stroke-width="2.5"/>`); }
    else if(k==='wall'){ const [x]=a; o.push(`<line class="mvprop" x1="${x}" y1="${r1(Y0)}" x2="${x}" y2="${FL+2.5}" stroke-width="3"/>`); }
    else if(k==='post'){ const [x]=a; o.push(`<line class="mvprop" x1="${x}" y1="${r1(Y0)}" x2="${x}" y2="${FL+2.5}" stroke-width="4"/>`); }
    else if(k==='dips'){ const [x,y]=a; o.push(`<line class="mvprop" x1="${x-9}" y1="${y}" x2="${x+9}" y2="${y}" stroke-width="3"/><line class="mvprop" x1="${x}" y1="${y}" x2="${x}" y2="${FL+3}" stroke-width="2.5"/>`); }
    else if(k==='pulley'){ const [x,y]=a; o.push(`<circle class="mvpropf" cx="${x}" cy="${y}" r="2.6"/><line class="mvprop" x1="${x}" y1="${y}" x2="${x}" y2="${y<60?r1(Y0):FL+3}" stroke-width="2"/>`); }
    else if(k==='strap'){ const [x,y]=a; o.push(`<line class="mvcable" x1="${x}" y1="${r1(Y0)}" x2="${x}" y2="${y}"/>`); }
    else if(k==='seat'){ const [x,y,w]=a; o.push(`<line class="mvprop" x1="${x}" y1="${y}" x2="${x+w}" y2="${y}" stroke-width="5"/><line class="mvprop" x1="${x+w/2}" y1="${y}" x2="${x+w/2}" y2="${FL+3}" stroke-width="2.5"/>`); }
    else if(k==='back'){ const [x,y,deg,len]=a, e=at([x,y], upv(deg), len); o.push(`<line class="mvprop" x1="${r1(x)}" y1="${r1(y)}" x2="${r1(e[0])}" y2="${r1(e[1])}" stroke-width="5"/>`); }
    else if(k==='lm'){ const [x]=a; o.push(`<circle class="mvpropf" cx="${x}" cy="${FL+1}" r="2.5"/>`); }
    else if(k==='mat'){ const [x1,x2]=a; o.push(`<line class="mvprop" x1="${x1}" y1="${FL+1}" x2="${x2}" y2="${FL+1}" stroke-width="3"/>`); }
  }
  return o.join('');
}
const CSS=`<style>.mvfig .mvbody,.mvfig .mvfar,.mvfig .mvmain,.mvfig .mvhelp{fill:none;stroke-linecap:round}.mvfig .mvbody{stroke:var(--mv-body)}.mvfig .mvfar{stroke:var(--mv-far)}
.mvfig .mvbodyf{fill:var(--mv-body)}.mvfig .mvfarf{fill:var(--mv-far)}.mvfig .mvmain{stroke:var(--mv-main)}.mvfig .mvhelp{stroke:var(--mv-help)}
.mvfig .mvmainf{fill:var(--mv-main)}.mvfig .mvhelpf{fill:var(--mv-help)}.mvfig .mvfloor{stroke:var(--mv-floor);stroke-width:1.5}.mvfig .mvprop{stroke:var(--mv-prop);fill:none;stroke-linecap:round}
.mvfig .mvpropf{fill:var(--mv-prop)}.mvfig .mvplate{fill:var(--mv-gear);stroke:var(--mv-bg);stroke-width:1.2}.mvfig .mvgear{stroke:var(--mv-gear);stroke-linecap:round;fill:none}.mvfig .mvgearf{fill:var(--mv-gear)}
.mvfig .mvcable{stroke:var(--mv-prop);stroke-width:1.1;fill:none}.mvfig .mvring{fill:none;stroke:var(--mv-gear);stroke-width:2}</style>`;
const svgShapes=(list, tint)=>list.map(([k,a,b,w,c])=>{
  const cl=c==='mvmain'||c==='mvhelp'? c : c;
  return k==='l'? `<line class="${cl}" x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" stroke-width="${w}"/>`
    : `<circle class="${cl}" cx="${r1(a[0])}" cy="${r1(a[1])}" r="${b}"/>`; }).join('');
/* Which classes the body parts take for a set of muscles: main ones strongest, helpers lighter. */
function tintFor(m){
  const t={}; (m&&m.s||[]).forEach(k=>{ if(PART[k]) t[PART[k]]='mvhelp'; }); (m&&m.p||[]).forEach(k=>{ if(PART[k]) t[PART[k]]='mvmain'; });
  // circles (hip, shoulder) take fill classes
  const f={}; Object.keys(t).forEach(k=>{ f[k]= (k==='gl'||k==='dl')? t[k]+'f' : t[k]; }); return f;
}
/* Mixing two poses: numbers blend, everything else comes from the first. */
function mix(a, b, k){
  if(typeof a==='number'&&typeof b==='number') return a+(b-a)*k;
  if(Array.isArray(a)&&Array.isArray(b)) return a.map((x,i)=>mix(x,b[i],k));
  if(a&&b&&typeof a==='object'&&typeof b==='object'){ const o={}; for(const key in a) o[key]= key in b? mix(a[key],b[key],k) : a[key]; return o; }
  return a;
}
const ease=x=>x<.5? 2*x*x : 1-Math.pow(-2*x+2,2)/2;
const MOVES={};   // filled below: id -> {frames, props, hold}
function frame(m, k){ // k from 0 to frames-1, fractional
  const F=m.frames, i=Math.min(F.length-2, Math.floor(k)); if(F.length<2) return F[0];
  return mix(F[i], F[i+1], ease(k-i));
}
function box(m){
  if(m.vb) return m.vb;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; const add=(x,y,r)=>{ r=r||0; x0=Math.min(x0,x-r); y0=Math.min(y0,y-r); x1=Math.max(x1,x+r); y1=Math.max(y1,y+r); };
  m.frames.forEach(p=>{ const J=solve(p); Object.entries(J).forEach(([k,v])=>{ if(Array.isArray(v)&&v.length===2) add(v[0],v[1], k==='head'?LN.hd+1:6); }); if(p.from) add(p.from[0],p.from[1],3); });
  (m.props||[]).forEach(([k,...a])=>{ if(k==='bench'){ add(a[0],a[1]); add(a[2],a[1]); } else if(k==='box'||k==='pad'){ add(a[0],a[1]); add(a[0]+(a[2]||0),a[1]+(a[3]||0)); }
    else if(k==='bar'||k==='pulley'||k==='rack'||k==='dips'){ add(a[0],a[1],4); } else if(k==='seat'){ add(a[0],a[1]); add(a[0]+a[2],a[1]); }
    else if(k==='ibench'||k==='back'){ add(a[0],a[1]); const e=at([a[0],a[1]], upv(a[2]), a[3]); add(e[0],e[1]); } });
  if((m.props||[]).some(q=>q[0]==='floor')) y1=Math.max(y1, FL+4);
  x0-=5; x1+=5; y0-=5; y1+=3;
  let w=x1-x0, h=y1-y0; const ar=4/3;
  if(w/h<ar){ const nw=h*ar; x0-=(nw-w)/2; w=nw; } else { const nh=w/ar; y0-=(nh-h)/2; h=nh; }
  return (m.vb=[x0,y0,w,h]);
}
function figureSVG(id, mus, opt){
  const m=MOVES[id]; if(!m) return '';
  const tint=tintFor(mus), o=opt||{}, still=o.still!=null? o.still : null;
  const pose=still!=null? frame(m, still) : m.frames[0];
  const body=svgShapes(shapes(pose, solve(pose), tint), tint);
  const live= still==null && m.frames.length>1;
  const vb=box(m);
  return `<svg class="mvfig${o.cls?' '+o.cls:''}" viewBox="${vb.map(r1).join(' ')}" ${live? `data-mv="${id}" data-mvm="${esc(JSON.stringify(tint))}"` : ''} aria-hidden="true">${CSS}${props(m.props, vb)}<g class="mvb">${body}</g></svg>`;
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---- Muscle map: front and back, main muscles strongest and helpers lighter ---- */
const MAP={   // right half of each region, as points relative to the body's centre line; mirrored for the left
  f:{ trap:[[3,15],[10,17.5],[5,19]], neck:[[0,12],[3,12],[3,15.5],[0,15.5]], fdelt:[[9.5,18],[13,19],[13.5,25],[10,24]], sdelt:[[13,18.5],[15.5,20.5],[15.5,26.5],[13.5,25.5]],
      chest:[[1,19.5],[9.5,19],[11,26],[7,29],[1,29]], bi:[[11.5,27],[14.8,27],[14.8,37],[12,37.5]], fore:[[12,40],[15.5,40],[16.5,53],[13,53]],
      abs:[[1,30.5],[5.5,30.5],[5.5,49],[1,49]], obli:[[6,30],[9.5,29.5],[10,44],[6,48]], quad:[[2.5,55],[10.5,53],[10.5,74],[5,77],[2.5,72]], calf:[[4.5,82],[8.5,82],[8.2,97],[5.5,97]],
      add:[[1,54.5],[4.2,55.5],[4.6,70],[2.6,71],[1.2,62]], serr:[[9.6,26.6],[11.3,27.3],[11.1,34.5],[9.7,31.8]] },
  b:{ trap:[[0,13],[3,13],[11,18],[4,22],[0,24]], neck:[[0,10],[2.8,10],[3,13],[0,13]], rdelt:[[10,18.5],[13.5,20],[14,25.5],[10.5,24]], sdelt:[[13.5,18.5],[15.5,20.5],[15.5,26.5],[14,25.5]],
      uback:[[1,23],[4,22],[9,20],[8.5,29],[1,32]], lat:[[5,31],[9,27],[11,28],[9.5,42],[5,45]], tri:[[11.5,27],[14.8,27],[14.8,37],[12,37.5]], fore:[[12,40],[15.5,40],[16.5,53],[13,53]],
      lback:[[1,40],[5,40],[5,50],[1,51]], glute:[[1,52],[9.5,51],[11,60],[6,64],[1,62]], ham:[[2.5,65],[10.5,62],[10.5,78],[5,80],[2.5,76]], calf:[[4.5,82],[9,82],[9,96],[5.5,97]] }
};
const SIL='M0,6c3.6,0 6,2.6 6,6.2c0,2-0.8,3.4-1.8,4.2l1.3,0.6c4.8,0.7 8.6,1.5 10.6,3.5c1.6,1.7 1.2,6.3 1.3,10l0.6,10.4l1,13.6l-2.6,0.4l-2.6-11.5l-0.6-9.6l-1.4-2.2l-0.4,11.6c1.1,3 1.8,6.6 1.6,10.2l-0.7,15c-0.2,4.3-0.6,8.4-1.4,13l-1.4,14.6l-0.4,4.2l-4.4,0l-0.6-17l-0.4-12.8l-0.7-10.4l-0.8,0Z';
function mapSVG(mus){
  const P=new Set(mus&&mus.p||[]), S=new Set(mus&&mus.s||[]);
  const body=(cx, side)=>{
    const half=`<path class="mvsil" d="${SIL}" transform="translate(${cx},0)"/><path class="mvsil" d="${SIL}" transform="translate(${cx},0) scale(-1,1)"/>`;
    const regs=Object.entries(MAP[side]).map(([k,pts])=>{ const c=P.has(k)?'mvmainf':S.has(k)?'mvhelpf':'mvoff';
      const poly=sgn=>pts.map(([x,y])=>`${r1(cx+x*sgn)},${y}`).join(' ');
      return `<polygon class="${c}" points="${poly(1)}"/><polygon class="${c}" points="${poly(-1)}"/>`; }).join('');
    return half+regs;
  };
  return `<svg class="mvmap" viewBox="0 3 64 104" aria-hidden="true"><style>.mvmap .mvsil{fill:var(--mv-sil)}.mvmap .mvoff{fill:var(--mv-off)}.mvmap .mvmainf{fill:var(--mv-main)}.mvmap .mvhelpf{fill:var(--mv-help)}</style>${body(16,'f')}${body(48,'b')}</svg>`;
}

/* ---- Playing the figures: a small loop that moves every one on screen ---- */
const live=new Map();
const still=()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
function roots(){ const r=[document]; document.querySelectorAll('[id^="m-"]').forEach(h=>{ if(h.shadowRoot) r.push(h.shadowRoot); }); return r; }
function scan(){
  if(still()) return;
  roots().forEach(r=>r.querySelectorAll('svg.mvfig[data-mv]').forEach(el=>{ if(!live.has(el)){ let t={}; try{ t=JSON.parse(el.dataset.mvm||'{}'); }catch(e){}
    live.set(el, {m:MOVES[el.dataset.mv], tint:t, g:el.querySelector('.mvb'), t0:performance.now()}); } }));
  if(live.size && !raf) raf=requestAnimationFrame(tick);
}
let raf=0, last=0;
function tick(now){
  raf=0; if(document.hidden){ return; }
  if(now-last<33){ raf=requestAnimationFrame(tick); return; }   // about 30 frames a second is smooth enough and kinder to batteries
  last=now;
  for(const [el, s] of live){
    if(!el.isConnected||!s.m){ live.delete(el); continue; }
    const r=el.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight||!r.width) continue;
    const n=s.m.frames.length-1, per=1300, hold=380, cyc=(per+hold)*n*2, x=((now-s.t0)%cyc)/(per+hold);
    // forward through the frames, then back, pausing at each end
    let k= x<n? x : 2*n-x; const seg=Math.floor(k), fr=k-seg, part=Math.min(1, fr*(per+hold)/per); k=Math.min(n, seg+part);
    const pose=frame(s.m, k), list=shapes(pose, solve(pose), s.tint), kids=s.g.children;
    if(kids.length!==list.length) continue;
    list.forEach(([kd,a,b], i)=>{ const e=kids[i];
      if(kd==='l'){ e.setAttribute('x1',r1(a[0])); e.setAttribute('y1',r1(a[1])); e.setAttribute('x2',r1(b[0])); e.setAttribute('y2',r1(b[1])); }
      else { e.setAttribute('cx',r1(a[0])); e.setAttribute('cy',r1(a[1])); } });
  }
  if(live.size) raf=requestAnimationFrame(tick);
}
setInterval(scan, 700);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) scan(); });

/* What a how-to shows: the movement (or, with reduced motion, its first and last positions) and the muscle map. */
function card(id, mus0, name, group){
  const m=MOVES[id]; if(!m) return ''; const mus=musFor(id, mus0, group), st=mus.k==='stretch';
  const n=m.frames.length, figs= still()&&n>1? figureSVG(id, mus, {still:0, cls:'mvhalf'})+figureSVG(id, mus, {still:n-1, cls:'mvhalf'}) : figureSVG(id, mus);
  const p=(mus&&mus.p||[]).length, s=(mus&&mus.s||[]).length;
  const say=(l,k)=>k.length? ` ${l}: ${k.map(x=>MNAME[x]||x).join(', ')}.` : '';
  const label=(name||'Exercise')+(n>1? ': the movement, start to finish.' : ': the position.')+say(st?'Stretched':'Main', mus.p||[])+say(st?'Also stretched':'Helps', mus.s||[]);
  return `<div class="mvcard" role="img" aria-label="${esc(label)}">
    <div class="mvstage">${figs}</div>${p||s? `<div class="mvside">${mapSVG(mus)}<div class="mvkey">${p?`<span><i class="m"></i>${st?'Stretched':'Main'}</span>`:''}${s?`<span><i class="h"></i>${st?'Also stretched':'Helps'}</span>`:''}</div></div>` : ''}</div>`;
}
function thumb(id, mus, group){ const m=MOVES[id]; if(!m) return ''; return figureSVG(id, musFor(id, mus, group), {still:m.frames.length-1, cls:'mvthumb'}); }
window.MiloVis={card, thumb, map:mapSVG, has:id=>!!MOVES[id], muscles:musFor, names:MNAME, MOVES, solve, _still:(id,k,mus)=>figureSVG(id, mus||{p:[],s:[]}, {still:k})};
setTimeout(scan, 300);
/* @@MOVES@@ */
})();
