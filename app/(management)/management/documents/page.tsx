import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { DocumentsPanel } from "@/components/management/documents/documents-panel";
import { requireManagementPagePermission } from "@/lib/auth/session";
import { hasManagementPermission } from "@/lib/auth/management-rbac";
import { getDocumentsFootprint, listDocuments } from "@/services/management/documents.service";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const user = await requireManagementPagePermission("documents:view");
  const [documents, footprint] = await Promise.all([listDocuments(), getDocumentsFootprint()]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Documents"
        description={
          footprint.count === 0
            ? "Espace documentaire interne, réservé aux membres habilités."
            : `${footprint.count} document${footprint.count > 1 ? "s" : ""} · ${(footprint.bytes / 1024 / 1024).toFixed(1)} Mo stockés`
        }
      />

      <DocumentsPanel
        documents={documents}
        canUpload={hasManagementPermission(user.managementRole, "documents:upload")}
        canDelete={hasManagementPermission(user.managementRole, "documents:delete")}
      />
    </div>
  );
}
