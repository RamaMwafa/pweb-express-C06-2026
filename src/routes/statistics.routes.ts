import { Router } from "express";
import { getStatistics } from "../controllers/statistics.controller.ts";

export const statisticsRouter = Router();

statisticsRouter.get("/", getStatistics);
