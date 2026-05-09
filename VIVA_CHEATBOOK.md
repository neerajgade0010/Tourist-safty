# Tourist Safety App — Complete Viva Cheatbook

---

## 1. PROJECT OVERVIEW

**What is this project?**
A full-stack web application that helps tourists stay safe. It provides live location tracking, emergency SOS alerts, risk zone visualization, nearby hospital/police navigation, AI chatbot, incident reporting, and blockchain-based identity verification.

**Tech Stack:**
- Frontend: React 19 + Vite + Tailwind CSS + Framer Motion
- Backend: Node.js + Express.js
- Database: MongoDB (via Mongoose)
- Blockchain: Solidity smart contract on Polygon Amoy testnet
- AI: OpenRouter API (GPT-3.5-turbo)
- Maps: Google Maps JavaScript API + Places API

---

## 2. PROJECT STRUCTURE

```
tourist-safety-app/
├── client/          → React frontend
├── server/          → Node.js backend
└── blockchain/      → Solidity smart contract + Hardhat
```

---

## 3. APPLICATION FLOW (How it works end-to-end)

```
User opens browser → Login page
→ Enters email + password
→ Frontend calls POST /api/auth/login
→ Backend checks MongoDB, compares bcrypt password
→ Returns JWT token + user object
→ Token stored in localStorage
→ User redirected to Dashboard

Every API call after login:
→ api.js attaches "Authorization: Bearer <token>" header
→ Backend verifyToken middleware validates JWT
→ If valid → request proceeds
→ If invalid/expired → 401 → auto logout
```

---

## 4. BACKEND FILES

### `server/server.js`
**What it does:** Entry point of the backend. Sets up Express app, connects to MongoDB, registers all routes.

**Key code explained:**
```js
dotenv.config() // loads .env variables
app.use(cors(corsOptions)) // allows frontend to call backend
app.use(express.json()) // parses JSON request bodies
app.listen(PORT) // starts server on port 5000
await connectDB() // connects to MongoDB
```

**Routes registered:**
- `/api/auth` → login, register
- `/api/location` → live location tracking
- `/api/alert` → SOS alerts
- `/api/ai` → chatbot
- `/api/admin` → admin operations
- `/api/contacts` → emergency contacts
- `/api/broadcasts` → admin messages
- `/api/incidents` → incident reports
- `/api/blockchain` → tourist ID verification

---

### `server/config/db.js`
**What it does:** Connects to MongoDB Atlas using the MONGO_URI from .env

```js
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  // If fails → process.exit(1) — stops the server
}
```

---

### `server/middleware/authMiddleware.js`
**What it does:** Protects routes. Checks if the JWT token in the request header is valid.

```js
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization // "Bearer <token>"
  jwt.verify(token.split(" ")[1], JWT_SECRET, (err, user) => {
    req.user = user // { id, role } — attached to every request
    next() // proceed to the controller
  })
}

export const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403) // block non-admins
  next()
}
```

**How it's used:** `router.get("/users", verifyToken, verifyAdmin, getAllUsers)`

---

### `server/models/User.js`
**What it does:** Defines the structure of a user in MongoDB.

```js
{
  name: String,
  email: String (required, unique, lowercase),
  password: String (bcrypt hash — never plaintext),
  role: "user" | "admin" (default: "user"),
  touristId: String (blockchain ID like "TID-A1B2C3"),
  blockchainTxHash: String (transaction hash on Polygon),
  blockchainRegistered: Boolean
}
```

---

### `server/models/Location.js`
**What it does:** Stores the live GPS location of each user.

```js
{
  userId: String (user's email),
  lat: Number,
  lng: Number,
  updatedAt: Date,
  isSharing: Boolean (true = actively sharing location)
}
```

---

### `server/models/Alert.js`
**What it does:** Stores SOS emergency alerts triggered by users.

```js
{
  userId: String,
  lat: Number,
  lng: Number,
  resolved: Boolean (admin can mark as resolved),
  createdAt: Date
}
```

---

### `server/models/TrustedContact.js`
**What it does:** Stores emergency contacts added by a user.

```js
{
  userId: ObjectId (reference to User),
  name: String,
  phone: String (optional),
  email: String (optional)
  // At least one of phone or email must exist (pre-validate hook)
}
```

---

### `server/models/Broadcast.js`
**What it does:** Stores admin broadcast messages sent to users.

```js
{
  message: String (max 500 chars),
  createdBy: ObjectId (admin user),
  active: Boolean (true = visible to users),
  recipients: [ObjectId] (empty = all users, non-empty = specific users)
}
```

---

### `server/models/IncidentReport.js`
**What it does:** Stores safety incidents reported by tourists.

```js
{
  userId: ObjectId,
  type: "theft" | "accident" | "harassment" | "other",
  description: String (min 10 chars),
  lat: Number,
  lng: Number,
  resolved: Boolean
}
```

---

### `server/controllers/authController.js`
**What it does:** Handles user registration and login.

**Register flow:**
```
1. Validate email format + password length
2. Check if user already exists
3. Hash password with bcrypt (10 salt rounds)
4. Generate Tourist ID: generateTouristId(email)
5. Save user to MongoDB
6. Asynchronously register on blockchain (setImmediate)
7. Return success response
```

**Login flow:**
```
1. Find user by email
2. Compare password with bcrypt.compare()
3. Sign JWT token with user id + role
4. Return token + user object
```

**Why role is never taken from request body:**
```js
// SECURITY: role is always hardcoded to "user"
// Never: role: req.body.role (would allow self-promotion to admin)
role: "user"
```

---

### `server/controllers/locationController.js`
**What it does:** Manages live GPS location updates.

- `updateLocation` — upserts (create or update) location for a userId
- `getAllLocations` — returns all user locations (admin use)
- `getUserLocation` — returns single user's location (for tracking link)
- `stopSharing` — sets `isSharing: false` for a user

---

### `server/controllers/alertController.js`
**What it does:** Creates SOS alerts and notifies admin + contacts.

```js
export const createAlert = async (req, res) => {
  const alert = await Alert.create({ userId, lat, lng })
  res.json({ message: "Alert sent", alert })

  // Fire-and-forget (doesn't block response)
  setImmediate(async () => {
    sseManager.broadcast('sos', payload) // notify admin in real-time
    notifier.notifyContacts(alert) // email trusted contacts
  })
}
```

---

### `server/controllers/adminController.js`
**What it does:** Admin-only operations.

- `getAllUsers` — returns all users WITHOUT passwords (`.select("-password")`)
- `deleteUser` — deletes user + their location record (cascade delete)
- `resolveAlert` — marks an alert as resolved

---

### `server/controllers/contactController.js`
**What it does:** CRUD for trusted emergency contacts.

- Max 10 contacts per user (enforced in createContact)
- Ownership check on delete (403 if contact belongs to different user)

---

### `server/controllers/broadcastController.js`
**What it does:** Admin creates/manages broadcast messages.

- `createBroadcast` — rejects empty/whitespace messages, saves with recipients
- `getActiveBroadcasts` — filters by `active: true` AND (recipients empty OR includes current user)
- `updateBroadcast` — toggles active status
- `deleteBroadcast` — permanently removes

---

### `server/controllers/incidentController.js`
**What it does:** Tourist incident reporting.

- `createIncident` — validates type + description length, saves with userId
- `getIncidents` — bounding box query (swLat, swLng, neLat, neLng) for nearby unresolved incidents
- `getAllIncidents` — admin gets all incidents
- `resolveIncident` — marks as resolved (idempotent)
- `getMyIncidents` — user gets only their own reports

---

### `server/controllers/blockchainController.js`
**What it does:** Tourist ID verification endpoints.

- `getMyTouristId` — authenticated user gets their own ID + blockchain status
- `verifyTouristId` — public endpoint, anyone can verify any Tourist ID

---

### `server/utils/blockchain.js`
**What it does:** Connects to the Polygon Amoy blockchain and interacts with the smart contract.

```js
// Reads deployment.json (created after contract deployment)
// Creates ethers.js provider + wallet
// Returns contract instance

generateTouristId(email) // creates "TID-A1B2C3D4E5F6" from email hash
registerOnBlockchain(touristId, email) // calls contract.registerTourist()
verifyOnBlockchain(touristId) // calls contract.verifyTourist()
```

---

### `server/utils/sseManager.js`
**What it does:** Server-Sent Events manager for real-time admin notifications.

```js
// Keeps a Map of all connected admin browser sessions
// When SOS fires → broadcasts to all connected admins instantly
// Admin browser receives event without polling
```

---

### `server/utils/notifier.js`
**What it does:** Sends email notifications to trusted contacts when SOS is triggered.

```js
// Uses Nodemailer + Gmail SMTP
// Finds all TrustedContacts for the alerting user
// Sends email with live tracking link to each contact
// Errors per contact are caught — one failure doesn't stop others
```

---

## 5. FRONTEND FILES

### `client/src/main.jsx`
**What it does:** Entry point of React app. Wraps everything in AuthProvider.

```jsx
<AuthProvider>  // provides user auth state to all components
  <App />
</AuthProvider>
```

---

### `client/src/App.jsx`
**What it does:** Defines all routes. Loads Google Maps API once for the whole app.

```jsx
const LIBRARIES = ["places"] // loaded once, shared by all map components

// Routes:
/ → Login (public)
/register → Register (public)
/verify-id → Verify Tourist ID (public)
/dashboard → UserDashboard (protected)
/tourist-places → TouristPlacesPage (protected)
/risk-zones → RiskZonesPage (protected)
/nearby-help → NearbyHelpPage (protected)
/emergency-contacts → EmergencyContacts (protected)
/offline-safety → OfflineSafety (protected)
/report-incident → ReportIncident (protected)
/notifications → NotificationsPage (protected)
/my-id → TouristIdPage (protected)
/admin → AdminDashboard (protected, admin only)
/admin/broadcast → AdminBroadcast (protected, admin only)
/admin/incidents → AdminIncidents (protected, admin only)
/track/:userId → TrackUser (public — shareable link)
* → NotFound
```

---

### `client/src/context/AuthContext.jsx`
**What it does:** Global authentication state. Stores logged-in user info.

```js
// State: user = { email, role, touristId, blockchainRegistered }
// login(data) → saves user + token to localStorage
// logout() → clears localStorage, sets user to null
// useAuth() → hook to access user anywhere in the app
```

---

### `client/src/services/api.js`
**What it does:** Centralized Axios instance. The most important service file.

```js
const api = axios.create({ baseURL: VITE_API_URL })

// Request interceptor: attaches JWT to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = "/"
    }
  }
)
```

---

### `client/src/services/authService.js`
```js
loginUser(data) → POST /api/auth/login
registerUser(data) → POST /api/auth/register
```

### `client/src/services/locationService.js`
```js
updateLocation(userId, lat, lng) → POST /api/location/update
getAllLocations() → GET /api/location/all
getUserLocation(userId) → GET /api/location/:userId
stopSharing(userId) → POST /api/location/stop
```

### `client/src/services/alertService.js`
```js
createAlert(userId, lat, lng) → POST /api/alert/create
getAlerts() → GET /api/alert/all
```

### `client/src/services/aiService.js`
```js
chatWithAI(message, location) → POST /api/ai/chat
```

### `client/src/services/contactService.js`
```js
getContacts() → GET /api/contacts
createContact(data) → POST /api/contacts
deleteContact(id) → DELETE /api/contacts/:id
```

### `client/src/services/broadcastService.js`
```js
getActiveBroadcasts() → GET /api/broadcasts/active
getAllBroadcasts() → GET /api/broadcasts
createBroadcast(data) → POST /api/broadcasts
updateBroadcast(id, data) → PATCH /api/broadcasts/:id
deleteBroadcast(id) → DELETE /api/broadcasts/:id
```

### `client/src/services/incidentService.js`
```js
createIncident(data) → POST /api/incidents
getIncidents(bbox) → GET /api/incidents?swLat=...
getMyIncidents() → GET /api/incidents/mine
getAllIncidents() → GET /api/incidents/all (admin)
resolveIncident(id) → PATCH /api/incidents/:id/resolve (admin)
```

---

### `client/src/components/ProtectedRoute.jsx`
**What it does:** Guards routes from unauthenticated access.

```jsx
if (!user) → redirect to "/" (login)
if (role && user.role !== role) → redirect to "/" (wrong role)
else → render the protected component
```

---

### `client/src/components/Navbar.jsx`
**What it does:** Top navigation bar shown on all user pages. Has notification bell with unread count badge.

---

### `client/src/components/MapView.jsx`
**What it does:** The core map component used across multiple pages.

**Features:**
- Shows user's current location ("You" marker)
- Directions routing (DirectionsService + DirectionsRenderer)
- Nearby hospitals/police markers with distance labels
- Risk zone circles (red, clickable with hover tooltips)
- Emergency button → finds nearest hospital → routes to it → sends SOS alert
- `showOtherUsers` prop → only admin sees other users' markers

**Safety Score algorithm:**
```js
const safetyScore = (placeId) => {
  let hash = 0
  for each char: hash = (hash * 31 + charCode) & 0xffffffff
  return 60 + (Math.abs(hash) % 40) // always 60-99, deterministic
}
```

---

### `client/src/components/Chatbot.jsx`
**What it does:** Floating chat assistant on every page.

**Flow:**
```
User types message
→ getBotResponse() checks rule-based patterns first
→ If match: returns instant reply (hospital/police/risk/route keywords)
→ If no match: calls /api/ai/chat → OpenRouter GPT-3.5-turbo
→ Shows response in chat bubble
```

---

### `client/src/components/BroadcastBanner.jsx`
**What it does:** Polls for active broadcasts every 30 seconds. Renders nothing if no broadcasts. Shows dismissible banners.

---

### `client/src/components/OfflineBanner.jsx`
**What it does:** Listens to `window online/offline` events. Shows yellow banner when internet is lost.

---

### `client/src/components/ErrorBoundary.jsx`
**What it does:** React class component that catches JavaScript errors in the component tree. Shows fallback UI instead of blank screen.

---

### `client/src/hooks/useLiveLocation.js`
**What it does:** Custom hook that sends GPS coordinates to backend every 5 seconds.

```js
// Only runs when isSharing=true AND userId exists
// Uses navigator.geolocation.getCurrentPosition
// Calls updateLocation(userId, lat, lng) from locationService
```

### `client/src/hooks/useAllLocations.js`
**What it does:** Polls all user locations every 5 seconds. Returns `{ locations, error }`.

---

### `client/src/utils/chatbotLogic.js`
**What it does:** Rule-based response engine for the chatbot.

```js
"hospital" → show hospitals on map
"police" → show police on map
"risk/danger" → show risk zones
"route/direction" → navigation hint
"emergency/sos" → emergency button hint
anything else → "default" → triggers AI
```

### `client/src/utils/offlineCache.js`
**What it does:** Saves/loads data from localStorage for offline use.

```js
CACHE_KEYS = { EMERGENCY, RISK_ZONES, SAFETY_TIPS, LAST_COORDS, CACHE_TS }
saveCache(key, data) // saves + updates timestamp
loadCache(key) // reads from localStorage
getCacheTimestamp() // when was cache last updated
```

### `client/src/utils/whatsappLink.js`
```js
buildWhatsAppLink(phone, trackingLink, senderName)
// Returns: https://wa.me/+91XXXXXXXXXX?text=🆘 SOS from Name. Track: link
```

### `client/src/utils/smsLink.js`
```js
buildSmsLink(emergencyNumber, lat, lng)
// Returns: sms:112?body=🆘 SOS! I need help. My location: lat,lng
```

### `client/src/utils/boundingBox.js`
```js
getBoundingBox(lat, lng, radiusKm)
// Returns: { swLat, swLng, neLat, neLng }
// Used to find incidents within 10km radius
```

### `client/src/utils/incidentIcons.js`
```js
INCIDENT_ICONS = {
  theft: yellow dot,
  accident: orange dot,
  harassment: purple dot,
  other: blue dot
}
```

---

## 6. BLOCKCHAIN FILES

### `blockchain/contracts/TouristRegistry.sol`
**What it does:** Solidity smart contract deployed on Polygon Amoy.

```solidity
struct Tourist {
  string touristId;
  string email;
  uint256 registeredAt;
  bool exists;
}

mapping(string => Tourist) tourists // touristId → Tourist
mapping(string => string) emailToId // email → touristId

registerTourist(touristId, email) // called on user registration
verifyTourist(touristId) // returns (valid, email, timestamp)
getTouristIdByEmail(email) // lookup by email
```

**Why blockchain?** Once written, data cannot be changed or deleted. Anyone can verify a Tourist ID without trusting a central server.

### `blockchain/hardhat.config.js`
**What it does:** Hardhat configuration. Tells Hardhat which network to deploy to (Polygon Amoy, chainId 80002).

### `blockchain/scripts/deploy.js`
**What it does:** Deployment script. Compiles contract, deploys to Amoy, saves address + ABI to `deployment.json`.

### `blockchain/deployment.json`
**What it does:** Created after deployment. Contains contract address and ABI. Backend reads this to interact with the contract.

---

## 7. KEY CONCEPTS TO EXPLAIN

**JWT (JSON Web Token):**
- Signed string containing user id + role
- Stored in localStorage
- Sent with every API request in Authorization header
- Backend verifies signature using JWT_SECRET
- Expires in 1 day

**bcrypt:**
- One-way password hashing
- `bcrypt.hash(password, 10)` — 10 salt rounds
- `bcrypt.compare(input, hash)` — verifies without decrypting
- Even if database is leaked, passwords can't be recovered

**CORS (Cross-Origin Resource Sharing):**
- Browser security policy blocks frontend (port 5173) from calling backend (port 5000)
- Backend explicitly allows specific origins via `cors(corsOptions)`

**SSE (Server-Sent Events):**
- One-way real-time connection from server to browser
- Admin browser connects to `/api/admin/sos-stream`
- When SOS fires, server pushes event instantly
- No polling needed

**Blockchain Tourist ID:**
- Generated from: `keccak256(email + timestamp)` → first 12 chars → `TID-XXXXXXXXXXXX`
- Registered on Polygon Amoy smart contract
- Immutable — cannot be faked or deleted
- Anyone can verify at `/verify-id`

**Service Worker (`sw.js`):**
- Background script registered in browser
- Caches app shell (HTML/CSS/JS) for offline use
- Only caches same-origin GET requests — skips API calls and Google Maps

---

## 8. COMMON VIVA QUESTIONS

**Q: What is the role of MongoDB in this project?**
A: MongoDB stores all application data — users, locations, alerts, incidents, broadcasts, contacts. It's a NoSQL document database accessed via Mongoose ODM.

**Q: How is authentication implemented?**
A: JWT-based. On login, server signs a token with user id + role. Frontend stores it in localStorage and sends it with every request. Backend middleware verifies the token on protected routes.

**Q: How does live location tracking work?**
A: `useLiveLocation` hook calls `navigator.geolocation.getCurrentPosition` every 5 seconds and POSTs coordinates to `/api/location/update`. Admin dashboard polls `/api/location/all` every 5 seconds to show all users on the map.

**Q: What is the blockchain used for?**
A: Tourist identity verification. When a user registers, a unique Tourist ID is generated and recorded on the Polygon Amoy blockchain via a Solidity smart contract. This ID can be verified by anyone — hotels, police, hospitals — without needing to trust our server.

**Q: How does the SOS system work?**
A: User presses Emergency button → alert saved to MongoDB → SSE event pushed to admin browser instantly → email sent to all trusted contacts with live tracking link → map routes user to nearest hospital.

**Q: What is the difference between user and admin roles?**
A: Users can track location, report incidents, use chatbot, manage contacts. Admins can see all users on map, view/resolve all alerts and incidents, send broadcast messages to specific or all users.

**Q: How does offline mode work?**
A: When online, the app saves emergency numbers, risk zones, and safety tips to localStorage. A ServiceWorker caches the app shell. When offline, the cached data is displayed. An SMS SOS button opens the native SMS app with pre-filled emergency message and GPS coordinates.

**Q: What is the chatbot flow?**
A: First checks rule-based patterns (hospital, police, risk, route keywords). If matched, responds instantly and triggers map action. If no match, calls OpenRouter API (GPT-3.5-turbo) for AI response.

**Q: How are incident reports shown on the map?**
A: Uses a bounding box algorithm — calculates lat/lng boundaries for a 10km radius around the user, queries MongoDB for unresolved incidents within that box, displays color-coded markers (yellow=theft, orange=accident, purple=harassment, blue=other).

**Q: Why is the safety score deterministic?**
A: Uses a hash of the Google Places ID. Same place always gets same score (60-99 range). Previously it was `Math.random()` which changed on every render — that was a bug we fixed.
