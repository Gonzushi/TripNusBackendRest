import express from "express";
import {
  register,
  resendActivation,
  login,
  refreshToken,
  logout,
  resetPasswordForEmail,
  changePassword,
  updatePhoneNumber,
  jwtChecker,
} from "../controllers/authController";

import { authenticateUser } from "../middlewares/authHandler";

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: hendrywidyanto97@gmail.com
 *               password:
 *                 type: string
 *                 example: Password123456789!
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: User registered successfully. Please check your email to activate your account.
 *                 code:
 *                   type: string
 *                   example: USER_REGISTERED
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: abc123
 *                         email:
 *                           type: string
 *                           example: hendrywidyanto97@gmail.com
 *       400:
 *         description: Registration failed due to invalid input or other client error
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
 *                   example: User registration failed
 *                 message:
 *                   type: string
 *                   example: Could not register user. Please verify your email and try again.
 *                 code:
 *                   type: string
 *                   example: SIGN_UP_ERROR
 *                 details:
 *                   type: string
 *                   example: Password must be at least 8 characters.
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 409
 *                 error:
 *                   type: string
 *                   example: Email already in use
 *                 message:
 *                   type: string
 *                   example: This email is already registered. Please log in or reset your password.
 *                 code:
 *                   type: string
 *                   example: USER_ALREADY_EXISTS
 *       500:
 *         description: Internal server error (e.g. database failure)
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
 *                   example: Database query failed
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred while checking for existing users.
 *                 code:
 *                   type: string
 *                   example: DB_QUERY_ERROR
 *                 details:
 *                   type: string
 *                   example: Database timeout or connection error
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/resend-activation:
 *   post:
 *     summary: Resend email activation link
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: hendrywidyanto97@gmail.com
 *     responses:
 *       200:
 *         description: Activation email resent successfully
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
 *                   example: Activation email resent successfully.
 *                 code:
 *                   type: string
 *                   example: ACTIVATION_EMAIL_RESENT
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing or invalid email / resend failed
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: integer
 *                       example: 400
 *                     error:
 *                       type: string
 *                       example: Missing email
 *                     message:
 *                       type: string
 *                       example: Email is required to resend activation.
 *                     code:
 *                       type: string
 *                       example: EMAIL_REQUIRED
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: integer
 *                       example: 400
 *                     error:
 *                       type: string
 *                       example: Resend failed
 *                     message:
 *                       type: string
 *                       example: Could not resend activation email. Please check the email address.
 *                     code:
 *                       type: string
 *                       example: RESEND_FAILED
 *                     details:
 *                       type: string
 *                       example: User not found or email already confirmed
 */
router.post("/resend-activation", resendActivation);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: hendrywidyanto97@gmail.com
 *               password:
 *                 type: string
 *                 example: Password123456789!
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful.
 *                 code:
 *                   type: string
 *                   example: LOGIN_SUCCESS
 *                 data:
 *                   type: object
 *                   description: User authentication data
 *       401:
 *         description: Invalid credentials
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
 *                   example: Authentication failed
 *                 message:
 *                   type: string
 *                   example: Invalid email or password.
 *                 code:
 *                   type: string
 *                   example: AUTH_FAILED
 *                 details:
 *                   type: string
 *                   example: Wrong password or user does not exist.
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using a valid refresh token
 *     tags: [Auth]
 *     security: []   # no auth required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: The refresh token obtained during login
 *                 example: 2mnkjrcs2dki
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
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
 *                   example: Access token refreshed successfully
 *                 code:
 *                   type: string
 *                   example: REFRESH_SUCCESS
 *                 data:
 *                   type: object
 *                   description: Token refresh data returned from Supabase
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       description: New access token
 *                     refresh_token:
 *                       type: string
 *                       description: New refresh token
 *                     expires_in:
 *                       type: integer
 *                       description: Access token expiry time in seconds
 *                     token_type:
 *                       type: string
 *                       example: bearer
 *       400:
 *         description: Missing refresh token in request body
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
 *                   example: Refresh token is required
 *                 code:
 *                   type: string
 *                   example: TOKEN_REQUIRED
 *       401:
 *         description: Invalid or expired refresh token
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
 *                   example: Invalid or expired refresh token
 *                 code:
 *                   type: string
 *                   example: INVALID_REFRESH_TOKEN
 *       500:
 *         description: Server error during token refresh
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
 *                   example: An unexpected error occurred during token refresh.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.post("/refresh-token", refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user and revoke their session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               scope:
 *                 type: string
 *                 description: Scope of the logout. One of 'local', 'global', or 'others'. Defaults to 'local'.
 *                 enum: [local, global, others]
 *                 example: local
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: Logged out successfully. Your session has been revoked (local scope).
 *                 code:
 *                   type: string
 *                   example: LOGOUT_SUCCESS
 *       400:
 *         description: Logout failed due to invalid token or Supabase error
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
 *                   example: Logout failed
 *                 message:
 *                   type: string
 *                   example: Invalid or expired token
 *                 code:
 *                   type: string
 *                   example: LOGOUT_FAILED
 *       401:
 *         description: Missing or invalid authorization header
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
 *                   example: Authorization header missing or invalid
 *                 code:
 *                   type: string
 *                   example: AUTH_HEADER_MISSING
 *       500:
 *         description: Server error during logout
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
 *                   example: An unexpected error occurred during logout.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.post("/logout", authenticateUser, logout);

/**
 * @swagger
 * /auth/reset-password-for-email:
 *   post:
 *     summary: Send password reset email
 *     description: Sends a password reset email if the email exists in the system. You will only receive the email if the account is registered.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: hendrywidyanto97@gmail.com
 *     responses:
 *       200:
 *         description: Password reset email sent (if the email exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *             example:
 *               status: 200
 *               message: If the email exists, a password reset link has been sent.
 *               code: RESET_EMAIL_SENT
 *       400:
 *         description: Reset error (e.g., invalid email format or Supabase error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *                 code:
 *                   type: string
 *             example:
 *               status: 400
 *               error: Bad Request
 *               message: Invalid email format or internal error
 *               code: RESET_EMAIL_FAILED
 */
router.post("/reset-password-for-email", resetPasswordForEmail);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password using OTP verification
 *     description: Update user's password using a valid OTP token from the reset password flow
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       description: Password change payload with OTP verification
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - tokenHash
 *               - password
 *             properties:
 *               type:
 *                 type: string
 *                 example: recovery
 *               tokenHash:
 *                 type: string
 *                 description: The token hash from the reset password URL
 *                 example: abcdef123456
 *               password:
 *                 type: string
 *                 example: Password123456789!
 *     responses:
 *       200:
 *         description: Password updated successfully
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
 *                   example: Password updated successfully
 *                 code:
 *                   type: string
 *                   example: PASSWORD_UPDATED
 *       400:
 *         description: Invalid input or update error
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
 *                   example: Invalid password format
 *                 code:
 *                   type: string
 *                   example: UPDATE_PASSWORD_FAILED
 *       403:
 *         description: Invalid or expired OTP token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 403
 *                 error:
 *                   type: string
 *                   example: Unable to verify OTP
 *                 message:
 *                   type: string
 *                   example: Invalid or expired recovery token
 *                 code:
 *                   type: string
 *                   example: OTP_EXPIRED
 *       500:
 *         description: Server error during password update
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
 *                   example: An unexpected error occurred while updating the password.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.post("/change-password", changePassword);

/**
 * @swagger
 * /auth/update-phone:
 *   post:
 *     summary: Update the authenticated user's phone number
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: The new phone number in international format (e.g., +628123456789)
 *                 example: "+628123456789"
 *     responses:
 *       200:
 *         description: Phone number updated successfully
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
 *                   example: Phone number updated successfully.
 *                 code:
 *                   type: string
 *                   example: UPDATE_PHONE_SUCCESS
 *                 user:
 *                   type: object
 *                   description: The updated user object from Supabase
 *       400:
 *         description: Missing parameters or update failed
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
 *                   example: Update failed
 *                 message:
 *                   type: string
 *                   example: Invalid phone format or missing parameters
 *                 code:
 *                   type: string
 *                   example: UPDATE_PHONE_FAILED
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
 *                   example: Authorization header missing or invalid
 *                 code:
 *                   type: string
 *                   example: AUTH_HEADER_MISSING
 *       500:
 *         description: Server error while updating phone number
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
 *                   example: An unexpected error occurred while updating phone number.
 *                 code:
 *                   type: string
 *                   example: INTERNAL_ERROR
 */
router.post("/update-phone", authenticateUser, updatePhoneNumber);


/**
 * @swagger
 * /auth/jwt-checker:
 *   get:
 *     summary: To check that JWT decoder is working properly, this endpoint returns the user profile from the JWT token.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
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
 *                   example: User profile retrieved successfully
 *                 code:
 *                   type: string
 *                   example: PROFILE_RETRIEVED
 *                 data:
 *                   type: object
 *                   properties:
 *                     sub:
 *                       type: string
 *                       example: "0852947a-c176-47d7-a3e9-343203a260b4"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *       401:
 *         description: Missing or invalid token
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
 *                   example: Missing or invalid token
 *                 code:
 *                   type: string
 *                   example: AUTH_HEADER_MISSING
 */
router.get("/jwt-checker", authenticateUser, jwtChecker);

export default router;
