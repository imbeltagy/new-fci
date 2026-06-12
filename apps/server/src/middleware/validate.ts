import type { NextFunction, Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

export function validateBody<T extends object>(DtoClass: new () => T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(DtoClass, req.body);
    const errors = await validate(instance, { whitelist: true });

    if (errors.length > 0) {
      res.status(400).json({
        message: "Validation failed",
        errors: errors.map((e) => ({
          field: e.property,
          messages: Object.values(e.constraints ?? {}),
        })),
      });
      return;
    }

    req.body = instance;
    next();
  };
}
