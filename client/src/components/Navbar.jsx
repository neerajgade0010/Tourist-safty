import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getActiveBroadcasts } from "../services/broadcastService";

const NAV_LINKS = [
  { path: "/tourist-places", label: "📍 Tourist Places" },
  { path: "/risk-zones",     label: "🚨 Risk Zones" },
  { path: "/nearby-help",    label: "🏥 Nearby Help" },
  { path: "/emergency-contacts", label: "🆘 Emergency Contacts" },
  { path: "/offline-safety", label: "📶 Offline Safety" },
  { path: "/report-incident", label: "⚠️ Report Incident" },
];

const STORAGE_KEY = "dismissed_broadcasts";
function getDismissed() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await getActiveBroadcasts();
        const dismissed = getDismissed();
        setUnreadCount(data.filter((b) => !dismissed.includes(b._id)).length);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-black/40 backdrop-blur-md border-b border-white/10 px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
      <span
        className="text-white font-bold text-xl cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        🌍 Tourist Safety
      </span>

      <div className="flex gap-2 flex-wrap">
        {NAV_LINKS.map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition ${
              location.pathname === link.path
                ? "bg-white text-black"
                : "text-white hover:bg-white/20"
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative text-white hover:text-yellow-400 transition"
          title="Notifications"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <span className="text-gray-300 text-sm hidden sm:block">{user?.email}</span>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-xl text-sm transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
