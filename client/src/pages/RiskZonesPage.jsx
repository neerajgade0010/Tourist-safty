import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import Chatbot from "../components/Chatbot";

const RISK_ZONES_INFO = [
  {
    label: "North Delhi", level: "High", reason: "High crime rate area",
    details: "Frequent incidents of theft, snatching, and street crime reported. Exercise caution especially after dark.",
    tips: ["Avoid isolated streets at night", "Keep valuables hidden", "Use registered taxis only"],
  },
  {
    label: "Noida", level: "Medium", reason: "Traffic & safety concerns",
    details: "Known for road accidents and isolated industrial zones. Avoid travelling alone at night.",
    tips: ["Stay on main roads", "Avoid industrial zones after dark", "Keep emergency contacts handy"],
  },
  {
    label: "Gurugram", level: "Medium", reason: "Reported criminal activity",
    details: "Incidents of vehicle theft and mugging reported in certain sectors. Stay in well-lit public areas.",
    tips: ["Park in secure lots", "Avoid deserted sectors at night", "Travel in groups when possible"],
  },
];

export default function RiskZonesPage() {
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col">
      <Navbar />

      <div className="flex-1 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-red-500 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold">Risk Zone Monitor</h1>
            <p className="text-gray-500 text-sm">Real-time danger areas — click a zone for details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="lg:col-span-2 rounded-2xl overflow-hidden shadow-2xl border border-red-900/20"
            style={{ minHeight: "65vh" }}>
            <MapView destination={null} showHospitals={false} showPolice={false} showRisk={true} onPlaceDetails={() => {}} />
          </motion.div>

          <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: "75vh" }}>
            <p className="text-xs text-gray-600 uppercase tracking-widest font-medium">Active Zones</p>

            {RISK_ZONES_INFO.map((zone) => (
              <motion.div key={zone.label} whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedZone(selectedZone?.label === zone.label ? null : zone)}
                className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                  zone.level === "High"
                    ? "bg-red-500/[0.07] border-red-500/25 hover:border-red-500/50"
                    : "bg-orange-500/[0.07] border-orange-500/25 hover:border-orange-500/50"
                } ${selectedZone?.label === zone.label ? "ring-1 ring-white/20" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">🚨 {zone.label}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${zone.level === "High" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-orange-500/20 text-orange-300 border border-orange-500/30"}`}>
                    {zone.level} Risk
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-300 mb-1">⚠️ {zone.reason}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{zone.details}</p>

                {selectedZone?.label === zone.label && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs font-semibold text-white mb-2">🛡 Safety Tips</p>
                    <ul className="space-y-1.5">
                      {zone.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-gray-400 flex gap-2">
                          <span className="text-green-400 mt-0.5">✓</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            ))}

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-semibold text-yellow-400 mb-3">📋 General Advisory</p>
              <ul className="space-y-2 text-xs text-gray-500">
                {["Always share your live location with a trusted contact", "Keep local emergency numbers saved: Police 100, Ambulance 108", "Avoid displaying expensive items in public", "Use the Emergency button on the map for instant SOS"].map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-yellow-500 mt-0.5">•</span>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Chatbot title="Safety Assistant" greeting="Hi 👋 I can help you understand risk zones, safety tips, and what to do in an emergency."
        context={{ pageHint: "risk zones safety emergency" }} />
    </div>
  );
}
