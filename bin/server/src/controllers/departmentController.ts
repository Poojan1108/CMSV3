import { FastifyReply, FastifyRequest } from 'fastify';
import { DepartmentRepository } from '../repositories/departmentRepository.js';
import { UserRepository } from '../repositories/userRepository.js';

export class DepartmentController {
  private deptRepo: DepartmentRepository;
  private userRepo: UserRepository;

  constructor(fastify: any) {
    this.deptRepo = new DepartmentRepository(fastify.prisma);
    this.userRepo = new UserRepository(fastify.prisma);
  }

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const { orgKey } = request.query as { orgKey?: string };
    const departments = await this.deptRepo.findMany(orgKey);
    return reply.send({ departments });
  };

  listStaff = async (_request: FastifyRequest, reply: FastifyReply) => {
    const staff = await this.userRepo.findStaffMembers();
    return reply.send({
      staff: staff.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: (u as any).department?.name || null,
      })),
    });
  };
}
