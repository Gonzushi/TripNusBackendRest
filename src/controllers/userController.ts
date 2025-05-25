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

// import { v4 as uuidv4 } from "uuid";
// Upload user profile picture
// export const uploadProfilePicture = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   const authId = req.user?.sub;
//   const file = req.file; 

//   if (!authId) {
//     res.status(401).json({
//       status: 401,
//       error: "Unauthorized",
//       message: "User ID not found in request context.",
//       code: "USER_NOT_FOUND",
//     });
//     return;
//   }

//   if (!file) {
//     res.status(400).json({
//       status: 400,
//       error: "Bad Request",
//       message: "No file uploaded.",
//       code: "FILE_REQUIRED",
//     });
//     return;
//   }

//   try {
//     // Generate a unique file path in Supabase Storage
//     const fileExtension = file.originalname.split(".").pop();
//     const fileName = `profile-pictures/${authId}/${uuidv4()}.${fileExtension}`;

//     const { data, error: uploadError } = await supabase.storage
//       .from("user-media")
//       .upload(fileName, file.buffer, {
//         contentType: file.mimetype,
//         upsert: true,
//       });

//     console.log(data, uploadError)

//     if (uploadError) {
//       res.status(400).json({
//         status: 400,
//         error: "Upload Failed",
//         message: uploadError.message,
//         code: "UPLOAD_FAILED",
//       });
//       return;
//     }

//     // Get the public URL for the uploaded image
//     const fileUrl = data.fullPath;

//     // Update user record with profile picture URL
//     const { data: updateData, error: updateError } = await supabase
//       .from("users")
//       .update({ profile_picture_url: fileUrl })
//       .eq("auth_id", authId)
//       .select()
//       .single();

//     if (updateError) {
//       res.status(400).json({
//         status: 400,
//         error: "Update Failed",
//         message: updateError.message,
//         code: "UPDATE_PROFILE_PICTURE_FAILED",
//       });
//       return;
//     }

//     res.status(200).json({
//       status: 200,
//       message: "Profile picture uploaded successfully",
//       code: "UPLOAD_SUCCESS",
//       data: updateData,
//     });
//   } catch (err) {
//     res.status(500).json({
//       status: 500,
//       error: "Internal Server Error",
//       message:
//         "An unexpected error occurred while uploading the profile picture.",
//       code: "INTERNAL_ERROR",
//     });
//   }
// };
// router.post("/picture", upload.single("file"), uploadProfilePicture);
