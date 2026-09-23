import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/shared/states";
import { Pagination } from "@/components/shared/pagination";
import { MeetingFilters } from "@/components/management/meetings/meeting-filters";
import { MeetingsTable } from "@/components/management/meetings/meetings-table";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { hasManagementPermission } from "@/lib/auth/management-rbac";
import { meetingFiltersSchema } from "@/schemas/management/meetings";
import { listMeetings, MEETINGS_PAGE_SIZE } from "@/services/management/meetings.service";
import { listCommissions } from "@/services/management/members.service";

export const metadata: Metadata = { title: "Réunions" };

export default async function MeetingsPage(props: PageProps<"/management/reunions">) {
  const user = await requireManagementPagePermission("meetings:view");
  const canCreate = hasManagementPermission(user.managementRole, "meetings:create");

  const sp = await props.searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const filters = meetingFiltersSchema.parse({
    q: str("q"),
    status: str("status"),
    type: str("type"),
    commissionId: str("commissionId"),
    organizerId: str("organizerId"),
    from: str("from"),
    to: str("to"),
    sort: str("sort") ?? "date-desc",
    page: str("page") ?? 1,
  });

  const [commissions, { rows, total, pageCount }] = await Promise.all([
    listCommissions(),
    listMeetings(filters),
  ]);

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (key === "page" || value === undefined) continue;
      if (key === "sort" && value === "date-desc") continue;
      params.set(key, String(value));
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/management/reunions?${qs}` : "/management/reunions";
  };

  const filtered = Boolean(
    filters.q || filters.status || filters.type || filters.commissionId || filters.from || filters.to,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Réunions"
        description="Séances du bureau, des commissions et assemblées générales."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/management/calendrier">
                <CalendarDays />
                Calendrier
              </Link>
            </Button>
            {canCreate ? (
              <Button asChild>
                <Link href="/management/reunions/nouvelle">
                  <Plus />
                  Planifier une réunion
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <MeetingFilters commissions={commissions} />

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={filtered ? "Aucune réunion ne correspond" : "Aucune réunion planifiée"}
          description={
            filtered
              ? "Modifiez ou réinitialisez les filtres pour élargir la recherche."
              : "Planifiez la première séance : ordre du jour, convocations, présences et procès-verbal en découleront."
          }
          action={
            canCreate && !filtered ? (
              <Button asChild>
                <Link href="/management/reunions/nouvelle">
                  <Plus />
                  Planifier une réunion
                </Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          <MeetingsTable meetings={rows} />
          {pageCount > 1 ? (
            <div className="border-border rounded-2xl border bg-white">
              <Pagination
                page={filters.page}
                pageCount={pageCount}
                total={total}
                perPage={MEETINGS_PAGE_SIZE}
                hrefFor={hrefFor}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
