import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/states";
import { DemoBadge, EmploymentBadge, ProfileStatusBadge } from "./youth-badges";
import { GENDER_LABELS } from "@/lib/constants/referentials";
import { computeAge } from "@/lib/age";
import type { YouthListResult } from "@/services/youth-list.service";
import type { YouthListParams, YouthSortField } from "@/schemas/youth-list";
import { cn } from "@/lib/utils";

interface Props {
  result: YouthListResult;
  params: YouthListParams;
  searchParams: Record<string, string | string[] | undefined>;
}

function buildHref(
  sp: Record<string, string | string[] | undefined>,
  patch: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) params.set(k, val);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) params.delete(k);
    else params.set(k, v);
  }
  const s = params.toString();
  return `/admin/jeunes${s ? `?${s}` : ""}`;
}

function SortHeader({
  field,
  label,
  params,
  sp,
  className,
}: {
  field: YouthSortField;
  label: string;
  params: YouthListParams;
  sp: Props["searchParams"];
  className?: string;
}) {
  const active = params.sort === field;
  const nextDir = active && params.dir === "asc" ? "desc" : "asc";
  const Icon = active ? (params.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={className}>
      <Link
        href={buildHref(sp, { sort: field, dir: nextDir, page: undefined })}
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
        <Icon className="size-3.5" />
      </Link>
    </TableHead>
  );
}

export function YouthTable({ result, params, searchParams: sp }: Props) {
  if (result.total === 0) {
    return (
      <EmptyState
        title="Aucun jeune trouvé"
        description="Nous n'avons encore aucune donnée correspondant à ces critères."
      />
    );
  }

  return (
    <div className="border-border overflow-hidden rounded-2xl border bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <SortHeader
                field="lastName"
                label="Nom"
                params={params}
                sp={sp}
                className="min-w-[200px]"
              />
              <SortHeader field="birthDate" label="Âge" params={params} sp={sp} />
              <TableHead>Sexe</TableHead>
              <SortHeader field="quartier" label="Quartier" params={params} sp={sp} />
              <TableHead>Formation</TableHead>
              <TableHead>Situation</TableHead>
              <TableHead className="min-w-[200px]">Compétences</TableHead>
              <SortHeader field="createdAt" label="Inscription" params={params} sp={sp} />
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((y) => (
              <TableRow key={y.id} className="group">
                <TableCell>
                  <Link href={`/admin/jeunes/${y.id}`} className="block">
                    <span className="text-foreground group-hover:text-primary font-medium">
                      {y.lastName.toUpperCase()} {y.firstName}
                    </span>
                    <span className="text-muted-foreground mt-0.5 flex items-center gap-2 font-mono text-[11px]">
                      {y.participationCode}
                      {y.isDemo ? <DemoBadge /> : null}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{computeAge(y.birthDate)} ans</TableCell>
                <TableCell>{GENDER_LABELS[y.gender]}</TableCell>
                <TableCell>
                  {y.quartier?.name ?? <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {y.education?.level.label ?? "-"}
                </TableCell>
                <TableCell>
                  {y.employment ? (
                    <EmploymentBadge status={y.employment.status} />
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {y.skills.slice(0, 3).map((s) => (
                      <span
                        key={s.skill.label}
                        className="bg-muted text-foreground rounded-md px-1.5 py-0.5 text-xs"
                      >
                        {s.skill.label}
                      </span>
                    ))}
                    {y.skills.length > 3 ? (
                      <span className="text-muted-foreground rounded-md px-1.5 py-0.5 text-xs">
                        +{y.skills.length - 3}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {format(y.createdAt, "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell>
                  <ProfileStatusBadge status={y.status} />
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
        hrefFor={(p) => buildHref(sp, { page: p > 1 ? String(p) : undefined })}
      />
    </div>
  );
}
