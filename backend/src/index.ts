import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import apiRoutes from "./routes/api";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

// Look for frontend dist in multiple candidate paths
const candidateDistPaths = [
  path.resolve(__dirname, "../../../frontend/dist"),
  path.resolve(__dirname, "../../frontend/dist"),
  path.resolve(process.cwd(), "../frontend/dist"),
  path.resolve(process.cwd(), "frontend/dist"),
];

let frontendDist: string | null = null;
for (const p of candidateDistPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, "index.html"))) {
    frontendDist = p;
    break;
  }
}

if (frontendDist) {
  console.log(`[CROWDLESS] Serving frontend bundle from ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(frontendDist!, "index.html"));
  });
} else {
  app.get("/", (req: Request, res: Response) => {
    res.json({
      message: "Welcome to CROWDLESS Backend API",
      tagline: "Move smarter. Travel calmer.",
      health: "/api/health",
    });
  });
}

// Centralized error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred",
  });
});

app.listen(PORT, () => {
  console.log(`[CROWDLESS] Application running at http://localhost:${PORT}`);
  console.log(`[CROWDLESS] API Health check: http://localhost:${PORT}/api/health`);
});
