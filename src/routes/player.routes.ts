import { Router } from "express";
import {
  createPlayer,
  deletePlayer,
  getPlayerById,
  updatePlayer,
} from "../controllers/player.controller.ts";
import {
  buyHero,
  recordMatch,
  topUp,
} from "../controllers/shop.controller.ts";

export const playerRouter = Router();

playerRouter.post("/", createPlayer);
playerRouter.get("/:player_id", getPlayerById);
playerRouter.patch("/:player_id", updatePlayer);
playerRouter.delete("/:player_id", deletePlayer);
playerRouter.post("/:player_id/topup", topUp);
playerRouter.post("/:player_id/matches", recordMatch);
playerRouter.post("/:player_id/heroes", buyHero);