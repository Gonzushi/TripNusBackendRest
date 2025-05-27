import express from "express";
import { calculateFare } from "../controllers/fareController";

const router = express.Router();

/**
 * @swagger
 * /fare/calculate:
 *   post:
 *     summary: Calculate fare for a ride
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
 *               - plannedPickupCoords
 *               - plannedPickupAddress
 *               - plannedDropoffCoords
 *               - plannedDropoffAddress
 *             properties:
 *               plannedPickupCoords:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: "[longitude, latitude] of pickup location"
 *                 example: [106.844877, -6.473127]
 *               plannedPickupAddress:
 *                 type: string
 *                 description: Full address of the pickup location
 *                 example: "Jl. Raya Cibubur No.1, Jakarta"
 *               plannedDropoffCoords:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: "[longitude, latitude] of dropoff location"
 *                 example: [106.841782, -6.484847]
 *               plannedDropoffAddress:
 *                 type: string
 *                 description: Full address of the dropoff location
 *                 example: "Jl. Raya Bogor No.2, Jakarta"
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
 *                     planned_pickup_coords:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [106.844877, -6.473127]
 *                     planned_pickup_address:
 *                       type: string
 *                       example: "Jl. Raya Cibubur No.1, Jakarta"
 *                     planned_dropoff_coords:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [106.841782, -6.484847]
 *                     planned_dropoff_address:
 *                       type: string
 *                       example: "Jl. Raya Bogor No.2, Jakarta"
 *                     distance_m:
 *                       type: number
 *                       description: Distance in meters
 *                       example: 6500
 *                     duration_s:
 *                       type: number
 *                       description: Duration in seconds
 *                       example: 900
 *                     fare:
 *                       type: object
 *                       properties:
 *                         car:
 *                           type: object
 *                           properties:
 *                             service_variant:
 *                               type: string
 *                               example: standard
 *                             fare_breakdown:
 *                               type: object
 *                               properties:
 *                                 base_fare:
 *                                   type: number
 *                                   example: 5000
 *                                 distance_fare:
 *                                   type: number
 *                                   example: 19500
 *                                 duration_fare:
 *                                   type: number
 *                                   example: 7500
 *                                 rounding_adjustment:
 *                                   type: number
 *                                   example: 0
 *                             total_fare:
 *                               type: number
 *                               example: 32000
 *                             app_commission:
 *                               type: number
 *                               example: 5600
 *                             driver_earning:
 *                               type: number
 *                               example: 26400
 *                         motorcycle:
 *                           type: object
 *                           properties:
 *                             service_variant:
 *                               type: string
 *                               example: standard
 *                             fare_breakdown:
 *                               type: object
 *                               properties:
 *                                 base_fare:
 *                                   type: number
 *                                   example: 3000
 *                                 distance_fare:
 *                                   type: number
 *                                   example: 13000
 *                                 duration_fare:
 *                                   type: number
 *                                   example: 4500
 *                                 rounding_adjustment:
 *                                   type: number
 *                                   example: 0
 *                             total_fare:
 *                               type: number
 *                               example: 20500
 *                             app_commission:
 *                               type: number
 *                               example: 3588
 *                             driver_earning:
 *                               type: number
 *                               example: 16912
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
 *                   example: pickpoint and dropoff must be arrays of two valid numbers [lng, lat]
 *                 code:
 *                   type: string
 *                   example: INVALID_COORDINATES
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
