import express from "express";
import { auth } from "../middleware/auth.js";
import { validate, possibleExpenseSchemas } from "../middleware/validation.js";
import {
  createPossibleExpense,
  getPossibleExpenses,
  updatePossibleExpense,
  deletePossibleExpense,
  getPossibleExpensesByCategory,
  convertToTransaction,
} from "../controllers/possibleExpenseController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/possible-expenses:
 *   post:
 *     summary: Create a new possible expense
 *     tags: [Possible Expenses]
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
 *               - expectedAmount
 *               - category
 *               - accountId
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Vacation Trip"
 *               expectedAmount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 2000.00
 *               category:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Travel"
 *               accountId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Planning for summer vacation"
 *     responses:
 *       201:
 *         description: Possible expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PossibleExpense'
 *                 message:
 *                   type: string
 *                   example: Possible expense created successfully
 */
router.post(
  "/",
  validate(possibleExpenseSchemas.create),
  createPossibleExpense
);

/**
 * @swagger
 * /api/possible-expenses:
 *   get:
 *     summary: Get user possible expenses
 *     tags: [Possible Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Possible expenses retrieved successfully
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
 *                     $ref: '#/components/schemas/PossibleExpense'
 */
router.get("/", getPossibleExpenses);

/**
 * @swagger
 * /api/possible-expenses/{id}:
 *   put:
 *     summary: Update a possible expense
 *     tags: [Possible Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Possible expense ID
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
 *               expectedAmount:
 *                 type: number
 *                 minimum: 0.01
 *               category:
 *                 type: string
 *                 maxLength: 50
 *               accountId:
 *                 type: string
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Possible expense updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PossibleExpense'
 */
router.put(
  "/:id",
  validate(possibleExpenseSchemas.update),
  updatePossibleExpense
);

/**
 * @swagger
 * /api/possible-expenses/{id}:
 *   delete:
 *     summary: Delete a possible expense
 *     tags: [Possible Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Possible expense ID
 *     responses:
 *       200:
 *         description: Possible expense deleted successfully
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
 *                   example: Possible expense deleted successfully
 */
router.delete("/:id", deletePossibleExpense);

/**
 * @swagger
 * /api/possible-expenses/category/{category}:
 *   get:
 *     summary: Get possible expenses by category
 *     tags: [Possible Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Category name
 *     responses:
 *       200:
 *         description: Possible expenses by category retrieved successfully
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
 *                     category:
 *                       type: string
 *                     totalExpectedAmount:
 *                       type: number
 *                     expenses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PossibleExpense'
 */
router.get("/category/:category", getPossibleExpensesByCategory);

/**
 * @swagger
 * /api/possible-expenses/{id}/convert:
 *   post:
 *     summary: Convert possible expense to transaction
 *     tags: [Possible Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Possible expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Actual amount spent (optional, uses expected amount if not provided)
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 description: Transaction description (optional, uses title if not provided)
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Transaction date (optional, uses current date if not provided)
 *     responses:
 *       200:
 *         description: Possible expense converted to transaction successfully
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
 *                   example: Possible expense converted to transaction
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *                     account:
 *                       $ref: '#/components/schemas/Account'
 */
router.post(
  "/:id/convert",
  validate(possibleExpenseSchemas.convert),
  convertToTransaction
);

export default router;
