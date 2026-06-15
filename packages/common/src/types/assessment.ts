export type AssessmentType = "quiz" | "assignment";

export interface AssessmentSubject {
  id: string;
  code: string;
  name: string;
  major: { id: string; code: string; name: string };
  joinYear: { id: string; year: number };
}

export interface AssessmentCreator {
  id: string;
  name: string;
  email: string;
}

export interface Assessment {
  id: string;
  type: AssessmentType;
  title: string;
  subjectId: string;
  subject: AssessmentSubject;
  creatorId: string;
  creator: AssessmentCreator;
  startDate: string;
  endDate: string;
  isVisible: boolean;
  publishedAt: string | null;
  markReadable: boolean;
  totalMark: number | null;
  submissionCount?: number;
  hasSubmitted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuizOption {
  id: string;
  text: string;
  index: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  degree: number;
  correctOption?: number;
  options: QuizOption[];
}

export interface AssessmentDetail extends Assessment {
  questions: QuizQuestion[] | null;
}

export interface QuizAnswer {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
}

export interface QuizSubmission {
  id: string;
  mark: number | null;
  submittedAt: string;
  answers: QuizAnswer[];
  student?: { id: string; name: string; email: string };
}

export interface SubmissionFile {
  id: string;
  file: { id: string; url: string; name: string; size: number; mimeType: string };
}

export interface AssignmentSubmission {
  id: string;
  mark: number | null;
  submittedAt: string;
  updatedAt: string;
  files: SubmissionFile[];
  student?: { id: string; name: string; email: string };
}

export interface CreateAssessmentBody {
  type: AssessmentType;
  subjectId: string;
  title: string;
  startDate: string;
  endDate: string;
  totalMark?: number;
}

export interface UpdateAssessmentBody {
  title?: string;
  startDate?: string;
  endDate?: string;
  totalMark?: number;
  isVisible?: boolean;
  markReadable?: boolean;
}

export interface AddQuestionBody {
  text: string;
  degree?: number;
  options: string[];
  correctOption: number;
}

export interface SubmitQuizBody {
  answers: { questionId: string; selectedOption: number }[];
}
