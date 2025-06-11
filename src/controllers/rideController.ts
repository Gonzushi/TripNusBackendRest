import { Request, Response } from "express";
import supabase from "../supabaseClient";
import { redis, publisher } from "../index";
import { sendPushNotification } from "../services/notificationService";

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
    "platform_fee",
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

    // Check if there is no active ride
    const { count: rideCount, error: rideError } = await supabase
      .from("rides")
      .select("id", { count: "exact" })
      .eq("rider_id", riderData.id)
      .filter("status", "not.in", "(completed,cancelled)");

    // Then, throw an error if an active ride already exists
    if (rideCount && rideCount > 0) {
      res.status(400).json({
        status: 400,
        error: "Active Ride Exists",
        message: "Rider currently has an active ride.",
        code: "ACTIVE_RIDE_EXISTS",
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
      platform_fee,
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

    // Check for nearby drivers using Redis
    type GeoSearchResult = [string, string, [string, string]];
    const closestDrivers = await redis.geosearch(
      "drivers:locations",
      "FROMLONLAT",
      pickupLon,
      pickupLat,
      "BYRADIUS",
      10,
      "km",
      "WITHDIST",
      "WITHCOORD",
      "COUNT",
      10,
      "ASC"
    );

    if (closestDrivers.length === 0) {
      res.status(400).json({
        status: 400,
        error: "No Drivers Available",
        message: "No drivers found within 10km of pickup location.",
        code: "NO_NEARBY_DRIVERS",
      });
      return;
    }

    const [dropoffLon, dropoffLat] = planned_dropoff_coords;

    // Call Postgres RPC function to insert ride with geometry points
    const closestDriver = closestDrivers[0] as GeoSearchResult;
    const { data, error } = await supabase.rpc("ride_insert", {
      p_rider_id: riderData.id,
      p_driver_id: closestDriver[0],
      p_status: "requesting_driver",
      p_distance_m: distance_m,
      p_duration_s: duration_s,
      p_vehicle_type: vehicle_type,
      p_service_variant: service_variant,
      p_fare: fare,
      p_platform_fee: platform_fee,
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

    // Send notification to the closest driver
    const { data: driverData } = await supabase
      .from("drivers")
      .select("push_token")
      .eq("id", closestDriver[0])
      .single();

    // Data for message
    const messageData = {
      type: "NEW_RIDE_REQUEST",
      rideId: data.id,
      distance_to_pickup_km: parseFloat(closestDriver[1]),
      distance_m,
      duration_s,
      fare,
      platform_fee,
      driver_earning,
      app_commission,
      fare_breakdown,
      pickup: {
        coords: planned_pickup_coords,
        address: planned_pickup_address,
      },
      dropoff: {
        coords: planned_dropoff_coords,
        address: planned_dropoff_address,
      },
    };

    // Send push notification if FCM token exists
    if (driverData?.push_token) {
      try {
        await sendPushNotification(driverData.push_token, {
          title: "Ada penumpang baru nih!",
          body: `Jemput di ${planned_pickup_address}`,
          data: messageData,
        });
      } catch (error) {
        console.error("Failed to send push notification:", error);
        // Continue execution even if push notification fails
      }
    }

    // Also send through WebSocket for real-time updates when app is in foreground
    await publisher.publish(
      `driver:${closestDriver[0]}`,
      JSON.stringify(messageData)
    );

    res.status(201).json({
      status: 201,
      message: "Ride created successfully and driver notified.",
      code: "RIDE_CREATED",
      data: data[0],
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

export const updateRide = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;
  const { rideId } = req.body;

  const updateFields = [
    "driver_id",
    "status",
    "ended_at",
    "actual_pickup_coords",
    "actual_dropoff_coords",
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
    // Check ride exists and is not completed/cancelled
    const { data: rideData, error: rideError } = await supabase
      .from("rides")
      .select("id")
      .eq("id", rideId)
      .filter("status", "not.in", "(completed,cancelled)")
      .single();

    if (rideError || !rideData) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message:
          rideError?.message ??
          "Ride not found or it has been completed/cancelled.",
        code: "RIDE_NOT_FOUND",
      });
      return;
    }

    // Prepare parameters for RPC
    const updates: {
      p_ride_id: string;
      p_driver_id?: string | null;
      p_status?: string | null;
      p_ended_at?: string | null;
      p_actual_pickup_coords?: number[] | null;
      p_actual_dropoff_coords?: number[] | null;
    } = {
      p_ride_id: rideId,
      p_driver_id: null,
      p_status: null,
      p_ended_at: null,
      p_actual_pickup_coords: null,
      p_actual_dropoff_coords: null,
    };

    for (const field of updateFields) {
      if (req.body[field] !== undefined) {
        switch (field) {
          case "driver_id":
            updates.p_driver_id = req.body[field];
            break;
          case "status":
            updates.p_status = req.body[field];
            break;
          case "ended_at":
            updates.p_ended_at = req.body[field];
            break;
          case "actual_pickup_coords":
            // Validate as array of two numbers [lng, lat]
            if (
              Array.isArray(req.body[field]) &&
              req.body[field].length === 2 &&
              typeof req.body[field][0] === "number" &&
              typeof req.body[field][1] === "number"
            ) {
              updates.p_actual_pickup_coords = req.body[field];
            }
            break;
          case "actual_dropoff_coords":
            if (
              Array.isArray(req.body[field]) &&
              req.body[field].length === 2 &&
              typeof req.body[field][0] === "number" &&
              typeof req.body[field][1] === "number"
            ) {
              updates.p_actual_dropoff_coords = req.body[field];
            }
            break;
        }
      }
    }

    // Check if any fields to update
    const hasUpdates = Object.values(updates).some(
      (v) => v !== null && v !== undefined
    );
    if (!hasUpdates) {
      res.status(400).json({
        status: 400,
        error: "Bad Request",
        message: "No valid fields provided for update.",
        code: "NO_FIELDS_TO_UPDATE",
      });
      return;
    }

    // Call RPC to update with geometry
    const { data, error } = await supabase.rpc("ride_update", updates);

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
      message: "Ride is updated successfully",
      code: "RIDE_UPDATED",
      data,
    });
  } catch (err) {
    console.error("Unexpected error in updateRide:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while updating the ride.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const sendRideRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  type GeoSearchResult = [string, string, [string, string]];

  const closestDriver = await redis.geosearch(
    "drivers:locations",
    "FROMLONLAT",
    106.8,
    -6.2,
    "BYRADIUS",
    100,
    "km",
    "WITHDIST",
    "WITHCOORD",
    "COUNT",
    10,
    "ASC"
  );

  if (closestDriver.length > 0) {
    const data = closestDriver[0] as GeoSearchResult;
    publisher.publish(
      `driver:${data[0]}`,
      JSON.stringify("Halo, ada penumpang baru!")
    );
  }

  res.status(200).json({
    status: 200,
    message: "Message sent to closest driver.",
    code: "MESSAGE_SENT",
  });
  return;

  // // return
  // const authId = req.user?.sub;
  // const { rideId } = req.body;

  // const updateFields = [
  //   "driver_id",
  //   "status",
  //   "ended_at",
  //   "actual_pickup_coords",
  //   "actual_dropoff_coords",
  // ];

  // if (!authId) {
  //   res.status(401).json({
  //     status: 401,
  //     error: "Unauthorized",
  //     message: "User ID not found in request context.",
  //     code: "USER_NOT_FOUND",
  //   });
  //   return;
  // }

  // try {
  //   // Check ride exists and is not completed/cancelled
  //   const { data: rideData, error: rideError } = await supabase
  //     .from("rides")
  //     .select("id")
  //     .eq("id", rideId)
  //     .filter("status", "not.in", "(completed,cancelled)")
  //     .single();

  //   if (rideError || !rideData) {
  //     res.status(404).json({
  //       status: 404,
  //       error: "Not Found",
  //       message:
  //         rideError?.message ??
  //         "Ride not found or it has been completed/cancelled.",
  //       code: "RIDE_NOT_FOUND",
  //     });
  //     return;
  //   }

  //   // Prepare parameters for RPC
  //   const updates: {
  //     p_ride_id: string;
  //     p_driver_id?: string | null;
  //     p_status?: string | null;
  //     p_ended_at?: string | null;
  //     p_actual_pickup_coords?: number[] | null;
  //     p_actual_dropoff_coords?: number[] | null;
  //   } = {
  //     p_ride_id: rideId,
  //     p_driver_id: null,
  //     p_status: null,
  //     p_ended_at: null,
  //     p_actual_pickup_coords: null,
  //     p_actual_dropoff_coords: null,
  //   };

  //   for (const field of updateFields) {
  //     if (req.body[field] !== undefined) {
  //       switch (field) {
  //         case "driver_id":
  //           updates.p_driver_id = req.body[field];
  //           break;
  //         case "status":
  //           updates.p_status = req.body[field];
  //           break;
  //         case "ended_at":
  //           updates.p_ended_at = req.body[field];
  //           break;
  //         case "actual_pickup_coords":
  //           // Validate as array of two numbers [lng, lat]
  //           if (
  //             Array.isArray(req.body[field]) &&
  //             req.body[field].length === 2 &&
  //             typeof req.body[field][0] === "number" &&
  //             typeof req.body[field][1] === "number"
  //           ) {
  //             updates.p_actual_pickup_coords = req.body[field];
  //           }
  //           break;
  //         case "actual_dropoff_coords":
  //           if (
  //             Array.isArray(req.body[field]) &&
  //             req.body[field].length === 2 &&
  //             typeof req.body[field][0] === "number" &&
  //             typeof req.body[field][1] === "number"
  //           ) {
  //             updates.p_actual_dropoff_coords = req.body[field];
  //           }
  //           break;
  //       }
  //     }
  //   }

  //   // Check if any fields to update
  //   const hasUpdates = Object.values(updates).some(
  //     (v) => v !== null && v !== undefined
  //   );
  //   if (!hasUpdates) {
  //     res.status(400).json({
  //       status: 400,
  //       error: "Bad Request",
  //       message: "No valid fields provided for update.",
  //       code: "NO_FIELDS_TO_UPDATE",
  //     });
  //     return;
  //   }

  //   // Call RPC to update with geometry
  //   const { data, error } = await supabase.rpc("ride_update", updates);

  //   if (error) {
  //     res.status(400).json({
  //       status: 400,
  //       error: "Update Failed",
  //       message: error.message,
  //       code: "UPDATE_FAILED",
  //     });
  //     return;
  //   }

  //   res.status(200).json({
  //     status: 200,
  //     message: "Ride is updated successfully",
  //     code: "RIDE_UPDATED",
  //     data,
  //   });
  // } catch (err) {
  //   console.error("Unexpected error in updateRide:", err);
  //   res.status(500).json({
  //     status: 500,
  //     error: "Internal Server Error",
  //     message: "An unexpected error occurred while updating the ride.",
  //     code: "INTERNAL_ERROR",
  //   });
  // }
};

export const getRide = async (req: Request, res: Response): Promise<void> => {
  try {
    const { riderId } = req.body;

    if (!riderId) {
      res.status(400).json({
        status: 400,
        code: "RIDER_ID_NOT_FOUND",
        message: "Rider ID is required",
        error: "Rider ID is required",
      });
      return;
    }

    const { data: rideData, error: rideError } = await supabase
      .from("rides")
      .select("*")
      .eq("rider_id", riderId)
      .not("status", "in", '("completed","cancelled")');

    if (rideError) {
      res.status(500).json({
        status: 500,
        code: "FAILED_TO_FETCH_RIDE_DATA",
        message: "Failed to fetch ride data",
        error: "Failed to fetch ride data",
      });
      return;
    }

    if (rideData.length === 0) {
      res.status(404).json({
        status: 404,
        error: "No active ride found",
        code: "NO_ACTIVE_RIDE_FOUND",
        message: "No active ride found",
      });
      return;
    } else if ((rideData.length = 1)) {
      res.status(200).json({
        status: 200,
        code: "RIDE_DATA_FETCHED",
        message: "Ride data fetched successfully",
        data: rideData[0],
      });
      return;
    } else {
      res.status(404).json({
        status: 404,
        error: "There are multiple active rides",
        code: "MULTIPLE_ACTIVE_RIDES",
        message: "There are multiple active rides",
      });
      return;
    }
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

export const confirmRide = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ride_id, driver_id } = req.body;

  if (!ride_id || !driver_id) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Missing required fields: ride_id and driver_id.",
      code: "MISSING_FIELDS",
    });
    return;
  }

  try {
    // Fetch ride by ID
    const { data: rideData, error: rideError } = await supabase
      .from("rides")
      .select("id, rider_id, status")
      .eq("id", ride_id)
      .single();

    if (rideError || !rideData) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: rideError?.message ?? "Ride not found.",
        code: "RIDE_NOT_FOUND",
      });
      return;
    }

    if (rideData.status !== "requesting_driver") {
      res.status(409).json({
        status: 409,
        error: "Conflict",
        message: "Ride has already been taken.",
        code: "RIDE_ALREADY_TAKEN",
      });
      return;
    }

    // Update ride directly
    const { error: updateError } = await supabase
      .from("rides")
      .update({
        driver_id,
        status: "driver_accepted",
      })
      .eq("id", ride_id);

    if (updateError) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: updateError.message,
        code: "UPDATE_FAILED",
      });
      return;
    }

    // Notify rider
    const { data: riderData } = await supabase
      .from("riders")
      .select("push_token")
      .eq("id", rideData.rider_id)
      .single();

    const messageData = {
      type: "RIDE_CONFIRMED",
      rideId: ride_id,
      driverId: driver_id,
      status: "driver_accepted",
    };

    if (riderData?.push_token) {
      try {
        await sendPushNotification(riderData.push_token, {
          title: "Driver confirmed!",
          body: "A driver has accepted your ride request.",
          data: messageData,
        });
      } catch (err) {
        console.error("Push notification failed:", err);
      }
    }

    await publisher.publish(
      `rider:${rideData.rider_id}`,
      JSON.stringify(messageData)
    );

    res.status(200).json({
      status: 200,
      message: "Ride confirmed successfully",
      code: "RIDE_CONFIRMED",
    });
  } catch (err) {
    console.error("Unexpected error in confirmRide:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while confirming the ride.",
      code: "INTERNAL_ERROR",
    });
  }
};
