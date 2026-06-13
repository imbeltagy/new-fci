import type { Request, Response } from "express";

import type { AssignMajorDto } from "./dto/request/assign-major.dto";
import { AssignmentsService } from "./assignments.service";

const svc = new AssignmentsService();

export async function getAssignments(req: Request, res: Response) {
  try {
    res.json(await svc.getAssignments(req.params["userId"] as string));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function assignJoinYear(req: Request, res: Response) {
  try {
    res.status(201).json(
      await svc.assignJoinYear(req.params["userId"] as string, req.params["joinYearId"] as string),
    );
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function removeJoinYear(req: Request, res: Response) {
  try {
    await svc.removeJoinYear(req.params["userId"] as string, req.params["joinYearId"] as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function assignMajor(req: Request, res: Response) {
  try {
    res.status(201).json(
      await svc.assignMajor(req.params["userId"] as string, req.body as AssignMajorDto),
    );
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function removeMajor(req: Request, res: Response) {
  try {
    await svc.removeMajor(
      req.params["userId"] as string,
      req.params["majorId"] as string,
      req.params["joinYearId"] as string,
    );
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function assignSubject(req: Request, res: Response) {
  try {
    res.status(201).json(
      await svc.assignSubject(req.params["userId"] as string, req.params["subjectId"] as string),
    );
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function removeSubject(req: Request, res: Response) {
  try {
    await svc.removeSubject(req.params["userId"] as string, req.params["subjectId"] as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
