import { useEffect, useState, useCallback } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import Navbar from "../components/Navbar";
import { createIncident, getIncidents, getMyIncidents } from "../services/incidentService";
import { getBoundingBox } from "../utils/boundingBox";
import { INCIDENT_ICONS, INCIDENT_LABELS } from "../utils/incidentIcons";

const MAP_CONTAINER = { width: "100%", height: "100%" };
const INCIDENT_TYPES = ["theft", "accident", "harassment", "other"];

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export default function ReportIncident() {
  const [pos, setPos] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [manualCoords, setManualCoords] = useState(false);

  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [incidentError, setIncidentError] = useState("");
  const [selectedIncident, setSelectedIncident] = useState(null);

  // User's own past reports
  const [myReports, setMyReports] = useState([]);
  const [loadingMyReports, setLoadingMyReports] = useState(true);

  const fetchIncidents = useCallback(async (latitude, longitude) => {
    setLoadingIncidents(true);
    setIncidentError("");
    try {
      const bbox = getBoundingBox(latitude, longitude, 10);
      const data = await getIncidents(bbox);
      setIncidents(data);
    } catch {
      setIncidentError("Failed to load nearby incidents.");
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPos({ lat: latitude, lng: longitude });
        setLat(latitude.toString());
        setLng(longitude.toString());
        fetchIncidents(latitude, longitude);
      },
      () => {
        setGeoError("Could not get your location. Please enter coordinates manually.");
        setManualCoords(true);
      }
    );
  }, [fetchIncidents]);

  // Fetch user's own reports on mount
  useEffect(() => {
    getMyIncidents()
      .then((data) => setMyReports(data))
      .catch(() => {})
      .finally(() => setLoadingMyReports(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccess(false);

    if (!type) return setFormError("Please select an incident type.");
    if (description.length < 10) return setFormError("Description must be at least 10 characters.");
    if (!lat || !lng) return setFormError("Coordinates are required.");

    setSubmitting(true);
    try {
      await createIncident({ type, description, lat: Number(lat), lng: Number(lng) });
      setSuccess(true);
      setType("");
      setDescription("");
      if (pos) fetchIncidents(pos.lat, pos.lng);
      // refresh own reports
      getMyIncidents().then((data) => setMyReports(data)).catch(() => {});
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to submit incident.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 gap-0 overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
        {/* Left: Form */}
        <div className="w-full md:w-[420px] flex-shrink-0 overflow-y-auto p-6 bg-[#0d1224] border-r border-white/10">
          <h1 className="text-2xl font-bold mb-6">⚠️ Report Incident</h1>

          {geoError && (
            <div className="bg-yellow-900/40 border border-yellow-600 text-yellow-300 rounded p-3 mb-4 text-sm">
              {geoError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Incident Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
                className="w-full bg-[#1f2937] text-white rounded p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type...</option>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {INCIDENT_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what happened (min 10 characters)..."
                className="w-full bg-[#1f2937] text-white rounded p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${description.length < 10 && description.length > 0 ? "text-red-400" : "text-gray-500"}`}>
                  {description.length < 10 && description.length > 0 ? `${10 - description.length} more chars needed` : ""}
                </span>
                <span className="text-xs text-gray-500">{description.length} chars</span>
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Latitude *</label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="e.g. 28.6139"
                  className="w-full bg-[#1f2937] text-white rounded p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Longitude *</label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="e.g. 77.2090"
                  className="w-full bg-[#1f2937] text-white rounded p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {formError && (
              <p className="text-red-400 text-sm">{formError}</p>
            )}
            {success && (
              <p className="text-green-400 text-sm">✅ Incident reported successfully!</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-2.5 rounded font-semibold transition"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>

          {/* My Past Reports */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3 text-gray-200">📋 My Reports</h2>
            {loadingMyReports && (
              <p className="text-gray-500 text-sm">Loading your reports...</p>
            )}
            {!loadingMyReports && myReports.length === 0 && (
              <p className="text-gray-600 text-sm">You haven't submitted any reports yet.</p>
            )}
            <div className="space-y-3">
              {myReports.map((r) => (
                <div
                  key={r._id}
                  className={`rounded-xl p-3 border text-sm ${
                    r.resolved
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{INCIDENT_LABELS[r.type]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      r.resolved
                        ? "bg-green-500/30 text-green-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}>
                      {r.resolved ? "✅ Resolved" : "⏳ Pending"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {r.description.length > 80 ? r.description.slice(0, 80) + "..." : r.description}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">{timeAgo(r.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Map */}
        <div className="flex-1 relative">
          {loadingIncidents && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/70 text-white text-sm px-4 py-2 rounded-full">
              Loading incidents...
            </div>
          )}
          {incidentError && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-red-900/80 text-red-300 text-sm px-4 py-2 rounded-full">
              {incidentError}
            </div>
          )}
          {pos ? (
            <GoogleMap
              mapContainerStyle={MAP_CONTAINER}
              center={pos}
              zoom={13}
              options={{ styles: [{ elementType: "geometry", stylers: [{ color: "#1d2c4d" }] }] }}
            >
              {/* User location */}
              <Marker
                position={pos}
                icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                title="Your location"
              />

              {/* Incident pins */}
              {incidents.map((inc) => (
                <Marker
                  key={inc._id}
                  position={{ lat: inc.lat, lng: inc.lng }}
                  icon={INCIDENT_ICONS[inc.type]}
                  onClick={() => setSelectedIncident(inc)}
                />
              ))}

              {selectedIncident && (
                <InfoWindow
                  position={{ lat: selectedIncident.lat, lng: selectedIncident.lng }}
                  onCloseClick={() => setSelectedIncident(null)}
                >
                  <div className="text-black text-sm max-w-[200px]">
                    <p className="font-bold mb-1">{INCIDENT_LABELS[selectedIncident.type]}</p>
                    <p className="mb-1">
                      {selectedIncident.description.length > 100
                        ? selectedIncident.description.slice(0, 100) + "..."
                        : selectedIncident.description}
                    </p>
                    <p className="text-gray-500 text-xs">{timeAgo(selectedIncident.createdAt)}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              {geoError ? "Enable location to see map" : "Getting your location..."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
