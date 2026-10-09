import { FastifyPluginAsync } from 'fastify';
import { TicketController } from '../controllers/ticketController.js';

export const ticketRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new TicketController(fastify);

  // 1. GET /api/tickets - List tickets with filtering
  fastify.get('/', {
    schema: {
      tags: ['Tickets'],
      summary: 'List tickets with dynamic filters',
      description: 'Filter tickets by status, category, priority, orgKey, studentId, or free-text search.',
    },
    handler: controller.list,
  });

  // 2. GET /api/tickets/stats - Analytical summary
  fastify.get('/stats', {
    schema: {
      tags: ['Tickets'],
      summary: 'Analytics & SLA metrics summary',
      description: 'Provides counters for dashboard charts (total, pending, in-progress, resolved, SLA breached).',
    },
    handler: controller.stats,
  });

  // 3. GET /api/tickets/:id - Single ticket details
  fastify.get('/:id', {
    schema: {
      tags: ['Tickets'],
      summary: 'Get ticket by ID with full history and discussion thread',
    },
    handler: controller.getById,
  });

  // 4. POST /api/tickets - Create ticket
  fastify.post('/', {
    schema: {
      tags: ['Tickets'],
      summary: 'File a new complaint / ticket',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.authenticate],
    handler: controller.create,
  });

  // 5. PATCH /api/tickets/:id/status - Update status
  fastify.patch('/:id/status', {
    schema: {
      tags: ['Tickets'],
      summary: 'Transition ticket status',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.authenticate],
    handler: controller.updateStatus,
  });

  // 6. POST /api/tickets/:id/comments - Post comment
  fastify.post('/:id/comments', {
    schema: {
      tags: ['Tickets'],
      summary: 'Add discussion comment or internal staff note',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.authenticate],
    handler: controller.addComment,
  });

  // 7. POST /api/tickets/:id/reassign - Reassign staff/dept
  fastify.post('/:id/reassign', {
    schema: {
      tags: ['Tickets'],
      summary: 'Reassign ticket to another staff member or department',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.verifyRole(['STAFF', 'ADMIN'])],
    handler: controller.reassign,
  });

  // 8. POST /api/tickets/:id/propose-resolution - Staff proposes resolution
  fastify.post('/:id/propose-resolution', {
    schema: {
      tags: ['Tickets'],
      summary: 'Propose resolution for ticket (Staff only)',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.verifyRole(['STAFF', 'ADMIN'])],
    handler: controller.proposeResolution,
  });

  // 9. POST /api/tickets/:id/confirm-resolution - Complainant confirms
  fastify.post('/:id/confirm-resolution', {
    schema: {
      tags: ['Tickets'],
      summary: 'Confirm resolution and close ticket (Complainant action)',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.authenticate],
    handler: controller.confirmResolution,
  });

  // 10. POST /api/tickets/:id/reject-resolution - Complainant rejects
  fastify.post('/:id/reject-resolution', {
    schema: {
      tags: ['Tickets'],
      summary: 'Reject proposed resolution and reopen ticket (Complainant action)',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [fastify.authenticate],
    handler: controller.rejectResolution,
  });
};
