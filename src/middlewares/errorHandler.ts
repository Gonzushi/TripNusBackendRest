import { ErrorRequestHandler, Request, Response, NextFunction } from "express";

// Handle JSON parse errors
export const jsonParseErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next
): void => {
  if (
    err instanceof SyntaxError &&
    (err as any).status === 400 &&
    "body" in err
  ) {
    console.error("Invalid JSON error:", err.message);
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: "Invalid JSON format in request body.",
      code: "INVALID_JSON",
    });
    return;
  }
  next(err);
};

// Catch-all error handler
export const generalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("Unexpected error:", err);
  res.status(500).json({
    status: 500,
    error: "Internal Server Error",
    message: "An unexpected error occurred.",
    code: "INTERNAL_ERROR",
    details: err?.message || undefined,
  });
};
