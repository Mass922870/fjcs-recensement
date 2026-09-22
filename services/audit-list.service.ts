import { z } from "zod";
import { prisma } from "@/lib/db";
import { AuditAction } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

export const auditListParamsSchema = z.object({
  action: z.preprocess((v) => (v === "" ? undefined : v), z.enum(AuditAction).optional()),
  actor: z.preprocess((v) => (v === "" ? undefined : v), z.string().max(64).optional()),
  from: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  ),
  to: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  ),
  page: z.coerce.number().int().min(1).default(1),
});
export type AuditListParams = z.infer<typeof auditListParamsSchema>;

export function parseAuditParams(
  sp: Record<string, string | string[] | undefined>,
): AuditListParams {
  const raw: Record<string, unknown> = {};
  for (const k of Object.keys(auditListParamsSchema.shape))
    raw[k] = Array.isArray(sp[k]) ? sp[k]![0] : sp[k];
  const r = auditListParamsSchema.safeParse(raw);
  return r.success ? r.data : auditListParamsSchema.parse({});
}

const PER_PAGE = 30;

export async function listAuditLogs(params: AuditListParams) {
  const where: Prisma.AuditLogWhereInput = {};
  if (params.action) where.action = params.action;
  if (params.actor) where.actorId = params.actor;
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(`${params.from}T00:00:00`);
    if (params.to) where.createdAt.lte = new Date(`${params.to}T23:59:59.999`);
  }
  const [total, items, actors] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { actor: { select: { name: true } } },
    }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    total,
    items,
    actors,
    page: params.page,
    perPage: PER_PAGE,
    pageCount: Math.max(1, Math.ceil(total / PER_PAGE)),
  };
}
