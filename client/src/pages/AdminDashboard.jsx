import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import useAllLocations from "../hooks/useAllLocations";
import { useEffect, useState, useRef } from "react";
import { getAlerts } from "../services/alertService";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const MAP_STYLE = { width: "100%", height: "100%", borderRadius: "16px" };
const CENTER = { lat: 28.6139, lng: 77.209 };

const StatCard = ({ icon, label, value, color }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className={`bg-white/5 border ${color} rounded-2xl p-4 flex items-center gap-4`}
  >
    <div className="text-3xl">{icon}</div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  </motion.div>
);

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { locations } = useAllLocations();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAlertFlash, setNewAlertFlash] = useState(false);
  const [activeTab, setActiveTab] = useState("alerts"); // "alerts" | "users"
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await getAlerts();
        setAlerts((prev) => {
          if (res.data.length > prev.length && prev.length !== 0) {
            setNewAlertFlash(true);
            setTimeout(() => setNewAlertFlash(false), 3000);
          }
          return res.data;
        });
        setError(null);
      } catch {
        setError("Failed to load alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const focusAlert = (alert) => {
    if (!mapRef.current) return;
    mapRef.current.panTo({ lat: alert.lat, lng: alert.lng });
    mapRef.current.setZoom(15);
    setSelectedAlert(alert);
  };

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">

      {/* ── TOP NAV ── */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">🛡 SafeTrack Admin</span>
          <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full">Live</span>
        </div>

        {/* Admin nav links */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => navigate("/admin")}
            className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => navigate("/admin/incidents")}
            className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            ⚠️ Incidents
          </button>
          <button
            onClick={() => navigate("/admin/broadcast")}
            className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            📢 Broadcast
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">Admin Panel</span>
          <button
            onClick={logout}
            className="bg-red-500/80 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded-xl transition"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 p-5 flex flex-col gap-5">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Active Users" value={locations.filter(l => l.isSharing).length} color="border-blue-500/30" />
          <StatCard icon="📍" label="Total Tracked" value={locations.length} color="border-purple-500/30" />
          <StatCard icon="🚨" label="Active Alerts" value={unresolvedAlerts.length} color="border-red-500/30" />
          <StatCard icon="✅" label="Resolved" value={resolvedAlerts.length} color="border-green-500/30" />
        </div>

        {/* ── NEW ALERT TOAST ── */}
        <AnimatePresence>
          {newAlertFlash && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-600 text-white px-5 py-3 rounded-xl flex items-center gap-3 shadow-lg"
            >
              <span className="text-xl animate-pulse">🚨</span>
              <span className="font-semibold">New Emergency Alert Received!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">

          {/* MAP */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ minHeight: "60vh" }}>
            <GoogleMap
              mapContainerStyle={MAP_STYLE}
              center={CENTER}
              zoom={6}
              onLoad={(map) => (mapRef.current = map)}
              options={{
                styles: [
                  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
                  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
                  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
                  { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
                  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
                ],
              }}
            >
              {/* Live user markers */}
              {locations.map((user, i) => (
                <Marker
                  key={"u-" + i}
                  position={{ lat: user.lat, lng: user.lng }}
                  icon={{
                    url: "https://maps.google.com/mapfiles/kml/shapes/man.png",
                    scaledSize: new window.google.maps.Size(32, 32),
                  }}
                  onClick={() => setSelectedMarker({ type: "user", data: user })}
                />
              ))}

              {/* Alert markers */}
              {alerts.map((alert, i) => (
                <Marker
                  key={"a-" + i}
                  position={{ lat: alert.lat, lng: alert.lng }}
                  icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
                  onClick={() => setSelectedMarker({ type: "alert", data: alert })}
                />
              ))}

              {/* InfoWindow on click */}
              {selectedMarker && (
                <InfoWindow
                  position={{
                    lat: selectedMarker.data.lat,
                    lng: selectedMarker.data.lng,
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div style={{ color: "#111", minWidth: 160 }}>
                    {selectedMarker.type === "user" ? (
                      <>
                        <p style={{ fontWeight: 700, marginBottom: 4 }}>
                          👤 {selectedMarker.data.userId?.split("@")[0] || "User"}
                        </p>
                        <p style={{ fontSize: 12, color: "#555" }}>
                          {selectedMarker.data.userId}
                        </p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>
                          {selectedMarker.data.isSharing
                            ? "🟢 Sharing Live"
                            : "🔴 Sharing Stopped"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p style={{ fontWeight: 700, color: "#c0392b", marginBottom: 4 }}>
                          🚨 Emergency Alert
                        </p>
                        <p style={{ fontSize: 12 }}>{selectedMarker.data.userId}</p>
                        <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                          📍 {selectedMarker.data.lat?.toFixed(4)}, {selectedMarker.data.lng?.toFixed(4)}
                        </p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>
                          {selectedMarker.data.resolved ? "✅ Resolved" : "⚠️ Active"}
                        </p>
                      </>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>

          {/* SIDE PANEL */}
          <div className="flex flex-col gap-3 overflow-hidden">

            {/* Tabs */}
            <div className="flex bg-white/5 rounded-xl p-1 gap-1">
              {["alerts", "users"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab === "alerts" ? `🚨 Alerts (${unresolvedAlerts.length})` : `👥 Users (${locations.length})`}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: "55vh" }}>

              {/* ALERTS TAB */}
              {activeTab === "alerts" && (
                <>
                  {loading && (
                    <div className="text-center text-gray-500 py-8 text-sm">Loading alerts...</div>
                  )}
                  {error && (
                    <div className="text-center text-red-400 py-4 text-sm">{error}</div>
                  )}
                  {!loading && alerts.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-2">✅</p>
                      <p className="text-gray-400 text-sm">No alerts — all clear</p>
                    </div>
                  )}
                  {alerts.map((alert, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => focusAlert(alert)}
                      className={`cursor-pointer rounded-xl p-3 border transition ${
                        alert.resolved
                          ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/20"
                          : "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                      } ${selectedAlert?._id === alert._id ? "ring-2 ring-white/30" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">
                          {alert.resolved ? "✅" : "🚨"} {alert.userId?.split("@")[0] || "Unknown"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          alert.resolved ? "bg-green-500/30 text-green-300" : "bg-red-500/30 text-red-300"
                        }`}>
                          {alert.resolved ? "Resolved" : "Active"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{alert.userId}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {alert.lat?.toFixed(4)}, {alert.lng?.toFixed(4)}
                      </p>
                      {alert.createdAt && (
                        <p className="text-xs text-gray-600 mt-1">
                          🕐 {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </>
              )}

              {/* USERS TAB */}
              {activeTab === "users" && (
                <>
                  {locations.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-2">📡</p>
                      <p className="text-gray-400 text-sm">No users currently tracked</p>
                    </div>
                  )}
                  {locations.map((user, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => {
                        if (!mapRef.current) return;
                        mapRef.current.panTo({ lat: user.lat, lng: user.lng });
                        mapRef.current.setZoom(15);
                      }}
                      className="cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl p-3 transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">
                          👤 {user.userId?.split("@")[0] || "User"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          user.isSharing
                            ? "bg-green-500/30 text-green-300"
                            : "bg-gray-500/30 text-gray-400"
                        }`}>
                          {user.isSharing ? "🟢 Live" : "⚫ Offline"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{user.userId}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        📍 {user.lat?.toFixed(4)}, {user.lng?.toFixed(4)}
                      </p>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
