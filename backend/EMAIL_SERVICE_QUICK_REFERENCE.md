# Email Service - Gyors Referencia

## Áttekintés

Az Email Service lehetővé teszi jegy megerősítő emailek küldését QR kóddal a felhasználóknak.

## Használat

### API Endpoint

```
POST /api/api/tickets/:id/send-email
Authorization: Bearer <jwt-token>
```

**Példa Request:**

```bash
curl -X POST http://localhost:3000/api/api/tickets/<ticket-id>/send-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Példa Response:**

```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

## Konfiguráció

### SMTP Beállítások (.env)

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@kozlekedes.hu
```

### Támogatott Szolgáltatók

#### 1. Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=<app-specific-password>
```

**App-specific password generálás:**
1. Google Account → Security
2. 2-Step Verification engedélyezés
3. App passwords → Generate
4. Használd a generált jelszót

#### 2. SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
```

#### 3. Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=<your-smtp-login>
SMTP_PASS=<your-smtp-password>
```

## Email Tartalom

### Tartalmazza:

- ✅ Jegy azonosító
- ✅ Ár (kiemelt megjelenítés)
- ✅ Státusz badge (active, expired, stb.)
- ✅ Vásárlás időpontja
- ✅ Érvényességi időszak
- ✅ QR kód (beágyazott kép)
- ✅ QR kód PNG csatolmány
- ✅ Használati utasítások

### Email Formátum:

- **HTML:** Professzionális template, responsive design
- **Plain Text:** Backup szöveges verzió
- **Attachment:** QR kód PNG fájl (`ticket-<id>.png`)

## Működési Módok

### 1. Production Mode (SMTP konfigurálva)

```typescript
// Valós email küldés SMTP-n keresztül
const result = await ticketsService.sendEmail(ticketId, userId);
// { success: true, message: "Email sent successfully" }
```

**Log output:**
```
[EmailService] info: Email sent successfully to user@example.com. Message ID: <msg-id>
[TicketsService] info: Email sent for ticket: <id> to user: <userId> (user@example.com)
```

### 2. Simulation Mode (SMTP nincs konfigurálva)

```typescript
// Szimuláció - nincs valós email küldés
const result = await ticketsService.sendEmail(ticketId, userId);
// { success: true, message: "Email sent successfully (simulation mode...)" }
```

**Log output:**
```
[EmailService] warn: SMTP configuration is missing. Email sending will be simulated.
[EmailService] info: [SIMULATION] Email would be sent to: user@example.com
[TicketsService] info: Email sent for ticket: <id> to user: <userId> (user@example.com)
```

## Error Handling

### Lehetséges Hibák:

#### 1. User Email Hiányzik

```json
{
  "statusCode": 400,
  "message": "User email not found",
  "error": "Bad Request"
}
```

#### 2. Ticket Nem Található

```json
{
  "statusCode": 404,
  "message": "Ticket with ID <id> not found",
  "error": "Not Found"
}
```

#### 3. Email Küldés Sikertelen

```json
{
  "statusCode": 500,
  "message": "Failed to send ticket email",
  "error": "Internal Server Error"
}
```

## Service Használat (Code)

### Injectable Dependency

```typescript
import { EmailService } from '@common/services/email.service';

@Injectable()
export class YourService {
  constructor(
    private readonly emailService: EmailService,
  ) {}

  async sendTicketEmail(ticket: Ticket, user: User) {
    const qrCodeBuffer = await this.generateQRCode(ticket);

    return await this.emailService.sendTicketEmail(
      ticket,
      user,
      qrCodeBuffer,
    );
  }
}
```

### Configuration Check

```typescript
// Ellenőrizd, hogy SMTP konfigurálva van-e
if (this.emailService.isEmailConfigured()) {
  console.log('SMTP is configured - real emails will be sent');
} else {
  console.log('SMTP is NOT configured - simulation mode');
}
```

## Testing

### Unit Test Mock

```typescript
const mockEmailService = {
  sendTicketEmail: jest.fn().mockResolvedValue({
    success: true,
    message: 'Email sent successfully',
  }),
  isEmailConfigured: jest.fn().mockReturnValue(true),
};
```

### Integration Test (MailHog)

1. Indítsd el MailHog-ot:
   ```bash
   docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
   ```

2. Konfiguráld az SMTP-t:
   ```env
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_USER=test
   SMTP_PASS=test
   SMTP_FROM=test@example.com
   ```

3. Nézd meg az emaileket: `http://localhost:8025`

## Troubleshooting

### Problem: "SMTP connection verification failed"

**Megoldás:**
- Ellenőrizd a credentials-t
- Gmail esetén app-specific password használata
- Firewall/port ellenőrzés
- 2FA engedélyezve van-e (Gmail)

### Problem: "Email sent but not received"

**Megoldás:**
- Spam folder ellenőrzés
- SPF/DKIM/DMARC rekordok (production)
- SMTP_FROM email domain validáció
- Email provider rate limits

### Problem: "Port 587 connection timeout"

**Megoldás:**
- Firewall/antivirus ellenőrzés
- ISP port blocking (próbáld 465-ös portot)
- VPN/proxy beállítások

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | No | - | SMTP szerver címe |
| `SMTP_PORT` | No | 587 | SMTP port (587=TLS, 465=SSL) |
| `SMTP_USER` | No | - | SMTP felhasználónév |
| `SMTP_PASS` | No | - | SMTP jelszó |
| `SMTP_FROM` | No | - | Feladó email cím |

**Note:** Ha bármelyik változó hiányzik, simulation mode aktiválódik.

## Best Practices

### Production:

1. ✅ Használj dedikált SMTP szolgáltatást (SendGrid, Mailgun)
2. ✅ Konfigurálj SPF/DKIM/DMARC rekordokat
3. ✅ Email queue használata (Bull/BullMQ)
4. ✅ Rate limiting és retry mechanism
5. ✅ Email analytics és monitoring

### Development:

1. ✅ MailHog vagy MailCatcher használata
2. ✅ Simulation mode alapértelmezetten
3. ✅ Test email címek használata
4. ✅ Email template preview tool

### Security:

1. ✅ SMTP credentials environment variables-ben
2. ✅ SOHA ne commitolj credentials-t
3. ✅ App-specific password használata (Gmail)
4. ✅ TLS/SSL mindig engedélyezve
5. ✅ Input validáció (email format, user permission)

## Related Files

- **Service:** `backend/src/common/services/email.service.ts`
- **Tests:** `backend/src/modules/tickets/tickets.service.spec.ts`
- **Config:** `backend/.env.example`
- **Documentation:** `backend/SPRINT_7_8_BACKEND_COMPLETION_REPORT.md`

## Support

Ha problémába ütközöl:

1. Nézd meg a backend logs-t (`npm run start:dev`)
2. Ellenőrizd az SMTP konfigurációt
3. Teszteld simulation mode-ban először
4. Használj MailHog-ot development-ben

---

**Utolsó frissítés:** 2025-11-11
**Verzió:** 1.0.0
