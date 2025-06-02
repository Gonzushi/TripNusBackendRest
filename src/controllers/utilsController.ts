import { Request, Response } from "express";

// Redirect to Reset Password
export const redirect = async (
  req: Request,
  res: Response
): Promise<void> => {
  const target = req.query.target as string;

  if (!target) {
    res.status(400).json({
      status: 400,
      error: "Bad Request",
      message: 'Missing "target" query parameter',
      code: "QUERY_PARAM_MISSING",
    });
    return;
  }

  res.redirect(302, target);
};
