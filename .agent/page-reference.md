# TransitHub Oldal Referencia

> **Cél:** Ez a dokumentum összeköti az Angular komponenseket a megfelelő képernyőtervekkel.
> Az Antigravity agent használja ezt a dokumentumot az oldalak újraépítéséhez.

---

## Képernyőtervek helye

```
frontend/src/assets/stitch_public_landing_page/
```

---

## Oldal ↔ Képernyőterv Mapping

### 1. Autentikáció (features/auth/)

| Komponens | Képernyőterv mappa | Mód |
|-----------|-------------------|-----|
| `login` | `transit_app_login_v2` | Light |
| `register` | `transit_registration_v2` | Light |
| `verify-email` | `transit_email_verification_v1` | Light |

**Közös jellemzők:**
- Split layout: bal oldal primary háttér branding, jobb oldal form
- Rounded-xl input mezők ikonokkal
- Primary CTA gomb
- Social login gombok (Google, GitHub)

---

### 2. Landing Page (features/landing/)

| Komponens | Képernyőterv mappa | Mód |
|-----------|-------------------|-----|
| `landing` | `transitapp_logic-driven_landing_v2` | Light |

**Szekciók:**
- Hero section gradient szöveggel
- Feature cards (masonry grid)
- Testimonials carousel
- Hungarian CTA section
- Footer 4 oszlopos

---

### 3. Dashboard (features/dashboard/)

| Komponens | Képernyőterv mappa | Mód |
|-----------|-------------------|-----|
| `dashboard` | `user_portal_-_light_dashboard_v1` | Light |
| `dashboard` (alt) | `user_portal_-_dark_dashboard_v2` | Dark |

**Widget-ek:**
- Üdvözlő szekció gradient névvel
- Quick Plan / Digital Tickets chip-ek
- "Hova utazol?" tervező widget
- Aktív bérletek widget QR kóddal
- Kedvencek grid (2x2)
- Statisztika widget kördiagrammal

---

### 4. Útvonaltervező (features/planner/)

| Komponens | Képernyőterv mappa | Mód |
|-----------|-------------------|-----|
| `planner` | `planner_-_floating_search_v1` | Light |
| `results` | `journey_planner_results` | Light |

**Elemek:**
- Floating search bar (from/to/date)
- Route result list (idő, ár, közlekedési módok)
- Filter sidebar (sort, modes, price, walking)
- Térkép integráció
- Eco Impact widget

---

### 5. Jegyek (features/tickets/)

| Komponens | Képernyőterv mappa | Mód |
|-----------|-------------------|-----|
| `ticket-purchase` | `transitgo_checkout_-_standard_v1` | Light |
| `checkout` | Ugyanaz, fizetési szekció | Light |
| `success` | `transitgo_checkout_-_success_v3` | Dark |
| `wallet` | `ticket_wallet_dashboard_v1` | Light |
| `wallet` (alt) | `ticket_wallet_-_tab_view_v1` | Light |

**Elemek:**
- Journey Summary card
- Ticket type selector (3 opció)
- Passengers counter
- Digital pass preview (jegy kártya perforációval)
- QR kód
- Success üzenet konfettivel

---

### 6. Kedvencek (features/favorites/)

| Komponens | Képernyőterv mappa | Mód |
|-----------|-------------------|-----|
| `favorites` | `favorites_list_manager_v2` | Light |
| `favorites-empty` | `favorites_empty_state_v3` | Light |

**Elemek:**
- Tab navigation (All, Commute, Weekend, Saved Stops)
- List/Grid toggle
- Favorite item cards (route icon, name, next departure, status)
- Add new favorite CTA
- Live Map View section

---

### 7. Értékelések (features/ratings/)

| Komponens | Képernyőterv mappa | Mód |
|-----------|-------------------|-----|
| `ratings` | `ratings_grid_overview_v2` | Light |
| `ratings-moderation` | `ratings_moderation_table_v1` | Light (Admin) |

**Elemek:**
- Rating cards grid
- Star ratings (1-5)
- Filter tabs (All, Routes, Stops)
- "Write a Review" CTA
- Pagination
- Add New Rating card

---

### 8. Bejelentések (features/reports/)

| Komponens | Képernyőterv mappa | Mód |
|-----------|-------------------|-----|
| `reports` | `reports_status_tracker_v1` | Light |
| `new-report` | `submit_report_form_v1` | Light |
| `report-success` | `submit_report_success_v3` | Light |

**Elemek:**
- Report list (status badges)
- Category icons (Vandalism, Maintenance, Safety, Cleanliness)
- Status tabs (All, Submitted, Under Review, Resolved)
- Multi-step form (Category → Location → Details)
- File upload zone
- Success confirmation

---

### 9. Admin Panel (features/admin/)

| Komponens | Képernyőterv mappa | Mód |
|-----------|-------------------|-----|
| `admin-dashboard` | `admin_hub_-_light_mode_v1` | Light |
| `admin-overview` | `admin_system_overview_v1` | Light |

**Elemek:**
- Stat cards (Users, Rating, Reports, Tickets)
- Monthly Registrations chart
- Rating Summary donut chart
- Quick Actions grid
- Sidebar navigation (Overview, Users, Routes, Tickets, Reports, Settings)
- System Update banner

---

## Shared Komponensek (shared/)

### Header
- Referencia: Minden light mode képernyőterv header része
- Sticky, backdrop-blur, logo + nav + actions

### Footer
- Referencia: `transitapp_logic-driven_landing_v2` footer szekció
- 4 oszlopos grid, copyright, social links

### Sidebar
- Referencia: `user_portal_-_light_dashboard_v1` bal oldali sidebar
- Logo, nav links, user info footer

---

## Dark Mode Oldalak

A következő oldalaknak van dark mode verziója:

1. **Dashboard** → `user_portal_-_dark_dashboard_v2`
2. **Checkout Success** → `transitgo_checkout_-_success_v3`

Dark mode színek:
- Background: `#0f231f`
- Surface: `#18302b`
- Border: `#273a36`
- Text secondary: `#9abcb5`

---

## Implementációs Prioritás

### Magas prioritás (Core oldalak)
1. ✅ Landing page
2. ✅ Login / Register
3. ✅ Dashboard
4. ✅ Planner / Results

### Közepes prioritás (User features)
5. Tickets / Wallet
6. Favorites
7. Ratings
8. Reports

### Alacsony prioritás (Admin)
9. Admin Dashboard
10. Admin System Overview

---

## Megjegyzések az agentnek

1. **Nyelv:** Minden UI szöveg MAGYARUL legyen, kivéve angol technikai kifejezéseket
2. **Responsive:** Használj Tailwind breakpoint-okat (sm:, md:, lg:)
3. **Ikonok:** Material Symbols Outlined (nem Filled, nem Rounded)
4. **Betűtípus:** Lexend (display), Noto Sans (body)
5. **Elsődleges szín:** `#00a887` (mint/teal)
6. **Animációk:** Minden hover/focus állapotnak legyen transition
7. **Dark mode:** Használd a `.dark` class-t és Tailwind `dark:` prefix-et
