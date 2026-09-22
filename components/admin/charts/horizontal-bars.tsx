"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DistributionRow } from "@/services/stats.service";
import { ChartEmpty } from "@/components/admin/chart-card";
import { ChartTooltip } from "./chart-tooltip";

interface Props {
  data: DistributionRow[];
  color?: string;
  /** Masque les catégories à zéro (utile pour les longues listes). */
  hideZero?: boolean;
  maxItems?: number;
  /** Faux pour les dimensions multi-valuées (un jeune = plusieurs réponses) : pas de % trompeur. */
  showPercent?: boolean;
}

const nf = new Intl.NumberFormat("fr-FR");

/** Barres horizontales, une seule série, une seule couleur (magnitude). */
export function HorizontalBars({
  data,
  color = "var(--chart-1)",
  hideZero,
  maxItems = 12,
  showPercent = true,
}: Props) {
  let rows = hideZero ? data.filter((d) => d.value > 0) : data;
  rows = rows.slice(0, maxItems);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!rows.length || total === 0) return <ChartEmpty />;

  const height = Math.max(160, rows.length * 34 + 24);
  return (
    <div style={{ height }} role="img" aria-label="Graphique en barres">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
          barCategoryGap={10}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeWidth={1} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={<ChartTooltip total={showPercent ? total : undefined} />}
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
            label={{
              position: "right",
              fontSize: 11,
              fill: "var(--muted-foreground)",
              formatter: (v: unknown) => nf.format(Number(v)),
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
