# Requirements Document

## Introduction

This document defines the requirements for the Tourist Safety App Refactor. The refactor addresses 19 identified issues in the existing codebase spanning security vulnerabilities, broken architecture, hardcoded values, and missing implementations. The goal is to produce a clean, production-ready application without changing the existing feature set: live location sharing, risk zone heatmaps, emergency alerts, nearby hospital/police discovery, AI chatbot, and admin tracking dashboard.

## Glossary

- **Server**: The Node.js + Express backend application
- **Client**: The React 19 + Vite frontend application
- **AuthController**: The backend module handling user registration and login
- **AdminController**: The backend module handling admin-only operations
- **AuthContext**: The React context providing authentication state to the frontend
- **ProtectedRoute**: The React component guarding routes by authentication and role
- **API_Client**: The centralized Axios instance used by all frontend service modules
- **locationService**: Frontend service module for location-related API calls
- **alertService**: Frontend service module for alert-related API calls
- **aiService**: Frontend service module for AI chatbot API calls
- **User_Model**: The Mongoose schema and model for user documents
- **Alert_Model**: The Mongoose schema and model for alert documents
- **safetyScore**: The deterministic hash function that computes a safety score from a Google Places ID
- **ErrorBoundary**: The React component that catches unhandled render errors
- **verifyToken**: The middleware that validates JWT tokens on incoming requests
- **verifyAdmin**: The middleware that checks the requesting user has the admin role
- **JWT_SECRET**: The secret key used to sign and verify JSON Web Tokens
- **MONGO_URI**: The environment variable holding the MongoDB connection string
- **CLIENT_ORIGIN**: The environment variable holding the allowed CORS origin
- **VITE_API_URL**: The environment variable holding the base API URL for the frontend

---

## Requirements

### Requirement 1: Database Connection Encapsulation

**User Story:** As a developer, I want the MongoDB connection logic encapsulated in a dedicated module, so that the server entry point is clean and the connection can be tested in isolation.

#### Acceptance Criteria

1. THE Server SHALL call `connectDB` from `config/db.js` to establish the MongoDB connection at startup, rather than inlining `mongoose.connect` in `server.js`
2. WHEN `connectDB` is called and `MONGO_URI` is set, THE Server SHALL establish a mongoose connection and log a success message
3. IF `connectDB` throws an error, THEN THE Server SHALL log the error and exit with process code 1

---

### Requirement 2: Server Security and Route Registration

**User Story:** As a system operator, I want the server to have restricted CORS, no leaked environment variables, and all routes registered, so that the application is secure and fully functional.

#### Acceptance Criteria

1. THE Server SHALL restrict CORS to the origin specified by the `CLIENT_ORIGIN` environment variable
2. THE Server SHALL NOT log environment variable values to the console
3. THE Server SHALL register admin routes at the `/api/admin` path

---

### Requirement 3: Secure User Registration

**User Story:** As a security engineer, I want the registration endpoint to enforce role assignment and input validation, so that users cannot self-elevate to admin and invalid data is rejected early.

#### Acceptance Criteria

1. WHEN a registration request is received, THE AuthController SHALL ignore any `role` field in the request body and always create the user with `role` set to `"user"`
2. WHEN a registration request contains an invalid email format, THE AuthController SHALL return a 400 status response with a descriptive error message
3. WHEN a registration request contains a password shorter than 6 characters, THE AuthController SHALL return a 400 status response with a descriptive error message
4. WHEN a valid registration request is processed, THE AuthController SHALL store the password as a bcrypt hash and never store it as plaintext

---

### Requirement 4: User Model Validation

**User Story:** As a developer, I want the User Mongoose schema to enforce field constraints, so that invalid data is rejected at the database layer.

#### Acceptance Criteria

1. THE User_Model SHALL require both `email` and `password` fields to be present
2. THE User_Model SHALL validate the `email` field format using a regex match and reject invalid formats
3. THE User_Model SHALL store the `email` field in lowercase
4. THE User_Model SHALL restrict the `role` field to the values `"user"` or `"admin"` and default to `"user"`
5. THE User_Model SHALL include an optional `name` field that is trimmed of whitespace

---

### Requirement 5: Centralized API Client

**User Story:** As a frontend developer, I want a single Axios instance with automatic token attachment and 401 handling, so that all API calls are authenticated consistently and expired sessions are handled gracefully.

#### Acceptance Criteria

1. THE API_Client SHALL use the `VITE_API_URL` environment variable as the base URL for all requests
2. WHEN an API request is made and a JWT token exists in localStorage, THE API_Client SHALL attach the token as a `Bearer` Authorization header
3. WHEN an API response returns a 401 status, THE API_Client SHALL clear the token and user data from localStorage and redirect the user to `"/"`

---

### Requirement 6: Frontend Service Layer

**User Story:** As a frontend developer, I want dedicated service modules for each API domain, so that hardcoded URLs are eliminated and API calls are centralized and reusable.

#### Acceptance Criteria

1. THE locationService SHALL expose `updateLocation`, `getAllLocations`, `getUserLocation`, and `stopSharing` functions that use the centralized API_Client
2. THE alertService SHALL expose `createAlert` and `getAlerts` functions that use the centralized API_Client
3. THE aiService SHALL expose a `chatWithAI` function that uses the centralized API_Client

---

### Requirement 7: Authentication Context Shape

**User Story:** As a frontend developer, I want the authentication context to store a flat user object, so that all components access user properties consistently without double-nesting.

#### Acceptance Criteria

1. THE AuthContext SHALL store the authenticated user as a flat object with `email` and `role` fields
2. WHEN a user logs in, THE AuthContext SHALL store the flat user object in localStorage under the key `"userData"`
3. WHEN a user logs in, THE AuthContext SHALL store the JWT token in localStorage under the key `"token"`

---

### Requirement 8: Route Protection

**User Story:** As a security engineer, I want all authenticated routes to be guarded by the ProtectedRoute component, so that unauthenticated users and unauthorized roles cannot access protected pages.

#### Acceptance Criteria

1. WHEN a user navigates to `/dashboard` or `/map` without an authenticated session, THE ProtectedRoute SHALL redirect the user to `"/"`
2. WHEN a user with a non-admin role navigates to `/admin`, THE ProtectedRoute SHALL redirect the user to `"/"`
3. THE App SHALL wire `/dashboard`, `/map`, and `/admin` routes through the ProtectedRoute component

---

### Requirement 9: Registration Form Cleanup

**User Story:** As a user, I want the registration form to not expose a role selection field, so that the UI reflects the actual security model where all new accounts are standard users.

#### Acceptance Criteria

1. THE Register form SHALL NOT contain a role selection input element
2. THE Register form SHALL display loading state feedback during submission
3. THE Register form SHALL display error messages when registration fails

---

### Requirement 10: MapPage Refactor

**User Story:** As a developer, I want MapPage to use the service layer and remove redundant code, so that the component is clean and consistent with the rest of the frontend.

#### Acceptance Criteria

1. THE MapPage SHALL use `stopSharing` from locationService instead of a hardcoded URL for stopping location sharing
2. THE MapPage SHALL NOT contain a `useMemo` call for the Google Maps libraries array, as the libraries are already defined at module level in `App.jsx`

---

### Requirement 11: Deterministic Safety Score

**User Story:** As a user, I want the safety score for a location to be stable and consistent, so that the score does not change on every page render.

#### Acceptance Criteria

1. WHEN a `placeId` is provided, THE safetyScore function SHALL return an integer in the range [60, 99]
2. WHEN the same `placeId` is provided multiple times, THE safetyScore function SHALL return the same value on every call (deterministic)
3. THE MapView SHALL use `createAlert` from alertService instead of a hardcoded URL when creating emergency alerts

---

### Requirement 12: Hook and Component Service Layer Migration

**User Story:** As a developer, I want all hooks and components to use the service layer, so that no hardcoded API URLs remain in the frontend codebase.

#### Acceptance Criteria

1. THE `useAllLocations` hook SHALL use `getAllLocations` from locationService and SHALL expose an error state
2. THE `useLiveLocation` hook SHALL use service functions from locationService instead of direct hardcoded Axios calls
3. THE AdminDashboard SHALL use `getAlerts` from alertService and SHALL expose loading and error states
4. THE TrackUser component SHALL use `getUserLocation` from locationService
5. THE Chatbot component SHALL use `chatWithAI` from aiService

---

### Requirement 13: User Dashboard Bug Fix

**User Story:** As a user, I want my dashboard to correctly display my account information, so that I can see my email and profile details without errors.

#### Acceptance Criteria

1. THE UserDashboard SHALL access the authenticated user's email as `user.email`, not `user.user.email`

---

### Requirement 14: Error Boundary and 404 Handling

**User Story:** As a user, I want the application to handle unexpected errors and unknown routes gracefully, so that I am never left with a blank screen or a broken page.

#### Acceptance Criteria

1. THE App SHALL wrap its component tree with an ErrorBoundary component
2. WHEN an unhandled render error occurs within the component tree, THE ErrorBoundary SHALL display a fallback UI instead of a blank screen
3. THE App SHALL include a catch-all route that renders a NotFound component for any path not defined in the router

---

### Requirement 15: Alert Model Enhancement

**User Story:** As an admin, I want to mark alerts as resolved, so that I can track which safety incidents have been addressed.

#### Acceptance Criteria

1. THE Alert_Model SHALL include a `resolved` field of type Boolean with a default value of `false`
2. WHEN an admin resolves an alert, THE AdminController SHALL set the `resolved` field to `true` for that alert

---

### Requirement 16: Admin Controller and Routes

**User Story:** As an admin, I want to manage users and alerts through protected API endpoints, so that I can maintain the platform and respond to safety incidents.

#### Acceptance Criteria

1. THE AdminController SHALL expose `getAllUsers`, `deleteUser`, and `resolveAlert` functions
2. WHEN `getAllUsers` is called, THE AdminController SHALL return all user records without the `password` field
3. WHEN `deleteUser` is called with a user ID, THE AdminController SHALL remove both the user record and the user's associated location record
4. THE AdminRoutes SHALL protect all endpoints with both `verifyToken` and `verifyAdmin` middleware
