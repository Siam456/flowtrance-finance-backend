import express from "express";
import { auth } from "../middleware/auth.js";
import { validate, accountSchemas } from "../middleware/validation.js";
import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount,
  transferFunds,
} from "../controllers/accountController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - balance
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Main Bank Account"
 *               type:
 *                 type: string
 *                 enum: [bank, cash, credit, mobile]
 *                 example: bank
 *               balance:
 *                 type: number
 *                 minimum: 0
 *                 example: 5000.00
 *               currency:
 *                 type: string
 *                 default: USD
 *                 example: USD
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Account'
 *                 message:
 *                   type: string
 *                   example: Account created successfully
 */
router.post("/", validate(accountSchemas.create), createAccount);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get user accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Accounts retrieved successfully
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
 *                     $ref: '#/components/schemas/Account'
 */
router.get("/", getAccounts);

/**
 * @swagger
 * /api/accounts/{id}:
 *   put:
 *     summary: Update an account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               type:
 *                 type: string
 *                 enum: [bank, cash, credit, mobile]
 *               balance:
 *                 type: number
 *                 minimum: 0
 *               currency:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Account'
 */
router.put("/:id", validate(accountSchemas.update), updateAccount);

/**
 * @swagger
 * /api/accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: Account deleted successfully
 */
router.delete("/:id", deleteAccount);

/**
 * @swagger
 * /api/accounts/transfer:
 *   post:
 *     summary: Transfer funds between accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccountId
 *               - toAccountId
 *               - amount
 *             properties:
 *               fromAccountId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               toAccountId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 100.00
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Monthly transfer"
 *     responses:
 *       200:
 *         description: Funds transferred successfully
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
 *                   example: Funds transferred successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     fromAccount:
 *                       $ref: '#/components/schemas/Account'
 *                     toAccount:
 *                       $ref: '#/components/schemas/Account'
 *                     amount:
 *                       type: number
 *                     transferDate:
 *                       type: string
 *                       format: date-time
 */
router.post("/transfer", validate(accountSchemas.transfer), transferFunds);

export default router;
