import { NextResponse, type NextRequest } from "next/server";
import { requireManagementPermission } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { getHashedClientIp } from "@/lib/security/request";
import { audit } from "@/services/audit.service";
import { readDocument } from "@/services/management/documents.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/management/documents/[id] → contenu d'un document interne.
 *
 * Jamais servi statiquement : l'autorisation est vérifiée à chaque appel et le
 * téléchargement est journalisé. Content-Disposition en pièce jointe et
 * X-Content-Type-Options empêchent l'exécution d'un contenu dans le navigateur.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/management/documents/[id]">) {
  try {
    const user = await requireManagementPermission("documents:view");
    const { id } = await ctx.params;
    const document = await readDocument(id);

    await audit({
      action: "DOCUMENT_DOWNLOADED",
      entityType: "Document",
      entityId: document.id,
      actorId: user.id,
      ipHash: await getHashedClientIp(),
      metadata: { title: document.title },
    });

    const inline = req.nextUrl.searchParams.get("inline") === "1" && document.mimeType === "application/pdf";
    return new NextResponse(new Uint8Array(document.blob!.content), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(document.title)}"`,
        "Content-Length": String(document.sizeBytes),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AppError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[documents]", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
