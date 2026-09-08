import bcrypt from 'bcryptjs';
import { FastifyInstance } from 'fastify';
import { CreateUserData, UserRepository } from '../repositories/userRepository.js';

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor(private fastify: FastifyInstance) {
    this.userRepo = new UserRepository(fastify.prisma);
  }

  async register(data: Omit<CreateUserData, 'passwordHash'> & { password: string }) {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      const error: any = new Error('A user with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await this.userRepo.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      orgKey: data.orgKey,
      departmentId: data.departmentId,
    });

    const token = this.fastify.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgKey: user.orgKey,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgKey: user.orgKey,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async login(credentials: LoginDTO) {
    const user = await this.userRepo.findByEmail(credentials.email);
    if (!user) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const token = this.fastify.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgKey: user.orgKey,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgKey: user.orgKey,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      const error: any = new Error('User profile not found.');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgKey: user.orgKey,
      avatarUrl: user.avatarUrl,
    };
  }
}
