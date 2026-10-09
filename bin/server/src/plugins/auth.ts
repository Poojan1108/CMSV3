import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'STAFF' | 'ADMIN';
  orgKey: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    verifyRole: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: TokenPayload;
  }
}

export const authPlugin: FastifyPluginAsync = async (fastify) => {
  const secret = process.env.JWT_SECRET || 'cms-super-secret-jwt-key-change-in-production-2026';

  await fastify.register(fastifyJwt, {
    secret,
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or missing authorization token.',
      });
    }
  });

  fastify.decorate('verifyRole', (allowedRoles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      await fastify.authenticate(request, reply);
      const user = request.user as TokenPayload;
      if (!allowedRoles.includes(user.role)) {
        reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        });
      }
    };
  });
};
