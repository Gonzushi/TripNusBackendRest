import express from "express";
import {
  handleXenditWebhook,
  simulateQrPayment,
} from "../controllers/xenditController";

const router = express.Router();

/**
 * @openapi
 * /xendit/webhook:
 *   post:
 *     summary: Xendit QRIS Webhook
 *     description: Receives payment status updates from Xendit QRIS (e.g. COMPLETED or EXPIRED).
 *     tags:
 *       - Xendit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - external_id
 *               - status
 *             properties:
 *               external_id:
 *                 type: string
 *                 description: External ID used when creating the QR.
 *                 example: ride_1234_abc
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, COMPLETED, EXPIRED]
 *                 description: Status of the QR transaction.
 *                 example: COMPLETED
 *               reference_id:
 *                 type: string
 *                 description: Xendit's internal reference ID.
 *                 example: qris-123456789
 *     responses:
 *       200:
 *         description: Webhook processed successfully.
 *       500:
 *         description: Internal server error during processing.
 */
router.post("/webhook", handleXenditWebhook);

/**
 * @swagger
 * /xendit/qr-codes/{qr_id}/simulate:
 *   post:
 *     summary: Simulate a QRIS payment (Test mode only)
 *     tags: [Xendit]
 *     parameters:
 *       - name: qr_id
 *         in: path
 *         required: false
 *         description: Xendit QR code ID. If not provided, will use the first awaiting QRIS transaction.
 *         schema:
 *           type: string
 *           example: qr_61cb3576-3a25-4d35-8d15-0e8e3bdba4f2
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Payment simulation succeeded
 *       400:
 *         description: Missing or invalid input
 *       500:
 *         description: Unexpected internal error
 */
router.post("/qr-codes/:qr_id/simulate", simulateQrPayment);

/**
 * @swagger
 * /xendit/qr-codes/{qr_id}/simulate:
 *   post:
 *     summary: Simulate a QRIS payment (Test mode only, with QR ID)
 *     tags: [Xendit]
 *     parameters:
 *       - name: qr_id
 *         in: path
 *         required: true
 *         description: Xendit QR code ID to simulate payment for.
 *         schema:
 *           type: string
 *           example: qr_61cb3576-3a25-4d35-8d15-0e8e3bdba4f2
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Payment simulation succeeded
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: QR code or transaction not found
 *       500:
 *         description: Unexpected internal error
 */

/**
 * @swagger
 * /xendit/qr-codes/simulate:
 *   post:
 *     summary: Simulate a QRIS payment (Test mode only, without QR ID)
 *     tags: [Xendit]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Payment simulation succeeded
 *       400:
 *         description: Missing or invalid input
 *       404:
 *         description: Awaiting QRIS transaction not found
 *       500:
 *         description: Unexpected internal error
 */
router.post("/qr-codes/simulate", simulateQrPayment);

export default router;
