# Implementation Plan: Tourist Safety Features

## Overview

Four independent safety modules are added to the existing React 19 + Vite + Tailwind frontend and Node.js + Express + MongoDB backend. Each feature group is self-contained and can be implemented and tested independently. Backend work (models → controllers → routes) precedes frontend work (services → pages/components) within each group, and each group ends with wiring tasks that integrate the feature into the running app.

---

## Tasks

---

## Feature 1: SOS Broadcast with Contact Notification

- [x] 1. Create the TrustedContact Mongoose model
  - Create `server/models/TrustedContact.js` with fields: `userId` (ObjectId ref User, indexed), `name` (String, required), `phone` (String, default null), `email` (String, default null), `timestamps: true`
  - Add a `pre('validate')` hook that throws a validation error if both `phone` and `email` are null
  - _Requirements: 1.2, 1.3, 1.9_

- [ ] 2. Create the SSE manager utility and the notifier utility
  - [x] 2.1 Create `server/utils/sseManager.js` — module-level `Map<res, true>`, export `addClient`, `removeClient`, and `broadcast(eventType, data)` that writes SSE-formatted strings to all registered response objects
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 2.2 Write unit tests for sseManager
    - Verify `broadcast` writes to all registered clients
    - Verify `removeClient` stops delivery to that client
    - _Requirements: 3.2, 3.3_

  - [x] 2.3 Create `server/utils/notifier.js` — configure Nodemailer transporter from env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`), export `notifyContacts(alert)` that fetches the user and their TrustedContacts, then sends an email per contact that has an email address; errors per contact are caught and logged without aborting the loop
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 2.4 Write unit tests for notifier
    - Mock Nodemailer transporter; verify `sendMail` is called once per contact with an email
    - Verify an error on one contact does not abort processing of remaining contacts
    - Verify message always contains user identifier and tracking link
    - **Property 6: Notification message always contains user identifier and tracking link**
    - **Validates: Requirements 2.4**
    - _Requirements: 2.4, 2.5_

- [ ] 3. Create the contact controller and routes
  - [x] 3.1 Create `server/controllers/contactController.js` with handlers: `getContacts` (return contacts for `req.user._id`), `createContact` (enforce 10-contact limit, validate at least one of phone/email, create document), `deleteContact` (verify ownership, return 403 if mismatch, delete)
    - _Requirements: 1.2, 1.3, 1.7, 1.8, 1.9, 1.10, 1.11_

  - [ ]* 3.2 Write unit tests for contactController
    - Verify 403 is returned when deleting a contact owned by a different user
    - Verify 400 is returned when both phone and email are absent
    - Verify 400 is returned when attempting to create an 11th contact
    - **Property 3: TrustedContact ownership isolation**
    - **Validates: Requirements 1.11**
    - _Requirements: 1.3, 1.7, 1.11_

  - [x] 3.3 Create `server/routes/contactRoutes.js` — `GET /`, `POST /`, `DELETE /:id`, all protected by `verifyToken`
    - _Requirements: 1.8, 1.9, 1.10_

- [ ] 4. Extend alertController and adminRoutes for SSE
  - [x] 4.1 Modify `server/controllers/alertController.js` — after `res.json(...)` in `createAlert`, call `setImmediate` to asynchronously invoke `sseManager.broadcast('sos', payload)` and `notifier.notifyContacts(alert)`; import both utilities
    - _Requirements: 2.6, 2.7, 3.2_

  - [ ]* 4.2 Write property test for SSE event payload completeness
    - **Property 7: SSE event payload completeness**
    - Generate arbitrary Alert-shaped objects; verify `broadcast` payload always contains `userId`, `userEmail`, `lat`, `lng`, `createdAt` and none are `undefined`
    - **Validates: Requirements 3.3**
    - _Requirements: 3.3_

  - [x] 4.3 Add `GET /sos-stream` SSE endpoint to `server/routes/adminRoutes.js` — set SSE headers, flush, call `addClient(res)`, remove on `req.on('close')`
    - _Requirements: 3.1, 3.5_

- [ ] 5. Create the whatsappLink utility and contactService
  - [x] 5.1 Create `client/src/utils/whatsappLink.js` — export `buildWhatsAppLink(e164Phone, trackingLink, senderName)` that returns `https://wa.me/{phone}?text={encodedMessage}`
    - _Requirements: 2.2, 2.8_

  - [ ]* 5.2 Write property test for WhatsApp deep link format
    - **Property 5: WhatsApp deep link format**
    - Generate arbitrary E.164 phone strings and URL strings; verify output starts with `https://wa.me/`, contains `?text=`, and decoded text contains the tracking link
    - **Validates: Requirements 2.2**
    - _Requirements: 2.2_

  - [x] 5.3 Create `client/src/services/contactService.js` — export `getContacts()`, `createContact(data)`, `deleteContact(id)` using the existing `api.js` Axios instance
    - _Requirements: 1.8, 1.9, 1.10_

- [x] 6. Build the EmergencyContacts page
  - Create `client/src/pages/EmergencyContacts.jsx`
  - On mount, fetch and display the user's TrustedContacts via `contactService.getContacts()`
  - Render an add-contact form with fields: name (required), phone (optional), email (optional); show inline validation errors for missing phone+email and invalid email format
  - On submit, call `contactService.createContact(data)`; show limit-reached error if server returns 400 for 11th contact
  - Each contact row shows a WhatsApp deep link button (built with `buildWhatsAppLink`) if phone is present, and a delete button that calls `contactService.deleteContact(id)` and removes the row from state without reload
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.8_

- [x] 7. Mount SSE listener on AdminDashboard
  - Modify `client/src/pages/AdminDashboard.jsx` — on mount, open an `EventSource` to `/api/admin/sos-stream`; on `sos` event, display a non-blocking toast with the user's email and a link to `/track/{userId}`; on error, fall back to polling `GET /api/admin/alerts` every 15 s; close `EventSource` on unmount
  - _Requirements: 3.1, 3.4, 3.5, 3.6_

- [x] 8. Wire Feature 1 into the app
  - Register `contactRoutes` in `server/server.js` as `app.use('/api/contacts', contactRoutes)`
  - Add route `<Route path="/emergency-contacts" element={<ProtectedRoute><EmergencyContacts /></ProtectedRoute>} />` in `client/src/App.jsx`
  - Add nav link `{ path: '/emergency-contacts', label: '📞 Emergency Contacts' }` to `NAV_LINKS` in `client/src/components/Navbar.jsx`
  - _Requirements: 1.1, 1.8_

- [ ] 9. Checkpoint — Feature 1
  - Ensure all tests pass, ask the user if questions arise.

---

## Feature 2: Offline Safety Mode

- [x] 10. Create the offlineCache utility and smsLink utility
  - [x] 10.1 Create `client/src/utils/offlineCache.js` — define `CACHE_KEYS` constant object, export `saveCache(key, data)` (writes JSON + updates `offline_cache_ts` to `new Date().toISOString()`), `loadCache(key)` (parses JSON or returns null), `getCacheTimestamp()` (reads `offline_cache_ts`)
    - _Requirements: 4.1, 4.8_

  - [ ]* 10.2 Write property test for cache timestamp
    - **Property 9: Cache timestamp is always written on refresh**
    - Generate arbitrary cache data; verify `getCacheTimestamp()` returns a valid ISO 8601 string ≥ the timestamp recorded before the call
    - **Validates: Requirements 4.1, 4.8**
    - _Requirements: 4.1, 4.8_

  - [x] 10.3 Create `client/src/utils/smsLink.js` — export `buildSmsLink(emergencyNumber, lat, lng)` that returns `sms:{number}?body={encodedMessage}`; include coordinates in body if non-null, omit if null
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ]* 10.4 Write property test for SMS SOS link format
    - **Property 8: SMS SOS link format**
    - Generate arbitrary emergency numbers and nullable coordinate pairs; verify output starts with `sms:` followed by the number, contains `?body=`, and body is URL-encoded
    - **Validates: Requirements 5.2, 5.5**
    - _Requirements: 5.2, 5.5_

- [x] 11. Create the OfflineBanner component
  - Create `client/src/components/OfflineBanner.jsx` — listen to `window` `online`/`offline` events; show a fixed top banner when `navigator.onLine === false`; on coming back online, hide banner and invoke an optional `onOnline` callback prop for cache refresh
  - _Requirements: 4.3, 4.4_

- [x] 12. Build the OfflineSafety page
  - Create `client/src/pages/OfflineSafety.jsx`
  - On mount (when online), fetch emergency numbers, risk zone summary, and safety tips from existing API endpoints and persist them via `offlineCache.saveCache`
  - Display cached data from `offlineCache.loadCache` for each key; show last-refreshed timestamp from `getCacheTimestamp()`
  - If no cached data exists and device is offline, show "No cached data available" message with prompt to connect
  - Provide a "Refresh Cache" button (visible when online) that re-fetches and overwrites the cache
  - Display an always-visible SMS SOS button; on click, attempt `navigator.geolocation.getCurrentPosition`, fall back to `loadCache(CACHE_KEYS.LAST_COORDS)`, then call `buildSmsLink` and open the resulting URI; if no coordinates available, show a warning and still open the SMS link without coordinates
  - _Requirements: 4.1, 4.5, 4.6, 4.7, 4.8, 4.9, 5.1, 5.2, 5.3, 5.4_

- [x] 13. Register the ServiceWorker
  - Create `tourist-safety-app/client/public/sw.js` — implement `install` event to cache app-shell assets (index.html, main JS bundle, main CSS bundle) and `fetch` event to serve from cache with network fallback
  - In `client/src/main.jsx`, register the ServiceWorker on load: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')`
  - _Requirements: 4.2_

- [x] 14. Wire Feature 2 into the app
  - Add route `<Route path="/offline-safety" element={<ProtectedRoute><OfflineSafety /></ProtectedRoute>} />` in `client/src/App.jsx`
  - Wrap the authenticated user layout in `App.jsx` with `<OfflineBanner />` so it appears on every page
  - Add nav link `{ path: '/offline-safety', label: '📶 Offline Safety' }` to `NAV_LINKS` in `Navbar.jsx`
  - _Requirements: 4.3, 4.5_

- [ ] 15. Checkpoint — Feature 2
  - Ensure all tests pass, ask the user if questions arise.

---

## Feature 3: Admin Broadcast Alerts

- [x] 16. Create the Broadcast Mongoose model
  - Create `server/models/Broadcast.js` with fields: `message` (String, required, maxlength 500, trim), `createdBy` (ObjectId ref User, required), `active` (Boolean, default true), `timestamps: true`
  - Add index on `active` field
  - _Requirements: 6.2, 6.8_

- [ ] 17. Create the broadcast controller and routes
  - [x] 17.1 Create `server/controllers/broadcastController.js` with handlers: `createBroadcast` (reject whitespace-only or >500-char messages with 400), `getAllBroadcasts` (return all, sorted `createdAt` desc), `getActiveBroadcasts` (return only `active: true`), `updateBroadcast` (update `active` field), `deleteBroadcast` (delete document, 404 if not found)
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11_

  - [ ]* 17.2 Write unit tests for broadcastController
    - Verify whitespace-only message returns 400 and no document is created
    - Verify message >500 chars returns 400
    - Verify `getAllBroadcasts` returns documents in descending `createdAt` order
    - **Property 10: Whitespace-only broadcast is always rejected**
    - **Property 11: Broadcast list is always ordered by createdAt descending**
    - **Validates: Requirements 6.3, 6.5**
    - _Requirements: 6.3, 6.4, 6.5_

  - [x] 17.3 Create `server/routes/broadcastRoutes.js`:
    - `POST /` — `verifyToken` + `verifyAdmin` → `createBroadcast`
    - `GET /` — `verifyToken` + `verifyAdmin` → `getAllBroadcasts`
    - `GET /active` — `verifyToken` → `getActiveBroadcasts`
    - `PATCH /:id` — `verifyToken` + `verifyAdmin` → `updateBroadcast`
    - `DELETE /:id` — `verifyToken` + `verifyAdmin` → `deleteBroadcast`
    - _Requirements: 6.8, 6.9, 6.10, 6.11, 6.12, 7.3_

  - [ ]* 17.4 Write property test for non-admin JWT rejection on broadcast write endpoints
    - **Property 14: Non-admin JWT is always rejected on broadcast write endpoints**
    - Generate user-role JWTs; verify POST, PATCH, DELETE to `/api/broadcasts` always return 403
    - **Validates: Requirements 6.12**
    - _Requirements: 6.12_

- [ ] 18. Create the broadcastService and BroadcastBanner component
  - [x] 18.1 Create `client/src/services/broadcastService.js` — export `getActiveBroadcasts()`, `getAllBroadcasts()`, `createBroadcast(data)`, `updateBroadcast(id, data)`, `deleteBroadcast(id)` using `api.js`
    - _Requirements: 6.8, 6.9, 7.2_

  - [x] 18.2 Create `client/src/components/BroadcastBanner.jsx` — on mount, poll `broadcastService.getActiveBroadcasts()` every 30 s; read dismissed IDs from `localStorage.getItem('dismissed_broadcasts')` (JSON array); render one banner per active non-dismissed broadcast with a dismiss button; on dismiss, add id to localStorage array and remove from displayed list; on poll failure, silently swallow error; render nothing when no active broadcasts
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 18.3 Write unit tests for BroadcastBanner
    - Verify N active broadcasts render N banners and N dismiss buttons
    - Verify dismissed id is stored in localStorage and suppresses re-render
    - **Property 15: Active broadcasts are all rendered with dismiss buttons**
    - **Property 16: Dismissed broadcast id is persisted and suppresses re-render**
    - **Validates: Requirements 7.4, 7.5**
    - _Requirements: 7.4, 7.5_

- [x] 19. Build the AdminBroadcast page
  - Create `client/src/pages/AdminBroadcast.jsx`
  - Render a compose form with a textarea (500-char limit with live counter), submit button; show validation errors for empty/whitespace and over-limit messages
  - On submit, call `broadcastService.createBroadcast(data)` and prepend the new broadcast to the list
  - Display all broadcasts (from `broadcastService.getAllBroadcasts()`) ordered newest-first, showing message, timestamp, active status, a toggle-active button, and a delete button
  - Toggle-active calls `broadcastService.updateBroadcast(id, { active: !current })` and updates state; delete calls `broadcastService.deleteBroadcast(id)` and removes from state
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 20. Wire Feature 3 into the app
  - Register `broadcastRoutes` in `server/server.js` as `app.use('/api/broadcasts', broadcastRoutes)`
  - Add route `<Route path="/admin/broadcast" element={<ProtectedRoute role="admin"><AdminBroadcast /></ProtectedRoute>} />` in `client/src/App.jsx`
  - Wrap the authenticated user layout in `App.jsx` with `<BroadcastBanner />` above the page content (alongside the existing `OfflineBanner`)
  - _Requirements: 6.1, 7.1_

- [ ] 21. Checkpoint — Feature 3
  - Ensure all tests pass, ask the user if questions arise.

---

## Feature 4: Incident Reporting

- [x] 22. Create the IncidentReport Mongoose model
  - Create `server/models/IncidentReport.js` with fields: `userId` (ObjectId ref User, required), `type` (String, enum `['theft','accident','harassment','other']`, required), `description` (String, required, minlength 10), `lat` (Number, required), `lng` (Number, required), `resolved` (Boolean, default false), `timestamps: true`
  - Add compound index `{ lat: 1, lng: 1 }` and index on `resolved`
  - _Requirements: 8.2, 8.3, 8.8_

- [x] 23. Create the boundingBox utility
  - Create `client/src/utils/boundingBox.js` — export `getBoundingBox(lat, lng, radiusKm)` using the haversine-derived formula; return `{ swLat, swLng, neLat, neLng }`
  - _Requirements: 9.1, 9.2_

  - [ ]* 23.1 Write property test for bounding box correctness
    - **Property 19: Bounding box correctly encompasses radius**
    - Generate arbitrary lat/lng pairs and positive radii; verify center is within box, `swLat < neLat`, `swLng < neLng`, and box spans approximately `2 * radiusKm`
    - **Validates: Requirements 9.2**
    - _Requirements: 9.2_

- [ ] 24. Create the incident controller and routes
  - [x] 24.1 Create `server/controllers/incidentController.js` with handlers: `createIncident` (validate type enum and description minlength, attach `req.user._id` as `userId`, create document), `getIncidents` (query by bounding box params `swLat`, `swLng`, `neLat`, `neLng` where `resolved: false`), `getAllIncidents` (return all, sorted `createdAt` desc), `resolveIncident` (set `resolved: true`, 404 if not found — idempotent)
    - _Requirements: 8.2, 8.3, 8.6, 8.7, 8.8, 8.9, 10.2, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 24.2 Write unit tests for incidentController
    - Verify description shorter than 10 chars returns 400 and no document is created
    - Verify missing type returns 400
    - Verify `resolveIncident` is idempotent (calling twice still results in `resolved: true`)
    - Verify `getAllIncidents` returns documents in descending `createdAt` order
    - **Property 18: Short description is always rejected**
    - **Property 23: Resolve incident is idempotent**
    - **Property 22: Incident list is always ordered by createdAt descending**
    - **Validates: Requirements 8.6, 10.4, 10.2**
    - _Requirements: 8.6, 8.7, 10.2, 10.4_

  - [x] 24.3 Create `server/routes/incidentRoutes.js`:
    - `POST /` — `verifyToken` → `createIncident`
    - `GET /` — `verifyToken` → `getIncidents` (bounding box query)
    - `GET /all` — `verifyToken` + `verifyAdmin` → `getAllIncidents`
    - `PATCH /:id/resolve` — `verifyToken` + `verifyAdmin` → `resolveIncident`
    - _Requirements: 8.8, 8.9, 10.5, 10.6, 10.8_

  - [ ]* 24.4 Write property test for non-admin JWT rejection on admin incident endpoints
    - **Property 24: Non-admin JWT is always rejected on admin incident endpoints**
    - Generate user-role JWTs; verify GET `/api/incidents/all` and PATCH `/api/incidents/:id/resolve` always return 403
    - **Validates: Requirements 10.8**
    - _Requirements: 10.8_

- [x] 25. Create the incidentService and INCIDENT_ICONS constant
  - Create `client/src/services/incidentService.js` — export `createIncident(data)`, `getIncidents(bbox)`, `getAllIncidents()`, `resolveIncident(id)` using `api.js`
  - Define and export `INCIDENT_ICONS` map in `client/src/utils/incidentIcons.js` with distinct Google Maps icon URLs for each of the four IncidentType values
  - _Requirements: 8.8, 9.3_

  - [ ]* 25.1 Write unit test for incident type icon uniqueness
    - **Property 20: Incident type maps to distinct marker icon**
    - Enumerate all four IncidentType values; verify all icon URLs are distinct strings
    - **Validates: Requirements 9.3**
    - _Requirements: 9.3_

- [x] 26. Build the ReportIncident page
  - Create `client/src/pages/ReportIncident.jsx`
  - On mount, call `navigator.geolocation.getCurrentPosition` to pre-populate lat/lng fields; on error, show error message and reveal manual coordinate input
  - Render a form with: IncidentType select (required), description textarea (min 10 chars, with inline validation), lat/lng fields (pre-populated); show field-level errors on submit
  - On valid submit, call `incidentService.createIncident(data)` and show success message
  - Render an IncidentMap (`GoogleMap` + `Marker` + `InfoWindow` from `@react-google-maps/api`) showing the user's location and unresolved incident pins within 10 km; fetch incidents using `getBoundingBox(lat, lng, 10)` passed to `incidentService.getIncidents(bbox)`; use `INCIDENT_ICONS` for marker icons; on pin click, show info window with type, description truncated to 100 chars, and relative time; show loading indicator while fetching; show error message if fetch fails
  - _Requirements: 8.1, 8.2, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 26.1 Write unit test for info window description truncation
    - **Property 21: Info window truncates long descriptions**
    - Generate descriptions longer than 100 chars; verify rendered info window content is ≤ 100 chars
    - **Validates: Requirements 9.4**
    - _Requirements: 9.4_

- [x] 27. Build the AdminIncidents page
  - Create `client/src/pages/AdminIncidents.jsx`
  - On mount, fetch all incidents via `incidentService.getAllIncidents()`
  - Display summary counts at the top: total, unresolved, resolved (derived from fetched data)
  - Render a filterable table/list with columns: type, description, coordinates, resolved status, timestamp; provide filter controls for IncidentType and resolved status
  - Each unresolved row has a "Mark Resolved" button that calls `incidentService.resolveIncident(id)` and updates the row's resolved status in state without reload
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.9_

  - [ ]* 27.1 Write unit test for summary count accuracy
    - **Property 25: Summary counts are accurate**
    - Generate arbitrary mixes of resolved/unresolved incidents; verify `total = resolved + unresolved`, both ≥ 0
    - **Validates: Requirements 10.9**
    - _Requirements: 10.9_

- [x] 28. Wire Feature 4 into the app
  - Register `incidentRoutes` in `server/server.js` as `app.use('/api/incidents', incidentRoutes)`
  - Add routes in `client/src/App.jsx`:
    - `<Route path="/report-incident" element={<ProtectedRoute><ReportIncident /></ProtectedRoute>} />`
    - `<Route path="/admin/incidents" element={<ProtectedRoute role="admin"><AdminIncidents /></ProtectedRoute>} />`
  - Add nav link `{ path: '/report-incident', label: '⚠️ Report Incident' }` to `NAV_LINKS` in `Navbar.jsx`
  - _Requirements: 8.1, 10.1_

- [x] 29. Final checkpoint — All features
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints at tasks 9, 15, 21, and 29 ensure incremental validation per feature
- Property tests validate universal correctness properties using fast-check (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The existing `verifyToken` and `verifyAdmin` middleware in `server/middleware/authMiddleware.js` is reused unchanged across all new routes
- The existing `api.js` Axios instance with JWT interceptor is reused unchanged in all new frontend services
