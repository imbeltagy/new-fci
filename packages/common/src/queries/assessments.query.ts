"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addQuestion,
  createAssessment,
  deleteAssessment,
  deleteQuestion,
  getAssessment,
  getSubmissions,
  gradeSubmission,
  listAssessments,
  submitAssignment,
  submitQuiz,
  updateAssessment,
  updateQuestion,
} from "../actions/assessments.action";
import type { AssessmentType, CreateAssessmentBody, UpdateAssessmentBody } from "../types/assessment";

export const ASSESSMENT_KEYS = {
  all: ["assessments"] as const,
  list: (params?: object) => ["assessments", "list", params] as const,
  detail: (id: string) => ["assessments", "detail", id] as const,
  submissions: (id: string) => ["assessments", "submissions", id] as const,
};

export function useListAssessmentsQuery(params?: {
  subjectId?: string;
  type?: AssessmentType;
  showOld?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.list(params),
    queryFn: () => listAssessments(params),
  });
}

export function useAssessmentDetailQuery(id: string) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.detail(id),
    queryFn: () => getAssessment(id),
    enabled: !!id,
  });
}

export function useAssessmentSubmissionsQuery(id: string) {
  return useQuery({
    queryKey: ASSESSMENT_KEYS.submissions(id),
    queryFn: () => getSubmissions(id),
    enabled: !!id,
  });
}

export function useCreateAssessmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAssessmentBody) => createAssessment(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSESSMENT_KEYS.all }),
  });
}

export function useUpdateAssessmentMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateAssessmentBody) => updateAssessment(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ASSESSMENT_KEYS.all });
    },
  });
}

export function useDeleteAssessmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAssessment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSESSMENT_KEYS.all }),
  });
}

export function useAddQuestionMutation(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof addQuestion>[1]) => addQuestion(assessmentId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSESSMENT_KEYS.detail(assessmentId) }),
  });
}

export function useUpdateQuestionMutation(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, body }: { questionId: string; body: Parameters<typeof updateQuestion>[2] }) =>
      updateQuestion(assessmentId, questionId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSESSMENT_KEYS.detail(assessmentId) }),
  });
}

export function useDeleteQuestionMutation(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(assessmentId, questionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSESSMENT_KEYS.detail(assessmentId) }),
  });
}

export function useSubmitQuizMutation(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Parameters<typeof submitQuiz>[1]) => {
      const res = await submitQuiz(assessmentId, body);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ASSESSMENT_KEYS.submissions(assessmentId) });
      qc.invalidateQueries({ queryKey: ASSESSMENT_KEYS.detail(assessmentId) });
    },
  });
}

export function useSubmitAssignmentMutation(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const res = await submitAssignment(assessmentId, files);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSESSMENT_KEYS.submissions(assessmentId) }),
  });
}

export function useGradeSubmissionMutation(assessmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, mark }: { submissionId: string; mark: number }) =>
      gradeSubmission(assessmentId, submissionId, mark),
    onSuccess: () => qc.invalidateQueries({ queryKey: ASSESSMENT_KEYS.submissions(assessmentId) }),
  });
}
