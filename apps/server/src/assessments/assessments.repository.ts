import { AssessmentType } from "@prisma/client";

import { getPrismaClient } from "../db/postgres";

const assessmentBaseSelect = {
  id: true,
  type: true,
  title: true,
  subjectId: true,
  subject: {
    select: {
      id: true,
      code: true,
      name: true,
      major: { select: { id: true, code: true, name: true } },
      joinYear: { select: { id: true, year: true } },
    },
  },
  creatorId: true,
  creator: { select: { id: true, name: true, email: true } },
  startDate: true,
  endDate: true,
  isVisible: true,
  publishedAt: true,
  markReadable: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class AssessmentsRepository {
  private get db() {
    return getPrismaClient();
  }

  async findAll(filter: {
    subjectId?: string;
    type?: AssessmentType;
    visibleOnly?: boolean;
    showOld?: boolean;
    limit?: number;
    subjectIds?: string[];
  }) {
    const now = new Date();
    return this.db.assessment.findMany({
      where: {
        ...(filter.subjectId && { subjectId: filter.subjectId }),
        ...(filter.subjectIds && { subjectId: { in: filter.subjectIds } }),
        ...(filter.type && { type: filter.type }),
        ...(filter.visibleOnly && { isVisible: true }),
        ...(!filter.showOld && { endDate: { gte: now } }),
      },
      select: {
        ...assessmentBaseSelect,
        assignmentDetails: { select: { totalMark: true } },
        quiz: {
          select: {
            questions: {
              select: { degree: true },
            },
          },
        },
        _count: { select: { quizSubmissions: true, assignmentSubmissions: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      ...(filter.limit && { take: filter.limit }),
    });
  }

  async findById(id: string) {
    return this.db.assessment.findUnique({
      where: { id },
      select: {
        ...assessmentBaseSelect,
        assignmentDetails: { select: { totalMark: true } },
        quiz: {
          select: {
            questions: {
              select: {
                id: true,
                text: true,
                degree: true,
                correctOption: true,
                options: { select: { id: true, text: true, index: true }, orderBy: { index: "asc" } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });
  }

  async create(data: {
    type: AssessmentType;
    subjectId: string;
    creatorId: string;
    title: string;
    startDate: Date;
    endDate: Date;
    totalMark?: number;
  }) {
    return this.db.assessment.create({
      data: {
        type: data.type,
        subjectId: data.subjectId,
        creatorId: data.creatorId,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        ...(data.type === "quiz" && { quiz: { create: {} } }),
        ...(data.type === "assignment" && {
          assignmentDetails: { create: { totalMark: data.totalMark! } },
        }),
      },
      select: assessmentBaseSelect,
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      startDate?: Date;
      endDate?: Date;
      isVisible?: boolean;
      publishedAt?: Date | null;
      markReadable?: boolean;
    },
    assignmentTotalMark?: number,
  ) {
    return this.db.$transaction(async (tx) => {
      if (assignmentTotalMark !== undefined) {
        await tx.assignmentDetails.update({
          where: { assessmentId: id },
          data: { totalMark: assignmentTotalMark },
        });
      }
      return tx.assessment.update({
        where: { id },
        data,
        select: assessmentBaseSelect,
      });
    });
  }

  async delete(id: string) {
    await this.db.assessment.delete({ where: { id } });
  }

  // ── Quiz questions ─────────────────────────────────────────────────────

  async addQuestion(quizId: string, data: { text: string; degree: number; options: string[]; correctOption: number }) {
    return this.db.quizQuestion.create({
      data: {
        quizId,
        text: data.text,
        degree: data.degree,
        correctOption: data.correctOption,
        options: {
          create: data.options.map((text, index) => ({ text, index })),
        },
      },
      select: {
        id: true,
        text: true,
        degree: true,
        correctOption: true,
        options: { select: { id: true, text: true, index: true }, orderBy: { index: "asc" } },
      },
    });
  }

  async updateQuestion(
    questionId: string,
    data: { text?: string; degree?: number; options?: string[]; correctOption?: number },
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.options !== undefined) {
        await tx.quizOption.deleteMany({ where: { questionId } });
        await tx.quizOption.createMany({
          data: data.options.map((text, index) => ({ questionId, text, index })),
        });
      }
      return tx.quizQuestion.update({
        where: { id: questionId },
        data: {
          ...(data.text !== undefined && { text: data.text }),
          ...(data.degree !== undefined && { degree: data.degree }),
          ...(data.correctOption !== undefined && { correctOption: data.correctOption }),
        },
        select: {
          id: true,
          text: true,
          degree: true,
          correctOption: true,
          options: { select: { id: true, text: true, index: true }, orderBy: { index: "asc" } },
        },
      });
    });
  }

  async deleteQuestion(questionId: string) {
    await this.db.quizQuestion.delete({ where: { id: questionId } });
  }

  async findQuestion(questionId: string) {
    return this.db.quizQuestion.findUnique({
      where: { id: questionId },
      select: { id: true, quizId: true, degree: true, correctOption: true },
    });
  }

  // ── Quiz submissions ──────────────────────────────────────────────────

  async findQuizSubmission(assessmentId: string, studentId: string) {
    return this.db.quizSubmission.findUnique({
      where: { assessmentId_studentId: { assessmentId, studentId } },
      select: {
        id: true,
        mark: true,
        submittedAt: true,
        answers: {
          select: { questionId: true, selectedOption: true, isCorrect: true },
        },
      },
    });
  }

  async findAllQuizSubmissions(assessmentId: string) {
    return this.db.quizSubmission.findMany({
      where: { assessmentId },
      select: {
        id: true,
        mark: true,
        submittedAt: true,
        student: { select: { id: true, name: true, email: true } },
        answers: { select: { questionId: true, selectedOption: true, isCorrect: true } },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  async createQuizSubmission(data: {
    assessmentId: string;
    studentId: string;
    mark: number;
    answers: { questionId: string; selectedOption: number; isCorrect: boolean }[];
  }) {
    return this.db.quizSubmission.create({
      data: {
        assessmentId: data.assessmentId,
        studentId: data.studentId,
        mark: data.mark,
        answers: { create: data.answers },
      },
      select: {
        id: true,
        mark: true,
        submittedAt: true,
        answers: { select: { questionId: true, selectedOption: true, isCorrect: true } },
      },
    });
  }

  // ── Assignment submissions ────────────────────────────────────────────

  async findAssignmentSubmission(assessmentId: string, studentId: string) {
    return this.db.assignmentSubmission.findUnique({
      where: { assessmentId_studentId: { assessmentId, studentId } },
      select: {
        id: true,
        mark: true,
        submittedAt: true,
        updatedAt: true,
        files: {
          select: { id: true, file: { select: { id: true, url: true, name: true, size: true, mimeType: true } } },
        },
      },
    });
  }

  async findAllAssignmentSubmissions(assessmentId: string) {
    return this.db.assignmentSubmission.findMany({
      where: { assessmentId },
      select: {
        id: true,
        mark: true,
        submittedAt: true,
        updatedAt: true,
        student: { select: { id: true, name: true, email: true } },
        files: {
          select: { id: true, file: { select: { id: true, url: true, name: true, size: true, mimeType: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async createAssignmentSubmission(assessmentId: string, studentId: string, fileIds: string[]) {
    return this.db.$transaction(async (tx) => {
      const submission = await tx.assignmentSubmission.create({
        data: { assessmentId, studentId },
        select: { id: true },
      });

      await tx.assignmentSubmissionFile.createMany({
        data: fileIds.map((fileId) => ({ submissionId: submission.id, fileId })),
      });

      return tx.assignmentSubmission.findUniqueOrThrow({
        where: { id: submission.id },
        select: {
          id: true,
          mark: true,
          submittedAt: true,
          updatedAt: true,
          files: {
            select: {
              id: true,
              file: { select: { id: true, url: true, name: true, size: true, mimeType: true } },
            },
          },
        },
      });
    });
  }

  async gradeAssignmentSubmission(submissionId: string, mark: number) {
    return this.db.assignmentSubmission.update({
      where: { id: submissionId },
      data: { mark },
      select: {
        id: true,
        mark: true,
        submittedAt: true,
        updatedAt: true,
        student: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ── Access helpers ────────────────────────────────────────────────────

  async isStaffForSubject(userId: string, subjectId: string) {
    const [direct, major] = await Promise.all([
      this.db.staffSubjectAssignment.findUnique({
        where: { userId_subjectId: { userId, subjectId } },
        select: { id: true },
      }),
      this.db.subject.findUnique({ where: { id: subjectId }, select: { majorId: true, joinYearId: true } })
        .then((s) =>
          s
            ? this.db.staffMajorAssignment.findFirst({
                where: { userId, majorId: s.majorId, joinYearId: s.joinYearId },
                select: { id: true },
              })
            : null,
        ),
    ]);
    return !!(direct || major);
  }

  async isEnrolledInSubject(userId: string, subjectId: string) {
    const row = await this.db.subjectEnrollment.findUnique({
      where: { userId_subjectId: { userId, subjectId } },
      select: { id: true },
    });
    return !!row;
  }

  async getEnrolledSubjectIds(userId: string) {
    const rows = await this.db.subjectEnrollment.findMany({
      where: { userId },
      select: { subjectId: true },
    });
    return rows.map((r) => r.subjectId);
  }

  async getAssignedSubjectIds(userId: string) {
    const [direct, majors] = await Promise.all([
      this.db.staffSubjectAssignment.findMany({ where: { userId }, select: { subjectId: true } }),
      this.db.staffMajorAssignment.findMany({
        where: { userId },
        select: { majorId: true, joinYearId: true },
      }).then((assignments) =>
        assignments.length
          ? this.db.subject.findMany({
              where: {
                OR: assignments.map((a) => ({ majorId: a.majorId, joinYearId: a.joinYearId })),
              },
              select: { id: true },
            })
          : [],
      ),
    ]);
    return [...new Set([...direct.map((d) => d.subjectId), ...majors.map((m) => m.id)])];
  }

  async getSubmissionCount(assessmentId: string, type: AssessmentType) {
    if (type === "quiz") {
      return this.db.quizSubmission.count({ where: { assessmentId } });
    }
    return this.db.assignmentSubmission.count({ where: { assessmentId } });
  }

  async getSubmittedAssessmentIds(userId: string, assessmentIds: string[]): Promise<Set<string>> {
    if (!assessmentIds.length) return new Set();
    const [quizSubs, asgSubs] = await Promise.all([
      this.db.quizSubmission.findMany({
        where: { studentId: userId, assessmentId: { in: assessmentIds } },
        select: { assessmentId: true },
      }),
      this.db.assignmentSubmission.findMany({
        where: { studentId: userId, assessmentId: { in: assessmentIds } },
        select: { assessmentId: true },
      }),
    ]);
    return new Set([...quizSubs.map((s) => s.assessmentId), ...asgSubs.map((s) => s.assessmentId)]);
  }
}
