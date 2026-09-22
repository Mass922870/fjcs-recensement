-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ANALYST', 'VIEWER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('NONE', 'PRIMARY', 'MIDDLE', 'SECONDARY', 'BAC_PLUS_2', 'LICENCE', 'MASTER', 'DOCTORATE', 'VOCATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('STUDENT', 'EMPLOYEE', 'ENTREPRENEUR', 'FREELANCER', 'JOB_SEEKER', 'APPRENTICE', 'INACTIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'ANONYMIZED');

-- CreateEnum
CREATE TYPE "ProfileSource" AS ENUM ('PUBLIC', 'ADMIN', 'SEED');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('DIGITAL', 'ENTREPRENEURSHIP', 'CRAFT', 'CULTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('PROFILE_CREATED', 'PROFILE_UPDATED', 'PROFILE_ARCHIVED', 'PROFILE_RESTORED', 'PROFILE_ANONYMIZED', 'PROFILE_DELETED', 'DUPLICATE_ATTEMPT', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'USER_PASSWORD_CHANGED', 'EXPORT_GENERATED', 'REPORT_GENERATED', 'SETTINGS_UPDATED', 'REFERENTIAL_UPDATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Quartier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quartier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Need" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Need_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YouthProfile" (
    "id" TEXT NOT NULL,
    "participationCode" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneNormalized" TEXT,
    "email" TEXT,
    "quartierId" TEXT,
    "quartierOther" TEXT,
    "status" "ProfileStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "ProfileSource" NOT NULL DEFAULT 'PUBLIC',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "customSkills" TEXT,
    "customInterests" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "anonymizedAt" TIMESTAMP(3),

    CONSTRAINT "YouthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "youthId" TEXT NOT NULL,
    "level" "EducationLevel" NOT NULL,
    "field" TEXT,
    "institution" TEXT,
    "diploma" TEXT,
    "vocationalTraining" TEXT,
    "otherTraining" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employment" (
    "id" TEXT NOT NULL,
    "youthId" TEXT NOT NULL,
    "status" "EmploymentStatus" NOT NULL,
    "otherDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "youthId" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "name" TEXT,
    "isFormalized" BOOLEAN NOT NULL DEFAULT false,
    "sinceMonths" INTEGER,
    "teamSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "youthId" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "textVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YouthSkill" (
    "youthId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "YouthSkill_pkey" PRIMARY KEY ("youthId","skillId")
);

-- CreateTable
CREATE TABLE "YouthInterest" (
    "youthId" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,

    CONSTRAINT "YouthInterest_pkey" PRIMARY KEY ("youthId","interestId")
);

-- CreateTable
CREATE TABLE "YouthNeed" (
    "youthId" TEXT NOT NULL,
    "needId" TEXT NOT NULL,

    CONSTRAINT "YouthNeed_pkey" PRIMARY KEY ("youthId","needId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quartier_name_key" ON "Quartier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Quartier_slug_key" ON "Quartier"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_slug_key" ON "Interest"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Need_slug_key" ON "Need"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "YouthProfile_participationCode_key" ON "YouthProfile"("participationCode");

-- CreateIndex
CREATE UNIQUE INDEX "YouthProfile_phoneNormalized_key" ON "YouthProfile"("phoneNormalized");

-- CreateIndex
CREATE INDEX "YouthProfile_status_isDemo_idx" ON "YouthProfile"("status", "isDemo");

-- CreateIndex
CREATE INDEX "YouthProfile_createdAt_idx" ON "YouthProfile"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "YouthProfile_quartierId_idx" ON "YouthProfile"("quartierId");

-- CreateIndex
CREATE INDEX "YouthProfile_gender_idx" ON "YouthProfile"("gender");

-- CreateIndex
CREATE INDEX "YouthProfile_birthDate_idx" ON "YouthProfile"("birthDate");

-- CreateIndex
CREATE INDEX "YouthProfile_lastName_firstName_idx" ON "YouthProfile"("lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Education_youthId_key" ON "Education"("youthId");

-- CreateIndex
CREATE INDEX "Education_level_idx" ON "Education"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Employment_youthId_key" ON "Employment"("youthId");

-- CreateIndex
CREATE INDEX "Employment_status_idx" ON "Employment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Project_youthId_key" ON "Project"("youthId");

-- CreateIndex
CREATE INDEX "Project_sector_idx" ON "Project"("sector");

-- CreateIndex
CREATE INDEX "Project_isFormalized_idx" ON "Project"("isFormalized");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_youthId_key" ON "Consent"("youthId");

-- CreateIndex
CREATE INDEX "YouthSkill_skillId_idx" ON "YouthSkill"("skillId");

-- CreateIndex
CREATE INDEX "YouthInterest_interestId_idx" ON "YouthInterest"("interestId");

-- CreateIndex
CREATE INDEX "YouthNeed_needId_idx" ON "YouthNeed"("needId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthProfile" ADD CONSTRAINT "YouthProfile_quartierId_fkey" FOREIGN KEY ("quartierId") REFERENCES "Quartier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthProfile" ADD CONSTRAINT "YouthProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "YouthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employment" ADD CONSTRAINT "Employment_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "YouthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "YouthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "YouthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthSkill" ADD CONSTRAINT "YouthSkill_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "YouthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthSkill" ADD CONSTRAINT "YouthSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthInterest" ADD CONSTRAINT "YouthInterest_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "YouthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthInterest" ADD CONSTRAINT "YouthInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthNeed" ADD CONSTRAINT "YouthNeed_youthId_fkey" FOREIGN KEY ("youthId") REFERENCES "YouthProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YouthNeed" ADD CONSTRAINT "YouthNeed_needId_fkey" FOREIGN KEY ("needId") REFERENCES "Need"("id") ON DELETE CASCADE ON UPDATE CASCADE;
