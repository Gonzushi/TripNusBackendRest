import express from "express";
import {
  cancelByDriver,
  cancelRideByRiderBeforePickup,
  confirmRide,
  createRide,
  getRideRider,
  getRideDriver,
  rejectRide,
  updateRide,
  driverArrivedAtPickup,
  confirmPickupByDriver,
  confirmDropoffByDriver,
  confirmPaymentByDriver,
  getRideHistory,
  getRideHistoryDriver,
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
 *               - planned_payment_method
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
 *               planned_payment_method:
 *                 type: string
 *                 example: "qris"
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
 * /ride/active-ride-by-rider:
 *   get:
 *     summary: Get the authenticated rider's active ride
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ride details retrieved successfully
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
 *                   example: RIDE_DATA_FETCHED
 *                 message:
 *                   type: string
 *                   example: Ride data fetched successfully
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
 *       401:
 *         description: Unauthorized - Auth ID missing from JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 401
 *                 code:
 *                   type: string
 *                   example: AUTH_ID_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: Auth ID is required
 *                 error:
 *                   type: string
 *                   example: Auth ID is missing from the request context
 *       404:
 *         description: No active ride found or multiple active rides found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 code:
 *                   type: string
 *                   example: NO_ACTIVE_RIDE_FOUND
 *                 message:
 *                   type: string
 *                   example: No active ride found
 *                 error:
 *                   type: string
 *                   example: No active ride found for this rider
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
 *                 code:
 *                   type: string
 *                   example: INTERNAL_SERVER_ERROR
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred while fetching the ride data.
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get("/active-ride-by-rider", getRideRider);

/**
 * @swagger
 * /ride/confirm:
 *   post:
 *     summary: Confirm a ride by driver
 *     description: Confirms a ride assignment by the assigned driver. Updates ride and driver statuses, notifies the rider, and stops retry attempts.
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
 *         description: Ride confirmed successfully. The rider is notified that the driver is on the way.
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
 *         description: Missing required fields or ride update failure
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
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and driver_id."
 *                 code:
 *                   type: string
 *                   example: "MISSING_FIELDS"
 *       403:
 *         description: The ride is not assigned to the given driver
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "This ride is not assigned to the given driver."
 *                 code:
 *                   type: string
 *                   example: "UNAUTHORIZED_DRIVER"
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 *                 message:
 *                   type: string
 *                   example: "Ride not found."
 *                 code:
 *                   type: string
 *                   example: "RIDE_NOT_FOUND"
 *       409:
 *         description: Ride is no longer in 'requesting_driver' status
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
 *                   example: "Ride is no longer in 'requesting_driver' state."
 *                 code:
 *                   type: string
 *                   example: "INVALID_STATUS"
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
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred while confirming the ride."
 *                 code:
 *                   type: string
 *                   example: "INTERNAL_ERROR"
 */
router.post("/confirm", confirmRide);

/**
 * @swagger
 * /ride/reject:
 *   post:
 *     summary: Reject a ride request by the assigned driver
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
 *         description: Ride rejected and re-queued for matching
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
 *                   example: "Ride rejected and re-queued for matching."
 *                 code:
 *                   type: string
 *                   example: "RIDE_REJECTED"
 *       400:
 *         description: Missing or invalid input fields or update failure
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
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and driver_id."
 *                 code:
 *                   type: string
 *                   example: "MISSING_FIELDS"
 *       403:
 *         description: The driver is not authorized to reject this ride
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "This driver is not assigned to the ride."
 *                 code:
 *                   type: string
 *                   example: "UNAUTHORIZED_DRIVER"
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and driver_id."
 *                 code:
 *                   type: string
 *                   example: "MISSING_FIELDS"
 *       500:
 *         description: Unexpected server error or match data missing
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
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and driver_id."
 *                 code:
 *                   type: string
 *                   example: "MISSING_FIELDS"
 */
router.post("/reject", rejectRide);

/**
 * @swagger
 * /ride/cancel-by-rider-before-pickup:
 *   post:
 *     summary: Cancel a ride by the rider before pickup
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
 *               - rider_id
 *             properties:
 *               ride_id:
 *                 type: string
 *                 description: The unique ID of the ride
 *                 example: "ride_abc123"
 *               rider_id:
 *                 type: string
 *                 description: The unique ID of the rider
 *                 example: "rider_456"
 *     responses:
 *       200:
 *         description: Ride cancelled successfully
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
 *                   example: "Ride cancelled successfully."
 *                 code:
 *                   type: string
 *                   example: "RIDE_CANCELLED"
 *       400:
 *         description: Missing or invalid input fields or update failure
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
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and rider_id."
 *                 code:
 *                   type: string
 *                   example: "MISSING_FIELDS"
 *       403:
 *         description: The rider is not authorized to cancel this ride
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "This ride does not belong to the given rider."
 *                 code:
 *                   type: string
 *                   example: "UNAUTHORIZED_RIDER"
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and rider_id."
 *                 code:
 *                   type: string
 *                   example: "MISSING_FIELDS"
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
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and rider_id."
 *                 code:
 *                   type: string
 *                   example: "MISSING_FIELDS"
 */
router.post("/cancel-by-rider-before-pickup", cancelRideByRiderBeforePickup);

/**
 * @swagger
 * /ride/cancel-by-driver:
 *   post:
 *     summary: Cancel a ride by the assigned driver
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
 *         description: Ride cancelled and reassigned
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
 *                   example: Ride cancelled by driver and reassigned
 *                 code:
 *                   type: string
 *                   example: RIDE_DRIVER_CANCELLED
 *       400:
 *         description: Missing required fields
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
 *                   example: "Missing required fields: ride_id and driver_id."
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and driver_id."
 *                 code:
 *                   type: string
 *                   example: "MISSING_FIELDS"
 *       403:
 *         description: The ride is not assigned to the given driver
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "This ride is not assigned to the given driver."
 *                 code:
 *                   type: string
 *                   example: "UNAUTHORIZED_DRIVER"
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and driver_id."
 *                 code:
 *                   type: string
 *                   example: "MISSING_FIELDS"
 *       409:
 *         description: Ride is not in the correct status
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
 *                   example: "Ride is not in 'driver_accepted' status."
 *                 code:
 *                   type: string
 *                   example: "INVALID_STATUS"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal Server Error"
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred while cancelling the ride."
 *                 code:
 *                   type: string
 *                   example: "INTERNAL_ERROR"
 */
router.post("/cancel-by-driver", cancelByDriver);

/**
 * @swagger
 * /ride/active-ride-by-driver:
 *   get:
 *     summary: Get the active ride with status "driver_accepted" for the authenticated driver
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active ride data fetched successfully
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
 *                   example: RIDE_DATA_FETCHED
 *                 message:
 *                   type: string
 *                   example: Ride data fetched successfully
 *                 data:
 *                   type: object
 *                   description: The active ride object
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 401
 *                 code:
 *                   type: string
 *                   example: AUTH_ID_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: Auth ID is required
 *                 error:
 *                   type: string
 *                   example: Auth ID is missing from the request context
 *       404:
 *         description: No active ride found or multiple active rides found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 code:
 *                   type: string
 *                   example: NO_ACTIVE_RIDE_FOUND
 *                 message:
 *                   type: string
 *                   example: No active ride found for the authenticated driver
 *                 error:
 *                   type: string
 *                   example: No active ride found
 *       409:
 *         description: Multiple active rides found (unexpected)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 409
 *                 code:
 *                   type: string
 *                   example: MULTIPLE_ACTIVE_RIDES
 *                 message:
 *                   type: string
 *                   example: There are multiple active rides for this driver
 *                 error:
 *                   type: string
 *                   example: There are multiple active rides
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 code:
 *                   type: string
 *                   example: INTERNAL_SERVER_ERROR
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred while fetching the ride data.
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get("/active-ride-by-driver", getRideDriver);

/**
 * @swagger
 * /ride/driver-arrived:
 *   post:
 *     summary: Confirm that the driver has arrived at the pickup location
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
 *                 example: "e1f3a6d0-9f58-4c12-bae6-8cd3a9e8c8aa"
 *               driver_id:
 *                 type: string
 *                 example: "9bfa54c2-7f4e-4f8b-9f83-5e301ad8fa2e"
 *     responses:
 *       200:
 *         description: Driver marked as arrived successfully
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
 *                   example: DRIVER_ARRIVED
 *                 message:
 *                   type: string
 *                   example: Driver marked as arrived successfully.
 *       400:
 *         description: Missing required fields or bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 400
 *                 code:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and driver_id."
 *                 error:
 *                   type: string
 *                   example: "Bad Request"
 *       403:
 *         description: Unauthorized driver attempting to confirm arrival
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 code:
 *                   type: string
 *                   example: UNAUTHORIZED_DRIVER
 *                 message:
 *                   type: string
 *                   example: "This driver is not assigned to the ride."
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 code:
 *                   type: string
 *                   example: RIDE_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: "Ride not found."
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 *       409:
 *         description: Ride is not in a valid state to confirm arrival
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 409
 *                 code:
 *                   type: string
 *                   example: INVALID_RIDE_STATUS
 *                 message:
 *                   type: string
 *                   example: "Ride must be in 'driver_accepted' state to mark as arrived."
 *                 error:
 *                   type: string
 *                   example: "Conflict"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred while confirming arrival."
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.post("/driver-arrived", driverArrivedAtPickup);

/**
 * @swagger
 * /ride/confirm-pickup:
 *   post:
 *     summary: Driver confirms passenger pickup and starts the ride
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
 *               - actual_pickup_coords
 *             properties:
 *               ride_id:
 *                 type: string
 *                 format: uuid
 *                 example: "b529c3d2-8fc2-4d9f-95d1-4faaf4569e5b"
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *                 example: "c176b7a3-1a6a-44d0-9b9d-e4aeb1f9d3e3"
 *               actual_pickup_coords:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: -6.200000
 *                   longitude:
 *                     type: number
 *                     example: 106.816666
 *     responses:
 *       200:
 *         description: Pickup confirmed successfully, ride is now in progress
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
 *                   example: RIDE_IN_PROGRESS
 *                 message:
 *                   type: string
 *                   example: Pickup confirmed, ride is now in progress.
 *       400:
 *         description: Bad request or missing/invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 400
 *                 code:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id, driver_id, actual_pickup_coords."
 *                 error:
 *                   type: string
 *                   example: "Bad Request"
 *       403:
 *         description: Driver is not authorized to update this ride
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 code:
 *                   type: string
 *                   example: UNAUTHORIZED_DRIVER
 *                 message:
 *                   type: string
 *                   example: "This driver is not assigned to the ride."
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 code:
 *                   type: string
 *                   example: RIDE_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: "Ride not found."
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 *       409:
 *         description: Ride is not in the correct state to be updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 409
 *                 code:
 *                   type: string
 *                   example: INVALID_RIDE_STATUS
 *                 message:
 *                   type: string
 *                   example: "Ride must be in 'driver_arrived' state to confirm pickup."
 *                 error:
 *                   type: string
 *                   example: "Conflict"
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
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred while confirming the pickup."
 */
router.post("/confirm-pickup", confirmPickupByDriver);

/**
 * @swagger
 * /ride/confirm-dropoff:
 *   post:
 *     summary: Confirm that the driver has dropped off the rider
 *     description: Used by the driver to confirm the rider has been dropped off at the destination.
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
 *               - actual_dropoff_coords
 *             properties:
 *               ride_id:
 *                 type: string
 *                 format: uuid
 *                 example: "7c32b2f2-d45b-4af3-bfd6-1a22115e2cb7"
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *                 example: "d83b9c77-3b2f-489b-85fa-d9d2f4c2e188"
 *               actual_dropoff_coords:
 *                 type: object
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
 *         description: Dropoff confirmed successfully
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
 *                   example: RIDE_PAYMENT_PENDING
 *                 message:
 *                   type: string
 *                   example: Dropoff confirmed, waiting for rider payment.
 *       400:
 *         description: Missing or invalid input fields, or update failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 400
 *                 code:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id, driver_id, actual_dropoff_coords."
 *                 error:
 *                   type: string
 *                   example: "Bad Request"
 *       403:
 *         description: Driver is not assigned to the ride
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 code:
 *                   type: string
 *                   example: UNAUTHORIZED_DRIVER
 *                 message:
 *                   type: string
 *                   example: "This driver is not assigned to the ride."
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 code:
 *                   type: string
 *                   example: RIDE_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: "Ride not found."
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 *       409:
 *         description: Ride is not in a valid state to confirm dropoff
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 409
 *                 code:
 *                   type: string
 *                   example: INVALID_RIDE_STATUS
 *                 message:
 *                   type: string
 *                   example: "Ride must be in 'in_progress' state to confirm dropoff."
 *                 error:
 *                   type: string
 *                   example: "Conflict"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred while confirming dropoff."
 */
router.post("/confirm-dropoff", confirmDropoffByDriver);

/**
 * @swagger
 * /ride/confirm-payment-by-driver:
 *   post:
 *     summary: Confirm payment and complete the ride
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
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *                 example: "430e8400-e29b-41d4-a716-446655440111"
 *     responses:
 *       200:
 *         description: Payment confirmed, ride completed
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
 *                   example: RIDE_COMPLETED
 *                 message:
 *                   type: string
 *                   example: Payment confirmed. Ride is now completed.
 *       400:
 *         description: Missing fields or update failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 400
 *                 code:
 *                   type: string
 *                   example: "Bad Request"
 *                 message:
 *                   type: string
 *                   example: "Missing required fields: ride_id and driver_id."
 *       403:
 *         description: Driver is not assigned to the ride
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 code:
 *                   type: string
 *                   example: UNAUTHORIZED_DRIVER
 *                 message:
 *                   type: string
 *                   example: "This driver is not assigned to the ride."
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 code:
 *                   type: string
 *                   example: RIDE_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: "Ride not found."
 *       409:
 *         description: Invalid ride status for payment confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 409
 *                 code:
 *                   type: string
 *                   example: INVALID_RIDE_STATUS
 *                 message:
 *                   type: string
 *                   example: "Ride must be in 'payment_in_progress' state to confirm payment."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred while confirming payment."
 */
router.post("/confirm-payment-by-driver", confirmPaymentByDriver);

/**
 * @swagger
 * /ride/history/rider:
 *   get:
 *     summary: Get past ride history of the rider for the past 1 year
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number for pagination
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Number of records per page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         description: Filter by ride status (`all`, `completed`, `cancelled`)
 *         required: false
 *         schema:
 *           type: string
 *           enum: [all, completed, cancelled]
 *           default: all
 *     responses:
 *       200:
 *         description: Ride history fetched successfully
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
 *                   example: RIDE_HISTORY_FETCHED
 *                 message:
 *                   type: string
 *                   example: Ride history fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     rides:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           user_reference_id:
 *                             type: string
 *                             format: string 
 *                           service_variant:
 *                             type: string
 *                           distance_m:
 *                             type: integer
 *                           duration_s:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           status_reason:
 *                             type: string
 *                             nullable: true
 *                           planned_pickup_address:
 *                             type: string
 *                           planned_dropoff_address:
 *                             type: string
 *                           fare:
 *                             type: integer
 *                           vehicle_type:
 *                             type: string
 *                           started_at:
 *                             type: string
 *                             format: date-time
 *                           ended_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           review:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               rating:
 *                                 type: integer
 *                               comment:
 *                                 type: string
 *                                 nullable: true
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         hasMore:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Auth ID is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 400
 *                 code:
 *                   type: string
 *                   example: AUTH_ID_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: Auth ID is required
 *       404:
 *         description: Rider not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 code:
 *                   type: string
 *                   example: RIDER_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: Rider not found
 *       500:
 *         description: Unexpected error occurred
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 code:
 *                   type: string
 *                   example: INTERNAL_SERVER_ERROR
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred while fetching the ride history.
 */
router.get("/history/rider", getRideHistory);

/**
 * @swagger
 * /ride/history/driver:
 *   get:
 *     summary: Get past ride history of the rider for the past 1 year
 *     tags: [Ride]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         description: Page number for pagination
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Number of records per page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         description: Filter by ride status (`all`, `completed`, `cancelled`)
 *         required: false
 *         schema:
 *           type: string
 *           enum: [all, completed, cancelled]
 *           default: all
 *     responses:
 *       200:
 *         description: Ride history fetched successfully
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
 *                   example: RIDE_HISTORY_FETCHED
 *                 message:
 *                   type: string
 *                   example: Ride history fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     rides:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           user_reference_id:
 *                             type: string
 *                             format: string 
 *                           service_variant:
 *                             type: string
 *                           distance_m:
 *                             type: integer
 *                           duration_s:
 *                             type: integer
 *                           status:
 *                             type: string
 *                           status_reason:
 *                             type: string
 *                             nullable: true
 *                           planned_pickup_address:
 *                             type: string
 *                           planned_dropoff_address:
 *                             type: string
 *                           fare:
 *                             type: integer
 *                           vehicle_type:
 *                             type: string
 *                           started_at:
 *                             type: string
 *                             format: date-time
 *                           ended_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           review:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               rating:
 *                                 type: integer
 *                               comment:
 *                                 type: string
 *                                 nullable: true
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         hasMore:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Auth ID is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 400
 *                 code:
 *                   type: string
 *                   example: AUTH_ID_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: Auth ID is required
 *       404:
 *         description: Rider not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 code:
 *                   type: string
 *                   example: RIDER_NOT_FOUND
 *                 message:
 *                   type: string
 *                   example: Rider not found
 *       500:
 *         description: Unexpected error occurred
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 code:
 *                   type: string
 *                   example: INTERNAL_SERVER_ERROR
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred while fetching the ride history.
 */
router.get("/history/driver", getRideHistoryDriver);

export default router;
