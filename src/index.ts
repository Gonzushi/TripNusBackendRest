import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { setupSwagger } from "./swagger";

import authRoutes from "./routes/authRoutes";
import fareRoutes from "./routes/fareRoutes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.use("/auth", authRoutes);
app.use("/fare", fareRoutes);

setupSwagger(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
