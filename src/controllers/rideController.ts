import { Request, Response } from "express";
import supabase from "../supabaseClient";

export const createRide = async (
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

  const requiredFields = [
    "distance_m",
    "duration_s",
    "vehicle_type",
    "service_variant",
    "fare",
    "driver_earning",
    "app_commission",
    "fare_breakdown",
    "planned_pickup_coords",
    "planned_pickup_address",
    "planned_dropoff_coords",
    "planned_dropoff_address",
  ];

  const missingFields = requiredFields.filter(
    (field) => req.body[field] === undefined
  );

  if (missingFields.length > 0) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: `Missing required fields: ${missingFields.join(", ")}`,
      code: "MISSING_FIELDS",
    });
    return;
  }

  try {
    // Get rider_id for the authenticated user
    const { data: riderData, error: riderError } = await supabase
      .from("riders")
      .select("id, users(id)") // this declares the join
      .eq("users.auth_id", authId) // this filters by the joined field
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

    // Destructure required fields from request body
    const {
      distance_m,
      duration_s,
      vehicle_type,
      service_variant,
      fare,
      driver_earning,
      app_commission,
      fare_breakdown,
      planned_pickup_coords,
      planned_pickup_address,
      planned_dropoff_coords,
      planned_dropoff_address,
    } = req.body;

    // Validate coords are arrays with [lon, lat]
    if (
      !Array.isArray(planned_pickup_coords) ||
      planned_pickup_coords.length !== 2 ||
      !Array.isArray(planned_dropoff_coords) ||
      planned_dropoff_coords.length !== 2
    ) {
      res.status(400).json({
        status: 400,
        error: "Bad Request",
        message:
          "planned_pickup_coords and planned_dropoff_coords must be arrays of [longitude, latitude].",
        code: "INVALID_COORDS",
      });
      return;
    }

    const [pickupLon, pickupLat] = planned_pickup_coords;
    const [dropoffLon, dropoffLat] = planned_dropoff_coords;

    // Call Postgres RPC function to insert ride with geometry points
    const { data, error } = await supabase.rpc("ride_insert", {
      p_rider_id: riderData.id,
      p_distance_m: distance_m,
      p_duration_s: duration_s,
      p_vehicle_type: vehicle_type,
      p_service_variant: service_variant,
      p_fare: fare,
      p_driver_earning: driver_earning,
      p_app_commission: app_commission,
      p_fare_breakdown: fare_breakdown,
      p_pickup_lon: pickupLon,
      p_pickup_lat: pickupLat,
      p_pickup_address: planned_pickup_address,
      p_dropoff_lon: dropoffLon,
      p_dropoff_lat: dropoffLat,
      p_dropoff_address: planned_dropoff_address,
    });

    if (error) {
      res.status(400).json({
        status: 400,
        error: "Create Failed",
        message: error.message,
        code: "RIDE_CREATE_FAILED",
      });
      return;
    }

    res.status(201).json({
      status: 201,
      message: "Ride created successfully.",
      code: "RIDE_CREATED",
      data,
    });
  } catch (err) {
    console.error("Unexpected error in createRide:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while creating the ride.",
      code: "INTERNAL_ERROR",
    });
  }
};
