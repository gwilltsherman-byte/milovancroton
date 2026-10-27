const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const start = app.indexOf('window.MiloSession=');
const source = app.slice(start, app.indexOf('const MOD_INIT =', start));
function alerts({permission = 'default', hidden = false, ios = false} = {}) {
  const prefs = new Map(), sent = [], live = {textContent: ''};
  let requests = 0;
  const notification = {permission, requestPermission: async () => { requests++; return permission; }};
  const document = {hidden};
  const context = {
    window: {Notification: notification}, Notification: notification, document,
    navigator: {userAgent: ios ? 'iPhone Safari' : 'Android Chrome', serviceWorker: {getRegistration: async () => ({showNotification: async (...args) => { sent.push(args); }})}},
    Prefs: {get: (key, fallback) => prefs.has(key) ? prefs.get(key) : fallback, set: values => Object.entries(values).forEach(([k,v]) => prefs.set(k,v))},
    setInterval() {}, setTimeout: fn => fn(),
  };
  vm.runInNewContext(source, context);
  return {api: context.window.MiloSession, document, sent, requests: () => requests, root: {querySelector: () => live}, live};
}

test('rest notification permission is requested only once, and never on iOS', async () => {
  const android = alerts();
  assert.equal(await android.api.requestAlerts(), 'default');
  assert.equal(await android.api.requestAlerts(), 'default');
  assert.equal(android.requests(), 1);
  const iphone = alerts({ios: true});
  assert.equal(iphone.api.alertsAvailable(), false);
  assert.equal(await iphone.api.requestAlerts(), 'unavailable');
  assert.equal(iphone.requests(), 0);
});

test('rest completion announces status and sends a service-worker alert only when hidden and permitted', async () => {
  for (const [permission, hidden, expected] of [['granted',true,1],['granted',false,0],['denied',true,0]]) {
    const a = alerts({permission, hidden});
    a.api.restOver(a.root);
    await Promise.resolve(); await Promise.resolve();
    assert.equal(a.live.textContent, 'Rest over');
    assert.equal(a.sent.length, expected);
    if (expected) assert.equal(a.sent[0][0], 'Rest over');
  }
});
