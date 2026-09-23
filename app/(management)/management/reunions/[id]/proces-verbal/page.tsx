import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { MinutesEditor } from "@/components/management/minutes/minutes-editor";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { hasManagementPermission } from "@/lib/auth/management-rbac";
import { getMinutes, getOrCreateMinutes } from "@/services/management/minutes.service";
import { listSelectableMembers } from "@/services/management/meetings.service";
import { NotFoundError } from "@/lib/errors";

export const metadata: Metadata = { title: "Procès-verbal" };

export default async function MinutesPage(
  props: PageProps<"/management/reunions/[id]/proces-verbal">,
) {
  const user = await requireManagementPagePermission("minutes:view");
  const { id } = await props.params;

  // Le procès-verbal est ouvert à la demande, une seule fois par réunion.
  if (hasManagementPermission(user.managementRole, "minutes:create")) {
    try {
      await getOrCreateMinutes(id, user.id);
    } catch (error) {
      if (error instanceof NotFoundError) notFound();
      // Une réunion annulée n'a pas de PV : on laisse getMinutes trancher.
    }
  }

  let minutes;
  try {
    minutes = await getMinutes(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const members = await listSelectableMembers();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/management/reunions/${id}`}>
          <ArrowLeft />
          Retour à la réunion
        </Link>
      </Button>

      <PageHeader
        title="Procès-verbal"
        description={minutes.meeting.title}
        actions={
          hasManagementPermission(user.managementRole, "minutes:export") ? (
            <Button variant="outline" asChild>
              <a
                href={`/api/management/proces-verbaux/${id}?download=1`}
                target="_blank"
                rel="noreferrer"
              >
                <Download />
                Générer le PV
              </a>
            </Button>
          ) : null
        }
      />

      <MinutesEditor
        minutes={minutes}
        members={members}
        canEdit={hasManagementPermission(user.managementRole, "minutes:edit")}
        canValidate={hasManagementPermission(user.managementRole, "minutes:validate")}
      />
    </div>
  );
}
