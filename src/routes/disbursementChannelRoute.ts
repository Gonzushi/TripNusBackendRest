import express from "express";
import { getActiveBankChannels } from "../controllers/disbursementChannelController";

const router = express.Router();

/**
 * @swagger
 * /disbursement-channels/channels:
 *   get:
 *     summary: Get list of active bank channels
 *     description: Retrieves a list of active bank disbursement channels (e.g., BCA, BNI), ordered by bank name.
 *     tags: [Disbursement Channels]
 *     responses:
 *       200:
 *         description: List of active bank channels retrieved successfully
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
 *                   example: Bank channels fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       channel_code:
 *                         type: string
 *                         example: ID_BCA
 *                       channel_name:
 *                         type: string
 *                         example: Bank Central Asia (BCA)
 *                       channel_type:
 *                         type: string
 *                         example: Bank
 *       500:
 *         description: Failed to fetch bank channels
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
 *                   example: Failed to retrieve bank channels
 *                 code:
 *                   type: string
 *                   example: FETCH_BANK_CHANNELS_FAILED
 */

router.get("/channels", getActiveBankChannels);

export default router;
