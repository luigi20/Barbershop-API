import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@modules/utils/enum';
import { DashboardRepository } from './dashboard.repository';
import {
  datesInRange,
  dayRange,
  dayStart,
  nextDate,
  todayIn,
} from './dashboard-time';

@Injectable()
export class DashboardClock {
  now(): Date {
    return new Date();
  }
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly repo: DashboardRepository,
    private readonly clock: DashboardClock,
  ) {}

  private async context(entityId: string) {
    const entity = await this.repo.client().entity.findUnique({
      where: { id: entityId },
      select: { timezone: true },
    });
    if (!entity) throw new NotFoundException('Empresa não encontrada');
    if (!entity.timezone)
      throw new BadRequestException('Configure timezone da empresa');
    const now = this.clock.now();
    return {
      timezone: entity.timezone,
      now,
      date: todayIn(entity.timezone, now),
    };
  }

  private totals(groups: Array<{ status: string; _count: { _all: number } }>) {
    const count = (status: AppointmentStatus) =>
      groups.find((group) => group.status === String(status))?._count._all ?? 0;
    const scheduled = count(AppointmentStatus.AGENDADO);
    const completed = count(AppointmentStatus.CONCLUIDO);
    const cancelled = count(AppointmentStatus.CANCELADO);
    return {
      appointments_total: scheduled + completed + cancelled,
      scheduled,
      completed,
      cancelled,
    };
  }

  private money(value: { toFixed(decimals: number): string } | null) {
    return value?.toFixed(2) ?? '0.00';
  }

  async operations(entityId: string) {
    const { timezone, now, date } = await this.context(entityId);
    const { start, end } = dayRange(date, timezone);
    const [groups, upcoming] = await Promise.all([
      this.repo.counts(entityId, start, end),
      this.repo.client().appointment.count({
        where: {
          entity_id: entityId,
          status: AppointmentStatus.AGENDADO,
          starts_at: { gte: now > start ? now : start, lt: end },
        },
      }),
    ]);
    return { timezone, date, today: { ...this.totals(groups), upcoming } };
  }

  async summary(entityId: string) {
    const { timezone, now, date } = await this.context(entityId);
    const today = dayRange(date, timezone);
    const monthDate = `${date.slice(0, 7)}-01`;
    const nextMonthDate = nextDate(
      new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0))
        .toISOString()
        .slice(0, 10),
    );
    const month = {
      start: dayStart(monthDate, timezone),
      end: dayStart(nextMonthDate, timezone),
    };
    const [
      todayGroups,
      monthGroups,
      todayRevenue,
      monthRevenue,
      upcoming,
      dimensions,
    ] = await Promise.all([
      this.repo.counts(entityId, today.start, today.end),
      this.repo.counts(entityId, month.start, month.end),
      this.repo.revenue(entityId, today.start, today.end),
      this.repo.revenue(entityId, month.start, month.end),
      this.repo.client().appointment.count({
        where: {
          entity_id: entityId,
          status: AppointmentStatus.AGENDADO,
          starts_at: {
            gte: now > today.start ? now : today.start,
            lt: today.end,
          },
        },
      }),
      this.repo.dimensions(entityId),
    ]);
    const monthTotals = this.totals(monthGroups);
    const [customers, activeBarbers, services] = dimensions;
    return {
      timezone,
      date,
      today: {
        ...this.totals(todayGroups),
        upcoming,
        revenue: this.money(todayRevenue._sum.price_snapshot),
      },
      month: {
        completed_appointments: monthTotals.completed,
        cancelled_appointments: monthTotals.cancelled,
        revenue: this.money(monthRevenue._sum.price_snapshot),
      },
      customers: { active: customers },
      professionals: { active_barbers: activeBarbers },
      services: { active: services },
    };
  }

  async upcoming(entityId: string, limitValue?: string) {
    const { timezone, now } = await this.context(entityId);
    const limit = limitValue === undefined ? 5 : Number(limitValue);
    if (
      (limitValue !== undefined && !/^[1-9]\d*$/.test(limitValue)) ||
      !Number.isSafeInteger(limit) ||
      limit > 20
    )
      throw new BadRequestException('limit deve ser inteiro entre 1 e 20');
    const rows = await this.repo.upcoming(entityId, now, limit);
    const customerIds = [...new Set(rows.map((row) => row.customer_id))];
    const customers = customerIds.length
      ? await this.repo.client().customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, profile_id: true },
        })
      : [];
    const customerProfiles = new Map(
      customers.map((row) => [row.id, row.profile_id]),
    );
    const profileIds = [
      ...new Set([
        ...rows.map((row) => row.professional_profile_id),
        ...customers
          .map((row) => row.profile_id)
          .filter((id): id is string => id !== null),
      ]),
    ];
    const profiles = profileIds.length
      ? await this.repo.client().profile.findMany({
          where: { id: { in: profileIds } },
          select: { id: true, name: true },
        })
      : [];
    const names = new Map(profiles.map((row) => [row.id, row.name]));
    return {
      timezone,
      appointments: rows.map((row) => ({
        appointment_id: row.id,
        customer_id: row.customer_id,
        customer_name:
          names.get(customerProfiles.get(row.customer_id) ?? '') ?? null,
        professional_profile_id: row.professional_profile_id,
        professional_name: names.get(row.professional_profile_id) ?? null,
        service_id: row.service_id,
        service_name_snapshot: row.service_name_snapshot,
        starts_at: row.starts_at.toISOString(),
        ends_at: row.ends_at.toISOString(),
        status: row.status,
        price_snapshot: row.price_snapshot.toFixed(2),
      })),
    };
  }

  async timeseries(entityId: string, from: string, to: string) {
    const dates = datesInRange(from, to);
    const { timezone } = await this.context(entityId);
    const days = dates.map((date) => ({ date, ...dayRange(date, timezone) }));
    const [counts, revenues] = await Promise.all([
      this.repo.dailyCounts(entityId, days),
      this.repo.dailyRevenue(entityId, days),
    ]);
    const countByDate = new Map(counts.map((row) => [row.date, row]));
    const revenueByDate = new Map(
      revenues.map((row) => [row.date, row.revenue]),
    );
    return {
      timezone,
      from,
      to,
      points: dates.map((date) => {
        const row = countByDate.get(date);
        return {
          date,
          appointments: Number(row?.appointments ?? 0n),
          scheduled: Number(row?.scheduled ?? 0n),
          completed: Number(row?.completed ?? 0n),
          cancelled: Number(row?.cancelled ?? 0n),
          revenue: this.money(revenueByDate.get(date) ?? null),
        };
      }),
    };
  }
}
