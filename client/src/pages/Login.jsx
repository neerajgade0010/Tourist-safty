import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser } from "../services/authService";
import { AuthContext } from "../context/AuthContext";

const FEATURES = [
  { icon: "📍", text: "Live location tracking" },
  { icon: "🚨", text: "Real-time risk zone alerts" },
  { icon: "🏥", text: "Nearest hospital navigation" },
  { icon: "🆘", text: "Instant SOS broadcast" },
  { icon: "⚠️", text: "Incident reporting" },
  { icon: "📶", text: "Offline safety mode" },
];

export default function Login() {
  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Animated particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.3 + 0.1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120,200,255,${p.alpha})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleLogin = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const res = await loginUser(form);
      login(res.data);
      res.data.user.role === "admin" ? navigate("/admin") : navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  const isAdmin = role === "admin";

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#050d1a]">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden p-12">
        {/* Animated canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Gradient blobs */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl shadow-lg shadow-blue-500/30">
              🌍
            </div>
            <span className="text-white text-xl font-bold tracking-tight">Tourist Safety</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            Travel Smart.<br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400 bg-clip-text text-transparent">
              Stay Safe.
            </span>
          </h1>
          <p className="text-gray-400 text-lg mb-12 max-w-md">
            Your AI-powered safety companion for exploring the world with confidence.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-gray-300 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-gray-600 text-xs">
          © 2025 Tourist Safety. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Subtle right-side glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] to-[#050d1a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg">🌍</div>
            <span className="text-white text-lg font-bold">Tourist Safety</span>
          </div>

          {/* Card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">

            <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-7">Sign in to continue your journey</p>

            {/* Role toggle */}
            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-7 gap-1">
              {["user", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setError(""); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    role === r
                      ? r === "admin"
                        ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/20"
                        : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {r === "user" ? "👤" : "🛡"} {r === "user" ? "Tourist" : "Admin"}
                </button>
              ))}
            </div>

            {/* Role indicator */}
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`rounded-xl px-4 py-2.5 mb-6 text-xs font-medium flex items-center gap-2 ${
                  isAdmin
                    ? "bg-purple-500/10 border border-purple-500/20 text-purple-300"
                    : "bg-blue-500/10 border border-blue-500/20 text-blue-300"
                }`}
              >
                {isAdmin ? "🛡 Admin access — full platform control" : "👤 Tourist access — explore & stay safe"}
              </motion.div>
            </AnimatePresence>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onKeyDown={handleKey}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition"
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onKeyDown={handleKey}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm transition"
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-3 mb-5 flex items-center gap-2"
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg ${
                isAdmin
                  ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-purple-500/20"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/20"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                `Sign in as ${isAdmin ? "Admin" : "Tourist"} →`
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-600 text-xs">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Register */}
            <p className="text-center text-sm text-gray-500">
              New to Tourist Safety?{" "}
              <span
                onClick={() => navigate("/register")}
                className="text-blue-400 hover:text-blue-300 cursor-pointer font-medium transition"
              >
                Create account
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
