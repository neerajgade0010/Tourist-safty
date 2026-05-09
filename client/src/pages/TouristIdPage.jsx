import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function TouristIdPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/blockchain/my-id")
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load your Tourist ID"))
      .finally(() => setLoading(false));
  }, []);

  const copyId = () => {
    if (!data?.touristId) return;
    navigator.clipboard.writeText(data.touristId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050d1a] text-white flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-8 bg-purple-500 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold">My Tourist ID</h1>
            <p className="text-gray-500 text-sm">Blockchain-verified identity on Polygon Mumbai</p>
          </div>
        </div>

        {loading && (
          <div className="text-center py-20 text-gray-600">Loading your Tourist ID...</div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-6 text-center">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-5">
            {/* ID Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-cyan-600/10 border border-purple-500/30 rounded-3xl p-8 relative overflow-hidden"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 right-4 text-9xl">🌍</div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-500/40 flex items-center justify-center text-sm">🛡</div>
                  <span className="text-purple-300 text-sm font-semibold tracking-widest uppercase">Tourist Safety Network</span>
                </div>

                <p className="text-gray-400 text-xs mb-1">Tourist ID</p>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-3xl font-bold font-mono tracking-wider text-white">
                    {data.touristId || "Not assigned"}
                  </h2>
                  <button
                    onClick={copyId}
                    className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl transition"
                  >
                    {copied ? "✅ Copied" : "Copy"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Name</p>
                    <p className="text-white text-sm font-medium">{data.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Email</p>
                    <p className="text-white text-sm font-medium">{data.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Registered</p>
                    <p className="text-white text-sm">{data.registeredAt ? new Date(data.registeredAt).toLocaleDateString() : "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Blockchain Status</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                      data.blockchainRegistered
                        ? "bg-green-500/15 border-green-500/30 text-green-300"
                        : "bg-yellow-500/15 border-yellow-500/30 text-yellow-300"
                    }`}>
                      {data.blockchainRegistered ? "✅ On-Chain Verified" : "⏳ Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Blockchain details */}
            {data.blockchainRegistered && data.blockchainTxHash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/[0.04] border border-white/10 rounded-2xl p-5"
              >
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-medium">Blockchain Record</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Transaction Hash</p>
                    <p className="text-xs font-mono text-gray-300 break-all">{data.blockchainTxHash}</p>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={data.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                      🔍 View on PolygonScan
                    </a>
                    <button
                      onClick={() => navigate("/verify-id")}
                      className="flex-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                      ✅ Verify This ID
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Info box */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                Your Tourist ID is permanently recorded on the <span className="text-purple-400">Polygon Mumbai blockchain</span>. 
                It can be verified by hotels, tour operators, police, or hospitals — without any central authority. 
                Show your ID or share the verification link for instant identity confirmation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
