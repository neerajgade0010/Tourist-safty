# Requirements Document

## Introduction

This document covers four independent safety features for the Tourist Safety App — a React 19 + Vite frontend with a Node.js/Express/MongoDB backend. Each feature is a self-contained module with its own dedicated page(s), backend routes, and data models. The four features are:

1. **SOS Broadcast with Contact Notification** — trusted contacts receive live-tracking links when an SOS is triggered
2. **Offline Safety Mode** — cached emergency data and SMS-based SOS when the device has no internet
3. **Admin Broadcast Alerts** — admins push dismissible banner messages to all active users
4. **Incident Reporting by Tourists** — users submit geo-tagged incident reports; admins review and resolve them

---

## Glossary

- **App**: The Tourist Safety web application (React 19 + Vite frontend, Express/MongoDB backend)
- **User**: An authenticated tourist with `role: "user"` whose JWT is stored in localStorage
- **Admin**: An authenticated user with `role: "admin"`
- **TrustedContact**: A record storing a name, phone number, and/or email address belonging to a User
- **SOS Alert**: An emergency alert document created when a User triggers the SOS button (existing `Alert` model)
- **LiveTrackingLink**: A URL of the form `{APP_BASE_URL}/track/{userId}` that displays the User's real-time location
- **WhatsApp Deep Link**: A URL of the form `https://wa.me/{phone}?text={encodedMessage}` that opens WhatsApp with a pre-filled message
- **OfflineCache**: Data stored in the browser's localStorage or IndexedDB for use when the device is offline
- **ServiceWorker**: A browser background script that intercepts network requests and serves cached responses
- **SMSSosLink**: A `tel:` or `sms:` URI that opens the device's native dialler/SMS app with a pre-filled emergency message
- **Broadcast**: An admin-created message stored in MongoDB and displayed as a dismissible banner to all active Users
- **IncidentReport**: A user-submitted record describing a safety incident with type, description, and geo-coordinates
- **IncidentType**: One of the enumerated values: `theft`, `accident`, `harassment`, `other`
- **ContactNotifier**: The server-side module responsible for dispatching WhatsApp deep links and email notifications to TrustedContacts
- **BroadcastBanner**: The client-side React component that polls for active Broadcasts and renders a dismissible banner
- **OfflineBanner**: The client-side React component that detects network status and renders an offline indicator
- **IncidentMap**: The client-side map component on `/report-incident` that renders IncidentReport pins

---

## Requirements

---

### Requirement 1: Trusted Contact Management

**User Story:** As a User, I want to add, view, and remove trusted contacts, so that the right people are notified when I trigger an SOS.

#### Acceptance Criteria

1. THE App SHALL provide a dedicated page at the route `/emergency-contacts` accessible only to authenticated Users.
2. WHEN a User submits a new TrustedContact form with a valid name and at least one of a valid phone number or valid email address, THE App SHALL persist the TrustedContact to the database linked to that User's account.
3. IF a User submits a TrustedContact form with neither a phone number nor an email address, THEN THE App SHALL display a validation error message and SHALL NOT persist the record.
4. IF a User submits a TrustedContact form with an email address that does not match the pattern `^\S+@\S+\.\S+$`, THEN THE App SHALL display a field-level validation error and SHALL NOT persist the record.
5. THE App SHALL display all TrustedContacts belonging to the authenticated User on the `/emergency-contacts` page.
6. WHEN a User requests deletion of a TrustedContact, THE App SHALL remove that TrustedContact from the database and SHALL remove it from the displayed list without requiring a full page reload.
7. THE App SHALL enforce a maximum of 10 TrustedContacts per User; IF a User attempts to add an 11th TrustedContact, THEN THE App SHALL display an error message stating the limit has been reached and SHALL NOT persist the record.
8. THE ContactNotifier backend module SHALL expose a `GET /api/contacts` endpoint that returns only the TrustedContacts belonging to the authenticated User.
9. THE ContactNotifier backend module SHALL expose a `POST /api/contacts` endpoint protected by JWT authentication that creates a TrustedContact for the authenticated User.
10. THE ContactNotifier backend module SHALL expose a `DELETE /api/contacts/:id` endpoint protected by JWT authentication that deletes a TrustedContact only if it belongs to the authenticated User.
11. IF a `DELETE /api/contacts/:id` request references a TrustedContact that does not belong to the authenticated User, THEN THE ContactNotifier SHALL return HTTP 403.

---

### Requirement 2: SOS Broadcast Notification to Trusted Contacts

**User Story:** As a User, I want my trusted contacts to be automatically notified with my live tracking link when I trigger an SOS, so that they can locate me immediately.

#### Acceptance Criteria

1. WHEN a new SOS Alert is created via `POST /api/alert`, THE ContactNotifier SHALL retrieve all TrustedContacts associated with the alerting User.
2. WHEN a TrustedContact has a phone number, THE App SHALL construct a WhatsApp Deep Link of the form `https://wa.me/{e164Phone}?text={encodedMessage}` where `encodedMessage` includes the LiveTrackingLink for the alerting User.
3. WHEN a TrustedContact has an email address, THE ContactNotifier SHALL send an email containing the LiveTrackingLink to that email address within 30 seconds of the SOS Alert being created.
4. THE ContactNotifier SHALL include the alerting User's name (or email if name is absent) and the LiveTrackingLink in every notification message.
5. IF the email delivery service returns an error for a specific TrustedContact, THEN THE ContactNotifier SHALL log the error and SHALL continue processing remaining TrustedContacts without aborting the SOS Alert creation.
6. THE ContactNotifier SHALL NOT block the HTTP response for `POST /api/alert`; contact notifications SHALL be dispatched asynchronously after the alert document is saved.
7. WHEN a new SOS Alert is created, THE ContactNotifier SHALL emit a server-sent event or WebSocket message to all authenticated Admin sessions within 5 seconds, containing the alerting User's id, email, latitude, and longitude.
8. THE App SHALL display WhatsApp Deep Links as tappable buttons on the `/emergency-contacts` page so Users can manually test contact reachability.

---

### Requirement 3: Admin Real-Time SOS Notification

**User Story:** As an Admin, I want to receive an instant notification when any User triggers an SOS, so that I can respond without relying on page polling.

#### Acceptance Criteria

1. THE App SHALL maintain a persistent Server-Sent Events (SSE) connection from the Admin browser session to the endpoint `GET /api/admin/sos-stream` while the Admin is on the AdminDashboard page.
2. WHEN a new SOS Alert is created, THE App server SHALL push an SSE event of type `sos` to all connected Admin SSE clients within 5 seconds.
3. THE SSE event payload SHALL include the fields: `userId`, `userEmail`, `lat`, `lng`, and `createdAt`.
4. WHEN the Admin browser receives an `sos` SSE event, THE App SHALL display a non-blocking toast notification containing the alerting User's email and a link to the LiveTrackingLink.
5. IF the SSE connection is interrupted, THEN THE App client SHALL attempt to reconnect using the browser's native `EventSource` reconnection with a maximum retry interval of 10 seconds.
6. WHILE an Admin session is not connected to the SSE stream, THE App SHALL fall back to polling `GET /api/admin/alerts` at a 15-second interval.

---

### Requirement 4: Offline Data Caching

**User Story:** As a User, I want emergency numbers, risk zone data, and safety tips to be available when I have no internet connection, so that I can access critical safety information offline.

#### Acceptance Criteria

1. WHEN the App is loaded with an active internet connection, THE App SHALL cache the following data in the browser's localStorage: emergency phone numbers for the current region, risk zone GeoJSON data, and safety tips content.
2. THE App SHALL register a ServiceWorker that caches the App shell (HTML, CSS, JS bundles) on first load so that the `/offline-safety` page renders without a network connection.
3. WHEN the device transitions from online to offline, THE OfflineBanner SHALL appear on every page within 2 seconds of the network change event.
4. WHEN the device transitions from offline to online, THE OfflineBanner SHALL disappear and THE App SHALL refresh cached data from the server.
5. THE App SHALL provide a dedicated page at the route `/offline-safety` accessible to authenticated Users.
6. WHEN the `/offline-safety` page is rendered offline, THE App SHALL display the cached emergency numbers, risk zone summary, and safety tips sourced from the OfflineCache.
7. IF no cached data exists when the device is offline, THEN THE App SHALL display a message stating that no cached data is available and SHALL prompt the User to connect to the internet to download safety data.
8. THE App SHALL display the timestamp of the last successful cache refresh on the `/offline-safety` page.
9. WHEN the App is online and the User visits `/offline-safety`, THE App SHALL offer a manual "Refresh Cache" button that re-fetches and overwrites the OfflineCache.

---

### Requirement 5: SMS-Based Offline SOS

**User Story:** As a User with no internet connection, I want to send an SOS via SMS, so that I can call for help even when the app cannot reach the server.

#### Acceptance Criteria

1. THE `/offline-safety` page SHALL display an SMS SOS button that is always visible regardless of network status.
2. WHEN a User taps the SMS SOS button, THE App SHALL open the device's native SMS application via an `sms:` URI pre-filled with the local emergency number and a message containing the User's last known cached coordinates.
3. THE App SHALL retrieve the User's last known coordinates from the browser's Geolocation API if available; IF the Geolocation API is unavailable, THEN THE App SHALL use the last coordinates stored in localStorage.
4. IF no coordinates are available from either source, THEN THE App SHALL send the SMS SOS message without coordinates and SHALL display a warning to the User that location could not be determined.
5. THE SMSSosLink SHALL be constructed as `sms:{emergencyNumber}?body={encodedMessage}` where `encodedMessage` is URL-encoded.

---

### Requirement 6: Admin Broadcast Alert Creation

**User Story:** As an Admin, I want to compose and publish a broadcast message to all active users, so that I can communicate urgent safety information app-wide.

#### Acceptance Criteria

1. THE App SHALL provide a dedicated admin page at the route `/admin/broadcast` accessible only to authenticated Admins.
2. WHEN an Admin submits a broadcast form with a non-empty message body, THE App SHALL persist a Broadcast document to the database with the fields: `message`, `createdBy` (Admin user id), `createdAt`, and `active: true`.
3. IF an Admin submits a broadcast form with an empty or whitespace-only message body, THEN THE App SHALL display a validation error and SHALL NOT persist the Broadcast.
4. THE App SHALL enforce a maximum message length of 500 characters for Broadcast messages; IF the message exceeds 500 characters, THEN THE App SHALL display a character-count error and SHALL NOT persist the Broadcast.
5. THE `/admin/broadcast` page SHALL display a list of all existing Broadcasts ordered by `createdAt` descending, showing message text, creation timestamp, and active status.
6. WHEN an Admin deactivates a Broadcast, THE App SHALL set the Broadcast's `active` field to `false` in the database and SHALL remove it from the user-facing BroadcastBanner within one polling cycle.
7. WHEN an Admin deletes a Broadcast, THE App SHALL permanently remove the Broadcast document from the database.
8. THE App server SHALL expose a `POST /api/broadcasts` endpoint protected by Admin JWT that creates a Broadcast document.
9. THE App server SHALL expose a `GET /api/broadcasts` endpoint protected by Admin JWT that returns all Broadcast documents.
10. THE App server SHALL expose a `PATCH /api/broadcasts/:id` endpoint protected by Admin JWT that updates the `active` field of a Broadcast.
11. THE App server SHALL expose a `DELETE /api/broadcasts/:id` endpoint protected by Admin JWT that permanently deletes a Broadcast document.
12. IF a non-Admin JWT is used on any `/api/broadcasts` write endpoint, THEN THE App server SHALL return HTTP 403.

---

### Requirement 7: User-Facing Broadcast Banner

**User Story:** As a User, I want to see admin broadcast messages as a dismissible banner on every page, so that I am aware of urgent safety alerts.

#### Acceptance Criteria

1. THE BroadcastBanner component SHALL be rendered on every authenticated User page by including it in the shared layout above the Navbar.
2. WHEN the BroadcastBanner is mounted, THE App SHALL poll `GET /api/broadcasts/active` every 30 seconds to retrieve Broadcasts where `active: true`.
3. THE App server SHALL expose a `GET /api/broadcasts/active` endpoint accessible to authenticated Users that returns only Broadcast documents where `active: true`.
4. WHEN one or more active Broadcasts exist, THE BroadcastBanner SHALL display each message in a visually distinct banner with a dismiss button.
5. WHEN a User dismisses a Broadcast banner, THE App SHALL store the dismissed Broadcast id in localStorage and SHALL NOT display that Broadcast again for the current browser session.
6. WHILE no active Broadcasts exist, THE BroadcastBanner SHALL render nothing and SHALL NOT occupy layout space.
7. IF the poll request to `GET /api/broadcasts/active` fails, THEN THE BroadcastBanner SHALL silently suppress the error and SHALL retry on the next polling interval.

---

### Requirement 8: Incident Report Submission

**User Story:** As a User, I want to submit an incident report with type, description, and my current location, so that other tourists and admins are aware of safety hazards in the area.

#### Acceptance Criteria

1. THE App SHALL provide a dedicated page at the route `/report-incident` accessible only to authenticated Users.
2. WHEN a User submits an incident report form with a valid IncidentType, a non-empty description of at least 10 characters, and a resolvable location, THE App SHALL persist an IncidentReport document to the database.
3. THE IncidentReport document SHALL contain the fields: `userId`, `type` (one of `theft`, `accident`, `harassment`, `other`), `description`, `lat`, `lng`, `resolved: false`, and `createdAt`.
4. THE App SHALL auto-capture the User's current coordinates via the browser Geolocation API when the `/report-incident` page loads and SHALL pre-populate the location fields.
5. IF the Geolocation API returns an error or is denied, THEN THE App SHALL display an error message and SHALL allow the User to manually enter coordinates or a place name.
6. IF a User submits an incident report with a description shorter than 10 characters, THEN THE App SHALL display a validation error and SHALL NOT persist the record.
7. IF a User submits an incident report without selecting an IncidentType, THEN THE App SHALL display a validation error and SHALL NOT persist the record.
8. THE App server SHALL expose a `POST /api/incidents` endpoint protected by User JWT that creates an IncidentReport document.
9. THE App server SHALL expose a `GET /api/incidents` endpoint accessible to authenticated Users that returns IncidentReport documents where `resolved: false` within a bounding box defined by query parameters `swLat`, `swLng`, `neLat`, `neLng`.

---

### Requirement 9: Incident Map Display for Users

**User Story:** As a User, I want to see past incident reports pinned on a map near my location, so that I can make informed decisions about where to go.

#### Acceptance Criteria

1. THE `/report-incident` page SHALL render an IncidentMap showing the User's current location and all unresolved IncidentReport pins within a 10 km radius.
2. WHEN the IncidentMap is loaded, THE App SHALL fetch IncidentReports from `GET /api/incidents` using a bounding box derived from the User's current coordinates and a 10 km radius.
3. EACH IncidentReport pin on the IncidentMap SHALL display a marker color or icon that corresponds to the IncidentType: a distinct visual style for each of `theft`, `accident`, `harassment`, and `other`.
4. WHEN a User clicks an IncidentReport pin, THE App SHALL display an info window showing the IncidentType, a truncated description (maximum 100 characters), and the time elapsed since the report was created.
5. WHILE the IncidentMap data is loading, THE App SHALL display a loading indicator in place of the map.
6. IF the `GET /api/incidents` request fails, THEN THE App SHALL display an error message and SHALL render the map without incident pins.

---

### Requirement 10: Admin Incident Management

**User Story:** As an Admin, I want to view all incident reports and mark them as resolved, so that I can manage the safety information shown to tourists.

#### Acceptance Criteria

1. THE App SHALL provide a dedicated admin page at the route `/admin/incidents` accessible only to authenticated Admins.
2. THE `/admin/incidents` page SHALL display all IncidentReport documents ordered by `createdAt` descending, showing type, description, coordinates, resolved status, and submission timestamp.
3. THE `/admin/incidents` page SHALL provide filter controls allowing the Admin to filter by IncidentType and by resolved status independently.
4. WHEN an Admin marks an IncidentReport as resolved, THE App SHALL send a `PATCH /api/incidents/:id/resolve` request and SHALL update the displayed resolved status without a full page reload.
5. THE App server SHALL expose a `GET /api/incidents/all` endpoint protected by Admin JWT that returns all IncidentReport documents regardless of resolved status.
6. THE App server SHALL expose a `PATCH /api/incidents/:id/resolve` endpoint protected by Admin JWT that sets the `resolved` field of the specified IncidentReport to `true`.
7. IF a `PATCH /api/incidents/:id/resolve` request references an IncidentReport id that does not exist, THEN THE App server SHALL return HTTP 404.
8. IF a non-Admin JWT is used on `GET /api/incidents/all` or `PATCH /api/incidents/:id/resolve`, THEN THE App server SHALL return HTTP 403.
9. THE `/admin/incidents` page SHALL display a summary count of total reports, unresolved reports, and resolved reports at the top of the page.
