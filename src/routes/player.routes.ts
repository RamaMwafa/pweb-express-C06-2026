import { Router } from "express";
import {
  createPlayer,
  deletePlayer,
  getPlayerById,
  updatePlayer,
} from "../controllers/player.controller.ts";

export const playerRouter = Router();

playerRouter.post("/", createPlayer);
playerRouter.get("/:player_id", getPlayerById);
playerRouter.patch("/:player_id", updatePlayer);
playerRouter.delete("/:player_id", deletePlayer);