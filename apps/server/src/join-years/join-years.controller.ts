import type { Request, Response } from "express";

import type { CreateJoinYearDto } from "./dto/request/create-join-year.dto";
import type { UpdateJoinYearDto } from "./dto/request/update-join-year.dto";
import { JoinYearsService } from "./join-years.service";

const svc = new JoinYearsService();

export async function listJoinYears(_req: Request, res: Response) {
  try {
    res.json({ joinYears: await svc.listJoinYears() });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function createJoinYear(req: Request, res: Response) {
  try {
    res.status(201).json({ joinYear: await svc.createJoinYear(req.body as CreateJoinYearDto) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function getJoinYear(req: Request, res: Response) {
  try {
    res.json({ joinYear: await svc.getJoinYear(req.params["id"] as string) });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function updateJoinYear(req: Request, res: Response) {
  try {
    res.json({
      joinYear: await svc.updateJoinYear(req.params["id"] as string, req.body as UpdateJoinYearDto),
    });
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}

export async function deleteJoinYear(req: Request, res: Response) {
  try {
    await svc.deleteJoinYear(req.params["id"] as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(err.status ?? 500).json({ message: err.message });
  }
}
