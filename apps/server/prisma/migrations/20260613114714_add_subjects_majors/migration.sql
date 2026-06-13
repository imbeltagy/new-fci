-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('first', 'second', 'summer');

-- CreateTable
CREATE TABLE "join_years" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "join_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "majors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "semester" "Semester" NOT NULL,
    "joinYearId" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_join_year_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_join_year_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_major_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,
    "joinYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_major_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_subject_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_subject_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "join_years_year_key" ON "join_years"("year");

-- CreateIndex
CREATE UNIQUE INDEX "majors_code_key" ON "majors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "staff_join_year_assignments_userId_joinYearId_key" ON "staff_join_year_assignments"("userId", "joinYearId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_major_assignments_userId_majorId_joinYearId_key" ON "staff_major_assignments"("userId", "majorId", "joinYearId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_subject_assignments_userId_subjectId_key" ON "staff_subject_assignments"("userId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_enrollments_userId_subjectId_key" ON "subject_enrollments"("userId", "subjectId");

-- Clear stale string joinYearId/majorId values that are not valid UUIDs referencing join_years/majors
UPDATE "users" SET "joinYearId" = NULL, "majorId" = NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_joinYearId_fkey" FOREIGN KEY ("joinYearId") REFERENCES "join_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "majors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_joinYearId_fkey" FOREIGN KEY ("joinYearId") REFERENCES "join_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "majors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_join_year_assignments" ADD CONSTRAINT "staff_join_year_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_join_year_assignments" ADD CONSTRAINT "staff_join_year_assignments_joinYearId_fkey" FOREIGN KEY ("joinYearId") REFERENCES "join_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_major_assignments" ADD CONSTRAINT "staff_major_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_major_assignments" ADD CONSTRAINT "staff_major_assignments_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "majors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_major_assignments" ADD CONSTRAINT "staff_major_assignments_joinYearId_fkey" FOREIGN KEY ("joinYearId") REFERENCES "join_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_subject_assignments" ADD CONSTRAINT "staff_subject_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_subject_assignments" ADD CONSTRAINT "staff_subject_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_enrollments" ADD CONSTRAINT "subject_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_enrollments" ADD CONSTRAINT "subject_enrollments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
