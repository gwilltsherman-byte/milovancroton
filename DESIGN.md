---
name: Milo van Croton
description: An evergreen training field guide for planning, logging, and understanding real work.
colors:
  bg: "#f1f4ef"
  surface: "#ffffff"
  surface-2: "#f5f7f3"
  well: "#edf1e9"
  ink: "#1b2b22"
  ink-2: "#3f5146"
  muted: "#5b6b60"
  border: "#dce3d8"
  border-2: "#b8c7b8"
  accent: "#234c3b"
  accent-soft: "#e1ebd9"
  on-accent: "#ffffff"
  selected: "#d4e6b5"
  hero: "#e6eedf"
  good: "#247149"
  good-soft: "#e1f0e2"
  warn: "#85540f"
  warn-soft: "#f8edd6"
  crit: "#b43636"
  crit-soft: "#fbe6e4"
  shell-ink: "#20392d"
  shell-muted: "#59685e"
  shell-border: "#d6dfd5"
  shell-well: "#e8eee5"
  dark-bg: "#121b17"
  dark-surface: "#1c2921"
  dark-surface-2: "#223128"
  dark-well: "#17231b"
  dark-ink: "#eef4e9"
  dark-ink-2: "#c9d6c5"
  dark-muted: "#b2c0ac"
  dark-border: "#37473b"
  dark-border-2: "#647861"
  dark-accent: "#d4e6b5"
  dark-accent-soft: "#304632"
  dark-on-accent: "#203826"
  dark-selected: "#3c573b"
  dark-hero: "#273b2b"
  dark-good: "#8cce9b"
  dark-good-soft: "#233c2d"
  dark-warn: "#e7c17e"
  dark-warn-soft: "#3d3222"
  dark-crit: "#ffaaa1"
  dark-crit-soft: "#4b2b29"
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
rounded:
  chip: "6px"
  set-control: "7px"
  sm: "8px"
  button: "9px"
  md: "12px"
  lg: "14px"
  xl: "16px"
spacing:
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
    backgroundColor: "{colors.selected}"
    textColor: "{colors.shell-ink}"
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

**Creative North Star: "The Evergreen Training Field Guide"**

Milo feels grounded, readable, and ready for use between sets. Evergreen wayfinding frames a mineral green workspace; white surfaces and pale leaf selections make the current task clear. The visual identity comes from useful structure, confident headings, and consistently treated controls.

Muscle, Strength, Ladder, and Together share one visual language. Training numbers receive space and stable alignment; explanatory copy remains close to the decision it supports. The system carries through light, dark, and system themes without changing the meaning of a control or status.

**Key Characteristics:**

- Evergreen wayfinding with pale leaf selection.
- Archivo headings paired with locally served Public Sans.
- Flat, bordered working surfaces with compact, readable density.
- Consistent navigation and controls across all four trainers.
- Visible focus, responsive layouts, and restrained state changes.

The normative tokens above are extracted from `shell.css` and `trainer.css`. The latter is loaded inside each trainer's shadow root; `fonts.css` supplies local font files. Values in `.impeccable/design.json` extend this document with motion, breakpoint, elevation, and component-preview metadata. Its generated tonal ramps are preview aids, not extra application colors.

## Colors

The palette combines evergreen structure, mineral neutrals, and clear status colors. Use semantic CSS variables so theme changes propagate to every control.

### Primary

- **Evergreen** (`accent`): primary actions, completed work, current progression, and links. The shell keeps evergreen navigation in both themes.
- **Pale Leaf** (`selected`): the selected trainer in the shell and selected choices in light mode. In dark trainer surfaces, `dark-accent` supplies this light foreground/action color while `dark-selected` provides a deeper selection fill.
- **Soft Leaf** (`accent-soft`): selected route tabs, the next set, and low-emphasis guidance.
- **Field Green** (`hero`): the next-session surface. Keep this broad fill calmer than a primary button.

### Neutral

- **Mineral Ground** (`bg`): the page and workspace backdrop.
- **Paper** (`surface`): cards, dialogs, navigation, and ordinary controls.
- **Quiet Paper** (`surface-2`) and **Recess** (`well`): input interiors, day tiles, and grouped choices.
- **Forest Ink** (`ink`), **Supporting Ink** (`ink-2`), and **Muted Ink** (`muted`): primary content, explanation, and secondary labels respectively.
- **Soft Edge** (`border`) and **Control Edge** (`border-2`): surface separation and stronger interactive boundaries.
- Shell-specific ink, muted, border, and well tokens preserve the shared frame's implemented contrast. Dark counterparts in the stylesheet replace the corresponding light roles; do not darken an entire screen with opacity.

### Status

`good` confirms successful work, `warn` calls attention to a condition, and `crit` identifies destructive actions or critical feedback. Each has a soft background and an explicit dark counterpart. Pair status color with words, icons, or the existing completion mark.

**The Meaningful Accent Rule.** Use accent for action, selection, and recorded progress. It must not become ornamental striping or a separate identity for each trainer.

## Typography

**Display Font:** Archivo with Public Sans and sans-serif fallbacks. **Body Font:** Public Sans with system-ui and sans-serif fallbacks. Both are served locally with font swapping; network font services are unnecessary.

Archivo gives titles a compact, assured character. Public Sans keeps instructions, labels, and editable numbers clear at working sizes. Use sentence case for headings and controls; only compact group/table labels retain the small tracked treatment established in the implementation.

- **Display:** the next-session headline, using `display` on phones and `display-desktop` from the desktop breakpoint. At the smallest phone breakpoint it reduces to 26px. Keep its line length near 24 characters.
- **Headline / title:** session headings and panel headings. Session headings increase from 25px to 28px on desktop; ordinary panel headings remain compact.
- **Body:** ordinary instructions. Explanatory paragraphs use more open line spacing (1.6–1.65); hero copy is limited to 58ch, with card and guidance paragraphs limited to 75ch.
- **Label:** form labels and compact control text. Supporting metadata may use 11–12px; avoid using it for the user's primary task.
- **Metric:** prominent values. Desktop values increase to 30px. Use tabular numerals for quantities, set fields, dates, timers, and progress values.
- **Input:** editable values stay at 16px in general fields and set logging.

**The Stable Number Rule.** Let values change without changing their alignment. Preserve tabular numerals and clear units instead of introducing a decorative monospaced face.

## Layout

The shared shell uses a 64px top bar and, from 1000px wide, a fixed 216px trainer rail. The training workspace is centered within the remaining area with a maximum width of 1120px. Desktop workspace gutters are 40px; content groups usually have 20px between them and 12px between adjacent controls or small cards.

Below 1000px, trainer selection becomes a compact horizontal strip and route navigation moves to a fixed bottom bar with safe-area padding. Leave content clearance for the bottom navigation, active timer, and Together strip. At 720–999px the workspace caps at 760px with 32px gutters. Ordinary phone gutters are 20px, with tighter adaptations below 390px.

The shared header reserves `env(safe-area-inset-top)` above its controls in installed iPhone apps. Its measured full height positions the trainer navigation beneath it, including after scrolling and orientation changes. Narrow-screen padding must preserve that top inset.

At 1100px and above, the Today surface can place the next session beside supporting metrics and guidance, using a 1.45:1 relationship. The seven-day sequence spans the available content width. Narrower layouts return to one readable column. These compositions are surface patterns, not a requirement for every screen; settings, libraries, and set tables follow their own existing structures.

Preserve wrapping for exercise names, button text, and explanatory copy. Set-entry grids adapt separately on small phones; never remove a logging action merely to fit a row. See the sidecar for the implemented breakpoints, including the smaller control-specific adaptations.

## Elevation & Depth

Trainer surfaces are flat. Background changes, borders, and spacing separate the workspace, cards, fields, and selected states. Cards, metrics, primary buttons, rest timers, and trainer sheets use no box shadow; gradients and backdrop blur are removed from the shared visual treatment.

The shell's floating Together strip uses `0 8px 30px #10271a26`; backup/help dialogs use `0 20px 60px #10271a40`. The shell toast retains its existing transient shadow. Dialog scrims dim the surrounding interface; trainer sheets stay opaque and readable.

**The Flat Workspace Rule.** Reserve elevation for transient shell overlays. Do not add shadows to ordinary training cards or accent buttons.

## Shapes

Use gently rounded rectangles: small controls generally use `sm`, primary buttons use `button`, ordinary cards use `lg`, and heroes/dialogs use `xl`. Small chips have the tighter `chip` radius; set fields and completion buttons use `set-control`. Keep the seven-day sequence as individual rectangular tiles rather than pills.

One-pixel borders establish ordinary boundaries. Active desktop route tabs use a two-pixel underline. Mobile sheets have rounded upper corners and a short grab handle; centered dialogs round all four corners. Use simple inline stroke icons, sized to their role, without decorative badges around every heading.

## Components

### Buttons

Primary buttons use accent fill and on-accent text; ghost buttons use Paper with a Control Edge border. Destructive buttons use the critical soft fill and critical text. Standard buttons have a minimum height of 46px; hero actions are at least 48px, and compact buttons are 40px. Keep text able to wrap.

On hover-capable devices, primary fill mixes accent with ink at 89% accent. Ordinary hover uses Quiet Paper and a stronger border. Pressed primary/ghost controls move down one pixel. Disabled controls use half opacity and a disabled cursor. Keyboard focus uses an explicit three-pixel outline with three-pixel offset in trainers.

### Inputs / Fields

General fields use Quiet Paper, Control Edge, small corners, 16px editable text, and at least 44px height. Put sentence-case labels above the field. Focus uses a two-pixel accent outline with offset, without a glow. Search fields transfer this focus boundary to their wrapper. Keep the existing validation copy and status semantics visible.

### Navigation

Trainer navigation is persistent evergreen with a pale leaf selected item. Desktop entries include an icon, name, and short explanation; mobile entries retain icons and names in a horizontal strip. Route navigation is a separate level: a text-and-icon row with an underline on desktop, and five equal bottom-bar cells with soft selected fills on phones. Use the existing selected and accessibility state attributes together.

### Chips / Choices

Informational chips are small rounded rectangles with a subtle border, quiet fill, and supporting ink. Actionable filters have larger targets; selected filters use accent fill and on-accent text. Segmented controls sit within a recessed track and select a Paper segment. Readiness choices and warning states keep their existing semantic distinctions.

### Cards / Next Session

Ordinary cards use Paper, Soft Edge, large corners, and 20px padding, increasing to 24px on desktop. The next-session card uses Field Green without a border, extra-large corners, a compact eyebrow, a clear headline, supporting copy, and the primary task. Let content determine height except where the desktop surface deliberately aligns adjacent panels.

### Training Week

The seven-day strip uses equal columns with compact day labels, tabular dates, and completion marks. Completed days use accent fill; today uses an inset outline. Both states may coexist. Empty days stay neutral. Populate completion only from real stored sessions; the preview sidecar contains explicitly labeled sample data.

### Set Logging / Timers

Preserve the compact grid of set number, editable values, completion, and row actions. Set fields and completion controls are 44px high. The next row has a soft accent background; completed marks receive accent fill. Numbers use tabular alignment and accessible field labels. Keep the rest timer above mobile route navigation and within the content region on desktop.

Short state transitions use the existing 150ms timing; next-row background uses 250ms. All animation, transitions, and smooth scrolling are disabled under reduced motion. Do not animate route entry or introduce continuous decorative movement.

## Do's and Don'ts

### Do:

- **Do** share the shell, semantic colors, type pairing, and control patterns across all four trainers.
- **Do** make the next training action visually clear while keeping evidence and explanation readable.
- **Do** preserve light, dark, and system themes, visible keyboard focus, and reduced-motion behavior.
- **Do** use tabular numerals, explicit units, and wrapping exercise names in compact working layouts.
- **Do** show real training history and honest empty states.
- **Do** keep phone logging controls reachable and clear of fixed navigation and timers.

### Don't:

- **Don't** restore separate trainer palettes, decorative gradients, backdrop blur, or glowing cards.
- **Don't** use color alone to communicate completion, warnings, selection, or destructive intent.
- **Don't** shrink editable values or hide necessary set actions to force a narrow row.
- **Don't** add decorative motion or animate route entry.
- **Don't** manufacture achievements or completed days to fill an empty screen.
- **Don't** introduce remote font dependencies or framework-only component previews.
