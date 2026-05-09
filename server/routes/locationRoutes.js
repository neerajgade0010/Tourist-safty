import express from "express";
import {
  updateLocation,
  getUserLocation,
  getAllLocations,
  stopSharing // ✅ FIXED IMPORT
} from "../controllers/locationController.js";

const router = express.Router();

router.post("/update", updateLocation);
router.get("/all", getAllLocations);
router.get("/:userId", getUserLocation);
router.post("/stop", stopSharing);

export default router;