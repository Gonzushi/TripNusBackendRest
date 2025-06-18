import express from "express";
import { calculateFare } from "../controllers/fareController";

const router = express.Router();

/**
 * @swagger
 * /fare/calculate:
 *   post:
 *     summary: Calculate fare for a ride and find nearby drivers
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
 *               - distanceM
 *               - durationSec
 *               - pickup
 *             properties:
 *               distanceM:
 *                 type: number
 *                 description: Distance in meters
 *                 example: 6500
 *               durationSec:
 *                 type: number
 *                 description: Duration in seconds
 *                 example: 900
 *               pickup:
 *                 type: object
 *                 description: Pickup location coordinates
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: -6.1754
 *                   longitude:
 *                     type: number
 *                     example: 106.8272
 *     responses:
 *       200:
 *         description: Fare and nearby drivers calculated successfully
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
 *                   example: Fare and nearby drivers calculated successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     car:
 *                       type: object
 *                       properties:
 *                         service_variant:
 *                           type: string
 *                         fare_breakdown:
 *                           type: object
 *                           properties:
 *                             base_fare:
 *                               type: number
 *                             distance_fare:
 *                               type: number
 *                             duration_fare:
 *                               type: number
 *                             rounding_adjustment:
 *                               type: number
 *                             platform_fee:
 *                               type: number
 *                         total_fare:
 *                           type: number
 *                         platform_fee:
 *                           type: number
 *                         app_commission:
 *                           type: number
 *                         driver_earning:
 *                           type: number
 *                     motorcycle:
 *                       type: object
 *                       properties:
 *                         service_variant:
 *                           type: string
 *                         fare_breakdown:
 *                           type: object
 *                           properties:
 *                             base_fare:
 *                               type: number
 *                             distance_fare:
 *                               type: number
 *                             duration_fare:
 *                               type: number
 *                             rounding_adjustment:
 *                               type: number
 *                             platform_fee:
 *                               type: number
 *                         total_fare:
 *                           type: number
 *                         platform_fee:
 *                           type: number
 *                         app_commission:
 *                           type: number
 *                         driver_earning:
 *                           type: number
 *                     nearby_drivers:
 *                       type: object
 *                       properties:
 *                         motorcycle:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               driver_id:
 *                                 type: string
 *                               latitude:
 *                                 type: number
 *                               longitude:
 *                                 type: number
 *                         car:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               driver_id:
 *                                 type: string
 *                               latitude:
 *                                 type: number
 *                               longitude:
 *                                 type: number
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
 *                   example: Distance, duration, and pickup location are required
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
