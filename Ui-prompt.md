## 🎨 Hand-Drawn UI Redesign Prompt (Phosphor Icons)

**Objective**

Transform the entire website into a polished **hand-drawn/sketchbook-inspired interface** while **continuing to use Phosphor Icons**. The result should feel like a modern notebook, whiteboard, or Figma sketch rather than a generic dark dashboard.

### Design Direction

Take inspiration from:

* Excalidraw
* tldraw
* Linear (soft dark mode)
* Figma sketch concepts
* Hand-drawn notebooks
* Sticky notes
* Graph paper
* Pencil sketches

The interface should remain professional while feeling playful and handcrafted.

---

# Icon System

**Do NOT replace Phosphor Icons.**

Continue using **Phosphor Icons** throughout the application.

Use these variants wherever appropriate:

* Regular
* Duotone
* Fill (only when active)
* Thin for subtle actions

Styling:

* Rounded corners
* Slight rotation (±2° only where it feels natural)
* Soft pastel icon colors
* Sketch-like appearance through CSS rather than replacing icons

Example CSS:

```css
.phosphor-icon {
    stroke-width: 1.8;
    opacity: 0.92;
    transition: all .2s ease;
}

button:hover .phosphor-icon {
    transform: rotate(-2deg) scale(1.05);
}
```

---

# Color Palette

Replace the current flat dark palette with softer colors.

Background

```
#F9F7F1
#F4F0E6
```

Cards

```
#FFFDF8
```

Primary

```
#4F8EF7
```

Secondary

```
#F7B267
```

Success

```
#7AC74F
```

Danger

```
#E76F51
```

Accent

```
#B583F6
```

Borders

```
#3A3A3A
```

Text

```
#2D2D2D
```

---

# Typography

Use fonts that complement a sketch aesthetic.

Recommended:

* Kalam
* Patrick Hand
* Caveat
* Nunito
* Inter (for body text)

Use handwritten fonts only for:

* Titles
* Labels
* Section headers

Keep body text readable.

---

# Border Style

Replace all sharp borders.

Instead use:

```
2px irregular borders
border-radius: 14px;
slightly uneven outlines
```

Every card should feel hand-drawn.

---

# Shadows

Replace modern box shadows.

Use layered sketch shadows:

```
4px 4px 0 rgba(0,0,0,.15)

or

drop-shadow(3px 3px 0 rgba(0,0,0,.18))
```

Avoid blur-heavy shadows.

---

# Buttons

Buttons should resemble sticky notes or marker-drawn UI.

Requirements:

* Rounded
* Thick outline
* Slight hover tilt
* Pastel fills
* Handwritten labels

Hover animation:

```
rotate(-1deg)
translateY(-2px)
```

Active:

```
scale(.98)
```

---

# Inputs

Transform all inputs into notebook fields.

Requirements

* Sketch border
* Off-white background
* Rounded corners
* Pencil-style placeholder
* Animated focus border

---

# Cards

Current cards feel flat.

Redesign every card with:

* Uneven borders
* Soft paper background
* Small sketch shadow
* Slight random rotation (0–1° max)
* Rounded corners

---

# Sidebar

Current sidebar should become a notebook margin.

Requirements

* Slight paper texture
* Hand-drawn separators
* Active item highlighted with pastel marker
* Phosphor icons remain

Hover:

```
marker highlight animation
```

---

# Top Navigation

Modern toolbar styled like a notebook header.

Include:

* Hand-drawn divider lines
* Rounded search bar
* Soft icon buttons
* Sticky-note style user menu

---

# Terminal / Output Panel

Style the console like graph paper.

Requirements

* Dark chalkboard background OR notebook paper
* Rounded container
* Sketch border
* Green monospace output
* Paper-tab header

---

# Code Editor

Keep Monaco editor functionality.

Wrap it inside:

* Sketch border
* Rounded frame
* Paper-like toolbar
* Hand-drawn tabs

Do **not** modify Monaco internals.

---

# Tabs

Current tabs are flat.

Convert into notebook tabs.

Requirements

* Rounded top corners
* Slight overlap
* Active tab lifted
* Handwritten labels
* Smooth transition

---

# Animations

Use subtle playful animations.

Examples:

Hover

```
rotate(1deg)
translateY(-2px)
```

Cards

```
scale(1.01)
```

Sidebar

```
marker swipe
```

Buttons

```
spring motion
```

Avoid flashy animations.

---

# Background

Replace flat background with subtle paper texture.

Optional:

* Grid paper
* Dotted notebook
* Light grain
* Pencil marks

Keep opacity under 5%.

---

# Responsiveness

Maintain all existing responsive behavior.

Do not change:

* Layout
* Breakpoints
* Functionality

Only improve visual styling.

---

# Accessibility

Maintain:

* Keyboard navigation
* Focus states
* Proper contrast
* Existing aria labels
* Existing alt text

---

# Performance

Avoid heavy assets.

Prefer:

* Pure CSS
* SVG decorations
* Existing Phosphor icons

Do not introduce unnecessary image assets.

---

# Implementation Constraints

* Keep the existing component structure.
* Do not rewrite application logic.
* Do not change routing.
* Do not modify API integrations.
* Preserve all existing functionality.
* Refactor only the presentation layer (CSS, theme, component styling).

---

# Deliverables

1. Apply the hand-drawn theme consistently across the entire application.
2. Keep **Phosphor Icons** as the exclusive icon library.
3. Introduce reusable design tokens (colors, spacing, typography, border radius, shadows).
4. Ensure every screen follows the same visual language.
5. Test all pages for responsive behavior and visual consistency.
6. Generate a visual preview (or local build preview) before finalizing changes, and verify there are no regressions in layout or functionality.
7. Keep the final result clean, cohesive, playful, and professional—similar to a polished sketchbook UI rather than a cartoon theme.
