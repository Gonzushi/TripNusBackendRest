import express from "express";
import { createReview } from "../controllers/reviewController";

const router = express.Router();

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create a new review
 *     tags:
 *       - Reviews
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
 *               - reviewer_id
 *               - reviewee_id
 *               - reviewee_type
 *               - rating
 *             properties:
 *               ride_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the ride
 *               reviewer_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user giving the review
 *               reviewee_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user being reviewed
 *               reviewee_type:
 *                 type: string
 *                 enum: [driver, rider]
 *                 description: Type of the user being reviewed
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating value
 *               comment:
 *                 type: string
 *                 description: Optional comment
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post("/", createReview);

export default router;
