import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ORG_NAME } from "@/lib/constants/app";
import { ATTENDANCE_STATUS_LABELS, MEETING_TYPE_LABELS } from "@/lib/constants/management";
import type { MinutesDetail } from "@/services/management/minutes.service";

Font.registerHyphenationCallback((word) => [word]);

const BRAND = "#1a0d90";
const INK = "#0f1435";
const MUTED = "#5e6485";
const BORDER = "#e4e6f0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  logo: { width: 50, height: 50 },
  org: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: BRAND },
  docTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 5 },
  meta: { fontSize: 8.5, color: MUTED, marginTop: 2 },
  h2: {
    fontSize: 11.5,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  info: { width: "50%", marginBottom: 5 },
  infoLabel: { fontSize: 7.5, color: MUTED, textTransform: "uppercase" },
  infoValue: { fontSize: 9.5, marginTop: 1 },
  para: { fontSize: 9.5, marginBottom: 5, textAlign: "justify" },
  muted: { fontSize: 9, color: MUTED, fontStyle: "italic" },
  point: { marginBottom: 12 },
  pointTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  label: { fontSize: 7.5, color: MUTED, textTransform: "uppercase", marginTop: 4 },
  decision: {
    backgroundColor: "#f4f5fa",
    borderLeftWidth: 2.5,
    borderLeftColor: BRAND,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  twoCol: { flexDirection: "row", gap: 20 },
  col: { flex: 1 },
  nameRow: { fontSize: 9, marginBottom: 2 },
  signatures: { flexDirection: "row", gap: 40, marginTop: 34 },
  sign: { flex: 1 },
  signLine: { borderTopWidth: 1, borderTopColor: INK, marginTop: 40, paddingTop: 4 },
  signLabel: { fontSize: 8, color: MUTED },
  signName: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: MUTED,
  },
  draft: {
    position: "absolute",
    top: 300,
    left: 90,
    fontSize: 72,
    color: "#eceef7",
    transform: "rotate(-30deg)",
  },
});

const LOGO = path.join(process.cwd(), "public", "assets", "logo-fjcs.png");

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/** Paragraphe libre, ou mention explicite quand la section n'a pas été remplie. */
function Para({ text }: { text: string | null }) {
  if (!text) return <Text style={styles.muted}>Non renseigné.</Text>;
  return (
    <>
      {text.split("\n").map((line, i) =>
        line.trim() ? (
          <Text key={i} style={styles.para}>
            {line}
          </Text>
        ) : null,
      )}
    </>
  );
}

export function MinutesDocument({
  minutes,
  generatedAt,
}: {
  minutes: MinutesDetail;
  generatedAt: Date;
}) {
  const { meeting } = minutes;
  const present = meeting.attendances.filter(
    (a) => a.status === "PRESENT" || a.status === "RETARD",
  );
  const absent = meeting.attendances.filter(
    (a) => a.status === "ABSENT" || a.status === "EXCUSE",
  );
  const isDraft = minutes.status !== "VALIDE" && minutes.status !== "ARCHIVE";

  return (
    <Document
      title={`Procès-verbal - ${meeting.reference}`}
      author={ORG_NAME}
      creator={ORG_NAME}
    >
      <Page size="A4" style={styles.page}>
        {isDraft ? (
          <Text style={styles.draft} fixed>
            PROJET
          </Text>
        ) : null}

        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- <Image> de react-pdf, pas une balise HTML */}
          <Image src={LOGO} style={styles.logo} />
          <View>
            <Text style={styles.org}>{ORG_NAME.toUpperCase()}</Text>
            <Text style={styles.docTitle}>PROCÈS-VERBAL DE RÉUNION</Text>
            <Text style={styles.meta}>
              {meeting.reference} · version {minutes.version}
              {minutes.validatedAt
                ? ` · validé le ${format(minutes.validatedAt, "d MMMM yyyy", { locale: fr })}`
                : " · document de travail, non validé"}
            </Text>
          </View>
        </View>

        <Text style={styles.h2}>Informations générales</Text>
        <View style={styles.infoGrid}>
          <Info label="Réunion" value={meeting.title} />
          <Info label="Type" value={MEETING_TYPE_LABELS[meeting.type]} />
          <Info label="Date" value={format(meeting.startsAt, "EEEE d MMMM yyyy", { locale: fr })} />
          <Info
            label="Horaire"
            value={`${format(meeting.startsAt, "HH'h'mm")}${
              meeting.endsAt ? ` — ${format(meeting.endsAt, "HH'h'mm")}` : ""
            }`}
          />
          <Info label="Lieu" value={meeting.location ?? "Non précisé"} />
          <Info label="Commission" value={meeting.commission?.name ?? "Aucune"} />
          <Info
            label="Président de séance"
            value={
              minutes.chair ? `${minutes.chair.firstName} ${minutes.chair.lastName}` : "Non désigné"
            }
          />
          <Info
            label="Secrétaire de séance"
            value={
              minutes.secretary
                ? `${minutes.secretary.firstName} ${minutes.secretary.lastName}`
                : "Non désigné"
            }
          />
        </View>

        <Text style={styles.h2}>Participants</Text>
        {meeting.attendances.length === 0 ? (
          <Text style={styles.muted}>Aucune présence n&apos;a été pointée pour cette séance.</Text>
        ) : (
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>Présents ({present.length})</Text>
              {present.map((a) => (
                <Text key={a.member.id} style={styles.nameRow}>
                  {a.member.lastName} {a.member.firstName}
                  {a.member.role ? `, ${a.member.role}` : ""}
                  {a.status === "RETARD" ? " (retard)" : ""}
                </Text>
              ))}
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Absents et excusés ({absent.length})</Text>
              {absent.length === 0 ? <Text style={styles.nameRow}>—</Text> : null}
              {absent.map((a) => (
                <Text key={a.member.id} style={styles.nameRow}>
                  {a.member.lastName} {a.member.firstName} —{" "}
                  {ATTENDANCE_STATUS_LABELS[a.status].toLowerCase()}
                </Text>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.h2}>Ordre du jour</Text>
        {meeting.agenda.length === 0 ? (
          <Text style={styles.muted}>Aucun point n&apos;a été inscrit à l&apos;ordre du jour.</Text>
        ) : (
          meeting.agenda.map((item) => (
            <Text key={item.id} style={styles.nameRow}>
              {item.position + 1}. {item.title}
            </Text>
          ))
        )}

        <Text style={styles.h2}>Introduction</Text>
        <Para text={minutes.introduction} />

        <Text style={styles.h2}>Déroulement</Text>
        {minutes.proceedings ? <Para text={minutes.proceedings} /> : null}
        {meeting.agenda.map((item) => {
          const decisions = meeting.decisions.filter((d) => d.agendaItemId === item.id);
          return (
            <View key={item.id} style={styles.point} wrap={false}>
              <Text style={styles.pointTitle}>
                {item.position + 1}. {item.title}
              </Text>
              <Text style={styles.label}>Discussion</Text>
              <Para text={item.discussion} />
              {decisions.length > 0 ? (
                <View style={styles.decision}>
                  <Text style={styles.label}>Décision</Text>
                  {decisions.map((d) => (
                    <Text key={d.id} style={styles.para}>
                      {d.title}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}

        <Text style={styles.h2}>Observations</Text>
        <Para text={minutes.observations} />

        <Text style={styles.h2}>Questions diverses</Text>
        <Para text={minutes.misc} />

        <Text style={styles.h2}>Clôture</Text>
        <Para text={minutes.conclusion} />

        <View style={styles.signatures} wrap={false}>
          <View style={styles.sign}>
            <View style={styles.signLine}>
              <Text style={styles.signLabel}>Le président de séance</Text>
              <Text style={styles.signName}>
                {minutes.chair ? `${minutes.chair.firstName} ${minutes.chair.lastName}` : ""}
              </Text>
            </View>
          </View>
          <View style={styles.sign}>
            <View style={styles.signLine}>
              <Text style={styles.signLabel}>Le secrétaire de séance</Text>
              <Text style={styles.signName}>
                {minutes.secretary
                  ? `${minutes.secretary.firstName} ${minutes.secretary.lastName}`
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            {ORG_NAME} · {meeting.reference} · généré le{" "}
            {format(generatedAt, "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
