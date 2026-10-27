(async function () {
  const results=[], result=document.getElementById('result'), probe=document.getElementById('probe');
  function check(ok,message){ if(!ok) throw new Error(message); results.push('PASS '+message); }
  try {
    const samples=[
      '<img src="missing.png" onerror="window.__miloInjected=1"><script>window.__miloInjected=1</script>',
      '<svg><foreignObject><iframe srcdoc="<script>window.__miloInjected=1</script>"></iframe></foreignObject><a xlink:href="javascript:window.__miloInjected=1">x</a></svg>',
      '<template><img onerror="window.__miloInjected=1" src=x></template><object data="javascript:alert(1)"></object>',
      '<a href="java\nscript:window.__miloInjected=1" target="_blank">bad link</a>'
    ];
    for (const payload of samples) {
      probe.innerHTML=MiloSecurity.html(payload);
      check(!probe.querySelector('script,iframe,object,template,foreignObject'), 'executable elements removed');
      check([...probe.querySelectorAll('*')].every(e=>[...e.attributes].every(a=>!/^on/i.test(a.name)&&!/^javascript:/i.test(a.value.replace(/\s/g,'')))), 'event handlers and executable URLs removed');
    }
    check(!window.__miloInjected,'injected code did not execute');
    probe.innerHTML=MiloSecurity.html('<button data-id="squat" style="color:red"><svg viewBox="0 0 24 24"><path d="M0 0h1"></path></svg>O&#39;Brien</button>');
    check(probe.querySelector('button').dataset.id==='squat' && !!probe.querySelector('svg path'),'normal controls and icons preserved');
    const frame=document.getElementById('app');
    for(let i=0;i<100 && typeof frame.contentWindow.__go!=='function';i++) await new Promise(resolve=>setTimeout(resolve,50));
    const doc=frame.contentDocument, win=frame.contentWindow;
    for(const section of ['lift','str','cal','mix']) {
      win.__go(section);
      check(!doc.getElementById('m-'+section).shadowRoot.textContent.includes('This section failed to load'),'trainer '+section+' loads');
    }
    const original=doc.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
    check(original.includes("script-src-attr 'none'") && !original.includes("script-src 'self'"),'app permits only scripts with reviewed hashes');
    const script=doc.createElement('script'); script.textContent='window.__miloCspInjected=1'; doc.body.appendChild(script);
    check(!win.__miloCspInjected,'CSP blocks injected inline scripts');
    check(![...doc.querySelectorAll('link[rel="stylesheet"],link[rel="preconnect"]')].some(e=>/^https?:/.test(e.getAttribute('href')||'')),'fonts load without third-party requests');
    result.textContent=results.join('\n')+'\nALL TESTS PASSED';
  } catch(e){ result.textContent=results.join('\n')+'\nFAIL '+e.stack; }
})();
