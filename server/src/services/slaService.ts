import { FastifyInstance } from 'fastify';
import { TicketPriority } from '@prisma/client';

export interface SlaDurations {
  responseHours: number;
  resolveHours: number;
}

export const DEFAULT_SLA_HOURS: Record<TicketPriority, SlaDurations> = {
  URGENT: { responseHours: 2, resolveHours: 12 },
  HIGH: { responseHours: 6, resolveHours: 24 },
  MEDIUM: { responseHours: 24, resolveHours: 72 },
  LOW: { responseHours: 48, resolveHours: 120 },
};

/**
 * Calculates due dates for SLA response and resolution based on ticket priority.
 */
export function calculateSlaDueDates(priority: TicketPriority, baseDate: Date = new Date()) {
  const config = DEFAULT_SLA_HOURS[priority] || DEFAULT_SLA_HOURS.MEDIUM;

  const responseDue = new Date(baseDate.getTime() + config.responseHours * 60 * 60 * 1000);
  const resolveDue = new Date(baseDate.getTime() + config.resolveHours * 60 * 60 * 1000);

  return { responseDue, resolveDue };
}

/**
 * In-process SLA monitoring service.
 * Periodically inspects open tickets and auto-escalates SLA-breached tickets
 * without requiring external infrastructure like Redis or BullMQ.
 */
export function startSlaMonitor(fastify: FastifyInstance, intervalMs: number = 60_000) {
  fastify.log.info('[SLA Engine] Starting in-process SLA monitor (Redis-free ticker active)...');

  const timer = setInterval(async () => {
    try {
      const now = new Date();

      // 1. Identify tickets where first-response SLA is breached
      const overduePendingTickets = await fastify.prisma.ticket.findMany({
        where: {
          status: 'PENDING',
          slaBreached: false,
          slaResponseDue: {
            lt: now,
          },
        },
      });

      for (const ticket of overduePendingTickets) {
        fastify.log.warn(`[SLA Alert] Ticket ${ticket.id} breached response SLA! Auto-escalating priority to URGENT.`);

        await fastify.prisma.$transaction([
          fastify.prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              priority: 'URGENT',
              slaBreached: true,
            },
          }),
          fastify.prisma.ticketHistory.create({
            data: {
              ticketId: ticket.id,
              status: ticket.status,
              updatedBy: 'SLA Auto-Escalator (System)',
              note: `[SLA Breached] Response deadline passed (${ticket.slaResponseDue?.toISOString()}). Priority automatically escalated to URGENT.`,
            },
          }),
        ]);
      }

      // 2. Identify tickets where resolution SLA is breached
      const overdueResolveTickets = await fastify.prisma.ticket.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          slaBreached: false,
          slaResolveDue: {
            lt: now,
          },
        },
      });

      for (const ticket of overdueResolveTickets) {
        fastify.log.warn(`[SLA Alert] Ticket ${ticket.id} breached resolution SLA!`);

        await fastify.prisma.$transaction([
          fastify.prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              slaBreached: true,
            },
          }),
          fastify.prisma.ticketHistory.create({
            data: {
              ticketId: ticket.id,
              status: ticket.status,
              updatedBy: 'SLA Monitor (System)',
              note: `[SLA Breached] Resolution deadline passed (${ticket.slaResolveDue?.toISOString()}). Admin attention required.`,
            },
          }),
        ]);
      }
    } catch (error) {
      fastify.log.error(error, '[SLA Engine] Error during SLA scan');
    }
  }, intervalMs);

  fastify.addHook('onClose', () => {
    clearInterval(timer);
    fastify.log.info('[SLA Engine] In-process SLA monitor shut down cleanly.');
  });
}
