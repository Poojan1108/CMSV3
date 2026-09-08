import { FastifyPluginAsync } from 'fastify';
import { DepartmentController } from '../controllers/departmentController.js';

export const departmentRoutes: FastifyPluginAsync = async (fastify) => {
  const controller = new DepartmentController(fastify);

  // GET /api/departments
  fastify.get('/', {
    schema: {
      tags: ['Departments'],
      summary: 'List departments with staff members',
    },
    handler: controller.list,
  });

  // GET /api/departments/staff
  fastify.get('/staff', {
    schema: {
      tags: ['Departments'],
      summary: 'List available staff members for ticket assignment',
    },
    handler: controller.listStaff,
  });
};
