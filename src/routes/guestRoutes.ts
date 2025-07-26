import express from "express";
import {
  createGuest,
  updateGuest,
  deleteGuest,
} from "../controllers/guestController";

const router = express.Router();

/**
 * @swagger
 * /guests:
 *   post:
 *     summary: Create a new guest entry
 *     tags: [Guests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *             properties:
 *               nickname:
 *                 type: string
 *                 example: JohnDoe88
 *               full_name:
 *                 type: string
 *                 example: Johnathan Doe
 *               phone_number:
 *                 type: string
 *                 example: +6281234567890
 *               address:
 *                 type: string
 *                 example: Jalan Mawar No. 88, Jakarta
 *               photo_url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/uploads/guest-photo.jpg
 *               wish:
 *                 type: string
 *                 example: Congratulations and best wishes!
 *               additional_names:
 *                 type: string
 *                 example: Jane Doe, Jim Doe
 *               num_attendees:
 *                 type: integer
 *                 example: 3
 *               invitation_link:
 *                 type: string
 *                 example: https://yourdomain.com/invite/johndoe88
 *               wedding_id:
 *                 type: string
 *                 example: 931d5a18-9bce-40ab-9717-6a117766ff44
 *               is_attending:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Guest created successfully
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
 *                   example: Guest created successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: d3f3b018-4cd5-487e-a5fb-123456789abc
 *                       nickname:
 *                         type: string
 *                         example: JohnDoe88
 *                       is_attending:
 *                         type: boolean
 *                         example: true
 *       400:
 *         description: Missing or invalid fields
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
 *                   example: VALIDATION_ERROR
 *                 message:
 *                   type: string
 *                   example: nickname is required.
 *       500:
 *         description: Server error while creating guest
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
 *                   example: CREATE_FAILED
 *                 message:
 *                   type: string
 *                   example: Failed to insert guest into database.
 */
router.post("/", createGuest);

/**
 * @swagger
 * /guests/{id}:
 *   patch:
 *     summary: Update an existing guest
 *     tags: [Guests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Guest ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               nickname:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               address:
 *                 type: string
 *               photo_url:
 *                 type: string
 *               wish:
 *                 type: string
 *               additional_names:
 *                 type: string
 *               num_attendees:
 *                 type: integer
 *               invitation_link:
 *                 type: string
 *               wedding_id:
 *                 type: string
 *               is_attending:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Guest updated successfully
 *       400:
 *         description: ID not provided or invalid input
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", updateGuest);

/**
 * @swagger
 * /guests/{id}:
 *   delete:
 *     summary: Delete a guest by ID
 *     tags: [Guests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Guest ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Guest deleted successfully
 *       400:
 *         description: ID not provided
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteGuest);

export default router;
