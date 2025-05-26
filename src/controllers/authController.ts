import { FastifyRequest, FastifyReply } from "fastify";
import { AuthenticatedRequest } from "../types/request";
import supabase from "../supabaseClient";

// Register a new user
export const register = async (
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const { email, password } = request.body;

  const { data: existingUserData, error: existingUserError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUserError && existingUserError.code !== "PGRST116") {
    reply.status(500).send({
      status: 500,
      error: "Database query failed",
      message:
        "An unexpected error occurred while checking for existing users.",
      code: "DB_QUERY_ERROR",
      details: existingUserError.message,
    });
    return;
  }

  if (existingUserData) {
    reply.status(409).send({
      status: 409,
      error: "Email already in use",
      message:
        "This email is already registered. Please log in or reset your password.",
      code: "USER_ALREADY_EXISTS",
    });
    return;
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    reply.status(400).send({
      status: 400,
      error: "User registration failed",
      message:
        "Could not register user. Please verify your email and try again.",
      code: "SIGN_UP_ERROR",
      details: signUpError.message,
    });
    return;
  }

  reply.status(201).send({
    status: 201,
    message:
      "User registered successfully. Please check your email to activate your account.",
    code: "USER_REGISTERED",
    data: signUpData,
  });
};

// Resend Activation Email
export const resendActivation = async (
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const { email } = request.body;

  if (!email) {
    reply.status(400).send({
      status: 400,
      error: "Missing email",
      message: "Email is required to resend activation.",
      code: "EMAIL_REQUIRED",
    });
    return;
  }

  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    reply.status(400).send({
      status: 400,
      error: "Resend failed",
      message:
        "Could not resend activation email. Please check the email address.",
      code: "RESEND_FAILED",
      details: error.message,
    });
    return;
  }

  reply.status(200).send({
    status: 200,
    message:
      "If the email is registered and not yet activated, an activation link has been sent. Please check your inbox.",
    code: "ACTIVATION_EMAIL_RESENT",
    data,
  });
};

// Login
export const login = async (
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const { email, password } = request.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    reply.status(401).send({
      status: 401,
      error: "Authentication failed",
      message: "Invalid email or password.",
      code: "AUTH_FAILED",
      details: error.message,
    });
    return;
  }

  reply.status(200).send({
    status: 200,
    message: "Login successful.",
    code: "LOGIN_SUCCESS",
    data,
  });
};

// Refresh Token
export const refreshToken = async (
  request: FastifyRequest<{ Body: { refreshToken: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const { refreshToken } = request.body;

  if (!refreshToken) {
    reply.status(400).send({
      status: 400,
      error: "Bad Request",
      message: "Refresh token is required",
      code: "REFRESH_TOKEN_REQUIRED",
    });
    return;
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      reply.status(401).send({
        status: 401,
        error: "Unauthorized",
        message: error.message,
        code: "INVALID_REFRESH_TOKEN",
      });
      return;
    }

    reply.status(200).send({
      status: 200,
      message: "Access token refreshed successfully",
      code: "REFRESH_SUCCESS",
      data,
    });
  } catch {
    reply.status(500).send({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred during token refresh.",
      code: "INTERNAL_ERROR",
    });
  }
};

// Logout
export const logout = async (
  request: FastifyRequest<{ Body: { scope?: "global" | "local" | "others" } }>,
  reply: FastifyReply
): Promise<void> => {
  const authHeader = request.headers.authorization;
  const accessToken = authHeader?.split(" ")[1];
  const scope = request.body.scope ?? "local";

  if (!accessToken) {
    reply.status(400).send({
      status: 400,
      error: "Bad Request",
      message: "Access token is required for logout.",
      code: "ACCESS_TOKEN_REQUIRED",
    });
    return;
  }

  try {
    const { error } = await supabase.auth.admin.signOut(accessToken, scope);

    if (error) {
      reply.status(400).send({
        status: 400,
        error: "Logout failed",
        message: error.message,
        code: "LOGOUT_FAILED",
      });
      return;
    }

    reply.status(200).send({
      status: 200,
      message: `Logged out successfully. Your session has been revoked (${scope} scope).`,
      code: "LOGOUT_SUCCESS",
    });
  } catch {
    reply.status(500).send({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred during logout.",
      code: "INTERNAL_ERROR",
    });
  }
};

// Reset Password (send reset email)
export const resetPasswordForEmail = async (
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const { email } = request.body;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      process.env.PASSWORD_RESET_REDIRECT ||
      "http://localhost:3000/reset-password",
  });

  if (error) {
    reply.status(400).send({
      status: 400,
      error: "Password Reset Failed",
      message: error.message,
      code: "RESET_EMAIL_FAILED",
    });
    return;
  }

  reply.status(200).send({
    status: 200,
    message:
      "If an account with that email exists, a password reset email has been sent.",
    code: "RESET_EMAIL_SENT",
  });
};

// Change Password
export const changePassword = async (
  request: AuthenticatedRequest<{
    Body: { password: string };
  }>,
  reply: FastifyReply
): Promise<void> => {
  const userId = request.user?.sub;
  const { password } = request.body;

  if (!userId) {
    reply.status(401).send({
      status: 401,
      error: "Unauthorized",
      message: "User ID not found in request context.",
      code: "USER_NOT_FOUND",
    });
    return;
  }

  if (!password || typeof password !== "string") {
    reply.status(400).send({
      status: 400,
      error: "Bad Request",
      message: "Password is required and must be a string.",
      code: "PASSWORD_REQUIRED",
    });
    return;
  }

  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      reply.status(400).send({
        status: 400,
        error: "Update Failed",
        message: error.message,
        code: "UPDATE_PASSWORD_FAILED",
      });
      return;
    }

    reply.status(200).send({
      status: 200,
      message: "Password updated successfully",
      code: "PASSWORD_UPDATED",
    });
  } catch {
    reply.status(500).send({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while updating the password.",
      code: "INTERNAL_ERROR",
    });
  }
};

// JWT Checker
export const jwtChecker = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!request.user) {
    reply.status(401).send({
      status: 401,
      error: "Unauthorized",
      message: "Missing or invalid token",
      code: "AUTH_HEADER_MISSING",
    });
    return;
  }

  reply.status(200).send({
    status: 200,
    message: "JWT token is valid",
    code: "TOKEN_VALID",
  });
};
