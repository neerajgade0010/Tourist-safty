import { ethers } from "ethers";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let contract = null;

const getContract = () => {
  if (contract) return contract;

  const deploymentPath = path.join(__dirname, "../../blockchain/deployment.json");

  if (!fs.existsSync(deploymentPath)) {
    console.warn("⚠️ blockchain/deployment.json not found — blockchain features disabled");
    return null;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  contract = new ethers.Contract(deployment.address, deployment.abi, wallet);
  return contract;
};

// Generate a unique tourist ID from email + timestamp
export const generateTouristId = (email) => {
  const hash = ethers.keccak256(
    ethers.toUtf8Bytes(`${email}-${Date.now()}`)
  );
  return "TID-" + hash.slice(2, 14).toUpperCase();
};

// Register tourist on blockchain
export const registerOnBlockchain = async (touristId, email) => {
  const c = getContract();
  if (!c) return null;
   // transaction is mined and confirmed and then recipt is given 
  try {
    // blockchain operation request 
    const tx = await c.registerTourist(touristId, email);
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    console.error("Blockchain registration error:", err.message);
    return null;
  }
};

// Verify tourist ID on blockchain
export const verifyOnBlockchain = async (touristId) => {
  const c = getContract();
  if (!c) return null;

  try {
    // arr des
    const [valid, email, registeredAt] = await c.verifyTourist(touristId);
    return {
      valid,
      email,
      registeredAt: Number(registeredAt) * 1000, // convert to ms
    };
  } catch (err) {
    console.error("Blockchain verify error:", err.message);
    return null;
  }
};
