import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireManagementPermission } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { getHashedClientIp } from "@/lib/security/request";
import { audit } from "@/services/audit.service";
import { getAttendanceSheet, type AttendanceSheet } from "@/services/management/attendance.service";
import { AttendanceSheetDocument } from "@/lib/pdf/attendance-sheet-document";

export const dynamic = "force-dynamic";

// Hors du try/catch : le rendu react-pdf est asynchrone, ses erreurs remontent
// par la promesse et le JSX ne doit pas vivre dans un bloc try.
function renderSheet(sheet: AttendanceSheet, generatedAt: Date) {
  return renderToBuffer(<AttendanceSheetDocument sheet={sheet} generatedAt={generatedAt} />);
}

/** GET /api/management/presences/[id] → feuille de présence PDF. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/management/presences/[id]">) {
  try {
    const user = await requireManagementPermission("attendance:export");
    const { id } = await ctx.params;
    const sheet = await getAttendanceSheet(id);
    const generatedAt = new Date();
    const pdf = await renderSheet(sheet, generatedAt);

    await audit({
      action: "EXPORT_GENERATED",
      entityType: "Meeting",
      entityId: id,
      actorId: user.id,
      ipHash: await getHashedClientIp(),
      metadata: { document: "feuille-de-presence", reference: sheet.meeting.reference },
    });

    const filename = `fjcs-presence-${sheet.meeting.reference}.pdf`;
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
    console.error("[presences]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
