import { Compass, DoorOpen, HeartHandshake, Search, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const REASONS = [
  {
    icon: Search,
    title: "Mieux connaître la jeunesse",
    text: "Qui sont les jeunes de Sangalkam, où vivent-ils, que font-ils ? Une photographie fidèle pour sortir des intuitions.",
  },
  {
    icon: Sparkles,
    title: "Identifier les compétences",
    text: "Numérique, artisanat, culture, sport… Révéler les talents présents dans le village et les valoriser.",
  },
  {
    icon: HeartHandshake,
    title: "Comprendre les besoins",
    text: "Formation, emploi, accompagnement, financement : mesurer les attentes réelles pour y répondre.",
  },
  {
    icon: DoorOpen,
    title: "Faciliter l'accès aux opportunités",
    text: "Mettre les bonnes informations et les bons programmes devant les bonnes personnes, au bon moment.",
  },
  {
    icon: Compass,
    title: "Orienter les futurs projets",
    text: "Construire les actions du FJCS sur des données solides plutôt que sur des suppositions.",
  },
];

export function WhySection() {
  return (
    <section id="pourquoi" className="border-border bg-muted/30 scroll-mt-20 border-t">
      <div className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Pourquoi ce recensement ?"
          title="Un outil au service de la jeunesse de Sangalkam"
          description="Le recensement n'est pas une simple formalité : c'est la première étape d'une stratégie jeunesse fondée sur des faits."
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="group border-border rounded-2xl border bg-white p-6 transition-shadow hover:shadow-[0_12px_40px_-24px_rgba(26,13,144,0.4)]"
            >
              <span className="bg-brand-50 text-brand-700 group-hover:bg-brand-700 mb-4 flex size-11 items-center justify-center rounded-xl transition-colors group-hover:text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-foreground text-base font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
