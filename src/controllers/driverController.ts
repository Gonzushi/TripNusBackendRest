import { Request, Response } from "express";
import supabase from "../supabaseClient";
import Redis from "ioredis";
import { redis } from "../index";

const MAX_RADIUS_KM = 10;
const MAX_RESULTS = 10;

// Create driver profile
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

  const { count: driverCount, error: driverError } = await supabase
    .from("drivers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userData.id);

  if (driverError) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Error while checking driver existence.",
      code: "CHECK_DRIVER_FAILED",
    });
    return;
  }

  if ((driverCount ?? 0) > 0) {
    res.status(400).json({
      status: 400,
      error: "Driver Exists",
      message: "Driver for this user already exists.",
      code: "DRIVER_EXISTS",
    });
    return;
  }

  try {
    const { data, error } = await supabase
      .from("drivers")
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
      message: "Driver profile was created successfully",
      code: "PROFILE_CREATED",
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message:
        "An unexpected error occurred while creating the driver profile.",
      code: "INTERNAL_ERROR",
    });
  }
};

// Upload picture
export const uploadPicture = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;
  const file = req.file;
  const photoType = req.body.photoType as string; // 'ktp' | 'license' | 'profile' | 'bank_statement'

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

  const allowedTypes = {
    ktp: {
      pathPrefix: "ktp-pictures",
      updateField: "ktp_photo_url",
    },
    license: {
      pathPrefix: "driver-license-pictures",
      updateField: "driver_license_photo_url",
    },
    profile: {
      pathPrefix: "driver-profile-pictures",
      updateField: "profile_picture_url",
    },
    stnk: {
      pathPrefix: "stnk-pictures",
      updateField: "vehicle_registration_photo_url",
    },
    bank_statement: {
      pathPrefix: "bank-statement-pictures",
      updateField: "bank_statement_photo_url",
    },
  };

  if (!photoType || !(photoType in allowedTypes)) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: `Invalid or missing photoType. Must be one of: ${Object.keys(
        allowedTypes
      ).join(", ")}`,
      code: "INVALID_PHOTO_TYPE",
    });
    return;
  }

  try {
    // Step 1: Get driver ID from auth_id
    const { data: driverData, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (driverError || !driverData) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "Driver not found.",
        code: "DRIVER_NOT_FOUND",
      });
      return;
    }

    // Step 2: Upload file
    const fileExtension = file.originalname.split(".").pop();
    const { pathPrefix, updateField } =
      allowedTypes[photoType as keyof typeof allowedTypes];

    const filePath = `${pathPrefix}/${authId}.${fileExtension}`;

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

    const fileUrl = uploadData.fullPath;

    // Step 3: Update driver record dynamically
    const { data: updatedDriver, error: updateError } = await supabase
      .from("drivers")
      .update({ [updateField]: fileUrl })
      .eq("auth_id", authId)
      .select()
      .single();

    if (updateError) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: updateError.message,
        code: "UPDATE_FAILED",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: `${photoType} photo uploaded successfully`,
      code: "UPLOAD_SUCCESS",
      data: updatedDriver,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while uploading the photo.",
      code: "INTERNAL_ERROR",
    });
  }
};

// Update driver profile
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;

  const updateFields = [
    "first_name",
    "last_name",
    "sex",
    "date_of_birth",
    "address_line1",
    "address_line2",
    "city",
    "driver_license_class",
    "driver_license_number",
    "driver_license_expiration",
    "ktp_id",
    "postal_code",
    "vehicle_type",
    "vehicle_year",
    "vehicle_brand",
    "vehicle_model",
    "vehicle_color",
    "vehicle_plate_number",
    "vehicle_registration_no",
    "status",
    "push_token",
    "notes",
    "is_online",
    "is_suspended",
    "availability_status",
    "decline_count",
    "missed_requests",
  ];

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
    const { data: driverData, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (driverError || !driverData) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "Driver not found.",
        code: "DRIVER_NOT_FOUND",
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
      .from("drivers")
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
      message: "Driver profile updated successfully",
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

export const getDriverProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;

  try {
    const { data: driverData, error: driverError } = await supabase
      .from("drivers")
      .select("*")
      .eq("auth_id", authId)
      .single();

    if (driverError) {
      res.status(500).json({
        status: 500,
        code: "FAILED_TO_FETCH_DRIVER_DATA",
        message: "Failed to fetch driver data",
        error: "Failed to fetch driver data",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      code: "RIDE_DATA_FETCHED",
      message: "Ride data fetched successfully",
      data: driverData,
    });
  } catch (error) {
    console.error("Unexpected error in getRide:", error);
    res.status(500).json({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred while fetching the ride data.",
      error: "Internal server error",
    });
  }
};

async function getNearbyDrivers(
  redis: Redis,
  pickup: { latitude: number; longitude: number }
) {
  const { latitude, longitude } = pickup;

  const motorcycleResults = (await redis.geosearch(
    "drivers:locations:motorcycle",
    "FROMLONLAT",
    longitude,
    latitude,
    "BYRADIUS",
    MAX_RADIUS_KM,
    "km",
    "ASC",
    "WITHDIST",
    "WITHCOORD",
    "COUNT",
    MAX_RESULTS
  )) as [string, string, [string, string]][];

  const carResults = (await redis.geosearch(
    "drivers:locations:car",
    "FROMLONLAT",
    longitude,
    latitude,
    "BYRADIUS",
    MAX_RADIUS_KM,
    "km",
    "ASC",
    "WITHDIST",
    "WITHCOORD",
    "COUNT",
    MAX_RESULTS
  )) as [string, string, [string, string]][];

  return {
    motorcycle: motorcycleResults.map(([driverId, distance, [lon, lat]]) => ({
      driver_id: driverId,
      distance_km: parseFloat(distance),
      longitude: parseFloat(lon),
      latitude: parseFloat(lat),
    })),
    car: carResults.map(([driverId, distance, [lon, lat]]) => ({
      driver_id: driverId,
      distance_km: parseFloat(distance),
      longitude: parseFloat(lon),
      latitude: parseFloat(lat),
    })),
  };
}

export const getNearbyDriversHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { pickup } = req.body;

    if (!pickup?.latitude || !pickup?.longitude) {
      res.status(400).json({
        status: 400,
        code: "INVALID_INPUT",
        message: "Missing or invalid fields: pickup.latitude, pickup.longitude",
      });
      return;
    }

    const nearbyDrivers = await getNearbyDrivers(redis, pickup);

    res.status(200).json({
      status: 200,
      code: "NEARBY_DRIVERS_FOUND",
      message: "Nearby drivers retrieved successfully.",
      data: nearbyDrivers,
    });
  } catch (error: any) {
    console.error("Internal error:", error?.response?.data || error.message);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while fetching nearby drivers.",
      code: "INTERNAL_ERROR",
      details: error?.response?.data || error.message,
    });
  }
};
