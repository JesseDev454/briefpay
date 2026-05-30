# BriefPay API Contract

Base URL during local development: `http://localhost:4000/api/v1`

All private endpoints require authentication. Public proposal/payment endpoints use secure public tokens.

---

## 1. Response Format

### Success
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Something went wrong",
    "details": []
  }
}
```

---

## 2. Auth Endpoints

### POST `/auth/signup`
Creates user and workspace.

Request:
```json
{
  "fullName": "Goodluck Kassa",
  "email": "goodluck@example.com",
  "password": "StrongPassword123!",
  "businessName": "JesseDev Studio",
  "profession": "Software Developer",
  "defaultCurrency": "NGN"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "fullName": "Goodluck Kassa", "email": "goodluck@example.com" },
    "workspace": { "id": "uuid", "name": "JesseDev Studio", "defaultCurrency": "NGN" }
  }
}
```

### POST `/auth/login`

Request:
```json
{
  "email": "goodluck@example.com",
  "password": "StrongPassword123!"
}
```

Response includes user/workspace data. Token strategy can be cookie-based or access-token based depending on implementation.

### POST `/auth/refresh`
Rotates refresh token and issues a new access token.

### POST `/auth/logout`
Invalidates refresh token/session.

### GET `/auth/me`
Returns current authenticated user and active workspace.

---

## 3. Client Endpoints

### GET `/clients`
List workspace clients.

Query params:
- `search`
- `page`
- `limit`

### POST `/clients`
Create client.

Request:
```json
{
  "name": "Acme Ltd",
  "email": "client@example.com",
  "phone": "+2348012345678",
  "companyName": "Acme Ltd",
  "notes": "Prefers WhatsApp updates."
}
```

### GET `/clients/:id`
Get client details.

### PATCH `/clients/:id`
Update client.

### DELETE `/clients/:id`
Archive client.

---

## 4. Proposal Endpoints

### GET `/proposals`
List proposals.

Query params:
- `status`
- `clientId`
- `page`
- `limit`

### POST `/proposals`
Create proposal draft.

Request:
```json
{
  "clientId": "uuid",
  "title": "Admin Dashboard Development",
  "currency": "NGN",
  "content": {
    "problemSummary": "Client needs a dashboard to track operations.",
    "proposedSolution": "Build a responsive admin dashboard.",
    "deliverables": ["Authentication", "Dashboard", "Reports"],
    "timeline": "3 weeks",
    "lineItems": [
      { "description": "Frontend development", "quantity": 1, "rate": 80000 }
    ],
    "paymentTerms": "50% deposit before development starts."
  },
  "depositAmount": 40000
}
```

### GET `/proposals/:id`
Get proposal.

### PATCH `/proposals/:id`
Update proposal draft.

### POST `/proposals/:id/send`
Marks proposal as sent and creates/returns public link.

Response:
```json
{
  "success": true,
  "data": {
    "proposalId": "uuid",
    "publicUrl": "https://briefpay.app/p/bp_live_exampletoken"
  }
}
```

### POST `/proposals/:id/cancel`
Cancel proposal.

---

## 5. Public Proposal Endpoints

### GET `/public/proposals/:token`
Returns public proposal data. No login required.

Response should include only client-safe fields.

### POST `/public/proposals/:token/viewed`
Optional endpoint to track view if not handled by GET.

### POST `/public/proposals/:token/accept`
Client accepts proposal.

Request:
```json
{
  "clientName": "Jane Client",
  "clientEmail": "jane@example.com"
}
```

### POST `/public/proposals/:token/request-changes`
Client requests changes.

Request:
```json
{
  "clientName": "Jane Client",
  "clientEmail": "jane@example.com",
  "message": "Can we adjust the timeline?"
}
```

---

## 6. Payment Request Endpoints

### POST `/proposals/:id/payment-request`
Create payment/deposit request for a proposal.

Request:
```json
{
  "title": "Project Deposit",
  "amount": 40000,
  "currency": "NGN",
  "dueDate": "2026-06-15",
  "instructions": "Transfer to the bank account shown below and submit confirmation."
}
```

### GET `/payment-requests/:id`
Private freelancer view.

### PATCH `/payment-requests/:id`
Update request while unpaid.

### POST `/payment-requests/:id/verify`
Freelancer marks payment as verified.

### POST `/payment-requests/:id/reject`
Freelancer rejects payment confirmation.

---

## 7. Public Payment Endpoints

### GET `/public/payment/:token`
Returns payment instruction page.

### POST `/public/payment/:token/confirm`
Client submits payment confirmation.

Request:
```json
{
  "clientName": "Jane Client",
  "paymentMethod": "Bank Transfer",
  "amountPaid": 40000,
  "currency": "NGN",
  "transactionReference": "TRX123456789",
  "note": "Paid from GTBank account",
  "receiptFileId": "uuid-optional"
}
```

Response wording:
```json
{
  "success": true,
  "message": "Payment confirmation submitted. The freelancer will verify it shortly."
}
```

---

## 8. File Endpoints

### POST `/files/upload-url`
Returns signed upload URL or upload instructions.

Request:
```json
{
  "fileName": "receipt.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 312000,
  "purpose": "payment_receipt"
}
```

### POST `/files/complete`
Stores uploaded file metadata after upload.

### GET `/files/:id/signed-url`
Returns temporary signed download URL for authenticated freelancer.

---

## 9. Dashboard Endpoint

### GET `/dashboard/summary`

Response:
```json
{
  "success": true,
  "data": {
    "totalPaidByCurrency": [{ "currency": "NGN", "amount": 250000 }],
    "unpaidByCurrency": [{ "currency": "NGN", "amount": 80000 }],
    "awaitingVerificationCount": 2,
    "activeProposalsCount": 5,
    "acceptedProposalsCount": 3,
    "recentActivity": []
  }
}
```

---

## 10. Settings Endpoints

### GET `/settings/workspace`
Returns workspace profile and payment settings.

### PATCH `/settings/workspace`
Update workspace settings.

Request:
```json
{
  "businessName": "JesseDev Studio",
  "defaultCurrency": "NGN",
  "brandColor": "#2962FF",
  "whatsappNumber": "+2348012345678",
  "paymentInstructions": "Bank transfer preferred.",
  "bankDetails": {
    "bankName": "GTBank",
    "accountName": "Goodluck Kassa",
    "accountNumber": "0000000000"
  },
  "paymentLinks": [
    { "label": "PayPal", "url": "https://paypal.me/example" }
  ]
}
```

---

## 11. Status Codes

- `200` OK
- `201` Created
- `400` Validation error
- `401` Unauthenticated
- `403` Forbidden
- `404` Not found
- `409` Conflict
- `429` Rate limited
- `500` Server error

---

## 12. API Security Rules

- Validate every request body.
- Scope private resources by workspace.
- Public endpoints must only expose safe public fields.
- Rate-limit auth and public confirmation endpoints.
- Store token hashes, not raw tokens.
- Never leak whether an email exists.
