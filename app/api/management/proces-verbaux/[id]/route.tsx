import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireManagementPermission } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { getHashedClientIp } from "@/lib/security/request";
import { audit } from "@/services/audit.service";
import { getMinutes, type MinutesDetail } from "@/services/management/minutes.service";
import { MinutesDocument } from "@/lib/pdf/minutes-document";

export const dynamic = "force-dynamic";

// Hors du try/catch : le rendu react-pdf est asynchrone et le JSX ne doit pas
// vivre dans un bloc try.
function renderMinutes(minutes: MinutesDetail, generatedAt: Date) {
  return renderToBuffer(<MinutesDocument minutes={minutes} generatedAt={generatedAt} />);
}

/** GET /api/management/proces-verbaux/[id] → procès-verbal PDF de la réunion. */
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/management/proces-verbaux/[id]">,
) {
  try {
    const user = await requireManagementPermission("minutes:export");
    const { id } = await ctx.params;
    const minutes = await getMinutes(id);
    const generatedAt = new Date();
    const pdf = await renderMinutes(minutes, generatedAt);

    await audit({
      action: "EXPORT_GENERATED",
      entityType: "Minutes",
      entityId: minutes.id,
      actorId: user.id,
      ipHash: await getHashedClientIp(),
      metadata: {
        document: "proces-verbal",
        reference: minutes.meeting.reference,
        version: minutes.version,
        status: minutes.status,
      },
    });

    const suffix = minutes.status === "VALIDE" ? "" : "-projet";
    const filename = `fjcs-pv-${minutes.meeting.reference}-v${minutes.version}${suffix}.pdf`;
    const download = req.nextUrl.searchParams.get("download") === "1";
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[proces-verbaux]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
