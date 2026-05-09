import express from "express";
import { verifyTouristId, getMyTouristId } from "../controllers/blockchainController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-id", verifyToken, getMyTouristId);
router.get("/verify/:touristId", verifyTouristId); // public

export default router;
