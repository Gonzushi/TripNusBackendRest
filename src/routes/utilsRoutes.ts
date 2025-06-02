import express from "express";
import { redirect } from "../controllers/utilsController";

const router = express.Router();

/**
 * @swagger
 * /utils/redirect:
 *   get:
 *     summary: Redirects the user to a reset password URL using the provided `target` query parameter.
 *     tags:
 *       - Utils
 *     parameters:
 *       - in: query
 *         name: target
 *         required: true
 *         description: The URL to which the user will be redirected.
 *         schema:
 *           type: string
 *           example: /reset-password?token=abc123
 *     responses:
 *       302:
 *         description: Redirect to the specified target URL
 *         headers:
 *           Location:
 *             description: The URL where the client is redirected
 *             schema:
 *               type: string
 *               example: /reset-password?token=abc123
 *       400:
 *         description: Missing `target` query parameter
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
 *                   example: Missing "target" query parameter
 *                 code:
 *                   type: string
 *                   example: QUERY_PARAM_MISSING
 */
router.get("/redirect", redirect);

export default router;
