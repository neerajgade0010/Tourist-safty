import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import { getAllUsers, deleteUser, resolveAlert } from "../controllers/adminController.js";
import { addClient, removeClient } from "../utils/sseManager.js";

const router = express.Router();

router.get("/users", verifyToken, verifyAdmin, getAllUsers);
router.delete("/users/:id", verifyToken, verifyAdmin, deleteUser);
router.patch("/alerts/:id/resolve", verifyToken, verifyAdmin, resolveAlert);

router.get("/sos-stream", verifyToken, verifyAdmin, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  addClient(res);

  req.on("close", () => {
    removeClient(res);
  });
});

export default router;
