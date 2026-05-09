import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useJsApiLoader } from "@react-google-maps/api";

import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import TouristPlacesPage from "./pages/TouristPlacesPage";
import RiskZonesPage from "./pages/RiskZonesPage";
import NearbyHelpPage from "./pages/NearbyHelpPage";
import NotificationsPage from "./pages/NotificationsPage";
import TouristIdPage from "./pages/TouristIdPage";
import VerifyIdPage from "./pages/VerifyIdPage";
import AdminDashboard from "./pages/AdminDashboard";
import TrackUser from "./pages/TrackUser";
import NotFound from "./pages/NotFound";
import EmergencyContacts from "./pages/EmergencyContacts";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import OfflineSafety from "./pages/OfflineSafety";
import BroadcastBanner from "./components/BroadcastBanner";
import AdminBroadcast from "./pages/AdminBroadcast";
import ReportIncident from "./pages/ReportIncident";
import AdminIncidents from "./pages/AdminIncidents";

const LIBRARIES = ["places"];

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_KEY,
    libraries: LIBRARIES,
  });

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center text-xl text-gray-600">
        🌍 Loading Maps...
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <BroadcastBanner />
        <OfflineBanner />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/tourist-places" element={<ProtectedRoute><TouristPlacesPage /></ProtectedRoute>} />
          <Route path="/risk-zones" element={<ProtectedRoute><RiskZonesPage /></ProtectedRoute>} />
          <Route path="/nearby-help" element={<ProtectedRoute><NearbyHelpPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/my-id" element={<ProtectedRoute><TouristIdPage /></ProtectedRoute>} />
          <Route path="/verify-id" element={<VerifyIdPage />} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/broadcast" element={<ProtectedRoute role="admin"><AdminBroadcast /></ProtectedRoute>} />
          <Route path="/admin/incidents" element={<ProtectedRoute role="admin"><AdminIncidents /></ProtectedRoute>} />

          <Route path="/emergency-contacts" element={<ProtectedRoute><EmergencyContacts /></ProtectedRoute>} />
          <Route path="/offline-safety" element={<ProtectedRoute><OfflineSafety /></ProtectedRoute>} />
          <Route path="/report-incident" element={<ProtectedRoute><ReportIncident /></ProtectedRoute>} />

          <Route path="/track/:userId" element={<TrackUser />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
