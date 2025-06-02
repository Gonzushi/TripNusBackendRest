import { Request, Response } from "express";
import supabase, { supabaseAnon } from "../supabaseClient";

interface UserInfo {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  rider_id: string | null;
  driver_id: string | null;
}

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Check if an active user with the same email exists
  const { data: existingUserData, error: existingUserError } =
    await supabase.rpc("get_user_by_email", {
      p_email: email,
    });

  if (existingUserError && existingUserError.code !== "PGRST116") {
    res.status(500).json({
      status: 500,
      error: "Database query failed",
      message:
        "An unexpected error occurred while checking for existing users.",
      code: "DB_QUERY_ERROR",
      details: existingUserError.message,
    });
    return;
  }

  if (existingUserData.length > 0) {
    res.status(409).json({
      status: 409,
      error: "Email already in use",
      message:
        "This email is already registered. Please log in or reset your password.",
      code: "USER_ALREADY_EXISTS",
    });
    return;
  }

  // Proceed with signup
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    res.status(400).json({
      status: 400,
      error: "User registration failed",
      message:
        "Could not register user. Please verify your email and try again.",
      code: "SIGN_UP_ERROR",
      details: signUpError.message,
    });
    return;
  }

  res.status(201).json({
    status: 201,
    message:
      "User registered successfully. Please check your email to activate your account.",
    code: "USER_REGISTERED",
    data: signUpData,
  });
};

// Resend Activation Email
export const resendActivation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
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
    res.status(400).json({
      status: 400,
      error: "Resend failed",
      message:
        "Could not resend activation email. Please check the email address.",
      code: "RESEND_FAILED",
      details: error.message,
    });
    return;
  }

  res.status(200).json({
    status: 200,
    message:
      "If the email is registered and not yet activated, an activation link has been sent. Please check your inbox.",
    code: "ACTIVATION_EMAIL_RESENT",
    data,
  });
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 1. Authenticate user with email and password
    const { data: authData, error: authError } =
      await supabaseAnon.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      res.status(401).json({
        status: 401,
        error: "Authentication failed",
        message: authError.message,
        code: "AUTH_FAILED",
      });
      return;
    }

    const authId = authData.user?.id;

    if (!authId) {
      res.status(401).json({
        status: 401,
        error: "Authentication failed",
        message: "Authenticated user ID not found.",
        code: "AUTH_ID_NOT_FOUND",
      });
      return;
    }

    // 2. Call the RPC to get user, rider, and driver info
    const { data: userInfo, error: rpcError } = (await supabase
      .rpc("get_user_by_auth_id", { p_auth_id: authId })
      .single()) as { data: UserInfo | null; error: any };

    if (rpcError || !userInfo) {
      console.error("RPC error:", rpcError);
      res.status(500).json({
        status: 500,
        error: "Database error",
        message: "Error fetching user info via RPC",
        code: "RPC_ERROR",
      });
      return;
    }

    // 3. Combine with authData
    const responseData = {
      ...authData,
      userId: userInfo.user_id,
      firstName: userInfo.first_name,
      lastName: userInfo.last_name,
      riderId: userInfo.rider_id || null,
      driverId: userInfo.driver_id || null,
    };

    // 4. Respond with success
    res.status(200).json({
      status: 200,
      message: "Login successful.",
      code: "LOGIN_SUCCESS",
      data: responseData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: 500,
      error: "Server error",
      message: "An unexpected error occurred",
      code: "SERVER_ERROR",
    });
  }
};

// Refresh Token
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "refresh_token and access_token are required",
      code: "TOKEN_REQUIRED",
    });
    return;
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refresh_token,
    });

    if (error) {
      res.status(401).json({
        status: 401,
        error: "Unauthorized",
        message: error.message,
        code: "INVALID_REFRESH_TOKEN",
      });
      return;
    }
    res.status(200).json({
      status: 200,
      message: "Access token refreshed successfully",
      code: "REFRESH_SUCCESS",
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred during token refresh.",
      code: "INTERNAL_ERROR",
    });
  }
};

// Logout - need to check if I need to use supbaseAnon to logout the token and refresh token
export const logout = async (req: Request, res: Response): Promise<void> => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  const { scope = "local" } = req.body;

  if (!accessToken) {
    res.status(400).json({
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
      res.status(400).json({
        status: 400,
        error: "Logout failed",
        message: error.message,
        code: "LOGOUT_FAILED",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: `Logged out successfully. Your session has been revoked (${scope} scope).`,
      code: "LOGOUT_SUCCESS",
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred during logout.",
      code: "INTERNAL_ERROR",
    });
  }
};

// Reset Password (send reset email)
export const resetPasswordForEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo:
      process.env.PASSWORD_RESET_REDIRECT ||
      "http://localhost:3000/reset-password",
  });

  if (error) {
    res.status(400).json({
      status: 400,
      error: "Password Reset Failed",
      message: error.message,
      code: "RESET_EMAIL_FAILED",
    });
    return;
  }

  res.status(200).json({
    status: 200,
    message:
      "If an account with that email exists, a password reset email has been sent.",
    code: "RESET_EMAIL_SENT",
  });
};

// Change Password
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { type, tokenHash, password } = req.body;

  const { data: recoveryData, error: recoveryError } =
    await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

  if (recoveryError) {
    res.status(403).json({
      status: 403,
      error: "Unable to verify OTP",
      message: recoveryError.message,
      code: "OTP_EXPIRED",
    });
    return;
  }

  if (!password || typeof password !== "string") {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Password is required and must be a string.",
      code: "PASSWORD_REQUIRED",
    });
    return;
  }

  try {
    const { error } = await supabase.auth.admin.updateUserById(
      recoveryData?.user?.id!,
      {
        password,
      }
    );

    if (error) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: error.message,
        code: "UPDATE_PASSWORD_FAILED",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: "Password updated successfully",
      code: "PASSWORD_UPDATED",
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while updating the password.",
      code: "INTERNAL_ERROR",
    });
  }
};

// JWT Checker
export const jwtChecker = (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({
      status: 401,
      error: "Unauthorized",
      message: "Missing or invalid token",
      code: "AUTH_HEADER_MISSING",
    });
    return;
  }

  res.status(200).json({
    status: 200,
    message: "JWT token is valid",
    code: "TOKEN_VALID",
    data: req.user,
  });
};
