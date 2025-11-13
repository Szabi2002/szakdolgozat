# 🐛 BUG FIX: Route ID UUID Validation - Quick Summary

## Probléma
- ❌ Jegyvásárlás a `/planner` oldalról → **400 Bad Request: "route_id must be a UUID"**
- ✅ Jegyvásárlás a `/user/tickets` oldalról → működött

## Gyökér ok
A frontend `Route.route_id` egy **számított string azonosító** volt (pl. "route-alt-1"), nem pedig egy **valós adatbázis UUID**.

A backend viszont UUID-t várt:
```typescript
@IsUUID('4')
route_id?: string;
```

## Megoldás

### Backend (robusztusabb validáció)
**Fájl**: `backend/src/modules/tickets/dto/purchase-ticket.dto.ts`

```typescript
// Új helper function, ami minden érvénytelen értéket undefined-ra alakít
function normalizeUuidField(value: any): string | undefined {
  if (!value || value === '' || value === 'null' || value === 'undefined') {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || trimmed === 'null' ? undefined : trimmed;
  }
  return undefined;
}

// Alkalmazva minden UUID mezőre
@Transform(({ value }) => normalizeUuidField(value))
@IsOptional()
@ValidateIf((o) => o.route_id !== undefined)
@IsUUID('4', { message: 'route_id must be a valid UUID' })
route_id?: string;
```

### Frontend (UUID kinyerése)
**Fájl**: `frontend/src/app/features/tickets/pages/ticket-purchase/ticket-purchase.component.ts`

```typescript
// Új helper: kinyeri a VALÓS route UUID-t az első transit step-ből
private extractRouteUUID(): string | undefined {
  if (!this.preselectedRoute?.steps) {
    return undefined;
  }

  const firstTransitStep = this.preselectedRoute.steps.find(
    (step: any) => step.type === 'transit' && step.route_id
  );

  if (firstTransitStep?.route_id && this.isValidUUID(firstTransitStep.route_id)) {
    return firstTransitStep.route_id;
  }

  return undefined;
}

// Használat purchase-nél
private purchaseTicket(): void {
  const routeUUID = this.extractRouteUUID(); // ✅ HELYES UUID

  const dto: PurchaseTicketDto = {
    ticket_type_id: this.selectedTicketType.id,
    route_id: routeUUID, // már nem Route.route_id!
    // ...
  };
}
```

## Tesztelt scenáriók
- ✅ Planner → jegyvásárlás (transit route-tal)
- ✅ Planner → jegyvásárlás (csak walking, nincs route_id)
- ✅ My Tickets → jegyvásárlás (nincs route context)
- ✅ Direct `/tickets/purchase` (nincs route)

## Build és teszt eredmények
- ✅ Backend: `npm run build` - SUCCESS
- ✅ Backend: `npm test -- tickets.*.spec.ts` - ALL PASSED (18/18 tests)
- ✅ Frontend: `npm run build` - SUCCESS (csak budget warning-ok)

## Módosított fájlok
**Backend**:
1. `backend/src/modules/tickets/dto/purchase-ticket.dto.ts` - Enhanced UUID validation with `normalizeUuidField()` helper

**Frontend**:
1. `frontend/src/app/features/tickets/pages/ticket-purchase/ticket-purchase.component.ts`
   - Added `isValidUUID()` helper method
   - Added `extractRouteUUID()` method to extract database UUID from transit steps
   - Updated `purchaseTicket()` to use extracted UUID
   - Updated `onProceedToPayment()` to use extracted UUID

## Státusz
✅ **FIXED** - Minden teszt scenario működik

## Jegyzet
Debug logging-ot tesztelési célból használtuk, de production-re már eltávolítottuk.

---

📄 **Részletes dokumentáció**: `BUG_ROUTE_ID_UUID_VALIDATION_FIX.md`
