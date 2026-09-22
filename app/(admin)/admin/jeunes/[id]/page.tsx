import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { YouthActions } from "@/components/admin/youth/youth-actions";
import {
  DemoBadge,
  EmploymentBadge,
  ProfileStatusBadge,
  TagBadge,
} from "@/components/admin/youth/youth-badges";
import { requirePagePermission } from "@/lib/auth/session";
import { hasPermission, permissionsForRole } from "@/lib/auth/rbac";
import { computeAge } from "@/lib/age";
import { formatPhone } from "@/lib/phone";
import { GENDER_LABELS } from "@/lib/constants/referentials";
import { getYouthHistory, getYouthProfileDetail } from "@/services/youth-list.service";
import { AUDIT_ACTION_LABELS } from "@/lib/constants/audit";

export const metadata: Metadata = { title: "Fiche jeune" };

export default async function YouthDetailPage(props: PageProps<"/admin/jeunes/[id]">) {
  const user = await requirePagePermission("youth:read");
  const { id } = await props.params;
  const [profile, history] = await Promise.all([getYouthProfileDetail(id), getYouthHistory(id)]);
  if (!profile) notFound();

  const canSeePersonal = hasPermission(user.role, "youth:read-personal");
  const age = computeAge(profile.birthDate);
  const isEntrepreneur = profile.employment?.status.kind === "ENTREPRENEUR";

  // Badges de synthèse : situation, domaines de compétences, besoins clés.
  const skillCategories = [...new Map(profile.skills.map((s) => [s.skill.category.id, s.skill.category])).values()];
  const keyNeeds = profile.needs.map((n) => n.need.label);

  return (
    <>
      <Link
        href="/admin/jeunes"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Retour à la liste
      </Link>

      <PageHeader
        title={
          canSeePersonal || profile.status === "ANONYMIZED"
            ? `${profile.lastName.toUpperCase()} ${profile.firstName}`
            : `Profil ${profile.participationCode}`
        }
        description={`${profile.participationCode} · inscrit le ${format(profile.createdAt, "d MMMM yyyy", { locale: fr })}`}
        actions={
          <YouthActions
            id={profile.id}
            status={profile.status}
            permissions={permissionsForRole(user.role)}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <ProfileStatusBadge status={profile.status} />
        {profile.isDemo ? <DemoBadge /> : null}
        {profile.employment ? <EmploymentBadge status={profile.employment.status} /> : null}
        {skillCategories.map((c) => (
          <TagBadge key={c.id} tone="brand">
            {c.label}
          </TagBadge>
        ))}
        {keyNeeds.slice(0, 3).map((n) => (
          <TagBadge key={n} tone="warm">
            {n}
          </TagBadge>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Informations personnelles">
            <Grid>
              <Item label="Âge" value={`${age} ans`} />
              <Item label="Sexe" value={GENDER_LABELS[profile.gender]} />
              <Item
                label="Date de naissance"
                value={
                  canSeePersonal
                    ? format(profile.birthDate, "d MMMM yyyy", { locale: fr })
                    : `Année ${profile.birthDate.getFullYear()}`
                }
              />
              <Item
                label="Quartier"
                value={profile.quartier?.name ?? profile.quartierOther ?? "-"}
                icon={MapPin}
              />
              {canSeePersonal ? (
                <>
                  <Item
                    label="Téléphone"
                    value={
                      profile.phoneNormalized ? formatPhone(profile.phoneNormalized) : profile.phone
                    }
                    icon={Phone}
                  />
                  <Item label="E-mail" value={profile.email ?? "-"} icon={Mail} />
                </>
              ) : (
                <Item label="Coordonnées" value="Masquées pour votre rôle" muted />
              )}
              {profile.quartier?.slug === "autre" && profile.quartierOther ? (
                <Item label="Précision quartier" value={profile.quartierOther} />
              ) : null}
            </Grid>
          </Section>

          <Section title="Formation">
            <Grid>
              <Item
                label="Niveau d'études"
                value={profile.education?.level.label ?? "-"}
              />
              <Item label="Domaine" value={profile.education?.field ?? "-"} />
              <Item label="Établissement" value={profile.education?.institution ?? "-"} />
              <Item label="Diplôme obtenu" value={profile.education?.diploma ?? "-"} />
              <Item
                label="Formation professionnelle"
                value={profile.education?.vocationalTraining ?? "-"}
                wide
              />
              <Item
                label="Autres formations"
                value={profile.education?.otherTraining ?? "-"}
                wide
              />
            </Grid>
          </Section>

          <Section title="Situation professionnelle">
            <Grid>
              <Item
                label="Situation"
                value={
                  profile.employment ? <EmploymentBadge status={profile.employment.status} /> : "-"
                }
              />
              {profile.employment?.otherDetail ? (
                <Item label="Précision" value={profile.employment.otherDetail} />
              ) : null}
            </Grid>
          </Section>

          {isEntrepreneur ? (
            <Section title="Projet / activité entrepreneuriale">
              {profile.project ? (
                <Grid>
                  <Item label="Domaine d'activité" value={profile.project.sector} />
                  <Item label="Nom de l'activité" value={profile.project.name ?? "-"} />
                  <Item
                    label="Formalisée"
                    value={profile.project.isFormalized ? "Oui" : "Non (informelle)"}
                  />
                  <Item
                    label="Ancienneté"
                    value={
                      profile.project.sinceMonths != null
                        ? `${profile.project.sinceMonths} mois`
                        : "-"
                    }
                  />
                  <Item
                    label="Personnes impliquées"
                    value={
                      profile.project.teamSize != null ? String(profile.project.teamSize) : "-"
                    }
                  />
                </Grid>
              ) : (
                <p className="text-muted-foreground text-sm">Aucun détail d'activité renseigné.</p>
              )}
            </Section>
          ) : null}

          <Section title="Compétences">
            {profile.skills.length || profile.customSkills ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <TagBadge key={s.skillId} tone="brand">
                    {s.skill.label}
                  </TagBadge>
                ))}
                {profile.customSkills ? (
                  <TagBadge tone="neutral">{profile.customSkills}</TagBadge>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucune compétence déclarée.</p>
            )}
          </Section>

          <Section title="Centres d'intérêt">
            {profile.interests.length || profile.customInterests ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((i) => (
                  <TagBadge key={i.interestId} tone="cyan">
                    {i.interest.label}
                  </TagBadge>
                ))}
                {profile.customInterests ? (
                  <TagBadge tone="neutral">{profile.customInterests}</TagBadge>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun centre d'intérêt déclaré.</p>
            )}
          </Section>

          <Section title="Besoins exprimés">
            {profile.needs.length ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.needs.map((n) => (
                  <TagBadge key={n.needId} tone="warm">
                    {n.need.label}
                  </TagBadge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun besoin exprimé.</p>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Consentement">
            {profile.consent ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Accepté</dt>
                  <dd className="font-medium">{profile.consent.accepted ? "Oui" : "Non"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd>{format(profile.consent.acceptedAt, "d MMM yyyy HH:mm", { locale: fr })}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Version du texte</dt>
                  <dd className="font-mono text-xs">{profile.consent.textVersion}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun consentement enregistré.</p>
            )}
          </Section>

          <Section title="Origine">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Source</dt>
                <dd>
                  {profile.source === "PUBLIC"
                    ? "Formulaire public"
                    : profile.source === "ADMIN"
                      ? `Saisie admin${profile.createdBy ? ` (${profile.createdBy.name})` : ""}`
                      : "Démonstration"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Dernière modification</dt>
                <dd>{formatDistanceToNow(profile.updatedAt, { addSuffix: true, locale: fr })}</dd>
              </div>
            </dl>
          </Section>

          <Section title="Historique">
            {history.length ? (
              <ol className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="flex gap-3 text-sm">
                    <span className="bg-brand-300 mt-1.5 size-2 shrink-0 rounded-full" />
                    <div>
                      <p className="text-foreground font-medium">{AUDIT_ACTION_LABELS[h.action]}</p>
                      <p className="text-muted-foreground text-xs">
                        {format(h.createdAt, "d MMM yyyy HH:mm", { locale: fr })}
                        {h.actor ? ` · ${h.actor.name}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun événement.</p>
            )}
          </Section>

          {profile.status !== "ANONYMIZED" && hasPermission(user.role, "youth:write") ? (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/admin/jeunes/${profile.id}/modifier`}>Modifier la fiche</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border rounded-2xl border bg-white">
      <h2 className="border-border/70 text-foreground border-b px-5 py-3 text-sm font-semibold">
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>;
}

function Item({
  label,
  value,
  icon: Icon,
  wide,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  wide?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd
        className={`mt-1 flex items-center gap-1.5 text-sm ${muted ? "text-muted-foreground italic" : "text-foreground"}`}
      >
        {Icon ? <Icon className="text-muted-foreground size-3.5" /> : null}
        {value}
      </dd>
    </div>
  );
}
