"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DistributionRow } from "@/services/stats.service";
import { ChartEmpty } from "@/components/admin/chart-card";
import { ChartTooltip } from "./chart-tooltip";

interface Props {
  data: DistributionRow[];
  color?: string;
  height?: number;
}

/** Colonnes verticales pour des catégories ordonnées (tranches d'âge…). */
export function Columns({ data, color = "var(--chart-1)", height = 220 }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <ChartEmpty />;
  return (
    <div style={{ height }} role="img" aria-label="Graphique en colonnes">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 16, right: 8, bottom: 0, left: -16 }}
          barCategoryGap={18}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip total={total} />} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
