import { Request, Response } from "express";
import axios from "axios";

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

interface MapboxRoute {
  duration: number;
  distance: number;
}

interface MapboxResponse {
  routes: MapboxRoute[];
  code: string;
}

// Fare calculation
function calculateFareLogic(distanceMeters: number, durationSeconds: number) {
  const distanceKm = distanceMeters / 1000;
  const durationMin = durationSeconds / 60;

  // --- Car fare calculation ---
  const carBaseFare = 5000;
  const carPerKm = 3000;
  const carPerMin = 500;
  const carDistanceFare = carPerKm * distanceKm;
  const carDurationFare = carPerMin * durationMin;
  const carRawTotal = carBaseFare + carDistanceFare + carDurationFare;
  const carRoundedTotal = Math.ceil(carRawTotal / 1000) * 1000;
  const carRoundingAdjustment = carRoundedTotal - carRawTotal;
  const carAppCommission = carRoundedTotal * 0.175;
  const carDriverEarning = carRoundedTotal - carAppCommission;

  // --- Motorcycle fare calculation ---
  const motorBaseFare = 3000;
  const motorPerKm = 2000;
  const motorPerMin = 300;
  const motorDistanceFare = motorPerKm * distanceKm;
  const motorDurationFare = motorPerMin * durationMin;
  const motorRawTotal = motorBaseFare + motorDistanceFare + motorDurationFare;
  const motorRoundedTotal = Math.ceil(motorRawTotal / 1000) * 1000;
  const motorRoundingAdjustment = motorRoundedTotal - motorRawTotal;
  const motorAppCommission = motorRoundedTotal * 0.175;
  const motorDriverEarning = motorRoundedTotal - motorAppCommission;

  return {
    car: {
      service_variant: "standard",
      fare_breakdown: {
        base_fare: Math.round(carBaseFare),
        distance_fare: Math.round(carDistanceFare),
        duration_fare: Math.round(carDurationFare),
        rounding_adjustment: Math.round(carRoundingAdjustment),
      },
      total_fare: Math.round(carRoundedTotal),
      app_commission: Math.round(carAppCommission),
      driver_earning: Math.round(carDriverEarning),
    },
    motorcycle: {
      service_variant: "standard",
      fare_breakdown: {
        base_fare: Math.round(motorBaseFare),
        distance_fare: Math.round(motorDistanceFare),
        duration_fare: Math.round(motorDurationFare),
        rounding_adjustment: Math.round(motorRoundingAdjustment),
      },
      total_fare: Math.round(motorRoundedTotal),
      app_commission: Math.round(motorAppCommission),
      driver_earning: Math.round(motorDriverEarning),
    },
  };
}

export const calculateFare = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      plannedPickupCoords,
      plannedPickupAddress,
      plannedDropoffCoords,
      plannedDropoffAddress,
    } = req.body;

    // Validate coordinates
    if (
      !Array.isArray(plannedPickupCoords) ||
      !Array.isArray(plannedDropoffCoords) ||
      plannedPickupCoords.length !== 2 ||
      plannedDropoffCoords.length !== 2 ||
      !plannedPickupCoords.every((coord) => typeof coord === "number") ||
      !plannedDropoffCoords.every((coord) => typeof coord === "number")
    ) {
      res.status(400).json({
        status: 400,
        error: "Bad Request",
        message:
          "pickpoint and dropoff must be arrays of two valid numbers [lng, lat]",
        code: "INVALID_COORDINATES",
      });
      return;
    }

    const coordinates = `${plannedPickupCoords[0]},${plannedPickupCoords[1]};${plannedDropoffCoords[0]},${plannedDropoffCoords[1]}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?alternatives=false&annotations=distance,duration&geometries=geojson&language=en&overview=full&steps=false&access_token=${MAPBOX_TOKEN}`;

    const response = await axios.get<MapboxResponse>(url);

    if (response.status !== 200 || response.data.code !== "Ok") {
      res.status(500).json({
        status: 500,
        error: "Routing Error",
        message: "Failed to get a valid route from Mapbox.",
        code: "MAPBOX_ERROR",
        details: response.data,
      });
      return;
    }

    const { distance, duration } = response.data.routes[0];
    const fare = calculateFareLogic(distance, duration);

    res.status(200).json({
      status: 200,
      code: "FARE_CALCULATED",
      message: "Fare calculated successfully.",
      data: {
        planned_pickup_coords: plannedPickupCoords,
        planned_pickup_address: plannedPickupAddress,
        planned_dropoff_coords: plannedDropoffCoords,
        planned_dropoff_address: plannedDropoffAddress,
        distance_m: distance, // in meters
        duration_s: duration, // in seconds
        fare,
      },
    });
    return;
  } catch (error: any) {
    console.error("Internal error:", error?.response?.data || error.message);
    res.status(500).json({
      status: 500,
      error: "Internal Server Error",
      message: "An unexpected error occurred while calculating fare.",
      code: "INTERNAL_ERROR",
      details: error?.response?.data || error.message,
    });
    return;
  }
};
