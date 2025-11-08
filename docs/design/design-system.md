# Design System - BUSZ App

## Color Palette

### Primary Colors
- **Primary**: `#1976D2` - Material Blue (CTA, headers)
- **Primary Dark**: `#1565C0` - Hover/Active state
- **Primary Light**: `#E3F2FD` - Background/disabled

### Status Colors
- **Success**: `#4CAF50` - Green (aktív, helyes)
- **Warning**: `#FF9800` - Orange (figyelmeztetés)
- **Error**: `#F44336` - Red (hiba, törlés)
- **Info**: `#2196F3` - Light Blue (információ)

### Transport Type Colors
- **BUS**: `#FF5722` - Deep Orange / Red
- **TRAM**: `#FFC107` - Amber / Yellow
- **METRO**: `#3F51B5` - Indigo / Blue

### Neutral Colors
- **Text Dark**: `#212121` - Fekete szöveg
- **Text Light**: `#757575` - Szürke szöveg
- **Background**: `#FFFFFF` - Fehér háttér
- **Border**: `#BDBDBD` - Szürke keret
- **Disabled**: `#EEEEEE` - Világosszürke

## Typography

### Font Family
- **Primary**: `Roboto, sans-serif` (Material Design default)
- **Code**: `Roboto Mono` (debug, IDs)

### Scaling (px)

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| **H1** | 32px | 500 (Medium) | 40px |
| **H2** | 28px | 500 (Medium) | 36px |
| **H3** | 24px | 500 (Medium) | 32px |
| **Body** | 16px | 400 (Regular) | 24px |
| **Caption** | 12px | 400 (Regular) | 16px |
| **Button** | 14px | 500 (Medium) | 20px |

## Spacing System

**Base Unit**: 8px

| Token | Value | Usage |
|-------|-------|-------|
| **xs** | 4px | Inline padding, tight spacing |
| **sm** | 8px | Default padding (input, button) |
| **md** | 16px | Card padding, section margin |
| **lg** | 24px | Section padding |
| **xl** | 32px | Page margin |
| **2xl** | 48px | Large section gap |

## Component Buttons

### Primary Button
- Background: #1976D2
- Text: White
- Padding: 8px 16px
- Border-radius: 4px
- Hover: #1565C0

### Secondary Button
- Background: Transparent
- Border: 1px #1976D2
- Text: #1976D2
- Hover: #E3F2FD background

### Danger Button
- Background: #F44336
- Text: White
- Padding: 8px 16px

## Form Elements

### Input
- Height: 40px
- Padding: 8px 12px
- Border: 1px solid #BDBDBD
- Border-radius: 4px
- Font: Body (16px)
- Focus: Border #1976D2

### Select / Dropdown
- Height: 40px
- Padding: 8px 12px
- Border: 1px solid #BDBDBD

## Icons

### Sizes
- **Small**: 16px (inline)
- **Medium**: 24px (default)
- **Large**: 32px (featured)

### Icon Meanings
| Icon | Meaning |
|------|---------|
| edit | Szerkesztés |
| delete | Törlés |
| search | Keresés |
| add | Hozzáadás |
| close | Bezárás |
| map | Térkép |

## Cards & Containers

### Card
- Padding: 16px
- Background: #FFFFFF
- Shadow: 0 2px 4px rgba(0,0,0,0.1)
- Border-radius: 4px

## Accessibility

### Color Contrast
- Text on white: #212121 (21:1 ratio - WCAG AAA)
- Text on primary: White (7:1 ratio)
- Icons: Minimum 3:1

### Focus States
- Outline: 2px solid #1976D2
- Outline-offset: 2px

### Mobile Touch Targets
- Minimum: 44x44px
- Recommended: 48x48px

## Motion & Animation

### Transitions
- Fast: 150ms (hover, focus)
- Normal: 300ms (modals, navigation)
- Slow: 500ms (page transitions)

## Responsive Breakpoints

```
Mobile:       < 768px
Tablet:       768px - 1024px
Desktop:      > 1024px
Max width:    1200px
```

---

**Last Updated**: 2025-11-08
**Version**: 1.0 - Initial System
