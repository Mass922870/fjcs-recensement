import { NextResponse, type NextRequest } from "next/server";
import { format } from "date-fns";
import { renderToBuffer } from "@react-pdf/renderer";
import { requirePermission } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { getHashedClientIp } from "@/lib/security/request";
import { parseStatsFilters } from "@/schemas/filters";
import { audit } from "@/services/audit.service";
import { buildReport, type ReportData } from "@/services/report.service";
import { ReportDocument } from "@/lib/pdf/report-document";

export const dynamic = "force-dynamic";

// Hors du try/catch : le rendu react-pdf est asynchrone et ses erreurs remontent via la promesse.
function renderReport(data: ReportData) {
  return renderToBuffer(<ReportDocument data={data} />);
}

/** GET /api/rapports?from&to&… → rapport général PDF. */
export async function GET(req: NextRequest) {
  try {
    const user = await requirePermission("reports:generate");
    const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = parseStatsFilters(sp);
    const data = await buildReport(filters);
    const pdf = await renderReport(data);

    await audit({
      action: "REPORT_GENERATED",
      entityType: "Report",
      actorId: user.id,
      ipHash: await getHashedClientIp(),
      metadata: { filters, total: data.kpis.total },
    });

    const filename = `fjcs-rapport-general-${format(data.generatedAt, "yyyyMMdd-HHmm")}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${sp.download === "1" ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[rapports]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
