# PRD: Közlekedési Jegykezelő és Utazástervező Alkalmazás

## 1. Áttekintés

### 1.1 Projekt összefoglaló
Egy integrált közlekedési platform fejlesztése, amely egyesíti az utazástervezést, jegyvásárlást, térképes navigációt és közösségi funkciókat egyetlen alkalmazásban. A rendszer célja a helyi közlekedés digitalizálása és felhasználóbarát megközelítése.

### 1.2 Üzleti célok
- Egységes platform biztosítása jegyvásárláshoz és utazástervezéshez
- Felhasználói élmény javítása személyre szabott funkciókkal
- Közösségi visszajelzések integrálása az útvonal-minőség javításához
- Multimodális utazástervezés támogatása (busz + bicikli + taxi kombinációk)

### 1.3 Célközönség
- **Elsődleges**: Napi tömegközlekedést használó utasok (18-65 év)
- **Másodlagos**: Alkalmi utazók, turisták
- **Tercier**: Közlekedési szolgáltatók adminisztrációs munkatársai

---

## 2. Funkcionális követelmények

### 2.1 Felhasználói funkciók

#### 2.1.1 Regisztráció és hitelesítés
- **Regisztráció**: Supabase authentikáció, Google Authentication integráció
- **Bejelentkezés**: Supabase ,OAuth 2.0 flow Google-lel
- **Profil kezelés**: 
  - Név, email, profilkép módosítása
  - Fizetési információk mentése (opcionális)
  - Megerősítő email regisztrációnál

#### 2.1.2 Jegykezelés
**Jegykeresés:**
- Indulási és érkezési pont megadása
  - Autocomplete funkció címekhez és megállókhoz
  - GPS alapú "jelenlegi helyzet" használata
- Járatkereső szűrők:
  - Dátum és időpont választó
  - Utazási preferenciák (leggyorsabb, legolcsóbb, legkevesebb átszállás)
  - Akadálymentesség
  
**Jegyvásárlás:**
- Járat kiválasztása az eredménylistából
- Jegytípus választás:
  - Egyszerű menetjegy
  - Retúr jegy
  - Napijegy
  - Bérlet (havi, éves)
- Fizetési módok:
  Fizetés szimuláció (nem valós)
- Jegy küldése emailben PDF formában

**Jegytár:**
- Aktív jegyek listája
- Lejárt jegyek archívuma
- Vásárlási előzmények szűrése és keresése
- Jegy részletek: dátum, útvonal, ár, státusz

#### 2.1.3 Utazástervező
**Útvonal keresés:**
- Multimodális útvonaltervezés:
  - Tömegközlekedés (busz, villamos, metró)
  - Bicikli sharing (ha elérhető)
  - Gyaloglás
  - Taxi/ride-sharing
- Alternatív útvonalak megjelenítése (max. 2 opció)
- Útvonal részletek:
  - Teljes utazási idő
  - Költség lebontva
  - Átszállások száma és helye


**Kedvenc útvonalak:**
- Gyakran használt útvonalak mentése néven
- Gyors újratervezés egy kattintással

#### 2.1.4 Térkép funkciók
- **Interaktív térkép** (Google Maps API / Leaflet)
  - Megállók megjelenítése markerekkel
  - Járat útvonalak vizualizációja
  - Közelben lévő megállók keresése
- **Rétegek:**
  - Busz, vonat megállók

- **Interakciók:**
  - Marker kattintás → megálló részletek + következő járatok

#### 2.1.5 Közösségi funkciók
**Értékelések:**
- Járatok értékelése 1-5 csillag skálán
- Kategóriák: tisztaság, pontosság
- Írott vélemény (max 500 karakter)

{NEM FONTOS
**Visszajelzések:**
- Probléma jelentése:
  - Késés
  - Kihagyott megálló
  - Műszaki hiba
  - Egyéb
- Közösségi riasztások (pl. zsúfoltság, baleset)}

**Közösségi szint:**
- Hasznos értékelések kedvelése
- Moderáció (admin általi tartalom ellenőrzés)

#### 2.1.6 Értesítések
- Email értesítések
- Értesítési típusok:
    - Fizetés után
    - Regisztráció megerősítéséhez

---

### 2.2 Szolgáltatói (Admin) funkciók

#### 2.2.1 Járatkezelés
**CRUD műveletek:**
- **Create**: Új járat felvétele
  - Járatszám
  - Útvonal (megállók listája sorrendben)
  - Menetrend (hétköznapok, hétvégék)
  - Ár információk
  - Akadálymentesség
- **Read**: Járatok listázása, szűrése, keresése
- **Update**: Járat adatok módosítása, menetrend frissítés
- **Delete**: Járat törölése vagy inaktiválása

#### 2.2.2 Megálló kezelés
- Megállók CRUD műveletei
- GPS koordináták megadása
- Megálló típus (busz, villamos, metró)
- Kapcsolódó járatok listája
- Akadálymentesség jelzők

#### 2.2.3 Tarifa kezelés
- Jegytípusok és árak szerkesztése
- Érvényességi időszakok
- Bérlet típusok kezelése

#### 2.2.4 Statisztikák és jelentések
- Jegyeladások összesítése
  - Napi/heti/havi bontás
  - Járat szerinti bontás
  - Bevétel kimutatások
- Felhasználói aktivitás
- Népszerű útvonalak elemzése
- Értékelések összegzése járatonként

---

### 2.3 Rendszergazdai funkciók
- Felhasználók kezelése (ban, jogosultság módosítás)
- Szolgáltató fiókok kezelése
- Rendszer konfigurációk
- Adatbázis mentések kezelése
- Log-ok megtekintése
- Moderációs feladatok (jelentett tartalmak kezelése)

---

## 3. Nem-funkcionális követelmények

### 3.1 Teljesítmény
- Oldalbetöltés < 2 másodperc
- API válaszidő < 500ms (95. percentilis)
- Térkép renderelés < 1 másodperc
- Támogatott egyidejű felhasználók: 50-100

### 3.2 Biztonság
- HTTPS minden kommunikációra
- OAuth 2.0 hitelesítés
- JWT tokenek 15 perces érvényességgel
- Refresh token mechanizmus
- XSS és CSRF védelem
- Rate limiting API végpontokon
- Érzékeny adatok titkosítása (pl. fizetési információk)
- GDPR compliance (adatvédelem)

### 3.3 Használhatóság
- Reszponzív design (mobile-first megközelítés)
- Akadálymentesség (WCAG 2.1 AA szint)
- Intuitív navigáció max. 3 klikk mélységig
- Loading indikátorok minden async műveletnél

### 3.4 Karbantarthatóság
- Moduláris kód architektúra
- Egységtesztek 70%+ lefedettség
- E2E tesztek kritikus útvonalakra
- Részletes API dokumentáció (Swagger/OpenAPI)
- Code review folyamat
- Verziózás (semantic versioning)

### 3.5 Skálázhatóság
- Horizontális skálázhatóság (Node.js cluster mód)
- CDN használata statikus tartalmakhoz
- Adatbázis indexelés optimalizálása
- Cache réteg (Redis) gyakori lekérdezésekhez
- Load balancing készenlét

---

## 4. Technológiai stack

### 4.1 Frontend
- **Framework**: Angular 17+
- **Styling**: SCSS, Angular Material UI komponensek
- **State management**: NgRx (vagy RxJS+Services)
- **Forms**: Reactive Forms
- **HTTP client**: HttpClient
- **Maps**: Google Maps JavaScript API v3 vagy Leaflet + OpenStreetMap
- **Testing**: Jasmine, Karma, Cypress (E2E)

### 4.2 Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js vagy NestJS (ajánlott a strukturáltság miatt)
- **API típus**: RESTful API + ( csak ha van megvalósítva real time-adat: WebSocket (real-time frissítésekhez))
- **Validation**: Joi vagy class-validator
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI

### 4.3 Adatbázis
- **Elsődleges**: Supabase (PostgreSQL alapú)
  - Auth kezelés
  - Row Level Security (RLS)
  - Storage blob adatokhoz (képek, PDF-ek)
- **Cache**: Redis (opcionális, teljesítmény optimalizáláshoz)

### 4.4 Külső szolgáltatások
- **Authentication**: Google OAuth 2.0 (Supabase Auth provider)
- **Maps**: Google Maps Platform APIs
  - Maps JavaScript API
  - Directions API
  - Places API
  - Geocoding API
- **Email**: SendGrid vagy AWS SES
- **Analytics**: Google Analytics 4

### 4.5 DevOps és CI/CD
- **Verziókezelés**: Git (GitHub)
- **CI/CD**: GitHub Actions
  - Automatikus build
  - Tesztek futtatása
  - Linting és code quality checks (ESLint, Prettier)
  - Deployment
- **Hosting**:
  - Frontend: Netlify
  - Backend: Railway, Render, AWS EC2/ECS KUTYA
  - Adatbázis: Supabase cloud
- **Monitoring**: Sentry (error tracking), Uptime monitoring

---

## 5. Adatmodell (főbb entitások)

### 5.1 Users (felhasználók)
```typescript
{
  id: UUID (PK),
  email: string (unique),
  name: string,
  profile_picture_url: string?,
  google_id: string (unique),
  role: enum('user', 'admin', 'provider'),
  notification_preferences: JSON,
  created_at: timestamp,
  updated_at: timestamp
}
```

### 5.2 Routes (járatok)
```typescript
{
  id: UUID (PK),
  route_number: string,
  name: string,
  provider_id: UUID (FK -> Users),
  is_accessible: boolean,
  is_active: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

### 5.3 Stops (megállók)
```typescript
{
  id: UUID (PK),
  name: string,
  latitude: decimal,
  longitude: decimal,
  type: enum('bus', 'tram', 'metro'),
  is_accessible: boolean,
  created_at: timestamp
}
```

### 5.4 RouteStops (járat-megálló kapcsolat)
```typescript
{
  id: UUID (PK),
  route_id: UUID (FK -> Routes),
  stop_id: UUID (FK -> Stops),
  order: integer,
  arrival_time: time?, // menetrend szerint
  created_at: timestamp
}
```

### 5.5 Tickets (jegyek)
```typescript
{
  id: UUID (PK),
  user_id: UUID (FK -> Users),
  route_id: UUID (FK -> Routes),
  ticket_type: enum('single', 'return', 'day_pass', 'monthly_pass'),
  price: decimal,
  purchase_date: timestamp,
  valid_from: timestamp,
  valid_until: timestamp,
  qr_code: string,
  status: enum('active', 'used', 'expired'),
  created_at: timestamp
}
```

### 5.6 FavoriteRoutes (kedvenc útvonalak)
```typescript
{
  id: UUID (PK),
  user_id: UUID (FK -> Users),
  name: string,
  from_stop_id: UUID (FK -> Stops),
  to_stop_id: UUID (FK -> Stops),
  route_data: JSON, // mentett útvonal részletek
  created_at: timestamp
}
```

### 5.7 Ratings (értékelések)
```typescript
{
  id: UUID (PK),
  user_id: UUID (FK -> Users),
  route_id: UUID (FK -> Routes),
  overall_rating: integer (1-5),
  cleanliness: integer (1-5),
  punctuality: integer (1-5),
  driver: integer (1-5),
  comfort: integer (1-5),
  comment: text?,
  photos: string[]?,
  helpful_count: integer,
  created_at: timestamp,
  updated_at: timestamp
}
```

### 5.8 Reports (visszajelzések)
```typescript
{
  id: UUID (PK),
  user_id: UUID (FK -> Users),
  route_id: UUID (FK -> Routes),
  type: enum('delay', 'missed_stop', 'technical', 'other'),
  description: text,
  status: enum('pending', 'resolved', 'dismissed'),
  created_at: timestamp,
  resolved_at: timestamp?
}
```

### 5.9 Payments (fizetések)
```typescript
{
  id: UUID (PK),
  user_id: UUID (FK -> Users),
  ticket_id: UUID (FK -> Tickets),
  amount: decimal,
  currency: string,
  payment_method: enum('card', 'google_pay'),
  stripe_payment_id: string?,
  status: enum('pending', 'completed', 'failed', 'refunded'),
  created_at: timestamp
}
```

---

## 6. API végpontok (példák)

### 6.1 Autentikáció
- `POST /api/auth/google` - Google OAuth bejelentkezés
- `POST /api/auth/logout` - Kijelentkezés
- `GET /api/auth/me` - Aktuális felhasználó adatai
- `PUT /api/auth/profile` - Profil frissítés

### 6.2 Járatok és megállók
- `GET /api/routes` - Járatok listázása (query params: provider_id, is_active)
- `GET /api/routes/:id` - Járat részletek
- `POST /api/routes` - Járat létrehozás (admin/provider)
- `PUT /api/routes/:id` - Járat módosítás
- `DELETE /api/routes/:id` - Járat törlés
- `GET /api/stops` - Megállók listázása (query: lat, lng, radius)
- `GET /api/stops/:id` - Megálló részletek + kapcsolódó járatok

### 6.3 Utazástervező
- `POST /api/planner/search` - Útvonal keresés
  ```json
  {
    "from": {"lat": 47.5, "lng": 19.0},
    "to": {"lat": 47.6, "lng": 19.1},
    "date": "2025-11-01T10:00:00Z",
    "modes": ["bus", "bike", "walk"],
    "preferences": "fastest"
  }
  ```
- `GET /api/planner/alternatives` - Alternatív útvonalak

### 6.4 Jegyek
- `POST /api/tickets/search` - Jegykeresés
- `POST /api/tickets/purchase` - Jegyvásárlás
- `GET /api/tickets` - Felhasználó jegyei (query: status)
- `GET /api/tickets/:id` - Jegy részletek + QR kód
- `POST /api/tickets/:id/validate` - Jegy validálás (ellenőr funkció)

### 6.5 Kedvencek
- `GET /api/favorites` - Kedvenc útvonalak
- `POST /api/favorites` - Kedvenc mentése
- `DELETE /api/favorites/:id` - Kedvenc törlése

### 6.6 Értékelések
- `GET /api/ratings/route/:route_id` - Járat értékelései
- `POST /api/ratings` - Értékelés létrehozása
- `PUT /api/ratings/:id` - Értékelés módosítása
- `POST /api/ratings/:id/helpful` - Értékelés hasznosnak jelölése

### 6.7 Visszajelzések
- `POST /api/reports` - Visszajelzés küldése
- `GET /api/reports` - Visszajelzések listája (admin)
- `PUT /api/reports/:id/resolve` - Visszajelzés lezárása

### 6.8 Admin
- `GET /api/admin/stats` - Statisztikák
- `GET /api/admin/users` - Felhasználók kezelése
- `PUT /api/admin/users/:id/ban` - Felhasználó bannolása

---

## 7. Felhasználói interfész főbb képernyők

### 7.1 Nyilvános oldal (nem bejelentkezett)
- **Landing page**: 
  - Hero section utazástervező widget-tel
  - Főbb funkciók bemutatása
  - Regisztráció/Bejelentkezés CTA
- **Rólunk oldal**

### 7.2 Bejelentkezett felhasználó
**Dashboard:**
- Gyors utazástervező
- Aktív jegyek
- Kedvenc útvonalak gyorselérése
- Közeli megállók térképe

**Utazástervező oldal:**
- Indulási/érkezési pont választó (autocomplete + térkép pin)
- Dátum/idő választó
- Utazási mód váltók (busz, bicikli, gyaloglás, taxi)
- Eredménylista alternatív útvonalakkal
- Részletes útvonal nézet térképpel

**Jegyvásárlás oldal:**
- Jegytípus választó
- Ár összegző
- Fizetési metódus választó
- Sikeres vásárlás → QR kód megjelenítés

**Jegytár:**
- Tab-ok: Aktív / Lejárt / Összes
- Jegy kártyák: dátum, útvonal, QR kód gyorselérés
- Keresés és szűrők

**Kedvencek:**
- Mentett útvonalak listája
- Újratervezés gomb
- Szerkesztés/törlés

**Térkép:**
- Teljes képernyős térkép nézet
- Megálló markerek
- Járat útvonalak
- Sidebar info panel

**Profil:**
- Személyes adatok szerkesztése
- Fizetési módok kezelése
- Értesítési beállítások
- Statisztikák (utazások száma, költés)
- Kijelentkezés

**Értékelések:**
- Saját értékelések listája
- Új értékelés írása

### 7.3 Admin/Provider panel
- **Dashboard**: KPI-k, grafikonok
- **Járatkezelő**: CRUD táblázat
- **Megálló kezelő**: CRUD + térkép
- **Statisztikák**: Exportálható jelentések
- **Felhasználók**: Felhasználó lista + moderáció

---

## 8. Fejlesztési ütemterv (javaslat)

### Sprint 0 (1 hét): Setup
- Projekt inicializálás (Angular + Node.js)
- Git repo, branch stratégia
- Supabase projekt setup
- CI/CD pipeline alapok
- Design system és UI komponens könyvtár alapjai

### Sprint 1-2 (2 hét): Autentikáció és alapok
- Google OAuth integráció
- User management backend
- Frontend auth guard-ok
- Alap layout (navbar, footer, routing)
- Landing page

### Sprint 3-4 (2 hét): Járat és megálló kezelés
- Admin CRUD műveletek járatokhoz
- Megálló kezelés + térkép integráció
- Publikus API végpontok (járatok, megállók listázása)
- Megálló részletek oldal

### Sprint 5-6 (2 hét): Utazástervező
- Utazástervező algoritmus backend
- Multimodális útvonal számítás
- Frontend útvonalkereső
- Alternatív útvonalak megjelenítése
- Térkép útvonal vizualizáció

### Sprint 7-8 (2 hét): Jegykezelés
- Jegy típusok és árkezelés backend
- Jegyvásárlás flow frontend
- Stripe integráció
- QR kód generálás
- Jegytár (aktív/lejárt jegyek)
- Email küldés (jegy PDF)

### Sprint 9-10 (2 hét): Kedvencek és személyre szabás
- Kedvenc útvonalak CRUD
- Értesítési rendszer (push + email)
- Profil kezelés
- Vásárlási előzmények

### Sprint 11-12 (2 hét): Közösségi funkciók
- Értékelési rendszer
- Visszajelzés/report funkció
- Admin moderáció
- Közösségi statisztikák

### Sprint 13-14 (2 hét): Optimalizálás és tesztelés
- Teljesítmény optimalizálás
- Biztonsági audit
- E2E tesztek
- Accessibility audit
- Bug fixing

### Sprint 15 (1 hét): Deployment és dokumentáció
- Production deployment
- Felhasználói dokumentáció
- API dokumentáció finalizálás
- Monitoring beállítása

---

## 9. Kockázatok és megoldások

| Kockázat | Valószínűség | Hatás | Megoldás |
|----------|--------------|-------|----------|
| Google Maps API költségek túllépése | Közepes | Nagy | Leaflet + OpenStreetMap alternatíva, cache réteg |
| Fizetési API integráció késleltetése | Közepes | Nagy | SimplePay magyarországi alternatíva előkészítése |
| Supabase skálázhatósági problémák | Alacsony | Közepes | Monitoring, query optimalizálás, cache réteg |
| Real-time járműpozíció API hiánya | Nagy | Közepes | MVP-ben csak menetrend alapú működés |
| Felhasználói elfogadottság | Közepes | Nagy | Early adopter program, béta tesztelés |

---

## 10. Sikerkritériumok (MVP)

### Funkcionális:
- [ ] Felhasználók regisztrálhatnak Google fiókkal
- [ ] Minimum 3 járat és 10 megálló adatokkal feltöltve
- [ ] Utazástervező működik (min. busz + gyaloglás)
- [ ] Jegy vásárolható tesztfizetéssel
- [ ] QR kód generálás és tárolás
- [ ] Kedvenc útvonal menthető
- [ ] Térkép megjelenít megállókat és útvonalakat
- [ ] Admin tud járatot létrehozni/szerkeszteni
- [ ] Értékelés írható járatokhoz

### Nem-funkcionális:
- [ ] Alkalmazás betölt < 3 másodperc alatt
- [ ] Reszponzív design (mobile + desktop)
- [ ] 0 critical security hiba (Snyk/OWASP scan)
- [ ] CI/CD pipeline működik
- [ ] Alapvető unit tesztek (>50% coverage)

---

## 11. Jövőbeli továbbfejlesztési lehetőségek (MVP után)

- **Real-time tracking**: Élő járművek pozíciója GPS szenzorok alapján
- **Offline mód**: PWA funkcionalitás, cache-elt menetrendek
- **AI javaslatok**: Gépi tanulás alapú személyre szabott útvonalak
- **Közösségi funkciók bővítése**: Chat, carpooling matching
- **Bérlet automata hosszabbítás**: Előfizetés alapú modell
- **Integrációk**: Bicikli sharing API-k (MOL Bubi, stb.)
- **Gamification**: Pontrendszer, achievement-ek környezettudatos utazásért
- **Dark mode**: Alternatív UI téma
- **Accessibility**: Képernyőolvasó optimalizálás, hangvezérlés
- **Analytics**: Felhasználói utazási szokások elemzése

---

## 12. Dokumentációs követelmények

- **README.md**: Projekt leírás, setup útmutató
- **API dokumentáció**: Swagger/OpenAPI spec
- **Felhasználói kézikönyv**: Screenshot-okkal
- **Admin kézikönyv**: Járatkezelési folyamatok
- **Deployment guide**: Telepítési lépések
- **Architecture Decision Records (ADR)**: Fontos technológiai döntések dokumentálása

---

## 13. Kapcsolattartás és kommunikáció

- **Projekt owner**: Te (szakdolgozat készítő)
- **Code reviews**: GitHub Pull Request workflow
- **Issue tracking**: GitHub Issues vagy Jira
- **Kommunikációs csatorna**: Discord/Slack (ha team van)
