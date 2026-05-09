import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import Chatbot from "../components/Chatbot";

const EMERGENCY = [
  { label: "Police", number: "100", icon: "🚓", color: "blue" },
  { label: "Ambulance", number: "108", icon: "🚑", color: "green" },
  { label: "Fire", number: "101", icon: "🚒", color: "orange" },
  { label: "Women Helpline", number: "1091", icon: "👩", color: "purple" },
  { label: "Tourist Helpline", number: "1800-111-363", icon: "🌍", color: "cyan" },
];

export default function NearbyHelpPage() {
  const [showHospitals, setShowHospitals] = useState(false);
  const [showPolice, setShowPolice] = useState(false);

  return (
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col">
      <Navbar />

      <div className="flex-1 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-green-500 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold">Nearby Help</h1>
            <p className="text-gray-500 text-sm">Hospitals & police stations with live navigation</p>
          </div>
        </div>

        {/* Toggle buttons */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowHospitals((v) => !v)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 border ${
              showHospitals ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-white/[0.04] border-white/10 text-gray-400 hover:border-blue-500/30 hover:text-blue-300"}`}>
            🏥 {showHospitals ? "Hide Hospitals" : "Show Hospitals"}
          </button>
          <button onClick={() => setShowPolice((v) => !v)}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center gap-2 border ${
              showPolice ? "bg-green-500/20 border-green-500/40 text-green-300" : "bg-white/[0.04] border-white/10 text-gray-400 hover:border-green-500/30 hover:text-green-300"}`}>
            🚓 {showPolice ? "Hide Police" : "Show Police"}
          </button>
          {!showHospitals && !showPolice && (
            <span className="text-gray-600 text-sm self-center">← Toggle a layer to see nearby help</span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="lg:col-span-2 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ minHeight: "65vh" }}>
            <MapView destination={null} showHospitals={showHospitals} showPolice={showPolice} showRisk={false} onPlaceDetails={() => {}} />
          </motion.div>

          <div className="flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: "75vh" }}>
            {/* Emergency numbers */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">Emergency Numbers</p>
              <div className="space-y-2">
                {EMERGENCY.map((item) => (
                  <a key={item.label} href={`tel:${item.number}`}
                    className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 rounded-xl px-3 py-2.5 transition group">
                    <span className="text-sm text-gray-300 group-hover:text-white transition">{item.icon} {item.label}</span>
                    <span className="text-green-400 font-bold text-sm">{item.number}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* How to use */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">How to use</p>
              <ul className="space-y-2.5">
                {[
                  "Toggle Hospitals or Police to see nearby locations",
                  "Click any marker to see name, rating, and address",
                  "Map auto-fits to show the 3 nearest locations",
                  "Press 🚨 Emergency for instant hospital routing",
                ].map((t, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-gray-500">
                    <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>{t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Active layers */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">Active Layers</p>
              <div className="flex gap-2 flex-wrap">
                <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${showHospitals ? "bg-blue-500/20 border-blue-500/30 text-blue-300" : "bg-white/5 border-white/10 text-gray-600"}`}>
                  🏥 Hospitals {showHospitals ? "ON" : "OFF"}
                </span>
                <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${showPolice ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-white/5 border-white/10 text-gray-600"}`}>
                  🚓 Police {showPolice ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Chatbot title="Help Assistant" greeting="Hi 👋 I can help you find the nearest hospital, police station, or guide you in an emergency."
        context={{ pageHint: "nearby hospitals police emergency help", onAction: (a) => { if (a === "SHOW_HOSPITALS") setShowHospitals(true); if (a === "SHOW_POLICE") setShowPolice(true); } }} />
    </div>
  );
}
