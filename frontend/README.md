# Közlekedési Jegykezelő - Frontend

Angular 17+ alkalmazás standalone components-ekkel és Angular Material UI-val.

## Technológiák

- **Framework**: Angular 17+
- **UI Library**: Angular Material
- **State Management**: RxJS (Services-based)
- **HTTP Client**: HttpClient
- **Auth**: Supabase Auth
- **Testing**: Jasmine, Karma

## Gyors Start

1. **Dependencies telepítése:**
   ```bash
   npm install
   ```

2. **Development szerver:**
   ```bash
   npm start
   # vagy
   ng serve
   ```

3. **Alkalmazás elérése:**
   - App: http://localhost:4200
   - Backend API: http://localhost:3000/api

## Parancsok

- `npm start` / `ng serve` - Dev server (http://localhost:4200)
- `npm run build` - Development build
- `npm run build:prod` - Production build
- `npm test` - Unit tesztek (Karma)
- `npm run test:headless` - Headless Chrome tesztek
- `npm run lint` - ESLint
- `npm run format` - Prettier formázás

## Projekt Struktúra

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                   # Singleton services, guards, interceptors
│   │   │   ├── services/           # Supabase, API services
│   │   │   ├── guards/             # Auth guard (Sprint 1-2)
│   │   │   └── interceptors/       # HTTP interceptors (Sprint 1-2)
│   │   ├── shared/                 # Reusable components
│   │   │   ├── components/         # Header, Footer, Spinner
│   │   │   └── material/           # Material module
│   │   ├── features/               # Feature modules
│   │   │   └── home/               # Home page
│   │   ├── app.component.ts        # Root component
│   │   └── app.routes.ts           # Routing
│   ├── environments/               # Environment configs
│   ├── assets/                     # Static assets
│   ├── styles.scss                 # Global styles + Material theme
│   └── index.html                  # HTML entry point
└── angular.json                    # Angular CLI config
```

## Environment Változók

Backend és Supabase kapcsolódási adatok az `src/environments/` mappában.

**environment.ts** (development):
- API URL: http://localhost:3000/api
- Supabase URL: (lásd fájl)

**environment.prod.ts** (production):
- API URL: TBD (deployment után)
- Supabase URL: ugyanaz

## Material Theme

Custom téma közlekedési színekkel:
- **Primary**: Kék (#1976d2)
- **Accent**: Zöld (#43a047)
- **Warn**: Piros

Lásd: `src/styles.scss`

## További dokumentáció

- [Supabase Setup](../database/SUPABASE_SETUP.md)
- [Backend API](../backend/README.md)
- [Environment Setup](../docs/ENVIRONMENT_SETUP.md)
