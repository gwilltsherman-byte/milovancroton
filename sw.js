/* Offline cache belongs only to this app and contains only its static assets. */
const PREFIX = 'milo-app-';
const CACHE = PREFIX + 'v59-495336ce091bbb86937a';
const NAV_WAIT = 3000;
const BASE = new URL('./', self.registration.scope);
const SHELL = ['./', './index.html', './security.js', './app.js', './fonts.css', './shell.css', './trainer.css',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.svg', './favicon-32.png'];
const PATHS = new Set(SHELL.map(path => new URL(path, BASE).pathname));
const VERSIONED = new Set(['app.js', 'security.js', 'fonts.css', 'shell.css', 'trainer.css'].map(path => new URL(path, BASE).pathname));
const ownAsset = url => url.origin === BASE.origin &&
  (PATHS.has(url.pathname) || url.pathname.startsWith(BASE.pathname + 'assets/fonts/'));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL.map(path => new Request(new URL(path, BASE), {cache: 'reload'})));
    // Cache the exact script and stylesheet versions this shell requests, including
    // stylesheets inside trainer templates, before taking over offline.
    const html = await (await cache.match(new URL('index.html', BASE))).text();
    const versions = [];
    for (const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
      let url;
      try { url = new URL(match[1], BASE); } catch (_) { continue; }
      if (url.origin === BASE.origin && PATHS.has(url.pathname) && VERSIONED.has(url.pathname) && url.search) versions.push(url.href);
    }
    await cache.addAll([...new Set(versions)].map(url => new Request(url, {cache: 'reload'})));
    const css = await (await cache.match('./fonts.css')).text();
    const fonts = [...css.matchAll(/url\((assets\/fonts\/[^)]+)\)/g)].map(m => './' + m[1]);
    await cache.addAll([...new Set(fonts)].map(path => new Request(new URL(path, BASE), {cache: 'reload'})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Leave every other app's caches alone, including legacy shared-origin caches.
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || !ownAsset(url)) return;
  if (req.mode === 'navigate') {
    if (url.pathname !== BASE.pathname && url.pathname !== BASE.pathname + 'index.html') return;
    const net = (async () => {
      const res = await fetch(req);
      if (res.ok && res.url && new URL(res.url).origin === BASE.origin &&
          res.headers.get('content-type')?.includes('text/html')) {
        const cache = await caches.open(CACHE);
        await cache.put(new URL('index.html', BASE), res.clone());
      }
      return res;
    })();
    event.waitUntil(net.then(() => undefined).catch(() => {}));
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(new URL('index.html', BASE));
      if (!saved) return net;
      try {
        const res = await Promise.race([net, new Promise((_, reject) => setTimeout(reject, NAV_WAIT))]);
        return res.ok || res.type === 'opaqueredirect' ? res : saved;
      } catch (_) { return saved; }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && res.type !== 'opaque' && new URL(res.url).origin === BASE.origin) await cache.put(req, res.clone());
    return res;
  })());
});
