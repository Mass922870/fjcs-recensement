"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** Leaflet dépend de `window` : chargé uniquement côté client, à la demande. */
export const QuartierMapLazy = dynamic(() => import("./quartier-map").then((m) => m.QuartierMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full rounded-xl sm:h-[520px]" />,
});
