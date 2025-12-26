import express from "express";
import { auth } from "../middleware/auth.js";
import {
  getDashboard,
  getDashboardSummary,
  getDashboardTransactions,
  getDashboardBudgets,
  getDashboardSavings,
  getDashboardAnalytics,
} from "../controllers/dashboardController.js";

const router = express.Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard data
 *     description: Retrieves all user data including accounts, transactions, budgets, fixed expenses, possible expenses, and analytics in a single optimized API call
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: YYYY-MM
 *           example: "2024-01"
 *         description: Month for analytics data (optional, defaults to current month)
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DashboardData'
 *                 message:
 *                   type: string
 *                   example: Dashboard data retrieved successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", auth, getDashboard);

// Split endpoints for optimized loading
router.get("/summary", auth, getDashboardSummary);
router.get("/transactions", auth, getDashboardTransactions);
router.get("/budgets", auth, getDashboardBudgets);
router.get("/savings", auth, getDashboardSavings);
router.get("/analytics", auth, getDashboardAnalytics);

export default router;
