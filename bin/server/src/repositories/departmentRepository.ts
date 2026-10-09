import { Department, PrismaClient } from '@prisma/client';

export class DepartmentRepository {
  constructor(private prisma: PrismaClient) {}

  async findMany(orgKey?: string): Promise<Department[]> {
    const where = orgKey ? { orgKey } : {};
    return this.prisma.department.findMany({
      where,
      include: {
        users: {
          where: { role: 'STAFF' },
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Department | null> {
    return this.prisma.department.findUnique({
      where: { id },
      include: { users: true },
    });
  }
}
