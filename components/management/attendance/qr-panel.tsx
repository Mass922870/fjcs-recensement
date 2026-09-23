"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, QrCode, RefreshCw, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  issueAttendanceTokenAction,
  revokeAttendanceTokensAction,
  type IssuedToken,
} from "@/actions/management/attendance";
import { ORG_ACRONYM } from "@/lib/constants/app";

const DURATIONS = [
  { value: "60", label: "1 heure" },
  { value: "180", label: "3 heures" },
  { value: "480", label: "8 heures" },
];

interface Props {
  meetingId: string;
  meetingTitle: string;
  hasActive: boolean;
}

export function QrPanel({ meetingId, meetingTitle, hasActive }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [ttl, setTtl] = useState("180");
  const [issued, setIssued] = useState<IssuedToken | null>(null);

  const generate = () =>
    start(async () => {
      const res = await issueAttendanceTokenAction(meetingId, { ttlMinutes: Number(ttl) });
      if (res.ok) {
        setIssued(res.data ?? null);
        toast.success("QR code généré. Les précédents sont révoqués.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  const revoke = () =>
    start(async () => {
      const res = await revokeAttendanceTokensAction(meetingId);
      if (res.ok) {
        setIssued(null);
        toast.success("QR code révoqué.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });

  return (
    <div className="space-y-5">
      {issued ? (
        <div className="animate-in fade-in zoom-in-95 flex flex-col items-center gap-5 text-center duration-500 motion-reduce:animate-none">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
              Réunion {ORG_ACRONYM}
            </p>
            <h2 className="text-foreground mt-1 text-xl font-semibold sm:text-2xl">
              {meetingTitle}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Scannez le QR code pour confirmer votre présence
            </p>
          </div>

          <div className="rounded-3xl border-4 border-white bg-white p-3 shadow-[0_24px_60px_-30px_rgba(15,10,77,0.55)]">
            <Image
              src={issued.qrDataUrl}
              alt="QR code de pointage de présence"
              width={320}
              height={320}
              unoptimized
              className="size-64 sm:size-80"
            />
          </div>

          <p className="text-muted-foreground text-sm">
            Valable jusqu&apos;à{" "}
            <strong className="text-foreground">
              {new Date(issued.expiresAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="outline" onClick={generate} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Régénérer
            </Button>
            <Button variant="ghost" onClick={revoke} disabled={pending}>
              <ShieldOff />
              Révoquer
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {hasActive ? (
            <Alert>
              <AlertDescription>
                Un QR code est déjà actif pour cette séance. En générer un nouveau révoque
                immédiatement le précédent.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ttl">Durée de validité</Label>
              <Select value={ttl} onValueChange={setTtl}>
                <SelectTrigger id="ttl" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generate} disabled={pending}>
              {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <QrCode />}
              Générer le QR code
            </Button>
            {hasActive ? (
              <Button variant="ghost" onClick={revoke} disabled={pending}>
                <ShieldOff />
                Révoquer l&apos;actuel
              </Button>
            ) : null}
          </div>

          <p className="text-muted-foreground text-sm">
            Le code est aléatoire, à usage limité dans le temps et révocable. Il ne prouve pas
            l&apos;identité du porteur : la feuille de présence reste corrigeable par un
            responsable.
          </p>
        </div>
      )}
    </div>
  );
}
