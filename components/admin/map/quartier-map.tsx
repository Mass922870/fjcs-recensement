"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { QuartierAggregate } from "@/services/stats.service";

interface Props {
  data: QuartierAggregate[];
}

/** Centre du village de Sangalkam (utilisé tant qu'aucune zone n'est localisée). */
const SANGALKAM_CENTER: [number, number] = [14.7797, -17.2275];
const VILLAGE_ZOOM = 15;
const nf = new Intl.NumberFormat("fr-FR");

/** Rayon proportionnel à la racine de l'effectif (aire ∝ effectif). */
function radiusFor(count: number, max: number): number {
  if (count === 0) return 0;
  const min = 10;
  const maxR = 36;
  return min + (maxR - min) * Math.sqrt(count / Math.max(1, max));
}

/** Teinte séquentielle (une seule couleur, plus foncé = plus élevé). */
function opacityFor(count: number, max: number): number {
  return count === 0 ? 0 : 0.4 + 0.45 * (count / Math.max(1, max));
}

type Located = QuartierAggregate & { latitude: number; longitude: number };

/** Cadre automatiquement la carte sur les zones localisées. */
function FitToZones({ zones }: { zones: Located[] }) {
  const map = useMap();
  useEffect(() => {
    if (!zones.length) {
      map.setView(SANGALKAM_CENTER, VILLAGE_ZOOM);
      return;
    }
    if (zones.length === 1) {
      map.setView([zones[0]!.latitude, zones[0]!.longitude], VILLAGE_ZOOM + 1);
      return;
    }
    map.fitBounds(latLngBounds(zones.map((z) => [z.latitude, z.longitude] as [number, number])), {
      padding: [48, 48],
      maxZoom: VILLAGE_ZOOM + 2,
    });
  }, [map, zones]);
  return null;
}

export function QuartierMap({ data }: Props) {
  const located = useMemo(
    () => data.filter((d): d is Located => d.latitude != null && d.longitude != null),
    [data],
  );
  const withYouth = useMemo(() => located.filter((d) => d.count > 0), [located]);
  const max = useMemo(() => Math.max(0, ...data.map((d) => d.count)), [data]);

  return (
    <div className="relative">
      <MapContainer
        center={SANGALKAM_CENTER}
        zoom={VILLAGE_ZOOM}
        scrollWheelZoom={false}
        className="h-[420px] w-full rounded-xl sm:h-[520px]"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToZones zones={located} />
        {located.map((q) => (
          <CircleMarker
            key={q.id}
            center={[q.latitude, q.longitude]}
            radius={q.count > 0 ? radiusFor(q.count, max) : 7}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: q.count > 0 ? "#4a45c4" : "#94a3b8",
              fillOpacity: q.count > 0 ? opacityFor(q.count, max) : 0.45,
            }}
          >
            {/* Étiquette permanente : le nom de la zone reste lisible sans survol. */}
            <Tooltip permanent direction="top" offset={[0, -4]} opacity={1} className="fjcs-zone-label">
              {q.name} · {nf.format(q.count)}
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

      {located.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center rounded-xl bg-white/85 p-6 text-center">
          <div className="max-w-sm space-y-1.5">
            <p className="text-sm font-semibold text-foreground">Aucune zone n'est encore placée sur la carte</p>
            <p className="text-sm text-muted-foreground">
              Renseignez la latitude et la longitude de chaque quartier dans Paramètres &rsaquo; Référentiels
              &rsaquo; Quartiers : les cercles apparaîtront automatiquement, proportionnels au nombre de jeunes.
            </p>
          </div>
        </div>
      ) : withYouth.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center">
          <p className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            Zones placées, mais aucun jeune recensé pour ces filtres.
          </p>
        </div>
      ) : null}
    </div>
  );
}
