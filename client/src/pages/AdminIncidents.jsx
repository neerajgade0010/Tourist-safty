import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getAllIncidents, resolveIncident } from "../services/incidentService";
import { INCIDENT_LABELS } from "../utils/incidentIcons";

const TYPE_STYLES = {
  theft:      "bg-yellow-500/15 border-yellow-500/30 text-yellow-300",
  accident:   "bg-orange-500/15 border-orange-500/30 text-orange-300",
  harassment: "bg-purple-500/15 border-purple-500/30 text-purple-300",
  other:      "bg-blue-500/15 border-blue-500/30 text-blue-300",
};

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`;
}

const AdminNav = ({ active }) => (
  <header className="bg-black/40 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm">🛡</div>
      <span className="text-white font-bold">SafeTrack Admin</span>
    </div>
    <div className="flex gap-2">
      {[{ to: "/admin", label: "📊 Dashboard" }, { to: "/admin/incidents", label: "⚠️ Incidents" }, { to: "/admin/broadcast", label: "📢 Broadcast" }].map((l) => (
        <Link key={l.to} to={l.to}
          className={`text-sm px-3 py-1.5 rounded-xl transition ${active === l.to ? "bg-blue-600 text-white" : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"}`}>
          {l.label}
        </Link>
      ))}
    </div>
  </header>
);

export default function AdminIncidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { getAllIncidents().then(setIncidents).catch(() => setError("Failed to load incidents.")).finally(() => setLoading(false)); }, []);

  const handleResolve = async (id) => {
    try { const u = await resolveIncident(id); setIncidents((p) => p.map((i) => i._id === u._id ? u : i)); } catch {}
  };

  const filtered = incidents.filter((i) => {
    if (typeFilter !== "all" && i.type !== typeFilter) return false;
    if (statusFilter === "unresolved" && i.resolved) return false;
    if (statusFilter === "resolved" && !i.resolved) return false;
    return true;
  });

  const total = incidents.length;
  const unresolved = incidents.filter((i) => !i.resolved).length;
  const resolved = incidents.filter((i) => i.resolved).length;

  return (
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col">
      <AdminNav active="/admin/incidents" />

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-8 bg-orange-500 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold">Incident Reports</h1>
            <p className="text-gray-500 text-sm">Tourist-submitted safety incidents</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total", value: total, color: "text-white", bg: "bg-white/[0.04] border-white/10" },
            { label: "Unresolved", value: unresolved, color: "text-red-400", bg: "bg-red-500/[0.07] border-red-500/20" },
            { label: "Resolved", value: resolved, color: "text-green-400", bg: "bg-green-500/[0.07] border-green-500/20" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border rounded-2xl p-4 text-center`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            { label: "Type", value: typeFilter, setter: setTypeFilter, options: [["all", "All Types"], ["theft", "Theft"], ["accident", "Accident"], ["harassment", "Harassment"], ["other", "Other"]] },
            { label: "Status", value: statusFilter, setter: setStatusFilter, options: [["all", "All"], ["unresolved", "Unresolved"], ["resolved", "Resolved"]] },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-xs text-gray-600 mb-1">{f.label}</label>
              <select value={f.value} onChange={(e) => f.setter(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500/50 transition">
                {f.options.map(([v, l]) => <option key={v} value={v} className="bg-gray-900">{l}</option>)}
              </select>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? <p className="text-gray-600 text-sm">Loading incidents...</p> :
          error ? <p className="text-red-400 text-sm">{error}</p> :
          filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-700">
              <p className="text-4xl mb-2 opacity-30">⚠️</p>
              <p className="text-sm">No incidents found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((inc) => (
                <motion.div key={inc._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${TYPE_STYLES[inc.type]}`}>
                          {INCIDENT_LABELS[inc.type]}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${inc.resolved ? "bg-green-500/15 border-green-500/30 text-green-300" : "bg-red-500/15 border-red-500/30 text-red-300"}`}>
                          {inc.resolved ? "✅ Resolved" : "⏳ Pending"}
                        </span>
                        <span className="text-gray-600 text-xs">{inc.createdAt ? timeAgo(inc.createdAt) : ""}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2 leading-relaxed">
                        {inc.description.length > 120 ? inc.description.slice(0, 120) + "..." : inc.description}
                      </p>
                      <p className="text-gray-600 text-xs">📍 {inc.lat?.toFixed(4)}, {inc.lng?.toFixed(4)}</p>
                    </div>
                    {!inc.resolved && (
                      <button onClick={() => handleResolve(inc._id)}
                        className="shrink-0 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs px-3 py-1.5 rounded-xl transition font-medium">
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
