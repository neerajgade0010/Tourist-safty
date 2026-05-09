import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { stopSharing } from "../services/locationService";

import MapView from "../components/MapView";
import PlaceSearch from "../components/PlaceSearch";
import Chatbot from "../components/Chatbot";
import useLiveLocation from "../hooks/useLiveLocation";

const MapPage = () => {
  const { user } = useAuth();

  // ✅ Sharing state
  const [isSharing, setIsSharing] = useState(true);

  // ✅ Send location only when sharing ON
  useLiveLocation(user?._id || user?.email, isSharing);

  const [destination, setDestination] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);

  const [showHospitals, setShowHospitals] = useState(false);
  const [showPolice, setShowPolice] = useState(false);
  const [showRisk, setShowRisk] = useState(false);

  const [showShare, setShowShare] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const handleChatAction = (action) => {
    if (action === "SHOW_HOSPITALS") setShowHospitals(true);
    if (action === "SHOW_POLICE") setShowPolice(true);
    if (action === "SHOW_RISK") setShowRisk(true);
  };

  // ✅ SHARE LINK
  const handleShare = () => {
    if (!user) {
      alert("User not logged in");
      return;
    }

    const id = user._id || user.email;
    const link = `${window.location.origin}/track/${id}`;

    if (navigator.share) {
      navigator.share({
        title: "Live Location",
        text: "Track my live location",
        url: link
      });
    } else {
      setShareLink(link);
      setShowShare(true);
    }
  };

  // 🔥 STOP SHARING (SYNC WITH BACKEND)
  const handleToggleSharing = async () => {
    if (!user) return;

    const id = user._id || user.email;

    if (isSharing) {
      try {
        await stopSharing(id);
        setIsSharing(false);
      } catch (err) {
        console.error("Stop sharing failed:", err.message);
      }
    } else {
      setIsSharing(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white p-6">

      {/* 🔍 SEARCH */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <PlaceSearch setDestination={setDestination} />
      </motion.div>

      {/* 🟢 STATUS */}
      <div className="mb-4 font-semibold">
        {isSharing ? (
          <span className="text-green-400">🟢 Sharing ON</span>
        ) : (
          <span className="text-red-400">🔴 Sharing OFF</span>
        )}
      </div>

      {/* 🔘 BUTTONS */}
      <div className="flex gap-4 mb-6 flex-wrap">

        <button
          onClick={() => setShowHospitals(!showHospitals)}
          className="px-5 py-2 rounded-xl bg-blue-500/80 hover:bg-blue-600 shadow-lg"
        >
          🏥 Hospitals
        </button>

        <button
          onClick={() => setShowPolice(!showPolice)}
          className="px-5 py-2 rounded-xl bg-green-500/80 hover:bg-green-600 shadow-lg"
        >
          🚓 Police
        </button>

        <button
          onClick={() => setShowRisk(!showRisk)}
          className="px-5 py-2 rounded-xl bg-red-500/80 hover:bg-red-600 shadow-lg"
        >
          🚨 Risk Zones
        </button>

        {/* 📍 SHARE */}
        <button
          onClick={handleShare}
          className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 shadow-lg"
        >
          📍 Share Location
        </button>

        {/* 🔥 START / STOP */}
        <button
          onClick={handleToggleSharing}
          className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 shadow-lg"
        >
          {isSharing ? "⛔ Stop Sharing" : "▶️ Start Sharing"}
        </button>

      </div>

      {/* 🗺️ MAP + DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* MAP */}
        <motion.div className="lg:col-span-2 h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
          <MapView
            destination={destination}
            showHospitals={showHospitals}
            showPolice={showPolice}
            showRisk={showRisk}
            onPlaceDetails={setPlaceDetails}
          />
        </motion.div>

        {/* DETAILS */}
        <motion.div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 shadow-xl">
          {placeDetails ? (
            <>
              <h2 className="text-xl font-bold mb-2">
                📍 {placeDetails.name}
              </h2>

              <p className="text-sm text-gray-300 mb-3">
                {placeDetails.address}
              </p>

              <img
                src={placeDetails.photo || "https://via.placeholder.com/400"}
                alt="place"
                className="rounded-xl mb-3 h-48 w-full object-cover"
              />

              <p className="text-gray-200 text-sm">
                {placeDetails.description}
              </p>

              <div className="mt-4 text-green-400 font-semibold">
                🛡 Safety Score: {placeDetails.safety}%
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-center mt-20">
              🔍 Search a place to see details
            </p>
          )}
        </motion.div>

        {/* 🤖 CHATBOT */}
        <Chatbot
          context={{
            location: destination,
            destination,
            riskOn: showRisk,
            onAction: handleChatAction
          }}
        />

      </div>

      {/* 📤 SHARE POPUP */}
      {showShare && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-2xl w-[320px]">

            <h2 className="text-lg font-semibold mb-4">
              Share Location
            </h2>

            <div className="flex items-center border rounded-lg overflow-hidden mb-4">
              <input
                value={shareLink}
                readOnly
                className="flex-1 px-2 py-1 outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  alert("Copied!");
                }}
                className="bg-blue-500 text-white px-3 py-1"
              >
                Copy
              </button>
            </div>

            <div className="flex justify-around text-xl mb-4">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareLink)}`} target="_blank">🟢</a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareLink}`} target="_blank">🔵</a>
              <a href={`https://twitter.com/intent/tweet?url=${shareLink}`} target="_blank">⚫</a>
            </div>

            <button
              onClick={() => setShowShare(false)}
              className="w-full bg-gray-300 py-2 rounded-lg"
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default MapPage;