# Design Document — Tourist Safety Features

## Overview

This document covers the technical design for four independent safety modules added to the Tourist Safety App:

1. **SOS Broadcast with Contact Notification** — trusted contacts receive WhatsApp deep links and emails when a user triggers SOS; admins receive real-time SSE notifications.
2. **Offline Safety Mode** — localStorage caching of emergency data, a ServiceWorker for app-shell caching, an offline banner, and an SMS-based SOS fallback.
3. **Admin Broadcast Alerts** — admins compose dismissible banner messages that appear on every user page via a polling component.
4. **Incident Reporting** — users submit geo-tagged incident reports; a map shows nearby unresolved pins; admins review and resolve reports.

Each module is self-contained: it introduces its own MongoDB model(s), Express routes/controllers, and React page(s)/components. All four modules integrate with the existing stack (React 19 + Vite + Tailwind + Framer Motion, Node.js + Express + MongoDB) and reuse the centralized `api.js` Axios instance with JWT interceptor and the `verifyToken` / `verifyAdmin` middleware.

---

## Architecture

```mermaid
graph TD
  subgraph Client [React 19 + Vite]
    A[App.jsx + Routes]
    B[BroadcastBanner]
    C[OfflineBanner]
    D[/emergency-contacts]
    E[/offline-safety]
    F[/report-incident]
    G[/admin/broadcast]
    H[/admin/incidents]
    I[AdminDashboard SSE listener]
    J[api.js Axios + JWT interceptor]
  end

  subgraph Server [Node.js + Express]
    K[contactRoutes]
    L[broadcastRoutes]
    M[incidentRoutes]
    N[alertRoutes extended]
    O[GET /api/admin/sos-stream SSE]
    P[contactController]
    Q[broadcastController]
    R[incidentController]
    S[alertController extended]
    T[sseManager singleton]
  end

  subgraph DB [MongoDB]
    U[(TrustedContact)]
    V[(Broadcast)]
    W[(IncidentReport)]
    X[(Alert existing)]
  end

  A --> B
  A --> C
  D --> J
  E --> J
  F --> J
  G --> J
  H --> J
  I --> O
  J --> K & L & M & N & O
  K --> P --> U
  L --> Q --> V
  M --> R --> W
  N --> S --> X
  S --> T
  T --> O
```

The SSE manager is a module-level singleton (`Map<res, true>`) that holds all open admin SSE response objects. When `alertController.createAlert` fires, it calls `sseManager.broadcast(payload)` after saving the alert document — this is fire-and-forget so the HTTP response is not blocked.

---

## Components and Interfaces

### Backend — New Files

| File | Purpose |
|---|---|
| `server/models/TrustedContact.js` | Mongoose model for trusted contacts |
| `server/models/Broadcast.js` | Mongoose model for admin broadcasts |
| `server/models/IncidentReport.js` | Mongoose model for incident reports |
| `server/controllers/contactController.js` | CRUD for trusted contacts + WhatsApp link helper |
| `server/controllers/broadcastController.js` | CRUD for broadcasts |
| `server/controllers/incidentController.js` | Create/query/resolve incidents |
| `server/utils/sseManager.js` | Singleton SSE client registry + broadcast helper |
| `server/utils/notifier.js` | Async email dispatch via Nodemailer |
| `server/routes/contactRoutes.js` | `/api/contacts` routes |
| `server/routes/broadcastRoutes.js` | `/api/broadcasts` routes |
| `server/routes/incidentRoutes.js` | `/api/incidents` routes |

### Backend — Modified Files

| File | Change |
|---|---|
| `server/controllers/alertController.js` | After saving alert: call `sseManager.broadcast()` and `notifier.notifyContacts()` asynchronously |
| `server/routes/adminRoutes.js` | Add `GET /sos-stream` SSE endpoint |
| `server/server.js` | Register three new route modules |

### Frontend — New Files

| File | Purpose |
|---|---|
| `client/src/pages/EmergencyContacts.jsx` | `/emergency-contacts` — manage trusted contacts |
| `client/src/pages/OfflineSafety.jsx` | `/offline-safety` — cached data + SMS SOS |
| `client/src/pages/ReportIncident.jsx` | `/report-incident` — submit incident + map |
| `client/src/pages/AdminBroadcast.jsx` | `/admin/broadcast` — compose/manage broadcasts |
| `client/src/pages/AdminIncidents.jsx` | `/admin/incidents` — review/resolve incidents |
| `client/src/components/BroadcastBanner.jsx` | Polling banner shown on all user pages |
| `client/src/components/OfflineBanner.jsx` | Network-status banner shown on all pages |
| `client/src/services/contactService.js` | API calls for trusted contacts |
| `client/src/services/broadcastService.js` | API calls for broadcasts |
| `client/src/services/incidentService.js` | API calls for incidents |
| `client/src/utils/offlineCache.js` | localStorage read/write helpers for offline data |
| `client/src/utils/smsLink.js` | Pure function: build `sms:` URI |
| `client/src/utils/whatsappLink.js` | Pure function: build WhatsApp deep link |
| `client/src/utils/boundingBox.js` | Pure function: compute bounding box from lat/lng + radius |
| `public/sw.js` | ServiceWorker for app-shell caching |

### Frontend — Modified Files

| File | Change |
|---|---|
| `client/src/App.jsx` | Add 5 new routes; wrap user layout with `BroadcastBanner` + `OfflineBanner` |
| `client/src/components/Navbar.jsx` | Add nav links for Emergency Contacts, Offline Safety, Report Incident |
| `client/src/pages/AdminDashboard.jsx` | Mount SSE listener for real-time SOS toasts |

---

## Data Models

### TrustedContact

```js
// server/models/TrustedContact.js
{
  userId:    { type: ObjectId, ref: 'User', required: true, index: true },
  name:      { type: String, required: true, trim: true },
  phone:     { type: String, default: null },   // E.164 format recommended
  email:     { type: String, default: null },
  createdAt: { timestamps: true }
}
// Validation: at least one of phone or email must be non-null (pre-validate hook)
// Index: userId (for fast per-user queries)
```

### Broadcast

```js
// server/models/Broadcast.js
{
  message:   { type: String, required: true, maxlength: 500, trim: true },
  createdBy: { type: ObjectId, ref: 'User', required: true },
  active:    { type: Boolean, default: true },
  createdAt: { timestamps: true }
}
// Index: active (for fast active-only queries)
```

### IncidentReport

```js
// server/models/IncidentReport.js
{
  userId:      { type: ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['theft','accident','harassment','other'], required: true },
  description: { type: String, required: true, minlength: 10 },
  lat:         { type: Number, required: true },
  lng:         { type: Number, required: true },
  resolved:    { type: Boolean, default: false },
  createdAt:   { timestamps: true }
}
// Index: { lat: 1, lng: 1 } for bounding-box queries
// Index: resolved (for admin filter queries)
```

### Alert (existing — extended)

The existing `Alert` model is unchanged. The `alertController` is extended to fire async side-effects after saving.

---

## API Routes

### Contact Routes (`/api/contacts`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/contacts` | verifyToken | Return contacts for authenticated user |
| POST | `/api/contacts` | verifyToken | Create a new trusted contact |
| DELETE | `/api/contacts/:id` | verifyToken | Delete contact (must belong to user) |

### Broadcast Routes (`/api/broadcasts`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/broadcasts` | verifyToken + verifyAdmin | Create broadcast |
| GET | `/api/broadcasts` | verifyToken + verifyAdmin | Get all broadcasts (desc) |
| GET | `/api/broadcasts/active` | verifyToken | Get active broadcasts only |
| PATCH | `/api/broadcasts/:id` | verifyToken + verifyAdmin | Update active field |
| DELETE | `/api/broadcasts/:id` | verifyToken + verifyAdmin | Delete broadcast |

### Incident Routes (`/api/incidents`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/incidents` | verifyToken | Create incident report |
| GET | `/api/incidents` | verifyToken | Get unresolved incidents in bounding box |
| GET | `/api/incidents/all` | verifyToken + verifyAdmin | Get all incidents |
| PATCH | `/api/incidents/:id/resolve` | verifyToken + verifyAdmin | Mark incident resolved |

### Admin SSE (`/api/admin/sos-stream`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/sos-stream` | verifyToken + verifyAdmin | Open SSE stream for SOS events |

---

## Detailed Component Design

### sseManager.js

```js
// server/utils/sseManager.js
const clients = new Map(); // res → true

export const addClient = (res) => clients.set(res, true);
export const removeClient = (res) => clients.delete(res);
export const broadcast = (eventType, data) => {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients.keys()) {
    res.write(payload);
  }
};
```

### SSE Endpoint (adminRoutes.js addition)

```js
router.get('/sos-stream', verifyToken, verifyAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  addClient(res);
  req.on('close', () => removeClient(res));
});
```

### alertController.js (extended createAlert)

```js
export const createAlert = async (req, res) => {
  const alert = await Alert.create({ userId, lat, lng });
  res.json({ message: 'Alert sent', alert });

  // fire-and-forget — does NOT block response
  setImmediate(async () => {
    // 1. SSE broadcast to admins
    sseManager.broadcast('sos', {
      userId: alert.userId,
      userEmail: alert.userId,   // userId stores email in existing model
      lat: alert.lat,
      lng: alert.lng,
      createdAt: alert.createdAt,
    });
    // 2. Notify trusted contacts
    await notifier.notifyContacts(alert);
  });
};
```

### notifier.js

```js
// server/utils/notifier.js
import nodemailer from 'nodemailer';
import TrustedContact from '../models/TrustedContact.js';
import User from '../models/User.js';

const transporter = nodemailer.createTransport({ /* SMTP config from env */ });

export const notifyContacts = async (alert) => {
  const user = await User.findById(alert.userId).select('name email');
  const contacts = await TrustedContact.find({ userId: alert.userId });
  const trackingLink = `${process.env.APP_BASE_URL}/track/${alert.userId}`;
  const senderName = user?.name || user?.email || 'A tourist';

  for (const contact of contacts) {
    if (contact.email) {
      try {
        await transporter.sendMail({
          to: contact.email,
          subject: `🚨 SOS from ${senderName}`,
          text: `${senderName} has triggered an SOS. Track their location: ${trackingLink}`,
        });
      } catch (err) {
        console.error(`Email failed for contact ${contact._id}:`, err.message);
        // continue to next contact
      }
    }
    // WhatsApp deep links are constructed client-side; no server action needed
  }
};
```

### whatsappLink.js (pure utility)

```js
// client/src/utils/whatsappLink.js
export const buildWhatsAppLink = (e164Phone, trackingLink, senderName) => {
  const message = `🚨 SOS from ${senderName}. Track location: ${trackingLink}`;
  return `https://wa.me/${e164Phone}?text=${encodeURIComponent(message)}`;
};
```

### smsLink.js (pure utility)

```js
// client/src/utils/smsLink.js
export const buildSmsLink = (emergencyNumber, lat, lng) => {
  const coords = (lat != null && lng != null)
    ? ` My location: ${lat.toFixed(5)},${lng.toFixed(5)}`
    : '';
  const body = `🆘 SOS! I need help.${coords}`;
  return `sms:${emergencyNumber}?body=${encodeURIComponent(body)}`;
};
```

### boundingBox.js (pure utility)

```js
// client/src/utils/boundingBox.js
const EARTH_RADIUS_KM = 6371;

export const getBoundingBox = (lat, lng, radiusKm) => {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos((lat * Math.PI) / 180);
  return {
    swLat: lat - latDelta,
    swLng: lng - lngDelta,
    neLat: lat + latDelta,
    neLng: lng + lngDelta,
  };
};
```

### offlineCache.js (localStorage helpers)

```js
// client/src/utils/offlineCache.js
const KEYS = {
  EMERGENCY: 'offline_emergency',
  RISK_ZONES: 'offline_risk_zones',
  SAFETY_TIPS: 'offline_safety_tips',
  LAST_COORDS: 'offline_last_coords',
  CACHE_TS: 'offline_cache_ts',
};

export const saveCache = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
  localStorage.setItem(KEYS.CACHE_TS, new Date().toISOString());
};

export const loadCache = (key) => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
};

export const getCacheTimestamp = () => localStorage.getItem(KEYS.CACHE_TS);
export const CACHE_KEYS = KEYS;
```

### BroadcastBanner.jsx

```jsx
// Polls GET /api/broadcasts/active every 30 s
// Reads dismissed IDs from localStorage key 'dismissed_broadcasts'
// Renders one banner per active, non-dismissed broadcast
// Dismiss: adds id to localStorage array, removes from displayed list
// On poll failure: silently swallows error
```

### OfflineBanner.jsx

```jsx
// Listens to window 'online' / 'offline' events
// Shows fixed top banner when navigator.onLine === false
// On coming back online: hides banner, triggers cache refresh callback
```

### IncidentMap (inside ReportIncident.jsx)

Uses the existing `@react-google-maps/api` `GoogleMap` + `Marker` + `InfoWindow` pattern already established in `AdminDashboard.jsx`. Marker icons are keyed by `IncidentType`:

```js
const INCIDENT_ICONS = {
  theft:      'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  accident:   'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  harassment: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  other:      'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
};
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid TrustedContact creation round-trip

*For any* valid TrustedContact input (name + at least one of phone/email), POSTing to `/api/contacts` and then GETting `/api/contacts` should return a list that includes a contact with the same name and contact details, linked to the authenticated user.

**Validates: Requirements 1.2, 1.5**

---

### Property 2: Invalid email is always rejected

*For any* string that does not match the pattern `^\S+@\S+\.\S+$`, submitting it as the email field of a TrustedContact should result in a 400 response and no new document in the database.

**Validates: Requirements 1.4**

---

### Property 3: TrustedContact ownership isolation

*For any* TrustedContact owned by user A, a DELETE request authenticated as user B should always return HTTP 403 and leave the contact in the database.

**Validates: Requirements 1.11**

---

### Property 4: TrustedContact delete removes from list

*For any* TrustedContact that exists in the database, deleting it via `DELETE /api/contacts/:id` and then calling `GET /api/contacts` should return a list that does not contain that contact.

**Validates: Requirements 1.6**

---

### Property 5: WhatsApp deep link format

*For any* E.164 phone number and any tracking link string, `buildWhatsAppLink(phone, trackingLink, senderName)` should return a string that starts with `https://wa.me/` followed by the phone number, contains `?text=`, and whose decoded `text` parameter contains the tracking link.

**Validates: Requirements 2.2**

---

### Property 6: Notification message always contains user identifier and tracking link

*For any* user (with or without a name field) and any SOS alert, the notification message constructed by the notifier should always contain either the user's name or email, and should always contain the live tracking link in the form `{APP_BASE_URL}/track/{userId}`.

**Validates: Requirements 2.4**

---

### Property 7: SSE event payload completeness

*For any* SOS alert document, the SSE event emitted by `sseManager.broadcast` should contain all five required fields: `userId`, `userEmail`, `lat`, `lng`, and `createdAt`, and none of these fields should be `undefined`.

**Validates: Requirements 3.3**

---

### Property 8: SMS SOS link format

*For any* emergency number and any combination of coordinates (including null), `buildSmsLink(number, lat, lng)` should return a string that starts with `sms:` followed by the emergency number, contains `?body=`, and whose decoded body is URL-encoded.

**Validates: Requirements 5.2, 5.5**

---

### Property 9: Cache timestamp is always written on refresh

*For any* call to `saveCache(key, data)`, the value returned by `getCacheTimestamp()` immediately after should be a valid ISO 8601 date string that is greater than or equal to the timestamp recorded before the call.

**Validates: Requirements 4.1, 4.8**

---

### Property 10: Whitespace-only broadcast is always rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), POSTing it as the `message` field to `POST /api/broadcasts` should return a 400 response and no new Broadcast document should be created.

**Validates: Requirements 6.3**

---

### Property 11: Broadcast list is always ordered by createdAt descending

*For any* set of N Broadcast documents created at distinct timestamps, `GET /api/broadcasts` should return them in strictly descending `createdAt` order.

**Validates: Requirements 6.5**

---

### Property 12: Deactivated broadcast is excluded from active endpoint

*For any* Broadcast that has been deactivated via `PATCH /api/broadcasts/:id` with `{ active: false }`, a subsequent call to `GET /api/broadcasts/active` should not include that broadcast in its response.

**Validates: Requirements 6.6, 7.3**

---

### Property 13: Broadcast delete removes from all-broadcasts list

*For any* Broadcast, deleting it via `DELETE /api/broadcasts/:id` and then calling `GET /api/broadcasts` should return a list that does not contain that broadcast's id.

**Validates: Requirements 6.7**

---

### Property 14: Non-admin JWT is always rejected on broadcast write endpoints

*For any* user JWT with `role: "user"`, POST, PATCH, and DELETE requests to `/api/broadcasts` should always return HTTP 403.

**Validates: Requirements 6.12**

---

### Property 15: Active broadcasts are all rendered with dismiss buttons

*For any* list of N active Broadcast documents returned by the API, the BroadcastBanner component should render exactly N message elements and exactly N dismiss buttons (excluding any broadcasts whose ids are in the dismissed localStorage set).

**Validates: Requirements 7.4**

---

### Property 16: Dismissed broadcast id is persisted and suppresses re-render

*For any* active Broadcast, after the user dismisses it, the broadcast's id should appear in the `dismissed_broadcasts` localStorage array, and re-rendering the BroadcastBanner with the same active list should not display that broadcast.

**Validates: Requirements 7.5**

---

### Property 17: Valid incident report creation round-trip

*For any* valid incident report (type ∈ enum, description ≥ 10 chars, valid coordinates), POSTing to `/api/incidents` should create a document with all required fields (`userId`, `type`, `description`, `lat`, `lng`, `resolved: false`, `createdAt`) and the document should be retrievable via `GET /api/incidents` with an appropriate bounding box.

**Validates: Requirements 8.2, 8.3**

---

### Property 18: Short description is always rejected

*For any* description string with length between 1 and 9 characters (inclusive), POSTing an incident report should return a 400 response and no IncidentReport document should be created.

**Validates: Requirements 8.6**

---

### Property 19: Bounding box correctly encompasses radius

*For any* latitude/longitude pair and any positive radius in km, `getBoundingBox(lat, lng, radiusKm)` should return `{ swLat, swLng, neLat, neLng }` such that the center point is within the box, the box spans approximately `2 * radiusKm` in both dimensions, and `swLat < neLat` and `swLng < neLng`.

**Validates: Requirements 9.2**

---

### Property 20: Incident type maps to distinct marker icon

*For any* two distinct IncidentType values, `INCIDENT_ICONS[type1]` should not equal `INCIDENT_ICONS[type2]` — every type has a unique visual representation.

**Validates: Requirements 9.3**

---

### Property 21: Info window truncates long descriptions

*For any* incident with a description longer than 100 characters, the info window content rendered for that incident should display a description of at most 100 characters.

**Validates: Requirements 9.4**

---

### Property 22: Incident list is always ordered by createdAt descending

*For any* set of N IncidentReport documents, `GET /api/incidents/all` should return them in strictly descending `createdAt` order.

**Validates: Requirements 10.2**

---

### Property 23: Resolve incident is idempotent

*For any* IncidentReport, calling `PATCH /api/incidents/:id/resolve` once or multiple times should always result in `resolved: true` — the operation is idempotent.

**Validates: Requirements 10.4**

---

### Property 24: Non-admin JWT is always rejected on admin incident endpoints

*For any* user JWT with `role: "user"`, GET requests to `/api/incidents/all` and PATCH requests to `/api/incidents/:id/resolve` should always return HTTP 403.

**Validates: Requirements 10.8**

---

### Property 25: Summary counts are accurate

*For any* set of IncidentReport documents with a known mix of resolved and unresolved, the summary counts displayed on `/admin/incidents` should satisfy: `total = resolved + unresolved`, `resolved ≥ 0`, `unresolved ≥ 0`.

**Validates: Requirements 10.9**

---

## Error Handling

### Backend

| Scenario | Response |
|---|---|
| Missing required fields on POST | 400 with descriptive `message` |
| JWT missing or invalid | 403 / 401 (existing middleware) |
| Non-admin on admin endpoint | 403 `"Admin only"` |
| DELETE contact not owned by user | 403 |
| PATCH/DELETE on non-existent document | 404 |
| Email send failure in notifier | Log error, continue loop — does not affect HTTP response |
| SSE client disconnects | `req.on('close')` removes client from sseManager |
| MongoDB error | 500 with `"Internal server error"` |

### Frontend

| Scenario | Handling |
|---|---|
| Geolocation denied / unavailable | Show error message, reveal manual coordinate input |
| No cached data when offline | Show "No cached data available" message with prompt to go online |
| BroadcastBanner poll failure | Silently swallow, retry on next interval |
| SSE connection lost | Browser `EventSource` auto-reconnects; fallback polling at 15 s |
| API 401 response | Existing `api.js` interceptor clears session and redirects to `/` |
| Incident map fetch failure | Show error message, render empty map |
| Form validation errors | Inline field-level messages, form not submitted |

---

## Testing Strategy

### Unit Tests (Vitest)

Focus on pure utility functions and controller logic with mocked dependencies:

- `buildWhatsAppLink` — verify URL format for various phone/name inputs
- `buildSmsLink` — verify `sms:` URI format with and without coordinates
- `getBoundingBox` — verify bounding box math for known lat/lng/radius values
- `offlineCache` helpers — verify read/write/timestamp behavior against mocked localStorage
- `contactController` — verify 403 on cross-user delete, 400 on missing phone+email, 400 on 11th contact
- `broadcastController` — verify whitespace rejection, 500-char limit, ordering
- `incidentController` — verify short description rejection, missing type rejection, bounding box query
- `notifier.notifyContacts` — mock Nodemailer, verify email called per contact with email, error in one contact does not abort others
- `sseManager` — verify `broadcast` writes to all registered clients, `removeClient` stops delivery

### Property-Based Tests (fast-check)

Each property test runs a minimum of 100 iterations. Tests are tagged with the feature and property number.

- **Feature: tourist-safety-features, Property 2**: Generate arbitrary non-email strings → verify 400 from contact POST
- **Feature: tourist-safety-features, Property 3**: Generate two distinct user JWTs + a contact owned by user A → verify DELETE with user B JWT returns 403
- **Feature: tourist-safety-features, Property 5**: Generate arbitrary E.164 phone strings and URL strings → verify `buildWhatsAppLink` output format
- **Feature: tourist-safety-features, Property 6**: Generate users with/without name field → verify notification message contains identifier + tracking link
- **Feature: tourist-safety-features, Property 7**: Generate arbitrary Alert documents → verify SSE payload has all 5 required fields
- **Feature: tourist-safety-features, Property 8**: Generate arbitrary numbers and nullable coordinate pairs → verify `buildSmsLink` output starts with `sms:` and body is URL-encoded
- **Feature: tourist-safety-features, Property 9**: Generate arbitrary cache data → verify `getCacheTimestamp()` returns valid ISO string after `saveCache`
- **Feature: tourist-safety-features, Property 10**: Generate arbitrary whitespace strings → verify broadcast POST returns 400
- **Feature: tourist-safety-features, Property 11**: Generate N broadcasts at distinct timestamps → verify GET returns descending order
- **Feature: tourist-safety-features, Property 14**: Generate user-role JWTs → verify 403 on all broadcast write endpoints
- **Feature: tourist-safety-features, Property 18**: Generate strings of length 1–9 → verify incident POST returns 400
- **Feature: tourist-safety-features, Property 19**: Generate lat/lng pairs and radii → verify bounding box invariants
- **Feature: tourist-safety-features, Property 20**: Enumerate all IncidentType values → verify all icons are distinct strings
- **Feature: tourist-safety-features, Property 21**: Generate descriptions longer than 100 chars → verify info window content ≤ 100 chars
- **Feature: tourist-safety-features, Property 24**: Generate user-role JWTs → verify 403 on admin incident endpoints
- **Feature: tourist-safety-features, Property 25**: Generate arbitrary resolved/unresolved counts → verify `total = resolved + unresolved`

### Integration Tests

- POST `/api/alert` → SSE event received by connected admin client within 5 s
- POST `/api/alert` → email sent to contacts with email addresses (mock SMTP)
- GET `/api/broadcasts/active` → returns only `active: true` documents
- GET `/api/incidents` with bounding box → returns only unresolved incidents within box
- ServiceWorker registration on first app load

### Smoke Tests

- `/emergency-contacts` route redirects unauthenticated users
- `/admin/broadcast` route redirects non-admin users
- `/admin/incidents` route redirects non-admin users
- `/offline-safety` route is accessible to authenticated users
- ServiceWorker is registered in production build
- All new API endpoints return 401/403 without valid JWT
