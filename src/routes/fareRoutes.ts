// routes/fareRoutes.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { calcaulateFare } from "../controllers/fareController";

export default async function fareRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/calculate",
    {
      schema: {
        tags: ["Fare"],
        summary: "Calculate fare for a ride",
        body: {
          type: "object",
          required: ["pickpoint", "dropoff"],
          properties: {
            pickpoint: {
              type: "array",
              items: { type: "number" },
              example: [106.844877, -6.473127],
              minItems: 2,
              maxItems: 2,
            },
            dropoff: {
              type: "array",
              items: { type: "number" },
              example: [106.841782, -6.484847],
              minItems: 2,
              maxItems: 2,
            },
          },
        },

        response: {
          200: {
            type: "object",
            properties: {
              fare: {
                type: "object",
                properties: {
                  car: { type: "number" },
                  motorcycle: { type: "number" },
                },
              },
              routing: { type: "object" },
            },
          },
          400: { description: "Bad request" },
          500: { description: "Server error" },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    calcaulateFare
  );
}
