import { FastifyRequest, RouteGenericInterface } from 'fastify';
import { DecodedToken } from './auth';

export type AuthenticatedRequest<T extends RouteGenericInterface = {}> = 
  FastifyRequest<T> & {
    user?: DecodedToken;
  };