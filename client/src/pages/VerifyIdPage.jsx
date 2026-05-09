import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function VerifyIdPage() {
  const [touristId, setTouristId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!touristId.trim()) { setError("Enter a Tourist ID"); return; }
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/blockchain/verify/${touristId.trim()}`
      );
      setResult(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ valid: false });
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col items-center justify-center p-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-gray-500 hover:text-white text-sm transition flex items-center gap-2"
      >
        ← Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-purple-500/20">
            🛡
          </div>
          <h1 className="text-2xl font-bold mb-1">Verify Tourist ID</h1>
          <p className="text-gray-500 text-sm">Check if a Tourist ID is valid on the blockchain</p>
        </div>

        {/* Input */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 mb-4">
          <label className="block text-xs text-gray-500 mb-2 font-medium">Tourist ID</label>
          <input
            value={touristId}
            onChange={(e) => setTouristId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            placeholder="e.g. TID-A1B2C3D4E5F6"
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition mb-4"
          />
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition shadow-lg shadow-purple-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying on blockchain...
              </span>
            ) : "🔍 Verify ID"}
          </button>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-2xl p-6 border ${
                result.valid
                  ? "bg-green-500/[0.08] border-green-500/25"
                  : "bg-red-500/[0.08] border-red-500/25"
              }`}
            >
              {result.valid ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">✅</span>
                    <div>
                      <p className="font-bold text-green-300">Valid Tourist ID</p>
                      <p className="text-xs text-gray-500">Verified on Polygon Mumbai Blockchain</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tourist ID</span>
                      <span className="font-mono text-white">{result.touristId}</span>
                    </div>
                    {result.name && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Name</span>
                        <span className="text-white">{result.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Registered</span>
                      <span className="text-white">{new Date(result.registeredAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">On-Chain</span>
                      <span className={result.blockchain?.verified ? "text-green-400" : "text-yellow-400"}>
                        {result.blockchain?.verified ? "✅ Confirmed" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                  {result.blockchain?.explorerUrl && (
                    <a
                      href={result.blockchain.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 py-2 rounded-xl text-xs text-gray-400 hover:text-white transition"
                    >
                      🔗 View transaction on PolygonScan
                    </a>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <span className="text-4xl block mb-3">❌</span>
                  <p className="font-bold text-red-300 mb-1">Invalid Tourist ID</p>
                  <p className="text-xs text-gray-500">This ID was not found in our registry</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
