import { FastifyInstance } from 'fastify';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { TicketFilterOptions, TicketRepository } from '../repositories/ticketRepository.js';
import { calculateSlaDueDates } from './slaService.js';

export interface CreateTicketDTO {
  title: string;
  description: string;
  category: string;
  priority?: TicketPriority;
  location?: string;
  orgKey?: string;
  studentMeta?: any;
}

export class TicketService {
  private ticketRepo: TicketRepository;

  constructor(fastify: FastifyInstance) {
    this.ticketRepo = new TicketRepository(fastify.prisma);
  }

  async listTickets(filters: TicketFilterOptions) {
    return this.ticketRepo.findMany(filters);
  }

  async getTicketById(id: string) {
    const ticket = await this.ticketRepo.findById(id);
    if (!ticket) {
      const error: any = new Error(`Ticket with ID ${id} was not found.`);
      error.statusCode = 404;
      throw error;
    }
    return ticket;
  }

  async createTicket(user: { id: string; name: string; email: string }, data: CreateTicketDTO) {
    const priority = data.priority || 'MEDIUM';
    const currentYear = new Date().getFullYear();
    const count = await this.ticketRepo.count();
    const ticketId = `CMS-${currentYear}-${(1001 + count).toString()}`;

    const { responseDue, resolveDue } = calculateSlaDueDates(priority);

    return this.ticketRepo.create({
      id: ticketId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority,
      location: data.location || null,
      orgKey: data.orgKey || 'COLLEGE',
      studentId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      studentMeta: data.studentMeta,
      slaResponseDue: responseDue,
      slaResolveDue: resolveDue,
    });
  }

  async updateTicketStatus(id: string, status: TicketStatus, updatedBy: string, note?: string) {
    return this.ticketRepo.updateStatus(id, status, updatedBy, note);
  }

  async addComment(ticketId: string, user: { id: string; name: string; role: any }, text: string, isInternal: boolean) {
    const effectiveInternal = isInternal && (user.role === 'STAFF' || user.role === 'ADMIN');
    return this.ticketRepo.addComment(ticketId, user.id, user.name, user.role, text, effectiveInternal);
  }

  async reassignTicket(id: string, assignedToId: string, departmentId: string | undefined, reassignerName: string, reason?: string) {
    return this.ticketRepo.reassign(id, assignedToId, departmentId, reassignerName, reason);
  }

  async proposeResolution(id: string, staffName: string, notes: string) {
    return this.ticketRepo.proposeResolution(id, staffName, notes);
  }

  async confirmResolution(id: string, userName: string, feedbackNote?: string) {
    return this.ticketRepo.confirmResolution(id, userName, feedbackNote);
  }

  async rejectResolution(id: string, userName: string, rejectionReason: string) {
    return this.ticketRepo.rejectResolution(id, userName, rejectionReason);
  }

  async getStats(orgKey?: string) {
    return this.ticketRepo.getDashboardStats(orgKey);
  }
}
