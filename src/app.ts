import express from "express";
import { errorHandler } from "./middlewares/errorHandler.ts";
import { requestLogger } from "./middlewares/logger.ts";
import { notFound } from "./middlewares/notFound.ts";
import { apiRouter } from "./routes/index.ts";
import { healthRouter } from "./routes/health.routes.ts";

export const app = express();

app.disable("x-powered-by");
app.use(requestLogger);
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api", apiRouter);

app.use(notFound);
app.use(errorHandler);
