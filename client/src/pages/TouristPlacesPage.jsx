import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { stopSharing } from "../services/locationService";
import useLiveLocation from "../hooks/useLiveLocation";
import Navbar from "../components/Navbar";
import PlaceSearch from "../components/PlaceSearch";
import MapView from "../components/MapView";
import Chatbot from "../components/Chatbot";

export default function TouristPlacesPage() {
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(true);
  const [destination, setDestination] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [shareLink, setShareLink] = useState("");

  useLiveLocation(user?.email, isSharing);

  const handleToggleSharing = async () => {
    if (!user) return;
    if (isSharing) {
      try { await stopSharing(user.email); } catch {}
      setIsSharing(false);
    } else {
      setIsSharing(true);
    }
  };

  const handleShare = () => {
    const link = `${window.location.origin}/track/${user.email}`;
    if (navigator.share) {
      navigator.share({ title: "Live Location", url: link });
    } else {
      setShareLink(link);
      setShowShare(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col">
      <Navbar />

      <div className="flex-1 p-5 flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <PlaceSearch setDestination={setDestination} />
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border ${isSharing ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
            <span className={`w-2 h-2 rounded-full ${isSharing ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            {isSharing ? "Live" : "Paused"}
          </div>
          <button onClick={handleShare} className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 text-sm transition">
            📍 Share
          </button>
          <button onClick={handleToggleSharing} className={`px-4 py-2 rounded-xl text-sm font-medium transition border ${isSharing ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"}`}>
            {isSharing ? "⛔ Stop" : "▶️ Start"}
          </button>
        </div>

        {/* Map + Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="lg:col-span-2 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ minHeight: "65vh" }}>
            <MapView destination={destination} showHospitals={false} showPolice={false} showRisk={false} onPlaceDetails={setPlaceDetails} />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 shadow-xl overflow-y-auto backdrop-blur-xl"
            style={{ maxHeight: "75vh" }}>
            {placeDetails ? (
              <>
                <h2 className="text-xl font-bold mb-1">📍 {placeDetails.name}</h2>
                <p className="text-sm text-gray-400 mb-3">{placeDetails.address}</p>
                <img src={placeDetails.photo || "https://via.placeholder.com/400"} alt={placeDetails.name}
                  className="rounded-xl mb-3 h-44 w-full object-cover" />
                {placeDetails.rating && <p className="text-yellow-400 text-sm mb-2">⭐ {placeDetails.rating} / 5</p>}
                <p className="text-gray-300 text-sm leading-relaxed mb-4">{placeDetails.description}</p>
                <div className={`font-semibold text-sm px-4 py-2.5 rounded-xl inline-flex items-center gap-2 ${
                  placeDetails.safety >= 80 ? "bg-green-500/15 border border-green-500/30 text-green-300" :
                  placeDetails.safety >= 65 ? "bg-yellow-500/15 border border-yellow-500/30 text-yellow-300" :
                  "bg-red-500/15 border border-red-500/30 text-red-300"}`}>
                  🛡 Safety Score: {placeDetails.safety}%
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-16">
                <span className="text-5xl opacity-30">🔍</span>
                <p className="text-gray-500 text-sm">Search a tourist place to see details and safety score</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {showShare && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1224] border border-white/10 text-white p-6 rounded-2xl w-[340px] shadow-2xl">
            <h2 className="text-lg font-semibold mb-4">📍 Share Live Location</h2>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-4">
              <input value={shareLink} readOnly className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-gray-300" />
              <button onClick={() => navigator.clipboard.writeText(shareLink)} className="bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500 transition">Copy</button>
            </div>
            <div className="flex justify-around text-2xl mb-4">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareLink)}`} target="_blank" rel="noreferrer" className="hover:scale-110 transition">🟢</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareLink}`} target="_blank" rel="noreferrer" className="hover:scale-110 transition">🔵</a>
              <a href={`https://twitter.com/intent/tweet?url=${shareLink}`} target="_blank" rel="noreferrer" className="hover:scale-110 transition">⚫</a>
            </div>
            <button onClick={() => setShowShare(false)} className="w-full bg-white/5 border border-white/10 hover:bg-white/10 py-2 rounded-xl text-sm transition">Close</button>
          </div>
        </div>
      )}

      <Chatbot title="Tourist Assistant" greeting="Hi 👋 Ask me about any tourist place — history, safety, what to see, or how to get there!"
        context={{ placeName: placeDetails?.name, pageHint: "tourist places navigation" }} />
    </div>
  );
}
