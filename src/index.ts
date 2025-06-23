import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import redisConfig from "./config/redisConfig";
import Redis from "ioredis";
import { setupSwagger } from "./swagger";

import { authenticateUser } from "./middlewares/authHandler";
import {
  jsonParseErrorHandler,
  generalErrorHandler,
} from "./middlewares/errorHandler";

import authRoutes from "./routes/authRoutes";
import driverRoutes from "./routes/driverRoutes";
import fareRoutes from "./routes/fareRoutes";
import healthRoutes from "./routes/healthRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import riderRoutes from "./routes/riderRoutes";
import rideRoutes from "./routes/rideRoutes";
import utilsRoutes from "./routes/utilsRoutes";
import xenditRoutes from "./routes/xenditRoutes";
import transactionRoutes from "./routes/transactionRoutes";

const app = express();
export const redis = new Redis(redisConfig);
export const publisher = new Redis(redisConfig);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/", healthRoutes);
app.use("/auth", authRoutes);
app.use("/driver", authenticateUser, driverRoutes);
app.use("/fare", authenticateUser, fareRoutes);
app.use("/payment", authenticateUser, paymentRoutes);
app.use("/ride", authenticateUser, rideRoutes);
app.use("/rider", authenticateUser, riderRoutes);
app.use("/utils", utilsRoutes);
app.use("/xendit", xenditRoutes);
app.use("/transactions", authenticateUser, transactionRoutes);

// Swagger
setupSwagger(app);

// Error Handlers
app.use(jsonParseErrorHandler);
app.use(generalErrorHandler);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
📚 Swagger docs available at http://localhost:${PORT}/docs
  `);
});
