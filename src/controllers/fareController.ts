import { FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

interface Coordinates extends Array<number> {
  0: number; // longitude
  1: number; // latitude
}

interface MapboxRoute {
  duration: number; // seconds
  distance: number; // meters
}

interface MapboxResponse {
  routes: MapboxRoute[];
  waypoints: any[];
  code: string;
  uuid: string;
}

// Fare calculation function
function calculateFare(distanceMeters: number, durationSeconds: number) {
  const distanceKm = distanceMeters / 1000;
  const durationMin = durationSeconds / 60;

  const carBaseFare = 5000;
  const carPerKm = 3000;
  const carPerMin = 500;
  const carFare = carBaseFare + carPerKm * distanceKm + carPerMin * durationMin;

  const motorBaseFare = 3000;
  const motorPerKm = 2000;
  const motorPerMin = 300;
  const motorFare =
    motorBaseFare + motorPerKm * distanceKm + motorPerMin * durationMin;

  return {
    car: Math.round(carFare),
    motorcycle: Math.round(motorFare),
  };
}

// Fastify-style handler
export const calcaulateFare = async (
  request: FastifyRequest<{
    Body: {
      pickpoint: Coordinates;
      dropoff: Coordinates;
    };
  }>,
  reply: FastifyReply
): Promise<void> => {
  try {
    const { pickpoint, dropoff } = request.body;

    if (!pickpoint || !dropoff) {
      reply.status(400).send({ error: "pickpoint and dropoff are required" });
      return;
    }

    if (
      !Array.isArray(pickpoint) ||
      !Array.isArray(dropoff) ||
      pickpoint.length !== 2 ||
      dropoff.length !== 2 ||
      !pickpoint.every((coord) => typeof coord === "number" && !isNaN(coord)) ||
      !dropoff.every((coord) => typeof coord === "number" && !isNaN(coord))
    ) {
      reply.status(400).send({
        error:
          "pickpoint and dropoff must be arrays of two valid numbers [lng, lat]",
      });
      return;
    }

    const coordinates = `${pickpoint[0]},${pickpoint[1]};${dropoff[0]},${dropoff[1]}`;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${encodeURIComponent(
      coordinates
    )}?alternatives=false&annotations=distance,duration&geometries=geojson&language=en&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;

    const response = await axios.get<MapboxResponse>(url, {
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      reply.status(response.status).send({
        error: "Failed to get route from Mapbox",
        details: response.data,
      });
      return;
    }

    const routing = response.data;

    if (routing.code !== "Ok") {
      reply.status(500).send({ error: "Mapbox did not return a valid route." });
      return;
    }

    const route = routing.routes[0];
    const { distance, duration } = route;

    const fare = calculateFare(distance, duration);

    reply.send({
      fare,
      routing,
    });
  } catch (error: any) {
    console.error("Internal error:", error?.response?.data || error.message);
    reply.status(500).send({
      error: "Internal server error",
      details: error?.response?.data || error.message,
    });
  }
};
