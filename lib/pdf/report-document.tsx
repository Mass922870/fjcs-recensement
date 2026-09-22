import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Pas de césure automatique (évite « je-unesse »).
Font.registerHyphenationCallback((word) => [word]);
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { ReportData } from "@/services/report.service";
import { ORG_NAME } from "@/lib/constants/app";

const BRAND = "#1a0d90";
const CYAN = "#0e94a8";
const GREEN = "#4f9a3c";
const INK = "#0f1435";
const MUTED = "#5e6485";
const BORDER = "#e4e6f0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  logo: { width: 54, height: 54 },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", color: BRAND },
  subtitle: { fontSize: 9, color: MUTED, marginTop: 2 },
  meta: { fontSize: 8.5, color: MUTED, marginTop: 4 },
  h2: { fontSize: 12.5, fontFamily: "Helvetica-Bold", color: INK, marginTop: 16, marginBottom: 8 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kpi: { width: "23.5%", borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 8 },
  kpiLabel: { fontSize: 7.5, color: MUTED },
  kpiValue: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 3 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  rowLabel: { width: "38%", fontSize: 8.5, color: INK, paddingRight: 6 },
  track: { flex: 1, height: 7, backgroundColor: "#f4f5fa", borderRadius: 3 },
  fill: { height: 7, borderRadius: 3 },
  rowValue: { width: 46, fontSize: 8.5, textAlign: "right", color: MUTED },
  twoCol: { flexDirection: "row", gap: 18 },
  col: { flex: 1 },
  para: { fontSize: 9.5, lineHeight: 1.5, marginBottom: 6, color: INK },
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
  note: { fontSize: 8, color: MUTED, marginTop: 4 },
});

const nf = new Intl.NumberFormat("fr-FR");

function BarList({
  rows,
  color = BRAND,
  max = 8,
  total,
}: {
  rows: { label: string; value: number }[];
  color?: string;
  max?: number;
  total?: number;
}) {
  const shown = rows.filter((r) => r.value > 0).slice(0, max);
  if (!shown.length) return <Text style={styles.note}>Aucune donnée.</Text>;
  const top = Math.max(...shown.map((r) => r.value));
  return (
    <View>
      {shown.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={styles.rowLabel}>{r.label}</Text>
          <View style={styles.track}>
            <View
              style={[styles.fill, { width: `${(r.value / top) * 100}%`, backgroundColor: color }]}
            />
          </View>
          <Text style={styles.rowValue}>
            {nf.format(r.value)}
            {total ? ` · ${Math.round((r.value / total) * 100)} %` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Header({ data }: { data: ReportData }) {
  const logoPath = path.join(process.cwd(), "public", "assets", "logo-fjcs.png");
  const ctniPath = path.join(process.cwd(), "public", "assets", "logo-ctni.png");
  const generated = format(data.generatedAt, "d MMMM yyyy 'à' HH:mm", { locale: fr });
  return (
    <View style={styles.header} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- composant react-pdf, pas de prop alt */}
      <Image src={logoPath} style={styles.logo} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Rapport général - Recensement de la jeunesse de Sangalkam</Text>
        <Text style={styles.subtitle}>
          {ORG_NAME} · Commission Transformation Numérique et Innovation
        </Text>
        <Text style={styles.meta}>
          Généré le {generated} · Période analysée : {data.periodLabel}
        </Text>
      </View>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- composant react-pdf, pas de prop alt */}
      <Image src={ctniPath} style={styles.logo} />
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>FJCS - Document interne. Données agrégées, aucune information individuelle.</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function ReportDocument({ data }: { data: ReportData }) {
  const k = data.kpis;
  const d = data.distributions;

  return (
    <Document
      title="Rapport général - Recensement de la jeunesse de Sangalkam"
      author="FJCS"
      language="fr"
    >
      <Page size="A4" style={styles.page}>
        <Header data={data} />

        <Text style={styles.h2}>1. Chiffres clés</Text>
        <View style={styles.kpiGrid}>
          {[
            ["Jeunes recensés", k.total],
            ["Nouveaux ce mois", k.newThisMonth],
            ["Entrepreneurs", k.entrepreneurs],
            ["Étudiants", k.students],
            ["Demandeurs d'emploi", k.jobSeekers],
            ["Souhaitent une formation", k.wantTraining],
            ["Activités formalisées", data.entrepreneurship.formalized],
            ["Activités informelles", data.entrepreneurship.informal],
          ].map(([label, value]) => (
            <View key={String(label)} style={styles.kpi}>
              <Text style={styles.kpiLabel}>{label}</Text>
              <Text style={styles.kpiValue}>{nf.format(Number(value))}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>2. Démographie</Text>
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.note}>Répartition par sexe</Text>
            <BarList rows={d.gender} total={k.total} />
          </View>
          <View style={styles.col}>
            <Text style={styles.note}>Répartition par tranche d'âge</Text>
            <BarList rows={d.age} color={CYAN} total={k.total} />
          </View>
        </View>
        <Text style={[styles.note, { marginTop: 8 }]}>Répartition par quartier</Text>
        <BarList rows={d.quartier} color={CYAN} max={10} total={k.total} />

        <Text style={styles.h2}>3. Formation</Text>
        <BarList rows={d.education} total={k.total} max={10} />

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Header data={data} />

        <Text style={styles.h2}>4. Emploi et situation professionnelle</Text>
        <BarList rows={d.employment} color={CYAN} total={k.total} />

        <Text style={styles.h2}>5. Entrepreneuriat</Text>
        <Text style={styles.para}>
          {nf.format(data.entrepreneurship.total)} activité
          {data.entrepreneurship.total > 1 ? "s" : ""} déclarée
          {data.entrepreneurship.total > 1 ? "s" : ""}, dont{" "}
          {nf.format(data.entrepreneurship.formalized)} formalisée
          {data.entrepreneurship.formalized > 1 ? "s" : ""}.
        </Text>
        <BarList rows={data.entrepreneurship.topSectors} color={GREEN} />

        <Text style={styles.h2}>6. Compétences</Text>
        <BarList rows={d.skills} color={GREEN} max={10} />

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.h2}>7. Besoins exprimés</Text>
            <BarList rows={d.needs} color="#c2410c" />
          </View>
          <View style={styles.col}>
            <Text style={styles.h2}>8. Centres d'intérêt</Text>
            <BarList rows={d.interests} color="#8c7ae6" />
          </View>
        </View>

        <Text style={styles.h2}>9. Conclusion descriptive</Text>
        {data.narrative.map((p, i) => (
          <Text key={i} style={styles.para}>
            {p}
          </Text>
        ))}
        <Text style={styles.note}>
          Cette conclusion est générée automatiquement à partir des seules données collectées sur la
          période. Les réponses multiples (compétences, besoins, intérêts) ne sont pas exclusives.
        </Text>

        <Footer />
      </Page>
    </Document>
  );
}
