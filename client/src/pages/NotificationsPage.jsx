import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { getActiveBroadcasts } from "../services/broadcastService";

const STORAGE_KEY = "dismissed_broadcasts";
function getDismissed() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationsPage() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(getDismissed);

  useEffect(() => {
    const fetch = async () => { try { setBroadcasts(await getActiveBroadcasts()); } catch {} finally { setLoading(false); } };
    fetch();
    const i = setInterval(fetch, 30000);
    return () => clearInterval(i);
  }, []);

  const dismiss = (id) => { const u = [...dismissed, id]; localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); setDismissed(u); };
  const clearAll = () => { const u = [...new Set([...dismissed, ...broadcasts.map((b) => b._id)])]; localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); setDismissed(u); };

  const unread = broadcasts.filter((b) => !dismissed.includes(b._id));
  const read = broadcasts.filter((b) => dismissed.includes(b._id));

  return (
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full p-6 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-cyan-500 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-gray-500 text-sm">Admin broadcasts and safety alerts</p>
            </div>
          </div>
          {unread.length > 0 && (
            <button onClick={clearAll} className="text-xs text-gray-500 hover:text-white border border-white/10 px-3 py-1.5 rounded-xl transition">
              Mark all read
            </button>
          )}
        </div>

        {loading && <div className="text-center text-gray-600 py-16">Loading...</div>}

        {!loading && broadcasts.length === 0 && (
          <div className="text-center py-24">
            <p className="text-6xl mb-4 opacity-20">🔕</p>
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-gray-700 text-sm mt-1">Admin broadcasts will appear here</p>
          </div>
        )}

        {unread.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-3 font-medium">New · {unread.length}</p>
            <div className="space-y-3">
              <AnimatePresence>
                {unread.map((b) => (
                  <motion.div key={b._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="bg-blue-500/[0.08] border border-blue-500/20 rounded-2xl p-4 flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-lg shrink-0">📢</div>
                    <div className="flex-1">
                      <p className="text-white text-sm leading-relaxed">{b.message}</p>
                      <p className="text-gray-600 text-xs mt-2">{b.createdAt ? timeAgo(b.createdAt) : ""}</p>
                    </div>
                    <button onClick={() => dismiss(b._id)} className="text-gray-600 hover:text-white text-xl leading-none self-start transition">×</button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {read.length > 0 && (
          <div>
            <p className="text-xs text-gray-700 uppercase tracking-widest mb-3 font-medium">Earlier</p>
            <div className="space-y-3">
              {read.map((b) => (
                <div key={b._id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex gap-4 opacity-40">
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">📢</div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm leading-relaxed">{b.message}</p>
                    <p className="text-gray-700 text-xs mt-2">{b.createdAt ? timeAgo(b.createdAt) : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
