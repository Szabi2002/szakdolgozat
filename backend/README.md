# Közlekedési Jegykezelő - Backend API

NestJS-alapú REST API a Közlekedési Jegykezelő alkalmazáshoz.

## Technológiák

- **Framework**: NestJS 10.x
- **Runtime**: Node.js 20+ LTS
- **Adatbázis**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT
- **Dokumentáció**: Swagger/OpenAPI
- **Testing**: Jest, Supertest

## Gyors Start

1. **Dependencies telepítése:**
   ```bash
   npm install
   ```

2. **Environment változók:**
   ```bash
   cp .env.example .env
   # Töltsd ki a Supabase credentials-t (lásd database/SUPABASE_SETUP.md)
   ```

3. **Fejlesztői szerver indítása:**
   ```bash
   npm run start:dev
   ```

4. **API elérése:**
   - API: http://localhost:3000/api/health
   - Swagger docs: http://localhost:3000/api/docs

## Parancsok

- `npm run start:dev` - Development mode (watch mode)
- `npm run build` - Production build
- `npm run start:prod` - Production mode
- `npm run lint` - ESLint
- `npm run format` - Prettier formatting
- `npm run test` - Unit tesztek
- `npm run test:e2e` - E2E tesztek
- `npm run test:cov` - Coverage report

## Projekt Struktúra

```
backend/
├── src/
│   ├── main.ts                  # Entry point
│   ├── app.module.ts            # Root module
│   ├── common/                  # Közös komponensek
│   │   ├── guards/              # Auth guard, Role guard
│   │   ├── decorators/          # Custom decorators
│   │   └── supabase/            # Supabase service
│   ├── modules/                 # Feature modulok
│   │   ├── health/              # Health check
│   │   └── auth/                # Authentication (Sprint 1-2)
│   └── config/                  # Configuration
└── test/                        # E2E tesztek
```

## Environment Változók

Lásd `.env.example` fájlt és `docs/ENVIRONMENT_SETUP.md` dokumentációt.

## API Dokumentáció

Swagger UI: http://localhost:3000/api/docs

## További dokumentáció

- [Supabase Setup](../database/SUPABASE_SETUP.md)
- [Environment Setup](../docs/ENVIRONMENT_SETUP.md)
- [CI/CD Guide](../docs/CI_CD_SETUP.md)
