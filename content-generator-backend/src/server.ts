import express, { Application, Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import apiRoutes from "./routes/api";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api", apiRoutes);

// Base Route
app.get("/", (_req: Request, res: Response) => {
  res.send("Content Generator Backend (TypeScript) is Running 🚀");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
