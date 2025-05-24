import express from "express";
import {
  createGoPayPayment,
  refundGoPayPayment,
  handleMidtransWebhook,
} from "../controllers/paymentController";

const router = express.Router();

/**
 * @swagger
 * /payment/gopay:
 *   post:
 *     summary: Initiate a GoPay payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rideId
 *               - amount
 *             properties:
 *               rideId:
 *                 type: string
 *                 example: "12345"
 *                 description: Ride identifier
 *               amount:
 *                 type: number
 *                 example: 15000
 *                 description: Payment amount in smallest currency unit
 *     responses:
 *       200:
 *         description: GoPay payment initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "GoPay payment initiated"
 *                 transaction:
 *                   type: object
 *                   description: Midtrans transaction response object
 *       500:
 *         description: Payment initiation failed
 */
router.post("/gopay", createGoPayPayment);

/**
 * @swagger
 * /payment/refund:
 *   post:
 *     summary: Refund a GoPay payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "ride-12345-1651623600000"
 *                 description: Order ID to refund
 *               amount:
 *                 type: number
 *                 example: 15000
 *                 description: Refund amount
 *               reason:
 *                 type: string
 *                 example: "Customer requested refund"
 *                 description: Reason for refund
 *     responses:
 *       200:
 *         description: Refund successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Refund successful"
 *                 refundResponse:
 *                   type: object
 *                   description: Midtrans refund response object
 *       500:
 *         description: Refund failed
 */
router.post("/refund", refundGoPayPayment);

/**
 * @swagger
 * /payment/midtrans-webhook:
 *   post:
 *     summary: Handle Midtrans payment status webhook
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Midtrans webhook event payload (varies)
 *     responses:
 *       200:
 *         description: Webhook received
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "OK"
 */
router.post("/midtrans-webhook", handleMidtransWebhook);

export default router;
