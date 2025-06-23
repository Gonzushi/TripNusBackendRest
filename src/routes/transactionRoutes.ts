import express from "express";
import { getTransactionByRide } from "../controllers/transactionController";

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

export default router;
