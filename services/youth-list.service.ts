import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { normalizePhone } from "@/lib/phone";
import { buildProfileWhere } from "./stats.service";
import type { YouthListParams } from "@/schemas/youth-list";
import { PARTICIPATION_CODE_REGEX } from "@/lib/participation-code";
import { isDemoDataVisible } from "@/lib/demo-data";

export interface YouthListItem {
  id: string;
  participationCode: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: "FEMALE" | "MALE";
  status: "ACTIVE" | "ARCHIVED" | "ANONYMIZED";
  isDemo: boolean;
  createdAt: Date;
  quartier: { name: string } | null;
  education: { level: { label: string } } | null;
  employment: { status: { label: string; kind: string } } | null;
  skills: { skill: { label: string } }[];
}

export interface YouthListResult {
  items: YouthListItem[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

/** Recherche : nom, prénom, code de participation ou téléphone normalisé. */
function searchWhere(q: string | undefined): Prisma.YouthProfileWhereInput | undefined {
  if (!q) return undefined;
  const trimmed = q.trim();
  const upper = trimmed.toUpperCase();
  if (PARTICIPATION_CODE_REGEX.test(upper)) return { participationCode: upper };
  const phone = normalizePhone(trimmed);
  const or: Prisma.YouthProfileWhereInput[] = [
    { firstName: { contains: trimmed, mode: "insensitive" } },
    { lastName: { contains: trimmed, mode: "insensitive" } },
    { participationCode: { contains: upper } },
  ];
  if (phone) or.push({ phoneNormalized: phone });
  else if (/^\+?\d[\d\s]{4,}$/.test(trimmed))
    or.push({ phone: { contains: trimmed.replace(/\s/g, "") } });
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    or.push({
      AND: [
        { firstName: { contains: parts[0]!, mode: "insensitive" } },
        { lastName: { contains: parts.slice(1).join(" "), mode: "insensitive" } },
      ],
    });
  }
  return { OR: or };
}

export async function listYouthProfiles(params: YouthListParams): Promise<YouthListResult> {
  const base = buildProfileWhere(params);
  // La liste admin permet aussi de voir les archivés/anonymisés (filtre statut explicite).
  const where: Prisma.YouthProfileWhereInput = {
    ...base,
    status: params.status ?? "ACTIVE",
  };
  if (!isDemoDataVisible()) where.isDemo = false;
  const search = searchWhere(params.q);
  if (search) where.AND = [search];

  const orderBy: Prisma.YouthProfileOrderByWithRelationInput =
    params.sort === "quartier" ? { quartier: { name: params.dir } } : { [params.sort]: params.dir };

  const [total, items] = await Promise.all([
    prisma.youthProfile.count({ where }),
    prisma.youthProfile.findMany({
      where,
      orderBy: [orderBy, { id: "asc" }],
      skip: (params.page - 1) * params.perPage,
      take: params.perPage,
      select: {
        id: true,
        participationCode: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        status: true,
        isDemo: true,
        createdAt: true,
        quartier: { select: { name: true } },
        education: { select: { level: { select: { label: true } } } },
        employment: { select: { status: { select: { label: true, kind: true } } } },
        skills: { select: { skill: { select: { label: true } } }, take: 4 },
      },
    }),
  ]);

  return {
    items,
    total,
    page: params.page,
    perPage: params.perPage,
    pageCount: Math.max(1, Math.ceil(total / params.perPage)),
  };
}

/** Fiche complète d'un jeune (accès réservé - vérifié par l'appelant). */
export async function getYouthProfileDetail(id: string) {
  return prisma.youthProfile.findUnique({
    where: { id },
    include: {
      quartier: { select: { id: true, name: true, slug: true } },
      education: { include: { level: true } },
      employment: { include: { status: true } },
      project: true,
      consent: true,
      skills: { include: { skill: { include: { category: true } } }, orderBy: { skill: { sortOrder: "asc" } } },
      interests: { include: { interest: true }, orderBy: { interest: { sortOrder: "asc" } } },
      needs: { include: { need: true }, orderBy: { need: { sortOrder: "asc" } } },
      createdBy: { select: { name: true } },
    },
  });
}

export type YouthProfileDetail = NonNullable<Awaited<ReturnType<typeof getYouthProfileDetail>>>;

export async function getYouthHistory(id: string) {
  return prisma.auditLog.findMany({
    where: { entityType: "YouthProfile", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { name: true } } },
  });
}
