import { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Handle invalid JSON or content type errors
  if (
    error.code === "FST_ERR_CTP_INVALID_CONTENT_TYPE" ||
    error.code === "FST_ERR_CTP_BODY_PARSE"
  ) {
    reply.status(400).send({
      status: 400,
      error: "Bad Request",
      message: "Invalid JSON format in request body.",
      code: "INVALID_JSON",
    });
    return;
  }

  // General error fallback
  request.log.error(error);

  reply.status(error.statusCode || 500).send({
    status: error.statusCode || 500,
    error: error.name || "Internal Server Error",
    message: error.message || "An unexpected error occurred.",
    code: "INTERNAL_ERROR",
  });
}
