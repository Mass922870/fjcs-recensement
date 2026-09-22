import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { FormOpenToggle } from "@/components/admin/settings/form-open-toggle";
import { RetentionPanel } from "@/components/admin/settings/retention-panel";
import { PasswordForm } from "@/components/admin/settings/password-form";
import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requirePagePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/rbac";
import { SETTING_KEYS } from "@/lib/constants/settings";
import { getSettings } from "@/services/settings.service";
import { countExpiredProfiles } from "@/services/youth.service";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await requirePagePermission("settings:manage");
  const settings = await getSettings();
  const months = Number(settings[SETTING_KEYS.RETENTION_MONTHS]);
  const expired = await countExpiredProfiles(months);

  return (
    <>
      <PageHeader
        title="Paramètres"
        description="Configuration du recensement, protection des données, référentiels et compte."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <FormOpenToggle initialOpen={settings[SETTING_KEYS.FORM_OPEN] === "true"} />
          <SettingsForm
            initial={{
              minAge: Number(settings[SETTING_KEYS.MIN_AGE]),
              maxAge: Number(settings[SETTING_KEYS.MAX_AGE]),
              formOpen: settings[SETTING_KEYS.FORM_OPEN] === "true",
              retentionMonths: months,
              contactEmail: settings[SETTING_KEYS.CONTACT_EMAIL],
              contactPhone: settings[SETTING_KEYS.CONTACT_PHONE],
              contactAddress: settings[SETTING_KEYS.CONTACT_ADDRESS],
            }}
          />
        </div>
        <div className="space-y-6">
          <RetentionPanel
            months={months}
            expired={expired}
            canApply={hasPermission(user.role, "youth:anonymize")}
          />
          <ReferentialsCard />
          <PasswordForm />
        </div>
      </div>
    </>
  );
}

function ReferentialsCard() {
  return (
    <section className="rounded-2xl border border-border bg-white p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <ListChecks className="size-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Référentiels du formulaire</h2>
          <p className="text-xs text-muted-foreground">Quartiers, niveaux, situations, compétences, besoins, intérêts, secteurs.</p>
        </div>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Ajoutez, renommez, réordonnez, activez ou supprimez chaque choix proposé aux jeunes - sans toucher au code.
      </p>
      <Button asChild variant="outline" className="w-full">
        <Link href="/admin/parametres/referentiels">
          Gérer les référentiels
          <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    </section>
  );
}
