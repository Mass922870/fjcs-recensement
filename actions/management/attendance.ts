"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { requireManagementPermission } from "@/lib/auth/session";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { ValidationError } from "@/lib/errors";
import { rateLimit } from "@/lib/security/rate-limit";
import { getHashedClientIp } from "@/lib/security/request";
import {
  attendanceSheetSchema,
  confirmPresenceSchema,
  issueTokenSchema,
} from "@/schemas/management/attendance";
import {
  confirmAttendanceByToken,
  issueAttendanceToken,
  revokeAttendanceTokens,
  saveAttendances,
} from "@/services/management/attendance.service";

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

const idSchema = z.string().min(1);

function revalidateAttendance(meetingId: string) {
  revalidatePath(`/management/reunions/${meetingId}`);
  revalidatePath(`/management/reunions/${meetingId}/presences`);
  revalidatePath("/management/presences");
  revalidatePath("/management");
}

export async function saveAttendancesAction(
  meetingId: string,
  values: unknown,
): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("attendance:manage");
    const parsed = attendanceSheetSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Données invalides.", fieldErrors(parsed.error));
    await saveAttendances(idSchema.parse(meetingId), parsed.data.entries, actor.id);
    revalidateAttendance(meetingId);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export interface IssuedToken {
  url: string;
  qrDataUrl: string;
  expiresAt: string;
}

/** Émet un jeton et renvoie le QR déjà rendu : la valeur en clair ne circule qu'ici. */
export async function issueAttendanceTokenAction(
  meetingId: string,
  values: unknown,
): Promise<ActionResult<IssuedToken>> {
  try {
    const actor = await requireManagementPermission("attendance:manage");
    const parsed = issueTokenSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Durée invalide.", fieldErrors(parsed.error));

    const { token, expiresAt } = await issueAttendanceToken(
      idSchema.parse(meetingId),
      parsed.data.ttlMinutes,
      actor.id,
    );

    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
    const url = `${base}/presence/${token}`;
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 720,
      color: { dark: "#0f0a4d", light: "#ffffff" },
    });

    revalidateAttendance(meetingId);
    return { ok: true, data: { url, qrDataUrl, expiresAt: expiresAt.toISOString() } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function revokeAttendanceTokensAction(meetingId: string): Promise<ActionResult> {
  try {
    const actor = await requireManagementPermission("attendance:manage");
    await revokeAttendanceTokens(idSchema.parse(meetingId), actor.id);
    revalidateAttendance(meetingId);
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export interface PresenceConfirmation {
  meetingTitle: string;
  memberName: string;
  at: string;
  late: boolean;
}

/**
 * Confirmation depuis la page publique de scan : aucune session n'est requise,
 * la seule autorisation est la détention d'un jeton valide et non expiré. Le
 * débit est limité par adresse pour empêcher un pointage massif automatisé.
 */
export async function confirmPresenceAction(
  values: unknown,
): Promise<ActionResult<PresenceConfirmation>> {
  try {
    const parsed = confirmPresenceSchema.safeParse(values);
    if (!parsed.success) throw new ValidationError("Requête invalide.");

    const ipHash = await getHashedClientIp();
    const rl = await rateLimit("presence:confirm", ipHash, { limit: 20, windowSeconds: 10 * 60 });
    if (!rl.ok) {
      throw new ValidationError("Trop de tentatives depuis cet appareil. Réessayez plus tard.");
    }

    const result = await confirmAttendanceByToken(parsed.data.token, parsed.data.memberId);
    return {
      ok: true,
      data: {
        meetingTitle: result.meetingTitle,
        memberName: result.memberName,
        at: result.at.toISOString(),
        late: result.late,
      },
    };
  } catch (e) {
    return toActionError(e);
  }
}
