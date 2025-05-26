import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { DecodedToken } from "../types/auth";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

export async function authenticateUser(
  request: FastifyRequest & { user?: DecodedToken },
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.status(401).send({
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
    // Attach decoded user info to request.user
    // Fastify allows extending request interface with decorators or types
    request.user = decoded;
  } catch (err) {
    reply.status(401).send({
      status: 401,
      error: "Unauthorized",
      message: "Invalid or expired token",
      code: "INVALID_TOKEN",
    });
    return;
  }
}
