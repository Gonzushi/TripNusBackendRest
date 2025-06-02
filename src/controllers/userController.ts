import { Request, Response } from "express";
import supabase from "../supabaseClient";

// Update user profile (first_name, last_name)
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;
  const { first_name, last_name } = req.body;

  if (!authId) {
    res.status(401).json({
      status: 401,
      error: "Unauthorized",
      message: "User ID not found in request context.",
      code: "USER_NOT_FOUND",
    });
    return;
  }

  if (!first_name && !last_name) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "At least one of first_name or last_name must be provided.",
      code: "MISSING_FIELDS",
    });
    return;
  }

  try {
    const updates: Record<string, any> = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("auth_id", authId)
      .select()
      .single();

    if (error) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: error.message,
        code: "UPDATE_PROFILE_FAILED",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: "User profile updated successfully",
      code: "PROFILE_UPDATED",
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while updating the profile.",
      code: "INTERNAL_ERROR",
    });
  }
};
