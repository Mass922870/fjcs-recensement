import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { YouthEditForm } from "@/components/admin/youth/youth-edit-form";
import { requirePagePermission } from "@/lib/auth/session";
import { profileToFormInput } from "@/lib/youth-mappers";
import { getYouthProfileDetail } from "@/services/youth-list.service";
import { getFormReferentials } from "@/services/referentials.service";
import { getAgeBounds } from "@/services/settings.service";

export const metadata: Metadata = { title: "Modifier une fiche" };

export default async function EditYouthPage(props: PageProps<"/admin/jeunes/[id]/modifier">) {
  await requirePagePermission("youth:write");
  const { id } = await props.params;
  const [profile, referentials, bounds] = await Promise.all([
    getYouthProfileDetail(id),
    getFormReferentials(),
    getAgeBounds(),
  ]);
  if (!profile) notFound();
  if (profile.status === "ANONYMIZED") redirect(`/admin/jeunes/${id}`);

  // Bornes élargies : l'admin corrige des données, il ne les collecte pas.
  const editBounds = { minAge: Math.min(bounds.minAge, 10), maxAge: Math.max(bounds.maxAge, 60) };

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/admin/jeunes/${id}`}
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour à la fiche
      </Link>
      <PageHeader
        title={`Modifier - ${profile.lastName.toUpperCase()} ${profile.firstName}`}
        description={`${profile.participationCode} · chaque modification est journalisée.`}
      />
      <YouthEditForm
        id={id}
        initialValues={profileToFormInput(profile)}
        referentials={referentials}
        bounds={editBounds}
      />
    </div>
  );
}
