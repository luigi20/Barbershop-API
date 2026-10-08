import { randomInt, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { DashboardRepository } from '@modules/business/use_cases/dashboard/dashboard.repository';
import { DashboardService } from '@modules/business/use_cases/dashboard/dashboard.service';
import { DashboardController } from '@modules/business/use_cases/dashboard/dashboard.controller';
import { dayRange } from '@modules/business/use_cases/dashboard/dashboard-time';
import { AppointmentStatus, MemberRole } from '@modules/utils/enum';
import { AuthRequest } from '@modules/utils/types/types';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('P5 dashboard with isolated Prisma/PGlite', () => {
  let db: PGlite;
  let server: PGLiteSocketServer;
  let pool: Pool;
  let prisma: PrismaClient;
  let api: DashboardController;
  const entityA = randomUUID(),
    entityB = randomUUID();
  const barberA = randomUUID(),
    barberB = randomUUID(),
    inactiveBarber = randomUUID(),
    receptionist = randomUUID();
  const customerA = randomUUID(),
    inactiveCustomer = randomUUID(),
    blockedCustomer = randomUUID(),
    unlinkedCustomer = randomUUID(),
    customerB = randomUUID();
  const serviceA = randomUUID(),
    inactiveServiceA = randomUUID(),
    serviceB = randomUUID();
  const now = new Date('2026-03-08T16:00:00.000Z');
  const request = (entityId: string, roles = [MemberRole.ADMINISTRADOR]) =>
    ({
      auth: { entity_id: entityId, profile_id: receptionist, roles },
    }) as AuthRequest;

  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(`
      CREATE TABLE "Entity" (id uuid PRIMARY KEY, type varchar NOT NULL, name varchar NOT NULL, document varchar, email varchar, phone varchar, photo varchar, status varchar NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "Profile" (id uuid PRIMARY KEY, identity_id uuid UNIQUE NOT NULL, name varchar NOT NULL, phone varchar, photo varchar, birth_date timestamp, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "Customer" (id uuid PRIMARY KEY, profile_id uuid UNIQUE, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "EntityMembership" (entity_id uuid NOT NULL, profile_id uuid NOT NULL, roles varchar[] NOT NULL, status varchar NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL, UNIQUE(entity_id,profile_id));
      CREATE TABLE "EntityCustomer" (entity_id uuid NOT NULL, customer_id uuid NOT NULL, notes text, status varchar NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL, UNIQUE(entity_id,customer_id), UNIQUE(customer_id,entity_id));
      CREATE TABLE "Service" (id uuid PRIMARY KEY, entity_id uuid NOT NULL, name varchar(100) NOT NULL, description varchar(500), price decimal(10,2) NOT NULL, duration_minutes integer NOT NULL, status varchar(10) NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
    `);
    for (const migration of [
      '20261005000000_p3_availability',
      '20261006000000_p4_appointments',
      '20261007000000_p5_dashboard_completed_at_index',
    ])
      await db.exec(
        readFileSync(
          join(
            process.cwd(),
            `src/infra/database/prisma/migrations/${migration}/migration.sql`,
          ),
          'utf8',
        ),
      );
    const port = randomInt(30000, 60000);
    server = new PGLiteSocketServer({
      db,
      port,
      host: '127.0.0.1',
      maxConnections: 4,
    });
    await server.start();
    pool = new Pool({
      connectionString: `postgresql://test:test@127.0.0.1:${port}/test`,
      max: 4,
    });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    for (const [id, timezone] of [
      [entityA, 'America/New_York'],
      [entityB, 'America/Belem'],
    ] as const)
      await prisma.entity.create({
        data: {
          id,
          type: 'barbearia',
          name: id,
          status: 'ativo',
          timezone,
          created_at: now,
          updated_at: now,
        },
      });
    for (const [id, name] of [
      [barberA, 'Ana'],
      [barberB, 'Beto'],
      [inactiveBarber, 'Inativa'],
      [receptionist, 'Recepção'],
    ] as const)
      await prisma.profile.create({
        data: {
          id,
          identity_id: randomUUID(),
          name,
          created_at: now,
          updated_at: now,
        },
      });
    for (const [profile_id, roles, status] of [
      [barberA, ['barbeiro', 'administrador'], 'ativo'],
      [inactiveBarber, ['barbeiro'], 'inativo'],
      [receptionist, ['recepcionista'], 'ativo'],
    ] as const)
      await prisma.entityMembership.create({
        data: {
          entity_id: entityA,
          profile_id,
          roles: [...roles],
          status,
          created_at: now,
          updated_at: now,
        },
      });
    await prisma.entityMembership.create({
      data: {
        entity_id: entityB,
        profile_id: barberB,
        roles: ['barbeiro'],
        status: 'ativo',
        created_at: now,
        updated_at: now,
      },
    });
    for (const id of [
      customerA,
      inactiveCustomer,
      blockedCustomer,
      unlinkedCustomer,
      customerB,
    ])
      await prisma.customer.create({
        data: { id, created_at: now, updated_at: now },
      });
    for (const [entity_id, customer_id, status] of [
      [entityA, customerA, 'ativo'],
      [entityA, inactiveCustomer, 'inativo'],
      [entityA, blockedCustomer, 'bloqueado'],
      [entityB, customerB, 'ativo'],
    ] as const)
      await prisma.entityCustomer.create({
        data: { entity_id, customer_id, status },
      });
    for (const [id, entity_id, status] of [
      [serviceA, entityA, 'ativo'],
      [inactiveServiceA, entityA, 'inativo'],
      [serviceB, entityB, 'ativo'],
    ] as const)
      await prisma.service.create({
        data: {
          id,
          entity_id,
          name: 'Corte',
          price: '999.00',
          duration_minutes: 30,
          status,
          created_at: now,
          updated_at: now,
        },
      });
    const repo = new DashboardRepository({
      getPrismaClient: () => prisma,
    } as PrismaService);
    api = new DashboardController(
      new DashboardService(repo, { now: () => now }),
    );
  }, 30000);

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
    if (server) await server.stop();
    if (db) await db.close();
  });

  const add = async (
    entityId: string,
    status: AppointmentStatus,
    starts: string,
    price: string,
    completed?: string,
  ) => {
    const start = new Date(starts);
    return prisma.appointment.create({
      data: {
        id: randomUUID(),
        entity_id: entityId,
        customer_id: entityId === entityA ? customerA : customerB,
        professional_profile_id: entityId === entityA ? barberA : barberB,
        service_id: entityId === entityA ? serviceA : serviceB,
        service_name_snapshot: 'Corte antigo',
        price_snapshot: price,
        duration_minutes_snapshot: 30,
        starts_at: start,
        ends_at: new Date(start.valueOf() + 1_800_000),
        status,
        completed_at: completed ? new Date(completed) : null,
        cancelled_at: status === AppointmentStatus.CANCELADO ? now : null,
        updated_at: now,
      },
    });
  };

  it('uses local half-open DST day boundaries', () => {
    const bounds = dayRange('2026-03-08', 'America/New_York');
    expect(bounds.start.toISOString()).toBe('2026-03-08T05:00:00.000Z');
    expect(bounds.end.toISOString()).toBe('2026-03-09T04:00:00.000Z');
    expect(bounds.end.valueOf() - bounds.start.valueOf()).toBe(23 * 3_600_000);
  });

  it('scopes counts, revenue, dimensions, upcoming and series to the session tenant', async () => {
    const bUpcoming = await add(
      entityB,
      AppointmentStatus.AGENDADO,
      '2026-03-08T19:00:00.000Z',
      '900.00',
    );
    await add(
      entityB,
      AppointmentStatus.AGENDADO,
      '2026-03-08T02:30:00.000Z',
      '5.00',
    );
    await add(
      entityB,
      AppointmentStatus.CONCLUIDO,
      '2026-03-08T12:00:00.000Z',
      '700.00',
      '2026-03-08T15:00:00.000Z',
    );
    await add(
      entityA,
      AppointmentStatus.AGENDADO,
      '2026-03-08T05:00:00.000Z',
      '10.00',
    );
    const later = await add(
      entityA,
      AppointmentStatus.AGENDADO,
      '2026-03-08T18:00:00.000Z',
      '11.00',
    );
    await add(
      entityA,
      AppointmentStatus.CANCELADO,
      '2026-03-08T19:00:00.000Z',
      '50.00',
    );
    await add(
      entityA,
      AppointmentStatus.CONCLUIDO,
      '2026-03-08T14:00:00.000Z',
      '0.10',
      '2026-03-08T15:00:00.000Z',
    );
    await add(
      entityA,
      AppointmentStatus.CONCLUIDO,
      '2026-03-07T20:00:00.000Z',
      '0.20',
      '2026-03-08T16:00:00.000Z',
    );
    await add(
      entityA,
      AppointmentStatus.AGENDADO,
      '2026-03-09T04:00:00.000Z',
      '60.00',
    );
    await prisma.service.update({
      where: { id: serviceA },
      data: { price: '5000.00' },
    });
    const summary = await api.summary(request(entityA));
    expect(summary.today).toEqual({
      appointments_total: 4,
      scheduled: 2,
      completed: 1,
      cancelled: 1,
      upcoming: 1,
      revenue: '0.30',
    });
    expect(summary.month.revenue).toBe('0.30');
    expect(summary.customers.active).toBe(1);
    expect(summary.professionals.active_barbers).toBe(1);
    expect(summary.services.active).toBe(1);
    expect(summary.today.revenue).not.toBe('700.30');
    const ops = await api.operations(
      request(entityA, [MemberRole.RECEPCIONISTA]),
    );
    expect(ops.today.upcoming).toBe(1);
    expect('revenue' in ops.today).toBe(false);
    const upcoming = await api.upcoming(request(entityA), '1');
    expect(upcoming.appointments).toHaveLength(1);
    expect(upcoming.appointments[0].appointment_id).toBe(later.id);
    expect(upcoming.appointments[0].professional_name).toBe('Ana');
    expect(upcoming.appointments[0].price_snapshot).toBe('11.00');
    expect(
      upcoming.appointments.some((row) => row.appointment_id === bUpcoming.id),
    ).toBe(false);
    const series = await api.timeseries(
      request(entityA),
      '2026-03-08',
      '2026-03-10',
    );
    expect(series.points).toEqual([
      {
        date: '2026-03-08',
        appointments: 4,
        scheduled: 2,
        completed: 1,
        cancelled: 1,
        revenue: '0.30',
      },
      {
        date: '2026-03-09',
        appointments: 1,
        scheduled: 1,
        completed: 0,
        cancelled: 0,
        revenue: '0.00',
      },
      {
        date: '2026-03-10',
        appointments: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        revenue: '0.00',
      },
    ]);
    const other = await api.summary(request(entityB));
    expect(other.timezone).toBe('America/Belem');
    expect(other.today.appointments_total).toBe(2);
    expect(other.today.revenue).toBe('700.00');
    expect(other.customers.active).toBe(1);
    expect(other.professionals.active_barbers).toBe(1);
    expect(other.services.active).toBe(1);
    const bSeries = await api.timeseries(
      request(entityB),
      '2026-03-07',
      '2026-03-08',
    );
    expect(bSeries.points.map((point) => point.appointments)).toEqual([1, 2]);
    expect(bSeries.points.map((point) => point.revenue)).toEqual([
      '0.00',
      '700.00',
    ]);
  });

  it('orders upcoming appointments, applies limits, and excludes terminal or past appointments', async () => {
    const starts = Array.from({ length: 20 }, (_, i) =>
      new Date(
        Date.parse('2026-03-08T20:00:00.000Z') + (i === 11 ? 10 : i) * 60_000,
      ).toISOString(),
    );
    const createdIds: string[] = [];
    for (const startsAt of [...starts].reverse())
      createdIds.push(
        (await add(entityA, AppointmentStatus.AGENDADO, startsAt, '1.00')).id,
      );
    const cancelled = await add(
      entityA,
      AppointmentStatus.CANCELADO,
      '2026-03-08T16:30:00.000Z',
      '99.00',
    );
    const completed = await add(
      entityA,
      AppointmentStatus.CONCLUIDO,
      '2026-03-08T16:45:00.000Z',
      '99.00',
      now.toISOString(),
    );
    const past = await add(
      entityA,
      AppointmentStatus.AGENDADO,
      '2026-03-08T15:59:00.000Z',
      '99.00',
    );
    const all = await api.upcoming(request(entityA), '20');
    expect(all.appointments).toHaveLength(20);
    expect(all.appointments.map((row) => row.appointment_id)).not.toContain(
      cancelled.id,
    );
    expect(all.appointments.map((row) => row.appointment_id)).not.toContain(
      completed.id,
    );
    expect(all.appointments.map((row) => row.appointment_id)).not.toContain(
      past.id,
    );
    const sorted = [...all.appointments].sort(
      (a, b) =>
        a.starts_at.localeCompare(b.starts_at) ||
        a.appointment_id.localeCompare(b.appointment_id),
    );
    expect(all.appointments).toEqual(sorted);
    expect(
      all.appointments.some((row) => createdIds.includes(row.appointment_id)),
    ).toBe(true);
    expect((await api.upcoming(request(entityA))).appointments).toHaveLength(5);
    expect(
      (await api.upcoming(request(entityA), '3')).appointments,
    ).toHaveLength(3);
  });

  it('rejects invalid limits and oversized or reversed local ranges', async () => {
    await expect(api.upcoming(request(entityA), '21')).rejects.toMatchObject({
      status: 400,
    });
    await expect(api.upcoming(request(entityA), '1.5')).rejects.toMatchObject({
      status: 400,
    });
    await expect(api.upcoming(request(entityA), '0')).rejects.toMatchObject({
      status: 400,
    });
    expect(
      (await api.timeseries(request(entityA), '2026-01-01', '2026-03-31'))
        .points,
    ).toHaveLength(90);
    await expect(
      api.timeseries(request(entityA), '2026-03-10', '2026-03-08'),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      api.timeseries(request(entityA), '2026-01-01', '2026-05-01'),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      api.timeseries(request(entityA), '2026-02-30', '2026-03-01'),
    ).rejects.toMatchObject({ status: 400 });
    await prisma.entity.update({
      where: { id: entityB },
      data: { timezone: null },
    });
    await expect(api.operations(request(entityB))).rejects.toMatchObject({
      status: 400,
    });
  });

  it('limits revenue routes to administrators and operations to staff', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);
    const allowed = (
      method: keyof DashboardController,
      roles: MemberRole[],
    ) => {
      const context = {
        getHandler: () =>
          Object.getOwnPropertyDescriptor(DashboardController.prototype, method)
            ?.value as (...args: unknown[]) => unknown,
        getClass: () => DashboardController,
        switchToHttp: () => ({ getRequest: () => request(entityA, roles) }),
      } as unknown as ExecutionContext;
      return () => guard.canActivate(context);
    };
    expect(allowed('summary', [MemberRole.ADMINISTRADOR])()).toBe(true);
    expect(allowed('timeseries', [MemberRole.ADMINISTRADOR])()).toBe(true);
    expect(allowed('operations', [MemberRole.ADMINISTRADOR])()).toBe(true);
    expect(allowed('upcoming', [MemberRole.ADMINISTRADOR])()).toBe(true);
    expect(allowed('operations', [MemberRole.RECEPCIONISTA])()).toBe(true);
    expect(allowed('upcoming', [MemberRole.RECEPCIONISTA])()).toBe(true);
    expect(allowed('summary', [MemberRole.RECEPCIONISTA])).toThrow();
    expect(allowed('timeseries', [MemberRole.RECEPCIONISTA])).toThrow();
    expect(allowed('timeseries', [MemberRole.BARBEIRO])).toThrow();
    expect(allowed('upcoming', [MemberRole.BARBEIRO])).toThrow();
    expect(allowed('operations', [MemberRole.CLIENTE])).toThrow();
    expect(allowed('summary', [MemberRole.CLIENTE])).toThrow();
  });
});
