# Style Guide & Design System: Pigeon's Mission

A reverse-engineered, comprehensive design specification for [Pigeon’s Mission](https://www.pigeonsmission.com/), derived directly from the production bundle, inlined design tokens (5Four Design System), component architecture, and responsive stylesheet.

---

## 1. Design Philosophy & Aesthetic Identity

Pigeon's Mission pairs **16-bit retro arcade gaming** with **contemporary neo-brutalism**. The visual language emphasizes tactile physical elements:

* **Tangible Depth**: Flat geometric shapes grounded by hard, directional drop shadows with zero blur radius (`2px`, `4px`, `6px`, `8px`).
* **Tactile Materials**: "Polaroid" sketchbook cards angled dynamically, affixed with semi-transparent "washi tape" and round numbered sticker badges.
* **Pixel Precision**: Stepped sawtooth dividers (`shape-rendering: crispEdges`), chunky borders (`3px` to `4px`), and pixelated image rendering (`image-rendering: pixelated`).
* **Playful Retro Arcade Palette**: Deep atmospheric night tones (`#221636`) balanced with nostalgic pastel blush surfaces (`#FCD7D7`), arcade gold accents (`#F5B72B`), and vibrant cherry-red action gradients.

---

## 2. Color Palette & Token System

### 2.1 Core Palette (`:root` Custom Properties)

| Token Name | Hex Code | Role & Description |
| :--- | :--- | :--- |
| `--pm-ink` | `#221636` | **Primary Brand Dark**; deep night purple used for backgrounds, heavy borders, text, and hard shadows |
| `--pm-blush` | `#FCD7D7` | **Primary Brand Light**; warm vintage pink used for light page surfaces and card backgrounds |
| `--pm-gold` | `#F5B72B` | **Accent / Attention**; arcade coin yellow used for badges, active states, focus rings, and high-contrast shadows |
| `--pm-mint` | `#96D4C7` | **Subtle Accent / Keyline**; soft seafoam used for section dividers, washi tape accents, and subtitles |
| `--pm-sky` | `#BBDCF4` | **Secondary Muted**; soft cloud blue used for secondary body text on dark surfaces and link colors |
| `--pm-white` | `#FFFFFF` | **Pure White**; card surfaces, crisp text highlights, and contrast badges |
| `--pm-red` | `#EE2D2B` | Primary action gradient start (arcade cherry red) |
| `--pm-maroon` | `#A52928` | Primary action gradient end & button active pressed fill |
| `--pm-blue` | `#1C75BC` | Secondary brand blue (used in header wordmark and links) |
| `--pm-cyan` | `#00A7C9` | Secondary gradient end & focus indicator tone |
| `--pm-navy` | `#282E6B` | Deep mid-ground navy used in world map card backgrounds and active states |
| `--text-muted` | `#4C4066` | Mid-tone purple for secondary labels on light backgrounds |

### 2.2 Gradients

```css
--pm-grad-red:  linear-gradient(180deg, #EE2D2B 0%, #A52928 100%); /* Primary CTA buttons */
--pm-grad-blue: linear-gradient(180deg, #1C75BC 0%, #00A7C9 100%); /* Alternative actions */
```

### 2.3 Semantic Surface & Text Mappings

```css
--surface-page:         var(--pm-blush);
--surface-dark:         var(--pm-ink);
--surface-card:         var(--pm-white);
--text-body:            var(--pm-ink);
--text-muted:           #4C4066;
--text-on-dark:         var(--pm-blush);
--text-link:            var(--pm-blue);
--action-fill:          var(--pm-grad-red);
--action-fill-pressed:  var(--pm-maroon);
--border-ink:           var(--pm-ink);
--border-keyline:       var(--pm-mint);
```

---

## 3. Typography Hierarchy

### 3.1 Font Families

* **Display / Headline Font**: `"Climate Crisis", system-ui, sans-serif`
  * Variable, heavy sans display font with extreme presence, retro geometry, and tight vertical rhythm.
  * Used for hero headlines, major section headers (`h1`, `h2`), sticker badges, and card titles.
* **Body / Interface Font**: `"Jost", "Futura", system-ui, sans-serif`
  * Geometric, clean sans-serif with excellent legibility at micro and paragraph sizes.
  * Used for body copy, navigational links, buttons, and metadata tables.

### 3.2 Type Scale & Specs

| Role | Size (Desktop) | Size (Mobile) | Weight | Line Height | Tracking | Transform |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display XL** | `96px` | `72px` | 400 | `1.0` | `-0.02em` | Uppercase |
| **Display LG** | `64px` | `48px` | 400 | `1.0` | `-0.01em` | Uppercase |
| **Display MD** | `40px` | `32px` | 400 | `1.05` | `0em` | Uppercase |
| **Heading LG** | `32px` | `28px` | 700 | `1.25` | `-0.01em` | — |
| **Heading MD** | `24px` | `22px` | 600 | `1.25` | `0em` | — |
| **Heading SM** | `18px` | `18px` | 600 | `1.25` | `0.01em` | — |
| **Body LG** | `18px` | `16px` | 400 | `1.5` | Normal | — |
| **Body (Base)** | `16px` | `15px` | 400 | `1.5` | Normal | — |
| **Body SM** | `14px` | `13px` | 400 | `1.5` | `0.01em` | — |
| **Label / Tag** | `12px – 15px`| `12px – 13px`| 600 | `1.0` | `0.08em` | Uppercase |

---

## 4. Spacing, Grid & Elevation

### 4.1 Spacing Scale

Based on an 8pt / 4pt sub-grid:

```css
--space-1:   4px;
--space-2:   8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  24px;
--space-6:  32px;
--space-7:  48px;
--space-8:  64px;
--space-9:  96px;
--space-10: 128px;
```

### 4.2 Layout Bounds & Containers

* **Content Maximum**: `1280px` (`--content-max`)
* **Container Maximum**: `1440px` (`--container-max`)
* **Section Padding (Desktop)**: `168px 48px 152px`
* **Section Padding (Tablet ≤1024px)**: `120px 32px 104px`
* **Section Padding (Mobile ≤720px)**: `80px 20px 72px`
* **Grid Gutters**: `24px` (standard) / `56px – 64px` (feature sections)

### 4.3 Borders, Radii & Shadows

* **Border Widths**:
  * Default: `3px solid var(--pm-ink)`
  * Heavy / Top-edge: `4px solid var(--pm-mint)`
  * Inner element keyline: `2px solid var(--pm-ink)`
* **Corner Radii**:
  * Small: `4px` (`--radius-sm`) – used on tags, category badges, focus states
  * Medium: `16px` (`--radius-md`) – used on cards, modals, navigation drawers
  * Pill: `999px` (`--radius-pill`) – used on buttons, sticker chips, boss labels
* **Hard Drop Shadows (No blur)**:
  * Small: `2px 2px 0 var(--pm-ink)`
  * Standard: `4px 4px 0 var(--pm-ink)`
  * Large / Cards: `6px 6px 0 var(--pm-ink)` or `8px 8px 0 var(--pm-ink)`
  * Accent Shadow: `8px 8px 0 #F5B72B` (gold shadow on dark surfaces)
  * Hover Expanded: `${hover ? '6px 8px' : '4px 4px'} 0 var(--pm-ink)`

---

## 5. Animation & Motion Guidelines

### 5.1 Timing & Easing Curves

```css
--ease-out:    cubic-bezier(0.22, 0.61, 0.36, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--dur-hover:   150ms;
--dur-press:   90ms;
--dur-reveal:  250ms;
--dur-hero:    1200ms;
--hover-lift:  -2px;
--press-scale: 0.97;
```

### 5.2 Key Animations

1. **Button Hover & Press Feedback**:
   * Resting: `transform: none`, `box-shadow: 4px 4px 0 #221636`
   * Hover: `transform: translate(0, -2px)`, `box-shadow: 6px 8px 0 #221636`
   * Active / Down: `transform: translate(3px, 3px)`, `box-shadow: 1px 1px 0 #221636`
2. **Pixel Stepped Navigation Underline**:
   * Stitched / dashed yellow line (`linear-gradient(90deg, #F5B72B 0 8px, transparent 8px 12px) 0 0 / 12px 6px repeat-x`).
   * Animates via `clip-path: inset(0 100% 0 0)` to `clip-path: inset(0 0 0 0)` over `220ms steps(6, end)`.
3. **Scroll Reveal (`.pm-reveal`)**:
   * Unrevealed: `opacity: 0; transform: translateY(32px); transition: opacity 600ms ease-out, transform 600ms ease-out;`
   * In-view: `.is-in { opacity: 1; transform: none; }`
   * Triggered via IntersectionObserver with `rootMargin: "0px 0px -8% 0px"`.
4. **Parallax Background Sky**:
   * Three depth layers (`layerClouds`, `layerHills`, `layerMid`) moving at differential Y-translations on scroll.
5. **Infinite Drag-and-Snap Carousel Rail**:
   * Continuous auto-ticking marquee (`scrollLeft += dt * 0.045`).
   * Draggable with pointer capture; transitions to snap-scrolling on deliberate user drag or chevron step clicks with cubic deceleration `1 - (1 - x)³`.
6. **Accessibility**:
   * Under `@media (prefers-reduced-motion: reduce)`, all transitions drop to `0ms`, animations disabled with `animation: none !important`, and `.pm-reveal` elements immediately display in place.

---

## 6. Component Catalog & Implementation Specifications

### 6.1 Buttons (`Button.jsx`)

Pill-shaped CTA buttons with heavy ink borders and physical depth:

```jsx
// Variants: 'primary' (red gradient), 'secondary' (dark ink), 'ghost' (transparent with underline)
// Sizes:
//   sm: padding: '8px 20px',  fontSize: 14px
//   md: padding: '14px 32px', fontSize: 18px
//   lg: padding: '18px 44px', fontSize: 22px

<button style={{
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '14px 32px',
  fontFamily: 'var(--font-body)',
  fontSize: '18px',
  fontWeight: 700,
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  borderRadius: '999px',
  border: '3px solid #221636',
  background: 'linear-gradient(180deg, #EE2D2B 0%, #A52928 100%)',
  color: '#FFFFFF',
  boxShadow: '4px 4px 0 #221636',
  textShadow: '0 1px 0 rgba(34,22,54,0.45)',
  cursor: 'pointer',
  transition: 'transform 90ms cubic-bezier(0.22,0.61,0.36,1), box-shadow 150ms cubic-bezier(0.22,0.61,0.36,1)'
}}>
  Buy on Steam
</button>
```

### 6.2 Polaroid Sketchbook Cards (`data-bp="card"`)

Used in the story carousel:

```html
<div style="position:relative; flex:0 0 560px; display:flex; flex-direction:column; transform:rotate(-2deg); transition:transform 150ms ease-out;">
  <!-- Round numbered sticker badge -->
  <div style="position:absolute; left:-12px; top:-12px; z-index:2; width:60px; height:60px; border-radius:999px; background:#F5B72B; border:3px solid #221636; box-shadow:3px 3px 0 #221636; display:flex; align-items:center; justify-content:center; font-family:'Climate Crisis',sans-serif; font-size:26px; color:#221636;">
    1
  </div>

  <!-- Decorative washi tape -->
  <div style="position:absolute; left:50%; top:-10px; transform:translateX(-50%) rotate(4deg); z-index:2; width:90px; height:24px; background:#96D4C7; opacity:0.9; border:2px solid #221636;"></div>

  <!-- Card Body -->
  <div style="background:#FFFFFF; border:3px solid #221636; border-radius:16px; box-shadow:6px 6px 0 #221636; padding:12px; display:flex; flex-direction:column; gap:14px;">
    <div style="aspect-ratio:4/3; overflow:hidden; border-radius:8px; border:2px solid #221636;">
      <img src="..." style="width:100%; height:100%; object-fit:cover; display:block;" />
    </div>
    <div style="display:flex; flex-direction:column; gap:10px; padding:4px 6px 10px;">
      <h3 style="margin:0; font-family:'Climate Crisis',sans-serif; font-size:22px; line-height:1.1; letter-spacing:0.06em; text-transform:uppercase; color:#221636;">The idea</h3>
      <p style="margin:0; font-size:21px; line-height:1.6; color:#221636;">...</p>
    </div>
  </div>
</div>
```

### 6.3 Pixel-Art Sawtooth Section Dividers

Separates alternating dark (`#221636`) and light (`#FCD7D7`) sections with stepped 8px blocks:

```html
<!-- Stepped downward teeth (32px tall, repeat-x) -->
<div style="position:absolute; left:0; right:0; bottom:-32px; height:32px; pointer-events:none; z-index:2; background:url('data:image/svg+xml,%3Csvg%20xmlns%3D\'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg\'%20width%3D\'64\'%20height%3D\'32\'%20viewBox%3D\'0%200%2064%2032\'%20shape-rendering%3D\'crispEdges\'%3E%3Crect%20x%3D\'0\'%20y%3D\'0\'%20width%3D\'64\'%20height%3D\'8\'%20fill%3D\'%23FCD7D7\'%2F%3E%3Crect%20x%3D\'8\'%20y%3D\'8\'%20width%3D\'48\'%20height%3D\'8\'%20fill%3D\'%23FCD7D7\'%2F%3E%3Crect%20x%3D\'16\'%20y%3D\'16\'%20width%3D\'32\'%20height%3D\'8\'%20fill%3D\'%23FCD7D7\'%2F%3E%3Crect%20x%3D\'24\'%20y%3D\'24\'%20width%3D\'16\'%20height%3D\'8\'%20fill%3D\'%23FCD7D7\'%2F%3E%3C%2Fsvg%3E') repeat-x 0 0/64px 32px;"></div>
```

### 6.4 Arcade Coin Section Rule

Sub-section break with dashed lines flanking an arcade coin token:

```html
<div style="position:relative; max-width:1280px; width:100%; margin:-52px auto; display:flex; align-items:center; gap:24px;">
  <div style="flex:1; height:4px; background:repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 12px, transparent 12px 24px);"></div>
  <div style="width:28px; height:28px; border-radius:999px; background:#F5B72B; border:3px solid #221636; box-shadow:3px 3px 0 #FFFFFF;"></div>
  <div style="flex:1; height:4px; background:repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 12px, transparent 12px 24px);"></div>
</div>
```

### 6.5 Category Sticker Pill

```html
<div style="display:inline-flex; align-self:flex-start; padding:10px 22px; border-radius:4px; background:#F5B72B; border:3px solid #221636; box-shadow:6px 6px 0 #221636; font-size:15px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#221636;">
  Story
</div>
```

---

## 7. Responsive Breakpoint Rules

| Breakpoint | Target Devices | Key Adaptations |
| :--- | :--- | :--- |
| **`> 1024px`** | Desktop / Large screens | Full horizontal navigation, 12-column grid, max content `1280px`, cards at full rotation and `560px` flex width. |
| **`≤ 1024px`** | Tablets & small laptops | Mobile hamburger button appears (`[data-bp="menubtn"]`), links drop into a popover menu with `box-shadow: 6px 6px 0 #F5B72B`, staggered entrance animations (`40ms` increments), section padding reduces to `120px 32px 104px`. |
| **`≤ 720px`** | Mobile screens | Headings clamped via `clamp(22px, 6vw, 32px)`, card flex basis scaled down to `min(68vw, 290px)` with symmetric rail padding, badges switch from flex row to 3-column auto grid, award icons drop to `96px` height, 44px minimum touch targets activated. |

---

## 8. Accessibility & Performance Checklist

1. **Focus State**: Unmistakable high-visibility outline:
   ```css
   a:focus-visible, button:focus-visible {
     outline: 3px solid #F5B72B;
     outline-offset: 3px;
     border-radius: 4px;
   }
   ```
2. **Skip Navigation Link**:
   * Fixed position offscreen (`left: -9999px`), pops into view on focus (`left: 0; background: #F5B72B; border: 3px solid #221636;`).
3. **Touch Targets**:
   * Minimum 44px touch target enforced on mobile via `::after` pseudo-element expanding behind all anchor links.
4. **Preloaded Fonts**:
   * Preloaded via `<link rel="preload" as="font" type="font/woff2" crossorigin>` to eliminate layout shifts for `Climate Crisis` and `Jost`.
