# Implementation Plan: Tourist Safety App Refactor

## Overview

Resolve all 19 identified issues across the backend and frontend to produce a clean, production-ready application. No feature changes — only correctness, security, and maintainability fixes. Tasks are ordered so each step builds on the previous one, with the service layer established before any consumer is migrated.

## Tasks

- [x] 1. Backend Foundation — db.js, server.js cleanup, CORS, env vars
  - [x] 1.1 Implement `config/db.js` — MongoDB connection module
    - Write `connectDB` as an async function that calls `mongoose.connect(process.env.MONGO_URI)`
    - Log `"✅ MongoDB Connected"` on success
    - On failure, log the error and call `process.exit(1)`
    - Export `connectDB` as the default export
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Refactor `server.js` — remove debug log, restrict CORS, wire `connectDB`, register admin routes
    - Remove the `console.log("ENV KEY:", process.env.GEMINI_API_KEY)` line
    - Replace `app.use(cors())` with `app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }))`
    - Replace the inline `mongoose.connect(...)` block with `await connectDB()` imported from `config/db.js`
    - Add `import adminRoutes from "./routes/adminRoutes.js"` and register `app.use("/api/admin", adminRoutes)`
    - _Requirements: 1.1, 2.1, 2.2, 2.3_

  - [ ]* 1.3 Write unit tests for `connectDB`
    - Test that `connectDB` calls `mongoose.connect` with `process.env.MONGO_URI`
    - Test that a connection failure logs the error and calls `process.exit(1)`
    - _Requirements: 1.2, 1.3_

- [x] 2. Backend Security — authController role fix, input validation, User model
  - [x] 2.1 Fix `authController.js` — strip role from registration, add input validation
    - Destructure only `{ email, password, name }` from `req.body` — never read `role`
    - Add email format validation using a regex; return 400 with `"Invalid email format"` if invalid
    - Add password length check (minimum 6 characters); return 400 with `"Password too short"` if too short
    - Always create the user with `role: "user"` hardcoded
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 2.2 Write property test for role immutability on registration (Property 1)
    - **Property 1: Role Immutability on Registration**
    - For any registration payload where `role` is set to any value (including `"admin"`), the created user in the DB always has `role === "user"`
    - **Validates: Requirements 3.1**

  - [ ]* 2.3 Write property test for password never stored as plaintext (Property 3)
    - **Property 3: Password Never Stored as Plaintext**
    - For any valid registration payload, the stored `password` field does not equal the plaintext input and passes `bcrypt.compare(plaintext, stored)`
    - **Validates: Requirements 3.4**

  - [x] 2.4 Enhance `models/User.js` — add field constraints and validation
    - Add `required: true` to both `email` and `password` fields
    - Add `unique: true`, `lowercase: true`, and `match: [/^\S+@\S+\.\S+$/, "Invalid email"]` to the `email` field
    - Add an optional `name` field with `type: String, trim: true`
    - Keep `role` enum `["user", "admin"]` with `default: "user"`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 2.5 Write property test for email stored as lowercase (Property 8)
    - **Property 8: Email Stored as Lowercase**
    - For any registration email string `e` (mixed case), the email stored in the DB equals `e.toLowerCase()`
    - **Validates: Requirements 4.3**

- [ ] 3. Checkpoint — Ensure all backend foundation and security tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Backend Admin — adminController, adminRoutes, Alert model `resolved` field
  - [x] 4.1 Add `resolved` field to `models/Alert.js`
    - Add `resolved: { type: Boolean, default: false }` to the alert schema
    - _Requirements: 15.1_

  - [x] 4.2 Implement `controllers/adminController.js`
    - Implement `getAllUsers`: query `User.find({}).select("-password")` and return the result as JSON
    - Implement `deleteUser`: find user by `req.params.id`, delete the user document, then delete the associated `Location` document where `userId` matches, return 200 on success
    - Implement `resolveAlert`: find alert by `req.params.id`, set `resolved: true`, save, return the updated alert
    - _Requirements: 15.2, 16.1, 16.2, 16.3_

  - [ ]* 4.3 Write property test for getAllUsers never exposing passwords (Property 6)
    - **Property 6: getAllUsers Never Exposes Passwords**
    - For any state of the User collection, the response from `getAllUsers` contains zero objects with a `password` field
    - **Validates: Requirements 16.2**

  - [ ]* 4.4 Write property test for deleteUser cascading to Location records (Property 7)
    - **Property 7: deleteUser Cascades to Location Records**
    - For any user ID with an associated location record, calling `deleteUser` results in both the user document and the location document being absent from the DB
    - **Validates: Requirements 16.3**

  - [ ]* 4.5 Write property test for admin endpoints rejecting non-admin users (Property 5)
    - **Property 5: Admin Endpoints Reject Non-Admin Users**
    - For any request to `/api/admin/*` with a valid JWT for a `role === "user"` account, the server responds with 403 and returns no data
    - **Validates: Requirements 16.4**

  - [x] 4.6 Implement `routes/adminRoutes.js`
    - Import `verifyToken` and `verifyAdmin` from `middleware/authMiddleware.js`
    - Import `getAllUsers`, `deleteUser`, `resolveAlert` from `controllers/adminController.js`
    - Register `GET /users` → `verifyToken, verifyAdmin, getAllUsers`
    - Register `DELETE /users/:id` → `verifyToken, verifyAdmin, deleteUser`
    - Register `PATCH /alerts/:id/resolve` → `verifyToken, verifyAdmin, resolveAlert`
    - _Requirements: 16.4_

- [ ] 5. Checkpoint — Ensure all backend tests pass, server starts cleanly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend API Layer — centralized api.js and service modules
  - [x] 6.1 Rewrite `services/api.js` — centralized Axios instance with interceptors
    - Set `baseURL` to `import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"`
    - Add a request interceptor that reads `localStorage.getItem("token")` and sets `config.headers.Authorization = \`Bearer \${token}\`` when present
    - Add a response interceptor that on 401 clears `localStorage` keys `"token"` and `"userData"` and sets `window.location.href = "/"`
    - Export the instance as the default export
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 6.2 Write property test for JWT token attached to all authenticated requests (Property 4)
    - **Property 4: JWT Token Attached to All Authenticated Requests**
    - For any token string stored in localStorage, every request made through `api.js` includes `Authorization: Bearer <token>`
    - **Validates: Requirements 5.2**

  - [x] 6.3 Create `services/locationService.js`
    - Export `updateLocation(userId, lat, lng)` → `api.post("/location/update", { userId, lat, lng })`
    - Export `getAllLocations()` → `api.get("/location/all")`
    - Export `getUserLocation(userId)` → `api.get(\`/location/\${userId}\`)`
    - Export `stopSharing(userId)` → `api.post("/location/stop", { userId })`
    - _Requirements: 6.1_

  - [x] 6.4 Create `services/alertService.js`
    - Export `createAlert(userId, lat, lng)` → `api.post("/alert/create", { userId, lat, lng })`
    - Export `getAlerts()` → `api.get("/alert/all")`
    - _Requirements: 6.2_

  - [x] 6.5 Create `services/aiService.js`
    - Export `chatWithAI(message, location)` → `api.post("/ai/chat", { message, location })`
    - _Requirements: 6.3_

- [x] 7. Frontend Auth — AuthContext shape, ProtectedRoute fix, App.jsx wiring
  - [x] 7.1 Fix `context/AuthContext.jsx` — ensure flat user shape is stored and restored
    - Confirm `login(data)` calls `setUser(data.user)` (flat object with `email` and `role`)
    - Confirm `localStorage.setItem("userData", JSON.stringify(data.user))` stores the flat shape
    - Confirm `localStorage.setItem("token", data.token)` stores the token separately
    - Confirm the `useEffect` on mount restores the flat user from `"userData"`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 7.2 Fix `components/ProtectedRoute.jsx` — correct role check
    - Change `user.user.role` to `user.role` in the role guard condition
    - Add `replace` prop to both `<Navigate>` elements
    - _Requirements: 8.1, 8.2_

  - [ ]* 7.3 Write property test for ProtectedRoute redirecting unauthenticated users (Property 9)
    - **Property 9: ProtectedRoute Redirects Unauthenticated Users**
    - Rendering any ProtectedRoute-wrapped route without an authenticated user in AuthContext results in a redirect to `"/"` and does not render the protected component
    - **Validates: Requirements 8.1, 8.2**

  - [x] 7.4 Wire `ProtectedRoute` into `App.jsx` and add catch-all 404 route
    - Wrap `/dashboard` route: `<ProtectedRoute><UserDashboard /></ProtectedRoute>`
    - Wrap `/map` route: `<ProtectedRoute><MapPage /></ProtectedRoute>`
    - Wrap `/admin` route: `<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>`
    - Add `<Route path="*" element={<NotFound />} />` as the last route
    - _Requirements: 8.3, 14.3_

- [x] 8. Frontend Components — UserDashboard, Register, MapPage, MapView, hooks, Chatbot, AdminDashboard, TrackUser
  - [x] 8.1 Fix `pages/UserDashboard.jsx` — correct user property access
    - Change `user?.user?.email` to `user?.email`
    - _Requirements: 13.1_

  - [x] 8.2 Clean up `pages/Register.jsx` — remove role selector, add loading and error states
    - Remove the `<select>` element for role and remove `role` from the form state
    - Add a `loading` boolean state; disable the button and show `"Registering..."` text while loading
    - Add an `error` string state; display the error message below the form on failure
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 8.3 Refactor `pages/MapPage.jsx` — use locationService, remove redundant useMemo
    - Replace the `axios.post("http://localhost:5000/api/location/stop", ...)` call with `stopSharing(id)` from `locationService`
    - Remove the `const libraries = useMemo(() => ["places", "visualization"], [])` declaration and its import
    - Remove the direct `axios` import if no longer used in this file
    - _Requirements: 10.1, 10.2_

  - [x] 8.4 Refactor `components/MapView.jsx` — use alertService, replace Math.random safety score
    - Add a `safetyScore(placeId)` helper function using the deterministic hash algorithm from the design: `let hash = 0; for each char: hash = (hash * 31 + charCode) & 0xffffffff; return 60 + (Math.abs(hash) % 40)`
    - Replace `Math.floor(Math.random() * 40) + 60` with `safetyScore(destination.placeId)` in the place details callback
    - Replace `axios.post("http://localhost:5000/api/alert/create", ...)` with `createAlert(userId, lat, lng)` from `alertService`
    - Remove the direct `axios` import
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]* 8.5 Write property test for safety score range and determinism (Property 2)
    - **Property 2: Safety Score Range and Determinism**
    - For any non-empty string `placeId`, `safetyScore(placeId)` returns an integer in [60, 99] and calling it twice with the same input returns the same value
    - **Validates: Requirements 11.1, 11.2**

  - [x] 8.6 Refactor `hooks/useAllLocations.js` — use locationService, add error state
    - Replace `axios.get("http://localhost:5000/api/location/all")` with `getAllLocations()` from `locationService`
    - Add an `error` state; set it in the catch block
    - Return `{ locations, error }` instead of just the array (update all consumers: `MapView` and `AdminDashboard`)
    - Remove the direct `axios` import
    - _Requirements: 12.1_

  - [x] 8.7 Refactor `hooks/useLiveLocation.js` — use locationService
    - Replace the `axios.post("http://localhost:5000/api/location/update", ...)` call with `updateLocation(userId, latitude, longitude)` from `locationService`
    - Remove the direct `axios` import
    - _Requirements: 12.2_

  - [x] 8.8 Refactor `pages/AdminDashboard.jsx` — use alertService, add loading and error states
    - Replace `axios.get("http://localhost:5000/api/alert/all")` with `getAlerts()` from `alertService`
    - Add `loading` and `error` states; show a loading indicator while fetching and an error message on failure
    - Update the `useAllLocations` destructuring to `const { locations } = useAllLocations()` following the change in 8.6
    - Remove the direct `axios` import
    - _Requirements: 12.3_

  - [x] 8.9 Refactor `pages/TrackUser.jsx` — use locationService
    - Replace `axios.get(\`http://localhost:5000/api/location/\${userId}\`)` with `getUserLocation(userId)` from `locationService`
    - Remove the direct `axios` import
    - _Requirements: 12.4_

  - [x] 8.10 Refactor `components/Chatbot.jsx` — use aiService
    - Replace `axios.post("http://localhost:5000/api/ai/chat", ...)` with `chatWithAI(userMsg, context?.placeName || "unknown")` from `aiService`
    - Remove the direct `axios` import
    - _Requirements: 12.5_

- [x] 9. Frontend Error Handling — ErrorBoundary, NotFound, 404 route
  - [x] 9.1 Create `components/ErrorBoundary.jsx`
    - Implement as a React class component with `state = { hasError: false }`
    - Implement `static getDerivedStateFromError()` returning `{ hasError: true }`
    - Implement `componentDidCatch(error, info)` to log the error
    - When `hasError` is true, render a fallback UI with a message like `"Something went wrong."` and a button to reload the page
    - When `hasError` is false, render `this.props.children`
    - _Requirements: 14.1, 14.2_

  - [x] 9.2 Create `pages/NotFound.jsx`
    - Render a simple 404 page with a message and a link back to `"/"`
    - _Requirements: 14.3_

  - [x] 9.3 Wrap `App.jsx` component tree with `ErrorBoundary`
    - Import `ErrorBoundary` and wrap the `<BrowserRouter>` (or its contents) so all route renders are covered
    - Confirm the `<Route path="*" element={<NotFound />} />` catch-all added in task 7.4 is present
    - _Requirements: 14.1, 14.3_

- [x] 10. Final Checkpoint — Ensure all tests pass and no hardcoded URLs remain
  - Ensure all tests pass, ask the user if questions arise.
  - Verify no remaining `axios.get("http://localhost:5000/...")` or `axios.post("http://localhost:5000/...")` calls exist in any frontend file outside of `services/`

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each logical group
- Property tests validate universal correctness properties defined in the design document
- Unit tests validate specific examples and edge cases
- The `useAllLocations` return shape changes in task 8.6 — tasks 8.8 (AdminDashboard) and MapView must be updated in the same step to avoid a broken intermediate state
