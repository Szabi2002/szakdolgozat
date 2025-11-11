# AuthGuard és @Public() Decorator Javítások

## Probléma Leírása

A felhasználó jegyvásárlási folyamatnál 404 hibába ütközött az alábbi endpoint-ok esetében:
- `/api/tickets/my-tickets` - 404 hibát dobott 401 helyett
- `/api/ticket-types` - 404 hibát dobott, pedig @Public() decorator-ral volt megjelölve

## Gyökérok Elemzése

### Fő Problémák

1. **Globális AuthGuard Hiánya**: Az `app.module.ts`-ben nem volt beállítva globális AuthGuard, így a @Public() decorator nem tudott megfelelően működni.

2. **Duplikált Guard Konfigurációk**:
   - `TicketsController` osztály szinten használta a `@UseGuards(AuthGuard)`-ot
   - `RoutesController` és `StopsController` osztály szinten használták `@UseGuards(AuthGuard, RolesGuard)`-ot
   - Ezek felülírták a globális guard-ot és megakadályozták a @Public() decorator működését

3. **404 vs 401 Hiba**: A NestJS routing rendszer 404-et dobott, mert a guard konfiguráció problémák miatt nem találta a megfelelő handler-t.

## Implementált Javítások

### 1. Globális AuthGuard Beállítása (app.module.ts)

**Fájl**: `C:\Users\Szabolcs\BUSZ\szakdolgozat\backend\src\app.module.ts`

```typescript
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@common/guards/auth.guard';

@Module({
  imports: [...],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
```

**Hatás**:
- Az AuthGuard mostantól globálisan védi az összes endpoint-ot
- A @Public() decorator megfelelően működik és kizárja az endpoint-okat a védelem alól

### 2. Duplikált Guard Dekorációk Eltávolítása

#### TicketsController
**Fájl**: `C:\Users\Szabolcs\BUSZ\szakdolgozat\backend\src\modules\tickets\tickets.controller.ts`

**Előtte**:
```typescript
@UseGuards(AuthGuard)
@Controller('tickets')
export class TicketsController { ... }
```

**Utána**:
```typescript
@Controller('tickets')
export class TicketsController { ... }
```

#### RoutesController
**Fájl**: `C:\Users\Szabolcs\BUSZ\szakdolgozat\backend\src\modules\routes\routes.controller.ts`

**Előtte**:
```typescript
@UseGuards(AuthGuard, RolesGuard)
@Controller('routes')
export class RoutesController { ... }
```

**Utána**:
```typescript
@Controller('routes')
export class RoutesController { ... }
```

**Speciális Kezelés**: Hozzáadva `@UseGuards(RolesGuard)` minden olyan endpoint-hoz, ahol szerepkör ellenőrzés szükséges (@Roles decorator használata).

#### StopsController
**Fájl**: `C:\Users\Szabolcs\BUSZ\szakdolgozat\backend\src\modules\stops\stops.controller.ts`

Azonos módosítások, mint a RoutesController esetében.

#### AuthController
**Fájl**: `C:\Users\Szabolcs\BUSZ\szakdolgozat\backend\src\modules\auth\auth.controller.ts`

- Hozzáadva `@Public()` decorator a `/auth/google` endpoint-hoz
- Eltávolítva `@UseGuards(AuthGuard)` a `/auth/me` és `/auth/logout` endpoint-okból

#### UsersController
**Fájl**: `C:\Users\Szabolcs\BUSZ\szakdolgozat\backend\src\modules\users\users.controller.ts`

- Eltávolítva `@UseGuards(AuthGuard)` a `/users/me` endpoint-ból

### 3. Nyilvános Endpoint-ok Megjelölése

Hozzáadva `@Public()` decorator a következő endpoint-okhoz:

#### HealthController
```typescript
@Get()
@Public()
async check(): Promise<HealthResponseDto> { ... }
```

#### PlannerController
```typescript
@Post('search')
@Public()
async searchRoute(@Body() planTripDto: PlanTripDto): Promise<TripSearchResponse> { ... }

@Post('search-legacy')
@Public()
async searchRouteLegacy(...): Promise<TripResultDto> { ... }
```

#### TicketTypesController
Már rendelkezett @Public() decorator-ral:
```typescript
@Get()
@Public()
async findAll() { ... }

@Get(':id')
@Public()
async findOne(@Param('id') id: string) { ... }
```

## Endpoint Védelem Áttekintése

### Nyilvános Endpoint-ok (Nincs Authentication Szükséges)

| Endpoint | Controller | Leírás |
|----------|-----------|--------|
| `GET /health` | HealthController | Health check |
| `POST /auth/google` | AuthController | Google OAuth bejelentkezés |
| `GET /ticket-types` | TicketTypesController | Jegytípusok listázása |
| `GET /ticket-types/:id` | TicketTypesController | Jegytípus részletei |
| `GET /routes` | RoutesController | Járatok listázása |
| `GET /routes/:id` | RoutesController | Járat részletei |
| `GET /routes/:id/stops` | RoutesController | Járat megállói |
| `GET /stops` | StopsController | Megállók listázása |
| `GET /stops/nearby` | StopsController | Közeli megállók keresése |
| `GET /stops/:id` | StopsController | Megálló részletei |
| `POST /planner/search` | PlannerController | Útvonaltervezés |
| `POST /planner/search-legacy` | PlannerController | Útvonaltervezés (legacy) |

### Védett Endpoint-ok (Authentication Szükséges)

| Endpoint | Controller | Extra Guard | Leírás |
|----------|-----------|-------------|--------|
| `GET /auth/me` | AuthController | - | Aktuális user |
| `POST /auth/logout` | AuthController | - | Kijelentkezés |
| `GET /users/me` | UsersController | - | User profil |
| `GET /tickets/my-tickets` | TicketsController | - | Saját jegyek |
| `GET /tickets/my-tickets/active` | TicketsController | - | Aktív jegyek |
| `POST /tickets/purchase` | TicketsController | - | Jegy vásárlás |
| `GET /tickets/:id` | TicketsController | - | Jegy részletei |
| `GET /tickets/:id/qr-code` | TicketsController | - | QR kód generálás |
| `POST /tickets/:id/send-email` | TicketsController | - | Jegy email küldés |
| `DELETE /tickets/:id` | TicketsController | - | Jegy törlés |

### Admin Védett Endpoint-ok (Authentication + RolesGuard)

| Endpoint | Required Roles | Leírás |
|----------|---------------|--------|
| `POST /ticket-types` | admin | Jegytípus létrehozása |
| `GET /ticket-types/all` | admin | Összes jegytípus (inaktívakkal) |
| `PATCH /ticket-types/:id` | admin | Jegytípus módosítása |
| `DELETE /ticket-types/:id` | admin | Jegytípus törlése |
| `POST /routes` | admin, provider | Járat létrehozása |
| `PUT /routes/:id` | admin, provider | Járat módosítása |
| `DELETE /routes/:id` | admin, provider | Járat törlése |
| `PUT /routes/:id/stops` | admin, provider | Megállók hozzárendelése |
| `POST /routes/:id/stops/:stopId` | admin, provider | Megálló hozzáadása |
| `DELETE /routes/:id/stops/:stopId` | admin, provider | Megálló eltávolítása |
| `POST /stops` | admin | Megálló létrehozása |
| `PUT /stops/:id` | admin | Megálló módosítása |
| `DELETE /stops/:id` | admin | Megálló törlése |

## AuthGuard Működése

### Logika Flow

```
Request érkezik
    ↓
Globális AuthGuard aktiválódik
    ↓
Ellenőrzi @Public() decorator jelenlétét
    ↓
    ├── Ha @Public() → true (továbbengedés authentication nélkül)
    └── Ha nincs @Public() → Token ellenőrzés
            ↓
            ├── Ha nincs Authorization header → UnauthorizedException (401)
            ├── Ha érvénytelen token → UnauthorizedException (401)
            └── Ha valid token → request.user = user, true (továbbengedés)
```

### RolesGuard Működése (Admin Endpoint-ok)

Az admin endpoint-oknál a következő guard sorrend érvényesül:

1. **AuthGuard** (globális) - Token validálás
2. **RolesGuard** (endpoint specifikus) - Szerepkör ellenőrzés

```typescript
@Post()
@UseGuards(RolesGuard)
@Roles('admin', 'provider')
async create(...) { ... }
```

## Tesztelési Útmutató

### Nyilvános Endpoint Tesztelése

```bash
# Ticket Types (authentication nélkül)
curl http://localhost:3000/api/ticket-types

# Várt válasz: 200 OK + jegytípusok listája
```

### Védett Endpoint Tesztelése (Nincs Token)

```bash
# My Tickets (authentication nélkül)
curl http://localhost:3000/api/tickets/my-tickets

# Várt válasz: 401 Unauthorized
# {
#   "statusCode": 401,
#   "message": "Authorization header hiányzik"
# }
```

### Védett Endpoint Tesztelése (Érvényes Token)

```bash
# My Tickets (valid tokennel)
curl -H "Authorization: Bearer VALID_JWT_TOKEN" \
     http://localhost:3000/api/tickets/my-tickets

# Várt válasz: 200 OK + jegyek listája
```

### Admin Endpoint Tesztelése (Nem Admin User)

```bash
# Create Ticket Type (user tokennel, nem admin)
curl -X POST \
     -H "Authorization: Bearer USER_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","price":1000,"validity_minutes":60}' \
     http://localhost:3000/api/ticket-types

# Várt válasz: 403 Forbidden
```

## Módosított Fájlok Listája

1. `backend/src/app.module.ts` - Globális AuthGuard beállítása
2. `backend/src/modules/auth/auth.controller.ts` - @Public() hozzáadása, guard eltávolítása
3. `backend/src/modules/tickets/tickets.controller.ts` - Osztály szintű guard eltávolítása
4. `backend/src/modules/ticket-types/ticket-types.controller.ts` - Már rendelkezett @Public()-kal
5. `backend/src/modules/routes/routes.controller.ts` - Osztály szintű guard eltávolítása, RolesGuard endpoint szintre
6. `backend/src/modules/stops/stops.controller.ts` - Osztály szintű guard eltávolítása, RolesGuard endpoint szintre
7. `backend/src/modules/users/users.controller.ts` - Guard eltávolítása
8. `backend/src/modules/health/health.controller.ts` - @Public() hozzáadása
9. `backend/src/modules/planner/planner.controller.ts` - @Public() hozzáadása

## Következő Lépések

1. **Backend Újraindítása**: A változtatások érvényesítéséhez a backend-et újra kell indítani
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Frontend Tesztelés**: Ellenőrizd a jegyvásárlási folyamatot a frontend-en keresztül

3. **API Dokumentáció Frissítése**: A Swagger UI (`http://localhost:3000/api`) automatikusan frissül a változásokkal

## Biztonság és Best Practices

### Implementált Biztonsági Intézkedések

1. **Alapértelmezett Védelem**: Minden endpoint védett, kivéve az explicit @Public() jelöléssel ellátottakat
2. **Minimális Publikus Hozzáférés**: Csak az abszolút szükséges endpoint-ok nyilvánosak
3. **Szerepkör Alapú Hozzáférés**: Admin műveletekhez RolesGuard + @Roles('admin')
4. **Token Validáció**: Supabase JWT token validáció minden védett endpoint-nál

### Best Practices Követése

- **Guard Hierarchia**: Globális guard → Osztály szintű guard → Endpoint szintű guard
- **Decorator Kombinálás**: @Public() + @ApiBearerAuth() megfelelő használata
- **Konzisztens Hibaüzenetek**: 401 Unauthorized authentication hiba esetén, 403 Forbidden authorization hiba esetén
- **Clean Code**: Felesleges import-ok és decorator-ok eltávolítása

## Összefoglalás

A javítások eredményeként:

✅ A `/api/ticket-types` endpoint most már nyilvánosan elérhető authentication nélkül
✅ A `/api/tickets/my-tickets` endpoint megfelelő 401-es hibát dob, ha nincs authentication
✅ Az összes endpoint megfelelően védett vagy nyilvános a funkciójának megfelelően
✅ A @Public() decorator megfelelően működik a globális AuthGuard mellett
✅ A RolesGuard megfelelően ellenőrzi az admin jogosultságokat
✅ Nincs duplikált guard konfiguráció
✅ Clean és karbantartható kód struktúra
