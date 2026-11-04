import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { HttpError } from "../errors/HttpError.ts";
import { sendSuccess } from "../utils/response.ts";

// POST /api/players
export async function createPlayer(
  req: Request,
  res: Response,
): Promise<Response> {
  const { nickname } = req.body;

  // nickname kosong -> 400
  if (
    typeof nickname !== "string" ||
    nickname.trim() === ""
  ) {
    throw new HttpError(400, "Nickname wajib diisi");
  }

  // nickname duplicate -> 409
  const existingPlayer = await prisma.player.findUnique({
    where: {
      nickname: nickname.trim(),
    },
  });

  if (existingPlayer) {
    throw new HttpError(409, "Nickname sudah digunakan");
  }

  const player = await prisma.player.create({
    data: {
      nickname: nickname.trim(),
    },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Player berhasil dibuat",
    data: player,
  });
}

// GET /api/players/:player_id
export async function getPlayerById(
  req: Request,
  res: Response,
): Promise<Response> {
  const playerId = Number(req.params.player_id);

  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const player = await prisma.player.findUnique({
    where: {
      id: playerId,
    },
    include: {
      heroes: {
        include: {
          hero: true,
        },
      },
    },
  });

  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const result = {
    id: player.id,
    nickname: player.nickname,
    bp: player.bp,
    diamond: player.diamond,
    createdAt: player.createdAt,

    heroes: player.heroes.map((item) => ({
      heroId: item.hero.id,
      name: item.hero.name,
      currency: item.currency,
      pricePaid: item.pricePaid,
    })),
  };

  return sendSuccess(res, {
    message: "Berhasil mengambil data player",
    data: result,
  });
}

// PATCH /api/players/:player_id
export async function updatePlayer(
  req: Request,
  res: Response,
): Promise<Response> {
  const playerId = Number(req.params.player_id);
  const { nickname } = req.body;

  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw new HttpError(400, "ID player tidak valid");
  }

  // 1. Player tidak ada -> 404
  const player = await prisma.player.findUnique({
    where: {
      id: playerId,
    },
  });

  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  // 2. Nickname kosong -> 400
  if (
    typeof nickname !== "string" ||
    nickname.trim() === ""
  ) {
    throw new HttpError(400, "Nickname wajib diisi");
  }

  // 3. Nickname dipakai player lain -> 409
  const duplicateNickname = await prisma.player.findFirst({
    where: {
      nickname: nickname.trim(),
      id: {
        not: playerId,
      },
    },
  });

  if (duplicateNickname) {
    throw new HttpError(409, "Nickname sudah digunakan");
  }

  const updatedPlayer = await prisma.player.update({
    where: {
      id: playerId,
    },
    data: {
      nickname: nickname.trim(),
    },
  });

  return sendSuccess(res, {
    message: "Player berhasil diperbarui",
    data: updatedPlayer,
  });
}

// DELETE /api/players/:player_id
export async function deletePlayer(
  req: Request,
  res: Response,
): Promise<Response> {
  const playerId = Number(req.params.player_id);

  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw new HttpError(400, "ID player tidak valid");
  }

  const player = await prisma.player.findUnique({
    where: {
      id: playerId,
    },
  });

  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  await prisma.player.delete({
    where: {
      id: playerId,
    },
  });

  return sendSuccess(res, {
    message: "Player berhasil dihapus",
    data: {
      id: playerId,
    },
  });
}