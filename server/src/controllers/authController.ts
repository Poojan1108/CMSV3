import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/authService.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'STAFF', 'ADMIN']).default('STUDENT'),
  orgKey: z.string().default('COLLEGE'),
  departmentId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  private authService: AuthService;

  constructor(fastify: any) {
    this.authService = new AuthService(fastify);
  }

  register = async (request: FastifyRequest, reply: FastifyReply) => {
    const data = registerSchema.parse(request.body);
    const result = await this.authService.register(data);
    return reply.status(201).send(result);
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const credentials = loginSchema.parse(request.body);
    const result = await this.authService.login(credentials);
    return reply.send(result);
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.user as any;
    const profile = await this.authService.getProfile(payload.id);
    return reply.send({ user: profile });
  };
}
