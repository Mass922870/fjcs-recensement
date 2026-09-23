import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { audit } from "@/services/audit.service";

/** Taille maximale d'un document, alignée sur ce que tolère une action serveur. */
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

/**
 * Types acceptés, vérifiés côté serveur.
 *
 * La liste blanche est volontairement close : un type exécutable déposé puis
 * téléchargé par un membre serait un vecteur d'attaque évident.
 */
export const ACCEPTED_MIME: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WEBP",
};

export interface DocumentTarget {
  meetingId?: string;
  minutesId?: string;
  actionId?: string;
}

export async function listDocuments(target?: DocumentTarget) {
  return prisma.document.findMany({
    where: target?.meetingId
      ? { meetingId: target.meetingId }
      : target?.minutesId
        ? { minutesId: target.minutesId }
        : target?.actionId
          ? { actionId: target.actionId }
          : {},
    orderBy: { createdAt: "desc" },
    // Les octets vivent dans DocumentBlob : cette requête reste légère.
    select: {
      id: true,
      title: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      uploadedBy: { select: { name: true } },
      meeting: { select: { id: true, reference: true, title: true } },
      action: { select: { id: true, title: true } },
    },
  });
}

export type DocumentRow = Awaited<ReturnType<typeof listDocuments>>[number];

export async function uploadDocument(
  input: { title: string; file: File } & DocumentTarget,
  actorId: string,
) {
  const { file, title } = input;
  if (!ACCEPTED_MIME[file.type]) {
    throw new ValidationError(
      `Type de fichier non accepté (${file.type || "inconnu"}). Formats admis : PDF, Word, Excel, PowerPoint et images.`,
    );
  }
  if (file.size === 0) throw new ValidationError("Le fichier est vide.");
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new ValidationError(
      `Fichier trop volumineux (${Math.round(file.size / 1024 / 1024)} Mo). Maximum ${MAX_DOCUMENT_BYTES / 1024 / 1024} Mo.`,
    );
  }
  if (input.meetingId) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: input.meetingId },
      select: { id: true },
    });
    if (!meeting) throw new NotFoundError("Réunion introuvable.");
  }

  const content = Buffer.from(await file.arrayBuffer());
  const document = await prisma.document.create({
    data: {
      title,
      // Clé aléatoire : un identifiant devinable exposerait les documents.
      storageKey: randomBytes(24).toString("hex"),
      mimeType: file.type,
      sizeBytes: file.size,
      meetingId: input.meetingId,
      minutesId: input.minutesId,
      actionId: input.actionId,
      uploadedById: actorId,
      blob: { create: { content } },
    },
    select: { id: true },
  });

  await audit({
    action: "DOCUMENT_UPLOADED",
    entityType: "Document",
    entityId: document.id,
    actorId,
    metadata: { title, mimeType: file.type, sizeBytes: file.size, meetingId: input.meetingId },
  });
  return document;
}

/** Contenu d'un document, destiné à une route authentifiée uniquement. */
export async function readDocument(id: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      mimeType: true,
      sizeBytes: true,
      blob: { select: { content: true } },
    },
  });
  if (!document?.blob) throw new NotFoundError("Document introuvable.");
  return document;
}

export async function deleteDocument(id: string, actorId: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!document) throw new NotFoundError("Document introuvable.");
  await prisma.document.delete({ where: { id } });
  await audit({
    action: "DOCUMENT_DELETED",
    entityType: "Document",
    entityId: id,
    actorId,
    metadata: { title: document.title },
  });
}

/** Volume total stocké, pour signaler une dérive au bureau. */
export async function getDocumentsFootprint() {
  const result = await prisma.document.aggregate({ _sum: { sizeBytes: true }, _count: { _all: true } });
  return { count: result._count._all, bytes: result._sum.sizeBytes ?? 0 };
}
