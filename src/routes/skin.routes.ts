import { Router } from "express";
import {
  getSkins,
  getSkinById,
} from "../controllers/skin.controller.ts";

export const skinRouter = Router();

skinRouter.get("/", getSkins);
skinRouter.get("/:skin_id", getSkinById);
