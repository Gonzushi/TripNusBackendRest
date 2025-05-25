import { Request, Response, NextFunction } from "express";
import { DecodedToken } from "../types/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      status: 401,
      error: "Unauthorized",
      message: "Missing or invalid Authorization header",
      code: "AUTH_HEADER_MISSING",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      status: 401,
      error: "Unauthorized",
      message: "Invalid or expired token",
      code: "INVALID_TOKEN",
    });
  }
};
