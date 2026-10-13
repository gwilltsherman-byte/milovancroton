const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.join(__dirname, '..');
const sources = ['security.js', 'app.js'];
const hash = file => 'sha256-' + crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('base64');
const policy = "default-src 'self'; script-src " + sources.map(s => "'" + hash(s) + "'").join(' ') +
  "; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'";
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\n?/i, '');
html = html.replace(/<meta name="referrer"[^>]*>\n?/gi, '');
html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="' + policy + '">\n<meta name="referrer" content="no-referrer">');
for (const s of sources) html = html.replace(new RegExp('<script defer src="' + s.replace('.', '\\.') + '"[^>]*></script>'), '<script defer src="' + s + '" integrity="' + hash(s) + '" crossorigin="anonymous"></script>');
// Hosts that support _headers additionally prevent framing and MIME sniffing. Pages uses the meta CSP.
const headers = '/*\n  Content-Security-Policy: ' + policy + "; frame-ancestors 'none'\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n";
// A script hash change must also replace the offline cache; otherwise a cached old
// script would fail the new page's integrity check indefinitely.
const swPath = path.join(root, 'sw.js');
const originalSW = fs.readFileSync(swPath, 'utf8');
const normalizedSW = originalSW.replace(/const CACHE = PREFIX \+ '[^']+';/, "const CACHE = PREFIX + 'generated';");
const fingerprint = crypto.createHash('sha256').update(html).update(normalizedSW);
for (const file of [...sources, 'fonts.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
  ...fs.readdirSync(path.join(root, 'assets/fonts')).filter(f => /\.(ttf|woff2?)$/.test(f)).sort().map(f => 'assets/fonts/' + f)]) {
  fingerprint.update(file).update(fs.readFileSync(path.join(root, file)));
}
const sw = normalizedSW.replace("const CACHE = PREFIX + 'generated';", "const CACHE = PREFIX + 'v59-" + fingerprint.digest('hex').slice(0,20) + "';");
if (process.argv.includes('--check')) {
  if (html !== fs.readFileSync(path.join(root, 'index.html'), 'utf8') || headers !== fs.readFileSync(path.join(root, '_headers'), 'utf8') || sw !== originalSW) {
    console.error('Script integrity is stale. Run node tools/update-integrity.cjs.'); process.exit(1);
  }
} else { fs.writeFileSync(path.join(root, 'index.html'), html); fs.writeFileSync(path.join(root, '_headers'), headers); fs.writeFileSync(swPath, sw); }
