import { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CARDS = [
  {
    path: "/tourist-places",
    icon: "📍",
    title: "Tourist Places",
    desc: "Explore destinations with navigation & safety scores",
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/30",
    glow: "hover:shadow-blue-500/20",
    tag: "Explore",
    tagColor: "bg-blue-500/20 text-blue-300",
  },
  {
    path: "/risk-zones",
    icon: "🚨",
    title: "Risk Zones",
    desc: "Real-time danger areas with safety advisories",
    gradient: "from-red-500/20 to-orange-500/10",
    border: "border-red-500/30",
    glow: "hover:shadow-red-500/20",
    tag: "Safety",
    tagColor: "bg-red-500/20 text-red-300",
  },
  {
    path: "/nearby-help",
    icon: "🏥",
    title: "Nearby Help",
    desc: "Hospitals & police stations with live navigation",
    gradient: "from-green-500/20 to-emerald-500/10",
    border: "border-green-500/30",
    glow: "hover:shadow-green-500/20",
    tag: "Emergency",
    tagColor: "bg-green-500/20 text-green-300",
  },
  {
    path: "/emergency-contacts",
    icon: "🆘",
    title: "Emergency Contacts",
    desc: "Trusted contacts notified instantly on SOS",
    gradient: "from-orange-500/20 to-yellow-500/10",
    border: "border-orange-500/30",
    glow: "hover:shadow-orange-500/20",
    tag: "SOS",
    tagColor: "bg-orange-500/20 text-orange-300",
  },
  {
    path: "/offline-safety",
    icon: "📶",
    title: "Offline Safety",
    desc: "Emergency data cached for zero-internet zones",
    gradient: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/30",
    glow: "hover:shadow-purple-500/20",
    tag: "Offline",
    tagColor: "bg-purple-500/20 text-purple-300",
  },
  {
    path: "/report-incident",
    icon: "⚠️",
    title: "Report Incident",
    desc: "Pin theft, accidents & hazards on the live map",
    gradient: "from-yellow-500/20 to-amber-500/10",
    border: "border-yellow-500/30",
    glow: "hover:shadow-yellow-500/20",
    tag: "Report",
    tagColor: "bg-yellow-500/20 text-yellow-300",
  },
  {
    path: "/notifications",
    icon: "🔔",
    title: "Notifications",
    desc: "Admin safety broadcasts & critical alerts",
    gradient: "from-cyan-500/20 to-teal-500/10",
    border: "border-cyan-500/30",
    glow: "hover:shadow-cyan-500/20",
    tag: "Alerts",
    tagColor: "bg-cyan-500/20 text-cyan-300",
  },
  {
    path: "/my-id",
    icon: "🪪",
    title: "My Tourist ID",
    desc: "Blockchain-verified identity on Polygon — show to hotels, police & hospitals",
    gradient: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/30",
    glow: "hover:shadow-purple-500/20",
    tag: "Blockchain",
    tagColor: "bg-purple-500/20 text-purple-300",
  },
  {
    path: "/verify-id",
    icon: "✅",
    title: "Verify Tourist ID",
    desc: "Check if any Tourist ID is valid and recorded on the blockchain",
    gradient: "from-green-500/20 to-emerald-500/10",
    border: "border-green-500/30",
    glow: "hover:shadow-green-500/20",
    tag: "Public",
    tagColor: "bg-green-500/20 text-green-300",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function UserDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,180,255,${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const firstName = user?.email?.split("@")[0] || "Traveller";

  return (
    <div className="min-h-screen bg-[#050d1a] text-white overflow-hidden relative">

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Radial glow blobs */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── HEADER ── */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg shadow-lg shadow-blue-500/30">
            🌍
          </div>
          <span className="text-xl font-bold tracking-tight">Tourist Safety</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-300">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="bg-red-500/80 hover:bg-red-500 text-white text-sm px-4 py-2 rounded-xl transition font-medium"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <div className="relative z-10 px-8 pt-12 pb-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-blue-400 text-sm font-medium tracking-widest uppercase mb-2">
            Welcome back
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Hey, <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent capitalize">{firstName}</span> 👋
          </h1>
          <p className="text-gray-400 text-base max-w-lg">
            Your personal safety companion. Everything you need to explore safely — all in one place.
          </p>
        </motion.div>

        {/* Quick stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-4 mt-8 flex-wrap"
        >
          {[
            { label: "Features", value: "7", icon: "⚡" },
            { label: "Live Tracking", value: "ON", icon: "📡" },
            { label: "Safety Mode", value: "Active", icon: "🛡" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
              <span>{s.icon}</span>
              <span className="text-white font-semibold text-sm">{s.value}</span>
              <span className="text-gray-500 text-xs">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── CARDS ── */}
      <div className="relative z-10 px-8 pb-16 max-w-7xl mx-auto">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-5">All Features</p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {CARDS.map((card) => (
            <motion.div
              key={card.path}
              variants={cardVariants}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(card.path)}
              className={`
                relative overflow-hidden cursor-pointer rounded-2xl p-5
                bg-gradient-to-br ${card.gradient}
                border ${card.border}
                backdrop-blur-xl
                shadow-xl ${card.glow} hover:shadow-2xl
                transition-all duration-300 group
              `}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

              {/* Tag */}
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-4 ${card.tagColor}`}>
                {card.tag}
              </span>

              {/* Icon */}
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 inline-block">
                {card.icon}
              </div>

              {/* Text */}
              <h3 className="text-base font-bold text-white mb-1">{card.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>

              {/* Arrow */}
              <div className="mt-4 flex items-center gap-1 text-xs text-gray-500 group-hover:text-white transition-colors">
                <span>Open</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
