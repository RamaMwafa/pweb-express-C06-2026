import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { sendSuccess } from "../utils/response.ts";

function getCount(count: unknown, key: string): number {
  if (typeof count === "object" && count !== null) {
    const value = (count as Record<string, unknown>)[key];
    if (typeof value === "number") {
      return value;
    }
  }

  return 0;
}

export async function getStatistics(
  _req: Request,
  res: Response,
): Promise<Response> {
  const [totalPlayers, totalHeroesOwned, diamondAggregate, ownedByHero, heroesByRole] =
    await prisma.$transaction([
      prisma.player.count(),
      prisma.playerHero.count(),
      prisma.player.aggregate({
        _sum: {
          diamond: true,
        },
      }),
      prisma.playerHero.groupBy({
        by: ["heroId"],
        _count: {
          playerId: true,
        },
        orderBy: {
          _count: {
            playerId: "desc",
          },
        },
        take: 1,
      }),
      prisma.hero.groupBy({
        by: ["role"],
        _count: {
          id: true,
        },
        orderBy: {
          role: "asc",
        },
      }),
    ]);

  const mostOwned = ownedByHero[0];
  const mostOwnedHero = mostOwned
    ? {
        heroId: mostOwned.heroId,
      ownerCount: getCount(mostOwned._count, "playerId"),
        hero: await prisma.hero.findUnique({
          where: { id: mostOwned.heroId },
        }),
      }
    : null;

  return sendSuccess(res, {
    message: "Berhasil mengambil statistik",
    data: {
      totalPlayers,
      totalHeroesOwned,
      totalDiamond: diamondAggregate._sum.diamond ?? 0,
      mostOwnedHero,
      heroesPerRole: heroesByRole.map((item) => ({
        role: item.role,
        count: getCount(item._count, "id"),
      })),
    },
  });
}
