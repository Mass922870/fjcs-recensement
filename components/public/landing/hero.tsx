import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  GraduationCap,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ORG_NAME } from "@/lib/constants/app";

const DIMENSIONS = [
  { icon: Users, label: "Profil", hint: "Âge, quartier, situation" },
  { icon: GraduationCap, label: "Formation", hint: "Niveau, domaine, diplômes" },
  { icon: Sparkles, label: "Compétences", hint: "Numérique, artisanat, culture…" },
  { icon: BriefcaseBusiness, label: "Emploi", hint: "Situation, recherche, stage" },
  { icon: Lightbulb, label: "Projets", hint: "Entrepreneuriat, financement" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--brand-50)_0%,transparent_70%)]"
      />
      <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="space-y-7">
          <div className="flex items-center gap-4">
            <Logo variant="emblem" className="w-20 sm:w-24" priority />
            <Logo org="ctni" variant="emblem" className="w-14 sm:w-16" />
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-cyan-600 uppercase">
              {ORG_NAME}
            </p>
            <h1 className="text-foreground text-4xl leading-[1.08] font-semibold sm:text-5xl lg:text-[3.4rem]">
              Recensement de la Jeunesse de Sangalkam
            </h1>
            <p className="text-muted-foreground max-w-xl text-lg leading-relaxed">
              Construire une meilleure connaissance de notre jeunesse pour mieux répondre à ses
              besoins.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link href="/recensement">
                Participer au recensement
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link href="#pourquoi">En savoir plus</Link>
            </Button>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-green-600" aria-hidden />5 minutes · données
            protégées · réservé aux jeunes de Sangalkam
          </p>
        </div>

        <div className="relative" aria-hidden>
          <div className="from-brand-50 absolute -inset-6 -z-10 hidden rounded-[2rem] bg-gradient-to-br via-white to-cyan-50 lg:block" />
          <div className="border-border rounded-2xl border bg-white p-5 shadow-[0_20px_60px_-30px_rgba(26,13,144,0.35)] sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-foreground text-sm font-semibold">Ce que nous recensons</p>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                Statistiques anonymisées
              </span>
            </div>
            <ul className="divide-border divide-y">
              {DIMENSIONS.map(({ icon: Icon, label, hint }) => (
                <li key={label} className="flex items-center gap-4 py-3.5">
                  <span className="bg-brand-50 text-brand-700 flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-foreground text-sm font-medium">{label}</p>
                    <p className="text-muted-foreground truncate text-xs">{hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
