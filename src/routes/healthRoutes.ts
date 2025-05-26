import { FastifyInstance } from "fastify";
import { getHealthStatus } from "../controllers/healthController";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/", {
    schema: {
      summary: "Health Check",
      description:
        "Returns health status of the server and connected services.",
      tags: ["Health"],
      security: [],
      response: {
        200: {
          description: "Successful health check response",
          type: "object",
          properties: {
            status: { type: "string" },
            service: { type: "string" },
            version: { type: "string" },
            description: { type: "string" },
            uptimeSeconds: { type: "number" },
            timestamp: { type: "string", format: "date-time" },
            environment: { type: "string" },
            database: {
              type: "object",
              properties: {
                supabase: { type: "string" },
              },
            },
            services: {
              type: "object",
              properties: {
                redis: { type: "string" },
                paymentGateway: { type: "string" },
              },
            },
            deployment: {
              type: "object",
              properties: {
                gitCommit: { type: "string" },
                buildTime: { type: "string" },
                port: { type: "string" },
                timezone: { type: "string" },
              },
            },
            node: {
              type: "object",
              properties: {
                version: { type: "string" },
                memoryUsageMB: {
                  type: "object",
                  properties: {
                    rss: { type: "number" },
                    heapTotal: { type: "number" },
                    heapUsed: { type: "number" },
                  },
                },
                cpuUsageMicros: {
                  type: "object",
                  properties: {
                    user: { type: "number" },
                    system: { type: "number" },
                  },
                },
              },
            },
            system: {
              type: "object",
              properties: {
                hostname: { type: "string" },
                platform: { type: "string" },
                arch: { type: "string" },
                loadavg: {
                  type: "object",
                  properties: {
                    "1min": { type: "number" },
                    "5min": { type: "number" },
                    "15min": { type: "number" },
                  },
                },
                memoryMB: {
                  type: "object",
                  properties: {
                    free: { type: "number" },
                    total: { type: "number" },
                  },
                },
                cpus: { type: "number" },
                uptimeSeconds: { type: "number" },
              },
            },
            process: {
              type: "object",
              properties: {
                pid: { type: "number" },
                title: { type: "string" },
                nodeEnv: { type: "string", nullable: true },
              },
            },
            dependencies: {
              type: "object",
              additionalProperties: { type: "string" },
            },
            devDependencies: {
              type: "object",
              additionalProperties: { type: "string" },
              nullable: true,
            },
          },
          example: {
            status: "ok",
            service: "tripnus-backend-rest",
            version: "1.0.0",
            description:
              "Backend service for TripNus, a motorcycle ride-hailing platform providing real-time booking, fare estimation, and secure payment APIs.",
            uptimeSeconds: 18.12,
            timestamp: "2025-05-26T08:55:02.048Z",
            environment: "development",
            database: {
              supabase: "reachable",
            },
            services: {
              redis: "reachable",
              paymentGateway: "not implemented",
            },
            deployment: {
              gitCommit: "unknown",
              buildTime: "unknown",
              port: "3000",
              timezone: "Asia/Jakarta",
            },
            node: {
              version: "v22.15.1",
              memoryUsageMB: {
                rss: 111.5,
                heapTotal: 53,
                heapUsed: 23,
              },
              cpuUsageMicros: {
                user: 414131,
                system: 82961,
              },
            },
            system: {
              hostname: "Hendrys-MacBook-Pro.local",
              platform: "darwin",
              arch: "arm64",
              loadavg: {
                "1min": 2.15,
                "5min": 2.29,
                "15min": 2.2,
              },
              memoryMB: {
                free: 116.6,
                total: 16384,
              },
              cpus: 8,
              uptimeSeconds: 2080716,
            },
            process: {
              pid: 7651,
              title:
                "/Users/hendrywidyanto/.nvm/versions/node/v22.15.1/bin/node",
            },
            dependencies: {
              "@fastify/cors": "^11.0.1",
              "@fastify/swagger": "^9.5.1",
              "@fastify/swagger-ui": "^5.2.2",
              "@supabase/supabase-js": "^2.49.6",
              axios: "^1.9.0",
              cors: "^2.8.5",
              dotenv: "^16.5.0",
              express: "^5.1.0",
              fastify: "^5.3.3",
              ioredis: "^5.6.1",
              jsonwebtoken: "^9.0.2",
              "midtrans-client": "^1.4.2",
              multer: "^2.0.0",
              pm2: "^6.0.6",
              "pm2-runtime": "^5.4.1",
              "swagger-jsdoc": "^6.2.8",
              "swagger-ui-express": "^5.0.1",
              uuid: "^11.1.0",
            },
            devDependencies: {
              "@types/cors": "^2.8.18",
              "@types/express": "^5.0.2",
              "@types/jsonwebtoken": "^9.0.9",
              "@types/multer": "^1.4.12",
              "@types/node": "^22.15.19",
              "@types/swagger-jsdoc": "^6.0.4",
              "@types/swagger-ui-express": "^4.1.8",
              "ts-node-dev": "^2.0.0",
              typescript: "^5.8.3",
            },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      const health = await getHealthStatus();
      const prettyJson = JSON.stringify(health, null, 2);
      reply.type("application/json").send(prettyJson);
    },
  });
}
