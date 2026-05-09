import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { registerUser } from "../services/authService";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleRegister = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    setLoading(true);
    try {
      await registerUser(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleRegister(); };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#050d1a]">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center w-[55%] relative overflow-hidden p-12">
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl shadow-lg shadow-blue-500/30">🌍</div>
            <span className="text-white text-xl font-bold">Tourist Safety</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            Join the<br />
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Safety Network.</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10 max-w-md">
            Create your account and start exploring the world with real-time safety tools at your fingertips.
          </p>
          <div className="space-y-3">
            {["Free to use — no credit card needed", "Real-time SOS alerts to trusted contacts", "Works offline in remote areas", "AI-powered safety assistant"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <span className="text-cyan-400 text-xs">✓</span>
                </div>
                <span className="text-gray-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] to-[#050d1a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-[420px]"
        >
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg">🌍</div>
            <span className="text-white text-lg font-bold">Tourist Safety</span>
          </div>

          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
            <p className="text-gray-500 text-sm mb-7">Join thousands of safe travellers</p>

            <div className="space-y-4 mb-6">
              {[
                { label: "Full Name", name: "name", type: "text", placeholder: "John Doe" },
                { label: "Email address", name: "email", type: "email", placeholder: "you@example.com" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">{f.label}</label>
                  <input
                    type={f.type}
                    name={f.name}
                    value={form[f.name]}
                    onChange={handleChange}
                    onKeyDown={handleKey}
                    placeholder={f.placeholder}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onKeyDown={handleKey}
                    placeholder="Min. 6 characters"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition pr-12"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm transition">
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create Account →"}
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-600 text-xs">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <span onClick={() => navigate("/")} className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium transition">
                Sign in
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
