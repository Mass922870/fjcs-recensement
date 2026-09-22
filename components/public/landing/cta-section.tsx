import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="border-border border-t">
      <div className="container-page py-16 sm:py-20">
        <div className="bg-brand-700 relative overflow-hidden rounded-3xl px-6 py-12 text-white sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-cyan-300/20 blur-3xl"
          />
          <div className="relative max-w-2xl space-y-5">
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Votre voix compte. Faites partie du recensement.
            </h2>
            <p className="text-base leading-relaxed text-white/80">
              Chaque réponse rend le portrait de la jeunesse de Sangalkam plus fidèle - et les
              actions du FJCS plus justes.
            </p>
            <Button
              asChild
              size="lg"
              className="text-brand-800 h-12 bg-white px-6 text-base hover:bg-cyan-50"
            >
              <Link href="/recensement">
                Participer au recensement
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
