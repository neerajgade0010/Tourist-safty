import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getContacts, createContact, deleteContact } from "../controllers/contactController.js";

const router = express.Router();

router.get("/", verifyToken, getContacts);
router.post("/", verifyToken, createContact);
router.delete("/:id", verifyToken, deleteContact);

export default router;
