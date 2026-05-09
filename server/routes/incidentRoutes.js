import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import {
  createIncident,
  getIncidents,
  getAllIncidents,
  resolveIncident,
  getMyIncidents,
} from "../controllers/incidentController.js";

const router = express.Router();

router.post("/", verifyToken, createIncident);
router.get("/mine", verifyToken, getMyIncidents);
router.get("/", verifyToken, getIncidents);
router.get("/all", verifyToken, verifyAdmin, getAllIncidents);
router.patch("/:id/resolve", verifyToken, verifyAdmin, resolveIncident);

export default router;
