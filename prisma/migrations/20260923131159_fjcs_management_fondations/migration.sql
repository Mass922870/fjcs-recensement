-- CreateEnum
CREATE TYPE "ManagementRole" AS ENUM ('SUPER_ADMIN', 'PRESIDENT', 'SECRETAIRE', 'RESPONSABLE_COMMISSION', 'MEMBRE_BUREAU', 'VIEWER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIF', 'INACTIF', 'SUSPENDU', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('BUREAU', 'COMMISSION', 'ASSEMBLEE_GENERALE', 'EXTRAORDINAIRE', 'PROJET', 'PARTENAIRES', 'AUTRE');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'ARCHIVEE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSE', 'RETARD');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('MANUEL', 'QR_CODE');

-- CreateEnum
CREATE TYPE "MinutesStatus" AS ENUM ('BROUILLON', 'EN_REVISION', 'A_VALIDER', 'VALIDE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "ActionPriority" AS ENUM ('BASSE', 'NORMALE', 'HAUTE', 'URGENTE');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('A_FAIRE', 'EN_COURS', 'TERMINE', 'BLOQUE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'MEMBER_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'MEMBER_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'MEMBER_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE 'COMMISSION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'COMMISSION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'COMMISSION_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'MEETING_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'MEETING_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'MEETING_CANCELLED';
ALTER TYPE "AuditAction" ADD VALUE 'MEETING_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE 'ATTENDANCE_RECORDED';
ALTER TYPE "AuditAction" ADD VALUE 'ATTENDANCE_CORRECTED';
ALTER TYPE "AuditAction" ADD VALUE 'ATTENDANCE_TOKEN_ISSUED';
ALTER TYPE "AuditAction" ADD VALUE 'ATTENDANCE_TOKEN_REVOKED';
ALTER TYPE "AuditAction" ADD VALUE 'MINUTES_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'MINUTES_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'MINUTES_SUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'MINUTES_VALIDATED';
ALTER TYPE "AuditAction" ADD VALUE 'MINUTES_ARCHIVED';
ALTER TYPE "AuditAction" ADD VALUE 'DECISION_RECORDED';
ALTER TYPE "AuditAction" ADD VALUE 'ACTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'ACTION_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'ACTION_CLOSED';
ALTER TYPE "AuditAction" ADD VALUE 'DOCUMENT_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE 'DOCUMENT_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'DOCUMENT_DOWNLOADED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "managementRole" "ManagementRole";

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acronym" TEXT,
    "description" TEXT,
    "leadId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "role" TEXT,
    "commissionId" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIF',
    "joinedAt" DATE,
    "notes" TEXT,
    "userId" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'PLANIFIEE',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT,
    "commissionId" TEXT,
    "organizerId" TEXT,
    "createdById" TEXT,
    "cancelReason" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "method" "AttendanceMethod" NOT NULL DEFAULT 'MANUEL',
    "arrivedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "comment" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Minutes" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "status" "MinutesStatus" NOT NULL DEFAULT 'BROUILLON',
    "chairId" TEXT,
    "secretaryId" TEXT,
    "introduction" TEXT,
    "proceedings" TEXT,
    "observations" TEXT,
    "misc" TEXT,
    "conclusion" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "validatedAt" TIMESTAMP(3),
    "validatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Minutes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinutesVersion" (
    "id" TEXT NOT NULL,
    "minutesId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "reason" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MinutesVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "agendaItemId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "commissionId" TEXT,
    "dueDate" DATE,
    "priority" "ActionPriority" NOT NULL DEFAULT 'NORMALE',
    "status" "ActionStatus" NOT NULL DEFAULT 'A_FAIRE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "meetingId" TEXT,
    "decisionId" TEXT,
    "completedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "meetingId" TEXT,
    "minutesId" TEXT,
    "actionId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commission_name_key" ON "Commission"("name");

-- CreateIndex
CREATE INDEX "Commission_isActive_sortOrder_idx" ON "Commission"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE INDEX "Member_commissionId_idx" ON "Member"("commissionId");

-- CreateIndex
CREATE INDEX "Member_lastName_firstName_idx" ON "Member"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_reference_key" ON "Meeting"("reference");

-- CreateIndex
CREATE INDEX "Meeting_startsAt_idx" ON "Meeting"("startsAt" DESC);

-- CreateIndex
CREATE INDEX "Meeting_status_startsAt_idx" ON "Meeting"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Meeting_type_idx" ON "Meeting"("type");

-- CreateIndex
CREATE INDEX "Meeting_commissionId_idx" ON "Meeting"("commissionId");

-- CreateIndex
CREATE INDEX "AgendaItem_meetingId_idx" ON "AgendaItem"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "AgendaItem_meetingId_position_key" ON "AgendaItem"("meetingId", "position");

-- CreateIndex
CREATE INDEX "MeetingParticipant_memberId_idx" ON "MeetingParticipant"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meetingId_memberId_key" ON "MeetingParticipant"("meetingId", "memberId");

-- CreateIndex
CREATE INDEX "Attendance_memberId_idx" ON "Attendance"("memberId");

-- CreateIndex
CREATE INDEX "Attendance_status_idx" ON "Attendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_meetingId_memberId_key" ON "Attendance"("meetingId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceToken_tokenHash_key" ON "AttendanceToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AttendanceToken_meetingId_idx" ON "AttendanceToken"("meetingId");

-- CreateIndex
CREATE INDEX "AttendanceToken_expiresAt_idx" ON "AttendanceToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Minutes_meetingId_key" ON "Minutes"("meetingId");

-- CreateIndex
CREATE INDEX "Minutes_status_idx" ON "Minutes"("status");

-- CreateIndex
CREATE INDEX "MinutesVersion_minutesId_idx" ON "MinutesVersion"("minutesId");

-- CreateIndex
CREATE UNIQUE INDEX "MinutesVersion_minutesId_version_key" ON "MinutesVersion"("minutesId", "version");

-- CreateIndex
CREATE INDEX "Decision_meetingId_idx" ON "Decision"("meetingId");

-- CreateIndex
CREATE INDEX "ActionItem_status_position_idx" ON "ActionItem"("status", "position");

-- CreateIndex
CREATE INDEX "ActionItem_assigneeId_idx" ON "ActionItem"("assigneeId");

-- CreateIndex
CREATE INDEX "ActionItem_dueDate_idx" ON "ActionItem"("dueDate");

-- CreateIndex
CREATE INDEX "ActionItem_commissionId_idx" ON "ActionItem"("commissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");

-- CreateIndex
CREATE INDEX "Document_meetingId_idx" ON "Document"("meetingId");

-- CreateIndex
CREATE INDEX "Document_minutesId_idx" ON "Document"("minutesId");

-- CreateIndex
CREATE INDEX "Document_actionId_idx" ON "Document"("actionId");

-- CreateIndex
CREATE INDEX "User_managementRole_idx" ON "User"("managementRole");

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceToken" ADD CONSTRAINT "AttendanceToken_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Minutes" ADD CONSTRAINT "Minutes_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Minutes" ADD CONSTRAINT "Minutes_chairId_fkey" FOREIGN KEY ("chairId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Minutes" ADD CONSTRAINT "Minutes_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinutesVersion" ADD CONSTRAINT "MinutesVersion_minutesId_fkey" FOREIGN KEY ("minutesId") REFERENCES "Minutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_agendaItemId_fkey" FOREIGN KEY ("agendaItemId") REFERENCES "AgendaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_commissionId_fkey" FOREIGN KEY ("commissionId") REFERENCES "Commission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_minutesId_fkey" FOREIGN KEY ("minutesId") REFERENCES "Minutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "ActionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
