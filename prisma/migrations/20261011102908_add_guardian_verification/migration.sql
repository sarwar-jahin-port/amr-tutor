-- CreateEnum
CREATE TYPE "GuardianEvidenceType" AS ENUM ('NATIONAL_ID_CARD', 'OTHER');

-- CreateTable
CREATE TABLE "GuardianVerificationRequest" (
    "id" UUID NOT NULL,
    "guardianUserId" UUID NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "assignedVerifierId" UUID,
    "decisionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuardianVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianVerificationEvidence" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "type" "GuardianEvidenceType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GuardianVerificationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuardianVerificationRequest_status_createdAt_idx" ON "GuardianVerificationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GuardianVerificationRequest_guardianUserId_status_idx" ON "GuardianVerificationRequest"("guardianUserId", "status");

-- CreateIndex
CREATE INDEX "GuardianVerificationRequest_assignedVerifierId_status_idx" ON "GuardianVerificationRequest"("assignedVerifierId", "status");

-- CreateIndex
CREATE INDEX "GuardianVerificationEvidence_requestId_idx" ON "GuardianVerificationEvidence"("requestId");

-- AddForeignKey
ALTER TABLE "GuardianVerificationRequest" ADD CONSTRAINT "GuardianVerificationRequest_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianVerificationRequest" ADD CONSTRAINT "GuardianVerificationRequest_assignedVerifierId_fkey" FOREIGN KEY ("assignedVerifierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianVerificationEvidence" ADD CONSTRAINT "GuardianVerificationEvidence_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "GuardianVerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
