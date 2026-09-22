"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CrossTab } from "@/services/stats.service";
import { ChartEmpty } from "@/components/admin/chart-card";
import { ChartTooltip } from "./chart-tooltip";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];
const MAX_SERIES = 6;

/** Barres empilées horizontales : une barre par ligne, un segment par colonne (≤ 6 séries). */
export function StackedBars({ data }: { data: CrossTab }) {
  if (data.total === 0 || data.rows.length === 0) return <ChartEmpty />;
  const cols = data.cols.slice(0, MAX_SERIES);
  const overflow = data.cols.length > MAX_SERIES ? data.cols.slice(MAX_SERIES) : [];
  const rows = data.rows.map((r) => {
    const row: Record<string, string | number> = { label: r };
    for (const c of cols) row[c] = data.cells[r]?.[c] ?? 0;
    if (overflow.length)
      row["Autres"] = overflow.reduce((s, c) => s + (data.cells[r]?.[c] ?? 0), 0);
    return row;
  });
  const series = overflow.length ? [...cols, "Autres"] : cols;
  const height = Math.max(180, rows.length * 36 + 60);

  return (
    <div style={{ height }} role="img" aria-label="Graphique en barres empilées">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
          barCategoryGap={12}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" />
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
            interval={0}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
          />
          {series.map((s, i) => (
            <Bar
              key={s}
              dataKey={s}
              stackId="a"
              fill={COLORS[i % COLORS.length]}
              maxBarSize={22}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
