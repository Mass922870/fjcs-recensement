import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/shared/section-heading";

const FAQ = [
  {
    q: "Qui peut participer au recensement ?",
    a: "Tous les jeunes résidant dans le village de Sangalkam (Diamaguène, Médina et Almadies, Quartier Sérère, Grande Mosquée, Tawfekh, Bakary Diop, Bayal, Darou Salam, Scale, Darou Rahmane, Fass, Dianatou, Extension Lycée, Kam 1…). Si votre quartier n'apparaît pas dans la liste, choisissez « Autre » et précisez-le.",
  },
  {
    q: "Combien de temps prend le formulaire ?",
    a: "Environ 5 minutes. Le formulaire est découpé en 7 étapes courtes et votre progression est sauvegardée sur votre appareil : vous pouvez reprendre plus tard.",
  },
  {
    q: "Que deviennent mes informations ?",
    a: "Elles sont stockées de manière sécurisée et utilisées uniquement par le FJCS pour produire des statistiques et orienter ses programmes. Elles ne sont ni vendues, ni transmises à des tiers, ni publiées individuellement.",
  },
  {
    q: "Puis-je faire modifier ou supprimer mes données ?",
    a: "Oui. Contactez le FJCS en indiquant votre identifiant de participation ; vos données seront corrigées, anonymisées ou supprimées conformément à la politique de confidentialité.",
  },
  {
    q: "Puis-je m'inscrire plusieurs fois ?",
    a: "Non. Un numéro de téléphone ne peut être associé qu'à une seule inscription afin de garantir la fiabilité des statistiques.",
  },
  {
    q: "Le recensement donne-t-il droit à un programme ou à un financement ?",
    a: "Le recensement n'est pas une candidature. En revanche, il permettra au FJCS de concevoir des programmes adaptés et de vous informer des opportunités correspondant à votre profil.",
  },
];

export function FaqSection() {
  return (
    <section className="border-border bg-muted/30 border-t">
      <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions fréquentes"
            description="Tout ce qu'il faut savoir avant de participer."
          />
          <p className="text-muted-foreground text-sm">
            Une autre question ?{" "}
            <Link
              href="/contact"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Contactez le FJCS
            </Link>
            .
          </p>
        </div>
        <Accordion
          type="single"
          collapsible
          className="border-border rounded-2xl border bg-white px-5"
        >
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="py-4 text-left text-[15px] font-medium hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
