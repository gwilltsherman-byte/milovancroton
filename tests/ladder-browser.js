(async function () {
  const results = [], result = document.getElementById('result'), key = 'proladder.v1';
  const original = localStorage.getItem(key);
  const frame = document.createElement('iframe');
  frame.title = 'Ladder test session'; frame.style.cssText = 'width:390px;height:720px;border:1px solid #777';
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  function check(ok, message) { if (!ok) throw new Error(message); results.push('PASS ' + message); }
  async function loadFrame(ready = '[data-act="toggle-done"]') {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('App loading timed out')), 10000);
      frame.onload = () => { clearTimeout(timeout); resolve(); };
      frame.src = '../index.html?m=cal&ladder-regression=' + Date.now();
      if (!frame.parentNode) document.body.appendChild(frame);
    });
    for (let i = 0; i < 100; i++) {
      const root = frame.contentDocument.getElementById('m-cal')?.shadowRoot;
      if (root?.querySelector(ready)) return root;
      await pause(50);
    }
    throw new Error('Ladder did not render ' + ready);
  }
  try {
    localStorage.setItem(key, JSON.stringify({v:2, onboarded:true, route:'train',
      settings:{sound:false, vibrate:false, rest:0}, rung:{pull:3}, placed:{pull:true}, history:[], tests:[], goals:[],
      active:{id:'browser-ladder-test',name:'Browser regression session',startedAt:Date.now(),
        entries:[{ladderId:'pull',stepIdx:3,kind:'reps',target:8,role:'goal',setup:{},clean:true,
          sets:[{v:null,done:false},{v:null,done:false},{v:null,done:false}]}]}}));
    let root = await loadFrame();
    const doc = frame.contentDocument, win = frame.contentWindow;
    const input = (selector, value) => {
      const el = root.querySelector(selector); check(!!el, 'control exists: ' + selector);
      if (el.type === 'checkbox') el.checked = value; else el.value = value;
      el.dispatchEvent(new win.Event('input', {bubbles:true}));
    };
    const log = set => root.querySelector(`[data-act="toggle-done"][data-ex="0"][data-set="${set}"]`).click();
    check(!root.querySelector('[data-field="setup"]') && !root.textContent.includes('Setup for upcoming sets'), 'no setup measurements are asked for');
    log(0);
    check(root.querySelectorAll('.setrow.done').length === 1 && root.querySelector('[data-field="v"][data-ex="0"][data-set="0"]').value === '8', 'a blank set logs the target shown in its box');
    input('[data-field="clean"][data-ex="0"]', false);
    input('[data-field="v"][data-ex="0"][data-set="1"]', '6'); log(1);
    await pause(250);
    let saved = JSON.parse(localStorage.getItem(key));
    const sets = saved.active.entries[0].sets;
    check(sets[0].v === 8 && sets[1].v === 6 && sets[1].done === true, 'entered values are kept as logged');
    check(sets[0].clean === true && sets[1].clean === false, 'clean and practice sets keep separate form confirmations');
    check(MiloSecurity.section(saved,key), 'logged sets remain valid backup data');
    root = await loadFrame();
    saved = JSON.parse(localStorage.getItem(key));
    check(saved.active.entries[0].target === 8 && saved.active.entries[0].sets[0].clean === true, 'target and confirmation survive reload');
    check(root.querySelectorAll('.setrow.done').length === 2 && root.textContent.includes('Clean form confirmed') && !root.textContent.includes('Setup was not recorded'), 'reloaded session renders the completed sets without setup notes');
    const controls = [...root.querySelectorAll('input,button')];
    check(controls.every(el => !el.matches('button') || el.getAttribute('aria-label') || el.textContent.trim()), 'session controls have accessible names');
    check(doc.documentElement.scrollWidth <= 420 || root.querySelector('#view').scrollWidth <= 420, 'session fits the narrow viewport');
    localStorage.setItem(key, JSON.stringify({v:2, onboarded:true, route:'goals', settings:{sound:false, vibrate:false, rest:0},
      rung:{pull:2, pushh:3}, placed:{pull:true, pushh:true}, history:[], tests:[], active:null,
      goals:[{id:'goal-a', key:'pullup1', n:'First strict pull-up', l:'pull', r:4, std:1, sup:[], added:1, achieved:null},
        {id:'goal-b', key:'pushup20', n:'20 strict push-ups', l:'pushh', r:3, std:20, sup:[], added:1, achieved:null}]}));
    root = await loadFrame('.goal-full');
    const heads = () => [...root.querySelectorAll('.goal-head')], bodies = () => [...root.querySelectorAll('.goal-body')];
    check(heads().length === 2 && heads().every(h => h.getAttribute('aria-expanded') === 'false') && bodies().every(b => b.hidden), 'several goals start folded to their summaries');
    heads()[1].click();
    check(heads()[1].getAttribute('aria-expanded') === 'true' && !bodies()[1].hidden && bodies()[0].hidden && !!bodies()[1].querySelector('.rung'), 'tapping a goal shows its ladder');
    root.querySelector('#tabbar [data-route="today"]').click(); root.querySelector('#tabbar [data-route="goals"]').click();
    check(heads()[1].getAttribute('aria-expanded') === 'true' && heads()[0].getAttribute('aria-expanded') === 'false', 'an opened goal stays open after switching tabs');
    // a rung's how-to is written instructions only
    bodies()[1].querySelector('.rung[data-act="how"]').click(); await pause(200);
    check(!!root.querySelector('#sheet.on .howto') && !root.querySelector('#sheet.on svg.mvfig'), 'a rung’s how-to shows the written steps, with no drawing');
    result.textContent = results.join('\n') + '\nALL TESTS PASSED';
  } catch (error) {
    result.textContent = results.join('\n') + '\nFAIL ' + error.stack;
  } finally {
    frame.remove();
    if (original == null) localStorage.removeItem(key); else localStorage.setItem(key, original);
  }
})();
