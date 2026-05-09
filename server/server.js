import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import blockchainRoutes from "./routes/blockchainRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import broadcastRoutes from "./routes/broadcastRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";

const app = express();

// ================= MIDDLEWARE =================
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174")
      .split(",")
      .map((o) => o.trim());
    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(null, true); // allow all in dev — change to callback(new Error(...)) in production
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ================= ROUTES =================
app.get("/", (req, res) => res.json({ message: "✅ API is running" }));

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/alert", alertRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/broadcasts", broadcastRoutes);
app.use("/api/incidents", incidentRoutes);

// ================= START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await connectDB();
});
