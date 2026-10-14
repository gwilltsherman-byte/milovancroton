---
name: Milo van Croton
description: A precise training floor in chalk, carbon, and orange for planning, logging, and understanding real work.
colors:
  bg: "#f1f2f0"
  surface: "#ffffff"
  surface-2: "#f6f6f3"
  well: "#e9eceb"
  ink: "#21272a"
  ink-2: "#465159"
  muted: "#5e686f"
  border: "#d9dddc"
  border-2: "#838e91"
  accent: "#b44720"
  accent-soft: "#f9e8df"
  on-accent: "#ffffff"
  selected: "#f1cfbb"
  hero: "#e5e9e8"
  steel: "#4e6573"
  steel-soft: "#e5ebee"
  good: "#25704a"
  on-good: "#ffffff"
  good-soft: "#e4f0e8"
  warn: "#85540f"
  warn-soft: "#f8edd6"
  crit: "#b43636"
  crit-soft: "#fbe6e4"
  shell-ink: "#21272a"
  shell-muted: "#5e686f"
  shell-border: "#d9dddc"
  shell-well: "#e9eceb"
  rail: "#20292f"
  brand-signal: "#f5a879"
  dark-bg: "#171b1f"
  dark-surface: "#20262b"
  dark-surface-2: "#283037"
  dark-well: "#14191e"
  dark-ink: "#f4f3ef"
  dark-ink-2: "#d0d5d7"
  dark-muted: "#abb5bb"
  dark-border: "#3a454c"
  dark-border-2: "#71818a"
  dark-accent: "#f4a070"
  dark-accent-soft: "#483126"
  dark-on-accent: "#2e1d14"
  dark-selected: "#5b3d2c"
  dark-hero: "#293339"
  dark-steel: "#a5becd"
  dark-steel-soft: "#293c47"
  dark-good: "#92d0ab"
  dark-on-good: "#152b20"
  dark-good-soft: "#243c30"
  dark-warn: "#e7c17e"
  dark-warn-soft: "#3d3222"
  dark-crit: "#ffaaa1"
  dark-crit-soft: "#4b2b29"
  raised: "#ffffff"
  faint: "#5e686f"
  good-ink: "#245d3c"
  on-steel: "#ffffff"
  on-warn: "#ffffff"
  on-crit: "#ffffff"
  rail-ink: "#f4f3ef"
  rail-label: "#e1e6e8"
  rail-muted: "#b5c0c6"
  rail-selection-ink: "#2e1d14"
  rail-selection-muted: "#573420"
  rail-hover: "#34434d"
  rail-foot: "#bcc7ce"
  dark-raised: "#303940"
  dark-faint: "#9ca8af"
  dark-good-ink: "#a7ddb9"
  dark-on-steel: "#14232b"
  dark-on-warn: "#30220d"
  dark-on-crit: "#451a17"
typography:
  display:
    fontFamily: 'Archivo, "Public Sans", sans-serif'
    fontSize: "28px"
    fontWeight: 750
    lineHeight: 1.13
    letterSpacing: "-0.035em"
  display-desktop:
    fontFamily: 'Archivo, "Public Sans", sans-serif'
    fontSize: "32px"
    fontWeight: 750
    lineHeight: 1.13
    letterSpacing: "-0.035em"
  headline:
    fontFamily: 'Archivo, "Public Sans", sans-serif'
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: 'Archivo, "Public Sans", sans-serif'
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Public Sans", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: '"Public Sans", system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 650
  button:
    fontFamily: '"Public Sans", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.3
  metric:
    fontFamily: '"Public Sans", system-ui, sans-serif'
    fontSize: "27px"
    fontWeight: 650
    letterSpacing: "-0.03em"
  input:
    fontFamily: '"Public Sans", system-ui, sans-serif'
    fontSize: "16px"
  wordmark:
    fontFamily: 'Archivo, "Public Sans", sans-serif'
    fontSize: "29px"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  wordmark-mobile:
    fontFamily: 'Archivo, "Public Sans", sans-serif'
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  wordmark-subtitle:
    fontFamily: '"Public Sans", sans-serif'
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.04em"
rounded:
  chip: "6px"
  set-control: "7px"
  sm: "8px"
  button: "9px"
  md: "12px"
  lg: "14px"
  xl: "16px"
spacing:
  brand-gap: "11px"
  control-gap: "8px"
  grid-gap: "12px"
  stack-gap: "20px"
  card: "20px"
  card-desktop: "24px"
  hero: "24px"
  hero-desktop: "28px"
  gutter-mobile: "20px"
  gutter-tablet: "32px"
  gutter-desktop: "40px"
components:
  brand-symbol:
    textColor: "{colors.accent}"
    width: "36px"
    height: "36px"
  brand-symbol-mobile:
    textColor: "{colors.accent}"
    width: "34px"
    height: "34px"
  brand-symbol-dark:
    textColor: "{colors.brand-signal}"
    width: "36px"
    height: "36px"
  brand-symbol-mobile-dark:
    textColor: "{colors.brand-signal}"
    width: "34px"
    height: "34px"
  brand-app-icon:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.brand-signal}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "12px 16px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "12px 16px"
  button-danger:
    backgroundColor: "{colors.crit-soft}"
    textColor: "{colors.crit}"
    typography: "{typography.button}"
    rounded: "{rounded.button}"
    padding: "12px 16px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.input}"
    rounded: "{rounded.sm}"
    padding: "12px"
  trainer-navigation-selected:
    backgroundColor: "{colors.brand-signal}"
    textColor: "{colors.dark-on-accent}"
    rounded: "{rounded.sm}"
    padding: "11px 14px"
  route-navigation-selected:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent}"
    rounded: "{rounded.button}"
    padding: "7px 2px"
  chip:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.chip}"
    padding: "4px 7px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.card}"
  next-session:
    backgroundColor: "{colors.hero}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.hero}"
  training-week:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "22px"
  set-input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.input}"
    rounded: "{rounded.set-control}"
    height: "44px"
---

# Design System: Milo van Croton

## Overview

**Creative North Star: "The Training Floor"**

Milo's identity comes from the working setting: chalk-white space for reading a session, carbon structure for moving between trainers, steel for measured progress, and burnt orange for the next deliberate action. The bull remains the central mark. Archivo headings and Public Sans controls retain the precision needed between sets.

This is the color correction requested on 2026-10-14 after Milo and Sideband were given overly similar green identities. Milo now has its own athletic, practical character. Orange is concentrated in actions and selected controls; broad surfaces stay neutral. Actual completed work and readiness use green, so doing the next set and finishing one have distinct meanings.

Muscle, Strength, Ladder, and Together share this system. Light mode supports bright training spaces; dark mode uses layered carbon surfaces and a lighter orange for evening use. Neither theme relies on hue alone: keep completion checks, selected states, text labels, and explicit status wording.

The normative tokens above are extracted from `shell.css`, `trainer.css`, and `tools/generate-brand.cjs`. `trainer.css` is loaded inside every trainer's shadow root; `fonts.css` supplies local typefaces. `.impeccable/design.json` retains matching previews, metadata, and tonal ramps. Preview ramps are not additional application colors.

## Colors

### Action and identity

- **Burnt Orange** (`accent`, `#b44720`): primary actions, current route, links, next set, and keyboard focus. White text on the primary button has 5.44:1 contrast.
- **Signal Orange** (`brand-signal`, `#f5a879`): selected trainer and the bull against carbon. This brighter version is appropriate against the dark frame; it is not used for small text on white.
- **Orange Wash** (`accent-soft`) and **Selection** (`selected`): low-emphasis interactive selection. They do not color entire working screens.
- **Evening Orange** (`dark-accent`, `#f4a070`): dark-theme actions and focus, paired with dark `on-accent` text rather than white.

The bull uses Burnt Orange in the light header and Signal Orange in the dark header. Installed icons and favicons use the Signal Orange bull on Carbon (`rail`). Preserve the silhouette and derive every export from the canonical SVG.

### Structure and measurement

- **Chalk** (`bg`): the overall ground. **Porcelain** (`surface`) is the main working surface; `surface-2` and `well` organize fields and grouped controls.
- **Carbon** (`rail`): the trainer rail in both themes. Rail text uses a corresponding cool light neutral, with a warmer dark ink on the selected orange tile.
- **Steel Ground** (`hero`): the neutral next-session panel. It supports the action without borrowing the action's color.
- **Steel** (`steel`): volume and standard bars and measurement labels. Use it for information, rather than making every chart orange.
- **Carbon Ink** (`ink`), **Supporting Ink** (`ink-2`), and **Secondary Ink** (`muted`): content hierarchy. The secondary label role remains readable on both the canvas and the next-session surface.
- **Soft Edge** (`border`) separates passive surfaces. **Control Edge** (`border-2`) defines input and actionable boundaries and meets 3:1 against fields in both themes.

Dark mode is explicitly composed: carbon canvas, progressively lighter raised surfaces, cool light text, and a warm action accent. Keep opaque surfaces; do not simulate dark mode by dimming the light palette.

### Status

`good` is reserved for completed sets, completed days, cleared rungs, and actual positive readiness. `on-good` supplies a readable completion glyph or label. Filled steel, warning, and critical states use their corresponding `on-steel`, `on-warn`, and `on-crit` ink tokens; never hardcode white text over a pale dark-theme status. `warn` and `crit` retain warning and destructive meanings, with corresponding soft fills and dark-theme values. Do not recolor statuses by trainer or use them as decoration.

**The Meaningful Accent Rule.** Orange directs the next action, steel presents measurement, and green confirms completed work. The full canvas stays neutral. Preserve those meanings across every trainer and theme.

## Typography

**Display Font:** Archivo with Public Sans and sans-serif fallbacks. **Body Font:** Public Sans with system-ui and sans-serif fallbacks. Both are served locally with font swapping; network font services are unnecessary.

Archivo gives titles a compact, assured character. Public Sans keeps instructions, labels, and editable numbers clear at working sizes. Use sentence case for headings and controls; only compact group/table labels retain the small tracked treatment established in the implementation.

- **Display:** the next-session headline, using `display` on phones and `display-desktop` from the desktop breakpoint. At the smallest phone breakpoint it reduces to 26px. Keep its line length near 24 characters.
- **Headline / title:** session headings and panel headings. Session headings increase from 25px to 28px on desktop; ordinary panel headings remain compact.
- **Body:** ordinary instructions. Explanatory paragraphs use more open line spacing (1.6–1.65); hero copy is limited to 58ch, with card and guidance paragraphs limited to 75ch.
- **Label:** form labels and compact control text. Supporting metadata may use 11–12px; avoid using it for the user's primary task.
- **Metric:** prominent values. Desktop values increase to 30px. Use tabular numerals for quantities, set fields, dates, timers, and progress values.
- **Input:** editable values stay at 16px in general fields and set logging.
- **Wordmark:** keep `milo` lowercase in the existing Archivo treatment. Use `wordmark` on desktop and `wordmark-mobile` below 1000px; `van Croton` sits beneath it in Public Sans using `wordmark-subtitle`, with 3px top separation.

**The Stable Number Rule.** Let values change without changing their alignment. Preserve tabular numerals and clear units instead of introducing a decorative monospaced face.

## Layout

The shared shell uses a 64px top bar and, from 1000px wide, a fixed 216px trainer rail. The training workspace is centered within the remaining area with a maximum width of 1120px. Desktop workspace gutters are 40px; content groups usually have 20px between them and 12px between adjacent controls or small cards.

Below 1000px, trainer selection becomes a compact horizontal strip and route navigation moves to a fixed bottom bar with safe-area padding. Leave content clearance for the bottom navigation, active timer, and Together strip. At 720–999px the workspace caps at 760px with 32px gutters. Ordinary phone gutters are 20px, with tighter adaptations below 390px.

The shared header reserves `env(safe-area-inset-top)` above its controls in installed iPhone apps. Its measured full height positions the trainer navigation beneath it, including after scrolling and orientation changes. Narrow-screen padding must preserve that top inset.

At 1100px and above, the Today surface can place the next session beside supporting metrics and guidance, using a 1.45:1 relationship. The seven-day sequence spans the available content width. Narrower layouts return to one readable column. These compositions are surface patterns, not a requirement for every screen; settings, libraries, and set tables follow their own existing structures.

Preserve wrapping for exercise names, button text, and explanatory copy. Set-entry grids adapt separately on small phones; never remove a logging action merely to fit a row. See the sidecar for the implemented breakpoints, including the smaller control-specific adaptations.

## Elevation & Depth

Trainer surfaces are flat. Background changes, borders, and spacing separate the workspace, cards, fields, and selected states. Cards, metrics, primary buttons, rest timers, and trainer sheets use no box shadow; gradients and backdrop blur are removed from the shared visual treatment.

The shell's floating Together strip uses `0 8px 30px #10161b26`; backup/help dialogs use `0 20px 60px #10161b40`. The shell toast retains its existing transient shadow. Dialog scrims dim the surrounding interface; trainer sheets stay opaque and readable.

**The Flat Workspace Rule.** Reserve elevation for transient shell overlays. Do not add shadows to ordinary training cards or accent buttons.

## Shapes

Use gently rounded rectangles: small controls generally use `sm`, primary buttons use `button`, ordinary cards use `lg`, and heroes/dialogs use `xl`. Small chips have the tighter `chip` radius; set fields and completion buttons use `set-control`. Keep the seven-day sequence as individual rectangular tiles rather than pills.

One-pixel borders establish ordinary boundaries. Active desktop route tabs use a two-pixel underline. Mobile sheets have rounded upper corners and a short grab handle; centered dialogs round all four corners. Use simple inline stroke icons, sized to their role, without decorative badges around every heading.

## Components

### Milo Identity

The bold, symmetrical bull is Milo's shared identity. Its broad horns and compact face connect the header, browser tab, and installed app within the carbon-and-orange system. The existing bull geometry remains unchanged.

`assets/brand/milo-symbol.svg` is the canonical editable vector: one filled path with two eye cutouts on a 64-unit square canvas. Preserve the silhouette, aspect ratio, and canvas. The inline header copy uses `currentColor`, Burnt Orange in light mode and Signal Orange in explicit or system dark mode. Keep it decorative beside the wordmark (`aria-hidden="true"`, `focusable="false"`); the link's accessible name is “Milo home.” Standalone SVGs retain their accessible title or label.

- **Lockup:** use the `brand-symbol` and `brand-gap` tokens beside the wordmark. Below 1000px, use `brand-symbol-mobile` and `wordmark-mobile`. Preserve the 11px gap between the symbol canvas and the wordmark, and keep surrounding content outside the original canvas; never crop to the path's bounding box.
- **Minimum sizes:** use the full symbol with eye cutouts at 34px or larger. Smaller browser-tab placements use the dedicated compact favicon silhouette, which removes the eye cutouts. The SVG favicon supports a 16px tab placement; its PNG fallback is 32px. Keep the subtitle at its established size rather than shrinking the entire lockup.
- **App icons:** retain a full-bleed Carbon background. The ordinary and Apple icons center the full symbol at scale 0.82; the maskable icon uses 0.70 to keep the mark within the circular safe area. Do not bake a rounded device mask into these files. The favicon alone includes a rounded square background.
- **Treatment:** use solid fills without strokes, shading, gradients, shadows, animation, or extra enclosure around the header mark. Do not stretch, rotate, or recolor the bull by trainer.
- **Source and exports:** the original SVG was authored for Milo on 2026-10-13. PNGs are direct `sharp` rasterizations of the vector, not image-generation output, and embed this origin in an `impeccable:prompt` PNG text entry. `tools/generate-brand.cjs` derives the inline header, light symbol, app-icon SVG, favicons, and install icons from the canonical source. See `assets/brand/README.md` for regeneration and provenance.

### Buttons

Primary buttons use accent fill and on-accent text; ghost buttons use Porcelain with a Control Edge border. Destructive buttons use the critical soft fill and critical text. Standard buttons have a minimum height of 46px; hero actions are at least 48px, and compact buttons are 40px. Keep text able to wrap.

On hover-capable devices, primary fill mixes accent with ink at 89% accent. Ordinary hover uses Quiet Porcelain and a stronger border. Pressed primary/ghost controls move down one pixel. Disabled controls use half opacity and a disabled cursor. Keyboard focus uses an explicit three-pixel outline with three-pixel offset in trainers.

### Inputs / Fields

General fields use Quiet Porcelain, Control Edge, small corners, 16px editable text, and at least 44px height. Put sentence-case labels above the field. Focus uses a two-pixel accent outline with offset, without a glow. Search fields transfer this focus boundary to their wrapper. Keep the existing validation copy and status semantics visible.

### Navigation

Trainer navigation is persistent Carbon with a Signal Orange selected item. Desktop entries include an icon, name, and short explanation; mobile entries retain icons and names in a horizontal strip. Route navigation is a separate level: a text-and-icon row with an underline on desktop, and five equal bottom-bar cells with soft selected fills on phones. Use the existing selected and accessibility state attributes together.

### Chips / Choices

Informational chips are small rounded rectangles with a subtle border, quiet fill, and supporting ink. Actionable filters have larger targets; selected filters use accent fill and on-accent text. Segmented controls sit within a recessed track and select a Porcelain segment. Readiness choices and warning states keep their existing semantic distinctions.

### Cards / Next Session

Ordinary cards use Porcelain, Soft Edge, large corners, and 20px padding, increasing to 24px on desktop. The next-session card uses Steel Ground without a border, extra-large corners, a clear headline, supporting copy, and the primary task. Let content determine height except where the desktop surface deliberately aligns adjacent panels.

### Training Week

The seven-day strip uses equal columns with compact day labels, tabular dates, and completion marks. Completed days use good fill; today uses an inset outline. Both states may coexist. Empty days stay neutral. Populate completion only from real stored sessions; the preview sidecar contains explicitly labeled sample data.

### Set Logging / Timers

Preserve the compact grid of set number, editable values, completion, and row actions. Set fields and completion controls are 44px high. The next row has a soft accent background; completed marks receive good fill. Numbers use tabular alignment and accessible field labels. Keep the rest timer above mobile route navigation and within the content region on desktop.

Short state transitions use the existing 150ms timing; next-row background uses 250ms. All animation, transitions, and smooth scrolling are disabled under reduced motion. Do not animate route entry or introduce continuous decorative movement.

## Do's and Don'ts

### Do:

- **Do** share the shell, semantic colors, type pairing, and control patterns across all four trainers.
- **Do** make the next training action visually clear while keeping evidence and explanation readable.
- **Do** preserve light, dark, and system themes, visible keyboard focus, and reduced-motion behavior.
- **Do** use tabular numerals, explicit units, and wrapping exercise names in compact working layouts.
- **Do** show real training history and honest empty states.
- **Do** keep phone logging controls reachable and clear of fixed navigation and timers.
- **Do** regenerate every logo derivative from the canonical bull SVG and preserve its spacing, theme behavior, and maskable safe area.

### Don't:

- **Don't** restore separate trainer palettes, decorative gradients, backdrop blur, or glowing cards.
- **Don't** use color alone to communicate completion, warnings, selection, or destructive intent.
- **Don't** shrink editable values or hide necessary set actions to force a narrow row.
- **Don't** add decorative motion or animate route entry.
- **Don't** manufacture achievements or completed days to fill an empty screen.
- **Don't** introduce remote font dependencies or framework-only component previews.
- **Don't** distort the bull, add effects, restore the old monogram or gold app icon, or give individual trainers separate logo colors.
