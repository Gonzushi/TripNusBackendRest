import express from "express";
import { calculateFare } from "../controllers/fareController";

const router = express.Router();

/**
 * @swagger
 * /fare/calculate:
 *   post:
 *     summary: Calculate fare for a ride based on distance and duration
 *     tags: [Fare]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - distanceKm
 *               - durationMin
 *             properties:
 *               distanceKm:
 *                 type: number
 *                 description: Distance in kilometers
 *                 example: 6.5
 *               durationMin:
 *                 type: number
 *                 description: Duration in minutes
 *                 example: 15
 *     responses:
 *       200:
 *         description: Fare calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 code:
 *                   type: string
 *                   example: FARE_CALCULATED
 *                 message:
 *                   type: string
 *                   example: Fare calculated successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     car:
 *                       type: object
 *                       properties:
 *                         service_variant:
 *                           type: string
 *                           example: standard
 *                         fare_breakdown:
 *                           type: object
 *                           properties:
 *                             base_fare:
 *                               type: number
 *                               example: 5000
 *                             distance_fare:
 *                               type: number
 *                               example: 19500
 *                             duration_fare:
 *                               type: number
 *                               example: 7500
 *                             rounding_adjustment:
 *                               type: number
 *                               example: 0
 *                             platform_fee:
 *                               type: number
 *                               example: 2000
 *                         total_fare:
 *                           type: number
 *                           example: 34000
 *                         platform_fee:
 *                           type: number
 *                           example: 2000
 *                         app_commission:
 *                           type: number
 *                           example: 5600
 *                         driver_earning:
 *                           type: number
 *                           example: 26400
 *                     motorcycle:
 *                       type: object
 *                       properties:
 *                         service_variant:
 *                           type: string
 *                           example: standard
 *                         fare_breakdown:
 *                           type: object
 *                           properties:
 *                             base_fare:
 *                               type: number
 *                               example: 3000
 *                             distance_fare:
 *                               type: number
 *                               example: 13000
 *                             duration_fare:
 *                               type: number
 *                               example: 4500
 *                             rounding_adjustment:
 *                               type: number
 *                               example: 0
 *                             platform_fee:
 *                               type: number
 *                               example: 2000
 *                         total_fare:
 *                           type: number
 *                           example: 22500
 *                         platform_fee:
 *                           type: number
 *                           example: 2000
 *                         app_commission:
 *                           type: number
 *                           example: 3588
 *                         driver_earning:
 *                           type: number
 *                           example: 16912
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 400
 *                 error:
 *                   type: string
 *                   example: Bad Request
 *                 message:
 *                   type: string
 *                   example: Distance and duration are required and must be valid numbers
 *                 code:
 *                   type: string
 *                   example: INVALID_PARAMETERS
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 error:
 *                   type: string
 *                   example: Internal Server Error
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred while calculating fare.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 *                 details:
 *                   type: string
 *                   example: Some error details
 */
router.post("/calculate", calculateFare);

export default router;
