import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAllBroadcasts, createBroadcast, updateBroadcast, deleteBroadcast } from "../services/broadcastService";
import api from "../services/api";

const MAX_CHARS = 500;

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

export default function AdminBroadcast() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Recipient selection
  const [sendMode, setSendMode] = useState("all"); // "all" | "specific"
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => { getAllBroadcasts().then(setBroadcasts).finally(() => setLoading(false)); }, []);

  // Fetch users when switching to specific mode
  useEffect(() => {
    if (sendMode === "specific" && allUsers.length === 0) {
      setLoadingUsers(true);
      api.get("/admin/users")
        .then((res) => setAllUsers(res.data))
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    }
  }, [sendMode]);

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!message.trim()) { setError("Message cannot be empty."); return; }
    if (message.trim().length > MAX_CHARS) { setError(`Max ${MAX_CHARS} characters.`); return; }
    if (sendMode === "specific" && selectedUsers.length === 0) { setError("Select at least one user."); return; }
    setSubmitting(true);
    try {
      const payload = {
        message: message.trim(),
        recipients: sendMode === "specific" ? selectedUsers : [],
      };
      const created = await createBroadcast(payload);
      setBroadcasts((p) => [created, ...p]);
      setMessage("");
      setSelectedUsers([]);
      setSendMode("all");
    } catch (err) { setError(err.response?.data?.error || "Failed to send."); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (b) => {
    try { const u = await updateBroadcast(b._id, { active: !b.active }); setBroadcasts((p) => p.map((x) => x._id === u._id ? u : x)); } catch {}
  };

  const handleDelete = async (id) => {
    try { await deleteBroadcast(id); setBroadcasts((p) => p.filter((b) => b._id !== id)); } catch {}
  };

  const active = broadcasts.filter((b) => b.active).length;

  return (
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col">
      <AdminNav active="/admin/broadcast" />

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-8 bg-blue-500 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold">Broadcast Messages</h1>
            <p className="text-gray-500 text-sm">{active} active broadcast{active !== 1 ? "s" : ""} showing to users</p>
          </div>
        </div>

        {/* Compose */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-6 backdrop-blur-xl">
          <h2 className="text-base font-semibold mb-4 text-gray-200">New Broadcast</h2>
          <form onSubmit={handleSubmit}>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={MAX_CHARS + 1}
              placeholder="Type your safety broadcast message..."
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl p-4 resize-none text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition" />
            <div className="flex items-center justify-between mt-2 mb-5">
              <span className={`text-xs ${message.trim().length > MAX_CHARS ? "text-red-400" : "text-gray-600"}`}>
                {message.trim().length}/{MAX_CHARS}
              </span>
              <AnimatePresence>
                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-400 text-xs">{error}</motion.p>}
              </AnimatePresence>
            </div>

            {/* Recipient selector */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-2 font-medium">Send to</p>
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1 mb-3">
                {[["all", "📢 All Users"], ["specific", "👤 Specific Users"]].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => { setSendMode(val); setSelectedUsers([]); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${sendMode === val ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {sendMode === "specific" && (
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 max-h-48 overflow-y-auto">
                  {loadingUsers && <p className="text-gray-600 text-xs text-center py-4">Loading users...</p>}
                  {!loadingUsers && allUsers.length === 0 && (
                    <p className="text-gray-600 text-xs text-center py-4">No users found</p>
                  )}
                  {allUsers.map((u) => (
                    <label key={u._id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 cursor-pointer transition">
                      <input type="checkbox" checked={selectedUsers.includes(u._id)}
                        onChange={() => toggleUser(u._id)}
                        className="w-4 h-4 rounded accent-blue-500" />
                      <div>
                        <p className="text-sm text-white">{u.email}</p>
                        <p className="text-xs text-gray-600 capitalize">{u.role}</p>
                      </div>
                    </label>
                  ))}
                  {selectedUsers.length > 0 && (
                    <p className="text-xs text-blue-400 mt-2 px-2">{selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""} selected</p>
                  )}
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-blue-500/20">
              {submitting ? "Sending..." : sendMode === "all" ? "📢 Send to All Users" : `📢 Send to ${selectedUsers.length} User${selectedUsers.length !== 1 ? "s" : ""}`}
            </button>
          </form>
        </div>

        {/* List */}
        <div>
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-4 font-medium">All Broadcasts</p>
          {loading ? <p className="text-gray-600 text-sm">Loading...</p> :
            broadcasts.length === 0 ? (
              <div className="text-center py-12 text-gray-700">
                <p className="text-4xl mb-2 opacity-30">📢</p>
                <p className="text-sm">No broadcasts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {broadcasts.map((b) => (
                    <motion.div key={b._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                      <p className="text-white text-sm mb-2 leading-relaxed">{b.message}</p>
                      {b.recipients?.length > 0 && (
                        <p className="text-xs text-blue-400 mb-2">👤 Sent to {b.recipients.length} specific user{b.recipients.length !== 1 ? "s" : ""}</p>
                      )}
                      {(!b.recipients || b.recipients.length === 0) && (
                        <p className="text-xs text-gray-600 mb-2">📢 Sent to all users</p>
                      )}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 text-xs">{b.createdAt ? timeAgo(b.createdAt) : ""}</span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${b.active ? "bg-green-500/15 border-green-500/30 text-green-300" : "bg-gray-500/15 border-gray-500/30 text-gray-500"}`}>
                            {b.active ? "● Active" : "○ Inactive"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleToggle(b)}
                            className={`text-xs px-3 py-1.5 rounded-xl border transition ${b.active ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20" : "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"}`}>
                            {b.active ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => handleDelete(b._id)}
                            className="text-xs px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition">
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
