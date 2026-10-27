/* Apply the saved appearance before the first paint; reveal only the routed, styled app. */
(function () {
  'use strict';
  const root=document.documentElement;
  try {
    const theme=localStorage.getItem('trainer.shell.theme');
    if(theme==='light'||theme==='dark') root.dataset.theme=theme;
  } catch (_) {}
  root.classList.add('app-starting');
  let shown=false;const pendingFocus=[];
  const focus=el=>{if(el&&el.isConnected)el.focus({preventScroll:true});};
  const reveal=()=>{root.classList.remove('app-starting');shown=true;pendingFocus.splice(0).forEach(focus);};
  // A missing main script must still leave the normal shell available for recovery.
  const fallback=setTimeout(reveal,5000);
  window.MiloBoot={focus(el){if(shown)focus(el);else pendingFocus.push(el);},ready(beforeReveal){
    const links=[];
    for(const id of ['m-mix','m-lift','m-str','m-cal']) {
      const shadow=document.getElementById(id)?.shadowRoot;
      if(shadow) links.push(...shadow.querySelectorAll('link[rel="stylesheet"]'));
    }
    const styled=link=>link.sheet?Promise.resolve():new Promise(resolve=>{
      link.addEventListener('load',resolve,{once:true});link.addEventListener('error',resolve,{once:true});
    });
    Promise.all(links.map(styled)).then(()=>requestAnimationFrame(()=>{
      try { if(beforeReveal) beforeReveal(); } finally { clearTimeout(fallback);reveal(); }
    }));
  }};
})();
