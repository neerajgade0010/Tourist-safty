import User from "../models/User.js";
import { verifyOnBlockchain } from "../utils/blockchain.js";

// GET /api/blockchain/verify/:touristId — public endpoint
export const verifyTouristId = async (req, res) => {
  try {
    const { touristId } = req.params;

    // Check DB first
    const user = await User.findOne({ touristId }).select("-password");
    if (!user) {
      return res.status(404).json({ valid: false, message: "Tourist ID not found" });
    }

    // Verify on blockchain
    const chainResult = await verifyOnBlockchain(touristId);

    res.json({
      valid: true,
      touristId: user.touristId,
      email: user.email,
      name: user.name || null,
      registeredAt: user.createdAt,
      blockchain: chainResult
        ? {
            verified: chainResult.valid,
            txHash: user.blockchainTxHash,
            registeredAt: chainResult.registeredAt
              ? new Date(chainResult.registeredAt).toISOString()
              : null,
            explorerUrl: user.blockchainTxHash
              ? `https://mumbai.polygonscan.com/tx/${user.blockchainTxHash}`
              : null,
          }
        : { verified: false, message: "Blockchain node unavailable" },
    });
  } catch (err) {
    console.error("Verify error:", err.message);
    res.status(500).json({ valid: false, message: "Verification failed" });
  }
};

// GET /api/blockchain/my-id — authenticated user gets their own ID
export const getMyTouristId = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      touristId: user.touristId,
      blockchainRegistered: user.blockchainRegistered,
      blockchainTxHash: user.blockchainTxHash,
      explorerUrl: user.blockchainTxHash
        ? `https://mumbai.polygonscan.com/tx/${user.blockchainTxHash}`
        : null,
      email: user.email,
      name: user.name,
      registeredAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch Tourist ID" });
  }
};
