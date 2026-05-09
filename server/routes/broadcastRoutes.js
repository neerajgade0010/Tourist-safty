import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import {
  createBroadcast,
  getAllBroadcasts,
  getActiveBroadcasts,
  updateBroadcast,
  deleteBroadcast,
} from "../controllers/broadcastController.js";

const router = express.Router();

router.post("/", verifyToken, verifyAdmin, createBroadcast);
router.get("/", verifyToken, verifyAdmin, getAllBroadcasts);
router.get("/active", verifyToken, getActiveBroadcasts);
router.patch("/:id", verifyToken, verifyAdmin, updateBroadcast);
router.delete("/:id", verifyToken, verifyAdmin, deleteBroadcast);

export default router;
