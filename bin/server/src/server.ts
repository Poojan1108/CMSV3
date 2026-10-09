import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import { registerSwagger } from './plugins/swagger.js';
import { errorHandler } from './plugins/errorHandler.js';
import { prismaPlugin } from './plugins/prisma.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.routes.js';
import { ticketRoutes } from './routes/tickets.routes.js';
import { departmentRoutes } from './routes/departments.routes.js';
import { startSlaMonitor } from './services/slaService.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // CORS Middleware
  await app.register(cors, {
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Swagger / OpenAPI Interactive Documentation
  await registerSwagger(app);

  // Core Infrastructure Plugins
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  // Health and Meta Endpoints
  app.get('/health', { schema: { tags: ['System'], summary: 'Service Health Check' } }, async () => {
    return { status: 'healthy', timestamp: new Date().toISOString(), architecture: 'Clean 3-Tier Layered' };
  });

  app.get('/', { schema: { tags: ['System'], summary: 'API Root & Welcome' } }, async () => {
    return {
      name: 'ResolveX CMS Backend API',
      version: '1.0.0',
      docs: `http://localhost:${env.PORT}/docs`,
      health: `http://localhost:${env.PORT}/health`,
    };
  });

  // API Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(ticketRoutes, { prefix: '/api/tickets' });
  await app.register(departmentRoutes, { prefix: '/api/departments' });

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 ResolveX Clean Architecture Backend running at http://localhost:${env.PORT}`);
    app.log.info(`📖 Interactive Swagger Documentation at http://localhost:${env.PORT}/docs`);

    // In-process SLA auto-escalator (Redis-free background monitor)
    startSlaMonitor(app, 60_000);
  } catch (err) {
    console.error('Fatal server boot error:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
