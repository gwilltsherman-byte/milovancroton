(async function () {
  const results = [], result = document.getElementById('result'), key = 'proladder.v1';
  const original = localStorage.getItem(key);
  const frame = document.createElement('iframe');
  frame.title = 'Ladder test session'; frame.style.cssText = 'width:390px;height:720px;border:1px solid #777';
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  function check(ok, message) { if (!ok) throw new Error(message); results.push('PASS ' + message); }
  async function loadFrame() {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('App loading timed out')), 10000);
      frame.onload = () => { clearTimeout(timeout); resolve(); };
      frame.src = '../index.html?m=cal&ladder-regression=' + Date.now();
      if (!frame.parentNode) document.body.appendChild(frame);
    });
    for (let i = 0; i < 100; i++) {
      const root = frame.contentDocument.getElementById('m-cal')?.shadowRoot;
      if (root?.querySelector('[data-field="setup"]')) return root;
      await pause(50);
    }
    throw new Error('Ladder session did not render');
  }
  try {
    localStorage.setItem(key, JSON.stringify({v:2, onboarded:true, route:'train',
      settings:{sound:false, vibrate:false, rest:0}, rung:{pull:3}, placed:{pull:true}, history:[], tests:[], goals:[],
      active:{id:'browser-ladder-test',name:'Browser regression session',startedAt:Date.now(),
        entries:[{ladderId:'pull',stepIdx:3,kind:'reps',target:8,role:'goal',setup:{},clean:false,
          sets:[{v:null,done:false},{v:null,done:false},{v:null,done:false}]}]}}));
    let root = await loadFrame();
    const doc = frame.contentDocument, win = frame.contentWindow;
    const input = (selector, value) => {
      const el = root.querySelector(selector); check(!!el, 'control exists: ' + selector);
      if (el.type === 'checkbox') el.checked = value; else el.value = value;
      el.dispatchEvent(new win.Event('input', {bubbles:true}));
    };
    const log = set => root.querySelector(`[data-act="toggle-done"][data-ex="0"][data-set="${set}"]`).click();
    log(0);
    check(!root.querySelector('.setrow.done'), 'blank performance does not silently become target reps');
    input('[data-field="v"][data-ex="0"][data-set="0"]', '8'); log(0);
    check(!root.querySelector('.setrow.done'), 'missing assistance blocks set logging');
    const fields = [...root.querySelectorAll('[data-field="setup"][data-ex="0"]')];
    check(fields.length > 0, 'band-assisted exercise exposes measured setup controls');
    const expected = {};
    fields.forEach(el => {
      const value = el.type === 'number' ? String(Math.max(1, Number(el.min || 0))) : 'Light red band, knee support';
      expected[el.dataset.key] = el.type === 'number' ? Number(value) : value;
      input(`[data-field="setup"][data-ex="0"][data-key="${el.dataset.key}"]`, value);
    });
    input('[data-field="clean"][data-ex="0"]', true); log(0);
    check(root.querySelectorAll('.setrow.done').length === 1, 'explicit clean performance logs a set');
    for (const [name, value] of Object.entries(expected)) {
      input(`[data-field="setup"][data-ex="0"][data-key="${name}"]`, typeof value === 'number' ? String(value + 1) : 'Heavy black band, knee support');
    }
    input('[data-field="clean"][data-ex="0"]', false);
    input('[data-field="v"][data-ex="0"][data-set="1"]', '8'); log(1);
    await pause(250);
    let saved = JSON.parse(localStorage.getItem(key));
    const sets = saved.active.entries[0].sets;
    check(sets[0].clean === true && sets[1].clean === false, 'clean and practice sets keep separate form confirmations');
    check(JSON.stringify(sets[0].setup) === JSON.stringify(expected), 'changing setup preserves the earlier set assistance');
    check(JSON.stringify(sets[0].setup) !== JSON.stringify(sets[1].setup), 'each set preserves its own measured setup');
    check(MiloSecurity.section(saved,key), 'new setup and target records remain valid backup data');
    root = await loadFrame();
    saved = JSON.parse(localStorage.getItem(key));
    check(saved.active.entries[0].target === 8 && saved.active.entries[0].sets[0].clean === true, 'target and confirmation survive reload');
    check(root.querySelectorAll('.setrow.done').length === 2 && root.textContent.includes('Light red band'), 'reloaded session renders the original completed setup');
    const controls = [...root.querySelectorAll('input,button')];
    check(controls.every(el => !el.matches('button') || el.getAttribute('aria-label') || el.textContent.trim()), 'session controls have accessible names');
    check(doc.documentElement.scrollWidth <= 420 || root.querySelector('#view').scrollWidth <= 420, 'session fits the narrow viewport');
    result.textContent = results.join('\n') + '\nALL TESTS PASSED';
  } catch (error) {
    result.textContent = results.join('\n') + '\nFAIL ' + error.stack;
  } finally {
    frame.remove();
    if (original == null) localStorage.removeItem(key); else localStorage.setItem(key, original);
  }
})();
