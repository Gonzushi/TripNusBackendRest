import express from "express";
import {
  handleDisbursementWebhook,
  handleQrPaymentWebhook,
  simulateQrPayment,
} from "../controllers/xenditController";

const router = express.Router();

/**
 * @openapi
 * /xendit/webhook/qr-payment:
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
router.post("/webhook/qr-payment", handleQrPaymentWebhook);

/**
 * @openapi
 * /xendit/webhook/disbursement:
 *   post:
 *     summary: Xendit Disbursement Webhook
 *     description: Receives disbursement status updates from Xendit (e.g. COMPLETED or FAILED).
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
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: Xendit's unique disbursement ID.
 *                 example: 62f38d3e057d5d001e59a4e1
 *               external_id:
 *                 type: string
 *                 description: External ID passed when creating the disbursement (usually the transaction ID).
 *                 example: withdrawal_driver_1234_xyz
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, FAILED]
 *                 description: Current status of the disbursement.
 *                 example: COMPLETED
 *     responses:
 *       200:
 *         description: Webhook processed successfully or ignored (non-terminal status).
 *       400:
 *         description: Bad request due to missing required fields or invalid status.
 *       401:
 *         description: Unauthorized – invalid callback token.
 *       404:
 *         description: Transaction not found for given external_id.
 *       500:
 *         description: Internal server error during processing.
 */
router.post("/webhook/disbursement", handleDisbursementWebhook);

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
