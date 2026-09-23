import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { MeetingForm } from "@/components/management/meetings/meeting-form";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { getMeeting, listSelectableMembers } from "@/services/management/meetings.service";
import { listCommissions } from "@/services/management/members.service";
import { NotFoundError } from "@/lib/errors";

export const metadata: Metadata = { title: "Modifier la réunion" };

export default async function EditMeetingPage(
  props: PageProps<"/management/reunions/[id]/modifier">,
) {
  await requireManagementPagePermission("meetings:edit");
  const { id } = await props.params;

  let meeting;
  try {
    meeting = await getMeeting(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [commissions, members] = await Promise.all([listCommissions(), listSelectableMembers()]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/management/reunions/${meeting.id}`}>
          <ArrowLeft />
          Retour à la réunion
        </Link>
      </Button>

      <PageHeader title="Modifier la réunion" description={meeting.reference} />

      <MeetingForm commissions={commissions} members={members} meeting={meeting} />
    </div>
  );
}
