# Component Library Specifikáció

## Áttekintés

Ez a dokumentum a Közlekedési Jegykezelő Alkalmazás komponens könyvtárát specifikálja. Minden komponens leírása tartalmazza a vizuális tulajdonságokat, állapotokat, variánsokat, és interakciós viselkedést.

**Design System Referencia:** `design-system.md`
**SCSS Változók:** `frontend/src/styles/_variables.scss`, `_colors.scss`, `_typography.scss`

---

## 1. Button Komponens

### 1.1 Alapvető Leírás

A Button komponens az alkalmazás elsődleges interaktív eleme. Angular Material `mat-button` direktívák használata ajánlott.

### 1.2 Variánsok

#### Primary Button (Elsődleges CTA)

**Vizuális tulajdonságok:**
- Háttérszín: `$primary-700` (#1976D2)
- Szövegszín: `$white` (#FFFFFF)
- Font: `$font-primary`, `$font-weight-medium`, `$font-size-base` (16px)
- Padding: `$button-padding-y` (12px) `$button-padding-x` (24px)
- Border-radius: `$radius-base` (8px)
- Magasság: `$button-height-base` (40px)
- Shadow: `$shadow-sm`
- Transition: `$transition-standard`

**Állapotok:**

| Állapot | Háttér | Szöveg | Shadow | Kurzor |
|---------|--------|--------|--------|--------|
| **Default** | `$primary-700` | `$white` | `$shadow-sm` | pointer |
| **Hover** | `$primary-800` | `$white` | `$shadow-base` | pointer |
| **Active/Pressed** | `$primary-900` | `$white` | `$shadow-none` | pointer |
| **Focus** | `$primary-700` | `$white` | `$shadow-focus` | pointer |
| **Disabled** | `$neutral-300` | `$neutral-500` | `$shadow-none` | not-allowed |

**Angular Material implementáció:**
```html
<button mat-raised-button color="primary">Primary Button</button>
```

**Használati esetek:**
- Jegyvásárlás gomb
- Regisztráció/Bejelentkezés CTA
- Mentés, Megerősítés gombok
- Űrlap submit gombok

---

#### Secondary Button (Másodlagos akció)

**Vizuális tulajdonságok:**
- Háttérszín: `transparent`
- Border: 1px solid `$primary-700`
- Szövegszín: `$primary-700`
- Font: `$font-primary`, `$font-weight-medium`, `$font-size-base`
- Padding: `$button-padding-y` (12px) `$button-padding-x` (24px)
- Border-radius: `$radius-base` (8px)
- Magasság: `$button-height-base` (40px)

**Állapotok:**

| Állapot | Háttér | Border | Szöveg | Kurzor |
|---------|--------|--------|--------|--------|
| **Default** | `transparent` | `$primary-700` | `$primary-700` | pointer |
| **Hover** | `$primary-50` | `$primary-800` | `$primary-800` | pointer |
| **Active** | `$primary-100` | `$primary-900` | `$primary-900` | pointer |
| **Focus** | `transparent` | `$primary-500` | `$primary-700` | pointer |
| **Disabled** | `transparent` | `$neutral-300` | `$neutral-500` | not-allowed |

**Angular Material implementáció:**
```html
<button mat-stroked-button color="primary">Secondary Button</button>
```

**Használati esetek:**
- Mégse gomb
- Vissza navigáció
- Alternatív akciók

---

#### Text Button (Harmadlagos akció)

**Vizuális tulajdonságok:**
- Háttérszín: `transparent`
- Border: none
- Szövegszín: `$primary-700`
- Font: `$font-primary`, `$font-weight-medium`, `$font-size-base`
- Padding: `$spacing-2` (8px) `$spacing-4` (16px)
- Border-radius: `$radius-base` (8px)

**Állapotok:**

| Állapot | Háttér | Szöveg | Kurzor |
|---------|--------|--------|--------|
| **Default** | `transparent` | `$primary-700` | pointer |
| **Hover** | `$primary-50` | `$primary-800` | pointer |
| **Active** | `$primary-100` | `$primary-900` | pointer |
| **Focus** | `transparent` | `$primary-700` | pointer |
| **Disabled** | `transparent` | `$neutral-500` | not-allowed |

**Angular Material implementáció:**
```html
<button mat-button color="primary">Text Button</button>
```

**Használati esetek:**
- Linkek gombként
- Kevésbé hangsúlyos akciók
- Inline akciók (pl. "Továbbiak...")

---

#### Icon Button

**Vizuális tulajdonságok:**
- Méret: 40px x 40px (circular)
- Border-radius: `$radius-full`
- Ikon méret: `$icon-base` (24px)
- Ikonszín: `$primary-700` vagy `$neutral-600`

**Angular Material implementáció:**
```html
<button mat-icon-button color="primary">
  <mat-icon>favorite</mat-icon>
</button>
```

**Használati esetek:**
- Kedvenc gomb
- Menü toggle (hamburger)
- Close modal button

---

### 1.3 Button Sizes

| Size | Height | Padding | Font Size | Use Case |
|------|--------|---------|-----------|----------|
| **Small** | 32px | 8px 16px | 14px | Table actions, compact UI |
| **Base** | 40px | 12px 24px | 16px | Standard buttons (default) |
| **Large** | 48px | 16px 32px | 16px | Hero CTA, mobile prominent actions |

---

### 1.4 Akadálymentességi követelmények

- Minimum touch target: 44px x 44px mobilon
- Focus ring látható keyboard navigációnál
- `aria-label` kötelező icon buttonoknél
- Disabled állapotban `aria-disabled="true"`

---

## 2. Input Field Komponens

### 2.1 Alapvető Leírás

Angular Material `mat-form-field` használata ajánlott minden input mezőhöz.

### 2.2 Text Input

**Vizuális tulajdonságok:**
- Magasság: `$input-height-base` (44px)
- Háttérszín: `$white`
- Border: 1px solid `$neutral-300`
- Border-radius: `$radius-base` (8px)
- Padding: `$input-padding-y` (12px) `$input-padding-x` (16px)
- Font: `$font-primary`, `$font-size-base` (16px)
- Placeholder szín: `$neutral-400`

**Állapotok:**

| Állapot | Border | Háttér | Szöveg | Shadow |
|---------|--------|--------|--------|--------|
| **Default** | `$neutral-300` | `$white` | `$neutral-700` | none |
| **Focus** | `$primary-500` | `$white` | `$neutral-700` | `$shadow-focus` |
| **Error** | `$error-500` | `$white` | `$neutral-700` | none |
| **Disabled** | `$neutral-300` | `$neutral-100` | `$neutral-500` | none |
| **Filled** | `$neutral-300` | `$white` | `$neutral-700` | none |

**Label:**
- Pozíció: Input mező fölött
- Font: `$font-size-sm` (14px), `$font-weight-medium`
- Szín: `$neutral-700`
- Margin-bottom: `$spacing-2` (8px)

**Helper Text:**
- Pozíció: Input mező alatt
- Font: `$font-size-xs` (12px)
- Szín: `$neutral-600`
- Margin-top: `$spacing-1` (4px)

**Error Message:**
- Pozíció: Input mező alatt (helper text helyén)
- Font: `$font-size-xs` (12px)
- Szín: `$error-500`
- Ikon: Material Icon "error_outline" (`$icon-xs`)

**Angular Material implementáció:**
```html
<mat-form-field appearance="outline">
  <mat-label>Email cím</mat-label>
  <input matInput type="email" placeholder="pelda@email.com">
  <mat-hint>Adja meg érvényes email címét</mat-hint>
  <mat-error *ngIf="emailControl.hasError('email')">
    Érvénytelen email formátum
  </mat-error>
</mat-form-field>
```

---

### 2.3 Select / Dropdown

**Vizuális tulajdonságok:**
- Megegyezik a text input stílusával
- Dropdown ikon: Material Icon "arrow_drop_down" (`$icon-sm`)
- Dropdown panel shadow: `$shadow-md`
- Option padding: `$spacing-3` (12px) `$spacing-4` (16px)
- Option hover háttér: `$primary-50`
- Selected option háttér: `$primary-100`

**Angular Material implementáció:**
```html
<mat-form-field appearance="outline">
  <mat-label>Jegytípus</mat-label>
  <mat-select>
    <mat-option value="single">Egyszeri jegy</mat-option>
    <mat-option value="day">Napijegy</mat-option>
    <mat-option value="monthly">Havi bérlet</mat-option>
  </mat-select>
</mat-form-field>
```

---

### 2.4 Checkbox

**Vizuális tulajdonságok:**
- Méret: 20px x 20px
- Border: 2px solid `$neutral-400`
- Border-radius: `$radius-sm` (4px)
- Checkmark szín: `$white`
- Checked háttér: `$primary-700`

**Állapotok:**

| Állapot | Border | Háttér | Checkmark |
|---------|--------|--------|-----------|
| **Unchecked** | `$neutral-400` | `$white` | none |
| **Checked** | `$primary-700` | `$primary-700` | `$white` |
| **Indeterminate** | `$primary-700` | `$primary-700` | dash |
| **Disabled** | `$neutral-300` | `$neutral-100` | `$neutral-400` |

**Angular Material implementáció:**
```html
<mat-checkbox>Elfogadom az Általános Szerződési Feltételeket</mat-checkbox>
```

---

### 2.5 Radio Button

**Vizuális tulajdonságok:**
- Outer circle: 20px átmérő
- Inner circle: 10px átmérő (when selected)
- Border: 2px solid `$neutral-400`
- Selected border: `$primary-700`
- Selected inner circle: `$primary-700`

**Angular Material implementáció:**
```html
<mat-radio-group>
  <mat-radio-button value="fastest">Leggyorsabb</mat-radio-button>
  <mat-radio-button value="cheapest">Legolcsóbb</mat-radio-button>
</mat-radio-group>
```

---

### 2.6 Toggle Switch

**Vizuális tulajdonságok:**
- Track width: 40px
- Track height: 20px
- Track border-radius: `$radius-full`
- Thumb size: 16px (circular)
- Off track color: `$neutral-300`
- On track color: `$accent-600`
- Thumb color: `$white`

**Angular Material implementáció:**
```html
<mat-slide-toggle>Értesítések engedélyezése</mat-slide-toggle>
```

---

## 3. Card Komponens

### 3.1 Alapvető Leírás

A Card komponens konténer UI elemek csoportosítására.

**Vizuális tulajdonságok:**
- Háttérszín: `$white`
- Border-radius: `$card-border-radius` (12px)
- Shadow: `$shadow-sm`
- Padding: `$card-padding` (24px) desktopra, `$card-padding-mobile` (16px) mobilra
- Border: none (shadow helyett)

**Variánsok:**

#### Standard Card (Static)

```scss
background: $white;
border-radius: $radius-md;
box-shadow: $shadow-sm;
padding: $spacing-6; // 24px

@include mobile {
  padding: $spacing-4; // 16px
}
```

**Használat:** Információ megjelenítés, statikus tartalom

---

#### Elevated Card (Clickable)

```scss
background: $white;
border-radius: $radius-md;
box-shadow: $shadow-sm;
padding: $spacing-6;
transition: $transition-standard;
cursor: pointer;

&:hover {
  box-shadow: $shadow-base;
  transform: translateY(-2px);
}
```

**Használat:** Klikkelthető card-ok (pl. járat kártyák, jegy kártyák)

---

#### Outlined Card

```scss
background: $white;
border: 1px solid $neutral-200;
border-radius: $radius-md;
padding: $spacing-6;
box-shadow: none;
```

**Használat:** Alternatív stílus, kevésbé hangsúlyos tartalom

---

### 3.2 Card Anatómia

Egy Card komponens tipikus felépítése:

```
┌─────────────────────────────┐
│  [Header]                   │ <- Card title + optional action
│  ────────────────────────   │
│  [Content]                  │ <- Main content area
│                             │
│  [Footer/Actions]           │ <- Buttons or metadata
└─────────────────────────────┘
```

**Card Header:**
- Font: `$font-size-lg` (20px), `$font-weight-medium`
- Color: `$neutral-900`
- Margin-bottom: `$spacing-4` (16px)

**Card Content:**
- Font: `$font-size-base` (16px)
- Color: `$neutral-700`
- Line-height: `$line-height-normal`

**Card Footer:**
- Margin-top: `$spacing-4` (16px)
- Border-top: 1px solid `$neutral-200` (optional)
- Padding-top: `$spacing-4` (16px) (if border present)

**Angular Material implementáció:**
```html
<mat-card>
  <mat-card-header>
    <mat-card-title>Járat 112</mat-card-title>
    <mat-card-subtitle>Deák tér → Kálvin tér</mat-card-subtitle>
  </mat-card-header>
  <mat-card-content>
    <p>Indulás: 14:30 • Érkezés: 14:45</p>
  </mat-card-content>
  <mat-card-actions>
    <button mat-button color="primary">Jegyvásárlás</button>
  </mat-card-actions>
</mat-card>
```

---

## 4. Navbar Komponens

### 4.1 Desktop Navbar

**Vizuális tulajdonságok:**
- Magasság: `$navbar-height-desktop` (64px)
- Háttérszín: `$primary-700`
- Szövegszín: `$white`
- Shadow: `$shadow-base`
- Position: sticky, top: 0
- Z-index: `$z-index-sticky` (1020)

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│ [Logo]  [Nav Links...]              [User Menu] [CTA] │
└────────────────────────────────────────────────────────┘
```

**Elemek:**
- **Logo**: Bal oldal, 40px magasság, margin-right: `$spacing-8` (32px)
- **Nav Links**: Horizontal lista, gap: `$spacing-6` (24px)
  - Font: `$font-size-base`, `$font-weight-medium`
  - Color: `$white`
  - Hover: underline, color: `$primary-100`
  - Active: underline, font-weight: `$font-weight-bold`
- **User Menu**: Jobb oldal, avatar + dropdown
- **CTA Button**: Jobb oldal (pl. "Bejelentkezés"), secondary button invertált színekkel

---

### 4.2 Mobile Navbar

**Vizuális tulajdonságok:**
- Magasság: `$navbar-height-mobile` (56px)
- Háttérszín: `$primary-700`
- Szövegszín: `$white`

**Layout:**
```
┌──────────────────────────────┐
│ [☰]  [Logo]         [Avatar] │
└──────────────────────────────┘
```

**Hamburger Menu:**
- Icon: Material Icon "menu" (`$icon-base`, 24px)
- Drawer width: 280px
- Drawer háttér: `$white`
- Drawer shadow: `$shadow-xl`
- Navigation links: vertical lista, padding: `$spacing-4` (16px)

**Angular Material implementáció:**
```html
<mat-toolbar color="primary">
  <button mat-icon-button (click)="drawer.toggle()">
    <mat-icon>menu</mat-icon>
  </button>
  <span>App Logo</span>
  <span class="spacer"></span>
  <button mat-icon-button>
    <mat-icon>account_circle</mat-icon>
  </button>
</mat-toolbar>

<mat-drawer-container>
  <mat-drawer #drawer mode="over">
    <!-- Navigation links -->
  </mat-drawer>
  <mat-drawer-content>
    <!-- Main content -->
  </mat-drawer-content>
</mat-drawer-container>
```

---

## 5. Footer Komponens

**Vizuális tulajdonságok:**
- Háttérszín: `$neutral-900`
- Szövegszín: `$neutral-300`
- Padding: `$spacing-12` (48px) vertical, reszponzív horizontal
- Border-top: 1px solid `$neutral-800`

**Layout (Desktop):**
```
┌────────────────────────────────────────────────┐
│  [Logo]        [Links Col 1]  [Links Col 2]   │
│  [Tagline]     [Links Col 3]  [Social Icons]  │
│                                                 │
│  ─────────────────────────────────────────────  │
│  © 2025 AppName. All rights reserved.          │
└────────────────────────────────────────────────┘
```

**Layout (Mobile):**
- Single column, stacked sections
- Center-aligned
- Margin-bottom: `$spacing-6` (24px) between sections

---

## 6. Modal / Dialog Komponens

**Vizuális tulajdonságok:**
- Max-width: `$modal-max-width` (600px)
- Háttérszín: `$white`
- Border-radius: `$modal-border-radius` (12px)
- Padding: `$modal-padding` (24px)
- Shadow: `$shadow-xl`
- Backdrop: `$overlay-dark` (rgba(0, 0, 0, 0.6))

**Anatómia:**
```
┌─────────────────────────────────┐
│  [Title]                    [X] │
│  ─────────────────────────────  │
│  [Content]                      │
│                                 │
│                                 │
│  ─────────────────────────────  │
│  [Cancel]           [Confirm]   │
└─────────────────────────────────┘
```

**Modal Header:**
- Font: `$font-size-xl` (24px), `$font-weight-bold`
- Close button: Icon button, top-right, `$icon-base`

**Modal Content:**
- Max-height: 60vh
- Overflow-y: auto
- Custom scrollbar styling

**Modal Actions:**
- Justify: flex-end
- Gap: `$spacing-4` (16px)

**Angular Material implementáció:**
```typescript
// Component
const dialogRef = this.dialog.open(MyDialogComponent, {
  width: '600px',
  maxHeight: '80vh',
  panelClass: 'custom-dialog'
});
```

```html
<!-- Dialog template -->
<h2 mat-dialog-title>Dialog címe</h2>
<mat-dialog-content>
  <p>Dialog tartalma...</p>
</mat-dialog-content>
<mat-dialog-actions align="end">
  <button mat-button mat-dialog-close>Mégse</button>
  <button mat-raised-button color="primary" [mat-dialog-close]="true">Megerősítés</button>
</mat-dialog-actions>
```

---

## 7. Loading Spinner / Progress Indicator

### 7.1 Circular Spinner

**Vizuális tulajdonságok:**
- Méret: 40px átmérő (default)
- Stroke width: 4px
- Szín: `$primary-700`
- Animation: 1s linear infinite rotation

**Angular Material implementáció:**
```html
<mat-spinner diameter="40"></mat-spinner>
```

**Variánsok:**
- **Small**: 24px átmérő
- **Base**: 40px átmérő
- **Large**: 64px átmérő

---

### 7.2 Linear Progress Bar

**Vizuális tulajdonságok:**
- Magasság: 4px
- Background: `$neutral-200`
- Progress color: `$primary-700`
- Border-radius: `$radius-sm` (4px)

**Angular Material implementáció:**
```html
<mat-progress-bar mode="indeterminate"></mat-progress-bar>
<!-- vagy -->
<mat-progress-bar mode="determinate" [value]="progressValue"></mat-progress-bar>
```

---

### 7.3 Skeleton Loader

**Vizuális tulajdonságok:**
- Háttér: `$neutral-200`
- Border-radius: megegyezik a betöltendő elemmel
- Animation: pulse vagy shimmer effect

**Használat:**
- Text skeleton: 100% width x 16px height, `$radius-sm`
- Card skeleton: teljes card méret, `$radius-md`
- Avatar skeleton: circular, 40px átmérő

---

## 8. Badge / Chip Komponens

**Vizuális tulajdonságok:**
- Padding: `$spacing-1` (4px) `$spacing-3` (12px)
- Border-radius: `$radius-full`
- Font: `$font-size-xs` (12px), `$font-weight-medium`
- Height: 24px

**Variánsok:**

| Variáns | Háttér | Szöveg | Border | Használat |
|---------|--------|--------|--------|-----------|
| **Primary** | `$primary-100` | `$primary-700` | none | Kiemelés, info |
| **Success** | `$success-50` | `$success-700` | none | Aktív jegy, sikeres |
| **Error** | `$error-50` | `$error-700` | none | Lejárt jegy, hiba |
| **Warning** | `$warning-50` | `$warning-700` | none | Figyelmeztetés |
| **Neutral** | `$neutral-200` | `$neutral-700` | none | Alapértelmezett |

**Angular Material implementáció:**
```html
<mat-chip-listbox>
  <mat-chip-option>Aktív</mat-chip-option>
  <mat-chip-option>Lejárt</mat-chip-option>
</mat-chip-listbox>
```

---

## 9. Alert / Notification Komponens

### 9.1 Inline Alert

**Vizuális tulajdonságok:**
- Padding: `$spacing-4` (16px)
- Border-radius: `$radius-base` (8px)
- Border-left: 4px solid (semantic color)
- Icon: Material Icon (`$icon-base`, 24px)
- Close button: Icon button, top-right

**Variánsok:**

| Típus | Háttér | Border-left | Icon | Icon Color |
|-------|--------|-------------|------|------------|
| **Success** | `$success-50` | `$success-500` | check_circle | `$success-700` |
| **Error** | `$error-50` | `$error-500` | error | `$error-700` |
| **Warning** | `$warning-50` | `$warning-500` | warning | `$warning-700` |
| **Info** | `$info-50` | `$info-500` | info | `$info-700` |

---

### 9.2 Toast Notification

**Vizuális tulajdonságok:**
- Max-width: 400px
- Háttér: `$neutral-900`
- Szövegszín: `$white`
- Border-radius: `$radius-base` (8px)
- Padding: `$spacing-4` (16px)
- Shadow: `$shadow-xl`
- Position: bottom-right (desktop), bottom-center (mobile)
- Z-index: `$z-index-toast` (1080)
- Animation: slide-up + fade-in
- Auto-dismiss: 5 seconds (configurable)

**Angular Material implementáció:**
```typescript
this.snackBar.open('Jegy sikeresen vásárolva!', 'Bezárás', {
  duration: 5000,
  horizontalPosition: 'right',
  verticalPosition: 'bottom',
  panelClass: ['success-toast']
});
```

---

## 10. Tooltip Komponens

**Vizuális tulajdonságok:**
- Háttér: `$neutral-900`
- Szövegszín: `$white`
- Font: `$font-size-xs` (12px)
- Padding: `$spacing-2` (8px) `$spacing-3` (12px)
- Border-radius: `$radius-sm` (4px)
- Max-width: 200px
- Shadow: `$shadow-md`
- Arrow: 6px háromszög, `$neutral-900` színnel
- Z-index: `$z-index-tooltip` (1070)

**Trigger:**
- Hover: 300ms delay
- Focus: immediate

**Angular Material implementáció:**
```html
<button mat-icon-button matTooltip="Kedvencekhez adás">
  <mat-icon>favorite_border</mat-icon>
</button>
```

---

## 11. Table Komponens

**Vizuális tulajdonságok:**
- Háttér: `$white`
- Border: 1px solid `$neutral-200`
- Border-radius: `$radius-md` (12px)

**Header:**
- Háttér: `$neutral-100`
- Font: `$font-size-sm` (14px), `$font-weight-medium`
- Szín: `$neutral-900`
- Padding: `$spacing-3` (12px) `$spacing-4` (16px)

**Row:**
- Padding: `$spacing-3` (12px) `$spacing-4` (16px)
- Border-bottom: 1px solid `$neutral-200`
- Hover háttér: `$neutral-50`

**Angular Material implementáció:**
```html
<table mat-table [dataSource]="dataSource">
  <ng-container matColumnDef="name">
    <th mat-header-cell *matHeaderCellDef>Név</th>
    <td mat-cell *matCellDef="let element">{{element.name}}</td>
  </ng-container>
  <!-- More columns -->
  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
</table>
```

---

## 12. Tab Komponens

**Vizuális tulajdonságok:**
- Tab height: 48px
- Font: `$font-size-base` (16px), `$font-weight-medium`
- Inactive szín: `$neutral-600`
- Active szín: `$primary-700`
- Active indicator: 2px solid `$primary-700`, bottom border
- Hover háttér: `$primary-50`

**Angular Material implementáció:**
```html
<mat-tab-group>
  <mat-tab label="Aktív jegyek">Content 1</mat-tab>
  <mat-tab label="Lejárt jegyek">Content 2</mat-tab>
  <mat-tab label="Összes">Content 3</mat-tab>
</mat-tab-group>
```

---

## 13. Breadcrumb Komponens

**Vizuális tulajdonságok:**
- Font: `$font-size-sm` (14px)
- Color: `$neutral-600`
- Active/current: `$neutral-900`, `$font-weight-medium`
- Separator: "/" vagy Material Icon "chevron_right" (`$icon-xs`)
- Gap: `$spacing-2` (8px)

**Példa:**
```
Kezdőlap / Utazástervező / Útvonal részletek
```

---

## 14. Pagination Komponens

**Vizuális tulajdonságok:**
- Button height: 40px
- Button width: 40px (numbers), auto (prev/next)
- Border: 1px solid `$neutral-300`
- Border-radius: `$radius-base` (8px)
- Gap: `$spacing-2` (8px)
- Active háttér: `$primary-700`
- Active szöveg: `$white`
- Hover háttér: `$primary-50`

**Angular Material implementáció:**
```html
<mat-paginator [length]="100"
               [pageSize]="10"
               [pageSizeOptions]="[5, 10, 25, 100]">
</mat-paginator>
```

---

## 15. Accordion / Expansion Panel

**Vizuális tulajdonságok:**
- Háttér: `$white`
- Border: 1px solid `$neutral-200`
- Border-radius: `$radius-md` (12px)
- Header padding: `$spacing-4` (16px)
- Content padding: `$spacing-4` (16px)
- Expand icon: Material Icon "expand_more" (`$icon-base`)
- Transition: `$transition-medium` (300ms)

**Angular Material implementáció:**
```html
<mat-accordion>
  <mat-expansion-panel>
    <mat-expansion-panel-header>
      <mat-panel-title>Általános információk</mat-panel-title>
    </mat-expansion-panel-header>
    <p>Expansion panel content...</p>
  </mat-expansion-panel>
</mat-accordion>
```

---

## 16. Avatar Komponens

**Vizuális tulajdonságok:**
- Méret: 40px átmérő (default)
- Border-radius: `$radius-full` (circular)
- Border: 2px solid `$white` (if on colored background)
- Fallback háttér: `$primary-700`
- Fallback text: user initials, `$white`, `$font-weight-medium`

**Méretek:**

| Size | Átmérő | Font Size | Use Case |
|------|--------|-----------|----------|
| **xs** | 24px | 10px | Inline mention |
| **sm** | 32px | 12px | List item |
| **base** | 40px | 16px | Navbar, profile |
| **lg** | 64px | 24px | Profile page |
| **xl** | 96px | 32px | Profile header |

---

## 17. Empty State Komponens

**Vizuális tulajdonságok:**
- Icon: Material Icon, `$icon-xl` (48px), `$neutral-400`
- Heading: `$font-size-xl` (24px), `$font-weight-medium`, `$neutral-700`
- Description: `$font-size-base` (16px), `$neutral-600`
- CTA button: Primary button
- Vertical spacing: `$spacing-6` (24px) between elemek
- Text-align: center

**Példa (üres jegytár):**
```
[Icon: confirmation_number]

Még nincs jegyed

Vásárolj jegyet az utazástervezőben,
és itt jelennek meg az aktív jegyeid.

[Jegyvásárlás gomb]
```

---

## 18. Search / Autocomplete Komponens

**Vizuális tulajdonságok:**
- Input: standard input field stílus
- Icon: Material Icon "search" (`$icon-base`), left side
- Dropdown panel: `$shadow-md`, `$radius-base`, max-height: 300px
- Option padding: `$spacing-3` (12px) `$spacing-4` (16px)
- Option hover: `$primary-50`
- Highlight match: `$font-weight-medium`, `$primary-700`

**Angular Material implementáció:**
```html
<mat-form-field appearance="outline">
  <mat-icon matPrefix>search</mat-icon>
  <input matInput [matAutocomplete]="auto" placeholder="Keresés...">
  <mat-autocomplete #auto="matAutocomplete">
    <mat-option *ngFor="let option of filteredOptions" [value]="option">
      {{option}}
    </mat-option>
  </mat-autocomplete>
</mat-form-field>
```

---

## 19. Stepper Komponens (Multi-step Form)

**Vizuális tulajdonságok:**
- Step indicator: circular, 32px átmérő
- Inactive: border 2px solid `$neutral-300`, `$neutral-600` szám
- Active: `$primary-700` háttér, `$white` szám
- Completed: `$accent-600` háttér, checkmark icon `$white`
- Connector line: 1px solid `$neutral-300`, horizontal
- Step label: `$font-size-sm` (14px), `$neutral-700`

**Angular Material implementáció:**
```html
<mat-stepper>
  <mat-step label="Útvonal választás">
    <p>Step 1 content</p>
    <button mat-button matStepperNext>Következő</button>
  </mat-step>
  <mat-step label="Jegy típus">
    <p>Step 2 content</p>
    <button mat-button matStepperPrevious>Vissza</button>
    <button mat-button matStepperNext>Következő</button>
  </mat-step>
  <mat-step label="Fizetés">
    <p>Step 3 content</p>
    <button mat-button matStepperPrevious>Vissza</button>
    <button mat-raised-button color="primary">Fizetés</button>
  </mat-step>
</mat-stepper>
```

---

## 20. Rating Komponens (Csillagos értékelés)

**Vizuális tulajdonságok:**
- Star icon: Material Icon "star" (`$icon-base`, 24px)
- Filled star: `$warning-500` (sárga/narancs)
- Empty star: `$neutral-300`
- Hover: `$warning-700`
- Interactive: cursor pointer
- Readonly: cursor default

**Implementáció:** Custom Angular komponens vagy third-party library

**Használat:**
- Járat értékelése
- Értékelések megjelenítése (readonly)

---

## Komponens Implementációs Prioritás (Sprint 1)

Az alábbi komponensek implementálása prioritás szerint:

1. **Button** (Primary, Secondary, Text) - ✅ Kritikus
2. **Input Field** (Text, Select) - ✅ Kritikus
3. **Card** - ✅ Kritikus
4. **Navbar** (Desktop + Mobile) - ✅ Kritikus
5. **Footer** - ✅ Kritikus
6. **Loading Spinner** - ✅ Kritikus
7. **Modal** - Magas prioritás
8. **Alert/Toast** - Magas prioritás
9. **Badge** - Közepes prioritás
10. **Tab** - Közepes prioritás

A többi komponens későbbi sprintekben kerül implementálásra.

---

## Következő Lépések

1. **Angular Material Setup ellenőrzése**: Biztosítsd hogy minden Material modul importálva van
2. **Custom theme definiálása**: `styles.scss` fájlban testreszabás (már megtörtént)
3. **Közös komponens library létrehozása**: `frontend/src/app/shared/components/`
4. **Storybook setup (opcionális)**: Komponensek izolált fejlesztéséhez és dokumentálásához

---

**Verzió:** 1.0
**Utolsó frissítés:** 2025-11-04
**Készítette:** UX Designer Agent
