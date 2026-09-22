import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/shared/section-heading";
import { SETTING_KEYS } from "@/lib/constants/settings";
import { ORG_NAME } from "@/lib/constants/app";
import { getSettings } from "@/services/settings.service";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment le FJCS collecte, utilise, protège et conserve les données du recensement de la jeunesse de Sangalkam.",
};

// Les coordonnées et la durée de conservation viennent des Paramètres (base de données).
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const settings = await getSettings();
  const retention = settings[SETTING_KEYS.RETENTION_MONTHS];
  const email = settings[SETTING_KEYS.CONTACT_EMAIL];

  return (
    <main className="container-page py-14 sm:py-20">
      <SectionHeading
        as="h1"
        eyebrow="Protection des données"
        title="Politique de confidentialité"
        description={`Cette politique explique comment le ${ORG_NAME} (FJCS) traite les informations recueillies dans le cadre du recensement de la jeunesse.`}
      />

      <article className="prose-fjcs mt-10 max-w-3xl space-y-10">
        <Section title="1. Responsable du traitement">
          <p>
            Le responsable du traitement est le {ORG_NAME}, représenté par sa Commission
            Transformation Numérique et Innovation. Contact :{" "}
            <a href={`mailto:${email}`}>{email}</a>.
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>Le formulaire de recensement recueille, avec votre consentement explicite :</p>
          <ul>
            <li>
              identité et contact : prénom, nom, date de naissance, sexe, téléphone, e-mail
              (facultatif), quartier ;
            </li>
            <li>
              parcours de formation : niveau, domaine, établissement, diplômes, formations suivies ;
            </li>
            <li>situation professionnelle et, le cas échéant, activité entrepreneuriale ;</li>
            <li>compétences, centres d'intérêt et besoins déclarés.</li>
          </ul>
          <p>
            Aucune donnée dite sensible (santé, opinions, religion, appartenance ethnique) n'est
            demandée. Aucune localisation précise n'est collectée : seul le quartier est enregistré.
          </p>
        </Section>

        <Section title="3. Finalités">
          <ul>
            <li>établir une connaissance statistique de la jeunesse de Sangalkam ;</li>
            <li>
              identifier les compétences, besoins et projets afin de concevoir des programmes
              adaptés ;
            </li>
            <li>informer les jeunes recensés des opportunités correspondant à leur profil ;</li>
            <li>produire des rapports agrégés et anonymisés pour les partenaires du FJCS.</li>
          </ul>
          <p>
            Les données ne sont jamais vendues, ni utilisées à des fins commerciales ou
            publicitaires.
          </p>
        </Section>

        <Section title="4. Base légale et cadre applicable">
          <p>
            Le traitement repose sur votre consentement, recueilli par une case à cocher obligatoire
            avant validation du formulaire. Il est mené dans le respect de la loi sénégalaise n°
            2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel et des
            recommandations de la Commission de protection des Données Personnelles (CDP).
          </p>
        </Section>

        <Section title="5. Accès aux données">
          <p>
            Seuls les membres habilités du FJCS accèdent aux données individuelles, selon des rôles
            distincts (administration, analyse, lecture). Chaque accès, modification ou export est
            journalisé. Les statistiques publiques ne contiennent jamais d'information permettant
            d'identifier une personne.
          </p>
        </Section>

        <Section title="6. Sécurité">
          <p>
            Les données sont hébergées sur une base sécurisée, chiffrées en transit, protégées par
            authentification forte et limitation des tentatives. Les adresses IP sont hachées dans
            les journaux et jamais conservées en clair.
          </p>
        </Section>

        <Section title="7. Durée de conservation">
          <p>
            Les données individuelles sont conservées pendant {retention} mois à compter de
            l'inscription, puis anonymisées : les informations identifiantes sont supprimées et
            seules les données statistiques sont conservées. Vous pouvez demander l'anonymisation ou
            la suppression à tout moment.
          </p>
        </Section>

        <Section title="8. Vos droits">
          <p>
            Vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de
            vos données. Pour l'exercer, écrivez à <a href={`mailto:${email}`}>{email}</a> en
            indiquant votre identifiant de participation (communiqué à la fin du formulaire) ou
            votre numéro de téléphone. Le FJCS répond dans un délai maximal de 30 jours.
          </p>
        </Section>

        <Section title="9. Mise à jour">
          <p>
            Cette politique peut évoluer. La version en vigueur est celle publiée sur cette page ;
            toute modification substantielle fera l'objet d'une nouvelle demande de consentement.
          </p>
          <p className="text-muted-foreground text-sm">Dernière mise à jour : septembre 2026.</p>
        </Section>

        <p>
          <Link
            href="/contact"
            className="text-primary font-medium underline-offset-4 hover:underline"
          >
            Une question ? Contactez le FJCS →
          </Link>
        </p>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-foreground text-lg font-semibold">{title}</h2>
      <div className="text-muted-foreground [&_a]:text-primary space-y-3 text-[15px] leading-relaxed [&_a]:font-medium [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
