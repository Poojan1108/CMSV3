import { PrismaClient, Role, User } from '@prisma/client';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
  orgKey?: string;
  departmentId?: string | null;
}

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { department: true },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role || 'STUDENT',
        orgKey: data.orgKey || 'COLLEGE',
        departmentId: data.departmentId || null,
      },
      include: { department: true },
    });
  }

  async findStaffMembers(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role: { in: ['STAFF', 'ADMIN'] } },
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }
}
