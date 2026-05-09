import express from "express";
import { chatWithAI } from "../controllers/aiController.js";

const router = express.Router();

// ================= AI ROUTE =================
router.post("/chat", chatWithAI);

export default router;