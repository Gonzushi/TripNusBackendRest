import express from "express";
import {
  confirmRide,
  createRide,
  getRide,
  sendRideRequest,
  updateRide,
} from "../controllers/rideController";

const router = express.Router();

/**
 * @swagger
 * /ride:
 *   post:
 *     summary: Create a new ride
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - distance_m
 *               - duration_s
 *               - vehicle_type
 *               - service_variant
 *               - fare
 *               - platform_fee
 *               - driver_earning
 *               - app_commission
 *               - fare_breakdown
 *               - planned_pickup_coords
 *               - planned_pickup_address
 *               - planned_dropoff_coords
 *               - planned_dropoff_address
 *             properties:
 *               distance_m:
 *                 type: number
 *                 example: 5600
 *               duration_s:
 *                 type: number
 *                 example: 900
 *               vehicle_type:
 *                 type: string
 *                 example: motorbike
 *               service_variant:
 *                 type: string
 *                 example: standard
 *               fare:
 *                 type: number
 *                 example: 30000
 *               platform_fee:
 *                 type: number
 *                 example: 2000
 *               driver_earning:
 *                 type: number
 *                 example: 24000
 *               app_commission:
 *                 type: number
 *                 example: 6000
 *               fare_breakdown:
 *                 type: object
 *                 example: {
 *                   base_fare: 10000,
 *                   distance_fare: 15000,
 *                   duration_fare: 3000,
 *                   rounding_adjustment: 2000
 *                 }
 *               planned_pickup_coords:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [106.844747, -6.473081]
 *               planned_pickup_address:
 *                 type: string
 *                 example: "Puri Nirwana 1 Blok C No. 04, Bogor"
 *               planned_dropoff_coords:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [106.84513, -6.208763]
 *               planned_dropoff_address:
 *                 type: string
 *                 example: "Jl. Gatot Subroto, Jakarta"
 *     responses:
 *       201:
 *         description: Ride created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Ride created successfully.
 *                 code:
 *                   type: string
 *                   example: RIDE_CREATED
 *                 data:
 *                   type: object
 *                   example:
 *                     id: "uuid-of-ride"
 *                     rider_id: "uuid-of-rider"
 *                     fare: 30000
 *       400:
 *         description: Bad request due to missing or invalid fields
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
 *                   example: "Missing required fields: fare, distance_m"
 *                 code:
 *                   type: string
 *                   example: MISSING_FIELDS
 *       401:
 *         description: Unauthorized - missing user authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 401
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *                 message:
 *                   type: string
 *                   example: User ID not found in request context.
 *                 code:
 *                   type: string
 *                   example: USER_NOT_FOUND
 *       404:
 *         description: Rider not found
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
 *                   example: Rider not found.
 *                 code:
 *                   type: string
 *                   example: RIDER_NOT_FOUND
 *       500:
 *         description: Unexpected internal error
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
 *                   example: An unexpected error occurred while creating the ride.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.post("/", createRide);

/**
 * @swagger
 * /ride/update:
 *   patch:
 *     summary: Update an existing ride
 *     tags: [Ride]
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
 *             properties:
 *               rideId:
 *                 type: string
 *                 example: "uuid-of-ride"
 *               driver_id:
 *                 type: string
 *                 example: "uuid-of-driver"
 *               status:
 *                 type: string
 *                 example: "in_progress"
 *               ended_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-05-28T09:30:00Z"
 *               actual_pickup_coords:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [106.827153, -6.175392]
 *               actual_dropoff_coords:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [106.84513, -6.208763]
 *     responses:
 *       200:
 *         description: Ride updated successfully
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
 *                   example: Ride is updated successfully
 *                 code:
 *                   type: string
 *                   example: RIDE_UPDATED
 *                 data:
 *                   type: object
 *                   example:
 *                     id: "uuid-of-ride"
 *                     status: "in_progress"
 *                     driver_id: "uuid-of-driver"
 *       400:
 *         description: Bad request due to invalid or missing update fields
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
 *                   example: No valid fields provided for update.
 *                 code:
 *                   type: string
 *                   example: NO_FIELDS_TO_UPDATE
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 401
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *                 message:
 *                   type: string
 *                   example: User ID not found in request context.
 *                 code:
 *                   type: string
 *                   example: USER_NOT_FOUND
 *       404:
 *         description: Ride not found or already completed/cancelled
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
 *                   example: Ride not found or it has been completed/cancelled.
 *                 code:
 *                   type: string
 *                   example: RIDE_NOT_FOUND
 *       500:
 *         description: Unexpected internal error
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
 *                   example: An unexpected error occurred while updating the ride.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.patch("/update", updateRide);

/**
 * @swagger
 * /ride/request:
 *   post:
 *     summary: Send a new ride request and find nearby drivers
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickup
 *             properties:
 *               pickup:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [106.8451, -6.2146]
 *     responses:
 *       200:
 *         description: Nearby drivers returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 drivers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       distance:
 *                         type: string
 *                       coords:
 *                         type: array
 *                         items:
 *                           type: number
 *       500:
 *         description: Unexpected internal error
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
 *                   example: An unexpected error occurred while processing the ride request.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.post("/request", sendRideRequest);

/**
 * @swagger
 * /ride/active-ride:
 *   post:
 *     summary: Get rider's active ride
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - riderId
 *             properties:
 *               riderId:
 *                 type: string
 *                 description: The rider's unique ID
 *                 example: "rider_123"
 *     responses:
 *       200:
 *         description: Ride details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     rider_id:
 *                       type: string
 *                       example: "rider_123"
 *                     driver_id:
 *                       type: string
 *                       example: "driver_123"
 *                     status:
 *                       type: string
 *                       enum: [requesting_driver, driver_accepted, driver_arrived, in_progress, completed, cancelled]
 *                     distance_m:
 *                       type: number
 *                       example: 5000
 *                     duration_s:
 *                       type: number
 *                       example: 900
 *                     fare:
 *                       type: number
 *                       example: 25000
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Missing rider ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Rider ID is required"
 *       404:
 *         description: No active ride found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "No active ride found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post("/active-ride", getRide);

/**
 * @swagger
 * /ride/confirm:
 *   post:
 *     summary: Confirm a ride by driver
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ride_id
 *               - driver_id
 *             properties:
 *               ride_id:
 *                 type: string
 *                 description: The unique ID of the ride
 *                 example: "ride_abc123"
 *               driver_id:
 *                 type: string
 *                 description: The driver's unique ID
 *                 example: "driver_456"
 *     responses:
 *       200:
 *         description: Ride confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Ride confirmed successfully"
 *                 code:
 *                   type: string
 *                   example: "RIDE_CONFIRMED"
 *       400:
 *         description: Missing or invalid input fields or update failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *       409:
 *         description: Ride has already been accepted by another driver
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 409
 *                 error:
 *                   type: string
 *                   example: "Conflict"
 *                 message:
 *                   type: string
 *                   example: "Ride has already been taken."
 *                 code:
 *                   type: string
 *                   example: "RIDE_ALREADY_TAKEN"
 *       500:
 *         description: Unexpected server error
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
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 */
router.post("/confirm", confirmRide);

export default router;
