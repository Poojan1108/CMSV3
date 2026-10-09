import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from '../config/env.js';

export async function registerSwagger(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'ResolveX CMS - Clean Architecture REST API',
        description: 'Enterprise Complaint & Ticket Lifecycle Management System with SLA Auto-Escalation',
        version: '1.0.0',
        contact: {
          name: 'CMS Engineering Team',
          email: 'support@college.edu',
        },
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Local Development Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Provide your JWT bearer token in the format: Bearer <token>',
          },
        },
      },
      tags: [
        { name: 'Auth', description: 'User authentication, registration & profile management' },
        { name: 'Tickets', description: 'Ticket creation, SLA tracking, status transitions, and comments' },
        { name: 'Departments', description: 'Department directory and staff member assignments' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
}
