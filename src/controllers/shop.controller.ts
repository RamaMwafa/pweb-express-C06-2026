import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { HttpError } from "../errors/HttpError.ts";
import { Currency } from "../generated/prisma/client.ts";
import { sendSuccess } from "../utils/response.ts";

const CURRENCY_VALUES = Object.values(Currency) as Currency[];

function getPlayerId(value: string | string[]): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const playerId = Number(rawValue);

  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw new HttpError(400, "ID player tidak valid");
  }

  return playerId;
}

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
}

export async function topUp(
  req: Request,
  res: Response,
): Promise<Response> {
  const { amount } = req.body;

  if (!isPositiveInteger(amount)) {
    throw new HttpError(400, "amount harus berupa bilangan bulat lebih dari 0");
  }

  const playerId = getPlayerId(req.params.player_id);
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const updatedPlayer = await prisma.player.update({
    where: { id: playerId },
    data: { diamond: { increment: amount } },
  });

  return sendSuccess(res, {
    message: "Top up Diamond berhasil",
    data: {
      playerId: updatedPlayer.id,
      diamond: updatedPlayer.diamond,
    },
  });
}

export async function recordMatch(
  req: Request,
  res: Response,
): Promise<Response> {
  const { result } = req.body;

  if (result !== "WIN" && result !== "LOSE") {
    throw new HttpError(400, "result harus WIN atau LOSE");
  }

  const playerId = getPlayerId(req.params.player_id);
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const bpEarned = result === "WIN" ? 300 : 100;
  const updatedPlayer = await prisma.player.update({
    where: { id: playerId },
    data: { bp: { increment: bpEarned } },
  });

  return sendSuccess(res, {
    message: "Hasil match berhasil dicatat",
    data: {
      result,
      bpEarned,
      bp: updatedPlayer.bp,
    },
  });
}

export async function buyHero(
  req: Request,
  res: Response,
): Promise<Response> {
  const { heroId, currency } = req.body;

  if (
    !isPositiveInteger(heroId) ||
    typeof currency !== "string" ||
    !CURRENCY_VALUES.includes(currency as Currency)
  ) {
    throw new HttpError(
      400,
      "heroId harus berupa bilangan bulat positif dan currency harus BP atau DIAMOND",
    );
  }

  const playerId = getPlayerId(req.params.player_id);
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    throw new HttpError(404, "Player tidak ditemukan");
  }

  const hero = await prisma.hero.findUnique({
    where: { id: heroId },
  });

  if (!hero) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  const selectedCurrency = currency as Currency;
  const price =
    selectedCurrency === Currency.BP ? hero.priceBP : hero.priceDiamond;

  if (price === null) {
    throw new HttpError(400, `Hero tidak dapat dibeli dengan ${currency}`);
  }

  const ownedHero = await prisma.playerHero.findUnique({
    where: {
      playerId_heroId: {
        playerId,
        heroId,
      },
    },
  });

  if (ownedHero) {
    throw new HttpError(409, "Player sudah memiliki hero tersebut");
  }

  const balance =
    selectedCurrency === Currency.BP ? player.bp : player.diamond;

  if (balance < price) {
    throw new HttpError(400, "Saldo player tidak mencukupi");
  }

  const [updatedPlayer] = await prisma.$transaction([
    prisma.player.update({
      where: { id: playerId },
      data:
        selectedCurrency === Currency.BP
          ? { bp: { decrement: price } }
          : { diamond: { decrement: price } },
    }),
    prisma.playerHero.create({
      data: {
        playerId,
        heroId,
        currency: selectedCurrency,
        pricePaid: price,
      },
    }),
  ]);

  return sendSuccess(res, {
    statusCode: 201,
    message: "Hero berhasil dibeli",
    data: {
      heroId: hero.id,
      heroName: hero.name,
      currency: selectedCurrency,
      pricePaid: price,
      bp: updatedPlayer.bp,
      diamond: updatedPlayer.diamond,
    },
  });
}
