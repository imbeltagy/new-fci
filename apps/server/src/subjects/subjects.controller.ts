import type { Request, Response } from "express";

import { Role } from "@prisma/client";

import type { AssignStaffToSubjectDto } from "./dto/request/assign-staff.dto";
import type { CreateSubjectDto } from "./dto/request/create-subject.dto";
import type { UpdateSubjectDto } from "./dto/request/update-subject.dto";
import { SubjectsService } from "./subjects.service";

const svc = new SubjectsService();

const isAdminRole = (role: Role) => role === Role.it || role === Role.superadmin;

export async function getSubjectDetail(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const detail = await svc.getSubjectDetail(
      req.params["id"] as string,
      sub,
      role,
      isAdminRole(role),
    );
    res.json(detail);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function listSubjects(req: Request, res: Response) {
  try {
    const { joinYearId, majorId } = req.query as Record<string, string | undefined>;
    res.json({ subjects: await svc.listSubjects({ joinYearId, majorId }) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createSubject(req: Request, res: Response) {
  try {
    res.status(201).json({ subject: await svc.createSubject(req.body as CreateSubjectDto) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getSubject(req: Request, res: Response) {
  try {
    res.json({ subject: await svc.getSubject(req.params["id"] as string) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updateSubject(req: Request, res: Response) {
  try {
    res.json({
      subject: await svc.updateSubject(req.params["id"] as string, req.body as UpdateSubjectDto),
    });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deleteSubject(req: Request, res: Response) {
  try {
    await svc.deleteSubject(req.params["id"] as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getSubjectStaff(req: Request, res: Response) {
  try {
    res.json({ staff: await svc.getStaff(req.params["id"] as string) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function assignSubjectStaff(req: Request, res: Response) {
  try {
    res.status(201).json(await svc.assignStaff(req.params["id"] as string, req.body as AssignStaffToSubjectDto));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function removeSubjectStaff(req: Request, res: Response) {
  try {
    await svc.removeStaff(req.params["id"] as string, req.params["userId"] as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getEnrollments(req: Request, res: Response) {
  try {
    res.json({ enrollments: await svc.getEnrollments(req.params["id"] as string) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function bulkEnroll(req: Request, res: Response) {
  try {
    const result = await svc.bulkEnroll(req.params["id"] as string);
    res.json({ count: result.count });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function enrollStudent(req: Request, res: Response) {
  try {
    res.status(201).json(
      await svc.enrollStudent(req.params["id"] as string, req.params["userId"] as string),
    );
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function unenrollStudent(req: Request, res: Response) {
  try {
    await svc.unenrollStudent(req.params["id"] as string, req.params["userId"] as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
