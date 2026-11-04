import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { HttpError } from "../errors/HttpError.ts";
import { Rarity } from "../generated/prisma/client.ts";
import type { Prisma } from "../generated/prisma/client.ts";
import {
  getQueryString,
  parsePositiveInteger,
} from "../utils/query.ts";
import { sendSuccess } from "../utils/response.ts";

const RARITY_VALUES = Object.values(Rarity) as Rarity[];

export async function getSkins(req: Request, res: Response): Promise<Response> {
  const page = parsePositiveInteger(req.query.page, 1);
  const limit = parsePositiveInteger(req.query.limit, 10, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.SkinWhereInput = {};

  const heroIdRaw = getQueryString(req.query.heroId);
  if (heroIdRaw !== undefined) {
    const heroId = Number(heroIdRaw);

    if (!Number.isInteger(heroId) || heroId <= 0) {
      throw new HttpError(400, "heroId harus berupa bilangan bulat positif");
    }

    where.heroId = heroId;
  }

  const rarityRaw = getQueryString(req.query.rarity);
  if (rarityRaw !== undefined) {
    const rarity = rarityRaw.toUpperCase() as Rarity;

    if (!RARITY_VALUES.includes(rarity)) {
      throw new HttpError(
        400,
        `rarity harus salah satu dari: ${RARITY_VALUES.join(", ")}`,
      );
    }

    where.rarity = rarity;
  }

  const [totalItems, skins] = await prisma.$transaction([
    prisma.skin.count({ where }),
    prisma.skin.findMany({
      where,
      include: {
        hero: true,
      },
      orderBy: {
        id: "asc",
      },
      skip,
      take: limit,
    }),
  ]);

  return sendSuccess(res, {
    message: "Berhasil mengambil data skin",
    data: skins,
    metadata: {
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
}

export async function getSkinById(
  req: Request,
  res: Response,
): Promise<Response> {
  const skinId = Number(req.params.skin_id);

  if (!Number.isInteger(skinId) || skinId <= 0) {
    throw new HttpError(400, "ID skin tidak valid");
  }

  const skin = await prisma.skin.findUnique({
    where: {
      id: skinId,
    },
    include: {
      hero: true,
    },
  });

  if (!skin) {
    throw new HttpError(404, "Skin tidak ditemukan");
  }

  return sendSuccess(res, {
    message: "Berhasil mengambil detail skin",
    data: skin,
  });
}
