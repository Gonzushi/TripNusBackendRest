import dotenv from "dotenv";
dotenv.config();

import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";

import fastifyConfig from "./configs/fastifyConfig";
import { swaggerConfig, swaggerUiConfig } from "./configs/swaggerConfig";

import { authenticateUser } from "./middlewares/authHandler";
import { errorHandler } from "./middlewares/errorHandler";

import authRoutes from "./routes/authRoutes";
import fareRoutes from "./routes/fareRoutes";
import healthRoutes from "./routes/healthRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import userRoutes from "./routes/userRoutes";

// Create Fastify instance
const app = Fastify(fastifyConfig);

async function startServer() {
  // Register CORS
  await app.register(cors);

  // Register Swagger
  await app.register(fastifySwagger, swaggerConfig);
  await app.register(fastifySwaggerUI, swaggerUiConfig);

  // Custom Error Handler
  app.setErrorHandler(errorHandler);

  // Register routes
  await app.register(healthRoutes);
  await app.register(
    async (instance) => {
      instance.addHook("preHandler", authenticateUser);
      await app.register(fareRoutes, { prefix: "/fare" });
      await app.register(authRoutes, { prefix: "/auth" });
      //   await app.register(paymentRoutes, { prefix: "/payment" });
      //   await app.register(userRoutes, { prefix: "/user" });
    },
    { prefix: "/" }
  );

  // Start Server
  const PORT = Number(process.env.PORT) || 3000;
  try {
    await app.listen({ port: PORT });
    console.log(`
🚀 Server running at http://localhost:${PORT}
📚 Swagger docs available at http://localhost:${PORT}/docs
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer();
