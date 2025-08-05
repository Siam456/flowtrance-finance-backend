import express from "express";
import { auth } from "../middleware/auth.js";
import { validate, fixedExpenseSchemas } from "../middleware/validation.js";
import {
  createFixedExpense,
  getFixedExpenses,
  updateFixedExpense,
  deleteFixedExpense,
  markAsPaid,
  getUpcomingExpenses,
} from "../controllers/fixedExpenseController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/fixed-expenses:
 *   post:
 *     summary: Create a new fixed expense
 *     tags: [Fixed Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - amount
 *               - category
 *               - dueDate
 *               - accountId
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Rent Payment"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 1200.00
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Housing"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               accountId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               isPaid:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Fixed expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FixedExpense'
 *                 message:
 *                   type: string
 *                   example: Fixed expense created successfully
 */
router.post("/", validate(fixedExpenseSchemas.create), createFixedExpense);

/**
 * @swagger
 * /api/fixed-expenses:
 *   get:
 *     summary: Get user fixed expenses
 *     tags: [Fixed Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isPaid
 *         schema:
 *           type: boolean
 *         description: Filter by payment status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Fixed expenses retrieved successfully
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
 *                     $ref: '#/components/schemas/FixedExpense'
 */
router.get("/", getFixedExpenses);

/**
 * @swagger
 * /api/fixed-expenses/{id}:
 *   put:
 *     summary: Update a fixed expense
 *     tags: [Fixed Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fixed expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               category:
 *                 type: string
 *                 maxLength: 50
 *               dueDate:
 *                 type: string
 *                 format: date
 *               accountId:
 *                 type: string
 *               isPaid:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Fixed expense updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FixedExpense'
 */
router.put("/:id", validate(fixedExpenseSchemas.update), updateFixedExpense);

/**
 * @swagger
 * /api/fixed-expenses/{id}:
 *   delete:
 *     summary: Delete a fixed expense
 *     tags: [Fixed Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fixed expense ID
 *     responses:
 *       200:
 *         description: Fixed expense deleted successfully
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
 *                   example: Fixed expense deleted successfully
 */
router.delete("/:id", deleteFixedExpense);

/**
 * @swagger
 * /api/fixed-expenses/{id}/mark-paid:
 *   patch:
 *     summary: Mark fixed expense as paid
 *     tags: [Fixed Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fixed expense ID
 *     responses:
 *       200:
 *         description: Fixed expense marked as paid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FixedExpense'
 *                 message:
 *                   type: string
 *                   example: Fixed expense marked as paid
 */
router.patch("/:id/mark-paid", markAsPaid);

/**
 * @swagger
 * /api/fixed-expenses/upcoming:
 *   get:
 *     summary: Get upcoming fixed expenses
 *     tags: [Fixed Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look ahead
 *     responses:
 *       200:
 *         description: Upcoming expenses retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       category:
 *                         type: string
 *                       dueDate:
 *                         type: string
 *                         format: date
 *                       isPaid:
 *                         type: boolean
 *                       account:
 *                         type: string
 *                       accountName:
 *                         type: string
 *                       daysUntilDue:
 *                         type: integer
 */
router.get("/upcoming", getUpcomingExpenses);

export default router;
