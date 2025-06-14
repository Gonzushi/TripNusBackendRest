import { Request, Response } from "express";
import supabase from "../supabaseClient";

// Create rider profile
export const createProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;

  if (!authId) {
    res.status(401).json({
      status: 401,
      error: "Unauthorized",
      message: "User ID not found in request context.",
      code: "USER_NOT_FOUND",
    });
    return;
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authId)
    .single();

  if (userError || !userData) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Cannot find user with provided auth_id.",
      code: "USER_NOT_FOUND",
    });
    return;
  }

  const { count: riderCount, error: riderError } = await supabase
    .from("riders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userData.id);

  if (riderError) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Error while checking rider existence.",
      code: "CHECK_RIDER_FAILED",
    });
    return;
  }

  if ((riderCount ?? 0) > 0) {
    res.status(400).json({
      status: 400,
      error: "Rider Exists",
      message: "Rider for this user already exists.",
      code: "RIDER_EXISTS",
    });
    return;
  }

  try {
    const { data, error } = await supabase
      .from("riders")
      .insert([{ user_id: userData.id, auth_id: authId }])
      .select()
      .single();

    if (error || !data) {
      res.status(400).json({
        status: 400,
        error: "Creation Failed",
        message: error?.message ?? "Unknown insertion error",
        code: "CREATE_PROFILE_FAILED",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: "Rider profile was created successfully",
      code: "PROFILE_CREATED",
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating the rider profile.",
      code: "INTERNAL_ERROR",
    });
  }
};

// Upload rider profile picture
export const uploadProfilePicture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;
  const file = req.file;

  if (!authId) {
    res.status(401).json({
      status: 401,
      error: "Unauthorized",
      message: "User ID not found in request context.",
      code: "USER_NOT_FOUND",
    });
    return;
  }

  if (!file) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "No file uploaded.",
      code: "FILE_REQUIRED",
    });
    return;
  }

  try {
    // Step 1: Find rider by authId
    const { data: riderData, error: riderError } = await supabase
      .from("riders")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (riderError || !riderData) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "Rider not found for authenticated user.",
        code: "RIDER_NOT_FOUND",
      });
      return;
    }

    const riderId = riderData.id;

    // Step 2: Build fixed file name (overwrites existing file)
    const fileExtension = file.originalname.split(".").pop();
    const filePath = `rider-profile-pictures/${authId}.${fileExtension}`;

    // Step 3: Upload with upsert
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("user-media")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      res.status(400).json({
        status: 400,
        error: "Upload Failed",
        message: uploadError.message,
        code: "UPLOAD_FAILED",
      });
      return;
    }

    // Step 4: Get public URL
    const fileUrl = uploadData.fullPath;

    // Step 5: Update rider record
    const { data: updatedRider, error: updateError } = await supabase
      .from("riders")
      .update({ profile_picture_url: fileUrl })
      .eq("id", riderId)
      .select()
      .single();

    if (updateError) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: updateError.message,
        code: "UPDATE_PROFILE_PICTURE_FAILED",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: "Profile picture uploaded successfully",
      code: "UPLOAD_SUCCESS",
      data: updatedRider,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message:
        "An unexpected error occurred while uploading the profile picture.",
      code: "INTERNAL_ERROR",
    });
  }
};

// Update rider profile
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;

  const updateFields = ["push_token", "first_name", "last_name"];

  if (!authId) {
    res.status(401).json({
      status: 401,
      error: "Unauthorized",
      message: "User ID not found in request context.",
      code: "USER_NOT_FOUND",
    });
    return;
  }

  try {
    const { data: riderData, error: riderError } = await supabase
      .from("riders")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (riderError || !riderData) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "Rider not found.",
        code: "RIDER_NOT_FOUND",
      });
      return;
    }
    const updates: Record<string, any> = {};
    for (const field of updateFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "No valid fields provided for update.",
        code: "NO_FIELDS_TO_UPDATE",
      });
      return;
    }

    const { data, error } = await supabase
      .from("riders")
      .update(updates)
      .eq("auth_id", authId)
      .select()
      .single();

    if (error) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: error.message,
        code: "UPDATE_FAILED",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: "Rider profile updated successfully",
      code: "PROFILE_UPDATED",
      data,
    });
  } catch (err) {
    console.error("Unexpected error in updateProfile:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while updating the profile.",
      code: "INTERNAL_ERROR",
    });
  }
};
