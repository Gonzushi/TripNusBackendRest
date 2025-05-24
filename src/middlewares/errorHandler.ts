import { ErrorRequestHandler, Request, Response, NextFunction } from "express";

// Handle JSON parse errors
export const jsonParseErrorHandler: ErrorRequestHandler = (err, req, res, next): void => {
  if (
    err instanceof SyntaxError &&
    (err as any).status === 400 &&
    "body" in err
  ) {
    console.error("Invalid JSON error:", err.message);
    res.status(400).json({ error: "Invalid JSON format" });
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
) => {
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Internal Server Error" });
};
