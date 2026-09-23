import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { MeetingForm } from "@/components/management/meetings/meeting-form";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { listSelectableMembers } from "@/services/management/meetings.service";
import { listCommissions } from "@/services/management/members.service";

export const metadata: Metadata = { title: "Planifier une réunion" };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function NewMeetingPage(props: PageProps<"/management/reunions/nouvelle">) {
  await requireManagementPagePermission("meetings:create");
  const sp = await props.searchParams;
  // Date pré-remplie lorsqu'on arrive depuis une case du calendrier.
  const defaultDate = typeof sp.date === "string" && DATE.test(sp.date) ? sp.date : undefined;

  const [commissions, members] = await Promise.all([listCommissions(), listSelectableMembers()]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/management/reunions">
          <ArrowLeft />
          Retour aux réunions
        </Link>
      </Button>

      <PageHeader
        title="Planifier une réunion"
        description="La référence est attribuée automatiquement à l'enregistrement."
      />

      <MeetingForm commissions={commissions} members={members} defaultDate={defaultDate} />
    </div>
  );
}
