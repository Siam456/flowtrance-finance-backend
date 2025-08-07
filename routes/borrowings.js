import express from "express";
import { auth } from "../middleware/auth.js";
import { validateRequest, borrowingSchemas } from "../middleware/validation.js";
import {
  createBorrowing,
  getBorrowings,
  getBorrowingSummary,
  getPersonSummary,
  updateBorrowing,
  togglePaidStatus,
  deleteBorrowing,
} from "../controllers/borrowingController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Create a new borrowing record
router.post("/", validateRequest(borrowingSchemas.create), createBorrowing);

// Get all borrowing records with optional filters
router.get("/", getBorrowings);

// Get borrowing summary
router.get("/summary", getBorrowingSummary);

// Get person summary
router.get("/person/:personName", getPersonSummary);

// Update borrowing record
router.put("/:id", validateRequest(borrowingSchemas.update), updateBorrowing);

// Toggle paid status
router.patch("/:id/paid", togglePaidStatus);

// Delete borrowing record
router.delete("/:id", deleteBorrowing);

export default router;
