import { Request, Response } from "express";
import supabase from "../supabaseClient";

// Register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json({
    message: "User created. Please check your email to activate your account.",
    data: data,
  });
};

// Resend Activation Email
export const resendActivation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ message: "Activation email resent", data });
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(401).json({ error: error.message });
    return;
  }

  if (!data.user?.email_confirmed_at) {
    res
      .status(403)
      .json({ error: "Please verify your email before logging in." });
    return;
  }

  res.json(data);
};

// Logout
export const logout = async (_req: Request, res: Response): Promise<void> => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ message: "Logged out successfully" });
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
    res.status(400).json({ error: error.message });
    return;
  }

  res.json({ message: "Password reset email sent" });
};

// Change Password 
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.sub;

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password: req.body.password,
  });

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json({ message: "Password updated successfully" });
};
