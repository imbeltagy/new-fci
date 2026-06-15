import { Router } from "express";
import multer from "multer";

import { Role } from "@prisma/client";

import { auth, authEither } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as ctrl from "./assessments.controller";
import { AddQuizQuestionDto } from "./dto/request/add-quiz-question.dto";
import { CreateAssessmentDto } from "./dto/request/create-assessment.dto";
import { GradeAssignmentDto } from "./dto/request/grade-assignment.dto";
import { SubmitQuizDto } from "./dto/request/submit-quiz.dto";
import { UpdateAssessmentDto } from "./dto/request/update-assessment.dto";
import { UpdateQuizQuestionDto } from "./dto/request/update-quiz-question.dto";

const upload = multer({ storage: multer.memoryStorage() });

const anyClient: Role[] = [Role.student, Role.teacher, Role.sub_teacher];
const anyAdmin: Role[] = [Role.it, Role.superadmin];
const staffOnly: Role[] = [Role.teacher, Role.sub_teacher];

const anyAuth = authEither({ clientRoles: anyClient, adminRoles: anyAdmin });
const staffOrAdmin = authEither({ clientRoles: staffOnly, adminRoles: anyAdmin });
const studentOnly = auth({ authorization: "jwt", roles: [Role.student] });
const adminOnly = auth({ authorization: "session", roles: anyAdmin });

export const assessmentsRouter = Router();

assessmentsRouter.get("/", anyAuth, ctrl.listAssessments);
assessmentsRouter.post("/", staffOrAdmin, validateBody(CreateAssessmentDto), ctrl.createAssessment);
assessmentsRouter.get("/:id", anyAuth, ctrl.getAssessment);
assessmentsRouter.patch("/:id", staffOrAdmin, validateBody(UpdateAssessmentDto), ctrl.updateAssessment);
assessmentsRouter.delete("/:id", staffOrAdmin, ctrl.deleteAssessment);

assessmentsRouter.post("/:id/questions", staffOrAdmin, validateBody(AddQuizQuestionDto), ctrl.addQuestion);
assessmentsRouter.put("/:id/questions/:qId", staffOrAdmin, validateBody(UpdateQuizQuestionDto), ctrl.updateQuestion);
assessmentsRouter.delete("/:id/questions/:qId", staffOrAdmin, ctrl.deleteQuestion);

assessmentsRouter.get("/:id/submissions", anyAuth, ctrl.getSubmissions);
assessmentsRouter.post("/:id/submissions", studentOnly, upload.array("files"), ctrl.submitAssessment);
assessmentsRouter.patch("/:id/submissions/:sId/mark", staffOrAdmin, validateBody(GradeAssignmentDto), ctrl.gradeSubmission);
