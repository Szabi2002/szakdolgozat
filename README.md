# Közlekedési Jegykezelő és Utazástervező Alkalmazás

> Szakdolgozat projekt - Teljes körű budapesti tömegközlekedési rendszer

[![Angular](https://img.shields.io/badge/Angular-17+-red.svg)](https://angular.io/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Áttekintés

Ez az alkalmazás egy modern, teljes körű tömegközlekedési rendszer, amely egyesíti:

- **Útvonaltervezés** - Google Maps Transit / Citymapper stílusú útvonalkeresés BFS algoritmussal
- **Mobil jegykezelés** - QR kódos jegyvásárlás és validáció
- **Értékelési rendszer** - TripAdvisor stílusú 5 kategóriás értékelések fotókkal
- **Hibabejelentés** - Felhasználói visszajelzések kezelése admin moderációval
- **AI Chatbot** - Intelligens asszisztens közlekedési és általános kérdésekhez


## Technológiai Stack

| Réteg | Technológia | Verzió |
|-------|-------------|--------|
| **Frontend** | Angular | 17+ |
| **UI Framework** | Angular Material | 17+ |
| **Térkép** | Mapbox GL JS | 3.16 |
| **Backend** | NestJS | 10.x |
| **Runtime** | Node.js | 20+ LTS |
| **Adatbázis** | Supabase (PostgreSQL) | Cloud |
| **Autentikáció** | Supabase Auth | Google OAuth 2.0 |
| **Fájltárolás** | Supabase Storage | - |
| **E2E Tesztelés** | Playwright | - |

## Előfeltételek

- **Node.js** 20+ LTS
- **npm** 9+
- **Git**
- Supabase fiók (ingyenes tier elegendő)
- Mapbox fiók (ingyenes tier elegendő)

## Telepítés

### 1. Repository klónozása

```bash
git clone <repository-url>
cd szakdolgozat
```

### 2. Függőségek telepítése

```bash
# Root függőségek (opcionális)
npm install

# Backend függőségek
cd backend
npm install

# Frontend függőségek
cd ../frontend
npm install
```

### 3. Környezeti változók beállítása

#### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
JWT_SECRET=your-jwt-secret-min-32-chars
CORS_ORIGIN=http://localhost:4200

# Email (opcionális)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AI Chatbot (opcionális)
OPENROUTER_API_KEY=your-openrouter-key
```

#### Frontend (`frontend/src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key',
  },
  map: {
    accessToken: 'your-mapbox-token',
    defaultCenter: { lat: 47.4979, lng: 19.0402 },
    defaultZoom: 13,
  },
};
```

### 4. Adatbázis migrációk futtatása

A `database/migrations/` mappában található SQL fájlokat futtasd a Supabase SQL Editor-ban sorrendben.

## Futtatás

### Fejlesztői mód

```bash
# Mindkét szerver egyszerre (root mappából)
npm run dev

# Csak backend (http://localhost:3000)
cd backend && npm run start:dev

# Csak frontend (http://localhost:4200)
cd frontend && npm start
```

### Production build

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## API Dokumentáció

A backend Swagger dokumentációja elérhető fejlesztői módban:

```
http://localhost:3000/api/docs
```

### Főbb végpontok

| Végpont | Metódus | Leírás |
|---------|---------|--------|
| `/api/health` | GET | Health check |
| `/api/auth/login` | POST | Email/jelszó bejelentkezés |
| `/api/auth/google` | POST | Google OAuth bejelentkezés |
| `/api/routes` | GET | Járatok listázása |
| `/api/stops` | GET | Megállók listázása |
| `/api/planner/search` | POST | Útvonaltervezés |
| `/api/tickets/purchase` | POST | Jegyvásárlás |
| `/api/ratings` | GET/POST | Értékelések |
| `/api/reports` | GET/POST | Hibabejelentések |
| `/api/chatbot/message` | POST | AI chatbot |

## Projekt struktúra

```
szakdolgozat/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── common/          # Közös szolgáltatások, guardok
│   │   ├── modules/         # Feature modulok
│   │   │   ├── auth/        # Autentikáció
│   │   │   ├── users/       # Felhasználók
│   │   │   ├── routes/      # Járatok
│   │   │   ├── stops/       # Megállók
│   │   │   ├── planner/     # Útvonaltervező
│   │   │   ├── tickets/     # Jegykezelés
│   │   │   ├── ratings/     # Értékelések
│   │   │   ├── reports/     # Bejelentések
│   │   │   ├── favorites/   # Kedvencek
│   │   │   ├── chatbot/     # AI chatbot
│   │   │   └── admin/       # Admin funkciók
│   │   └── main.ts
│   └── test/
├── frontend/                # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/        # Szolgáltatások, guardok, interceptorok
│   │   │   ├── features/    # Feature modulok
│   │   │   │   ├── auth/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── planner/
│   │   │   │   ├── tickets/
│   │   │   │   ├── ratings/
│   │   │   │   ├── reports/
│   │   │   │   └── admin/
│   │   │   └── shared/      # Közös komponensek
│   │   ├── assets/
│   │   └── environments/
│   └── e2e/                 # Playwright tesztek
├── database/
│   └── migrations/          # SQL migrációk
├── docs/                    # Dokumentáció
└── CLAUDE.md                # AI asszisztens referencia
```

## Főbb funkciók

### Útvonaltervezés

- BFS (Breadth-First Search) alapú algoritmus
- Gyaloglási szegmensek integrációja (max 800m)
- Haversine formula távolságszámításhoz
- Optimalizálási preferenciák: leggyorsabb / legkevesebb átszállás / legkevesebb gyaloglás
- Max 5 alternatív útvonal

### Jegykezelés

- 5 jegytípus: egyszeri, retúr, napijegy, havi bérlet, éves bérlet
- QR kód generálás
- PDF jegy letöltés
- Email értesítések
- Jegy státuszok: aktív, felhasznált, lejárt, visszatérített

### Értékelési rendszer

- 5 értékelési kategória: általános, tisztaság, pontosság, sofőr, kényelem
- Szöveges vélemények (max 500 karakter)
- Fotófeltöltés (max 5 db)
- Admin moderáció
- "Hasznos" szavazás

### AI Chatbot

- OpenRouter API integráció
- Közlekedési információk
- Általános kérdések megválaszolása
- Magyar nyelvi támogatás

## Tesztelés

```bash
# Backend unit tesztek
cd backend && npm test

# Backend coverage
cd backend && npm run test:cov

# Frontend unit tesztek
cd frontend && npm test

# Frontend E2E tesztek
cd frontend && npm run e2e
```

## Deployment

### Frontend (Netlify)

A projekt tartalmaz `netlify.toml` konfigurációt. A deployment automatikus a main branch push-ra.

### Backend (Railway/Render)

1. Hozz létre új projektet
2. Kapcsold össze a GitHub repository-val
3. Állítsd be a környezeti változókat
4. Deploy

### Adatbázis (Supabase)

A Supabase cloud hosting automatikusan biztosított a projekthez.

## Közreműködés

1. Fork-old a repository-t
2. Hozz létre egy feature branch-et (`git checkout -b feature/amazing-feature`)
3. Commit-old a változtatásokat (`git commit -m 'Add amazing feature'`)
4. Push-old a branch-et (`git push origin feature/amazing-feature`)
5. Nyiss egy Pull Request-et

## Licenc

Ez a projekt MIT licenc alatt áll. Lásd a [LICENSE](LICENSE) fájlt a részletekért.

## Szerző

**Szakdolgozat projekt** - Közlekedési Jegykezelő és Utazástervező Alkalmazás

---

*Utolsó frissítés: 2025-01*
