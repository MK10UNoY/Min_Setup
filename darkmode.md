# 🌙 Dark Mode, Resizable Layout & Workspace UX Prompt

## Objective

Upgrade the application into a **modern IDE-style workspace** with a polished **Dark Mode**, **Light Mode**, **fully resizable panels**, and a **professional settings system**. The experience should feel comparable to **VS Code**, **Zed**, **Cursor**, or **JetBrains IDEs**, while maintaining the existing functionality and responsive behavior.

Do **not** modify application logic, routing, or backend integrations. Focus only on UI/UX improvements and workspace ergonomics.

---

# Core Requirements

## 1. Complete Dark Mode

Implement a true dark theme rather than simply inverting colors.

### Design Goals

* Comfortable for long coding sessions
* High contrast without being harsh
* Soft accent colors
* Consistent across every component
* No white flashes during theme changes

Suggested palette

```text
Background      #18181B
Surface         #202127
Elevated        #2A2C34
Sidebar         #1D1F25
Border          #343740

Primary         #5EA0FF
Success         #6DDC6D
Warning         #F5C451
Danger          #FF6B6B

Text Primary    #F4F4F5
Text Secondary  #A1A1AA
Muted           #71717A
```

Dark mode should include

* Sidebar
* File tree
* Tabs
* Editor
* Terminal
* Status bar
* Dialogs
* Menus
* Context menus
* Settings
* Tooltips
* Buttons
* Inputs
* Modals

No component should retain light-mode colors.

---

# 2. Light Mode

Maintain a polished light theme.

Requirements

* Same layout
* Same spacing
* Same typography
* Same animations

Only colors should differ.

Theme switching should be instantaneous.

---

# 3. Quick Theme Toggle

Add a quick-access theme toggle.

Requirements

* Visible in the top toolbar
* One-click switch
* Animated transition
* Icons

Use

* Sun icon for Light
* Moon icon for Dark

Remember user preference.

Use

* localStorage
* system preference detection

If no preference exists

Follow OS theme automatically.

---

# 4. Full Settings Panel

Add a dedicated Settings button.

Recommended placement

Top-right toolbar.

Clicking opens a professional settings modal or side panel.

Include sections such as:

## Appearance

* Theme

  * System
  * Light
  * Dark

* Accent Color

* Sidebar Density

  * Compact
  * Comfortable

* Font Size

* UI Scale

* Rounded Corners

* Reduced Motion

---

## Editor

* Font Size

* Line Numbers

* Word Wrap

* Minimap

* Auto Save

* Tab Size

* Cursor Style

---

## Terminal

* Font Size

* Cursor Blink

* Clear on Run

* Scrollback Size

---

## Workspace

* Default panel layout

* Restore previous session

* Auto-open terminal

---

## Accessibility

* High Contrast

* Reduced Motion

* Larger UI

---

Settings should persist using localStorage.

---

# 5. Fully Resizable Workspace

All major panels should be resizable using draggable splitters.

Include smooth drag interactions.

Panels should remember their sizes.

---

## Sidebar

Resizable horizontally.

Minimum width

```text
220px
```

Maximum

```text
450px
```

---

## Editor Area

Should automatically resize as surrounding panels move.

---

## Terminal

Resizable vertically.

Minimum

```text
120px
```

Maximum

```text
60% viewport height
```

---

## Output Panel

Resizable.

Can be collapsed.

Can be reopened.

---

## Explorer

Resizable.

Scrollable.

---

# 6. Professional File Tree

Improve the explorer.

Features

* Expand/collapse folders
* Smooth animations
* File icons
* Folder icons
* Active file highlight
* Hover states
* Keyboard navigation

Maintain responsiveness.

---

# 7. Editor Tabs

Improve tab management.

Requirements

* Closable tabs
* Active tab highlight
* Unsaved indicator
* Overflow scrolling
* Middle-click close
* Keyboard shortcuts where applicable

If many tabs exist

Allow horizontal scrolling.

---

# 8. Responsive Layout

Application should adapt gracefully.

---

## Desktop

Keep full IDE layout.

---

## Tablet

Collapse sidebar.

Panels remain usable.

---

## Mobile

Prioritize

* Editor
* Terminal
* Explorer

Everything accessible via drawers.

No horizontal overflow.

---

# 9. Window Management

Allow panels to

* Collapse
* Expand
* Resize

Future-ready architecture for

* Docking
* Floating windows

Structure components accordingly.

---

# 10. Smooth Animations

Use tasteful transitions.

Examples

Sidebar

```css
width 0.2s ease
```

Panels

```css
transform 0.2s ease
```

Theme switch

```css
colors 150ms ease
```

Avoid excessive animations.

---

# 11. Keyboard Shortcuts

Support common workspace actions.

Examples

```text
Ctrl+B      Toggle Sidebar

Ctrl+J      Toggle Terminal

Ctrl+,      Open Settings

Ctrl+Shift+L Toggle Theme

Esc         Close dialogs
```

Do not interfere with browser defaults unless already handled.

---

# 12. Persistence

Remember between sessions

* Theme
* Panel sizes
* Sidebar width
* Terminal height
* Open settings preferences
* Last workspace layout

Use localStorage.

---

# 13. Accessibility

Maintain

* Keyboard navigation
* Focus indicators
* Screen reader compatibility
* ARIA labels
* Proper contrast ratios

Theme switching must remain fully accessible.

---

# 14. Performance

Do not introduce unnecessary dependencies.

Prefer lightweight solutions for panel resizing and layout management. If a library is required, choose a well-maintained, minimal one.

Ensure

* Smooth dragging
* No layout thrashing
* No excessive re-renders
* Responsive interactions even on lower-end devices

---

# 15. Final Verification

Before considering the implementation complete:

* Verify both Light and Dark themes across every screen.
* Test responsive layouts for desktop, tablet, and mobile breakpoints.
* Confirm all panels resize correctly without overlap or overflow.
* Ensure panel sizes and settings persist after a page reload.
* Validate keyboard shortcuts and accessibility features.
* Check for visual consistency across the entire application.
* Confirm no existing functionality or workflows have regressed.

The final result should feel like a modern, polished IDE with seamless theming, responsive panel management, and an intuitive workspace experience.
