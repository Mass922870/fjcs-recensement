"use client";

import { useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { QuartierAggregate } from "@/services/stats.service";

interface Props {
  data: QuartierAggregate[];
}

const SANGALKAM_CENTER: [number, number] = [14.778, -17.22];
const nf = new Intl.NumberFormat("fr-FR");

/** Rayon proportionnel à la racine de l'effectif (aire ∝ effectif). */
function radiusFor(count: number, max: number): number {
  if (count === 0) return 0;
  const min = 8;
  const maxR = 34;
  return min + (maxR - min) * Math.sqrt(count / Math.max(1, max));
}

/** Teinte séquentielle (une seule couleur, plus foncé = plus élevé). */
function opacityFor(count: number, max: number): number {
  return count === 0 ? 0 : 0.35 + 0.5 * (count / Math.max(1, max));
}

export function QuartierMap({ data }: Props) {
  const max = useMemo(() => Math.max(0, ...data.map((d) => d.count)), [data]);
  const located = data.filter((d) => d.latitude != null && d.longitude != null && d.count > 0);

  return (
    <MapContainer
      center={SANGALKAM_CENTER}
      zoom={13}
      scrollWheelZoom={false}
      className="h-[420px] w-full rounded-xl sm:h-[520px]"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((q) => (
        <CircleMarker
          key={q.id}
          center={[q.latitude!, q.longitude!]}
          radius={radiusFor(q.count, max)}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: "#4a45c4",
            fillOpacity: opacityFor(q.count, max),
          }}
        >
          <Tooltip direction="top" offset={[0, -6]} opacity={1}>
            <span className="text-xs font-medium">{q.name}</span>
          </Tooltip>
          <Popup>
            <div className="space-y-0.5">
              <p className="font-semibold">{q.name}</p>
              <p className="text-sm">
                {nf.format(q.count)} jeune{q.count > 1 ? "s" : ""} recensé{q.count > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-neutral-500">
                Agrégat par quartier - position approximative du centre.
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
