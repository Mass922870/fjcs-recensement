import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ORG_NAME } from "@/lib/constants/app";
import {
  ATTENDANCE_METHOD_LABELS,
  ATTENDANCE_STATUS_LABELS,
  MEETING_TYPE_LABELS,
} from "@/lib/constants/management";
import type { AttendanceSheet } from "@/services/management/attendance.service";

// Pas de césure automatique (évite « pré-sence »).
Font.registerHyphenationCallback((word) => [word]);

const BRAND = "#1a0d90";
const INK = "#0f1435";
const MUTED = "#5e6485";
const BORDER = "#e4e6f0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: INK,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  logo: { width: 50, height: 50 },
  org: { fontSize: 11, fontFamily: "Helvetica-Bold", color: BRAND },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", marginTop: 6 },
  meta: { fontSize: 9, color: MUTED, marginTop: 2 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  info: { width: "50%", marginBottom: 5 },
  infoLabel: { fontSize: 7.5, color: MUTED, textTransform: "uppercase" },
  infoValue: { fontSize: 9.5, marginTop: 1 },
  kpiRow: { flexDirection: "row", gap: 7, marginBottom: 16 },
  kpi: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 5, padding: 7 },
  kpiLabel: { fontSize: 7, color: MUTED },
  kpiValue: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 2 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#f4f5fa",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
    paddingVertical: 5,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 5,
    minHeight: 20,
  },
  th: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: MUTED, paddingHorizontal: 4 },
  td: { fontSize: 8.5, paddingHorizontal: 4 },
  cName: { width: "28%" },
  cRole: { width: "22%" },
  cStatus: { width: "14%" },
  cTime: { width: "11%" },
  cMethod: { width: "14%" },
  signatures: { flexDirection: "row", gap: 40, marginTop: 28 },
  sign: { flex: 1 },
  signLine: { borderTopWidth: 1, borderTopColor: INK, marginTop: 38, paddingTop: 4 },
  signLabel: { fontSize: 8, color: MUTED },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: MUTED,
  },
});

const LOGO = path.join(process.cwd(), "public", "assets", "logo-fjcs.png");

function hhmm(d: Date | null | undefined): string {
  if (!d) return "—";
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

export function AttendanceSheetDocument({
  sheet,
  generatedAt,
}: {
  sheet: AttendanceSheet;
  generatedAt: Date;
}) {
  const { meeting, rows, counts, rate } = sheet;

  return (
    <Document
      title={`Feuille de présence - ${meeting.reference}`}
      author={ORG_NAME}
      creator={ORG_NAME}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- <Image> de react-pdf, pas une balise HTML */}
          <Image src={LOGO} style={styles.logo} />
          <View>
            <Text style={styles.org}>{ORG_NAME.toUpperCase()}</Text>
            <Text style={styles.title}>FEUILLE DE PRÉSENCE</Text>
            <Text style={styles.meta}>Référence {meeting.reference}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <Info label="Réunion" value={meeting.title} />
          <Info label="Type" value={MEETING_TYPE_LABELS[meeting.type]} />
          <Info
            label="Date"
            value={format(meeting.startsAt, "EEEE d MMMM yyyy", { locale: fr })}
          />
          <Info
            label="Horaire"
            value={`${hhmm(meeting.startsAt)}${meeting.endsAt ? ` — ${hhmm(meeting.endsAt)}` : ""}`}
          />
          <Info label="Lieu" value={meeting.location ?? "Non précisé"} />
          <Info label="Participants attendus" value={String(counts.expected)} />
        </View>

        <View style={styles.kpiRow}>
          <Kpi label="Attendus" value={String(counts.expected)} />
          <Kpi label="Présents" value={String(counts.present)} />
          <Kpi label="Retards" value={String(counts.late)} />
          <Kpi label="Excusés" value={String(counts.excused)} />
          <Kpi label="Absents" value={String(counts.absent)} />
          <Kpi label="Taux de présence" value={rate === null ? "—" : `${rate} %`} />
        </View>

        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.cName]}>Participant</Text>
          <Text style={[styles.th, styles.cRole]}>Fonction</Text>
          <Text style={[styles.th, styles.cStatus]}>Statut</Text>
          <Text style={[styles.th, styles.cTime]}>Arrivée</Text>
          <Text style={[styles.th, styles.cTime]}>Départ</Text>
          <Text style={[styles.th, styles.cMethod]}>Méthode</Text>
        </View>

        {rows.map((row) => (
          <View key={row.member.id} style={styles.row} wrap={false}>
            <Text style={[styles.td, styles.cName]}>
              {row.member.lastName} {row.member.firstName}
            </Text>
            <Text style={[styles.td, styles.cRole]}>{row.member.role ?? "Membre"}</Text>
            <Text style={[styles.td, styles.cStatus]}>
              {row.attendance ? ATTENDANCE_STATUS_LABELS[row.attendance.status] : "Non renseigné"}
            </Text>
            <Text style={[styles.td, styles.cTime]}>{hhmm(row.attendance?.arrivedAt)}</Text>
            <Text style={[styles.td, styles.cTime]}>{hhmm(row.attendance?.leftAt)}</Text>
            <Text style={[styles.td, styles.cMethod]}>
              {row.attendance ? ATTENDANCE_METHOD_LABELS[row.attendance.method] : "—"}
            </Text>
          </View>
        ))}

        <View style={styles.signatures}>
          <View style={styles.sign}>
            <View style={styles.signLine}>
              <Text style={styles.signLabel}>Le président de séance</Text>
            </View>
          </View>
          <View style={styles.sign}>
            <View style={styles.signLine}>
              <Text style={styles.signLabel}>Le secrétaire de séance</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            {ORG_NAME} · document généré le{" "}
            {format(generatedAt, "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
