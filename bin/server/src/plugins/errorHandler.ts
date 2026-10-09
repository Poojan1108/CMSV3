import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(error: FastifyError, _request: FastifyRequest, reply: FastifyReply) {
  // Handle Zod Validation Errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      issues: error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  // Handle Fastify Schema Validation Errors
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: error.message,
      details: error.validation,
    });
  }

  // Handle Prisma Unique Constraint Violations (P2002)
  if ((error as any).code === 'P2002') {
    const target = (error as any).meta?.target || 'field';
    return reply.status(409).send({
      statusCode: 409,
      error: 'Conflict',
      message: `A record with this ${target} already exists.`,
    });
  }

  // Handle Prisma Record Not Found (P2025)
  if ((error as any).code === 'P2025') {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'The requested resource was not found.',
    });
  }

  // Handle Auth / JWT Errors
  if (error.statusCode === 401 || error.name === 'UnauthorizedError') {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message || 'Invalid or missing authentication token',
    });
  }

  if (error.statusCode === 403) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: error.message || 'You do not have permission to perform this action',
    });
  }

  // Default fallback 500
  reply.log.error(error);
  return reply.status(error.statusCode || 500).send({
    statusCode: error.statusCode || 500,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : error.message,
  });
}
