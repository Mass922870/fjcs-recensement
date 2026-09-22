import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARTICIPATION_CODE_REGEX } from "@/lib/participation-code";
import { CopyButton } from "@/components/shared/copy-button";

export const metadata: Metadata = {
  title: "Merci pour votre participation",
};

export default async function ConfirmationPage(props: PageProps<"/confirmation">) {
  const { code } = await props.searchParams;
  const participationCode = typeof code === "string" ? code : undefined;
  if (!participationCode || !PARTICIPATION_CODE_REGEX.test(participationCode)) notFound();

  return (
    <main className="container-page flex flex-1 items-center py-16 sm:py-24">
      <div className="mx-auto w-full max-w-xl space-y-8 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <div className="space-y-3">
          <h1 className="text-foreground text-3xl font-semibold sm:text-4xl">
            Merci pour votre participation !
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Votre contribution nous aide à mieux comprendre les besoins et les aspirations de la
            jeunesse de Sangalkam.
          </p>
        </div>

        <div className="border-border rounded-2xl border bg-white p-6 text-left">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.14em] uppercase">
            Votre identifiant de participation
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-brand-800 font-mono text-2xl font-semibold tracking-wider">
              {participationCode}
            </p>
            <CopyButton value={participationCode} label="Copier l'identifiant">
              <Copy />
            </CopyButton>
          </div>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Conservez-le : il vous permettra de demander la consultation, la correction ou la
            suppression de vos données auprès du FJCS. Il ne contient aucune information
            personnelle.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" variant="outline" className="h-11">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
          <Button asChild size="lg" className="h-11">
            <Link href="/contact">Contacter le FJCS</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
