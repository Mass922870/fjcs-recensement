import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { CensusForm } from "@/components/recensement/census-form";
import { getFormReferentials } from "@/services/referentials.service";
import { getAgeBounds, isFormOpen } from "@/services/settings.service";
import { SectionHeading } from "@/components/shared/section-heading";

export const metadata: Metadata = {
  title: "Participer au recensement",
  description:
    "Formulaire de recensement de la jeunesse de Sangalkam - 7 étapes, 5 minutes, données protégées.",
};

export const dynamic = "force-dynamic";

export default async function CensusPage() {
  const [referentials, bounds, open] = await Promise.all([
    getFormReferentials(),
    getAgeBounds(),
    isFormOpen(),
  ]);

  if (!open) {
    return (
      <main className="container-page py-20">
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <span className="bg-muted mx-auto flex size-12 items-center justify-center rounded-full">
            <Lock className="text-muted-foreground size-5" />
          </span>
          <SectionHeading
            as="h1"
            align="center"
            title="Le recensement est momentanément fermé"
            description="Merci de votre intérêt. Le formulaire rouvrira prochainement - suivez les annonces du FJCS."
          />
          <Link
            href="/"
            className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          >
            Retour à l'accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-muted/30">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <CensusForm
          referentials={referentials}
          bounds={bounds}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined}
        />
        <p className="text-muted-foreground mt-8 text-center text-xs">
          Vos réponses sont enregistrées sur votre appareil jusqu'à la validation finale. Elles ne
          sont transmises au FJCS qu'après votre consentement.
        </p>
      </div>
    </main>
  );
}
