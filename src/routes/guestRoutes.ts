import express from "express";
import {
  createGuest,
  updateGuest,
  deleteGuest,
  getGuests,
  getGuestById,
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
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Jane Doe", "Jim Doe"]
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
 *               tag:
 *                 type: string
 *                 example: Finna
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
 *                 example: Johnathan Doe
 *               nickname:
 *                 type: string
 *                 example: JohnDoe88
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
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Jane Doe", "Jim Doe"]
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
 *               tag:
 *                 type: string
 *                 example: Finna
 *     responses:
 *       200:
 *         description: Guest updated successfully
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
 *                   example: Guest updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: d3f3b018-4cd5-487e-a5fb-123456789abc
 *                     nickname:
 *                       type: string
 *                       example: JohnDoe88
 *                     is_attending:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: ID not provided or invalid input
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
 *                   example: Invalid guest ID or input
 *       500:
 *         description: Internal server error
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
 *                   example: UPDATE_FAILED
 *                 message:
 *                   type: string
 *                   example: Failed to update guest in database.
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

/**
 * @swagger
 * /guests:
 *   get:
 *     summary: Retrieve a list of guests with optional search, pagination, and sorting
 *     tags: [Guests]
 *     parameters:
 *       - in: query
 *         name: wedding_id
 *         schema:
 *           type: string
 *           default: 931d5a18-9bce-40ab-9717-6a117766ff44
 *         required: true
 *         description: Filter guests by wedding ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Search by nickname or full name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Max number of guests to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of guests to skip
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [nickname, full_name, created_at]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: A list of guests
 *       500:
 *         description: Failed to fetch guests
 */
router.get("/", getGuests);

/**
 * @swagger
 * /guests/{id}:
 *   get:
 *     summary: Retrieve a guest by ID
 *     tags: [Guests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: a1b2c3d4-e5f6-7890-abcd-1234567890ef
 *         description: Unique ID of the guest to retrieve
 *     responses:
 *       200:
 *         description: Guest retrieved successfully
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
 *                   example: Guest fetched successfully
 *                 data:
 *                   $ref: '#/components/schemas/Guest'
 *       400:
 *         description: Missing or invalid guest ID
 *       500:
 *         description: Failed to fetch guest
 */
router.get("/:id", getGuestById);


export default router;
