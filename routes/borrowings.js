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

/**
 * @swagger
 * /api/borrowings:
 *   post:
 *     summary: Create a new borrowing/lending record
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [personName, type, amount, accountId]
 *             properties:
 *               personName:
 *                 type: string
 *                 example: "Alice"
 *               type:
 *                 type: string
 *                 enum: [borrowed, lent]
 *                 example: borrowed
 *               amount:
 *                 type: number
 *                 example: 250
 *               accountId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               description:
 *                 type: string
 *                 example: "Short-term loan"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-31"
 *     responses:
 *       201:
 *         description: Borrowing record created
 */
// Create a new borrowing record
router.post("/", validateRequest(borrowingSchemas.create), createBorrowing);

/**
 * @swagger
 * /api/borrowings:
 *   get:
 *     summary: Get borrowing/lending records
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [borrowed, lent]
 *       - in: query
 *         name: isPaid
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: personName
 *         schema:
 *           type: string
 *         description: Filter by person name (partial match)
 *     responses:
 *       200:
 *         description: List of borrowing records
 */
// Get all borrowing records with optional filters
router.get("/", getBorrowings);

/**
 * @swagger
 * /api/borrowings/summary:
 *   get:
 *     summary: Get overall borrowing summary
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary data
 */
// Get borrowing summary
router.get("/summary", getBorrowingSummary);

/**
 * @swagger
 * /api/borrowings/person/{personName}:
 *   get:
 *     summary: Get summary for a specific person
 *     tags: [Borrowings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Person summary
 */
// Get person summary
router.get("/person/:personName", getPersonSummary);

/**
 * @swagger
 * /api/borrowings/{id}:
 *   put:
 *     summary: Update a borrowing record
 *     tags: [Borrowings]
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
 *         description: Updated record
 */
// Update borrowing record
router.put("/:id", validateRequest(borrowingSchemas.update), updateBorrowing);

/**
 * @swagger
 * /api/borrowings/{id}/paid:
 *   patch:
 *     summary: Mark borrowing as paid/unpaid
 *     tags: [Borrowings]
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
 *             type: object
 *             properties:
 *               isPaid:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Updated paid status
 */
// Toggle paid status
router.patch("/:id/paid", togglePaidStatus);

/**
 * @swagger
 * /api/borrowings/{id}:
 *   delete:
 *     summary: Delete a borrowing record
 *     tags: [Borrowings]
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
 *         description: Deleted successfully
 */
// Delete borrowing record
router.delete("/:id", deleteBorrowing);

export default router;
