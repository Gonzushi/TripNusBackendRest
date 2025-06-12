import { Request, Response } from "express";

// Fare calculation
function calculateFareLogic(distanceM: number, durationSec: number) {
  const distanceKm = distanceM / 1000;
  const durationMin = durationSec / 60;

  const platformFee = 2000;

  // --- Car fare calculation ---
  const carBaseFare = 5000;
  const carPerKm = 3000;
  const carPerMin = 500;
  const carDistanceFare = carPerKm * distanceKm;
  const carDurationFare = carPerMin * durationMin;
  const carRawTotal = carBaseFare + carDistanceFare + carDurationFare;
  const carFare = Math.ceil(carRawTotal / 1000) * 1000;
  const carRoundingAdjustment = carFare - carRawTotal;
  const carTotalFare = carFare + platformFee;
  const carAppCommission = carFare * 0.175;
  const carDriverEarning = carFare - carAppCommission;

  // --- Motorcycle fare calculation ---
  const motorBaseFare = 3000;
  const motorPerKm = 2000;
  const motorPerMin = 300;
  const motorDistanceFare = motorPerKm * distanceKm;
  const motorDurationFare = motorPerMin * durationMin;
  const motorRawTotal = motorBaseFare + motorDistanceFare + motorDurationFare;
  const motorFare = Math.ceil(motorRawTotal / 1000) * 1000;
  const motorRoundingAdjustment = motorFare - motorRawTotal;
  const motorTotalFare = motorFare + platformFee;
  const motorAppCommission = motorFare * 0.175;
  const motorDriverEarning = motorFare - motorAppCommission;

  return {
    car: {
      service_variant: "standard",
      fare_breakdown: {
        base_fare: Math.round(carBaseFare),
        distance_fare: Math.round(carDistanceFare),
        duration_fare: Math.round(carDurationFare),
        rounding_adjustment: Math.round(carRoundingAdjustment),
        platform_fee: Math.round(platformFee),
      },
      total_fare: Math.round(carTotalFare),
      platform_fee: Math.round(platformFee),
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
        platform_fee: Math.round(platformFee),
      },
      total_fare: Math.round(motorTotalFare),
      platform_fee: Math.round(platformFee),
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
    const { distanceM, durationSec } = req.body;

    const fare = calculateFareLogic(distanceM, durationSec);

    res.status(200).json({
      status: 200,
      code: "FARE_CALCULATED",
      message: "Fare calculated successfully.",
      data: fare,
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
