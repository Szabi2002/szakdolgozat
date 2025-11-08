# Responsive Breakpoint Strategy

## Áttekintés

Ez a dokumentum részletesen leírja a Közlekedési Jegykezelő Alkalmazás reszponzív design stratégiáját. Az alkalmazás **mobile-first** megközelítést alkalmaz, amely biztosítja az optimális felhasználói élményt minden eszközön.

**Design Filozófia:** Progressive Enhancement
**Fő Prioritás:** Mobile (mivel a közlekedési alkalmazásokat főként mobiltelefonon használják)
**Target Devices:** Okostelefonok (iOS/Android), tabletek, desktop böngészők

---

## Breakpoint Definíciók

### Breakpoint Értékek

```scss
// Breakpoints (Mobile-First)
$breakpoint-xs:  0;        // Extra small (mobile portrait)
$breakpoint-sm:  576px;    // Small (mobile landscape)
$breakpoint-md:  768px;    // Medium (tablet)
$breakpoint-lg:  1024px;   // Large (desktop)
$breakpoint-xl:  1280px;   // Extra large (wide desktop)
$breakpoint-2xl: 1536px;   // 2X Extra large (ultra-wide)
```

### Breakpoint Kategóriák

| Kategória | Range | Devices | Layout Strategy |
|-----------|-------|---------|-----------------|
| **Mobile Portrait** | 0-575px | iPhone SE, iPhone 12/13/14, Android phones | Single column, stacked navigation, full-width components |
| **Mobile Landscape** | 576-767px | Phones in landscape | Similar to portrait, slightly more horizontal space |
| **Tablet** | 768-1023px | iPad, Android tablets | 2-column grids, collapsible sidebar, hybrid navigation |
| **Desktop** | 1024-1279px | Laptops, small monitors | Multi-column layouts, persistent sidebar, full navigation |
| **Wide Desktop** | 1280-1535px | Large monitors | Wider content containers, more whitespace |
| **Ultra-wide** | 1536px+ | Ultra-wide monitors, 4K displays | Max-width containers to prevent overly wide content |

---

## Mobile-First Approach

### Miért Mobile-First?

1. **Prioritás:** Közlekedési alkalmazások 70-80%-át mobiltelefonon használják
2. **Teljesítmény:** Mobilon kisebb CSS bundle, desktop esetén progressively enhanced
3. **Kényszerítő tervezés:** Mobil design kényszeríti a lényegre összpontosítást
4. **Jobb UX:** Ha mobil működik, desktop is működik (fordítva nem mindig igaz)

### Mobile-First CSS Példa

```scss
// Base styles (mobile)
.button {
  width: 100%;              // Full width on mobile
  padding: 12px 16px;
  font-size: 16px;
}

// Tablet and up
@media (min-width: 768px) {
  .button {
    width: auto;            // Intrinsic width on larger screens
    padding: 12px 24px;
  }
}

// Desktop
@media (min-width: 1024px) {
  .button {
    padding: 14px 32px;     // More spacious
    font-size: 18px;
  }
}
```

**Elv:** Alap stílusok mobilra, majd `min-width` media queries-kel felfelé skálázás.

---

## Komponensenkénti Reszponzív Viselkedés

### 1. Navbar

#### Mobile (<768px)
- **Magasság:** 56px
- **Layout:** Hamburger menu (left) + Logo (center) + Avatar (right)
- **Navigation:** Side drawer (280px width, slide-in from left)
- **Search:** Collapsed, expandable (full-width overlay)

#### Tablet (768-1023px)
- **Magasság:** 64px
- **Layout:** Hamburger + Logo + Horizontal links (limited) + Avatar
- **Navigation:** Hybrid (some links visible, rest in drawer)

#### Desktop (1024px+)
- **Magasság:** 64px
- **Layout:** Logo + Full horizontal navigation + Search + Notifications + Avatar
- **Navigation:** All items visible, no drawer needed

**Implementáció:**
```scss
.navbar {
  height: $navbar-height-mobile; // 56px

  @include tablet-up {
    height: $navbar-height-desktop; // 64px
  }

  .nav-links {
    display: none; // Hidden on mobile

    @include desktop {
      display: flex; // Visible on desktop
      gap: $spacing-6;
    }
  }

  .hamburger-menu {
    display: block; // Visible on mobile/tablet

    @include desktop {
      display: none; // Hidden on desktop
    }
  }
}
```

---

### 2. Sidebar (Dashboard)

#### Mobile (<768px)
- **Display:** Hidden by default
- **Access:** Hamburger menu opens as overlay drawer
- **Width:** 280px
- **Backdrop:** Semi-transparent dark overlay
- **Animation:** Slide-in from left

#### Tablet (768-1023px)
- **Display:** Hidden by default (same as mobile)
- **Option:** Can be toggled to "docked" mode by user preference

#### Desktop (1024px+)
- **Display:** Always visible (persistent)
- **Width:** 240px (fixed)
- **Position:** Left side, next to main content
- **Scrolling:** Sticky (scrolls with page)

**Implementáció:**
```scss
.sidebar {
  position: fixed;
  left: -280px; // Off-screen by default
  width: 280px;
  height: 100vh;
  transition: left 0.3s ease-out;

  &.open {
    left: 0; // Slide in
  }

  @include desktop {
    position: sticky;
    left: 0;
    width: 240px;
    height: calc(100vh - 64px); // Subtract navbar height
  }
}
```

---

### 3. Cards (Jegyek, Járatok, stb.)

#### Mobile (<768px)
- **Width:** 100% (full-width)
- **Padding:** 16px
- **Layout:** Vertical stack (all info stacked)
- **Image size:** Full-width, 16:9 aspect ratio

#### Tablet (768-1023px)
- **Width:** 48% (2-column grid with gap)
- **Padding:** 20px
- **Layout:** Similar to mobile, slight horizontal adjustments

#### Desktop (1024px+)
- **Width:** 32% (3-column grid) or 24% (4-column grid)
- **Padding:** 24px
- **Layout:** Horizontal layout possible (image left, content right)

**Példa:**
```scss
.card-grid {
  display: grid;
  grid-template-columns: 1fr; // 1 column on mobile
  gap: $spacing-4;

  @include tablet-up {
    grid-template-columns: repeat(2, 1fr); // 2 columns on tablet
    gap: $spacing-6;
  }

  @include desktop {
    grid-template-columns: repeat(3, 1fr); // 3 columns on desktop
  }

  @include desktop-large {
    grid-template-columns: repeat(4, 1fr); // 4 columns on large desktop
  }
}
```

---

### 4. Forms (Input Fields, Buttons)

#### Mobile (<768px)
- **Input width:** 100% (full-width)
- **Button width:** 100% (full-width, stacked buttons)
- **Font size:** 16px (prevents iOS zoom on focus)
- **Touch targets:** Minimum 44px height

#### Tablet (768-1023px)
- **Input width:** 100% or 50% (depending on form layout)
- **Button width:** Auto (inline buttons ok)
- **Font size:** 16px

#### Desktop (1024px+)
- **Input width:** Variable (max 400px for text inputs)
- **Button width:** Auto (intrinsic width)
- **Font size:** 16px
- **Multi-column forms:** Possible (2-3 columns)

**Példa:**
```scss
.form-field {
  width: 100%;
  margin-bottom: $spacing-4;

  input {
    width: 100%;
    height: 44px; // WCAG touch target
    font-size: 16px; // Prevent iOS zoom

    @include desktop {
      max-width: 400px; // Reasonable max width
    }
  }
}

.button-group {
  display: flex;
  flex-direction: column; // Stacked on mobile
  gap: $spacing-3;

  @include tablet-up {
    flex-direction: row; // Horizontal on tablet+
  }

  button {
    width: 100%;

    @include tablet-up {
      width: auto; // Intrinsic width
    }
  }
}
```

---

### 5. Tables

#### Mobile (<768px)
- **Display:** Card-based list view (NOT table)
- **Reason:** Tables don't work well on narrow screens
- **Layout:** Each row becomes a card with key-value pairs
- **Scrolling:** Vertical scroll only

#### Tablet (768-1023px)
- **Display:** Horizontal scroll table (if simple) OR card list (if complex)
- **Overflow:** `overflow-x: auto`
- **Sticky column:** First column sticky (if applicable)

#### Desktop (1024px+)
- **Display:** Full table with all columns visible
- **Sorting:** Column headers clickable
- **Pagination:** Bottom of table

**Card-based List (Mobile) Példa:**
```scss
.data-table {
  @include mobile {
    display: block;

    thead {
      display: none; // Hide table headers
    }

    tbody {
      display: block;
    }

    tr {
      display: block;
      margin-bottom: $spacing-4;
      border: 1px solid $neutral-200;
      border-radius: $radius-md;
      padding: $spacing-4;
    }

    td {
      display: flex;
      justify-content: space-between;
      padding: $spacing-2 0;

      &:before {
        content: attr(data-label); // Inject label from data attribute
        font-weight: $font-weight-medium;
      }
    }
  }

  @include tablet-up {
    display: table; // Normal table
  }
}
```

---

### 6. Modals / Dialogs

#### Mobile (<768px)
- **Width:** 100% viewport width
- **Height:** 100% viewport height (full-screen)
- **Border-radius:** 0 (square corners)
- **Position:** Fixed, full overlay
- **Animation:** Slide up from bottom

#### Tablet (768-1023px)
- **Width:** 80% viewport width, max 600px
- **Height:** Auto (content-based), max 80vh
- **Border-radius:** 12px
- **Position:** Centered
- **Animation:** Fade in + scale up

#### Desktop (1024px+)
- **Width:** Max 600px (or specified width)
- **Height:** Auto, max 80vh
- **Border-radius:** 12px
- **Position:** Centered
- **Animation:** Fade in

**Implementáció:**
```scss
.modal {
  position: fixed;
  inset: 0; // Full-screen on mobile
  background: $white;
  border-radius: 0;
  animation: slideUp 0.3s ease-out;

  @include tablet-up {
    inset: auto; // Reset
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    border-radius: $radius-md;
    animation: fadeInScale 0.3s ease-out;
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
```

---

### 7. Typography

#### Font Size Scaling

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| **H1** | 36px | 42px | 48px |
| **H2** | 30px | 34px | 36px |
| **H3** | 24px | 28px | 30px |
| **Body** | 16px | 16px | 16px |
| **Small** | 14px | 14px | 14px |
| **Caption** | 12px | 12px | 12px |

**Implementáció:**
```scss
h1 {
  font-size: 2.25rem; // 36px mobile

  @include tablet-up {
    font-size: 2.625rem; // 42px tablet
  }

  @include desktop {
    font-size: 3rem; // 48px desktop
  }
}
```

**Line Length Optimalizáció:**
- **Mobile:** 100% width (körülbelül 50-60 karakter/sor)
- **Desktop:** Max-width: 65ch (optimális olvashatóság: 60-75 karakter/sor)

```scss
.content-text {
  width: 100%;

  @include desktop {
    max-width: 65ch; // 65 karakter szélesség
  }
}
```

---

### 8. Spacing (Padding/Margin)

#### Adaptive Spacing

| Property | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| **Section Padding** | 32px vertical | 48px vertical | 64px vertical |
| **Container Padding** | 16px horizontal | 24px horizontal | 32px horizontal |
| **Component Gap** | 16px | 24px | 32px |
| **Card Padding** | 16px | 20px | 24px |

**Implementáció:**
```scss
.section {
  padding: $spacing-8 $spacing-4; // 32px vertical, 16px horizontal (mobile)

  @include tablet-up {
    padding: $spacing-12 $spacing-6; // 48px vertical, 24px horizontal
  }

  @include desktop {
    padding: $spacing-16 $spacing-8; // 64px vertical, 32px horizontal
  }
}
```

---

## Container Width Strategy

### Container Max-Widths

```scss
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: $layout-padding-mobile;   // 16px
  padding-right: $layout-padding-mobile;

  @include mobile-landscape {
    max-width: $container-sm; // 640px
  }

  @include tablet-up {
    max-width: $container-md; // 768px
    padding-left: $layout-padding-tablet;   // 24px
    padding-right: $layout-padding-tablet;
  }

  @include desktop {
    max-width: $container-lg; // 1024px
    padding-left: $layout-padding-desktop;  // 32px
    padding-right: $layout-padding-desktop;
  }

  @include desktop-large {
    max-width: $container-xl; // 1280px
  }
}
```

### Fluid vs Fixed Width

- **Fluid:** Content scales with viewport (up to max-width)
- **Fixed:** Content has exact width at each breakpoint
- **Chosen:** Fluid with max-width (best of both worlds)

---

## Images & Media

### Responsive Images

#### Stratégia 1: Srcset (Multiple Resolutions)

```html
<img
  src="image-800w.jpg"
  srcset="
    image-400w.jpg 400w,
    image-800w.jpg 800w,
    image-1200w.jpg 1200w
  "
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt="Busz illusztráció"
>
```

#### Stratégia 2: Picture Element (Art Direction)

```html
<picture>
  <source media="(max-width: 767px)" srcset="image-mobile.jpg">
  <source media="(max-width: 1023px)" srcset="image-tablet.jpg">
  <img src="image-desktop.jpg" alt="Hero kép">
</picture>
```

### Background Images (CSS)

```scss
.hero {
  background-image: url('hero-mobile.jpg');
  background-size: cover;
  background-position: center;

  @include tablet-up {
    background-image: url('hero-tablet.jpg');
  }

  @include desktop {
    background-image: url('hero-desktop.jpg');
  }
}
```

---

## Performance Optimization

### Mobile Performance Priorities

1. **Critical CSS:** Inline above-the-fold CSS for mobile
2. **Lazy Loading:** Images below the fold load on scroll
3. **Code Splitting:** Load desktop-specific JS only on desktop
4. **Reduce Bundle Size:** Tree-shake unused code
5. **Service Worker:** Cache assets for offline access (PWA)

### Media Query Best Practices

```scss
// ✅ GOOD: Group related styles
.button {
  // Base mobile styles
  padding: 12px 16px;
  width: 100%;

  // Tablet+
  @include tablet-up {
    padding: 12px 24px;
    width: auto;
  }

  // Desktop
  @include desktop {
    padding: 14px 32px;
  }
}

// ❌ BAD: Scattered media queries
.button {
  padding: 12px 16px;
}

@media (min-width: 768px) {
  .button {
    padding: 12px 24px;
  }
}

// ... 100 lines later ...

@media (min-width: 1024px) {
  .button {
    padding: 14px 32px;
  }
}
```

---

## Testing Strategy

### Device Testing Matrix

| Device Type | Tested Devices | Browsers |
|-------------|----------------|----------|
| **Mobile (iOS)** | iPhone SE, iPhone 12/13/14, iPhone 14 Pro Max | Safari, Chrome |
| **Mobile (Android)** | Samsung Galaxy S21, Pixel 5/6 | Chrome, Firefox |
| **Tablet (iOS)** | iPad (9th gen), iPad Pro 11" | Safari |
| **Tablet (Android)** | Samsung Tab S7 | Chrome |
| **Desktop** | 1366x768, 1920x1080, 2560x1440 | Chrome, Firefox, Safari, Edge |

### Browser DevTools Testing

- **Chrome DevTools:** Device mode (mobile emulation)
- **Responsive Design Mode:** Test all breakpoints
- **Network Throttling:** Test on 3G/4G speeds
- **Lighthouse:** Performance, accessibility, SEO audits

### Automated Responsive Testing

```typescript
// Cypress test example
describe('Responsive Layout', () => {
  const viewports = ['iphone-x', 'ipad-2', [1920, 1080]];

  viewports.forEach(viewport => {
    it(`should display correctly on ${viewport}`, () => {
      if (Array.isArray(viewport)) {
        cy.viewport(viewport[0], viewport[1]);
      } else {
        cy.viewport(viewport);
      }

      cy.visit('/dashboard');
      cy.matchImageSnapshot(`dashboard-${viewport}`);
    });
  });
});
```

---

## Common Patterns & Anti-Patterns

### ✅ Good Patterns

1. **Mobile-first CSS:** Base styles for mobile, enhance for desktop
2. **Flexible Grids:** Use CSS Grid/Flexbox with fr units and auto-fit
3. **Fluid Typography:** Use clamp() for responsive font sizes
   ```scss
   h1 {
     font-size: clamp(2rem, 5vw, 3rem); // Min 32px, Max 48px
   }
   ```
4. **Touch-friendly:** 44px minimum touch targets on mobile
5. **Content Parity:** Same content available on all devices

### ❌ Anti-Patterns

1. **Desktop-first CSS:** Forces overrides on mobile (increases CSS size)
2. **Fixed pixel widths:** Breaks on different screen sizes
3. **Hiding content on mobile:** Mobile users deserve full experience
4. **Tiny touch targets:** Buttons < 44px on mobile (WCAG fail)
5. **Horizontal scroll:** Content wider than viewport (bad UX)

---

## Accessibility Considerations

### Screen Reader Navigation
- **Landmark roles:** Proper HTML5 semantic tags (`<nav>`, `<main>`, `<aside>`)
- **Skip links:** "Skip to content" link for keyboard users
- **Focus management:** Logical tab order on all screen sizes

### Zoom Support
- **Text resizing:** Support 200% zoom (WCAG 2.1 AA)
- **Layout doesn't break:** Content reflows, no horizontal scroll
- **Font size:** Relative units (rem, em) not pixels

### Keyboard Navigation
- **All interactions accessible:** No mouse-only interactions
- **Focus visible:** Clear focus indicators on all breakpoints
- **Logical tab order:** Same order on mobile/tablet/desktop

---

## Documentation & Handoff

### Developer Handoff Checklist

- [ ] Breakpoint values documented and agreed upon
- [ ] SCSS mixins created for common responsive patterns
- [ ] Component-specific responsive behaviors documented
- [ ] Wireframes show mobile, tablet, desktop layouts
- [ ] Touch target sizes specified (44px minimum)
- [ ] Font scaling documented per breakpoint
- [ ] Image assets provided in multiple resolutions
- [ ] Testing matrix defined (devices, browsers, viewports)

### Design Assets

```
/design-assets/
├── /mobile/         (375x812 - iPhone 12)
├── /tablet/         (768x1024 - iPad)
├── /desktop/        (1440x900 - Desktop)
└── /responsive/     (Fluid mockups showing all breakpoints)
```

---

## Quick Reference Table

| Feature | Mobile (<768px) | Tablet (768-1023px) | Desktop (1024px+) |
|---------|-----------------|---------------------|-------------------|
| **Navbar** | Hamburger + Logo | Hybrid navigation | Full horizontal nav |
| **Sidebar** | Drawer overlay | Drawer/Docked (optional) | Persistent (240px) |
| **Grid** | 1 column | 2 columns | 3-4 columns |
| **Container Padding** | 16px | 24px | 32px |
| **Font Size (H1)** | 36px | 42px | 48px |
| **Button Width** | 100% | Auto | Auto |
| **Modal** | Full-screen | 80% width (max 600px) | 600px centered |
| **Touch Target** | 44px min | 44px min | 32px min |
| **Table** | Card list | Scroll or card list | Full table |

---

## Future Enhancements

### Adaptive Images (Future)
- **WebP format:** Serve WebP to supported browsers, fallback to JPG/PNG
- **Lazy loading:** Native browser lazy loading (`loading="lazy"`)

### Container Queries (CSS Draft)
- **Component-level responsive:** Styles based on container width (not viewport)
- **Browser support:** Check https://caniuse.com/css-container-queries

### Dark Mode (Future)
- **Media query:** `@media (prefers-color-scheme: dark)`
- **Toggle:** User preference saved in localStorage

---

## Kapcsolódó Dokumentumok

- **Design System:** `docs/design/design-system.md` (Breakpoints section)
- **Component Library:** `docs/design/component-library.md` (Responsive behaviors)
- **Wireframes:** `docs/design/wireframes/` (Mobile/Tablet/Desktop views)

---

**Verzió:** 1.0
**Utolsó frissítés:** 2025-11-04
**Készítette:** UX Designer Agent
**Status:** Approved & Ready for Implementation
