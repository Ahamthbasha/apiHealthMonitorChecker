// src/server.ts
import "./config/env";
import express from "express";
import { createServer } from 'http';
import connectDB from "./config/db";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import userRouter from "./routes/userRouter";
import { errorHandler } from "./middlewares/errorMiddleware";
import { 
  startMonitoringEngine, 
  initializeWebSocket,
  getWebSocketService
} from "./dependencyInjector/userDI/userDI";

const app = express();
const port: number = Number(process.env.PORT) || 3000;

// Create HTTP server
const server = createServer(app);

const allowedOrigins: string[] = [
  process.env.CORS_ORIGIN || "http://localhost:5173",
].filter((url): url is string => Boolean(url));

const corsOptions: CorsOptions = {
  credentials: true,
  origin: allowedOrigins,
  methods: "GET,POST,PUT,PATCH,DELETE,HEAD",
};

// HTTP request logging
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// Middleware
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", userRouter);

// Health check endpoint for WebSocket
app.get('/api/health/ws', (_req, res) => {
  const wsService = getWebSocketService();
  res.json({
    success: true,
    websocket: wsService ? 'running' : 'not initialized',
    connections: wsService?.getConnectedUsersCount() || 0
  });
});

// 404 handler
app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global error handler
app.use(errorHandler);

// Process-level error handling
process.on("unhandledRejection", (reason: unknown) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  console.error("❌ Uncaught Exception:", error.message);
  process.exit(1);
});

// Start server
const start = async (): Promise<void> => {
  try {
    await connectDB();
    console.log("✅ Database connected successfully");
    
    // Start monitoring engine
    startMonitoringEngine();
    
    // Initialize WebSocket service through DI
    initializeWebSocket(server);
    
    server.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
      console.log(`🔌 WebSocket available at ws://localhost:${port}`);
      console.log(`🌍 Frontend URLs: ${allowedOrigins.join(", ")}`);
      console.log(`📝 Logging mode: ${process.env.NODE_ENV || "development"}`);
      console.log(`📧 Gmail configured: ${!!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)}`);
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Failed to start server:", errorMessage);
    process.exit(1);
  }
};

start();