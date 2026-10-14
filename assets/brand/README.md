# Milo identity assets

The Milo bull is an original vector authored for Milo on 2026-10-13. It replaces the thin header monogram and the former gold bull app icon while retaining the app's evergreen palette and existing wordmark.

## Source and provenance

`milo-symbol.svg` is the canonical editable source: one filled, symmetrical bull path with two eye cutouts on a `0 0 64 64` canvas. All other logo assets are derived from that path by `tools/generate-brand.cjs`.

The vector was authored directly for this project. The PNGs are rasterized from SVG with `sharp`; they are not image-generation output. Every generated PNG embeds this origin in a standard PNG `tEXt` entry with the key `impeccable:prompt`. That metadata records the vector source, authoring date, generator, and rasterization method.

| Asset | Use |
| --- | --- |
| `milo-symbol.svg` | Canonical Evergreen symbol on a transparent background. |
| `milo-symbol-light.svg` | Derived Pale Leaf symbol on a transparent background. |
| `milo-app-icon.svg` | Vector reference for the ordinary app icon: Pale Leaf bull at scale 0.82 on full-bleed Evergreen. |
| `../../index.html` | Derived inline header mark using `currentColor`. |
| `../../icon-192.png` | Ordinary 192 × 192 install and shortcut icon. |
| `../../icon-512.png` | Ordinary 512 × 512 install icon. |
| `../../icon-maskable-512.png` | 512 × 512 maskable icon; symbol scale 0.70. |
| `../../apple-touch-icon.png` | 180 × 180 Apple touch icon; symbol scale 0.82. |
| `../../favicon.svg` | Compact silhouette without eye cutouts, on a rounded Evergreen square. |
| `../../favicon-32.png` | 32 × 32 raster fallback for the compact favicon. |

## Use and spacing

Use the existing Evergreen (`#234c3b`) and Pale Leaf (`#d4e6b5`) colors. The header uses Evergreen in light mode and Pale Leaf in dark mode, including the system theme. Preserve `currentColor` in the inline header so the theme can control it.

The desktop header pairs a 36px symbol with lowercase `milo` in Archivo, 800 weight, 29px size, 0.9 line height, and −0.04em tracking. Below 1000px, the symbol becomes 34px and the wordmark 26px. The `van Croton` subtitle remains Public Sans, 400 weight, 11px size, 1.5 line height, and 0.04em tracking, with 3px top separation.

Preserve the complete square canvas and the 11px gap between symbol and wordmark. Keep neighboring content outside that canvas; do not crop it to the visible path. Use the full symbol at 34px or larger. For smaller browser-tab placements, use the compact favicon, which supports 16px rendering; its raster fallback is 32px. Do not shrink the full lockup until its subtitle becomes unreadable.

Install icons have a full-bleed Evergreen background. Their square corners are intentional: the operating system applies its own mask. The ordinary icon's centered symbol uses scale 0.82; the maskable version uses 0.70. Keep that additional clearance around the horns. Only the favicon has a built-in rounded-square background.

Use solid fills. Do not add strokes, shading, gradients, shadows, rotation, stretching, animation, trainer-specific recoloring, or a badge around the header symbol. Keep the inline symbol hidden from assistive technology beside the wordmark and retain the parent link's “Milo home” label. Standalone SVG assets retain their accessible title or label.

## Regenerate

Run these commands from the repository root with Node.js and a development environment containing `sharp`:

```sh
NODE_PATH=/path/to/node_modules node tools/generate-brand.cjs
node tools/update-integrity.cjs
```

Replace `/path/to/node_modules` with the directory containing the installed `sharp` package. It is a development-only dependency; the app has no added runtime dependency. If `sharp` resolves normally in the local environment, `node tools/generate-brand.cjs` is sufficient for the first command.

Edit the canonical SVG first, then regenerate all derivatives together. The generator reads its single self-closing `<path>` and derives the compact variant by removing the two eye cutouts; changes to the SVG structure or path layout may also require updating the generator. The second command refreshes the app's integrity and cache metadata. Do not independently edit generated SVGs, PNGs, or the inline header path.

After regeneration, check the header in light, dark, and system themes at desktop and phone widths; inspect the compact favicon at tab size and the app icon with circular and rounded-square masks. At the reviewed 512px output, the maskable mark's maximum radius was 197.3px, inside the 204.8px circular safe area. Browser previews and automated checks do not replace a physical phone installation check; that installation was not available during this review.
