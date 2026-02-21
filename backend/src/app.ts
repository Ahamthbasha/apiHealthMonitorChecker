
import "./config/env";
import express from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import userRouter from "./routes/userRouter";
import { errorHandler } from "./middlewares/errorMiddleware";

const app = express();

const allowedOrigins: string[] = [
  process.env.CORS_ORIGIN || "http://localhost:5173",
].filter((url): url is string => Boolean(url));

const corsOptions: CorsOptions = {
  credentials: true,
  origin: allowedOrigins,
  methods: "GET,POST,PUT,PATCH,DELETE,HEAD",
};

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", userRouter);

app.get('/api/health/ws', (_req, res) => {
 
  res.json({
    success: true,
    websocket: 'pending',
    connections: 0
  });
});

app.use("/api", (_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.use(errorHandler);

export default app;