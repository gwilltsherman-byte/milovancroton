// Drive Milo's browser suites in Chromium and report pass/fail per suite. Usage: node run-suites.cjs <port> [suite.html ...]
const { chromium } = require('playwright');
const port = process.argv[2];
// Every browser suite in tests/ (browser.html plus any *-browser.html), so suites added later run too.
const fs = require('fs');
const pages = process.argv.slice(3).length ? process.argv.slice(3)
  : fs.readdirSync('tests').filter(f => f === 'browser.html' || /-browser\.html$/.test(f)).sort();
(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const p of pages) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    const t0 = Date.now();
    await page.goto(`http://127.0.0.1:${port}/tests/${p}`);
    let text = '';
    for (let i = 0; i < 720; i++) {
      text = (await page.locator('#result').textContent().catch(() => '')) || '';
      if (!/Running/.test(text) && (/ALL TESTS PASSED|FAIL /.test(text) || /\d+ passed/.test(text))) break;
      await page.waitForTimeout(500);
    }
    const lines = text.split('\n');
    const pass = lines.filter(l => /^PASS|^ok|✓/.test(l)).length;
    const fail = lines.filter(l => /FAIL|^not ok|✗/.test(l));
    const done = /ALL TESTS PASSED|FAIL |\d+ passed/.test(text);
    if (fail.length || !done) bad++;
    console.log(`--- ${p}: ${done ? '' : 'DID NOT FINISH, '}pass=${pass} fail=${fail.length} (${Date.now() - t0} ms)`);
    console.log(lines.slice(-3).join('\n'));
    if (fail.length) console.log('FAILURES:\n' + fail.join('\n'));
    // The CSP test causes one blocked inline script and one 404 on purpose.
    const real = errors.filter(e => !/Content Security Policy|404|Failed to load resource|navigator.vibrate/.test(e));
    if (real.length) console.log('PAGE ERRORS:\n' + real.slice(0, 10).join('\n'));
    await ctx.close();
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
