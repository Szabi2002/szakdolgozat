# Sprint 0 Megvalósítási Terv
## Közlekedési Jegykezelő és Utazástervező Alkalmazás

**Időtartam:** 1 hét
**Státusz:** Tervezés kész, végrehajtásra vár
**Verzió:** 1.0
**Dátum:** 2025-11-02

---

## Tartalomjegyzék

1. [Sprint 0 Célkitűzések](#1-sprint-0-célkitűzések)
2. [Projekt Struktúra](#2-projekt-struktúra)
3. [Technológiai Döntések](#3-technológiai-döntések)
4. [Agent Feladatkiosztás](#4-agent-feladatkiosztás)
5. [Végrehajtási Sorrend](#5-végrehajtási-sorrend)
6. [Szükséges Konfigurációs Fájlok](#6-szükséges-konfigurációs-fájlok)
7. [Sikerkritériumok](#7-sikerkritériumok)
8. [Függőségek és Előfeltételek](#8-függőségek-és-előfeltételek)

---

## 1. Sprint 0 Célkitűzések

A Sprint 0 célja a projekt technikai alapjainak létrehozása. A PRD szerint az alábbi fő területeket kell lefedni:

### Főbb célok:
- ✅ **Projekt inicializálás**: Angular 17+ és NestJS projekt beállítása
- ✅ **Supabase setup**: Adatbázis és autentikációs szolgáltatás konfigurálása
- ✅ **CI/CD pipeline**: GitHub Actions alapvető workflow-k
- ✅ **Design system**: UI komponens könyvtár és Angular Material integráció

### Elvárt kimenet:
- Működő, futtatható frontend és backend projekt
- Lokálisan tesztelhető fejlesztői környezet
- Automatizált build és teszt pipeline
- Alap komponenskönyvtár használatra kész állapotban

---

## 2. Projekt Struktúra

### 2.1 Teljes Mappa Hierarchia

```
C:\Users\Szabolcs\BUSZ\szakdolgozat\
│
├── backend/                          # NestJS backend alkalmazás
│   ├── src/
│   │   ├── modules/                  # Feature modulok (auth, routes, tickets, stb.)
│   │   ├── common/                   # Közös kódok (guards, interceptors, filters)
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   ├── filters/
│   │   │   └── pipes/
│   │   ├── config/                   # Konfigurációs fájlok
│   │   ├── main.ts                   # Backend belépési pont
│   │   └── app.module.ts             # Root modul
│   ├── test/                         # E2E tesztek
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .env.example
│
├── frontend/                         # Angular frontend alkalmazás
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                 # Singleton szolgáltatások (auth, http)
│   │   │   ├── shared/               # Újrafelhasználható komponensek, pipe-ok
│   │   │   ├── features/             # Feature modulok (dashboard, tickets, planner)
│   │   │   ├── app.component.ts
│   │   │   ├── app.routes.ts
│   │   │   └── app.config.ts
│   │   ├── assets/                   # Statikus fájlok
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── styles/
│   │   ├── environments/             # Environment konfiguráció
│   │   │   ├── environment.ts
│   │   │   └── environment.prod.ts
│   │   ├── index.html
│   │   └── main.ts
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docs/                             # Projekt dokumentáció
│   ├── architecture/                 # Architektúra diagramok, ADR-ek
│   ├── api/                          # API dokumentáció
│   └── user-guide/                   # Felhasználói dokumentáció
│
├── .github/
│   └── workflows/                    # GitHub Actions CI/CD
│       ├── backend-ci.yml
│       ├── frontend-ci.yml
│       └── deploy.yml
│
├── scripts/                          # Build, deployment scriptek
│   ├── setup-dev.sh
│   ├── seed-database.ts
│   └── deploy.sh
│
├── database/                         # Supabase migrációk, seed fájlok
│   ├── migrations/
│   └── seeds/
│
├── PRD.md                            # Product Requirements Document
├── SPRINT_0_PLAN.md                  # Ez a fájl
├── README.md                         # Projekt README
└── .gitignore

```

### 2.2 Mappa Szerepek

| Mappa | Felelős Agent | Cél |
|-------|--------------|-----|
| `backend/` | `backend-api-developer` | NestJS API, üzleti logika |
| `frontend/` | `angular-frontend-dev` | Angular UI, felhasználói élmény |
| `database/` | `devops-infrastructure-engineer` | Supabase migrációk, schema |
| `.github/workflows/` | `devops-infrastructure-engineer` | CI/CD automatizáció |
| `docs/` | Minden agent | Dokumentáció |

---

## 3. Technológiai Döntések

### 3.1 Backend Stack

| Technológia | Verzió | Indoklás |
|------------|--------|----------|
| **Node.js** | 20.x LTS | Stabil LTS, modern JS/TS támogatás |
| **NestJS** | 10.x | Strukturált, moduláris, TypeScript natív, enterprise-ready |
| **TypeScript** | 5.x | Type safety, jobb fejlesztői élmény |
| **Supabase Client** | Latest | Adatbázis és auth integráció |
| **Class Validator** | Latest | DTO validáció, type-safe |
| **Jest** | Latest | Unit és integration tesztek |
| **Swagger/OpenAPI** | Latest | API dokumentáció automatikus generálása |

**Alternatív megfontolások:**
- Express.js: Egyszerűbb, de kevésbé strukturált
- Fastify: Gyorsabb, de kisebb közösség
- **Döntés:** NestJS a PRD ajánlása miatt, skálázhatóság és karbantarthatóság

### 3.2 Frontend Stack

| Technológia | Verzió | Indoklás |
|------------|--------|----------|
| **Angular** | 17+ (18 ha elérhető) | PRD követelmény, enterprise support |
| **TypeScript** | 5.x | Angular alapvető követelmény |
| **Angular Material** | 17+ | Google által karbantartott UI library |
| **RxJS** | 7.x | Reactive programozás, Angular core része |
| **Supabase JS Client** | Latest | Frontend autentikáció és realtime |
| **Leaflet** | Latest | Térképes funkciók (Google Maps alternatíva) |
| **Jasmine/Karma** | Latest | Unit tesztek |
| **Cypress** | Latest | E2E tesztek |

**Alternatív megfontolások:**
- React/Vue: Modern, de a PRD Angular-t specifikál
- Tailwind CSS: Népszerű, de Material UI integráltabb
- **Döntés:** Angular Material a design system egységessége miatt

### 3.3 DevOps és Infrastruktúra

| Szolgáltatás | Cél | Megjegyzés |
|-------------|-----|-----------|
| **Supabase** | PostgreSQL DB + Auth + Storage | Ingyenes tier, gyors setup |
| **GitHub Actions** | CI/CD pipeline | Ingyenes publikus repo-khoz |
| **Netlify** | Frontend hosting (tervezett) | Auto-deploy, CDN, ingyenes SSL |
| **Railway/Render** | Backend hosting (tervezett) | Ingyenes tier node.js app-hoz |

---

## 4. Agent Feladatkiosztás

### 4.1 Agent: `angular-frontend-dev`

**Felelősség:** Angular frontend projekt inicializálása és design system alapok

#### Feladat #1: Angular Projekt Inicializálás
**Prioritás:** KRITIKUS
**Becsült idő:** 2-3 óra

**Konkrét lépések:**
1. Angular CLI telepítése (ha nincs): `npm install -g @angular/cli@latest`
2. Új Angular projekt létrehozása a `frontend/` mappában:
   ```bash
   cd C:\Users\Szabolcs\BUSZ\szakdolgozat\frontend
   ng new . --directory . --routing --style=scss --strict
   ```
   - **Ne hozzon létre új mappát**, a jelenlegi `frontend/` mappát használja
   - Válassza ki: **Standalone components: YES**
   - Válassza ki: **SSR: NO** (későbbi fázisban mérlegelendő)

3. Angular Material telepítése:
   ```bash
   ng add @angular/material
   ```
   - Téma: **Indigo/Pink** (később testreszabható)
   - Typography: **YES**
   - Animations: **YES**

4. Supabase JS Client telepítése:
   ```bash
   npm install @supabase/supabase-js
   ```

5. További függőségek telepítése:
   ```bash
   npm install @angular/google-maps leaflet @types/leaflet
   npm install --save-dev @types/node
   ```

#### Feladat #2: Environment Konfiguráció
**Prioritás:** MAGAS
**Becsült idő:** 30 perc

**Lépések:**
1. Hozza létre az environment fájlokat:
   - `src/environments/environment.ts` (development)
   - `src/environments/environment.prod.ts` (production)

2. Környezeti változók struktúra (NE töltse ki valós adatokkal):
   ```typescript
   export const environment = {
     production: false,
     supabaseUrl: 'YOUR_SUPABASE_URL',
     supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY',
     apiUrl: 'http://localhost:3000/api',
     googleMapsApiKey: 'YOUR_GOOGLE_MAPS_KEY' // vagy Leaflet-hez nem kell
   };
   ```

3. Hozza létre `.env.example` fájlt a frontend gyökérben:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   API_URL=http://localhost:3000/api
   GOOGLE_MAPS_API_KEY=your_optional_google_maps_key
   ```

#### Feladat #3: Projekt Struktúra Kialakítása
**Prioritás:** MAGAS
**Becsült idő:** 1 óra

**Lépések:**
1. Hozza létre az alábbi mappa struktúrát `src/app/` alatt:
   ```
   src/app/
   ├── core/                 # Singleton szolgáltatások
   │   ├── services/         # Auth, HTTP interceptors
   │   ├── guards/           # Route guards
   │   └── interceptors/     # HTTP interceptors
   ├── shared/               # Megosztott komponensek
   │   ├── components/       # UI komponensek
   │   ├── directives/
   │   ├── pipes/
   │   └── models/           # TypeScript interface-ek
   ├── features/             # Feature modulok (később)
   │   └── .gitkeep
   ├── app.component.ts
   ├── app.routes.ts
   └── app.config.ts
   ```

2. Generáljon placeholder komponenseket:
   ```bash
   ng generate component shared/components/header --standalone
   ng generate component shared/components/footer --standalone
   ng generate component shared/components/loading-spinner --standalone
   ```

#### Feladat #4: Angular Material Design System Alapok
**Prioritás:** KÖZEPES
**Becsült idő:** 2 óra

**Lépések:**
1. Hozza létre egy custom Material téma fájlt: `src/assets/styles/custom-theme.scss`

2. Alapvető színpaletta definiálása (közlekedési téma: kék, zöld):
   ```scss
   @use '@angular/material' as mat;

   $app-primary: mat.define-palette(mat.$indigo-palette);
   $app-accent: mat.define-palette(mat.$green-palette, A200, A100, A400);
   $app-warn: mat.define-palette(mat.$red-palette);

   $app-theme: mat.define-light-theme((
     color: (
       primary: $app-primary,
       accent: $app-accent,
       warn: $app-warn,
     )
   ));

   @include mat.all-component-themes($app-theme);
   ```

3. Importálja a témát `styles.scss`-be

4. Hozzon létre egy **komponens könyvtár showcas-t**: `shared/components/material-showcase`
   - Célja: Minden használni kívánt Material komponens bemutatása
   - Tartalmazzon példákat: Button, Card, Form Field, Dialog, Snackbar

#### Feladat #5: Routing Alapok
**Prioritás:** KÖZEPES
**Becsült idő:** 30 perc

**Lépések:**
1. Konfigurálja az `app.routes.ts` fájlt alapvető route-okkal:
   ```typescript
   import { Routes } from '@angular/router';

   export const routes: Routes = [
     { path: '', redirectTo: '/home', pathMatch: 'full' },
     { path: 'home', loadComponent: () => import('./features/home/home.component') },
     { path: '**', redirectTo: '/home' }
   ];
   ```

2. Hozza létre a Home placeholder komponenst:
   ```bash
   ng generate component features/home --standalone
   ```

#### Feladat #6: Dokumentáció
**Prioritás:** ALACSONY
**Becsült idő:** 30 perc

**Lépések:**
1. Frissítse a `frontend/README.md` fájlt:
   - Telepítési utasítások
   - Fejlesztői parancsok (`ng serve`, `ng build`, `ng test`)
   - Projekt struktúra magyarázat
   - Environment setup lépések

2. Készítsen egy `frontend/SETUP.md` fájlt a lokális környezet beállításához

#### Deliverable-ek (Átadandó elemek):
- [ ] Futó Angular projekt (`ng serve` -> `http://localhost:4200`)
- [ ] Angular Material integrálva, működő téma
- [ ] Alapvető routing működik
- [ ] Environment fájlok létrehozva (.example-el)
- [ ] Projekt struktúra kész a features fejlesztésére
- [ ] README.md és SETUP.md dokumentáció
- [ ] Material showcase komponens demo célra

#### Ellenőrző lista:
- [ ] `ng build --configuration production` hibátlanul lefut
- [ ] Nincs TypeScript hiba (`ng lint`)
- [ ] Alapvető unit tesztek futnak (`ng test`)
- [ ] Header és footer komponens megjelenik
- [ ] Material komponensek használhatók

---

### 4.2 Agent: `backend-api-developer`

**Felelősség:** NestJS backend projekt inicializálása és Supabase integráció

#### Feladat #1: NestJS Projekt Inicializálás
**Prioritás:** KRITIKUS
**Becsült idő:** 2 óra

**Konkrét lépések:**
1. Nest CLI telepítése (ha nincs):
   ```bash
   npm install -g @nestjs/cli
   ```

2. NestJS projekt létrehozása a `backend/` mappában:
   ```bash
   cd C:\Users\Szabolcs\BUSZ\szakdolgozat\backend
   nest new . --directory . --package-manager npm --strict
   ```
   - **Ne hozzon létre új mappát**, használja a jelenlegi `backend/` mappát

3. Alapvető NestJS függőségek telepítése:
   ```bash
   npm install @nestjs/config @nestjs/swagger @nestjs/throttler
   npm install @supabase/supabase-js
   npm install class-validator class-transformer
   ```

4. Dev függőségek:
   ```bash
   npm install --save-dev @types/node @types/express
   ```

#### Feladat #2: Projekt Struktúra Kialakítása
**Prioritás:** KRITIKUS
**Becsült idő:** 1.5 óra

**Lépések:**
1. Hozza létre a következő modul struktúrát:
   ```
   src/
   ├── modules/
   │   ├── auth/
   │   │   ├── auth.module.ts
   │   │   ├── auth.controller.ts
   │   │   ├── auth.service.ts
   │   │   └── dto/
   │   ├── health/              # Health check endpoint
   │   │   ├── health.module.ts
   │   │   └── health.controller.ts
   │   └── .gitkeep
   ├── common/
   │   ├── guards/
   │   │   └── auth.guard.ts
   │   ├── interceptors/
   │   │   └── logging.interceptor.ts
   │   ├── filters/
   │   │   └── http-exception.filter.ts
   │   └── decorators/
   │       └── current-user.decorator.ts
   ├── config/
   │   ├── supabase.config.ts
   │   └── app.config.ts
   ├── main.ts
   └── app.module.ts
   ```

2. Generálja a modulokat Nest CLI-vel:
   ```bash
   nest generate module modules/auth
   nest generate controller modules/auth
   nest generate service modules/auth

   nest generate module modules/health
   nest generate controller modules/health
   ```

#### Feladat #3: Supabase Integráció
**Prioritás:** KRITIKUS
**Becsült idő:** 2 óra

**Lépések:**
1. Hozza létre a Supabase konfigurációs szolgáltatást:
   - Fájl: `src/config/supabase.config.ts`
   - Exportáljon egy `createSupabaseClient()` factory függvényt
   - Használjon `@nestjs/config` ConfigService-t az URL és KEY kezeléséhez

2. Hozza létre a Supabase modult:
   ```bash
   nest generate module supabase
   nest generate service supabase
   ```
   - `SupabaseService` biztosítson egy `getClient()` metódust

3. Auth Guard implementálása:
   - Fájl: `src/common/guards/auth.guard.ts`
   - JWT token validálás Supabase-zel
   - Request objektumhoz felhasználó hozzáfűzése

4. Current User Decorator:
   - Fájl: `src/common/decorators/current-user.decorator.ts`
   - Authenticated user kinyerése a requestből

#### Feladat #4: Environment és Config
**Prioritás:** MAGAS
**Becsült idő:** 1 óra

**Lépések:**
1. Telepítse a `dotenv` támogatást:
   ```bash
   npm install dotenv
   ```

2. Hozza létre a `.env.example` fájlt a backend gyökérben:
   ```
   NODE_ENV=development
   PORT=3000

   # Supabase
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # CORS
   CORS_ORIGIN=http://localhost:4200

   # Rate Limiting
   THROTTLE_TTL=60
   THROTTLE_LIMIT=10
   ```

3. Konfigurálja a `ConfigModule`-t az `app.module.ts`-ben:
   ```typescript
   import { ConfigModule } from '@nestjs/config';

   @Module({
     imports: [
       ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: '.env',
       }),
       // ... többi modul
     ],
   })
   ```

#### Feladat #5: Swagger/OpenAPI Dokumentáció
**Prioritás:** MAGAS
**Becsült idő:** 1 óra

**Lépések:**
1. Konfigurálja a Swagger-t a `main.ts`-ben:
   ```typescript
   import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

   const config = new DocumentBuilder()
     .setTitle('Közlekedési Jegykezelő API')
     .setDescription('API dokumentáció a közlekedési alkalmazáshoz')
     .setVersion('1.0')
     .addBearerAuth()
     .build();

   const document = SwaggerModule.createDocument(app, config);
   SwaggerModule.setup('api/docs', app, document);
   ```

2. Adjon hozzá `@ApiTags()`, `@ApiOperation()` dekorátorokat a controller-ekhez

3. Ellenőrizze: `http://localhost:3000/api/docs` elérhető

#### Feladat #6: CORS és Security
**Prioritás:** MAGAS
**Becsült idő:** 30 perc

**Lépések:**
1. CORS engedélyezése a `main.ts`-ben:
   ```typescript
   app.enableCors({
     origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
     credentials: true,
   });
   ```

2. Helmet telepítése és konfigurálása:
   ```bash
   npm install helmet
   ```
   ```typescript
   import helmet from 'helmet';
   app.use(helmet());
   ```

3. Rate limiting:
   ```typescript
   import { ThrottlerModule } from '@nestjs/throttler';

   ThrottlerModule.forRoot([{
     ttl: 60000,
     limit: 10,
   }])
   ```

#### Feladat #7: Health Check Endpoint
**Prioritás:** KÖZEPES
**Becsült idő:** 30 perc

**Lépések:**
1. Implementálja a Health Controller-t:
   - Endpoint: `GET /api/health`
   - Válasz: `{ status: 'ok', timestamp: '...' }`

2. Opcionálisan Supabase kapcsolat ellenőrzése

#### Feladat #8: Logging
**Prioritás:** KÖZEPES
**Becsült idő:** 45 perc

**Lépések:**
1. Winston logger telepítése:
   ```bash
   npm install winston nest-winston
   ```

2. Logger konfiguráció:
   - Console logging development módban
   - File logging production módban
   - Request/response interceptor

#### Feladat #9: Tesztek
**Prioritás:** KÖZEPES
**Becsült idő:** 1 óra

**Lépések:**
1. Alapvető unit tesztek:
   - Auth service teszt
   - Health controller teszt

2. E2E teszt a health endpointra:
   ```bash
   npm run test:e2e
   ```

#### Feladat #10: Dokumentáció
**Prioritás:** ALACSONY
**Becsült idő:** 30 perc

**Lépések:**
1. Frissítse a `backend/README.md` fájlt:
   - Telepítési utasítások
   - Fejlesztői parancsok (`npm run start:dev`, `npm run test`)
   - API dokumentáció elérése (`/api/docs`)
   - Environment változók magyarázata

2. API dokumentáció a `docs/api/` mappába

#### Deliverable-ek (Átadandó elemek):
- [ ] Futó NestJS API (`npm run start:dev` -> `http://localhost:3000`)
- [ ] Supabase kliens integráció kész
- [ ] Swagger API docs elérhető (`/api/docs`)
- [ ] Health check endpoint működik
- [ ] Auth guard és decorator implementálva (még nincs használva)
- [ ] Environment konfiguráció (.env.example)
- [ ] CORS, helmet, rate limiting beállítva
- [ ] README.md dokumentáció

#### Ellenőrző lista:
- [ ] `npm run build` hibátlanul lefut
- [ ] Nincs TypeScript/ESLint hiba
- [ ] Unit tesztek futnak (`npm run test`)
- [ ] E2E teszt sikeres (`npm run test:e2e`)
- [ ] `GET /api/health` válaszol
- [ ] Swagger UI betöltődik
- [ ] Supabase kliens létrehozható (nincs connection error)

---

### 4.3 Agent: `devops-infrastructure-engineer`

**Felelősség:** Supabase setup, CI/CD pipeline, infrastruktúra alapok

#### Feladat #1: Supabase Projekt Setup
**Prioritás:** KRITIKUS
**Becsült idő:** 2 óra

**Konkrét lépések:**

1. **Supabase Projekt Létrehozása:**
   - Menjen a [Supabase Dashboard](https://app.supabase.com)-ra
   - Hozzon létre új projektet:
     - Név: `kozlekedesi-jegykezelo`
     - Adatbázis jelszó: Erős jelszó (tárolja biztonságosan!)
     - Régió: Europe (Frankfurt vagy legközelebbi)

2. **Project Settings Mentése:**
   - Project URL: `https://[project-id].supabase.co`
   - `anon` public key
   - `service_role` secret key (CSAK backend használja!)
   - Database password

3. **Dokumentálás:**
   - Hozza létre a `database/SUPABASE_SETUP.md` fájlt
   - Írja le a projekt setup lépéseket
   - Dokumentálja a kulcsok kezelését (NE commitolja a valós kulcsokat!)

4. **RLS (Row Level Security) Engedélyezése:**
   - SQL Editor-ban futtassa:
   ```sql
   -- RLS engedélyezése minden táblára (később)
   ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
   ```

#### Feladat #2: Adatbázis Schema Inicializálás
**Prioritás:** KRITIKUS
**Becsült idő:** 3 óra

**Lépések:**

1. **Auth Schema Konfiguráció:**
   - Supabase Auth már be van kapcsolva alapértelmezetten
   - Engedélyezze a Google OAuth-ot:
     - Dashboard -> Authentication -> Providers -> Google
     - Adja meg a Google OAuth credentials-t (később a frontend fejlesztő állítja be)

2. **Users Tábla Létrehozása:**
   - Fájl: `database/migrations/001_create_users.sql`
   ```sql
   -- Public users tábla (kiegészíti az auth.users-t)
   CREATE TABLE public.users (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     email TEXT UNIQUE NOT NULL,
     name TEXT,
     profile_picture_url TEXT,
     google_id TEXT UNIQUE,
     role TEXT CHECK (role IN ('user', 'admin', 'provider')) DEFAULT 'user',
     notification_preferences JSONB DEFAULT '{}',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- RLS policies
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view own profile"
     ON public.users FOR SELECT
     USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile"
     ON public.users FOR UPDATE
     USING (auth.uid() = id);
   ```

3. **Futtassa a migrációt** a Supabase SQL Editor-ban

4. **Trigger a user profile létrehozásához:**
   ```sql
   -- Automatikus user profil létrehozás regisztrációkor
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.users (id, email, name)
     VALUES (
       NEW.id,
       NEW.email,
       COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

5. **Többi tábla alapjai** (NEM kell teljes adatokkal, csak schema):
   - `database/migrations/002_create_routes.sql`
   - `database/migrations/003_create_stops.sql`
   - `database/migrations/004_create_tickets.sql`

   (Használja a PRD 5. fejezetében található schema-kat)

6. **Seed adatok** (opcionális, de ajánlott):
   - `database/seeds/001_demo_routes.sql`
   - Legalább 2-3 mintajárat 5-10 megállóval

#### Feladat #3: Supabase Storage Setup
**Prioritás:** KÖZEPES
**Becsült idő:** 1 óra

**Lépések:**
1. Hozzon létre Storage bucket-eket:
   - `profile-pictures` (publikus)
   - `ticket-pdfs` (privát, RLS védett)
   - `route-images` (publikus)

2. Storage policies beállítása:
   ```sql
   -- Profil képek: mindenki láthatja, csak saját tölthető fel
   CREATE POLICY "Public profile pictures"
     ON storage.objects FOR SELECT
     USING (bucket_id = 'profile-pictures');

   CREATE POLICY "Users can upload own profile picture"
     ON storage.objects FOR INSERT
     WITH CHECK (
       bucket_id = 'profile-pictures' AND
       auth.uid()::text = (storage.foldername(name))[1]
     );
   ```

#### Feladat #4: GitHub Actions CI/CD Pipeline
**Prioritás:** MAGAS
**Becsült idő:** 3 óra

**Lépések:**

1. **Backend CI Workflow:**
   - Fájl: `.github/workflows/backend-ci.yml`
   ```yaml
   name: Backend CI

   on:
     push:
       branches: [ master, develop ]
       paths:
         - 'backend/**'
     pull_request:
       branches: [ master ]
       paths:
         - 'backend/**'

   jobs:
     test:
       runs-on: ubuntu-latest

       strategy:
         matrix:
           node-version: [20.x]

       steps:
         - uses: actions/checkout@v4

         - name: Use Node.js ${{ matrix.node-version }}
           uses: actions/setup-node@v4
           with:
             node-version: ${{ matrix.node-version }}
             cache: 'npm'
             cache-dependency-path: backend/package-lock.json

         - name: Install dependencies
           working-directory: ./backend
           run: npm ci

         - name: Lint
           working-directory: ./backend
           run: npm run lint

         - name: Run tests
           working-directory: ./backend
           run: npm run test

         - name: Build
           working-directory: ./backend
           run: npm run build
   ```

2. **Frontend CI Workflow:**
   - Fájl: `.github/workflows/frontend-ci.yml`
   ```yaml
   name: Frontend CI

   on:
     push:
       branches: [ master, develop ]
       paths:
         - 'frontend/**'
     pull_request:
       branches: [ master ]
       paths:
         - 'frontend/**'

   jobs:
     test:
       runs-on: ubuntu-latest

       strategy:
         matrix:
           node-version: [20.x]

       steps:
         - uses: actions/checkout@v4

         - name: Use Node.js ${{ matrix.node-version }}
           uses: actions/setup-node@v4
           with:
             node-version: ${{ matrix.node-version }}
             cache: 'npm'
             cache-dependency-path: frontend/package-lock.json

         - name: Install dependencies
           working-directory: ./frontend
           run: npm ci

         - name: Lint
           working-directory: ./frontend
           run: npm run lint

         - name: Run tests
           working-directory: ./frontend
           run: npm run test -- --watch=false --browsers=ChromeHeadless

         - name: Build
           working-directory: ./frontend
           run: npm run build -- --configuration production
   ```

3. **Code Quality Checks:**
   - Fájl: `.github/workflows/code-quality.yml`
   ```yaml
   name: Code Quality

   on: [push, pull_request]

   jobs:
     prettier:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm install -g prettier
         - run: prettier --check "**/*.{ts,js,json,md,yml,yaml}"
   ```

4. **Branch Protection Rules Setup Dokumentáció:**
   - Fájl: `docs/CI_CD_SETUP.md`
   - Írja le, hogyan kell beállítani:
     - Require status checks before merging
     - Require branches to be up to date
     - Require pull request reviews

#### Feladat #5: Development Scripts
**Prioritás:** KÖZEPES
**Becsült idő:** 1.5 óra

**Lépések:**

1. **Dev Setup Script:**
   - Fájl: `scripts/setup-dev.sh` (Unix) ÉS `scripts/setup-dev.bat` (Windows)
   ```bash
   #!/bin/bash
   echo "Setting up development environment..."

   # Check Node.js version
   node_version=$(node -v)
   echo "Node.js version: $node_version"

   # Backend setup
   echo "Installing backend dependencies..."
   cd backend
   npm install
   cp .env.example .env
   echo "Backend ready. Please fill in .env file."
   cd ..

   # Frontend setup
   echo "Installing frontend dependencies..."
   cd frontend
   npm install
   cp .env.example .env
   echo "Frontend ready. Please fill in .env file."
   cd ..

   echo "Setup complete! Next steps:"
   echo "1. Fill in backend/.env with Supabase credentials"
   echo "2. Fill in frontend/.env with Supabase credentials"
   echo "3. Run 'npm run start:dev' in backend/"
   echo "4. Run 'ng serve' in frontend/"
   ```

2. **Database Seed Script:**
   - Fájl: `scripts/seed-database.ts`
   - TypeScript script a Supabase kliens használatával
   - Feltölt demo járatokat, megállókat

3. **README frissítés:**
   - Root `README.md`:
     - Quick Start guide
     - Development workflow
     - Script használat

#### Feladat #6: Environment Template Files
**Prioritás:** MAGAS
**Becsült idő:** 30 perc

**Lépések:**
1. Győződjön meg, hogy léteznek:
   - `backend/.env.example`
   - `frontend/.env.example`
   - `database/.env.example` (ha van lokális Supabase CLI setup)

2. Hozza létre a `ENVIRONMENT_SETUP.md` fájlt:
   - Lépésről lépésre, hogyan kell kitölteni az .env fájlokat
   - Honnan szerezhető be minden kulcs
   - Biztonsági best practice-ek

#### Feladat #7: Monitoring és Logging Setup (Alapok)
**Prioritás:** ALACSONY
**Becsült idő:** 1 óra

**Lépések:**
1. Sentry integráció dokumentálása (telepítés későbbi fázisban):
   - `docs/MONITORING.md` fájl létrehozása
   - Sentry.io setup lépések

2. Supabase Logs használatának dokumentálása:
   - Dashboard -> Logs menü használata

#### Deliverable-ek (Átadandó elemek):
- [ ] Működő Supabase projekt:
  - Auth engedélyezve
  - Users tábla létrehozva és RLS policies beállítva
  - Storage buckets létrehozva
- [ ] Database migrációs fájlok:
  - `001_create_users.sql`
  - `002_create_routes.sql`
  - `003_create_stops.sql`
  - `004_create_tickets.sql`
- [ ] Seed script legalább 3 demo járattal
- [ ] GitHub Actions workflows (backend CI, frontend CI, code quality)
- [ ] Development setup script (Windows + Unix)
- [ ] Dokumentáció:
  - `database/SUPABASE_SETUP.md`
  - `docs/CI_CD_SETUP.md`
  - `ENVIRONMENT_SETUP.md`
  - Frissített root `README.md`

#### Ellenőrző lista:
- [ ] Supabase projekt elérhető és egészséges
- [ ] SQL migráció sikeresen lefutott
- [ ] Auth trigger működik (teszt regisztráció -> user rekord létrejön)
- [ ] GitHub Actions zöld (ha van push)
- [ ] Setup script lefut hiba nélkül
- [ ] .env.example fájlok tartalmaznak minden szükséges változót
- [ ] Dokumentáció érthető és követhető

---

## 5. Végrehajtási Sorrend

A feladatok függőségi sorrendje:

### Fázis 1: Párhuzamos Alapok (1-2 nap)
**Előfeltétel:** Nincs

1. **devops-infrastructure-engineer**:
   - Feladat #1: Supabase Projekt Setup (KRITIKUS)
   - Feladat #2: Adatbázis Schema Inicializálás (KRITIKUS)

2. **angular-frontend-dev**:
   - Feladat #1: Angular Projekt Inicializálás (KRITIKUS)
   - Feladat #2: Environment Konfiguráció (MAGAS)

3. **backend-api-developer**:
   - Feladat #1: NestJS Projekt Inicializálás (KRITIKUS)
   - Feladat #2: Projekt Struktúra Kialakítása (KRITIKUS)

**Kimenet:** Működő üres projektek, Supabase elérhető

---

### Fázis 2: Integráció (2-3 nap)
**Előfeltétel:** Fázis 1 kész

1. **backend-api-developer**:
   - Feladat #3: Supabase Integráció (KRITIKUS)
   - Feladat #4: Environment és Config (MAGAS)
   - Feladat #5: Swagger/OpenAPI Dokumentáció (MAGAS)
   - Feladat #6: CORS és Security (MAGAS)

2. **angular-frontend-dev**:
   - Feladat #3: Projekt Struktúra Kialakítása (MAGAS)
   - Feladat #4: Angular Material Design System Alapok (KÖZEPES)
   - Feladat #5: Routing Alapok (KÖZEPES)

3. **devops-infrastructure-engineer**:
   - Feladat #3: Supabase Storage Setup (KÖZEPES)
   - Feladat #4: GitHub Actions CI/CD Pipeline (MAGAS)

**Kimenet:** Backend API működik Supabase-zel, Frontend buildelődik, CI/CD pipeline él

---

### Fázis 3: Finalizálás (1-2 nap)
**Előfeltétel:** Fázis 2 kész

1. **Minden agent**:
   - Tesztek írása és futtatása
   - Dokumentáció finalizálása
   - Code review és refaktorálás

2. **devops-infrastructure-engineer**:
   - Feladat #5: Development Scripts (KÖZEPES)
   - Feladat #6: Environment Template Files (MAGAS)

3. **backend-api-developer**:
   - Feladat #7: Health Check Endpoint (KÖZEPES)
   - Feladat #8: Logging (KÖZEPES)
   - Feladat #9: Tesztek (KÖZEPES)

4. **angular-frontend-dev**:
   - Feladat #6: Dokumentáció (ALACSONY)

**Kimenet:** Sprint 0 teljes, minden sikerkritérium teljesül

---

### Kritikus Függőségek

```
Supabase Setup (DevOps)
    ↓
Backend Supabase Integration (Backend)
    ↓
Backend Auth Guard (Backend)
    ↓
Frontend Auth Service (Frontend - Sprint 1)

---

Angular Init (Frontend)
    ↓
Material Setup (Frontend)
    ↓
Component Library (Frontend)

---

NestJS Init (Backend)
    ↓
Swagger Setup (Backend)
    ↓
API Endpoints (Sprint 1+)

---

GitHub Actions (DevOps)
    ↓
CI/CD minden commit-ra
```

---

## 6. Szükséges Konfigurációs Fájlok

### 6.1 Backend Konfigurációs Fájlok

| Fájl | Felelős | Cél | Prioritás |
|------|---------|-----|-----------|
| `backend/package.json` | backend-api-developer | NPM függőségek | KRITIKUS |
| `backend/tsconfig.json` | backend-api-developer | TypeScript konfiguráció | KRITIKUS |
| `backend/nest-cli.json` | backend-api-developer | Nest CLI beállítások | KRITIKUS |
| `backend/.env.example` | backend-api-developer + devops | Environment template | KRITIKUS |
| `backend/.eslintrc.js` | backend-api-developer | Linting szabályok | MAGAS |
| `backend/.prettierrc` | backend-api-developer | Code formatting | MAGAS |
| `backend/jest.config.js` | backend-api-developer | Teszt konfiguráció | KÖZEPES |

**Minimális `package.json` script-ek:**
```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "build": "nest build",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint \"{src,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\""
  }
}
```

---

### 6.2 Frontend Konfigurációs Fájlok

| Fájl | Felelős | Cél | Prioritás |
|------|---------|-----|-----------|
| `frontend/package.json` | angular-frontend-dev | NPM függőségek | KRITIKUS |
| `frontend/tsconfig.json` | angular-frontend-dev | TypeScript konfiguráció | KRITIKUS |
| `frontend/angular.json` | angular-frontend-dev | Angular CLI beállítások | KRITIKUS |
| `frontend/.env.example` | angular-frontend-dev + devops | Environment template | KRITIKUS |
| `frontend/.eslintrc.json` | angular-frontend-dev | Linting szabályok | MAGAS |
| `frontend/.prettierrc` | angular-frontend-dev | Code formatting | MAGAS |
| `frontend/karma.conf.js` | angular-frontend-dev | Unit teszt konfiguráció | KÖZEPES |
| `frontend/cypress.config.ts` | angular-frontend-dev | E2E teszt konfiguráció | ALACSONY |

---

### 6.3 DevOps Konfigurációs Fájlok

| Fájl | Felelős | Cél | Prioritás |
|------|---------|-----|-----------|
| `.github/workflows/backend-ci.yml` | devops-infrastructure-engineer | Backend CI pipeline | MAGAS |
| `.github/workflows/frontend-ci.yml` | devops-infrastructure-engineer | Frontend CI pipeline | MAGAS |
| `.github/workflows/code-quality.yml` | devops-infrastructure-engineer | Code quality checks | KÖZEPES |
| `.gitignore` | devops-infrastructure-engineer | Git ignore szabályok | KRITIKUS |
| `database/migrations/*.sql` | devops-infrastructure-engineer | Adatbázis séma | KRITIKUS |
| `scripts/setup-dev.sh` | devops-infrastructure-engineer | Dev setup automata | KÖZEPES |

**Minimális `.gitignore` (root):**
```
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
.angular/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Test coverage
coverage/
.nyc_output/
```

---

### 6.4 Dokumentációs Fájlok

| Fájl | Felelős | Cél | Prioritás |
|------|---------|-----|-----------|
| `README.md` (root) | devops + minden agent | Projekt áttekintés | KRITIKUS |
| `backend/README.md` | backend-api-developer | Backend dokumentáció | MAGAS |
| `frontend/README.md` | angular-frontend-dev | Frontend dokumentáció | MAGAS |
| `frontend/SETUP.md` | angular-frontend-dev | Frontend setup guide | KÖZEPES |
| `database/SUPABASE_SETUP.md` | devops-infrastructure-engineer | Supabase setup | KRITIKUS |
| `docs/CI_CD_SETUP.md` | devops-infrastructure-engineer | CI/CD dokumentáció | MAGAS |
| `ENVIRONMENT_SETUP.md` | devops-infrastructure-engineer | Environment setup | KRITIKUS |

---

## 7. Sikerkritériumok

### 7.1 Funkcionális Sikerkritériumok

- [ ] **Backend API elérhető:**
  - `npm run start:dev` a `backend/` mappában elindítja a szervert
  - `http://localhost:3000/api/health` válaszol `200 OK`-val
  - Swagger UI elérhető: `http://localhost:3000/api/docs`

- [ ] **Frontend alkalmazás elérhető:**
  - `ng serve` a `frontend/` mappában elindítja az alkalmazást
  - `http://localhost:4200` betöltődik hiba nélkül
  - Header és footer komponensek megjelennek

- [ ] **Supabase integráció működik:**
  - Backend sikeresen csatlakozik Supabase-hez (nincs connection error)
  - Users tábla létezik és RLS policies aktívak
  - Auth trigger működik (teszt user regisztráció -> user rekord létrejön)

- [ ] **CI/CD pipeline működik:**
  - GitHub Actions workflow-k zöld státuszban (ha van push)
  - Backend CI: lint, test, build sikeres
  - Frontend CI: lint, test, build sikeres

---

### 7.2 Nem-funkcionális Sikerkritériumok

- [ ] **Code Quality:**
  - Nincs TypeScript fordítási hiba
  - ESLint: 0 error (warning megengedett)
  - Prettier: Minden fájl formázott

- [ ] **Tesztelés:**
  - Backend unit tesztek futnak: `npm run test` (min. 1 teszt)
  - Frontend unit tesztek futnak: `ng test` (min. 1 teszt)
  - Minden generált komponens/service alapértelmezett tesztje átmegy

- [ ] **Dokumentáció:**
  - Root README.md tartalmaz Quick Start guide-ot
  - Backend és Frontend README-k tartalmaznak setup utasításokat
  - `.env.example` fájlok léteznek mindkét projektben

- [ ] **Biztonság:**
  - Nincs .env fájl a git repo-ban
  - Supabase kulcsok NEM hardcode-olva
  - CORS megfelelően konfigurálva

- [ ] **Fejlesztői Élmény:**
  - Setup script (`scripts/setup-dev.sh`) lefut hiba nélkül
  - Hot reload működik (backend: `--watch`, frontend: `ng serve`)
  - Világos hibaüzenetek hibás konfiguráció esetén

---

### 7.3 Ellenőrzési Checklist (Teljes Sprint 0)

**Pre-Delivery Check:**

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run lint         # 0 errors
   npm run test         # All tests pass
   npm run build        # Successful build
   npm run start:dev    # Server starts on :3000
   curl http://localhost:3000/api/health  # Returns 200
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run lint         # 0 errors
   ng test --watch=false --browsers=ChromeHeadless  # All tests pass
   ng build --configuration production  # Successful build
   ng serve             # App starts on :4200
   # Open browser -> http://localhost:4200 -> Page loads
   ```

3. **Supabase:**
   - Login to Supabase Dashboard
   - Check Table Editor -> `users` table exists
   - Check Auth -> Providers -> Google enabled
   - Check Storage -> Buckets exist

4. **GitHub Actions:**
   - Push a test commit
   - Check Actions tab -> All workflows green

5. **Dokumentáció:**
   - README fájlok tartalmaznak minden szükséges információt
   - Environment setup lépések dokumentálva
   - API dokumentáció elérhető

---

## 8. Függőségek és Előfeltételek

### 8.1 Szoftveres Követelmények

Minden agent gépén telepítve kell legyen:

| Szoftver | Verzió | Telepítés | Ellenőrzés |
|----------|--------|-----------|-----------|
| **Node.js** | 20.x LTS | [nodejs.org](https://nodejs.org) | `node --version` |
| **npm** | 10.x+ | Node.js-sel együtt jön | `npm --version` |
| **Git** | 2.x+ | [git-scm.com](https://git-scm.com) | `git --version` |
| **Angular CLI** | 17.x+ | `npm install -g @angular/cli` | `ng version` |
| **Nest CLI** | 10.x+ | `npm install -g @nestjs/cli` | `nest --version` |

**Ajánlott IDE:**
- VS Code + Angular Language Service + Prettier + ESLint extension

---

### 8.2 Hozzáférési Követelmények

| Szolgáltatás | Szükséges Hozzáférés | Felelős Agent | Megjegyzés |
|-------------|---------------------|--------------|-----------|
| **GitHub Repository** | Write access | Minden agent | Commit és push jogosultság |
| **Supabase Dashboard** | Project Owner/Admin | devops-infrastructure-engineer | Projekt létrehozáshoz |
| **Google Cloud Console** | OAuth setup | angular-frontend-dev (később) | Google Auth credentials-hez |

---

### 8.3 Ismereti Követelmények

**Minden agentnek:**
- Git alapvető parancsok (clone, commit, push, pull, branch)
- NPM package management (install, update, scripts)
- Environment változók kezelése (.env)

**angular-frontend-dev:**
- Angular 17+ (standalone components, signals - opcionális)
- TypeScript
- RxJS alapok
- Angular Material használat
- SCSS

**backend-api-developer:**
- NestJS architektúra (modules, controllers, services, providers)
- TypeScript
- RESTful API design
- Supabase Auth flow
- OpenAPI/Swagger

**devops-infrastructure-engineer:**
- PostgreSQL alapok (SQL, migrációk)
- Supabase platform (Auth, Database, Storage, RLS)
- GitHub Actions YAML szintaxis
- Bash scripting (setup scripts)

---

### 8.4 External Services Setup

#### 8.4.1 Supabase Account
1. Hozzon létre ingyenes fiókot: [supabase.com](https://supabase.com)
2. Email megerősítés
3. Szervezet létrehozása (ha kell)

#### 8.4.2 GitHub Repository
1. Repository már létezik: `C:\Users\Szabolcs\BUSZ\szakdolgozat`
2. Győződjön meg, hogy push jogosultság van
3. Branch protection rules beállítása (később, a docs/CI_CD_SETUP.md alapján)

#### 8.4.3 Google OAuth (opcionális Sprint 0-ban)
Sprint 1-ben lesz szükség, de előkészítés:
1. Google Cloud Console projekt létrehozása
2. OAuth 2.0 Client ID generálás
3. Authorized redirect URIs: Supabase callback URL

---

## 9. Következő Lépések (Sprint 0 után)

### 9.1 Sprint 1 Előkészítés

**Backend:**
- Auth modul teljes implementáció (Google login flow)
- User CRUD endpoints
- JWT stratégia finalizálás

**Frontend:**
- Auth guard implementáció
- Login/Signup komponensek
- User service Supabase-zel
- Protected routes

**DevOps:**
- Deployment setup (Netlify + Railway/Render)
- Environment variables production-ben
- Database backup stratégia

---

### 9.2 Technikai Adósság Elkerülése

- **Code review kultúra:** Minden PR-hez legalább 1 approval
- **Teszt lefedettség:** Minden új feature-höz unit teszt
- **Dokumentáció frissítés:** API változáskor Swagger frissítés
- **Security audit:** Dependency vulnerability scan (npm audit)

---

## 10. Kapcsolattartás és Kommunikáció

### 10.1 Agent Szerepek Összefoglaló

| Agent | Felelősség | Elsődleges Terület |
|-------|-----------|-------------------|
| `angular-frontend-dev` | UI/UX, Angular app | `frontend/` |
| `backend-api-developer` | API, üzleti logika | `backend/` |
| `devops-infrastructure-engineer` | Infrastruktúra, CI/CD, DB | `database/`, `.github/workflows/` |

### 10.2 Kommunikációs Protocol

**Dokumentáció alapú munka:**
- Minden agent használja ezt a SPRINT_0_PLAN.md-t mint single source of truth
- Változtatások esetén frissítse a releváns dokumentumokat

**Blocker kezelés:**
- Ha egy agent blokkolva van (pl. Supabase kulcs kell), dokumentálja a `blockers.md` fájlban
- Jelezze a függőségi láncban következő agentnek

**Code ownership:**
- Minden agent felelős a saját területéért
- Közös fájlok (pl. root README.md): utolsó módosító felelős

---

## Verziókezelés

| Verzió | Dátum | Változás | Szerző |
|--------|-------|----------|--------|
| 1.0 | 2025-11-02 | Kezdeti Sprint 0 terv | Product Requirements Architect |

---

## Mellékletek

### A. Hasznos Linkek

- [Angular Dokumentáció](https://angular.dev)
- [NestJS Dokumentáció](https://docs.nestjs.com)
- [Supabase Dokumentáció](https://supabase.com/docs)
- [Angular Material](https://material.angular.io)
- [GitHub Actions](https://docs.github.com/en/actions)

### B. Gyors Parancsok

**Backend:**
```bash
cd backend
npm install                  # Függőségek telepítése
npm run start:dev            # Dev szerver
npm run test                 # Tesztek
npm run lint                 # Linting
```

**Frontend:**
```bash
cd frontend
npm install                  # Függőségek telepítése
ng serve                     # Dev szerver
ng test                      # Tesztek
ng lint                      # Linting
ng build --configuration production  # Production build
```

**Git Workflow:**
```bash
git checkout -b feature/sprint-0-setup
# ... munka ...
git add .
git commit -m "Sprint 0: Setup projekt struktúra"
git push origin feature/sprint-0-setup
# GitHub-on PR nyitás
```

---

**Sprint 0 Status:** READY TO EXECUTE
**Következő akciópontok:** Agenteknek feladatok kiosztása és végrehajtás megkezdése.
