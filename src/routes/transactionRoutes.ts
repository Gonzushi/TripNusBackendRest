import express from "express";
import {
  cancelTopup,
  createTopupTransaction,
  getDriverTransactions,
  getTransactionByRide,
  requestDriverWithdrawal,
} from "../controllers/transactionController";

const router = express.Router();

/**
 * @swagger
 * /transactions/by-ride/{rideId}:
 *   get:
 *     summary: Get transaction by ride ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the ride
 *     responses:
 *       200:
 *         description: Transaction fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Transaction found
 *                 code:
 *                   type: string
 *                   example: TRANSACTION_FOUND
 *                 data:
 *                   type: object
 *                   example:
 *                     id: "transaction-uuid"
 *                     ride_id: "ride-uuid"
 *                     amount: 13000
 *                     payment_method: "qris"
 *                     qr_string: "00020101021226600014ID.CO.XENDIT.WWW01189360091100223090240103000001780217testing aja 2309024010300000152040000530371005404130005802ID5913Testing Shop6013Jakarta Pusat61051234062120612160416000530600802"
 *                     qr_reference_id: "test-qr-ref-123"
 *                     qr_expires_at: "2025-06-23T16:32:00.000Z"
 *                     external_id: "transaction_abc123"
 *                     status: "pending"
 *                     type: "payment"
 *                     account_type: "rider"
 *       404:
 *         description: No transaction found for this ride
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: Not Found
 *                 message:
 *                   type: string
 *                   example: No transaction found for this ride
 *                 code:
 *                   type: string
 *                   example: TRANSACTION_NOT_FOUND
 *       500:
 *         description: Unexpected internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred while retrieving the transaction.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.get("/by-ride/:rideId", getTransactionByRide);

/**
 * @swagger
 * /transactions/topup:
 *   post:
 *     summary: Create a top-up transaction via QRIS
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1000
 *                 example: 50000
 *     responses:
 *       201:
 *         description: Top-up QR created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Top-up QR created successfully
 *                 code:
 *                   type: string
 *                   example: TOPUP_CREATED
 *                 data:
 *                   type: object
 *                   properties:
 *                     qr_id:
 *                       type: string
 *                       example: qr-id-123
 *                     qr_string:
 *                       type: string
 *                       example: "00020101021226600014ID.CO.XENDIT..."
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-06-30T17:00:00.000Z"
 *                     amount:
 *                       type: integer
 *                       example: 50000
 *       400:
 *         description: Missing or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 error:
 *                   type: string
 *                   example: Bad Request
 *                 message:
 *                   type: string
 *                   example: Missing or invalid authId or amount.
 *                 code:
 *                   type: string
 *                   example: INVALID_INPUT
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: Not Found
 *                 message:
 *                   type: string
 *                   example: Driver not found for provided auth ID.
 *                 code:
 *                   type: string
 *                   example: DRIVER_NOT_FOUND
 *       500:
 *         description: Server error during top-up creation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: Failed to create top-up transaction.
 *                 code:
 *                   type: string
 *                   example: TOPUP_FAILED
 */
router.post("/topup", createTopupTransaction);

/**
 * @swagger
 * /transactions/withdrawal:
 *   post:
 *     summary: Request withdrawal for driver
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 example: 50000
 *     responses:
 *       200:
 *         description: Withdrawal successfully submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Withdrawal request submitted
 *                 code:
 *                   type: string
 *                   example: WITHDRAWAL_INITIATED
 *       400:
 *         description: Invalid request or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 400
 *                 error:
 *                   type: string
 *                   example: Bad Request
 *                 message:
 *                   type: string
 *                   example: "Missing or invalid fields: amount, or unauthorized."
 *                 code:
 *                   type: string
 *                   example: MISSING_FIELDS
 *       409:
 *         description: Balance mismatch or pending transaction exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 409
 *                 error:
 *                   type: string
 *                   example: Balance Mismatch
 *                 message:
 *                   type: string
 *                   example: Your balance appears inconsistent. Please contact admin for manual review.
 *                 code:
 *                   type: string
 *                   example: BALANCE_MISMATCH
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: Unexpected error while processing withdrawal.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.post("/withdrawal", requestDriverWithdrawal);

/**
 * @swagger
 * /transactions/driver:
 *   get:
 *     summary: Get active driver transactions (topup or withdrawal)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [topup, withdrawal]
 *         required: false
 *         description: "Filter by transaction type (only one of: topup or withdrawal)"
 *     responses:
 *       200:
 *         description: List of filtered transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Transactions fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 401
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *                 message:
 *                   type: string
 *                   example: Missing authentication token
 *                 code:
 *                   type: string
 *                   example: UNAUTHORIZED
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: Driver Not Found
 *                 message:
 *                   type: string
 *                   example: No driver found for this user
 *                 code:
 *                   type: string
 *                   example: DRIVER_NOT_FOUND
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: Unexpected error while fetching driver transactions.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.get("/driver", getDriverTransactions);

/**
 * @swagger
 * /transactions/topup/cancel:
 *   patch:
 *     summary: Cancel an awaiting top-up transaction for the driver
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Cancels the most recent 'topup' transaction with status `awaiting_payment`
 *       for the authenticated driver. No input is required.
 *     responses:
 *       200:
 *         description: Top-up cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Top-up cancelled successfully
 *                 code:
 *                   type: string
 *                   example: TOPUP_CANCELLED
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 34a37aef-c1fb-4e32-a267-521bb75f1d18
 *                     amount:
 *                       type: number
 *                       example: 50000
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No top-up transaction found to cancel
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/topup/cancel", cancelTopup);

export default router;
