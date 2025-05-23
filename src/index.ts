import dotenv from "dotenv";
dotenv.config();

import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import cors from "cors";
import { setupSwagger } from "./swagger";

import authRoutes from "./routes/authRoutes";
import fareRoutes from "./routes/fareRoutes";
import paymentRoutes from "./routes/paymentRoutes";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/fare", fareRoutes);
app.use("/payment", paymentRoutes);

// Swagger
setupSwagger(app);

// JSON Parse Error Handler
const jsonParseErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
): void => {
  if (
    err instanceof SyntaxError &&
    (err as any).status === 400 &&
    "body" in err
  ) {
    console.error("Invalid JSON error:", err.message);
    res.status(400).json({ error: "Invalid JSON format" });
    return;
  }
  next(err);
};

app.use(jsonParseErrorHandler);

// Catch-all Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("\n"); // add a blank line before
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Swagger docs available at http://localhost:${PORT}/docs`);
  console.log("\n"); // add a blank line after
});
