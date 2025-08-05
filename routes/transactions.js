import express from "express";
import { auth } from "../middleware/auth.js";
import { validate, transactionSchemas } from "../middleware/validation.js";
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getTransactionAnalytics,
} from "../controllers/transactionController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - type
 *               - amount
 *               - description
 *               - category
 *               - date
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: expense
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 150.00
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Grocery shopping"
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Food & Dining"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               time:
 *                 type: string
 *                 example: "14:30"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *                 message:
 *                   type: string
 *                   example: Transaction created successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", validate(transactionSchemas.create), createTransaction);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get user transactions with filters
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by transaction type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter by account ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of transactions to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 50
 *                         total:
 *                           type: integer
 *                           example: 150
 *                         pages:
 *                           type: integer
 *                           example: 3
 *                 message:
 *                   type: string
 *                   example: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", getTransactions);

/**
 * @swagger
 * /api/transactions/analytics:
 *   get:
 *     summary: Get transaction analytics
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
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
 *                     totalIncome:
 *                       type: number
 *                       example: 5000.00
 *                     totalExpenses:
 *                       type: number
 *                       example: 3200.00
 *                     netSavings:
 *                       type: number
 *                       example: 1800.00
 *                     categoryBreakdown:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                     monthlyTrend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: "2024-01"
 *                           income:
 *                             type: number
 *                             example: 5000.00
 *                           expenses:
 *                             type: number
 *                             example: 3200.00
 *                 message:
 *                   type: string
 *                   example: Analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/analytics", getTransactionAnalytics);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: expense
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 150.00
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Grocery shopping"
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Food & Dining"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               time:
 *                 type: string
 *                 example: "14:30"
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *                 message:
 *                   type: string
 *                   example: Transaction updated successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", validate(transactionSchemas.update), updateTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", deleteTransaction);

export default router;
