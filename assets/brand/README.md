# Milo icons

The launcher uses a single ink M on orange. `milo-app-symbol.svg` is its editable path; `milo-app-icon.svg` is the full icon. The header keeps its existing symbol.

Run `node tools/generate-brand.cjs` with Sharp available, then `node tools/update-integrity.cjs`. Exports contain no extra text metadata.

Keep the 192px, 512px, maskable 512px and 180px Apple touch exports at their existing dimensions.
