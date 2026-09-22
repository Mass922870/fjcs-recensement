import { NextResponse, type NextRequest } from "next/server";
import { format } from "date-fns";
import { requirePermission } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { getHashedClientIp } from "@/lib/security/request";
import { parseStatsFilters } from "@/schemas/filters";
import { audit } from "@/services/audit.service";
import {
  buildExportDataset,
  datasetToCsv,
  datasetToXlsx,
  type ExportFormat,
  type ExportScope,
} from "@/services/export.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/exports?format=csv|xlsx&scope=personal|anonymous&…filtres
 * Les exports nominatifs exigent la permission export:personal. Chaque export est journalisé.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
    const fmt: ExportFormat = sp.format === "xlsx" ? "xlsx" : "csv";
    const scope: ExportScope = sp.scope === "personal" ? "personal" : "anonymous";
    const user = await requirePermission(
      scope === "personal" ? "export:personal" : "export:aggregated",
    );
    const filters = parseStatsFilters(sp);

    const dataset = await buildExportDataset(filters, scope);
    const stamp = format(dataset.generatedAt, "yyyyMMdd-HHmm");
    const filename = `fjcs-recensement-${scope === "personal" ? "nominatif" : "anonyme"}-${stamp}.${fmt}`;

    await audit({
      action: "EXPORT_GENERATED",
      entityType: "Export",
      actorId: user.id,
      ipHash: await getHashedClientIp(),
      metadata: { format: fmt, scope, rows: dataset.rows.length, filters },
    });

    const headers = {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    };
    if (fmt === "xlsx") {
      const buf = await datasetToXlsx(dataset);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          ...headers,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }
    return new NextResponse(datasetToCsv(dataset), {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[exports]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
