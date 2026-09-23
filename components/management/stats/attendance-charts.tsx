"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChartEmpty } from "@/components/admin/chart-card";
import { ChartTooltip } from "@/components/admin/charts/chart-tooltip";
import type { ManagementStats } from "@/services/management/stats.service";

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };

/** Évolution mensuelle du taux de présence. */
export function AttendanceTrend({ data }: { data: ManagementStats["monthly"] }) {
  if (data.length === 0) return <ChartEmpty />;
  const rows = data.map((d) => ({
    label: format(new Date(`${d.month}-01T12:00:00`), "MMM yy", { locale: fr }),
    value: d.rate,
  }));

  return (
    <div style={{ height: 240 }} role="img" aria-label="Évolution du taux de présence">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: -18 }}>
          <defs>
            <linearGradient id="presenceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
          <Area
            type="monotone"
            dataKey="value"
            name="Taux de présence"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#presenceFill)"
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Taux de présence par commission ou par membre. */
export function RateBars({
  data,
  color = "var(--chart-2)",
}: {
  data: { name: string; rate: number }[];
  color?: string;
}) {
  if (data.length === 0) return <ChartEmpty />;
  const rows = data.map((d) => ({ label: d.name, value: d.rate }));
  const height = Math.max(160, rows.length * 34 + 24);

  return (
    <div style={{ height }} role="img" aria-label="Taux de présence en barres">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={170}
            tick={AXIS}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar
            dataKey="value"
            name="Taux de présence"
            fill={color}
            radius={[0, 5, 5, 0]}
            animationDuration={700}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Répartition des statuts de pointage, en valeurs absolues. */
export function StatusBars({ totals }: { totals: ManagementStats["totals"] }) {
  const rows = [
    { label: "Présents", value: totals.present, fill: "var(--chart-3)" },
    { label: "Retards", value: totals.late, fill: "var(--chart-4)" },
    { label: "Excusés", value: totals.excused, fill: "var(--chart-2)" },
    { label: "Absents", value: totals.absent, fill: "var(--chart-5)" },
  ];
  if (rows.every((r) => r.value === 0)) return <ChartEmpty />;

  return (
    <div style={{ height: 200 }} role="img" aria-label="Répartition des statuts de présence">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="value" name="Pointages" radius={[5, 5, 0, 0]} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
