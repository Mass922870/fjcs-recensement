import type { Metadata } from "next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, CalendarClock, MapPin } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { PresenceConfirm } from "@/components/presence/presence-confirm";
import { resolveAttendanceToken } from "@/services/management/attendance.service";
import { ORG_NAME } from "@/lib/constants/app";

export const metadata: Metadata = {
  title: "Confirmer ma présence",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Page atteinte en scannant le QR d'une séance. Volontairement hors
 * authentification : les membres du FJCS n'ont pas tous un compte. La seule
 * autorisation est la détention d'un jeton valide, à durée de vie courte.
 */
export default async function PresencePage(props: PageProps<"/presence/[token]">) {
  const { token } = await props.params;

  let context;
  try {
    context = await resolveAttendanceToken(token);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ce QR code n'est pas utilisable.";
    return (
      <Shell>
        <div className="space-y-4 text-center">
          <span className="bg-destructive/10 text-destructive mx-auto flex size-16 items-center justify-center rounded-full">
            <AlertTriangle className="size-8" aria-hidden />
          </span>
          <h1 className="text-foreground text-xl font-semibold">Pointage impossible</h1>
          <p className="text-muted-foreground text-sm">{message}</p>
          <p className="text-muted-foreground text-xs">
            Demandez au responsable de séance de générer un nouveau QR code.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <PresenceConfirm
        token={token}
        meetingTitle={context.meeting.title}
        members={context.pending}
      />
      <div className="text-muted-foreground mt-6 space-y-1 border-t pt-4 text-center text-xs">
        <p className="flex items-center justify-center gap-1.5">
          <CalendarClock className="size-3" aria-hidden />
          {format(context.meeting.startsAt, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
        </p>
        {context.meeting.location ? (
          <p className="flex items-center justify-center gap-1.5">
            <MapPin className="size-3" aria-hidden />
            {context.meeting.location}
          </p>
        ) : null}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-muted/40 flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo variant="emblem" className="w-16" priority />
          <p className="text-muted-foreground text-xs">{ORG_NAME}</p>
        </div>
        <div className="border-border rounded-2xl border bg-white p-6 shadow-[0_20px_60px_-40px_rgba(26,13,144,0.35)]">
          {children}
        </div>
      </div>
    </main>
  );
}
