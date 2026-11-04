import { Router } from "express";
import { sendSuccess } from "../utils/response.ts";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  return sendSuccess(res, {
    message: "Server MLBB Shop berjalan dengan baik",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});
