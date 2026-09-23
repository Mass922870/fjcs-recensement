import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrPanel } from "@/components/management/attendance/qr-panel";
import { Logo } from "@/components/shared/logo";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { getMeeting } from "@/services/management/meetings.service";
import { hasActiveToken } from "@/services/management/attendance.service";
import { NotFoundError } from "@/lib/errors";

export const metadata: Metadata = { title: "QR de pointage" };

export default async function MeetingQrPage(props: PageProps<"/management/reunions/[id]/qr">) {
  await requireManagementPagePermission("attendance:manage");
  const { id } = await props.params;

  let meeting;
  try {
    meeting = await getMeeting(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const active = await hasActiveToken(meeting.id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/management/reunions/${meeting.id}/presences`}>
          <ArrowLeft />
          Retour à la feuille de présence
        </Link>
      </Button>

      <div className="border-border rounded-3xl border bg-white p-6 sm:p-10">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Logo variant="emblem" className="size-12" />
          <Logo org="ctni" variant="emblem" className="size-10" />
        </div>
        <QrPanel meetingId={meeting.id} meetingTitle={meeting.title} hasActive={active} />
      </div>
    </div>
  );
}
