---
description: TransitHub teljes redesign workflow - SCSS és HTML átépítése a képernyőtervek alapján
---

# TransitHub Redesign Workflow

Ez a workflow leírja, hogyan kell az Antigravity agentnek átépíteni az összes HTML és SCSS fájlt a megadott képernyőtervek alapján.

## Előkészületek

// turbo-all

1. Olvasd el a design dokumentációkat:
   - `.agent/design-system.md` - Színek, tipográfia, változók
   - `.agent/component-styles.md` - Komponens minták
   - `.agent/page-reference.md` - Oldal ↔ Képernyőterv mapping

2. Ellenőrizd a képernyőterveket:
   - `frontend/src/assets/stitch_public_landing_page/` mappa
   - Minden almappában van `code.html` és `screen.png`

## Redesign Lépések

### 1. Globális Stílusok Frissítése

1. Frissítsd a `styles.scss` fájlt:
   - Add hozzá a design-system változókat
   - Frissítsd a betűtípus importokat (Lexend, Noto Sans)
   - Add hozzá a Material Symbols Outlined-ot
   - Állítsd be a globális színeket CSS változókként

2. Hozz létre egy `_variables.scss` fájlt ha még nincs:
   ```scss
   // Colors
   $primary: #00a887;
   $primary-dark: #008f73;
   // ... (lásd design-system.md)
   ```

### 2. Shared Komponensek Átépítése

Kezdd a shared komponensekkel, mert ezeket több oldal is használja:

1. **Header** (`shared/components/header/`)
   - Nézd meg: `transitapp_logic-driven_landing_v2` header része
   - Sticky, backdrop-blur, horizontal nav

2. **Footer** (`shared/components/footer/`)
   - Nézd meg: `transitapp_logic-driven_landing_v2` footer része
   - 4 oszlopos grid layout

3. **Sidebar** (ha van, `shared/components/sidebar/`)
   - Nézd meg: `user_portal_-_light_dashboard_v1` bal oldal

### 3. Oldalak Átépítése - Prioritási Sorrend

#### A. Autentikáció (features/auth/)

1. **Login oldal**
   - Képernyőterv: `transit_app_login_v2`
   - Split layout implementálása
   - Form stílusok a component-styles.md alapján

2. **Register oldal**
   - Képernyőterv: `transit_registration_v2`
   - Hasonló split layout mint login
   - Password strength indicator

3. **Email Verification**
   - Képernyőterv: `transit_email_verification_v1`
   - Centered card layout

#### B. Landing Page (features/landing/)

1. **Landing oldal**
   - Képernyőterv: `transitapp_logic-driven_landing_v2`
   - Szekciók: Hero, Features, Testimonials, CTA, Footer
   - Magyar szövegek

#### C. Dashboard (features/dashboard/)

1. **Dashboard**
   - Light: `user_portal_-_light_dashboard_v1`
   - Dark: `user_portal_-_dark_dashboard_v2`
   - Widget-ek implementálása

#### D. Útvonaltervező (features/planner/)

1. **Planner**
   - Képernyőterv: `planner_-_floating_search_v1`
   - Floating search bar

2. **Results**
   - Képernyőterv: `journey_planner_results`
   - Route result cards

#### E. Jegyek (features/tickets/)

1. **Purchase**
   - Képernyőterv: `transitgo_checkout_-_standard_v1`
   
2. **Success**
   - Képernyőterv: `transitgo_checkout_-_success_v3`
   
3. **Wallet**
   - Képernyőterv: `ticket_wallet_dashboard_v1`

#### F. Kedvencek (features/favorites/)

1. **Favorites**
   - Képernyőterv: `favorites_list_manager_v2`

#### G. Értékelések (features/ratings/)

1. **Ratings**
   - Képernyőterv: `ratings_grid_overview_v2`

#### H. Bejelentések (features/reports/)

1. **Reports list**
   - Képernyőterv: `reports_status_tracker_v1`
   
2. **New Report**
   - Képernyőterv: `submit_report_form_v1`

#### I. Admin (features/admin/)

1. **Admin Dashboard**
   - Képernyőterv: `admin_hub_-_light_mode_v1`
   
2. **System Overview**
   - Képernyőterv: `admin_system_overview_v1`

### 4. Minden Oldalra Vonatkozó Szabályok

1. **Angular integrációk megőrzése:**
   - NE töröld a `*ngIf`, `*ngFor`, `[ngClass]` direktívákat
   - NE töröld az `(click)`, `(submit)`, `[(ngModel)]` bindingokat
   - NE változtasd meg a komponens logikáját (`.ts` fájlok)

2. **SCSS szervezés:**
   - Használj BEM-szerű class neveket
   - Minden komponensnek saját `.scss` fájl
   - Import-old a globális változókat

3. **Responsive design:**
   - Mobile-first megközelítés
   - Tailwind breakpoint-ok: `sm:`, `md:`, `lg:`, `xl:`

4. **Dark mode:**
   - Ahol van dark mode terv, implementáld
   - Használd a `dark:` prefix-et vagy `.dark` class-t

5. **Magyar nyelv:**
   - Minden UI szöveg magyarul
   - Angol marad: technikai kifejezések, kód, URL-ek

## Ellenőrzés

Minden oldal átépítése után:

1. **Vizuális ellenőrzés:**
   - Hasonlítsd össze a `screen.png` képpel
   - Ellenőrizd a színeket, térközöket, tipográfiát

2. **Funkcionális ellenőrzés:**
   - Működnek-e a gombok, linkek?
   - Működnek-e a formok?
   - Betöltődnek-e az adatok?

3. **Responsive ellenőrzés:**
   - Mobile nézet (360px)
   - Tablet nézet (768px)
   - Desktop nézet (1280px)

## Képernyőterv Struktúra

Minden képernyőterv mappában:
- `code.html` - A design HTML kódja (Tailwind CSS-sel)
- `screen.png` - A vizuális referencia kép

A `code.html` fájlokat CSAK referenciának használd:
- A Tailwind class-okat alakítsd át SCSS-re
- Az inline style-okat alakítsd át SCSS változókra
- Tartsd meg a HTML struktúrát de használj Angular szintaxist
