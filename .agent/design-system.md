# TransitHub Design System

> **Cél:** Ez a dokumentum tartalmazza a TransitHub alkalmazás teljes vizuális stílusrendszerét. 
> Az Antigravity agent használja ezt a dokumentumot az összes HTML és SCSS oldal újraépítéséhez.

---

## 1. Színpaletta (Color Tokens)

### Elsődleges színek
| Token | Érték | Használat |
|-------|-------|-----------|
| `--primary` | `#00a887` | Fő akcióelemek, gombok, linkek, kiemelt ikonok |
| `--primary-dark` / `--primary-hover` | `#008f73` | Hover állapotok |
| `--primary-10` | `rgba(0, 168, 135, 0.1)` | Finom háttér kiemelések, badge-ek |
| `--primary-20` | `rgba(0, 168, 135, 0.2)` | Selection, focus ring |

### Light Mode háttérszínek
| Token | Érték | Használat |
|-------|-------|-----------|
| `--background-light` | `#f5f8f8` vagy `#F8F9FA` | Oldal háttér |
| `--surface-light` / `--surface-white` | `#FFFFFF` | Kártyák, panelek |
| `--border-light` | `#e5e7eb` | Szegélyek, elválasztók |
| `--border-secondary` | `#f0f5f4` | Finomabb szegélyek |

### Dark Mode háttérszínek
| Token | Érték | Használat |
|-------|-------|-----------|
| `--background-dark` | `#0f231f` | Oldal háttér (sötét) |
| `--surface-dark` | `#18302b` vagy `#162e2a` | Kártyák háttere |
| `--surface-dark-hover` | `#1e3a34` | Hover állapot kártyáknál |
| `--border-dark` | `#273a36` | Szegélyek (sötét) |
| `--input-bg` | `#0f231f` | Input mezők háttere |

### Szövegszínek
| Token | Érték | Használat |
|-------|-------|-----------|
| `--text-main` | `#101817` | Elsődleges szöveg (light mode) |
| `--text-secondary` | `#4B5563` vagy `#9abcb5` (dark) | Másodlagos szöveg |
| `--text-muted` | `gray-400` / `gray-500` | Halvány szöveg, placeholder |

### Státusz színek
| Token | Érték | Használat |
|-------|-------|-----------|
| `--success` | `#10b981` (green-500) | Sikeres műveletek, aktív |
| `--success-bg` | `green-50` / `green-900/20` (dark) | Sikeres állapot háttér |
| `--warning` | `#F7C04A` | Figyelmeztetések, "Best Value" badge |
| `--danger` | `red-500` | Hibák, urgent állapotok |

---

## 2. Tipográfia

### Betűtípusok
```scss
// Elsődleges (display/header)
$font-display: 'Lexend', sans-serif;

// Alternatív display
$font-display-alt: 'Manrope', sans-serif;

// Body szöveg
$font-body: 'Noto Sans', sans-serif;
```

### Import
```html
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300..900&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300..800&display=swap" rel="stylesheet">
```

### Szövegméretek és súlyok
| Elem | Méret | Súly | Példa |
|------|-------|------|-------|
| **Hero címsor** | `text-4xl` / `text-5xl` / `text-6xl` | `font-black` (900) | Főoldal hero |
| **Oldal címsor** | `text-3xl` | `font-bold` (700) | Oldal címek |
| **Szekció címsor** | `text-xl` / `text-2xl` | `font-bold` | Kártya fejlécek |
| **Widget cím** | `text-lg` | `font-bold` | Dashboard widget-ek |
| **Body szöveg** | `text-base` (16px) | `font-normal` (400) | Bekezdések |
| **Small text** | `text-sm` (14px) | `font-medium` (500) | Leírások |
| **Tiny/Label** | `text-xs` (12px) | `font-bold` + `uppercase` | Címkék, badge-ek |

### Speciális szövegstílusok
```scss
// Gradient szöveg (hero-hoz)
.gradient-text {
  background: linear-gradient(to right, #00a887, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

// Tracking beállítások
.tracking-tight { letter-spacing: -0.025em; }   // Címsorokhoz
.tracking-wide { letter-spacing: 0.1em; }       // UPPERCASE labelekhez
```

---

## 3. Border Radius értékek

| Token | Érték | Használat |
|-------|-------|-----------|
| `rounded` | `0.25rem` (4px) | Kis elemek |
| `rounded-lg` | `0.5rem` (8px) | Gombok, input mezők |
| `rounded-xl` | `0.75rem` - `1rem` | Kártyák, panelek |
| `rounded-2xl` | `1rem` (16px) | Nagy kártyák |
| `rounded-3xl` | `1.5rem` (24px) | Dashboard widget-ek |
| `rounded-full` | `9999px` | Avatarok, badge-ek, gombok |

---

## 4. Árnyékok (Shadows)

```scss
// Soft shadow - kártyákhoz
$shadow-soft: 0 4px 20px -2px rgba(0, 0, 0, 0.05);

// Hover shadow - primary tint
$shadow-hover: 0 10px 25px -5px rgba(0, 168, 135, 0.15);

// Primary glow - CTA gombokhoz
$shadow-primary: 0 10px 25px -5px rgba(0, 168, 135, 0.3);

// Dark mode intense shadow
$shadow-dark: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
```

---

## 5. Ikonok

### Material Symbols Outlined
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
```

### Használat
```html
<span class="material-symbols-outlined">icon_name</span>
```

### Gyakori ikonok
| Funkció | Ikon neve |
|---------|-----------|
| Navigáció | `arrow_back`, `arrow_forward`, `menu` |
| Közlekedés | `directions_bus`, `directions_transit`, `tram`, `subway`, `train` |
| Helyek | `location_on`, `my_location`, `map`, `route` |
| Jegyek | `confirmation_number`, `qr_code_2`, `local_activity` |
| Felhasználó | `person`, `notifications`, `settings`, `logout` |
| Műveletek | `add`, `edit`, `delete`, `search`, `schedule` |
| Státusz | `check_circle`, `error`, `warning`, `info` |

---

## 6. Gombok (Buttons)

### Primary Button
```scss
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 3rem; // h-12
  padding: 0 2rem;
  background-color: #00a887;
  color: white;
  font-weight: 700;
  border-radius: 0.75rem; // rounded-xl
  box-shadow: 0 10px 25px -5px rgba(0, 168, 135, 0.2);
  transition: all 0.2s;
  
  &:hover {
    background-color: #008f73;
    transform: translateY(-2px);
    box-shadow: 0 15px 30px -5px rgba(0, 168, 135, 0.3);
  }
}
```

### Secondary/Outline Button
```scss
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3rem;
  padding: 0 2rem;
  background-color: transparent;
  border: 2px solid #e5e7eb;
  color: #101817;
  font-weight: 700;
  border-radius: 0.75rem;
  transition: all 0.2s;
  
  &:hover {
    border-color: #101817;
  }
}
```

### Pill/Rounded Button
```scss
.btn-pill {
  border-radius: 9999px; // rounded-full
  height: 2.5rem; // h-10
  padding: 0 1.5rem;
}
```

### Ghost Button (Dark mode)
```scss
.btn-ghost {
  background-color: #18302b;
  border: 1px solid #273a36;
  color: white;
  
  &:hover {
    border-color: rgba(0, 168, 135, 0.5);
    background-color: #1e3a34;
  }
}
```

---

## 7. Kártyák (Cards)

### Alap kártya (Light)
```scss
.card {
  background-color: white;
  border-radius: 1rem; // rounded-2xl
  border: 1px solid #f0f5f4;
  padding: 1.5rem;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  
  &:hover {
    border-color: rgba(0, 168, 135, 0.2);
    box-shadow: 0 10px 25px -5px rgba(0, 168, 135, 0.15);
  }
}
```

### Dashboard Widget (Dark)
```scss
.widget {
  background-color: #18302b;
  border-radius: 1.5rem; // rounded-3xl
  border: 1px solid #273a36;
  padding: 1.5rem 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
  
  &:hover {
    border-color: rgba(39, 58, 54, 0.8);
  }
}
```

### Widget Header Pattern
```html
<div class="flex justify-between items-start">
  <div class="flex items-center gap-4">
    <div class="widget-icon">
      <span class="material-symbols-outlined">icon_name</span>
    </div>
    <div>
      <h3 class="widget-title">Cím</h3>
      <p class="widget-subtitle">Alcím</p>
    </div>
  </div>
  <button class="action-btn">Action</button>
</div>
```

---

## 8. Input mezők (Form Elements)

### Text Input
```scss
.input {
  width: 100%;
  height: 3rem; // h-12
  padding: 0 1rem;
  padding-left: 2.75rem; // ha van ikon
  background-color: #f8f9fa; // light
  // background-color: #0f231f; // dark
  border: 1px solid #e5e7eb; // light
  // border: 1px solid #273a36; // dark
  border-radius: 0.75rem; // rounded-xl
  color: #101817;
  font-weight: 500;
  transition: all 0.2s;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    border-color: #00a887;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 168, 135, 0.1);
  }
}
```

### Input with Icon pattern
```html
<div class="relative">
  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
    icon_name
  </span>
  <input type="text" class="input pl-10" placeholder="Placeholder...">
</div>
```

### Label
```scss
.label {
  display: block;
  font-size: 0.75rem; // text-xs
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280; // gray-500
  margin-bottom: 0.5rem;
}
```

---

## 9. Badge-ek és Chip-ek

### Status Badge
```scss
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.625rem; // text-[10px]
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &--primary {
    background-color: rgba(0, 168, 135, 0.1);
    color: #00a887;
    border: 1px solid rgba(0, 168, 135, 0.3);
  }
  
  &--success {
    background-color: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }
  
  &--warning {
    background-color: #F7C04A;
    color: black;
  }
}
```

### Action Chip (Dashboard)
```scss
.chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.5rem;
  padding: 0 1.25rem 0 0.75rem;
  background-color: #18302b;
  border: 1px solid #273a36;
  border-radius: 0.75rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s;
  
  .icon {
    color: #00a887;
  }
  
  &:hover {
    border-color: rgba(0, 168, 135, 0.5);
    background-color: #1e3a34;
    
    .icon {
      transform: scale(1.1);
    }
  }
}
```

---

## 10. Header / Navigáció

### Top Navigation (Light)
```scss
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  border-bottom: 1px solid #e5e7eb;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  padding: 0 1.5rem;
  height: 4rem;
  
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### Navigation Link
```scss
.nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  transition: color 0.2s;
  
  &:hover, &.active {
    color: #00a887;
  }
}
```

### Logo Pattern
```html
<div class="flex items-center gap-2">
  <div class="logo-icon">
    <span class="material-symbols-outlined text-primary">directions_bus</span>
  </div>
  <span class="text-xl font-bold tracking-tight">TransitHub</span>
</div>
```

---

## 11. Ticket/Pass Komponens

### Digital Ticket Card
```scss
.ticket-card {
  position: relative;
  background-color: white;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid #f0f5f4;
  
  // Felső rész (primary háttér)
  .ticket-header {
    background-color: #00a887;
    padding: 1.5rem;
    color: white;
    position: relative;
    
    // Pattern háttér
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(white 2px, transparent 2px);
      background-size: 20px 20px;
      opacity: 0.1;
    }
  }
  
  // Perforáció effekt
  .ticket-perforation {
    position: relative;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &::before, &::after {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 1.5rem;
      height: 2rem;
      background-color: var(--background);
    }
    
    &::before {
      left: 0;
      border-radius: 0 9999px 9999px 0;
    }
    
    &::after {
      right: 0;
      border-radius: 9999px 0 0 9999px;
    }
    
    // Szaggatott vonal
    .dashed-line {
      width: 80%;
      border-bottom: 2px dashed #e5e7eb;
    }
  }
  
  // Alsó rész (QR kód)
  .ticket-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
}
```

---

## 12. Animációk és Átmenetek

### Alap transitions
```scss
// Minden interaktív elemre
$transition-base: all 0.2s ease;
$transition-smooth: all 0.3s ease;
$transition-slow: all 0.5s ease;

// Szín átmenetek
$transition-colors: color 0.2s, background-color 0.2s, border-color 0.2s;
```

### Hover effektek
```scss
// Lift effect
.hover-lift {
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  }
}

// Scale effect (ikonokhoz)
.hover-scale {
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.1);
  }
}
```

### Pulse animáció (státusz jelzőhöz)
```scss
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

---

## 13. Responsive Breakpoints

```scss
// Tailwind default breakpoints
$breakpoint-sm: 640px;   // Mobile landscape
$breakpoint-md: 768px;   // Tablet
$breakpoint-lg: 1024px;  // Small laptop
$breakpoint-xl: 1280px;  // Desktop
$breakpoint-2xl: 1536px; // Large desktop

// Max content width
$max-w-content: 1280px;  // max-w-7xl
$max-w-narrow: 768px;    // max-w-3xl (forms)
```

---

## 14. Dark Mode Implementáció

### Váltás
```scss
// HTML class alapú
.dark {
  // Dark mode stílusok
}

// CSS változókkal
:root {
  --bg: #f5f8f8;
  --surface: #ffffff;
  --text: #101817;
}

.dark {
  --bg: #0f231f;
  --surface: #18302b;
  --text: #ffffff;
}
```

### Tailwind dark: prefix használata
```html
<div class="bg-white dark:bg-surface-dark text-gray-900 dark:text-white">
  Content
</div>
```

---

## 15. Scrollbar Stílus

```scss
// Webkit böngészők
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: #dae7e4; // light
  // background-color: #273a36; // dark
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #00a887;
}

// Scrollbar elrejtése (carousel-hez)
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
}
```

---

## 16. SCSS Változók Összefoglaló

```scss
// _variables.scss

// Colors
$primary: #00a887;
$primary-dark: #008f73;
$primary-10: rgba(0, 168, 135, 0.1);
$primary-20: rgba(0, 168, 135, 0.2);

// Light mode
$bg-light: #f5f8f8;
$surface-light: #ffffff;
$border-light: #e5e7eb;
$text-main: #101817;
$text-secondary-light: #4B5563;

// Dark mode
$bg-dark: #0f231f;
$surface-dark: #18302b;
$surface-dark-hover: #1e3a34;
$border-dark: #273a36;
$text-secondary-dark: #9abcb5;

// Typography
$font-display: 'Lexend', sans-serif;
$font-body: 'Noto Sans', sans-serif;

// Border radius
$radius-sm: 0.25rem;
$radius-md: 0.5rem;
$radius-lg: 0.75rem;
$radius-xl: 1rem;
$radius-2xl: 1.5rem;
$radius-full: 9999px;

// Shadows
$shadow-soft: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
$shadow-hover: 0 10px 25px -5px rgba(0, 168, 135, 0.15);
$shadow-primary: 0 10px 25px -5px rgba(0, 168, 135, 0.3);

// Transitions
$transition-fast: 0.15s ease;
$transition-base: 0.2s ease;
$transition-smooth: 0.3s ease;
```
