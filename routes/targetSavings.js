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

/**
 * @swagger
 * /api/target-savings:
 *   post:
 *     summary: Create a new target savings goal
 *     tags: [Target Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, targetAmount, monthlyTarget, targetDate]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Car"
 *               targetAmount:
 *                 type: number
 *                 example: 15000
 *               monthlyTarget:
 *                 type: number
 *                 example: 500
 *               targetDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-06-01"
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *                 example: "#3B82F6"
 *     responses:
 *       201:
 *         description: Target savings created
 */
// Create a new target savings goal
router.post(
  "/",
  validateRequest(targetSavingsSchemas.create),
  createTargetSavings
);

/**
 * @swagger
 * /api/target-savings:
 *   get:
 *     summary: Get all target savings for the user
 *     tags: [Target Savings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of target savings
 */
// Get all target savings for the user
router.get("/", getUserTargetSavings);

/**
 * @swagger
 * /api/target-savings/overview:
 *   get:
 *     summary: Get savings overview
 *     tags: [Target Savings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview metrics
 */
// Get savings overview
router.get("/overview", getSavingsOverview);

/**
 * @swagger
 * /api/target-savings/{id}:
 *   get:
 *     summary: Get a specific target savings by ID
 *     tags: [Target Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Target savings detail
 */
// Get a specific target savings by ID
router.get("/:id", getTargetSavingsById);

/**
 * @swagger
 * /api/target-savings/{id}:
 *   put:
 *     summary: Update a target savings goal
 *     tags: [Target Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TargetSavings'
 *     responses:
 *       200:
 *         description: Updated target savings
 */
// Update a target savings goal
router.put(
  "/:id",
  validateRequest(targetSavingsSchemas.update),
  updateTargetSavings
);

/**
 * @swagger
 * /api/target-savings/{id}:
 *   delete:
 *     summary: Delete a target savings goal
 *     tags: [Target Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
// Delete a target savings goal
router.delete("/:id", deleteTargetSavings);

/**
 * @swagger
 * /api/target-savings/check-warning:
 *   post:
 *     summary: Check if a transaction would exceed any target savings
 *     tags: [Target Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 200
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: expense
 *     responses:
 *       200:
 *         description: Warning evaluation result
 */
// Check if a transaction would exceed target savings
router.post("/check-warning", checkTargetSavingsWarning);

export default router;
