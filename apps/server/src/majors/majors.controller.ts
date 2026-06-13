import type { Request, Response } from "express";

import { Role } from "@prisma/client";

import type { AssignStaffToMajorDto } from "./dto/request/assign-staff.dto";
import type { CreateMajorDto } from "./dto/request/create-major.dto";
import type { UpdateMajorDto } from "./dto/request/update-major.dto";
import { MajorsService } from "./majors.service";

const svc = new MajorsService();

const isAdminRole = (role: Role) => role === Role.it || role === Role.superadmin;

export async function getMajorDetail(req: Request, res: Response) {
  try {
    const { sub, role } = req.user!;
    const { joinYearId } = req.query as Record<string, string | undefined>;
    const detail = await svc.getMajorDetail(
      req.params["id"] as string,
      joinYearId ?? "",
      sub,
      role,
      isAdminRole(role),
    );
    res.json(detail);
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function listMajors(_req: Request, res: Response) {
  try {
    res.json({ majors: await svc.listMajors() });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createMajor(req: Request, res: Response) {
  try {
    res.status(201).json({ major: await svc.createMajor(req.body as CreateMajorDto) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getMajor(req: Request, res: Response) {
  try {
    res.json({ major: await svc.getMajor(req.params["id"] as string) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updateMajor(req: Request, res: Response) {
  try {
    res.json({
      major: await svc.updateMajor(req.params["id"] as string, req.body as UpdateMajorDto),
    });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deleteMajor(req: Request, res: Response) {
  try {
    await svc.deleteMajor(req.params["id"] as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getMajorStaff(req: Request, res: Response) {
  try {
    const { joinYearId } = req.query as Record<string, string | undefined>;
    res.json({ staff: await svc.getStaff(req.params["id"] as string, joinYearId) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function assignMajorStaff(req: Request, res: Response) {
  try {
    res.status(201).json(await svc.assignStaff(req.params["id"] as string, req.body as AssignStaffToMajorDto));
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function removeMajorStaff(req: Request, res: Response) {
  try {
    await svc.removeStaff(
      req.params["id"] as string,
      req.params["userId"] as string,
      req.params["joinYearId"] as string,
    );
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
