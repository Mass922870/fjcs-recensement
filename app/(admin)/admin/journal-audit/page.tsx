import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { AuditFilters } from "@/components/admin/audit/audit-filters";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/states";
import { requirePagePermission } from "@/lib/auth/session";
import { AUDIT_ACTION_LABELS } from "@/lib/constants/audit";
import { listAuditLogs, parseAuditParams } from "@/services/audit-list.service";
import type { AuditAction } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Journal d'activité" };

const TONE: Partial<Record<AuditAction, string>> = {
  LOGIN_FAILED: "border-amber-200 bg-amber-50 text-amber-800",
  DUPLICATE_ATTEMPT: "border-amber-200 bg-amber-50 text-amber-800",
  PROFILE_DELETED: "border-red-200 bg-red-50 text-red-700",
  PROFILE_ANONYMIZED: "border-red-200 bg-red-50 text-red-700",
  EXPORT_GENERATED: "border-cyan-100 bg-cyan-50 text-cyan-700",
  REPORT_GENERATED: "border-cyan-100 bg-cyan-50 text-cyan-700",
  PROFILE_CREATED: "border-green-100 bg-green-50 text-green-700",
};

function describeMetadata(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";
  const m = meta as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof m.format === "string") parts.push(m.format.toUpperCase());
  if (typeof m.scope === "string") parts.push(m.scope === "personal" ? "nominatif" : "anonymisé");
  if (typeof m.rows === "number") parts.push(`${m.rows} lignes`);
  if (typeof m.total === "number") parts.push(`${m.total} profils`);
  if (typeof m.source === "string") parts.push(`source ${m.source.toLowerCase()}`);
  if (typeof m.role === "string") parts.push(`rôle ${m.role}`);
  if (typeof m.op === "string") parts.push(m.op);
  return parts.join(" · ");
}

export default async function AuditPage(props: PageProps<"/admin/journal-audit">) {
  await requirePagePermission("audit:view");
  const sp = await props.searchParams;
  const params = parseAuditParams(sp);
  const result = await listAuditLogs(params);

  const hrefFor = (page: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      const val = Array.isArray(v) ? v[0] : v;
      if (val && k !== "page") p.set(k, val);
    }
    if (page > 1) p.set("page", String(page));
    const s = p.toString();
    return `/admin/journal-audit${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Journal d'activité"
        description="Traçabilité de toutes les actions sensibles : connexions, modifications, exports, suppressions."
      />
      <AuditFilters params={params} actors={result.actors} />
      {result.total === 0 ? (
        <EmptyState title="Aucun événement" />
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead>Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {format(log.createdAt, "d MMM yyyy HH:mm:ss", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={TONE[log.action] ?? "bg-muted text-foreground"}
                      >
                        {AUDIT_ACTION_LABELS[log.action]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.actor?.name ?? (
                        <span className="text-muted-foreground">Public / système</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.entityType === "YouthProfile" && log.entityId ? (
                        <Link
                          href={`/admin/jeunes/${log.entityId}`}
                          className="text-primary hover:underline"
                        >
                          Profil
                        </Link>
                      ) : (
                        log.entityType
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {describeMetadata(log.metadata)}
                      {log.ipHash ? (
                        <span className="ml-2 font-mono opacity-60">
                          ip:{log.ipHash.slice(0, 8)}
                        </span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            perPage={result.perPage}
            hrefFor={hrefFor}
          />
        </div>
      )}
    </>
  );
}
