import express from "express";
import { getDriverBankAccount } from "../controllers/driverBankAccountController";

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

export default router;
