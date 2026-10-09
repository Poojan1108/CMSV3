import { PrismaClient, Ticket, TicketPriority, TicketStatus } from '@prisma/client';

export interface TicketFilterOptions {
  status?: TicketStatus;
  category?: string;
  priority?: TicketPriority;
  orgKey?: string;
  studentId?: string;
  search?: string;
}

export interface CreateTicketData {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  location?: string | null;
  orgKey: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentMeta?: any;
  slaResponseDue?: Date | null;
  slaResolveDue?: Date | null;
}

export class TicketRepository {
  constructor(private prisma: PrismaClient) {}

  async count(where: any = {}): Promise<number> {
    return this.prisma.ticket.count({ where });
  }

  async findMany(filters: TicketFilterOptions): Promise<Ticket[]> {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.orgKey) where.orgKey = filters.orgKey;
    if (filters.studentId) where.studentId = filters.studentId;

    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { studentName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        department: { select: { id: true, name: true } },
        _count: {
          select: { comments: true, history: true },
        },
      },
    });
  }

  async findById(id: string): Promise<Ticket | null> {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        department: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
        },
        history: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async create(data: CreateTicketData): Promise<Ticket> {
    return this.prisma.ticket.create({
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: 'PENDING',
        location: data.location || null,
        orgKey: data.orgKey,
        studentId: data.studentId,
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        studentMeta: data.studentMeta || null,
        slaResponseDue: data.slaResponseDue || null,
        slaResolveDue: data.slaResolveDue || null,
        history: {
          create: {
            status: 'PENDING',
            updatedBy: data.studentName,
            note: 'Complaint registered in system.',
          },
        },
      },
      include: {
        history: true,
      },
    });
  }

  async updateStatus(id: string, status: TicketStatus, updatedBy: string, note?: string): Promise<Ticket> {
    return this.prisma.ticket.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
        history: {
          create: {
            status,
            updatedBy,
            note: note || `Status transitioned to ${status}`,
          },
        },
      },
      include: { history: true },
    });
  }

  async addComment(ticketId: string, senderId: string, senderName: string, senderRole: any, text: string, isInternal: boolean) {
    return this.prisma.ticketComment.create({
      data: {
        ticketId,
        senderId,
        senderName,
        senderRole,
        text,
        isInternal,
      },
    });
  }

  async reassign(id: string, assignedToId: string, departmentId: string | undefined, reassignerName: string, reason?: string) {
    const logNote = `Reassigned ticket.${reason ? ` Reason: ${reason}` : ''}`;

    const [updatedTicket] = await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id },
        data: {
          assignedToId,
          departmentId: departmentId || undefined,
        },
        include: { assignedTo: true, department: true },
      }),
      this.prisma.ticketHistory.create({
        data: {
          ticketId: id,
          status: 'IN_PROGRESS',
          updatedBy: reassignerName,
          note: logNote,
        },
      }),
      this.prisma.ticketComment.create({
        data: {
          ticketId: id,
          senderName: reassignerName,
          senderRole: 'STAFF',
          text: `[Internal Reassignment] Transferred ticket.${reason ? ` Reason: ${reason}` : ''}`,
          isInternal: true,
        },
      }),
    ]);

    return updatedTicket;
  }

  async proposeResolution(id: string, staffName: string, notes: string) {
    const resolutionDetails = {
      notes,
      staffName,
      proposedAt: new Date().toISOString(),
    };

    const [updatedTicket] = await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id },
        data: {
          status: 'PENDING_CONFIRMATION',
          resolutionDetails,
        },
      }),
      this.prisma.ticketHistory.create({
        data: {
          ticketId: id,
          status: 'PENDING_CONFIRMATION',
          updatedBy: staffName,
          note: `Resolution proposed: ${notes}`,
        },
      }),
      this.prisma.ticketComment.create({
        data: {
          ticketId: id,
          senderName: staffName,
          senderRole: 'STAFF',
          text: `[Resolution Proposed] ${notes}. Please review and confirm.`,
          isInternal: false,
        },
      }),
    ]);

    return updatedTicket;
  }

  async confirmResolution(id: string, userName: string, feedbackNote?: string) {
    const existing = await this.prisma.ticket.findUnique({ where: { id } });
    if (!existing) throw new Error('Ticket not found');

    const updatedResDetails = typeof existing.resolutionDetails === 'object' && existing.resolutionDetails
      ? { ...(existing.resolutionDetails as object), confirmedAt: new Date().toISOString(), userFeedback: feedbackNote }
      : { confirmedAt: new Date().toISOString(), userFeedback: feedbackNote };

    const [updatedTicket] = await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolutionDetails: updatedResDetails,
        },
      }),
      this.prisma.ticketHistory.create({
        data: {
          ticketId: id,
          status: 'RESOLVED',
          updatedBy: userName,
          note: `Resolution confirmed by user.${feedbackNote ? ` Feedback: ${feedbackNote}` : ''}`,
        },
      }),
      this.prisma.ticketComment.create({
        data: {
          ticketId: id,
          senderName: userName,
          senderRole: 'STUDENT',
          text: `[Ticket Closed & Confirmed Resolved] ${feedbackNote || 'Confirmed resolved.'}`,
          isInternal: false,
        },
      }),
    ]);

    return updatedTicket;
  }

  async rejectResolution(id: string, userName: string, rejectionReason: string) {
    const existing = await this.prisma.ticket.findUnique({ where: { id } });
    if (!existing) throw new Error('Ticket not found');

    const updatedResDetails = typeof existing.resolutionDetails === 'object' && existing.resolutionDetails
      ? { ...(existing.resolutionDetails as object), rejectedAt: new Date().toISOString(), rejectionReason }
      : { rejectedAt: new Date().toISOString(), rejectionReason };

    const [updatedTicket] = await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          resolutionDetails: updatedResDetails,
        },
      }),
      this.prisma.ticketHistory.create({
        data: {
          ticketId: id,
          status: 'IN_PROGRESS',
          updatedBy: userName,
          note: `Resolution rejected by user. Reopened ticket. Reason: ${rejectionReason}`,
        },
      }),
      this.prisma.ticketComment.create({
        data: {
          ticketId: id,
          senderName: userName,
          senderRole: 'STUDENT',
          text: `[Resolution Rejected / Reopened] ${rejectionReason}`,
          isInternal: false,
        },
      }),
    ]);

    return updatedTicket;
  }

  async getDashboardStats(orgKey?: string) {
    const orgWhere = orgKey ? { orgKey } : {};

    const [total, pending, inProgress, pendingConfirmation, resolved, rejected, slaBreached] = await Promise.all([
      this.prisma.ticket.count({ where: orgWhere }),
      this.prisma.ticket.count({ where: { ...orgWhere, status: 'PENDING' } }),
      this.prisma.ticket.count({ where: { ...orgWhere, status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { ...orgWhere, status: 'PENDING_CONFIRMATION' } }),
      this.prisma.ticket.count({ where: { ...orgWhere, status: 'RESOLVED' } }),
      this.prisma.ticket.count({ where: { ...orgWhere, status: 'REJECTED' } }),
      this.prisma.ticket.count({ where: { ...orgWhere, slaBreached: true } }),
    ]);

    return { total, pending, inProgress, pendingConfirmation, resolved, rejected, slaBreached };
  }
}
