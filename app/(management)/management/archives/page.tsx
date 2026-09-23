import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Archive, ChevronRight, FileText, FolderClosed, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { MeetingStatusBadge } from "@/components/management/meetings/meetings-table";
import { ArchiveFilters } from "@/components/management/archives/archive-filters";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { listArchiveYears, searchArchives } from "@/services/management/archives.service";
import { listCommissions } from "@/services/management/members.service";
import { MEETING_TYPE_LABELS, MINUTES_STATUS_LABELS } from "@/lib/constants/management";
import { MeetingType } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Archives" };

export default async function ArchivesPage(props: PageProps<"/management/archives">) {
  await requireManagementPagePermission("archives:view");
  const sp = await props.searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const type = str("type");
  const year = Number(str("year"));
  const filters = {
    year: Number.isInteger(year) && year > 2000 ? year : undefined,
    type: type && type in MeetingType ? (type as keyof typeof MeetingType) : undefined,
    commissionId: str("commissionId"),
    q: str("q"),
  };

  const [rows, years, commissions] = await Promise.all([
    searchArchives(filters),
    listArchiveYears(),
    listCommissions(),
  ]);

  const filtered = Boolean(filters.year || filters.type || filters.commissionId || filters.q);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Archives"
        description="Toutes les séances du FJCS, leurs procès-verbaux, décisions et pièces jointes."
      />

      <ArchiveFilters years={years} commissions={commissions} />

      {rows.length === 0 ? (
        <EmptyState
          icon={Archive}
          title={filtered ? "Aucun dossier ne correspond" : "Les archives sont vides"}
          description={
            filtered
              ? "Élargissez la recherche : elle porte sur les intitulés, les références, les points de l'ordre du jour et les décisions."
              : "Chaque réunion tenue vient alimenter cette archive."
          }
        />
      ) : (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-2xl border bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/management/reunions/${row.id}`}
                className="hover:bg-muted/40 flex items-center gap-4 px-5 py-4 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-foreground truncate text-sm font-medium">{row.title}</p>
                    <MeetingStatusBadge status={row.status} />
                    {row.minutes ? (
                      <Badge variant="secondary" className="text-[10px]">
                        PV {MINUTES_STATUS_LABELS[row.minutes.status].toLowerCase()}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {row.reference} · {format(row.startsAt, "d MMMM yyyy", { locale: fr })} ·{" "}
                    {MEETING_TYPE_LABELS[row.type]}
                    {row.commission ? ` · ${row.commission.name}` : ""}
                  </p>
                  <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="size-3" aria-hidden />
                      {row._count.agenda} point{row._count.agenda > 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Scale className="size-3" aria-hidden />
                      {row._count.decisions} décision{row._count.decisions > 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FolderClosed className="size-3" aria-hidden />
                      {row._count.documents} document{row._count.documents > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
