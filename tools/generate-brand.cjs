// Development tool only. Requires sharp; the app itself has no added dependency.
// NODE_PATH=/path/to/node_modules node tools/generate-brand.cjs
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/brand/milo-symbol.svg'), 'utf8');
const glyph = source.match(/<path\b[^>]*\/>/)[0];
const appSource = fs.readFileSync(path.join(root, 'assets/brand/milo-app-symbol.svg'), 'utf8');
const appGlyph = [...appSource.matchAll(/<path\b[^>]*\/>/g)].map(match => match[0]).join('');
const signal = '#f5a879', action = '#b44720', appField = '#ff6a3d', revision = 'simple-m-v3';
const svg = (body, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${title}">${body}</svg>\n`;
const icon = scale => svg(`<rect width="64" height="64" fill="${appField}"/><g transform="translate(${32*(1-scale)} ${32*(1-scale)}) scale(${scale})">${appGlyph}</g>`, 'Milo app icon');
async function writePNG(file, sourceSVG, size) {
  await sharp(Buffer.from(sourceSVG)).resize(size, size).png().toFile(path.join(root, file));
}
async function run() {
  fs.writeFileSync(path.join(root, 'assets/brand/milo-symbol-light.svg'), source.replace(action, signal));
  fs.writeFileSync(path.join(root, 'assets/brand/milo-app-icon.svg'), icon(1));
  // Give the M more presence at the browser tab's smaller viewing size.
  const favicon = svg(`<rect width="64" height="64" rx="13" fill="${appField}"/><g transform="translate(-3.84 -3.84) scale(1.12)">${appGlyph}</g>`, 'Milo');
  fs.writeFileSync(path.join(root, 'favicon.svg'), favicon);
  for (const [file, size, scale] of [['icon-192.png',192,1],['icon-512.png',512,1],['icon-maskable-512.png',512,.94],['apple-touch-icon.png',180,1]]) {
    await writePNG(file,icon(scale),size);
  }
  await writePNG('favicon-32.png',favicon,32);
  const indexPath=path.join(root,'index.html');
  let html=fs.readFileSync(indexPath,'utf8');
  html=html.replace(/<svg class="milo-mark"[\s\S]*?<\/svg>/, `<svg class="milo-mark" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" focusable="false">${glyph}</svg>`);
  html=html.replace(/href="(\.\/(?:favicon\.svg|favicon-32\.png|apple-touch-icon\.png))(?:\?[^\"]*)?"/g, (_,file)=>`href="${file}?v=${revision}"`);
  fs.writeFileSync(indexPath,html);
  const manifestPath=path.join(root,'manifest.webmanifest');
  const manifest=fs.readFileSync(manifestPath,'utf8').replace(/("src"\s*:\s*")([^\"]+)(")/g,(_,before,file,after)=>before+file.replace(/\?.*$/,'')+'?v='+revision+after);
  fs.writeFileSync(manifestPath,manifest);
  // The worker matches exact URLs, so retain these revised icon URLs offline too.
  const workerPath=path.join(root,'sw.js');
  const worker=fs.readFileSync(workerPath,'utf8').replace(/(\.\/(?:icon-(?:192|512|maskable-512)\.png|apple-touch-icon\.png|favicon\.svg|favicon-32\.png))\?v=[^']+/g,(_,file)=>file+'?v='+revision);
  fs.writeFileSync(workerPath,worker);
  console.log('Generated Milo header mark, vector assets, favicons and four app icons.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
