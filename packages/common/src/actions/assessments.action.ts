"use client";

import { API_ROUTES } from "../constants/api";
import { api } from "../lib/api-client";
import type {
  AddQuestionBody,
  Assessment,
  AssessmentDetail,
  AssessmentType,
  AssignmentSubmission,
  CreateAssessmentBody,
  QuizSubmission,
  SubmitQuizBody,
  UpdateAssessmentBody,
} from "../types/assessment";

export async function listAssessments(params?: {
  subjectId?: string;
  type?: AssessmentType;
  showOld?: boolean;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.subjectId) qs.set("subjectId", params.subjectId);
  if (params?.type) qs.set("type", params.type);
  if (params?.showOld) qs.set("showOld", "true");
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return api.get<{ assessments: Assessment[] }>(`${API_ROUTES.assessments.list}${query ? `?${query}` : ""}`);
}

export async function getAssessment(id: string) {
  return api.get<{ assessment: AssessmentDetail }>(API_ROUTES.assessments.getById(id));
}

export async function createAssessment(body: CreateAssessmentBody) {
  return api.post<{ assessment: Assessment }>(API_ROUTES.assessments.create, body);
}

export async function updateAssessment(id: string, body: UpdateAssessmentBody) {
  return api.patch<{ assessment: Assessment }>(API_ROUTES.assessments.updateById(id), body);
}

export async function deleteAssessment(id: string) {
  return api.delete<null>(API_ROUTES.assessments.deleteById(id));
}

export async function addQuestion(assessmentId: string, body: AddQuestionBody) {
  return api.post<{ question: unknown }>(API_ROUTES.assessments.questions(assessmentId), body);
}

export async function updateQuestion(assessmentId: string, questionId: string, body: Partial<AddQuestionBody>) {
  return api.put<{ question: unknown }>(API_ROUTES.assessments.question(assessmentId, questionId), body);
}

export async function deleteQuestion(assessmentId: string, questionId: string) {
  return api.delete<null>(API_ROUTES.assessments.question(assessmentId, questionId));
}

export async function getSubmissions(assessmentId: string) {
  return api.get<
    | { type: "quiz"; submissions: QuizSubmission[] }
    | { type: "quiz"; submission: QuizSubmission | null }
    | { type: "assignment"; submissions: AssignmentSubmission[] }
    | { type: "assignment"; submission: AssignmentSubmission | null }
  >(API_ROUTES.assessments.submissions(assessmentId));
}

export async function submitQuiz(assessmentId: string, body: SubmitQuizBody) {
  return api.post<{ submission: QuizSubmission }>(API_ROUTES.assessments.submissions(assessmentId), body);
}

export async function submitAssignment(assessmentId: string, files: File[]) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return api.post<{ submission: AssignmentSubmission }>(
    API_ROUTES.assessments.submissions(assessmentId),
    form,
  );
}

export async function gradeSubmission(assessmentId: string, submissionId: string, mark: number) {
  return api.patch<{ submission: AssignmentSubmission }>(
    API_ROUTES.assessments.gradeSubmission(assessmentId, submissionId),
    { mark },
  );
}
