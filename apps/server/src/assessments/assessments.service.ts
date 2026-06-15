import { AssessmentType, Role } from "@prisma/client";

import { FilesService } from "../files/files.service";
import type { AddQuizQuestionDto } from "./dto/request/add-quiz-question.dto";
import type { CreateAssessmentDto } from "./dto/request/create-assessment.dto";
import type { GradeAssignmentDto } from "./dto/request/grade-assignment.dto";
import type { SubmitQuizDto } from "./dto/request/submit-quiz.dto";
import type { UpdateAssessmentDto } from "./dto/request/update-assessment.dto";
import type { UpdateQuizQuestionDto } from "./dto/request/update-quiz-question.dto";
import { AssessmentsRepository } from "./assessments.repository";

const err = (message: string, status: number) => Object.assign(new Error(message), { status });

const isAdmin = (role: Role) => role === Role.it || role === Role.superadmin;
const isStaff = (role: Role) => role === Role.teacher || role === Role.sub_teacher;

export class AssessmentsService {
  constructor(
    private readonly repo = new AssessmentsRepository(),
    private readonly files = new FilesService(),
  ) {}

  private computeTotalMark(assessment: { quiz: { questions: { degree: number }[] } | null; assignmentDetails: { totalMark: number } | null }) {
    if (assessment.quiz) {
      return assessment.quiz.questions.reduce((sum, q) => sum + q.degree, 0);
    }
    return assessment.assignmentDetails?.totalMark ?? null;
  }

  private formatAssessment(a: Awaited<ReturnType<AssessmentsRepository["findAll"]>>[0]) {
    const totalMark = this.computeTotalMark(a as any);
    return {
      id: a.id,
      type: a.type,
      title: a.title,
      subjectId: a.subjectId,
      subject: a.subject,
      creatorId: a.creatorId,
      creator: a.creator,
      startDate: a.startDate,
      endDate: a.endDate,
      isVisible: a.isVisible,
      publishedAt: a.publishedAt,
      markReadable: a.markReadable,
      totalMark,
      submissionCount: (a as any)._count?.quizSubmissions ?? (a as any)._count?.assignmentSubmissions ?? 0,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  async listAssessments(
    userId: string,
    role: Role,
    filter: { subjectId?: string; type?: AssessmentType; showOld?: boolean; limit?: number },
  ) {
    const admin = isAdmin(role);
    const staff = isStaff(role);

    let subjectIds: string[] | undefined;
    if (!admin && !filter.subjectId) {
      subjectIds = staff
        ? await this.repo.getAssignedSubjectIds(userId)
        : await this.repo.getEnrolledSubjectIds(userId);
    }

    const items = await this.repo.findAll({
      subjectId: filter.subjectId,
      subjectIds: filter.subjectId ? undefined : subjectIds,
      type: filter.type,
      visibleOnly: !admin && !staff,
      showOld: filter.showOld,
      limit: filter.limit,
    });

    const formatted = items.map((a) => this.formatAssessment(a));

    if (!admin && !staff && formatted.length) {
      const submittedIds = await this.repo.getSubmittedAssessmentIds(
        userId,
        formatted.map((a) => a.id),
      );
      return formatted.map((a) => ({ ...a, hasSubmitted: submittedIds.has(a.id) }));
    }

    return formatted;
  }

  async getAssessment(id: string, userId: string, role: Role) {
    const assessment = await this.repo.findById(id);
    if (!assessment) throw err("Assessment not found", 404);

    const admin = isAdmin(role);
    const staff = isStaff(role);

    if (!admin) {
      if (staff) {
        const allowed = await this.repo.isStaffForSubject(userId, assessment.subjectId);
        if (!allowed) throw err("Forbidden", 403);
      } else {
        if (!assessment.isVisible) throw err("Assessment not found", 404);
        const allowed = await this.repo.isEnrolledInSubject(userId, assessment.subjectId);
        if (!allowed) throw err("Forbidden", 403);
      }
    }

    const now = new Date();
    const inWindow = now >= assessment.startDate && now <= assessment.endDate;

    const questions = assessment.quiz?.questions.map((q) => ({
      id: q.id,
      text: q.text,
      degree: q.degree,
      options: q.options,
      ...(admin || staff ? { correctOption: q.correctOption } : {}),
    })) ?? null;

    const totalMark = assessment.quiz
      ? (assessment.quiz.questions.reduce((sum, q) => sum + q.degree, 0))
      : (assessment.assignmentDetails?.totalMark ?? null);

    return {
      id: assessment.id,
      type: assessment.type,
      title: assessment.title,
      subjectId: assessment.subjectId,
      subject: assessment.subject,
      creatorId: assessment.creatorId,
      creator: assessment.creator,
      startDate: assessment.startDate,
      endDate: assessment.endDate,
      isVisible: assessment.isVisible,
      publishedAt: assessment.publishedAt,
      markReadable: assessment.markReadable,
      totalMark,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt,
      questions: admin || staff ? questions : (inWindow ? questions : []),
    };
  }

  async createAssessment(userId: string, role: Role, dto: CreateAssessmentDto) {
    const admin = isAdmin(role);
    if (!admin) {
      if (!isStaff(role)) throw err("Forbidden", 403);
      const allowed = await this.repo.isStaffForSubject(userId, dto.subjectId);
      if (!allowed) throw err("You are not assigned to this subject", 403);
    }

    if (dto.startDate >= dto.endDate) throw err("startDate must be before endDate", 400);
    if (dto.type === "assignment" && dto.totalMark === undefined) {
      throw err("totalMark is required for assignments", 400);
    }

    return this.repo.create({
      type: dto.type as AssessmentType,
      subjectId: dto.subjectId,
      creatorId: userId,
      title: dto.title,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalMark: dto.totalMark,
    });
  }

  async updateAssessment(id: string, userId: string, role: Role, dto: UpdateAssessmentDto) {
    const assessment = await this.repo.findById(id);
    if (!assessment) throw err("Assessment not found", 404);

    const admin = isAdmin(role);
    if (!admin && assessment.creatorId !== userId) throw err("Forbidden", 403);

    if (dto.isVisible === false && assessment.isVisible && !admin) {
      throw err("Only administrators can un-publish an assessment", 403);
    }

    if (dto.markReadable === false && assessment.markReadable && !admin) {
      throw err("Only administrators can hide marks after releasing them", 403);
    }

    if (dto.markReadable === true && !assessment.markReadable) {
      if (new Date() < assessment.endDate) {
        throw err("Marks cannot be released before the assessment ends", 400);
      }
    }

    if (dto.startDate && dto.endDate && dto.startDate >= dto.endDate) {
      throw err("startDate must be before endDate", 400);
    }

    const publishedAt =
      dto.isVisible === true && !assessment.isVisible ? new Date() : undefined;

    // TODO: when announcements are built, send announcement here on isVisible=true and markReadable=true

    return this.repo.update(
      id,
      {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
        ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
        ...(publishedAt !== undefined && { publishedAt }),
        ...(dto.markReadable !== undefined && { markReadable: dto.markReadable }),
      },
      dto.totalMark,
    );
  }

  async deleteAssessment(id: string, userId: string, role: Role) {
    const assessment = await this.repo.findById(id);
    if (!assessment) throw err("Assessment not found", 404);

    const admin = isAdmin(role);
    if (!admin && assessment.creatorId !== userId) throw err("Forbidden", 403);

    const count = await this.repo.getSubmissionCount(id, assessment.type as AssessmentType);
    if (count > 0) throw err("Cannot delete an assessment that has submissions", 409);

    await this.repo.delete(id);
  }

  // ── Quiz questions ──────────────────────────────────────────────────

  private async requireQuizWriteAccess(assessmentId: string, userId: string, role: Role) {
    const assessment = await this.repo.findById(assessmentId);
    if (!assessment || assessment.type !== "quiz") throw err("Quiz not found", 404);
    if (!isAdmin(role) && assessment.creatorId !== userId) throw err("Forbidden", 403);
    if (assessment.isVisible && !isAdmin(role)) throw err("Quiz questions cannot be modified after publishing", 409);
    return assessment;
  }

  async addQuestion(assessmentId: string, userId: string, role: Role, dto: AddQuizQuestionDto) {
    const assessment = await this.requireQuizWriteAccess(assessmentId, userId, role);
    if (dto.correctOption >= dto.options.length) {
      throw err("correctOption index is out of range", 400);
    }
    return this.repo.addQuestion(assessment.id, {
      text: dto.text,
      degree: dto.degree,
      options: dto.options,
      correctOption: dto.correctOption,
    });
  }

  async updateQuestion(
    assessmentId: string,
    questionId: string,
    userId: string,
    role: Role,
    dto: UpdateQuizQuestionDto,
  ) {
    const assessment = await this.requireQuizWriteAccess(assessmentId, userId, role);
    const question = await this.repo.findQuestion(questionId);
    if (!question || question.quizId !== assessment.id) throw err("Question not found", 404);

    if (dto.correctOption !== undefined && dto.options !== undefined && dto.correctOption >= dto.options.length) {
      throw err("correctOption index is out of range", 400);
    }

    return this.repo.updateQuestion(questionId, {
      text: dto.text,
      degree: dto.degree,
      options: dto.options,
      correctOption: dto.correctOption,
    });
  }

  async deleteQuestion(assessmentId: string, questionId: string, userId: string, role: Role) {
    const assessment = await this.requireQuizWriteAccess(assessmentId, userId, role);
    const question = await this.repo.findQuestion(questionId);
    if (!question || question.quizId !== assessment.id) throw err("Question not found", 404);
    await this.repo.deleteQuestion(questionId);
  }

  // ── Submissions ─────────────────────────────────────────────────────

  async getSubmissions(assessmentId: string, userId: string, role: Role) {
    const assessment = await this.repo.findById(assessmentId);
    if (!assessment) throw err("Assessment not found", 404);

    const admin = isAdmin(role);
    const staff = isStaff(role);

    if (!admin) {
      if (staff) {
        const allowed = await this.repo.isStaffForSubject(userId, assessment.subjectId);
        if (!allowed) throw err("Forbidden", 403);
      } else {
        const allowed = await this.repo.isEnrolledInSubject(userId, assessment.subjectId);
        if (!allowed) throw err("Forbidden", 403);
      }
    }

    const isTeacherOrAdmin = admin || staff;

    if (assessment.type === "quiz") {
      if (isTeacherOrAdmin) {
        return { type: "quiz", submissions: await this.repo.findAllQuizSubmissions(assessmentId) };
      }
      const sub = await this.repo.findQuizSubmission(assessmentId, userId);
      const mark = sub && assessment.markReadable ? sub.mark : null;
      return { type: "quiz", submission: sub ? { ...sub, mark } : null };
    } else {
      if (isTeacherOrAdmin) {
        return { type: "assignment", submissions: await this.repo.findAllAssignmentSubmissions(assessmentId) };
      }
      const sub = await this.repo.findAssignmentSubmission(assessmentId, userId);
      const mark = sub && assessment.markReadable ? sub.mark : null;
      return { type: "assignment", submission: sub ? { ...sub, mark } : null };
    }
  }

  async submitQuiz(assessmentId: string, userId: string, dto: SubmitQuizDto) {
    const assessment = await this.repo.findById(assessmentId);
    if (!assessment || assessment.type !== "quiz") throw err("Quiz not found", 404);
    if (!assessment.isVisible) throw err("Quiz not found", 404);

    const allowed = await this.repo.isEnrolledInSubject(userId, assessment.subjectId);
    if (!allowed) throw err("Forbidden", 403);

    const now = new Date();
    if (now < assessment.startDate) throw err("Quiz has not started yet", 400);
    if (now > assessment.endDate) throw err("Quiz window has closed", 400);

    const existing = await this.repo.findQuizSubmission(assessmentId, userId);
    if (existing) throw err("You have already submitted this quiz", 409);

    const questions = assessment.quiz?.questions ?? [];
    if (dto.answers.length !== questions.length) {
      throw err(`Expected ${questions.length} answers, got ${dto.answers.length}`, 400);
    }

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let mark = 0;
    const answers = dto.answers.map((a) => {
      const q = questionMap.get(a.questionId);
      if (!q) throw err(`Unknown question: ${a.questionId}`, 400);
      const isCorrect = a.selectedOption === q.correctOption;
      if (isCorrect) mark += q.degree;
      return { questionId: a.questionId, selectedOption: a.selectedOption, isCorrect };
    });

    return this.repo.createQuizSubmission({ assessmentId, studentId: userId, mark, answers });
  }

  async submitAssignment(
    assessmentId: string,
    userId: string,
    uploadedFiles: Express.Multer.File[],
  ) {
    const assessment = await this.repo.findById(assessmentId);
    if (!assessment || assessment.type !== "assignment") throw err("Assignment not found", 404);
    if (!assessment.isVisible) throw err("Assignment not found", 404);

    const allowed = await this.repo.isEnrolledInSubject(userId, assessment.subjectId);
    if (!allowed) throw err("Forbidden", 403);

    const now = new Date();
    if (now < assessment.startDate) throw err("Assignment has not started yet", 400);
    if (now > assessment.endDate) throw err("Assignment deadline has passed", 400);

    if (!uploadedFiles.length) throw err("At least one file is required", 400);

    const existingSub = await this.repo.findAssignmentSubmission(assessmentId, userId);
    if (existingSub) throw err("You have already submitted this assignment", 409);

    const uploadedFileRecords = await Promise.all(
      uploadedFiles.map((f) => this.files.upload(f.buffer, f.originalname, f.mimetype, f.size)),
    );

    return this.repo.createAssignmentSubmission(assessmentId, userId, uploadedFileRecords.map((f) => f.id));
  }

  async gradeAssignment(
    assessmentId: string,
    submissionId: string,
    userId: string,
    role: Role,
    dto: GradeAssignmentDto,
  ) {
    const assessment = await this.repo.findById(assessmentId);
    if (!assessment || assessment.type !== "assignment") throw err("Assignment not found", 404);

    const admin = isAdmin(role);
    if (!admin && !isStaff(role)) throw err("Forbidden", 403);
    if (!admin) {
      const allowed = await this.repo.isStaffForSubject(userId, assessment.subjectId);
      if (!allowed) throw err("Forbidden", 403);
    }

    const totalMark = assessment.assignmentDetails?.totalMark ?? 0;
    if (dto.mark > totalMark) throw err(`Mark cannot exceed total mark of ${totalMark}`, 400);

    return this.repo.gradeAssignmentSubmission(submissionId, dto.mark);
  }
}
