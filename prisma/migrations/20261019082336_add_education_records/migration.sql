-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('SSC', 'HSC', 'UNIVERSITY');

-- CreateTable
CREATE TABLE "EducationRecord" (
    "id" UUID NOT NULL,
    "tutorProfileId" UUID NOT NULL,
    "level" "EducationLevel" NOT NULL,
    "institution" TEXT NOT NULL,
    "gpa" TEXT,
    "certificateKey" TEXT,
    "certificateFileName" TEXT,
    "certificateMimeType" TEXT,
    "certificateSizeBytes" INTEGER,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EducationRecord_tutorProfileId_level_key" ON "EducationRecord"("tutorProfileId", "level");

-- AddForeignKey
ALTER TABLE "EducationRecord" ADD CONSTRAINT "EducationRecord_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
