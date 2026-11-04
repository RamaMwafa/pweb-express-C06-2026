import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { HttpError } from "../errors/HttpError.ts";
import { Role, Lane } from "../generated/prisma/client.ts";
import type { Prisma } from "../generated/prisma/client.ts";
import {
  getQueryString,
  parsePositiveInteger,
} from "../utils/query.ts";
import { sendSuccess } from "../utils/response.ts";

const ROLE_VALUES = Object.values(Role) as Role[];
const LANE_VALUES = Object.values(Lane) as Lane[];

// GET /api/heroes
export async function getHeroes(
  req: Request,
  res: Response,
): Promise<Response> {
  const page = parsePositiveInteger(req.query.page, 1);
  const limit = parsePositiveInteger(req.query.limit, 10, 100);
  const skip = (page - 1) * limit;

  const where: Prisma.HeroWhereInput = {};

  // search berdasarkan nama
  const search = getQueryString(req.query.search);

  if (search && search.trim() !== "") {
    where.name = {
      contains: search.trim(),
      mode: "insensitive",
    };
  }

  // filter role
  const roleRaw = getQueryString(req.query.role);

  if (roleRaw !== undefined) {
    const role = roleRaw.toUpperCase() as Role;

    if (!ROLE_VALUES.includes(role)) {
      throw new HttpError(
        400,
        `role harus salah satu dari: ${ROLE_VALUES.join(", ")}`,
      );
    }

    where.role = role;
  }

  const [totalItems, heroes] = await prisma.$transaction([
    prisma.hero.count({
      where,
    }),

    prisma.hero.findMany({
      where,
      orderBy: {
        id: "asc",
      },
      skip,
      take: limit,
    }),
  ]);

  return sendSuccess(res, {
    message: "Berhasil mengambil data hero",
    data: heroes,
    metadata: {
      currentPage: page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
}

// GET /api/heroes/:hero_id
export async function getHeroById(
  req: Request,
  res: Response,
): Promise<Response> {
  const heroId = Number(req.params.hero_id);

  if (!Number.isInteger(heroId) || heroId <= 0) {
    throw new HttpError(400, "ID hero tidak valid");
  }

  const hero = await prisma.hero.findUnique({
    where: {
      id: heroId,
    },
    include: {
      skins: true,
    },
  });

  if (!hero) {
    throw new HttpError(404, "Hero tidak ditemukan");
  }

  return sendSuccess(res, {
    message: "Berhasil mengambil detail hero",
    data: hero,
  });
}

// POST /api/heroes
export async function createHero(
  req: Request,
  res: Response,
): Promise<Response> {
  const {
    name,
    role,
    lane,
    releaseYear,
    priceBP,
    priceDiamond,
  } = req.body;

  // 1. Validasi field wajib
  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof role !== "string" ||
    role.trim() === "" ||
    typeof lane !== "string" ||
    lane.trim() === "" ||
    releaseYear === undefined ||
    releaseYear === null ||
    releaseYear === ""
  ) {
    throw new HttpError(
      400,
      "name, role, lane, dan releaseYear wajib diisi",
    );
  }

  const normalizedRole = role.toUpperCase() as Role;
  const normalizedLane = lane.toUpperCase() as Lane;

  if (!ROLE_VALUES.includes(normalizedRole)) {
    throw new HttpError(
      400,
      `role harus salah satu dari: ${ROLE_VALUES.join(", ")}`,
    );
  }

  if (!LANE_VALUES.includes(normalizedLane)) {
    throw new HttpError(
      400,
      `lane harus salah satu dari: ${LANE_VALUES.join(", ")}`,
    );
  }

  const parsedReleaseYear = Number(releaseYear);

  if (!Number.isInteger(parsedReleaseYear)) {
    throw new HttpError(400, "releaseYear harus berupa bilangan bulat");
  }

  // 2. Cek nama hero duplicate
  const existingHero = await prisma.hero.findUnique({
    where: {
      name: name.trim(),
    },
  });

  if (existingHero) {
    throw new HttpError(409, "Nama hero sudah digunakan");
  }

  // 3. Create
  const hero = await prisma.hero.create({
    data: {
      name: name.trim(),
      role: normalizedRole,
      lane: normalizedLane,
      releaseYear: parsedReleaseYear,
      priceBP:
        priceBP === undefined || priceBP === null
          ? null
          : Number(priceBP),
      priceDiamond:
        priceDiamond === undefined || priceDiamond === null
          ? null
          : Number(priceDiamond),
    },
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Hero berhasil dibuat",
    data: hero,
  });
}