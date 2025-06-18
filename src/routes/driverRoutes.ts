import express from "express";
import multer from "multer";
import {
  createProfile,
  getDriverProfile,
  getNearbyDriversHandler,
  updateProfile,
  uploadPicture,
} from "../controllers/driverController";

const upload = multer();
const router = express.Router();

/**
 * @swagger
 * /driver/profile:
 *   post:
 *     summary: Create a driver profile
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: No body parameters required; user is identified from auth token.
 *       required: false
 *     responses:
 *       200:
 *         description: Driver profile was created successfully
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
 *                   example: Driver profile was created successfully
 *                 code:
 *                   type: string
 *                   example: PROFILE_CREATED
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     user_id:
 *                       type: string
 *                       example: 456e7890-a12b-34c5-d678-123456789abc
 *                     profile_picture_url:
 *                       type: string
 *                       example: profile-pictures/abc/uuid.jpg
 *       400:
 *         description: Bad request, user lookup failure, or driver already exists
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
 *                   example: Driver Exists
 *                 message:
 *                   type: string
 *                   example: Driver for this user already exists.
 *                 code:
 *                   type: string
 *                   example: RIDER_EXISTS
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
 *                   example: An unexpected error occurred while creating the driver profile.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.post("/profile", createProfile);

/**
 * @swagger
 * /driver/picture:
 *   patch:
 *     summary: Upload driver photo (profile picture, KTP, driver license, or STNK)
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - photoType
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *               photoType:
 *                 type: string
 *                 enum: [profile, ktp, license, stnk]
 *                 description: Type of photo being uploaded
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
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
 *                   example: ktp photo uploaded successfully
 *                 code:
 *                   type: string
 *                   example: UPLOAD_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     user_id:
 *                       type: string
 *                       example: 456e7890-a12b-34c5-d678-123456789abc
 *                     profile_picture_url:
 *                       type: string
 *                       example: profile-pictures/123e4567-e89b-12d3-a456-426614174000.jpg
 *                     ktp_photo_url:
 *                       type: string
 *                       example: ktp-pictures/123e4567-e89b-12d3-a456-426614174000.jpg
 *                     driver_license_photo_url:
 *                       type: string
 *                       example: driver-license-pictures/123e4567-e89b-12d3-a456-426614174000.jpg
 *       400:
 *         description: Bad request or upload/update failure
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
 *                   example: Upload Failed
 *                 message:
 *                   type: string
 *                   example: File upload to Supabase failed.
 *                 code:
 *                   type: string
 *                   example: UPLOAD_FAILED
 *       401:
 *         description: Unauthorized - missing authentication
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
 *         description: Driver not found
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
 *                   example: Driver not found for authenticated user.
 *                 code:
 *                   type: string
 *                   example: DRIVER_NOT_FOUND
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
 *                   example: An unexpected error occurred while uploading the photo.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.patch("/picture", upload.single("file"), uploadPicture);

/**
 * @swagger
 * /driver/profile:
 *   patch:
 *     summary: Update driver profile information
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               sex:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               address_line1:
 *                 type: string
 *               address_line2:
 *                 type: string
 *               city:
 *                 type: string
 *               driver_license_class:
 *                type: string
 *               driver_license_number:
 *                 type: string
 *               driver_license_expiration:
 *                 type: string
 *                 format: date
 *               ktp_id:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               vehicle_year:
 *                 type: number
 *               vehicle_brand:
 *                 type: string
 *               vehicle_color:
 *                 type: string
 *               vehicle_model:
 *                 type: string
 *               vehicle_plate_number:
 *                 type: string
 *               vehicle_type:
 *                 type: string
 *               vehicle_registration_no:
 *                 type: string
 *               status:
 *                 type: string
 *               push_token:
 *                 type: string
 *               status_success_confirmed:
 *                type: string
 *               notes:
 *                type: string
 *     responses:
 *       200:
 *         description: Driver profile updated successfully
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
 *                   example: Driver profile updated successfully
 *                 code:
 *                   type: string
 *                   example: PROFILE_UPDATED
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request or update failure
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
 *                   example: Update Failed
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *                   example: UPDATE_FAILED
 *       401:
 *         description: Unauthorized - missing authentication
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
 *         description: User not found
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
 *                   example: User not found.
 *                 code:
 *                   type: string
 *                   example: USER_NOT_FOUND
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
 *                   example: An unexpected error occurred while updating the profile.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.patch("/profile", updateProfile);

/**
 * @swagger
 * /driver/profile:
 *   get:
 *     summary: Get the authenticated driver's profile
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 code:
 *                   type: string
 *                   example: RIDE_DATA_FETCHED
 *                 message:
 *                   type: string
 *                   example: Ride data fetched successfully
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized - missing or invalid authentication
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
 *       500:
 *         description: Failed to fetch driver data or internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 500
 *                 code:
 *                   type: string
 *                   example: FAILED_TO_FETCH_DRIVER_DATA
 *                 message:
 *                   type: string
 *                   example: Failed to fetch driver data
 *                 error:
 *                   type: string
 *                   example: Failed to fetch driver data
 */
router.get("/profile", getDriverProfile);

/**
 * @swagger
 * /driver/nearby:
 *   post:
 *     summary: Get nearby drivers based on pickup location
 *     tags: [Driver]
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
 *         description: Nearby drivers found successfully
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
 *                   example: NEARBY_DRIVERS_FOUND
 *                 message:
 *                   type: string
 *                   example: Nearby drivers retrieved successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     motorcycle:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           driver_id:
 *                             type: string
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                           distance_km:
 *                             type: number
 *                     car:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           driver_id:
 *                             type: string
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                           distance_km:
 *                             type: number
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
 *                   example: Missing or invalid pickup location
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
 *                   example: An unexpected error occurred while fetching nearby drivers.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 *                 details:
 *                   type: string
 *                   example: Some error details
 */
router.post("/nearby", getNearbyDriversHandler);


export default router;
