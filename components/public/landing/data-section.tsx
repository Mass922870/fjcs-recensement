import { ArrowRight, BarChart3, Database, Lightbulb, Target } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const CHAIN = [
  { icon: Database, label: "Données", text: "Chaque réponse est structurée et sécurisée." },
  {
    icon: BarChart3,
    label: "Information",
    text: "Les réponses deviennent des statistiques lisibles.",
  },
  { icon: Lightbulb, label: "Analyse", text: "Le FJCS croise les données pour comprendre." },
  { icon: Target, label: "Action", text: "Des programmes ciblés, puis une mesure de l'impact." },
];

export function DataSection() {
  return (
    <section className="border-border border-t">
      <div className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          eyebrow="Les données au service de l'action"
          title="Des réponses individuelles à une vision collective"
          description="Les informations recueillies permettent au FJCS de mieux comprendre les réalités de la jeunesse de Sangalkam et d'orienter ses actions : formations proposées, accompagnement des porteurs de projets, partenariats, plaidoyer auprès des institutions. Aucune donnée individuelle n'est publiée : seules des tendances agrégées sont utilisées."
        />
        <ol className="grid gap-3 sm:grid-cols-2">
          {CHAIN.map(({ icon: Icon, label, text }, i) => (
            <li key={label} className="border-border relative rounded-2xl border bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-muted-foreground font-mono text-xs">0{i + 1}</span>
              </div>
              <p className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
                {label}
                {i < CHAIN.length - 1 ? (
                  <ArrowRight className="text-muted-foreground size-3.5" aria-hidden />
                ) : null}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
