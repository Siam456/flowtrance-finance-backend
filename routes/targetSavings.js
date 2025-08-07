import express from "express";
import { auth } from "../middleware/auth.js";
import {
  createTargetSavings,
  getUserTargetSavings,
  getTargetSavingsById,
  updateTargetSavings,
  deleteTargetSavings,
  checkTargetSavingsWarning,
  getSavingsOverview,
} from "../controllers/targetSavingsController.js";
import { validateRequest } from "../middleware/validation.js";
import { targetSavingsSchemas } from "../middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create a new target savings goal
router.post(
  "/",
  validateRequest(targetSavingsSchemas.create),
  createTargetSavings
);

// Get all target savings for the user
router.get("/", getUserTargetSavings);

// Get savings overview
router.get("/overview", getSavingsOverview);

// Get a specific target savings by ID
router.get("/:id", getTargetSavingsById);

// Update a target savings goal
router.put(
  "/:id",
  validateRequest(targetSavingsSchemas.update),
  updateTargetSavings
);

// Delete a target savings goal
router.delete("/:id", deleteTargetSavings);

// Check if a transaction would exceed target savings
router.post("/check-warning", checkTargetSavingsWarning);

export default router;
