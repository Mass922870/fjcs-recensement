import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";
import { ReferentialManager } from "@/components/admin/settings/referential-manager";
import { requirePagePermission } from "@/lib/auth/session";
import {
  REFERENTIAL_KINDS,
  REFERENTIAL_KIND_LIST,
  type ReferentialKind,
} from "@/lib/constants/referential-kinds";
import { listReferential } from "@/services/referential-admin.service";

export const metadata: Metadata = { title: "Référentiels du formulaire" };

export default async function ReferentialsPage(props: PageProps<"/admin/parametres/referentiels">) {
  await requirePagePermission("settings:manage");
  const sp = await props.searchParams;
  const initial = (
    typeof sp.tab === "string" && sp.tab in REFERENTIAL_KINDS ? sp.tab : "quartier"
  ) as ReferentialKind;

  const entries = await Promise.all(
    REFERENTIAL_KIND_LIST.map(async (kind) => [kind, await listReferential(kind)] as const),
  );
  const data = Object.fromEntries(entries) as Record<
    ReferentialKind,
    Awaited<ReturnType<typeof listReferential>>
  >;
  const categories = data.skillCategory
    .filter((c) => c.isActive)
    .map((c) => ({ id: c.id, label: c.label }));

  return (
    <>
      <Link
        href="/admin/parametres"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Paramètres
      </Link>
      <PageHeader
        title="Référentiels du formulaire"
        description="Toutes les listes de choix du recensement se gèrent ici : ajout, renommage, ordre, activation, suppression. Aucune modification du code n'est nécessaire."
      />
      <nav aria-label="Référentiels" className="mb-4 flex flex-wrap gap-2">
        {REFERENTIAL_KIND_LIST.map((kind) => (
          <Link
            key={kind}
            href={`/admin/parametres/referentiels?tab=${kind}`}
            aria-current={kind === initial ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              kind === initial
                ? "border-brand-600 bg-brand-50 text-brand-800"
                : "border-border text-muted-foreground hover:border-brand-200 hover:text-foreground bg-white",
            )}
          >
            {REFERENTIAL_KINDS[kind].label}
            <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-[10px]">
              {data[kind].length}
            </span>
          </Link>
        ))}
      </nav>
      <ReferentialManager
        key={initial}
        kind={initial}
        rows={data[initial]}
        categories={initial === "skill" ? categories : undefined}
      />
    </>
  );
}
