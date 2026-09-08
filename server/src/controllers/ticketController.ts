import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { TicketService } from '../services/ticketService.js';
import { TicketPriority, TicketStatus } from '@prisma/client';

export const createTicketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  location: z.string().optional(),
  orgKey: z.string().default('COLLEGE'),
  studentMeta: z.record(z.any()).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'RESOLVED', 'REJECTED']),
  note: z.string().optional(),
});

export const addCommentSchema = z.object({
  text: z.string().min(1, 'Comment text cannot be empty'),
  isInternal: z.boolean().default(false),
});

export const reassignSchema = z.object({
  assignedToId: z.string().min(1, 'Assignee ID is required'),
  departmentId: z.string().optional(),
  reason: z.string().optional(),
});

export const proposeResolutionSchema = z.object({
  notes: z.string().min(1, 'Resolution notes are required'),
});

export const feedbackSchema = z.object({
  feedbackNote: z.string().optional(),
});

export const rejectSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
});

export class TicketController {
  private ticketService: TicketService;

  constructor(fastify: any) {
    this.ticketService = new TicketService(fastify);
  }

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const tickets = await this.ticketService.listTickets({
      status: query.status as TicketStatus,
      category: query.category,
      priority: query.priority as TicketPriority,
      orgKey: query.orgKey,
      studentId: query.studentId,
      search: query.search,
    });
    return reply.send({ tickets });
  };

  stats = async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as { orgKey?: string };
    const stats = await this.ticketService.getStats(query.orgKey);
    return reply.send(stats);
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const ticket = await this.ticketService.getTicketById(id);
    return reply.send({ ticket });
  };

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const data = createTicketSchema.parse(request.body);
    const user = request.user as any;
    const ticket = await this.ticketService.createTicket(user, data as any);
    return reply.status(201).send({ ticket });
  };

  updateStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { status, note } = updateStatusSchema.parse(request.body);
    const user = request.user as any;
    const ticket = await this.ticketService.updateTicketStatus(id, status as TicketStatus, user.name, note);
    return reply.send({ ticket });
  };

  addComment = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { text, isInternal } = addCommentSchema.parse(request.body);
    const user = request.user as any;
    const comment = await this.ticketService.addComment(id, user, text, isInternal);
    return reply.status(201).send({ comment });
  };

  reassign = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { assignedToId, departmentId, reason } = reassignSchema.parse(request.body);
    const user = request.user as any;
    const ticket = await this.ticketService.reassignTicket(id, assignedToId, departmentId, user.name, reason);
    return reply.send({ ticket });
  };

  proposeResolution = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { notes } = proposeResolutionSchema.parse(request.body);
    const user = request.user as any;
    const ticket = await this.ticketService.proposeResolution(id, user.name, notes);
    return reply.send({ ticket });
  };

  confirmResolution = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { feedbackNote } = feedbackSchema.parse(request.body);
    const user = request.user as any;
    const ticket = await this.ticketService.confirmResolution(id, user.name, feedbackNote);
    return reply.send({ ticket });
  };

  rejectResolution = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { rejectionReason } = rejectSchema.parse(request.body);
    const user = request.user as any;
    const ticket = await this.ticketService.rejectResolution(id, user.name, rejectionReason);
    return reply.send({ ticket });
  };
}
