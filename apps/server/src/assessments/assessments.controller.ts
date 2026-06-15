import type { Request, Response } from "express";

import { AssessmentType } from "@prisma/client";

import type { AddQuizQuestionDto } from "./dto/request/add-quiz-question.dto";
import type { CreateAssessmentDto } from "./dto/request/create-assessment.dto";
import type { GradeAssignmentDto } from "./dto/request/grade-assignment.dto";
import type { SubmitQuizDto } from "./dto/request/submit-quiz.dto";
import type { UpdateAssessmentDto } from "./dto/request/update-assessment.dto";
import type { UpdateQuizQuestionDto } from "./dto/request/update-quiz-question.dto";
import { AssessmentsService } from "./assessments.service";

const svc = new AssessmentsService();

export async function listAssessments(req: Request, res: Response) {
  try {
    const { subjectId, type, showOld, limit } = req.query as Record<string, string | undefined>;
    const items = await svc.listAssessments(req.user!.sub, req.user!.role, {
      subjectId,
      type: type as AssessmentType | undefined,
      showOld: showOld === "true",
      limit: limit ? parseInt(limit) : undefined,
    });
    res.json({ assessments: items });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getAssessment(req: Request, res: Response) {
  try {
    const detail = await svc.getAssessment(req.params["id"] as string, req.user!.sub, req.user!.role);
    res.json({ assessment: detail });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createAssessment(req: Request, res: Response) {
  try {
    const assessment = await svc.createAssessment(req.user!.sub, req.user!.role, req.body as CreateAssessmentDto);
    res.status(201).json({ assessment });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updateAssessment(req: Request, res: Response) {
  try {
    const assessment = await svc.updateAssessment(
      req.params["id"] as string,
      req.user!.sub,
      req.user!.role,
      req.body as UpdateAssessmentDto,
    );
    res.json({ assessment });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deleteAssessment(req: Request, res: Response) {
  try {
    await svc.deleteAssessment(req.params["id"] as string, req.user!.sub, req.user!.role);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function addQuestion(req: Request, res: Response) {
  try {
    const question = await svc.addQuestion(
      req.params["id"] as string,
      req.user!.sub,
      req.user!.role,
      req.body as AddQuizQuestionDto,
    );
    res.status(201).json({ question });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updateQuestion(req: Request, res: Response) {
  try {
    const question = await svc.updateQuestion(
      req.params["id"] as string,
      req.params["qId"] as string,
      req.user!.sub,
      req.user!.role,
      req.body as UpdateQuizQuestionDto,
    );
    res.json({ question });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deleteQuestion(req: Request, res: Response) {
  try {
    await svc.deleteQuestion(req.params["id"] as string, req.params["qId"] as string, req.user!.sub, req.user!.role);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getSubmissions(req: Request, res: Response) {
  try {
    const result = await svc.getSubmissions(req.params["id"] as string, req.user!.sub, req.user!.role);
    res.json(result);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function submitAssessment(req: Request, res: Response) {
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];

    if (files.length > 0) {
      const submission = await svc.submitAssignment(req.params["id"] as string, req.user!.sub, files);
      res.status(201).json({ submission });
    } else {
      const submission = await svc.submitQuiz(
        req.params["id"] as string,
        req.user!.sub,
        req.body as SubmitQuizDto,
      );
      res.status(201).json({ submission });
    }
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function gradeSubmission(req: Request, res: Response) {
  try {
    const result = await svc.gradeAssignment(
      req.params["id"] as string,
      req.params["sId"] as string,
      req.user!.sub,
      req.user!.role,
      req.body as GradeAssignmentDto,
    );
    res.json({ submission: result });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
