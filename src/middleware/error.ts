import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { ApiError } from "../lib/apiError.js";
import { isProd } from "../config/env.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      success: false,
      error: { message: err.message, code: err.code },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: err.issues[0]?.message ?? "Invalid request.",
        code: "VALIDATION_ERROR",
        issues: err.issues,
      },
    });
    return;
  }

  const mongo = err as { code?: number; keyPattern?: Record<string, number> };
  if (mongo?.code === 11000) {
    const field = Object.keys(mongo.keyPattern ?? {})[0] ?? "field";
    res.status(409).json({
      success: false,
      error: { message: `A record with this ${field} already exists.`, code: "DUPLICATE" },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      message: isProd ? "Something went wrong." : err instanceof Error ? err.message : "Unknown error",
      code: "INTERNAL",
    },
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { message: "Route not found.", code: "NOT_FOUND" },
  });
}

export function validate(schema: ZodType, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    req[source] = result.data as never;
    next();
  };
}
