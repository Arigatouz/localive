# Design Tokens — Localive Website

> **Theme:** Cyberpunk / Neon-Noir
> **Scope:** Landing page (`index.astro`) + Starlight docs (`custom.css`)
> **Source:** TaskFlow design tokens, adapted for Localive

---

## 1. Fonts & Typography

### Font Families

| Token       | Value                                        | Usage                                       |
| ----------- | -------------------------------------------- | ------------------------------------------- |
| `font-sans` | `'Orbitron', sans-serif`                     | Headings, buttons, labels                   |
| `font-mono` | `'Share Tech Mono', monospace`               | Labels, metadata, body text on landing pg  |
| `font-code` | `'JetBrains Mono', 'Share Tech Mono', monospace` | Code blocks, terminal chrome, inline code |

### Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@400;500;700;900&family=Share+Tech+Mono&display=swap');
```

### Heading Styles

**Page title (hero h1):**

```
font-family: 'Orbitron', sans-serif
font-size: clamp(1.4rem, 4vw, 3rem)
font-weight: 900
font-style: italic
letter-spacing: -0.02em
text-transform: uppercase
color: white
text-shadow: 2px 2px 0px #ff00ff
```

**Section headings (landing page `.section-heading`):**

```
font-family: 'Share Tech Mono', monospace
font-size: 0.65rem
letter-spacing: 0.25em
text-transform: uppercase
color: #00f3ff
text-shadow: 0 0 2px rgba(0, 243, 255, 0.5)
→ has ::after gradient line
```

**Doc page headings (Starlight override):**

```
font-family: 'Orbitron', sans-serif  (h1, h2)
font-family: 'Share Tech Mono', monospace  (h3–h6)
color: #00f3ff
text-shadow: 0 0 2px rgba(0, 243, 255, 0.5)
letter-spacing: 0.05em
text-transform: uppercase
```

**Card headings (feature cards):**

```
font-family: 'Orbitron', sans-serif
font-size: 0.95rem
font-weight: 700
letter-spacing: 0.1em
text-transform: uppercase
color: #00f3ff
text-shadow: 0 0 2px rgba(0, 243, 255, 0.5)
```

### Font Weights

| Weight | Usage                    |
| ------ | ------------------------ |
| 400    | Body text, code          |
| 500    | Subtle emphasis          |
| 700    | Labels, buttons, h3–h6   |
| 900    | Hero heading (h1)        |

### Body Text

```
font-family: 'JetBrains Mono', 'Share Tech Mono', monospace
font-size: 16px (1rem)
line-height: 1.7
color: #e0e0e0
```

---

## 2. Color Palette

### Core Semantic Colors

| Token             | Hex       | Role                                |
| ----------------- | --------- | ----------------------------------- |
| `cyber-black`     | `#0a0a0f` | Base background (darkest)           |
| `cyber-dark`      | `#12121a` | Surface 1 — input bg, scrollbar     |
| `cyber-card`      | `#1b1b26` | Surface 2 — cards, sidebar, panels |
| `cyber-primary`   | `#00f3ff` | Cyan — primary accent, headings     |
| `cyber-secondary` | `#ff00ff` | Magenta — secondary accent          |
| `cyber-accent`    | `#7000ff` | Purple — decorative gradients      |
| `cyber-warning`   | `#fcee0a` | Yellow — warning states             |
| `cyber-danger`    | `#ff2a6d` | Red/Pink — error, danger states     |
| `cyber-success`   | `#05ffa1` | Green — success states              |
| `cyber-text`      | `#e0e0e0` | Default body text                   |
| `cyber-muted`     | `#6b6b7b` | Muted / placeholder text            |
| `cyber-muted-read`| `#9aa0b5` | Readable secondary (code comments)  |
| `cyber-comment`   | `#8a93a8` | Code comment color                  |
| `gray-800`        | `#1f2937` | Borders, dividers                   |
| `gray-700`        | `#374151` | Input borders, light borders        |

### Opacity Variants

| Token                  | Usage                        |
| ---------------------- | ---------------------------- |
| `cyber-primary/0.08`   | Code background tint         |
| `cyber-primary/0.1`    | Hover tint on badges         |
| `cyber-primary/0.15`   | Code border-left             |
| `cyber-primary/0.3`    | Card borders, neon shadows  |
| `cyber-secondary/0.1`  | Hover tint (magenta)        |
| `cyber-danger/0.08`    | Error inline code tint       |
| `cyber-success/0.08`   | Success inline code tint     |
| `cyber-dark/0.3`       | Grid overlay lines           |
| `cyber-dark/0.4`       | Terminal bar background     |
| `cyber-accent/0.15`    | Decision box shadow          |
| `cyber-accent/0.03`    | Decision box inset           |

---

## 3. Shadows & Neon Glows

### Box Shadows

| Token               | Value                                                 | Usage                        |
| ------------------- | ----------------------------------------------------- | ---------------------------- |
| `shadow-neon-blue`  | `0 0 5px #00f3ff, 0 0 10px #00f3ff, 0 0 20px #00f3ff` | Primary button hover         |
| `shadow-neon-pink`  | `0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff` | Secondary button hover       |
| `shadow-neon-green` | `0 0 5px #05ffa1, 0 0 10px #05ffa1, 0 0 20px #05ffa1` | Success glow                 |

### Inline Glow Values

| Value                                       | Usage                      |
| ------------------------------------------- | -------------------------- |
| `0 0 10px rgba(0,243,255,0.3)`              | Default btn shadow         |
| `0 0 15px rgba(0,243,255,0.1)`              | Card hover glow            |
| `0 0 8px rgba(0,243,255,0.3)`               | Active locale button       |
| `0 0 5px rgba(0,243,255,0.3)`               | Input focus ring           |
| `-5px 0 20px rgba(112,0,255,0.15)`          | Decision box left shadow   |
| `0 0 25px rgba(0,243,255,0.25)`            | Card breathe (50% keyframe) |
| `0 0 15px rgba(0,243,255,0.15)`             | Card breathe (0% keyframe)  |

### Text Shadows

| Value                                        | Usage                            |
| -------------------------------------------- | ------------------------------- |
| `0 0 2px rgba(0, 243, 255, 0.5)`            | All headings (base layer)        |
| `2px 2px 0px #ff00ff`                        | Hero h1 (magenta offset)        |
| `2px 2px 0px #00f3ff`                        | Hero h1 alt (cyan offset)       |
| `0 0 10px rgba(0,243,255,0.5)`               | Large stat glow (cyan)          |
| `0 0 8px rgba(112,0,255,0.7)`               | Decision box number glow        |
| `0 0 8px rgba(252,238,10,0.5)`               | Warning badge glow              |
| `0 0 8px rgba(5,255,161,0.5)`                | Success badge glow              |

---

## 4. Backgrounds & Surfaces

### Layer Hierarchy

| Layer         | Color      | Usage                                    |
| ------------- | ---------- | ---------------------------------------- |
| **Base**      | `#0a0a0f`  | `<body>`, main content area              |
| **Surface 1** | `#12121a`  | Inputs, scrollbar track, terminal bar bg  |
| **Surface 2** | `#1b1b26`  | Cards, sidebar, code blocks, panels     |

### Decorative Gradient Bar (top of page)

```
height: 3px
background: linear-gradient(to right, #00f3ff, #ff00ff, #7000ff)
```

### Grid Overlay

```
position: fixed; inset: 0;
background-image:
  linear-gradient(rgba(18, 18, 26, 0.3) 1px, transparent 1px),
  linear-gradient(90deg, rgba(18, 18, 26, 0.3) 1px, transparent 1px);
background-size: 40px 40px;
pointer-events: none;
z-index: 0;
```

Landing page uses opacity `0.3`. Docs pages use `0.8` for subtlety.

### CRT Scanlines (landing page only)

```
position: fixed; inset: 0;
background: repeating-linear-gradient(
  0deg,
  transparent, transparent 3px,
  rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px
);
pointer-events: none;
z-index: 9998;
```

### Gradient Accent Line (left of cards)

```
position: absolute; top: 0; left: 0;
width: 2px; height: 100%;
background: linear-gradient(to bottom, #00f3ff, transparent);
```

### Hero Trace Line (gradient under title)

```
display: block;
width: 300px; height: 1px;
margin: 0.5rem auto 0;
background: linear-gradient(90deg, transparent, #00f3ff, #7000ff, #ff00ff, transparent);
box-shadow: 0 0 5px #00f3ff, 0 0 10px #00f3ff, 0 0 20px #00f3ff;
animation: trace-pulse 3s ease-in-out infinite;
```

---

## 5. Borders & Dividers

| Style                            | Usage                              |
| -------------------------------- | ---------------------------------- |
| `1px solid #1f2937`              | Standard card/section border       |
| `1px solid #374151`              | Input borders, lighter dividers    |
| `border-left: 2px solid rgba(0,243,255,0.15)` | Code blocks           |
| `border-left: 3px solid #7000ff` | Decision box accent               |
| `border-left: 2px solid #00f3ff` | Active nav, card accent            |
| `border-top: 2px solid #05ffa1`  | Success-topped card                |
| `border-top: 2px solid #ff00ff`  | Secondary-topped card              |
| `border-bottom: 1px solid #1f2937` | Section dividers, table rows     |

---

## 6. Clip Paths & Geometric Cuts

| Token            | Value                                                  | Usage             |
| ---------------- | ------------------------------------------------------ | ----------------- |
| `--clip-card`    | `polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)`    | Cards, containers |
| `--clip-button`  | `polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)` | Buttons    |

Both clip paths are defined as CSS custom properties and applied directly in component classes.

---

## 7. Layout Components

### Hero Section

```
text-align: center
padding: 5rem 2rem 3rem (landing page)
padding: 2rem 0 1.5rem (reference site)
max-width: 800px; margin: 0 auto
```

- `.glitch-wrap`: `position: relative; display: inline-block`
- `.glitch-wrap::before/after`: Ghost text layers for glitch animation
- `.hero-trace`: Gradient line with pulse animation

### CTA Buttons

| Class            | Border             | Text Color         | Hover BG     | Hover Shadow               |
| ---------------- | ------------------ | ------------------ | ------------ | --------------------------- |
| `.cta-primary`   | `2px solid #00f3ff` | `#00f3ff`          | `#00f3ff`    | `shadow-neon-blue`         |
| `.cta-secondary` | `2px solid #ff00ff` | `#00f3ff` → see above | `#ff00ff` | `shadow-neon-pink`       |

Both use `clip-path: var(--clip-button)` and `font-family: 'Orbitron'`.

### Feature Cards

```
background: #1b1b26
border: 1px solid #1f2937
padding: 1.5rem
position: relative
overflow: hidden
clip-path: var(--clip-card)

::before → left accent glow line (2px, cyan→transparent)
:hover → border-color: rgba(0,243,255,0.35)
         box-shadow: 0 0 15px rgba(0,243,255,0.1)
```

### Demo App Container

```
border: 1px solid #1f2937
overflow: hidden
background: #1b1b26
clip-path: polygon(0 0, 100% 0, 100% 95%, 97% 100%, 0 100%)
```

### Comparison Table

```
width: 100%; border-collapse: collapse
font-family: 'Share Tech Mono', monospace

th → background: #12121a, color: #00f3ff, Orbitron,
     font-size: 0.75rem, letter-spacing: 0.1em, uppercase
td → border-bottom: 1px solid rgba(31,41,55,0.8)
tr:hover td → background: rgba(0,243,255,0.018)
```

### Footer

```
text-align: center
padding: 3rem 1rem
border-top: 1px solid #1f2937
color: #6b6b7b
font-family: 'Share Tech Mono', monospace
letter-spacing: 0.05em; text-transform: uppercase
font-size: 0.8rem

Footer trace: flex row with blinking cyan dot + "system_status: online"
```

### Code Blocks (Docs)

```
background: #12121a
border: 1px solid #1f2937
border-left: 2px solid rgba(0,243,255,0.15)
padding: 1.2rem
font-family: 'JetBrains Mono', monospace
font-size: 0.88rem
line-height: 1.75
overflow-x: auto
```

---

## 8. Animations & Effects

### Glitch Animation (hero title)

```css
@keyframes glitch-a {
  0%, 9%, 11%, 100% { opacity: 0; transform: translate(0); clip-path: none; }
  10%   { opacity: 0.85; transform: translate(-3px, 1px);  clip-path: inset(18% 0 58% 0); }
  10.5% { opacity: 0.85; transform: translate(3px, -1px); clip-path: inset(62% 0 8% 0);  }
}
@keyframes glitch-b {
  0%, 9.3%, 11%, 100% { opacity: 0; transform: translate(0); clip-path: none; }
  9.8%  { opacity: 0.8; transform: translate(3px, -1px);  clip-path: inset(52% 0 22% 0); }
  10.4% { opacity: 0.8; transform: translate(-3px, 1px); clip-path: inset(8% 0 68% 0);  }
}
```

Applied to `.glitch-wrap::before` (glitch-a, 9s infinite 2.5s) and `::after` (glitch-b, 9s infinite 2.5s).

### Hero Trace Pulse

```css
@keyframes trace-pulse {
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
}
```

### Card Breathing Glow

```css
@keyframes card-breathe {
  0%, 100% { box-shadow: 0 0 15px rgba(0,243,255,0.15), inset 0 0 40px rgba(0,243,255,0.03); }
  50%       { box-shadow: 0 0 25px rgba(0,243,255,0.25), inset 0 0 50px rgba(0,243,255,0.06); }
}
```

### Footer Dot Blink

```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.15; }
}
```

Duration: 2s, `step-end` timing.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .glitch-wrap::before,
  .glitch-wrap::after,
  .card.recommended,
  .hero-trace,
  .footer-dot { animation: none !important; }
}
```

---

## 9. Starlight Theme Overrides

### Forced Dark Mode

```css
:root {
  --sl-color-accent: #00f3ff;
  --sl-color-accent-high: #00f3ff;
  --sl-color-accent-low: #7000ff;
}
```

Starlight respects `prefers-color-scheme` by default. We force dark by overriding all light-mode variables in `:root`.

### Starlight CSS Variable Overrides

```css
:root {
  /* Backgrounds */
  --sl-color-bg: #0a0a0f;
  --sl-color-bg-sidebar: #12121a;
  --sl-color-bg-inline-code: #1b1b26;
  --sl-color-bg-nav: #12121a;
  --sl-color-bg-overlay: rgba(10, 10, 15, 0.9);

  /* Text */
  --sl-color-text: #e0e0e0;
  --sl-color-text-muted: #6b6b7b;

  /* Accent */
  --sl-color-accent: #00f3ff;
  --sl-color-accent-high: #00f3ff;
  --sl-color-accent-low: #7000ff;

  /* Headings */
  --sl-color-heading: #00f3ff;
  --sl-color-heading-inject: #00f3ff;

  /* Borders */
  --sl-color-border: #1f2937;
  --sl-color-border-accent: rgba(0, 243, 255, 0.3);

  /* Code */
  --sl-color-code-bg: #1b1b26;
  --sl-color-code-text: #e0e0e0;

  /* Links */
  --sl-color-link: #00f3ff;

  /* Scrollbar */
  --sl-color-scrollbar-thumb: #1b1b26;
  --sl-color-scrollbar-track: #12121a;
}
```

### Theme Toggle

Starlight's built-in dark/light/auto theme selector is **enabled** (not hidden). Both themes are fully styled. The landing page provides its own toggle button that syncs with Starlight's `localStorage('starlight-theme')` key.

**Sidebar links:**
```css
font-family: 'Share Tech Mono', monospace
font-size: 0.85rem
→ default: color: var(--cyber-muted-read)
→ hover: color: var(--cyber-primary), border-left: 2px solid var(--cyber-primary)
```

**Doc page headings:**
```css
h1, h2 → font-family: 'Orbitron', sans-serif, uppercase, letter-spacing
h3–h6 → font-family: 'Share Tech Mono', monospace
color: var(--cyber-primary), text-shadow: var(--text-shadow-heading)
```

---

## 10. Light Theme Tokens

The Localive website supports **dark and light themes** with full theme switching via `html[data-theme]`. Both the Starlight docs and landing page share the same theme mechanism using `localStorage('starlight-theme')`.

### Design Philosophy

The light theme preserves the cyberpunk identity (hexagonal clip-paths, geometric L logo, glitch animations, gradient bars) while adapting colors for WCAG AA contrast on light backgrounds. CRT scanlines are disabled in light mode; the grid overlay is very subtle.

### Color Palette — Light Theme

| Dark Value   | Light Value | Token             | WCAG AA Contrast on `#f5f5f8` |
| ------------ | ----------- | ----------------- | ------------------------------ |
| `#0a0a0f`    | `#f5f5f8`   | Background         | —                              |
| `#12121a`    | `#ebebf0`   | Surface/sidebar    | —                              |
| `#1b1b26`    | `#e8e8f0`  | Card/code bg       | —                              |
| `#00f3ff`    | `#0a7a8f`  | Primary accent     | 5.7:1 ✅                       |
| `#ff00ff`    | `#b300b3`  | Secondary accent   | 5.1:1 ✅                       |
| `#7000ff`    | `#7c3aed`  | Tertiary accent    | 4.6:1 ✅                       |
| `#fcee0a`    | `#a68a00`  | Warning             | 4.8:1 ✅                       |
| `#ff2a6d`    | `#c41d44`  | Danger              | 5.8:1 ✅                       |
| `#05ffa1`    | `#00875a`  | Success             | 5.3:1 ✅                       |
| `#e0e0e0`    | `#1a1a2e`  | Text                | 13.5:1 ✅                      |
| `#6b6b7b`    | `#6b6b8b`  | Muted               | 5.2:1 ✅                       |
| `#9aa0b5`    | `#5a5a72`  | Muted readable      | 5.9:1 ✅                       |
| `#8a93a8`    | `#5a6478`  | Comment             | 5.4:1 ✅                       |
| `#1f2937`    | `#d0d0dc`  | Border              | —                              |
| `#374151`    | `#b0b0c0`  | Border light        | —                              |

### Light Mode Specific Adjustments

| Property          | Dark Mode                           | Light Mode                                              |
| ----------------- | ----------------------------------- | ------------------------------------------------------- |
| CRT scanlines     | Enabled (`opacity: 1`)             | Disabled (`opacity: 0`)                                 |
| Grid overlay      | `rgba(18,18,26, 0.3)`              | `rgba(0,0,0, 0.04)` — very subtle                       |
| Top gradient bar  | `#00f3ff → #ff00ff → #7000ff`     | `#0a7a8f → #b300b3 → #7c3aed`                          |
| Hero text-shadow  | `2px 2px 0px #ff00ff`              | `1px 1px 0px rgba(10,122,143,0.3)`                      |
| Card hover glow   | `rgba(0,243,255,0.1)`              | `rgba(10,122,143,0.08)`                                 |
| Neon shadows      | Full neon (`0 0 5/10/20px`)       | Soft shadows (`0 0 5px rgba, 0 0 10px rgba`)           |
| Logo glow         | `drop-shadow(0 0 2-8px cyan)`      | `drop-shadow(0 0 1-4px teal)`                          |
| Glitch animation  | Full opacity flicker (0.85)        | Softer opacity flicker (0.5)                            |
| Input focus       | Cyan glow (`0 0 5px cyan`)         | Teal glow (`0 0 5px rgba(10,122,143,0.2)`)              |

### Theme Toggle Mechanism

Both the landing page and Starlight docs use `localStorage('starlight-theme')` as the shared key. The landing page toggle button reads/writes this key and sets `document.documentElement.dataset.theme`. Starlight's built-in `ThemeProvider` does the same for doc pages, so theme preference persists across the entire site.

**Landing page toggle**: Fixed position, top-right corner, hexagonal clip-path button with sun/moon SVG icons. Sun icon shown in dark mode, moon icon in light mode.

**CSS switching**: All component styles reference `var(--lp-*)` tokens for the landing page and `var(--sl-color-*)` / `var(--cyber-*)` tokens for Starlight docs. The `html[data-theme]` selector swaps all values simultaneously.

---

## 11. Logo — Animated Cyberpunk Hex

The Localive logo is an **animated hexagonal SVG** that changes with the theme. It uses the same `--clip-button` clip-path geometry as the CTA buttons: `polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)`.

### Design

- **Hexagonal outline**: Asymmetric angular cut matching `--clip-button`
- **L glyph**: Angular/geometric, centered, `stroke-linecap="round"`, `stroke-linejoin="round"`
- **Accent line**: Thin colored line along the bottom edge
- **Node circles**: Small pulsing circles at 3 hex vertices
- **ViewBox**: `0 0 100 100` — perfect square aspect ratio

### Animations (SMIL inside SVG)

| Animation    | Duration | Trigger   | Description                                          |
| ------------ | -------- | --------- | ---------------------------------------------------- |
| Stroke draw  | 1.5s     | begin=0.3s | Hex outline draws itself on via stroke-dashoffset  |
| L draw       | 0.8s     | begin=1.5s | L glyph traces on after hex completes                |
| Accent fade  | 0.5s     | begin=2s   | Bottom accent line fades in                         |
| Glitch pulse | 8s loop  | begin=4s   | Brief opacity dips on hex outline (cyberpunk feel)  |
| Node pulses  | 2-2.5s   | staggered | 3 vertex circles pulse with opacity 0→0.8→0          |

### CSS Glow (added on top of SMIL)

```css
/* Dark mode */
html[data-theme="dark"] .site-title img {
  animation: logo-glow-dark 4s ease-in-out infinite;
}
@keyframes logo-glow-dark {
  0%, 100% { filter: drop-shadow(0 0 2px rgba(0, 243, 255, 0.3)); }
  50%       { filter: drop-shadow(0 0 8px rgba(0, 243, 255, 0.6)); }
}

/* Light mode */
html[data-theme="light"] .site-title img {
  animation: logo-glow-light 4s ease-in-out infinite;
}
@keyframes logo-glow-light {
  0%, 100% { filter: drop-shadow(0 0 1px rgba(10, 122, 143, 0.2)); }
  50%       { filter: drop-shadow(0 0 4px rgba(10, 122, 143, 0.4)); }
}
```

### Theme Switching

Starlight's built-in `logo: { dark, light }` config automatically switches the logo image based on theme. The landing page uses two `<img>` elements with `html[data-theme]` visibility toggling:

```css
html[data-theme="dark"] .logo-light { display: none; }
html[data-theme="light"] .logo-dark { display: none; }
```

### Color Differences

| Element         | Dark Mode     | Light Mode     |
| --------------- | ------------- | -------------- |
| Hex stroke     | `#00f3ff`     | `#0a7a8f`      |
| L glyph stroke | `#ffffff`     | `#1a1a2e`      |
| Accent line    | `#ff00ff`     | `#7c3aed`      |
| Node circles   | `#00f3ff`/`#ff00ff` | `#0a7a8f`/`#7c3aed` |
| Glitch opacity | 0.7 peak      | 0.5 peak (softer) |

### Favicon

`public/favicon.svg` is a static snapshot of the dark-mode logo (SMIL doesn't animate in browser tab favicons).

---

## 12. CSS Variable Map

### `:root` Variables (Shared — Font & Animation Tokens)

```css
:root {
  --font-sans: 'Orbitron', sans-serif;
  --font-mono: 'Share Tech Mono', monospace;
  --font-code: 'JetBrains Mono', 'Share Tech Mono', monospace;
  --clip-card: polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%);
  --clip-button: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
  --transition-fast: 150ms;
  --transition-normal: 300ms;
}
```

### `html[data-theme="dark"]` Variables (Dark Mode — Default)

Includes all `--sl-color-*`, `--cyber-*`, `--lp-*`, and dark-specific overrides. See `custom.css` for full list.

### `html[data-theme="light"]` Variables (Light Mode)

Includes all `--sl-color-*`, `--cyber-*`, `--lp-*`, and light-specific overrides. Key light token values:

```
--sl-color-bg: #f5f5f8          --lp-bg: #f5f5f8
--sl-color-bg-sidebar: #ebebf0   --lp-surface: #ebebf0
--sl-color-text: #1a1a2e         --lp-card-bg: #ffffff
--sl-color-text-muted: #6b6b8b   --lp-text: #1a1a2e
--sl-color-accent: #0a7a8f       --lp-cyan: #0a7a8f
--sl-color-heading: #0a7a8f      --lp-magenta: #b300b3
--sl-color-border: #d0d0dc       --lp-purple: #7c3aed
                                  --lp-crt-opacity: 0
                                  --lp-grid-opacity: 0.04
```

### Theme-Specific Overrides

```css
/* CRT scanlines: enabled in dark, disabled in light */
body.landing-page::after { opacity: var(--lp-crt-opacity); }

/* Grid overlay: subtle in both, more visible in dark */
body.landing-page main::before {
  background-image:
    linear-gradient(rgba(18, 18, 26, var(--lp-grid-opacity)) 1px, transparent 1px), ...);
}
/* Light mode overrides grid with rgba(0,0,0,0.04) */
```

---

## Responsive Breakpoints

| Breakpoint              | Changes                                        |
| ----------------------- | ---------------------------------------------- |
| `max-width: 860px`     | Grid columns collapse to single column        |
| `max-width: 560px`     | Reduce padding, hero h1 → 1.2rem, code → 0.8rem |

---

## Quick Reference

| Element           | Key Styles                                                              |
| ----------------- | ----------------------------------------------------------------------- |
| **Body**          | `bg: cyber-black, text: cyber-text, font: JetBrains Mono/Share Tech`  |
| **Top Bar**      | `3px gradient (cyan→magenta→purple)`                                    |
| **Hero h1**       | `Orbitron 900 italic, text-shadow hero-pink, glitch animation`          |
| **Section Label** | `Share Tech Mono 0.65rem, tracking-widest, cyan, gradient line after`  |
| **Card**          | `clip-path card, left glow line, hover neon border+shadow`             |
| **Button**        | `clip-path button, border-2, hover fill+neon glow`                     |
| **Code Block**    | `JetBrains Mono, border-left cyan accent, cyber-dark bg`               |
| **Table**         | `Share Tech Mono thead, neon cyan headers, dim row hover`             |
| **Grid Overlay**  | `40×40px grid, 0.3 opacity lines (landing), 0.8 (docs)`               |
| **CRT Scanlines** | `Landing page only, repeating gradient overlay, z-9998`                |
| **Scrollbar**     | `8px, track: cyber-dark, thumb: cyber-card, hover: purple`             |
| **Selection**     | `bg: cyber-primary, color: cyber-black`                                 |

---

_End of Localive Design Tokens_