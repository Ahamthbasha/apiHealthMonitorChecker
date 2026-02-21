import "./config/env";
import { createServer } from 'http';
import connectDB from "./config/db";
import app from "./app"; // 
import { 
  startMonitoringEngine, 
  initializeWebSocket,
  getWebSocketService
} from "./dependencyInjector/userDI/userDI";

const port: number = Number(process.env.PORT) || 3000;

const server = createServer(app);

// Process-level error handling
process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Promise Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error.message);
  process.exit(1);
});

// Start server
const start = async (): Promise<void> => {
  try {
    await connectDB();
    console.log("Database connected successfully");
    
    // Start monitoring engine
    startMonitoringEngine();
    
    // Initialize WebSocket service through DI
    initializeWebSocket(server);
    
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`WebSocket available at ws://localhost:${port}`);
      const allowedOrigins = [
        process.env.CORS_ORIGIN || "http://localhost:5173",
      ];
      console.log(`Frontend URLs: ${allowedOrigins.join(", ")}`);
      console.log(`Logging mode: ${process.env.NODE_ENV || "development"}`);
      console.log(`Gmail configured: ${!!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)}`);
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to start server:", errorMessage);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

export { server, start };