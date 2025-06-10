import express from "express";
import multer from "multer";
import {
  createProfile,
  uploadProfilePicture,
  updateProfile,
} from "../controllers/riderController";

const upload = multer();
const router = express.Router();

/**
 * @swagger
 * /rider/profile:
 *   post:
 *     summary: Create a rider profile
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: No body parameters required; user is identified from auth token.
 *       required: false
 *     responses:
 *       200:
 *         description: Rider profile was created successfully
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
 *                   example: Rider profile was created successfully
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
 *         description: Bad request, user lookup failure, or rider already exists
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
 *                   example: Rider Exists
 *                 message:
 *                   type: string
 *                   example: Rider for this user already exists.
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
 *                   example: An unexpected error occurred while creating the rider profile.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.post("/profile", createProfile);

/**
 * @swagger
 * /rider/picture:
 *   post:
 *     summary: Upload rider profile picture
 *     tags: [Rider]
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
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file to upload
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
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
 *                   example: Profile picture uploaded successfully
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
 *                   example: Rider not found for authenticated user.
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
 *                   example: An unexpected error occurred while uploading the profile picture.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.post("/picture", upload.single("file"), uploadProfilePicture);

/**
 * @swagger
 * /rider/profile:
 *   patch:
 *     summary: Update driver profile information
 *     tags: [Rider]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              push_token:
 *                type: string
 *     responses:
 *       200:
 *         description: Rider profile updated successfully
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
 *                   example: Rider profile updated successfully
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

export default router;
