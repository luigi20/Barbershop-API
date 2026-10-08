import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { AppointmentStatus, MemberRole } from '@modules/utils/enum';

type DailyCount = {
  date: string;
  appointments: bigint;
  scheduled: bigint;
  completed: bigint;
  cancelled: bigint;
};
type DailyRevenue = { date: string; revenue: Prisma.Decimal | null };
type LocalDay = { date: string; start: Date; end: Date };

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  client(): PrismaClient {
    return this.prisma.getPrismaClient();
  }

  async counts(entityId: string, start: Date, end: Date) {
    return this.client().appointment.groupBy({
      by: ['status'],
      where: { entity_id: entityId, starts_at: { gte: start, lt: end } },
      _count: { _all: true },
    });
  }

  async revenue(entityId: string, start: Date, end: Date) {
    return this.client().appointment.aggregate({
      where: {
        entity_id: entityId,
        status: AppointmentStatus.CONCLUIDO,
        completed_at: { gte: start, lt: end },
      },
      _sum: { price_snapshot: true },
    });
  }

  async upcoming(entityId: string, now: Date, limit: number) {
    return this.client().appointment.findMany({
      where: {
        entity_id: entityId,
        status: AppointmentStatus.AGENDADO,
        starts_at: { gte: now },
      },
      orderBy: [{ starts_at: 'asc' }, { id: 'asc' }],
      take: limit,
      select: {
        id: true,
        customer_id: true,
        professional_profile_id: true,
        service_id: true,
        service_name_snapshot: true,
        price_snapshot: true,
        starts_at: true,
        ends_at: true,
        status: true,
      },
    });
  }

  private days(days: LocalDay[]) {
    return Prisma.join(
      days.map(
        (day) =>
          Prisma.sql`(${day.date}::text, ${day.start}::timestamptz, ${day.end}::timestamptz)`,
      ),
    );
  }

  async dailyCounts(entityId: string, days: LocalDay[]) {
    return this.client().$queryRaw<DailyCount[]>(Prisma.sql`
      SELECT days.date, count(a.id) AS appointments,
        count(a.id) FILTER (WHERE a.status = ${AppointmentStatus.AGENDADO}) AS scheduled,
        count(a.id) FILTER (WHERE a.status = ${AppointmentStatus.CONCLUIDO}) AS completed,
        count(a.id) FILTER (WHERE a.status = ${AppointmentStatus.CANCELADO}) AS cancelled
      FROM (VALUES ${this.days(days)}) AS days(date, day_start, day_end)
      LEFT JOIN "Appointment" a ON a.entity_id = ${entityId}::uuid
        AND a.starts_at >= days.day_start AND a.starts_at < days.day_end
      GROUP BY days.date ORDER BY days.date`);
  }

  async dailyRevenue(entityId: string, days: LocalDay[]) {
    return this.client().$queryRaw<DailyRevenue[]>(Prisma.sql`
      SELECT days.date, sum(a.price_snapshot) AS revenue
      FROM (VALUES ${this.days(days)}) AS days(date, day_start, day_end)
      LEFT JOIN "Appointment" a ON a.entity_id = ${entityId}::uuid
        AND a.status = ${AppointmentStatus.CONCLUIDO}
        AND a.completed_at >= days.day_start AND a.completed_at < days.day_end
      GROUP BY days.date ORDER BY days.date`);
  }

  async dimensions(entityId: string) {
    return Promise.all([
      this.client().entityCustomer.count({
        where: { entity_id: entityId, status: 'ativo' },
      }),
      this.client().entityMembership.count({
        where: {
          entity_id: entityId,
          status: 'ativo',
          roles: { has: MemberRole.BARBEIRO },
        },
      }),
      this.client().service.count({
        where: { entity_id: entityId, status: 'ativo' },
      }),
    ]);
  }
}
