import { DecodedToken } from "./auth";

declare module "fastify" {
  interface FastifyRequest {
    user?: DecodedToken;
  }
}

export {};
