import type { Metadata } from "next";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/shared/section-heading";
import { SETTING_KEYS } from "@/lib/constants/settings";
import { ORG_COMMISSION, ORG_NAME } from "@/lib/constants/app";
import { getSettings } from "@/services/settings.service";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contacter le Foyer des Jeunes et de la Culture de Sangalkam.",
};

// Les coordonnées et la durée de conservation viennent des Paramètres (base de données).
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const s = await getSettings();
  const email = s[SETTING_KEYS.CONTACT_EMAIL];
  const phone = s[SETTING_KEYS.CONTACT_PHONE];
  const address = s[SETTING_KEYS.CONTACT_ADDRESS];

  return (
    <main className="container-page py-14 sm:py-20">
      <SectionHeading
        as="h1"
        eyebrow="Contact"
        title="Contacter le FJCS"
        description={`Une question sur le recensement, vos données ou les activités du ${ORG_NAME} ? L'équipe de la ${ORG_COMMISSION} vous répond.`}
      />

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <ContactCard icon={Mail} title="E-mail">
          <a href={`mailto:${email}`} className="text-primary break-all hover:underline">
            {email}
          </a>
        </ContactCard>
        <ContactCard icon={Phone} title="Téléphone">
          {phone ? (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-primary hover:underline">
              {phone}
            </a>
          ) : (
            <span className="text-muted-foreground">Numéro communiqué prochainement</span>
          )}
        </ContactCard>
        <ContactCard icon={MapPin} title="Adresse">
          <span>{address}</span>
        </ContactCard>
      </div>

      <div className="border-border bg-muted/40 mt-10 flex max-w-3xl gap-4 rounded-2xl border p-6">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-600" aria-hidden />
        <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
          <p className="text-foreground font-medium">Demande relative à vos données personnelles</p>
          <p>
            Pour consulter, corriger, anonymiser ou supprimer vos informations, envoyez un e-mail à{" "}
            <a href={`mailto:${email}`} className="text-primary font-medium hover:underline">
              {email}
            </a>{" "}
            en précisant votre identifiant de participation ou votre numéro de téléphone. Voir la{" "}
            <Link href="/confidentialite" className="text-primary font-medium hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}

function ContactCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-border rounded-2xl border bg-white p-6">
      <span className="bg-brand-50 text-brand-700 mb-4 flex size-10 items-center justify-center rounded-lg">
        <Icon className="size-5" />
      </span>
      <h2 className="text-foreground text-sm font-semibold">{title}</h2>
      <p className="mt-1.5 text-sm">{children}</p>
    </div>
  );
}
