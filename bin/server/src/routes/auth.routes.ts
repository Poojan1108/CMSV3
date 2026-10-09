import { FastifyPluginAsync } from 'fastify';
import { AuthController } from '../controllers/authController.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new AuthController(fastify);

  // POST /api/auth/register
  fastify.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user account',
      description: 'Creates a user profile with password hashed via bcrypt and returns a JWT token.',
    },
    handler: controller.register,
  });

  // POST /api/auth/login
  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Authenticate user credentials',
      description: 'Verifies email and password, returning user profile and signed JWT token.',
    },
    handler: controller.login,
  });

  // GET /api/auth/me
  fastify.get('/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Get current authenticated user profile',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.authenticate],
    handler: controller.me,
  });
};
