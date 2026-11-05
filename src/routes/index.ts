import { Router } from "express";
import { skinRouter } from "./skin.routes.ts";
import { heroRouter } from "./hero.routes.ts";
import { playerRouter } from "./player.routes.ts";
import { statisticsRouter } from "./statistics.routes.ts";

export const apiRouter = Router();

apiRouter.use("/skins", skinRouter);
apiRouter.use("/heroes", heroRouter);
apiRouter.use("/players", playerRouter);
apiRouter.use("/statistics", statisticsRouter);
