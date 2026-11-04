import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/db/prisma.ts";
import {
  Currency,
  Lane,
  Rarity,
  Role,
} from "../src/generated/prisma/client.ts";

interface HeroSeed {
  name: string;
  role: Role;
  lane: Lane;
  releaseYear: number;
  priceBP: number | null;
  priceDiamond: number | null;
}

interface SkinSeed {
  name: string;
  heroId: number;
  rarity: Rarity;
  priceDiamond: number | null;
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(currentDir, "..", "data");

function readJson<T>(fileName: string): T {
  return JSON.parse(
    readFileSync(join(dataDir, fileName), "utf8"),
  ) as T;
}

async function main(): Promise<void> {
  const heroes = readJson<HeroSeed[]>("heroes.json");
  const skins = readJson<SkinSeed[]>("skins.json");

  console.log("Mengosongkan tabel...");
  await prisma.$executeRawUnsafe(
    'TRUNCATE "PlayerHero", "Player", "Skin", "Hero" RESTART IDENTITY CASCADE',
  );

  console.log(`Memasukkan ${heroes.length} hero...`);
  await prisma.hero.createMany({
    data: heroes,
  });

  console.log(`Memasukkan ${skins.length} skin...`);
  await prisma.skin.createMany({
    data: skins,
  });

  console.log("Memasukkan 3 player...");
  const arekIts = await prisma.player.create({
    data: {
      nickname: "ArekITS",
      bp: 1500,
      diamond: 75,
    },
  });

  const sangPushRank = await prisma.player.create({
    data: {
      nickname: "SangPushRank",
      bp: 13000,
      diamond: 2892,
    },
  });

  await prisma.player.create({
    data: {
      nickname: "MageSurabaya",
      bp: 10000,
      diamond: 0,
    },
  });

  console.log("Memasukkan data PlayerHero...");
  await prisma.playerHero.createMany({
    data: [
      {
        playerId: arekIts.id,
        heroId: 18,
        currency: Currency.BP,
        pricePaid: 2000,
      },
      {
        playerId: arekIts.id,
        heroId: 1,
        currency: Currency.BP,
        pricePaid: 10800,
      },
      {
        playerId: sangPushRank.id,
        heroId: 84,
        currency: Currency.DIAMOND,
        pricePaid: 599,
      },
      {
        playerId: sangPushRank.id,
        heroId: 56,
        currency: Currency.BP,
        pricePaid: 32000,
      },
    ],
  });

  const [heroCount, skinCount, playerCount, playerHeroCount] =
    await prisma.$transaction([
      prisma.hero.count(),
      prisma.skin.count(),
      prisma.player.count(),
      prisma.playerHero.count(),
    ]);

  console.log("Seed selesai:");
  console.log(`- Hero       : ${heroCount}`);
  console.log(`- Skin       : ${skinCount}`);
  console.log(`- Player     : ${playerCount}`);
  console.log(`- PlayerHero : ${playerHeroCount}`);
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
