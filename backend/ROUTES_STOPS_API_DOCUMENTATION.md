# Routes & Stops CRUD API Documentation

**Sprint 3-4: US-3.2 & US-3.3 Implementation**

## Overview

Backend API implementáció a járatok (routes) és megállók (stops) kezeléséhez. A rendszer teljes CRUD funkcionalitást biztosít role-based access control (RBAC) támogatással, spatial query lehetőségekkel és Swagger dokumentációval.

## Implemented Features

### Routes API (US-3.2)

#### Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/routes` | Yes | admin, provider | Create new route |
| GET | `/api/routes` | No | Public | Get all routes (paginated) |
| GET | `/api/routes/:id` | No | Public | Get route by ID with stops |
| PUT | `/api/routes/:id` | Yes | admin, provider | Update route (owner only) |
| DELETE | `/api/routes/:id` | Yes | admin, provider | Soft delete route |

#### DTOs

**CreateRouteDto:**
```typescript
{
  route_number: string;    // Required, max 20 chars, e.g., "1A"
  name: string;           // Required, max 255 chars
  is_accessible?: boolean; // Optional, default: false
}
```

**UpdateRouteDto:**
```typescript
{
  route_number?: string;
  name?: string;
  is_accessible?: boolean;
  is_active?: boolean;    // For soft delete
}
```

**RouteFilterDto:**
```typescript
{
  search?: string;       // Search in route_number or name
  provider_id?: string;  // Filter by provider UUID
  page?: number;         // Default: 1
  limit?: number;        // Default: 10, max: 100
}
```

**RouteResponseDto:**
```typescript
{
  id: string;
  route_number: string;
  name: string;
  provider_id: string;
  is_accessible: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  stops_count: number;
  stops?: RouteStopInfo[];  // Only in detail view
}
```

#### Business Logic

- **Creation:** Provider ID automatikusan a JWT token-ből származik
- **Ownership:** Provider csak saját járatait módosíthatja/törölheti, admin mindet
- **Soft Delete:** is_active = false beállítás törlés helyett
- **Pagination:** Default 10 elem/oldal, max 100
- **Search:** route_number és name mezőkben keres (case-insensitive)

### Stops API (US-3.3)

#### Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/stops` | Yes | admin | Create new stop |
| GET | `/api/stops` | No | Public | Get all stops (paginated) |
| GET | `/api/stops/nearby` | No | Public | Find nearby stops (spatial) |
| GET | `/api/stops/:id` | No | Public | Get stop by ID with routes |
| PUT | `/api/stops/:id` | Yes | admin | Update stop |
| DELETE | `/api/stops/:id` | Yes | admin | Delete stop |

#### DTOs

**CreateStopDto:**
```typescript
{
  name: string;           // Required, max 255 chars
  latitude: number;       // Required, -90 to 90
  longitude: number;      // Required, -180 to 180
  type: string;          // Required, enum: bus_stop, tram_stop, metro_station, etc.
  is_accessible?: boolean; // Optional, default: false
}
```

**StopFilterDto:**
```typescript
{
  search?: string;       // Search in name
  type?: string;         // Filter by type
  sw_lat?: number;       // Bounding box: southwest latitude
  sw_lng?: number;       // Bounding box: southwest longitude
  ne_lat?: number;       // Bounding box: northeast latitude
  ne_lng?: number;       // Bounding box: northeast longitude
  page?: number;         // Default: 1
  limit?: number;        // Default: 10, max: 100
}
```

**NearbyStopsDto:**
```typescript
{
  latitude: number;      // Center point latitude
  longitude: number;     // Center point longitude
  radius?: number;       // Search radius in meters, default: 500, max: 10000
}
```

**StopResponseDto:**
```typescript
{
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  is_accessible: boolean;
  created_at: string;
  updated_at: string;
  routes_count: number;
  routes?: StopRouteInfo[];  // Only in detail view
  distance?: number;         // Only in nearby search (meters)
}
```

#### Spatial Query

**Nearby Stops:**
- Tries to use PostGIS RPC function `find_nearby_stops` first
- Falls back to Haversine formula client-side calculation
- Returns stops sorted by distance from center point
- Distance included in response

**Bounding Box:**
- Filter stops within rectangular geographic area
- Useful for map viewport queries

### Security & Authorization

#### Authentication

- JWT token in `Authorization: Bearer <token>` header
- Public endpoints bypass authentication (@Public decorator)
- AuthGuard validates token via Supabase

#### Authorization (RBAC)

- **RolesGuard:** Checks user role from database
- **Roles:**
  - `admin`: Full access to all endpoints
  - `provider`: Can create/update/delete own routes
  - `user`: Read-only access (public endpoints)

**Example Usage:**
```typescript
@Post()
@Roles('admin', 'provider')  // Only admin or provider
@ApiBearerAuth()
async create(@Request() req, @Body() dto: CreateRouteDto) {
  return this.routesService.create(req.user.id, dto);
}

@Get()
@Public()  // Anyone can access
async findAll(@Query() filters: RouteFilterDto) {
  return this.routesService.findAll(filters);
}
```

### Validation

- **class-validator:** All DTOs use decorators for validation
- **class-transformer:** Auto-transforms query params to correct types
- **Global ValidationPipe:** Enabled with:
  - `whitelist: true` - Strip unknown properties
  - `forbidNonWhitelisted: true` - Reject unknown properties
  - `transform: true` - Auto-transform types

**Example:**
```typescript
@ApiProperty({ minimum: 1, maximum: 100 })
@Type(() => Number)
@IsInt()
@Min(1)
@Max(100)
limit?: number = 10;
```

### Error Handling

#### Standard HTTP Status Codes

- `200 OK` - Successful GET/PUT requests
- `201 Created` - Successful POST requests
- `204 No Content` - Successful DELETE requests
- `400 Bad Request` - Validation errors, duplicate entries
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Unexpected errors

#### Error Response Format

```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

**Example:**
```json
{
  "statusCode": 400,
  "message": ["route_number must be shorter than or equal to 20 characters"],
  "error": "Bad Request",
  "timestamp": "2025-01-08T18:30:00.000Z",
  "path": "/api/routes"
}
```

## Database Integration

### Supabase Client

- Global module injection via `SupabaseService`
- Service role key for admin operations
- RLS policies enforced on database level

**Connection:**
```typescript
constructor(private readonly supabaseService: SupabaseService) {}

const supabase = this.supabaseService.getClient();
```

### Queries

**Create:**
```typescript
const { data, error } = await supabase
  .from('routes')
  .insert({ route_number, name, provider_id })
  .select()
  .single();
```

**Read with Relations:**
```typescript
const { data, error } = await supabase
  .from('routes')
  .select(`
    *,
    route_stops (
      stop_order,
      stops (id, name, type, latitude, longitude)
    )
  `)
  .eq('id', id)
  .single();
```

**Pagination:**
```typescript
const offset = (page - 1) * limit;
const { data, count } = await supabase
  .from('routes')
  .select('*', { count: 'exact' })
  .range(offset, offset + limit - 1)
  .order('route_number', { ascending: true });
```

**Soft Delete:**
```typescript
const { data, error } = await supabase
  .from('routes')
  .update({ is_active: false, updated_at: new Date().toISOString() })
  .eq('id', id)
  .select()
  .single();
```

## Testing

### Unit Tests

**Routes Service Tests:**
- ✅ 13/13 tests passing
- Coverage: 85.48% statements, 90% branches
- Tests: create, findAll, findOne, update, remove, checkOwnership

**Stops Service Tests:**
- ✅ 12/12 tests passing
- Coverage: 85.36% statements, 88.23% branches
- Tests: create, findAll, findNearby, findOne, update, remove

**Total Coverage:**
- 25 passing tests
- Routes Service: 85.48% statement coverage
- Stops Service: 85.36% statement coverage

**Run Tests:**
```bash
npm run test -- routes.service.spec.ts
npm run test -- stops.service.spec.ts
npm run test:cov -- --testPathPattern="(routes|stops).service.spec"
```

### Mock Strategy

```typescript
const mockSupabaseClient = {
  from: jest.fn(),
  rpc: jest.fn(),
};

const mockSupabaseService = {
  getClient: jest.fn(() => mockSupabaseClient),
};
```

## Swagger Documentation

### Access

**URL:** `http://localhost:3000/api/docs`

### Features

- **Interactive API Explorer:** Try endpoints directly
- **Authentication:** Bearer token input (persisted in session)
- **Schema Validation:** Request/response examples
- **Grouped by Tags:** Auth, Users, Routes, Stops, Health
- **Sorted Alphabetically:** Tags and operations

### Configuration

```typescript
const config = new DocumentBuilder()
  .setTitle('Közlekedési Jegykezelő API')
  .setDescription('API dokumentáció')
  .setVersion('0.1.0')
  .addBearerAuth()
  .addTag('Routes', 'Járatok kezelése')
  .addTag('Stops', 'Megállók kezelése')
  .build();

SwaggerModule.setup('api/docs', app, document, {
  swaggerOptions: {
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
});
```

## API Examples

### Create Route (Provider)

**Request:**
```bash
POST /api/routes
Authorization: Bearer <provider_jwt_token>
Content-Type: application/json

{
  "route_number": "1A",
  "name": "Kelenföld - Mexikói út",
  "is_accessible": true
}
```

**Response: 201 Created**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "route_number": "1A",
  "name": "Kelenföld - Mexikói út",
  "provider_id": "123e4567-e89b-12d3-a456-426614174000",
  "is_accessible": true,
  "is_active": true,
  "created_at": "2025-01-08T18:30:00.000Z",
  "updated_at": "2025-01-08T18:30:00.000Z",
  "stops_count": 0
}
```

### Get Routes (Public)

**Request:**
```bash
GET /api/routes?search=1A&page=1&limit=10
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "route_number": "1A",
      "name": "Kelenföld - Mexikói út",
      "provider_id": "123e4567-e89b-12d3-a456-426614174000",
      "is_accessible": true,
      "is_active": true,
      "created_at": "2025-01-08T18:30:00.000Z",
      "updated_at": "2025-01-08T18:30:00.000Z",
      "stops_count": 15
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Route Details (Public)

**Request:**
```bash
GET /api/routes/550e8400-e29b-41d4-a716-446655440000
```

**Response: 200 OK**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "route_number": "1A",
  "name": "Kelenföld - Mexikói út",
  "provider_id": "123e4567-e89b-12d3-a456-426614174000",
  "is_accessible": true,
  "is_active": true,
  "created_at": "2025-01-08T18:30:00.000Z",
  "updated_at": "2025-01-08T18:30:00.000Z",
  "stops_count": 2,
  "stops": [
    {
      "id": "stop-1",
      "name": "Kelenföld vasútállomás",
      "type": "bus_stop",
      "latitude": 47.4712,
      "longitude": 19.0237,
      "stop_order": 1
    },
    {
      "id": "stop-2",
      "name": "Móricz Zsigmond körtér",
      "type": "bus_stop",
      "latitude": 47.4803,
      "longitude": 19.0551,
      "stop_order": 2
    }
  ]
}
```

### Find Nearby Stops (Public)

**Request:**
```bash
GET /api/stops/nearby?latitude=47.497913&longitude=19.040236&radius=500
```

**Response: 200 OK**
```json
[
  {
    "id": "stop-1",
    "name": "Deák Ferenc tér M",
    "latitude": 47.497913,
    "longitude": 19.040236,
    "type": "metro_station",
    "is_accessible": true,
    "created_at": "2025-01-08T18:30:00.000Z",
    "updated_at": "2025-01-08T18:30:00.000Z",
    "distance": 0
  },
  {
    "id": "stop-2",
    "name": "Astoria M",
    "latitude": 47.494444,
    "longitude": 19.063889,
    "type": "metro_station",
    "is_accessible": true,
    "created_at": "2025-01-08T18:30:00.000Z",
    "updated_at": "2025-01-08T18:30:00.000Z",
    "distance": 450
  }
]
```

### Create Stop (Admin)

**Request:**
```bash
POST /api/stops
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Deák Ferenc tér M",
  "latitude": 47.497913,
  "longitude": 19.040236,
  "type": "metro_station",
  "is_accessible": true
}
```

**Response: 201 Created**
```json
{
  "id": "stop-123",
  "name": "Deák Ferenc tér M",
  "latitude": 47.497913,
  "longitude": 19.040236,
  "type": "metro_station",
  "is_accessible": true,
  "created_at": "2025-01-08T18:30:00.000Z",
  "updated_at": "2025-01-08T18:30:00.000Z",
  "routes_count": 0
}
```

### Update Route (Owner/Admin)

**Request:**
```bash
PUT /api/routes/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <provider_jwt_token>
Content-Type: application/json

{
  "name": "Kelenföld - Mexikói út (módosított)",
  "is_accessible": false
}
```

**Response: 200 OK**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "route_number": "1A",
  "name": "Kelenföld - Mexikói út (módosított)",
  "provider_id": "123e4567-e89b-12d3-a456-426614174000",
  "is_accessible": false,
  "is_active": true,
  "created_at": "2025-01-08T18:30:00.000Z",
  "updated_at": "2025-01-08T18:35:00.000Z",
  "stops_count": 15
}
```

### Soft Delete Route (Owner/Admin)

**Request:**
```bash
DELETE /api/routes/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <provider_jwt_token>
```

**Response: 200 OK**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "route_number": "1A",
  "name": "Kelenföld - Mexikói út",
  "provider_id": "123e4567-e89b-12d3-a456-426614174000",
  "is_accessible": true,
  "is_active": false,
  "created_at": "2025-01-08T18:30:00.000Z",
  "updated_at": "2025-01-08T18:40:00.000Z",
  "stops_count": 0
}
```

## Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── routes/
│   │   │   ├── dto/
│   │   │   │   ├── create-route.dto.ts
│   │   │   │   ├── update-route.dto.ts
│   │   │   │   ├── route-filter.dto.ts
│   │   │   │   ├── route-response.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── routes.controller.ts
│   │   │   ├── routes.service.ts
│   │   │   ├── routes.service.spec.ts
│   │   │   └── routes.module.ts
│   │   └── stops/
│   │       ├── dto/
│   │       │   ├── create-stop.dto.ts
│   │       │   ├── update-stop.dto.ts
│   │       │   ├── stop-filter.dto.ts
│   │       │   ├── stop-response.dto.ts
│   │       │   └── index.ts
│   │       ├── stops.controller.ts
│   │       ├── stops.service.ts
│   │       ├── stops.service.spec.ts
│   │       └── stops.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── supabase/
│   │       ├── supabase.module.ts
│   │       └── supabase.service.ts
│   ├── app.module.ts
│   └── main.ts
└── package.json
```

## Deployment & Environment

### Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://prhlsuwkokuisqavwfoi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:4200
```

### Build & Run

```bash
# Install dependencies
npm install

# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Tests
npm run test
npm run test:cov
```

## Acceptance Criteria Results

### US-3.2: Routes CRUD API

- ✅ POST /api/routes létrehoz járatot (provider_id JWT-ből)
- ✅ GET /api/routes pagination, search működik
- ✅ GET /api/routes/:id visszaadja stops-al
- ✅ PUT /api/routes/:id csak owner/admin módosíthat
- ✅ DELETE /api/routes/:id soft delete (is_active = false)

### US-3.3: Stops CRUD API

- ✅ POST /api/stops csak admin
- ✅ GET /api/stops/nearby spatial query működik
- ✅ GET /api/stops bounding box szűrés
- ✅ PUT /api/stops/:id csak admin
- ✅ DELETE /api/stops/:id csak ha nincs járathoz rendelve

### General Requirements

- ✅ Swagger docs generálva (`/api/docs`)
- ✅ Unit tesztek min. 50% coverage (85%+ elérve)
- ✅ Role-based authorization működik
- ✅ Input validation minden DTO-ban
- ✅ Error handling centralizált

## Next Steps

1. **Frontend Integration:** Angular service-ek implementálása az új endpoint-okhoz
2. **E2E Tests:** Teljes user flow tesztelése
3. **Performance:** Database indexek optimalizálása
4. **PostGIS:** find_nearby_stops RPC function implementálása az adatbázisban
5. **Route-Stop Relations:** route_stops kapcsolótábla kezelése (add/remove stops to routes)

## Notes

- **Spatial Queries:** Jelenleg fallback Haversine formula, ajánlott PostGIS RPC
- **Soft Delete:** Routes-nál is_active flag, Stops-nál hard delete (használat vizsgálat után)
- **Pagination:** Max 100 elem/oldal a performance érdekében
- **Authentication:** Public endpoint-ok @Public decorator-ral jelölve
- **Authorization:** RolesGuard user_profiles táblából olvassa a role-t

## Documentation

- Swagger UI: `http://localhost:3000/api/docs`
- This file: `backend/ROUTES_STOPS_API_DOCUMENTATION.md`
- Test results: `npm run test:cov`
