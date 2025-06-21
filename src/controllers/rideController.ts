import { Request, Response } from "express";
import supabase from "../supabaseClient";
import { redis, publisher } from "../index";
import { sendPushNotification } from "../services/notificationService";
import { rideMatchQueue } from "../queues/rideMatchQueue";

const MAX_RADIUS_KM = 10;

export const createRide = async (
  req: Request,
  res: Response
): Promise<void> => {
  const authId = req.user?.sub;

  if (!authId) {
    res
      .status(401)
      .json({ status: 401, error: "Unauthorized", code: "USER_NOT_FOUND" });
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

  const missingFields = requiredFields.filter((f) => req.body[f] === undefined);

  if (missingFields.length > 0) {
    res.status(400).json({
      status: 400,
      error: "Missing Fields",
      message: missingFields.join(", "),
      code: "MISSING_FIELDS",
    });
    return;
  }

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

  const { count: rideCount } = await supabase
    .from("rides")
    .select("id", { count: "exact" })
    .eq("rider_id", riderData.id)
    .filter("status", "not.in", "(completed,cancelled)");

  if (rideCount && rideCount > 0) {
    res.status(400).json({
      status: 400,
      error: "Active Ride Exists",
      message: "Rider currently has an active ride.",
      code: "ACTIVE_RIDE_EXISTS",
    });
    return;
  }

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

  const closestDrivers = await redis.geosearch(
    `drivers:locations:${vehicle_type}`,
    "FROMLONLAT",
    pickupLon,
    pickupLat,
    "BYRADIUS",
    MAX_RADIUS_KM,
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

  const { data, error } = await supabase.rpc("ride_insert", {
    p_rider_id: riderData.id,
    p_driver_id: null,
    p_status: "searching",
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

  if (error || !data || !data[0]) {
    res.status(400).json({
      status: 400,
      error: "Create Failed",
      message: error?.message,
      code: "RIDE_CREATE_FAILED",
    });
    return;
  }

  const ride = data[0];

  // Add job to BullMQ queue
  await rideMatchQueue.add(
    `ride_match_${ride.id}`,
    {
      ride_id: ride.id,
      vehicle_type,
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
      attemptedDrivers: [],
    },
    {
      jobId: `ride_match_${ride.id}`,
      removeOnComplete: true,
      removeOnFail: true,
    }
  );

  res.status(201).json({
    status: 201,
    message: "Ride created. Matching driver...",
    code: "RIDE_CREATED",
    data: ride,
  });
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
      .select("id, rider_id, status, driver_id, match_attempt, vehicle_type")
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
        message: "Ride is no longer in 'requesting_driver' state.",
        code: "INVALID_STATUS",
      });
      return;
    }

    if (rideData.driver_id !== driver_id) {
      res.status(403).json({
        status: 403,
        error: "Forbidden",
        message: "This ride is not assigned to the given driver.",
        code: "UNAUTHORIZED_DRIVER",
      });
      return;
    }

    // Update ride status to accepted
    const { error: updateError } = await supabase
      .from("rides")
      .update({
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

    // 🔄 Update driver status to en_route_to_pickup and reset counters
    const { error: driverUpdateError } = await supabase
      .from("drivers")
      .update({
        availability_status: "en_route_to_pickup",
        decline_count: 0,
        missed_requests: 0,
      })
      .eq("id", driver_id);

    if (driverUpdateError) {
      console.error(
        `⚠️ Failed to update driver ${driver_id} status to en_route_to_pickup:`,
        driverUpdateError.message
      );
    }

    // 🗑️ Remove job from queue to stop retries
    const matchAttempt = rideData.match_attempt;
    const { retry_count } = matchAttempt;

    try {
      const jobKey = `ride_match_${ride_id}_retry_${retry_count}`;
      const job = await rideMatchQueue.getJob(jobKey);
      if (job) {
        await job.remove();
      }
    } catch (err) {
      console.warn(`⚠️ Failed to remove job for ride ${ride_id}:`, err);
    }

    await redis.del(`driver:is_reviewing:${driver_id}`);
    await redis.zrem(`drivers:locations:${rideData.vehicle_type}`, driver_id);

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
          title: "Driver dalam perjalanan!",
          body: "Driver telah menerima permintaan Anda dan sedang menuju lokasi penjemputan.",
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

export const rejectRide = async (
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
    // Fetch the ride
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, driver_id, match_attempt")
      .eq("id", ride_id)
      .single();

    if (rideError || !ride) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: rideError?.message ?? "Ride not found.",
        code: "RIDE_NOT_FOUND",
      });
      return;
    }

    if (ride.driver_id !== driver_id) {
      res.status(403).json({
        status: 403,
        error: "Forbidden",
        message: "This driver is not assigned to the ride.",
        code: "UNAUTHORIZED_DRIVER",
      });
      return;
    }

    // Remove driver from ride
    const { error: updateError } = await supabase
      .from("rides")
      .update({ driver_id: null })
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

    // Increment decline count via RPC
    const { error: rpcError } = await supabase.rpc("increment_decline_count", {
      driver_id,
    });

    if (rpcError) {
      console.warn("⚠️ Failed to increment decline count:", rpcError.message);
    }

    // Remove old job from queue
    const matchAttempt = ride.match_attempt;
    const { retry_count } = matchAttempt;

    const jobKey = `ride_match_${ride_id}_retry_${retry_count}`;
    const existingJob = await rideMatchQueue.getJob(jobKey);
    if (existingJob) {
      await existingJob.remove();
    }

    await redis.del(`driver:is_reviewing:${driver_id}`);

    // Reconstruct the job from match_attempt
    if (!matchAttempt || !matchAttempt.message_data) {
      res.status(500).json({
        status: 500,
        error: "Internal Error",
        message: "Match attempt data is missing or malformed.",
        code: "MATCH_DATA_MISSING",
      });
      return;
    }

    const { message_data, attemptedDrivers } = matchAttempt;
    delete message_data.request_expired_at;
    delete message_data.distance_to_pickup_km;
    delete message_data.type;

    // Push new job to the queue
    await rideMatchQueue.add(
      jobKey,
      { ...message_data, attemptedDrivers },
      {
        jobId: `ride_match_${ride.id}`,
        removeOnComplete: true,
        removeOnFail: true,
      }
    );

    res.status(200).json({
      status: 200,
      message: "Ride rejected and re-queued for matching.",
      code: "RIDE_REJECTED",
    });
  } catch (err) {
    console.error("Unexpected error in rejectRide:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while rejecting the ride.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const cancelRideByRiderBeforePickup = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ride_id, rider_id } = req.body;

  if (!ride_id || !rider_id) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Missing required fields: ride_id and rider_id.",
      code: "MISSING_FIELDS",
    });
    return;
  }

  try {
    const { data: rideData, error: rideError } = await supabase
      .from("rides")
      .select("id, rider_id, status, match_attempt, driver_id")
      .eq("id", ride_id)
      .single();

    if (rideError || !rideData) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: "Ride not found.",
        code: "RIDE_NOT_FOUND",
      });
      return;
    }

    if (rideData.rider_id !== rider_id) {
      res.status(403).json({
        status: 403,
        error: "Forbidden",
        message: "This ride does not belong to the given rider.",
        code: "UNAUTHORIZED_RIDER",
      });
      return;
    }

    const allowedStatuses = [
      "requesting_driver",
      "searching",
      "driver_accepted",
    ];
    if (!allowedStatuses.includes(rideData.status)) {
      res.status(409).json({
        status: 409,
        error: "Conflict",
        message: `Ride cannot be cancelled in its current status: ${rideData.status}.`,
        code: "INVALID_CANCEL_STATUS",
      });
      return;
    }

    // 🚫 Update ride status to cancelled
    const { error: updateError } = await supabase
      .from("rides")
      .update({
        status: "cancelled",
        status_reason: "Ride cancelled by rider before pickup.",
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

    // 🗑️ Remove matching job if any
    const matchAttempt = rideData.match_attempt;
    const { retry_count } = matchAttempt;

    try {
      const jobKey = `ride_match_${ride_id}_retry_${retry_count}`;
      const job = await rideMatchQueue.getJob(jobKey);
      if (job) {
        await job.remove();
      }
    } catch (err) {
      console.warn(`⚠️ Failed to remove job for ride ${ride_id}:`, err);
    }

    // 🔔 Notify driver if assigned
    if (rideData.driver_id) {
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("push_token")
        .eq("id", rideData.driver_id)
        .single();

      if (driverData?.push_token) {
        // Send push notification
        try {
          await sendPushNotification(driverData.push_token, {
            title: "Perjalanan dibatalkan",
            body: "Penumpang telah membatalkan perjalanan.",
          });
        } catch (err) {
          console.warn(
            `⚠️ Failed to send push to driver ${rideData.driver_id}:`,
            err
          );
        }
      }

      // Send WebSocket event (if you have a publisher setup)
      try {
        await publisher.publish(
          `driver:${rideData.driver_id}`,
          JSON.stringify({
            type: "RIDE_CANCELLED",
            message: "Ride cancelled by rider before pickup.",
          })
        );
      } catch (err) {
        console.warn(
          `⚠️ Failed to publish WS event to driver ${rideData.driver_id}:`,
          err
        );
      }
    }

    res.status(200).json({
      status: 200,
      message: "Ride cancelled successfully.",
      code: "RIDE_CANCELLED",
    });
  } catch (err) {
    console.error("Unexpected error in cancelRideByRider:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while cancelling the ride.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const cancelByDriver = async (
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
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, rider_id, status, driver_id, match_attempt, vehicle_type")
      .eq("id", ride_id)
      .single();

    if (rideError || !ride) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: rideError?.message ?? "Ride not found.",
        code: "RIDE_NOT_FOUND",
      });
      return;
    }

    if (
      ride.status !== "driver_accepted" &&
      ride.status !== "driver_arrived" &&
      ride.status !== "in_progress"
    ) {
      res.status(409).json({
        status: 409,
        error: "Conflict",
        message: `Ride is in '${ride.status}' status.`,
        code: "INVALID_STATUS",
      });
      return;
    }

    if (ride.driver_id !== driver_id) {
      res.status(403).json({
        status: 403,
        error: "Forbidden",
        message: "This ride is not assigned to the given driver.",
        code: "UNAUTHORIZED_DRIVER",
      });
      return;
    }

    await supabase.rpc("increment_decline_count", { driver_id });

    // Remove review lock
    await redis.del(`driver:is_reviewing:${driver_id}`);

    const matchAttempt = ride.match_attempt;
    const { message_data, attemptedDrivers, retry_count } = matchAttempt;

    delete message_data.request_expired_at;
    delete message_data.distance_to_pickup_km;
    delete message_data.type;

    // Remove old retry job
    const existingJob = await rideMatchQueue.getJob(
      `ride_match_${ride_id}_retry_${retry_count}`
    );
    if (existingJob) await existingJob.remove();

    // Geo search
    const GEO_KEY = `drivers:locations:${ride.vehicle_type}`;
    const MAX_RADIUS_KM = 10;

    const geoResults = (await redis.geosearch(
      GEO_KEY,
      "FROMLONLAT",
      message_data.pickup.coords[0],
      message_data.pickup.coords[1],
      "BYRADIUS",
      MAX_RADIUS_KM,
      "km",
      "ASC",
      "WITHDIST"
    )) as [string, string][];

    let selectedDriverId: string | null = null;

    for (const [foundDriverId] of geoResults) {
      if (!attemptedDrivers.includes(foundDriverId)) {
        selectedDriverId = foundDriverId;
        break;
      }
    }

    // Fetch rider push token for notification
    const { data: riderData } = await supabase
      .from("riders")
      .select("push_token")
      .eq("id", ride.rider_id)
      .single();

    let messageData: any = {};
    let pushTitle = "";
    let pushBody = "";

    if (selectedDriverId) {
      // Reassign ride
      await supabase
        .from("rides")
        .update({
          status: "searching",
          driver_id: null,
        })
        .eq("id", ride_id);

      await rideMatchQueue.add(
        `ride_match_${ride_id}`,
        {
          ...message_data,
          attemptedDrivers,
        },
        {
          jobId: `ride_match_${ride_id}`,
          removeOnComplete: true,
          removeOnFail: true,
        }
      );

      messageData = {
        type: "RIDE_CANCELLED_BY_DRIVER",
        rideId: ride_id,
        driverId: driver_id,
        status: "requesting_driver",
      };

      pushTitle = "Driver membatalkan perjalanan";
      pushBody = "Kami sedang mencari driver baru untuk Anda.";
    } else {
      // Cancel ride
      await supabase
        .from("rides")
        .update({
          status: "cancelled",
          driver_id: null,
        })
        .eq("id", ride_id);

      messageData = {
        type: "RIDE_CANCELLED_BY_DRIVER_AND_NO_DRIVER_AVAILABLE",
        rideId: ride_id,
        driverId: driver_id,
        status: "cancelled",
      };

      pushTitle = "Driver membatalkan perjalanan";
      pushBody =
        "Driver membatalkan, dan kami tidak dapat menemukan driver lain.";
    }

    // Set driver to available
    await supabase
      .from("drivers")
      .update({
        availability_status: "available",
      })
      .eq("id", driver_id);

    // Send push notification
    if (riderData?.push_token) {
      try {
        await sendPushNotification(riderData.push_token, {
          title: pushTitle,
          body: pushBody,
          data: messageData,
        });
      } catch (err) {
        console.error("Push notification failed:", err);
      }
    }

    // Send WebSocket message
    await publisher.publish(
      `rider:${ride.rider_id}`,
      JSON.stringify(messageData)
    );

    res.status(200).json({
      status: 200,
      message: selectedDriverId
        ? "Ride cancelled by driver and reassigned"
        : "Ride cancelled by driver and no available driver found",
      code: "RIDE_DRIVER_CANCELLED",
    });
  } catch (err) {
    console.error("Unexpected error in cancelByDriver:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while cancelling the ride.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const getRideRider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authId = req.user?.sub;

    if (!authId) {
      res.status(400).json({
        status: 400,
        code: "AUTH_ID_NOT_FOUND",
        message: "Auth ID is required",
        error: "Auth ID is missing from the request context",
      });
      return;
    }

    const { data: rideData, error: rideError } = await supabase
      .from("rides")
      .select(
        `
        *,
        drivers (
          id,
          first_name,
          last_name,
          rating,
          vehicle_year,
          vehicle_type,
          vehicle_brand,
          vehicle_model,
          vehicle_color,
          vehicle_plate_number,
          profile_picture_url,
          completed_rides,
          users (
            phone
          )
        ),
        riders (
          auth_id
        )
      `
      )
      .eq("riders.auth_id", authId)
      .not("status", "in", '("completed","cancelled")');

    if (rideError) {
      res.status(500).json({
        status: 500,
        code: "FAILED_TO_FETCH_RIDE_DATA",
        message: "Failed to fetch ride data",
        error: rideError.message,
      });
      return;
    }

    if (!rideData || rideData.length === 0) {
      res.status(404).json({
        status: 404,
        error: "No active ride found",
        code: "NO_ACTIVE_RIDE_FOUND",
        message: "No active ride found for this rider",
      });
      return;
    }

    if (rideData.length > 1) {
      res.status(409).json({
        status: 409,
        error: "Multiple active rides found",
        code: "MULTIPLE_ACTIVE_RIDES",
        message: "There are multiple active rides for this rider",
      });
      return;
    }

    const ride = rideData[0];
    const driverId = ride.drivers?.id;

    let driverLocation: {
      latitude: number;
      longitude: number;
      heading_deg: number;
      speed_kph: number;
    } | null = null;

    if (driverId) {
      const redisKey = `driver:${driverId}`;
      const redisData = await redis.hgetall(redisKey);

      if (
        redisData &&
        redisData.lat &&
        redisData.lng &&
        redisData.heading_deg &&
        redisData.speed_kph &&
        !isNaN(parseFloat(redisData.lat)) &&
        !isNaN(parseFloat(redisData.lng)) &&
        !isNaN(parseFloat(redisData.heading_deg)) &&
        !isNaN(parseFloat(redisData.speed_kph))
      ) {
        driverLocation = {
          latitude: parseFloat(redisData.lat),
          longitude: parseFloat(redisData.lng),
          heading_deg: parseFloat(redisData.heading_deg),
          speed_kph: parseFloat(redisData.speed_kph),
        };
      }
    }

    res.status(200).json({
      status: 200,
      code: "RIDE_DATA_FETCHED",
      message: "Ride data fetched successfully",
      data: {
        ...ride,
        driverLocation,
      },
    });
  } catch (error) {
    console.error("Unexpected error in getRideRider:", error);
    res.status(500).json({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred while fetching the ride data.",
      error: (error as Error).message,
    });
  }
};

export const getRideDriver = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authId = req.user?.sub;

    if (!authId) {
      res.status(401).json({
        status: 401,
        code: "AUTH_ID_NOT_FOUND",
        message: "Auth ID is required",
        error: "Auth ID is missing from the request context",
      });
      return;
    }

    const { data: rideData, error: rideError } = await supabase
      .from("rides")
      .select(
        `
        *,
        riders (
          id,
          first_name,
          last_name,
          rating,
          completed_rides,
          profile_picture_url,
          users (
            phone
          )
        ),
        drivers (
          auth_id
        )
      `
      )
      .eq("drivers.auth_id", authId)
      .not("status", "in", '("completed","cancelled")');

    if (rideError) {
      res.status(500).json({
        status: 500,
        code: "FAILED_TO_FETCH_RIDE_DATA",
        message: "Failed to fetch ride data",
        error: rideError.message,
      });
      return;
    }

    if (!rideData || rideData.length === 0) {
      res.status(404).json({
        status: 404,
        error: "No active ride found",
        code: "NO_ACTIVE_RIDE_FOUND",
        message: "No active ride found for the given driver",
      });
      return;
    } else if (rideData.length === 1) {
      res.status(200).json({
        status: 200,
        code: "RIDE_DATA_FETCHED",
        message: "Ride data fetched successfully",
        data: rideData[0],
      });
      return;
    } else {
      res.status(409).json({
        status: 409,
        error: "There are multiple active rides",
        code: "MULTIPLE_ACTIVE_RIDES",
        message: "There are multiple active rides for this driver",
      });
      return;
    }
  } catch (error) {
    console.error("Unexpected error in getRideDriver:", error);
    res.status(500).json({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred while fetching the ride data.",
      error: "Internal server error",
    });
  }
};

export const driverArrivedAtPickup = async (
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
    // Get ride
    const { data: rideData, error: rideError } = await supabase
      .from("rides")
      .select("id, driver_id, rider_id, status")
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

    // Ensure driver is assigned to this ride
    if (rideData.driver_id !== driver_id) {
      res.status(403).json({
        status: 403,
        error: "Forbidden",
        message: "This driver is not assigned to the ride.",
        code: "UNAUTHORIZED_DRIVER",
      });
      return;
    }

    // Only allow transition if ride is in driver_accepted status
    if (rideData.status !== "driver_accepted") {
      res.status(409).json({
        status: 409,
        error: "Conflict",
        message: `Ride must be in 'driver_accepted' state to mark as arrived.`,
        code: "INVALID_RIDE_STATUS",
      });
      return;
    }

    // Update ride status
    const { error: rideUpdateError } = await supabase
      .from("rides")
      .update({
        status: "driver_arrived",
      })
      .eq("id", ride_id);

    if (rideUpdateError) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: rideUpdateError.message,
        code: "UPDATE_FAILED",
      });
      return;
    }

    // Update driver availability_status
    const { error: driverUpdateError } = await supabase
      .from("drivers")
      .update({
        availability_status: "waiting_to_pickup",
      })
      .eq("id", driver_id);

    if (driverUpdateError) {
      console.error(
        `⚠️ Failed to update driver ${driver_id} status to waiting_to_pickup:`,
        driverUpdateError.message
      );
    }

    // Notify rider
    const { data: riderData } = await supabase
      .from("riders")
      .select("push_token")
      .eq("id", rideData.rider_id)
      .single();

    const messageData = {
      type: "RIDE_ARRIVED",
      rideId: ride_id,
      driverId: driver_id,
      status: "driver_arrived",
    };

    if (riderData?.push_token) {
      try {
        await sendPushNotification(riderData.push_token, {
          title: "Driver telah tiba",
          body: "Driver Anda telah tiba di lokasi penjemputan. Silakan bersiap!",
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
      message: "Driver marked as arrived successfully.",
      code: "DRIVER_ARRIVED",
    });
  } catch (err) {
    console.error("Unexpected error in driverArrivedAtPickup:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while confirming arrival.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const confirmPickupByDriver = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ride_id, driver_id, actual_pickup_coords } = req.body;

  if (!ride_id || !driver_id || !actual_pickup_coords) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message:
        "Missing required fields: ride_id, driver_id, actual_pickup_coords.",
      code: "MISSING_FIELDS",
    });
    return;
  }

  const { latitude, longitude } = actual_pickup_coords;
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !isFinite(latitude) ||
    !isFinite(longitude)
  ) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Invalid actual_pickup_coords format.",
      code: "INVALID_COORDS",
    });
    return;
  }

  try {
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, status, driver_id, rider_id")
      .eq("id", ride_id)
      .single();

    if (rideError || !ride) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: rideError?.message ?? "Ride not found.",
        code: "RIDE_NOT_FOUND",
      });
      return;
    }

    if (ride.driver_id !== driver_id) {
      res.status(403).json({
        status: 403,
        error: "Forbidden",
        message: "This driver is not assigned to the ride.",
        code: "UNAUTHORIZED_DRIVER",
      });
      return;
    }

    if (ride.status !== "driver_arrived") {
      res.status(409).json({
        status: 409,
        error: "Conflict",
        message: "Ride must be in 'driver_arrived' state to confirm pickup.",
        code: "INVALID_RIDE_STATUS",
      });
      return;
    }

    // Use RPC to update ride
    const { error: rpcError } = await supabase.rpc("ride_update", {
      p_ride_id: ride_id,
      p_driver_id: null,
      p_status: "in_progress",
      p_ended_at: null,
      p_actual_pickup_coords: [longitude, latitude], // NOTE: lng, lat order for PostGIS POINT
      p_actual_dropoff_coords: null,
    });

    if (rpcError) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: rpcError.message,
        code: "RIDE_UPDATE_FAILED",
      });
      return;
    }

    // Update driver availability
    const { error: driverUpdateError } = await supabase
      .from("drivers")
      .update({ availability_status: "en_route_to_drop_off" })
      .eq("id", driver_id);

    if (driverUpdateError) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: driverUpdateError.message,
        code: "DRIVER_UPDATE_FAILED",
      });
      return;
    }

    // Fetch push token
    const { data: riderData } = await supabase
      .from("riders")
      .select("push_token")
      .eq("id", ride.rider_id)
      .single();

    const messageData = {
      type: "RIDE_IN_PROGRESS",
      rideId: ride_id,
      driverId: driver_id,
      status: "in_progress",
    };

    if (riderData?.push_token) {
      try {
        await sendPushNotification(riderData.push_token, {
          title: "Perjalanan dimulai",
          body: "Driver telah menjemput Anda. Selamat menikmati perjalanan!",
          data: messageData,
        });
      } catch (err) {
        console.error("Push notification failed:", err);
      }
    }

    await publisher.publish(
      `rider:${ride.rider_id}`,
      JSON.stringify(messageData)
    );

    res.status(200).json({
      status: 200,
      code: "RIDE_IN_PROGRESS",
      message: "Pickup confirmed, ride is now in progress.",
    });
  } catch (err) {
    console.error("Unexpected error in confirmPickupByDriver:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while confirming the pickup.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const confirmDropoffByDriver = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("🔵 confirmDropoffByDriver", req.body);
  const { ride_id, driver_id, actual_dropoff_coords } = req.body;

  if (
    !ride_id ||
    !driver_id ||
    !actual_dropoff_coords?.latitude ||
    !actual_dropoff_coords?.longitude
  ) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message:
        "Missing required fields: ride_id, driver_id, actual_dropoff_coords.",
      code: "MISSING_FIELDS",
    });
    return;
  }

  try {
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, status, driver_id, rider_id")
      .eq("id", ride_id)
      .single();

    if (rideError || !ride) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: rideError?.message ?? "Ride not found.",
        code: "RIDE_NOT_FOUND",
      });
      return;
    }

    if (ride.driver_id !== driver_id) {
      res.status(403).json({
        status: 403,
        error: "Forbidden",
        message: "This driver is not assigned to the ride.",
        code: "UNAUTHORIZED_DRIVER",
      });
      return;
    }

    if (ride.status !== "in_progress") {
      res.status(409).json({
        status: 409,
        error: "Conflict",
        message: "Ride must be in 'in_progress' state to confirm dropoff.",
        code: "INVALID_RIDE_STATUS",
      });
      return;
    }

    // Use RPC to update ride
    const { error: rpcError } = await supabase.rpc("ride_update", {
      p_ride_id: ride_id,
      p_driver_id: driver_id,
      p_ended_at: new Date().toISOString(),
      p_status: "payment_in_progress",
      p_actual_pickup_coords: null,
      p_actual_dropoff_coords: [
        actual_dropoff_coords.longitude,
        actual_dropoff_coords.latitude,
      ],
    });

    if (rpcError) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: rpcError.message,
        code: "RIDE_UPDATE_FAILED",
      });
      return;
    }

    // Update driver status
    const { error: updateDriverError } = await supabase
      .from("drivers")
      .update({ availability_status: "waiting_for_payment" })
      .eq("id", driver_id);

    if (updateDriverError) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message: updateDriverError.message,
        code: "DRIVER_UPDATE_FAILED",
      });
      return;
    }

    const { data: riderData } = await supabase
      .from("riders")
      .select("push_token")
      .eq("id", ride.rider_id)
      .single();

    const messageData = {
      type: "RIDE_PAYMENT_PENDING",
      rideId: ride_id,
      driverId: driver_id,
      status: "payment_in_progress",
    };

    if (riderData?.push_token) {
      try {
        await sendPushNotification(riderData.push_token, {
          title: "Perjalanan selesai",
          body: "Anda telah tiba di tujuan. Silakan lakukan pembayaran.",
          data: messageData,
        });
      } catch (err) {
        console.error("Push notification failed:", err);
      }
    }

    await publisher.publish(
      `rider:${ride.rider_id}`,
      JSON.stringify(messageData)
    );

    res.status(200).json({
      status: 200,
      code: "RIDE_PAYMENT_PENDING",
      message: "Dropoff confirmed, waiting for rider payment.",
    });
  } catch (err) {
    console.error("Unexpected error in confirmDropoffByDriver:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while confirming dropoff.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const confirmPaymentByDriver = async (
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
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, status, driver_id, rider_id")
      .eq("id", ride_id)
      .single();

    if (rideError || !ride) {
      res.status(404).json({
        status: 404,
        error: "Not Found",
        message: rideError?.message ?? "Ride not found.",
        code: "RIDE_NOT_FOUND",
      });
      return;
    }

    if (ride.driver_id !== driver_id) {
      res.status(403).json({
        status: 403,
        error: "Forbidden",
        message: "This driver is not assigned to the ride.",
        code: "UNAUTHORIZED_DRIVER",
      });
      return;
    }

    if (ride.status !== "payment_in_progress") {
      res.status(409).json({
        status: 409,
        error: "Conflict",
        message:
          "Ride must be in 'payment_in_progress' state to confirm payment.",
        code: "INVALID_RIDE_STATUS",
      });
      return;
    }

    const { error: updateRideError } = await supabase
      .from("rides")
      .update({ status: "completed" })
      .eq("id", ride_id);

    const { error: updateDriverError } = await supabase
      .from("drivers")
      .update({ availability_status: "available" })
      .eq("id", driver_id);

    if (updateRideError || updateDriverError) {
      res.status(400).json({
        status: 400,
        error: "Update Failed",
        message:
          updateRideError?.message ??
          updateDriverError?.message ??
          "Failed to update ride or driver status.",
        code: "UPDATE_FAILED",
      });
      return;
    }

    await publisher.publish(
      `rider:${ride.rider_id}`,
      JSON.stringify({
        type: "RIDE_COMPLETED",
        rideId: ride_id,
        driverId: driver_id,
        status: "completed",
      })
    );

    res.status(200).json({
      status: 200,
      code: "RIDE_COMPLETED",
      message: "Payment confirmed. Ride is now completed.",
    });
  } catch (err) {
    console.error("Unexpected error in confirmPaymentByDriver:", err);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while confirming payment.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const getRideHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authId = req.user?.sub;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const status = (req.query.status as string)?.toLowerCase() || "all";

    if (!authId) {
      res.status(400).json({
        status: 400,
        code: "AUTH_ID_NOT_FOUND",
        message: "Auth ID is required",
        error: "Auth ID is missing from the request context",
      });
      return;
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Step 1: Get rider_id from auth_id
    const { data: riderResult, error: riderError } = await supabase
      .from("riders")
      .select("id")
      .eq("auth_id", authId)
      .single();

    if (riderError || !riderResult) {
      res.status(404).json({
        status: 404,
        code: "RIDER_NOT_FOUND",
        message: "Rider not found",
        error: riderError?.message || "Rider not found for this user",
      });
      return;
    }

    const riderId = riderResult.id;

    // Step 2: Get rides (filtering status inline for consistent pagination)
    const rideQuery = supabase
      .from("rides")
      .select(
        `
        id,
        service_variant,
        distance_m,
        duration_s,
        status,
        status_reason,
        planned_pickup_address,
        planned_dropoff_address,
        fare,
        vehicle_type,
        started_at,
        ended_at
      `
      )
      .eq("rider_id", riderId)
      .gte("started_at", oneYearAgo.toISOString())
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === "completed" || status === "cancelled") {
      rideQuery.eq("status", status); // inline filter
    }

    const { data: rides, error: rideError } = await rideQuery;

    if (rideError) {
      res.status(500).json({
        status: 500,
        code: "FAILED_TO_FETCH_RIDES",
        message: "Failed to fetch ride history",
        error: rideError.message,
      });
      return;
    }

    const rideIds = rides.map((r) => r.id);

    // Step 3: Get matching reviews
    const { data: reviews, error: reviewError } = await supabase
      .from("reviews")
      .select("ride_id, rating, comment")
      .in("ride_id", rideIds)
      .eq("reviewer_id", riderId)
      .eq("reviewee_type", "driver");

    if (reviewError) {
      res.status(500).json({
        status: 500,
        code: "FAILED_TO_FETCH_REVIEWS",
        message: "Failed to fetch reviews",
        error: reviewError.message,
      });
      return;
    }

    // Step 4: Merge reviews with rides
    const enrichedRides = rides.map((ride) => {
      const review = reviews.find((r) => r.ride_id === ride.id);
      return {
        ...ride,
        review: review
          ? {
              rating: review.rating,
              comment: review.comment,
            }
          : null,
      };
    });

    res.status(200).json({
      status: 200,
      code: "RIDE_HISTORY_FETCHED",
      message: "Ride history fetched successfully",
      data: {
        rides: enrichedRides,
        pagination: {
          page,
          limit,
          hasMore: enrichedRides.length === limit,
        },
      },
    });
  } catch (error) {
    console.error("Unexpected error in getRideHistory:", error);
    res.status(500).json({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred while fetching the ride history.",
      error: (error as Error).message,
    });
  }
};
