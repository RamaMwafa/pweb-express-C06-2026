import { Router } from "express";
import {
  createHero,
  getHeroById,
  getHeroes,
} from "../controllers/hero.controller.ts";

export const heroRouter = Router();

heroRouter.get("/", getHeroes);
heroRouter.get("/:hero_id", getHeroById);
heroRouter.post("/", createHero);