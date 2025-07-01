import express from "express";
import {
  getDriverBankAccount,
  insertDriverBankAccount,
} from "../controllers/driverBankAccountController";

const router = express.Router();

/**
 * @swagger
 * /driver-bank-accounts/bank-accounts:
 *   get:
 *     summary: Get driver's bank account details
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bank account retrieved successfully
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
 *                   example: Bank account retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "b10a6c02-4f2f-4f6a-9fcd-305fbc63b6e1"
 *                     driver_id:
 *                       type: string
 *                       format: uuid
 *                     account_number:
 *                       type: string
 *                       example: "1234567890"
 *                     account_holder_name:
 *                       type: string
 *                       example: "John Doe"
 *                     channel_code:
 *                       type: string
 *                       example: "MANDIRI"
 *                     disbursement_channels:
 *                       type: object
 *                       properties:
 *                         code:
 *                           type: string
 *                           example: "MANDIRI"
 *                         name:
 *                           type: string
 *                           example: "Bank Mandiri"
 *                         category:
 *                           type: string
 *                           example: "bank"
 *                         is_active:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Unauthorized – missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver or bank account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/bank-accounts", getDriverBankAccount);

/**
 * @swagger
 * /driver-bank-accounts/bank-accounts:
 *   post:
 *     summary: Add or update bank account for the authenticated driver
 *     tags: [Bank Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channel_code
 *               - account_number
 *               - account_holder_name
 *             properties:
 *               channel_code:
 *                 type: string
 *                 example: ID_BCA
 *               account_number:
 *                 type: string
 *                 example: "1672821872"
 *               account_holder_name:
 *                 type: string
 *                 example: "Hendry Widyanto"
 *     responses:
 *       200:
 *         description: Bank account added or updated successfully
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
 *                   example: Bank account saved successfully
 *       400:
 *         description: Missing fields
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
 *                   example: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/bank-accounts", insertDriverBankAccount);

export default router;
