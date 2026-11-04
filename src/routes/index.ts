import { Router } from "express";
import { skinRouter } from "./skin.routes.ts";

export const apiRouter = Router();

apiRouter.use("/skins", skinRouter);
