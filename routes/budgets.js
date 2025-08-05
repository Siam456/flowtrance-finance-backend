import express from "express";
import { auth } from "../middleware/auth.js";
import { validate, budgetSchemas } from "../middleware/validation.js";
import {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetAnalytics,
} from "../controllers/budgetController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Create a new budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - amount
 *               - month
 *             properties:
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Food & Dining"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 500.00
 *               month:
 *                 type: string
 *                 format: YYYY-MM
 *                 example: "2024-01"
 *     responses:
 *       201:
 *         description: Budget created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Budget'
 *                 message:
 *                   type: string
 *                   example: Budget created successfully
 */
router.post("/", validate(budgetSchemas.create), createBudget);

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Get user budgets
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: YYYY-MM
 *         description: Filter by month (optional)
 *     responses:
 *       200:
 *         description: Budgets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Budget'
 */
router.get("/", getBudgets);

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Update a budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 maxLength: 50
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               month:
 *                 type: string
 *                 format: YYYY-MM
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Budget'
 */
router.put("/:id", validate(budgetSchemas.update), updateBudget);

/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     summary: Delete a budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: Budget deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Budget deleted successfully
 */
router.delete("/:id", deleteBudget);

/**
 * @swagger
 * /api/budgets/analytics:
 *   get:
 *     summary: Get budget analytics
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *           format: YYYY-MM
 *         description: Month for analytics
 *     responses:
 *       200:
 *         description: Budget analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     month:
 *                       type: string
 *                     totalBudget:
 *                       type: number
 *                     totalSpent:
 *                       type: number
 *                     totalRemaining:
 *                       type: number
 *                     overallPercentageUsed:
 *                       type: number
 *                     budgets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           budgetAmount:
 *                             type: number
 *                           totalSpent:
 *                             type: number
 *                           remaining:
 *                             type: number
 *                           percentageUsed:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [good, warning, exceeded]
 */
router.get("/analytics", getBudgetAnalytics);

export default router;
