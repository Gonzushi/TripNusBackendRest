import express from "express";
import { calcaulateFare } from "../controllers/fareController";
import { authenticateUser } from "../middlewares/authMiddleware";

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
 *               - pickpoint
 *               - dropoff
 *             properties:
 *               pickpoint:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: "[longitude, latitude] of pickup"
 *                 example: [106.844877, -6.473127]
 *               dropoff:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: "[longitude, latitude] of dropoff"
 *                 example: [106.841782, -6.484847]
 *     responses:
 *       200:
 *         description: Fare calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fare:
 *                   type: object
 *                   properties:
 *                     car:
 *                       type: number
 *                     motorcycle:
 *                       type: number
 *                 routing:
 *                   type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post("/calculate", authenticateUser, calcaulateFare);

export default router;
