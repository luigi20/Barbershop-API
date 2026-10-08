import { randomInt, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { AppointmentRepository } from '@modules/business/use_cases/appointment/appointment.repository';
import { AppointmentService } from '@modules/business/use_cases/appointment/appointment.service';
import { AppointmentController } from '@modules/business/use_cases/appointment/appointment.controller';
import { localCandidates } from '@modules/business/use_cases/appointment/appointment-time';
import { MemberRole, AppointmentStatus } from '@modules/utils/enum';
import { AuthRequest } from '@modules/utils/types/types';
import { ValidationPipe } from '@nestjs/common';
import { CreateAppointmentDTO } from '@modules/business/use_cases/appointment/appointment.dto';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('P4 appointments with isolated Prisma/PGlite', () => {
  let db: PGlite;
  let server: PGLiteSocketServer;
  let pool: Pool;
  let prisma: PrismaClient;
  let api: AppointmentController;
  const entityA = randomUUID(),
    entityB = randomUUID();
  const barberA = randomUUID(),
    barberA2 = randomUUID(),
    barberB = randomUUID(),
    receptionist = randomUUID();
  const customerA = randomUUID(),
    customerB = randomUUID(),
    inactiveCustomer = randomUUID();
  const serviceA = randomUUID(),
    serviceB = randomUUID();
  const nextMonday = (() => {
    const now = new Date();
    const days = ((8 - now.getUTCDay()) % 7) + 14;
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + days,
      ),
    )
      .toISOString()
      .slice(0, 10);
  })();
  const at = (hour: number, minute = 0) =>
    localCandidates(
      nextMonday,
      hour * 60 + minute,
      'America/Sao_Paulo',
    )[0].toISOString();
  const request = (
    entity: string,
    profile: string = receptionist,
    roles = [MemberRole.RECEPCIONISTA],
  ) =>
    ({
      auth: { entity_id: entity, profile_id: profile, roles },
    }) as AuthRequest;
  const body = (start = at(9)) => ({
    customer_id: customerA,
    professional_profile_id: barberA,
    service_id: serviceA,
    starts_at: start,
    notes: 'Corte',
  });
  const range = () => ({ from: at(0), to: at(23) });

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
    const now = new Date();
    for (const id of [entityA, entityB])
      await prisma.entity.create({
        data: {
          id,
          type: 'barbearia',
          name: id,
          status: 'ativo',
          timezone: 'America/Sao_Paulo',
          created_at: now,
          updated_at: now,
        },
      });
    for (const id of [barberA, barberA2, barberB, receptionist])
      await prisma.profile.create({
        data: {
          id,
          identity_id: randomUUID(),
          name: id,
          created_at: now,
          updated_at: now,
        },
      });
    for (const [entity_id, profile_id, roles] of [
      [entityA, barberA, ['barbeiro']],
      [entityA, barberA2, ['barbeiro']],
      [entityB, barberB, ['barbeiro']],
      [entityA, receptionist, ['recepcionista']],
    ] as const)
      await prisma.entityMembership.create({
        data: {
          entity_id,
          profile_id,
          roles: [...roles],
          status: 'ativo',
          created_at: now,
          updated_at: now,
        },
      });
    for (const id of [customerA, customerB, inactiveCustomer])
      await prisma.customer.create({
        data: { id, created_at: now, updated_at: now },
      });
    for (const [entity_id, customer_id, status] of [
      [entityA, customerA, 'ativo'],
      [entityB, customerB, 'ativo'],
      [entityA, inactiveCustomer, 'inativo'],
    ] as const)
      await prisma.entityCustomer.create({
        data: { entity_id, customer_id, status },
      });
    for (const [id, entity_id] of [
      [serviceA, entityA],
      [serviceB, entityB],
    ] as const)
      await prisma.service.create({
        data: {
          id,
          entity_id,
          name: 'Corte',
          price: '35.00',
          duration_minutes: 45,
          status: 'ativo',
          created_at: now,
          updated_at: now,
        },
      });
    const repo = new AppointmentRepository({
      getPrismaClient: () => prisma,
    } as PrismaService);
    api = new AppointmentController(new AppointmentService(repo));
  }, 30_000);

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
    if (server) await server.stop();
    if (db) await db.close();
  });

  beforeEach(async () => {
    await prisma.appointment.deleteMany();
    await prisma.professionalTimeBlock.deleteMany();
    await prisma.professionalWorkingHour.deleteMany();
    await prisma.entityBusinessHour.deleteMany();
    await prisma.service.update({
      where: { id: serviceA },
      data: {
        name: 'Corte',
        price: '35.00',
        duration_minutes: 45,
        status: 'ativo',
      },
    });
    await prisma.entityCustomer.update({
      where: {
        customer_id_entity_id: {
          customer_id: inactiveCustomer,
          entity_id: entityA,
        },
      },
      data: { status: 'inativo' },
    });
    await prisma.entityMembership.update({
      where: {
        entity_id_profile_id: { entity_id: entityA, profile_id: barberA },
      },
      data: { roles: ['barbeiro'], status: 'ativo' },
    });
    await prisma.entityBusinessHour.create({
      data: {
        id: randomUUID(),
        entity_id: entityA,
        weekday: 1,
        start_minute: 9 * 60,
        end_minute: 12 * 60,
      },
    });
    for (const profile_id of [barberA, barberA2])
      await prisma.professionalWorkingHour.create({
        data: {
          id: randomUUID(),
          entity_id: entityA,
          profile_id,
          weekday: 1,
          start_minute: 9 * 60,
          end_minute: 12 * 60,
        },
      });
  });

  it('creates with tenant-owned links and immutable Service snapshot', async () => {
    const made = await api.create(request(entityA), body());
    expect(made).toMatchObject({
      entity_id: entityA,
      customer_id: customerA,
      professional_profile_id: barberA,
      service_id: serviceA,
      service_name: 'Corte',
      price: '35.00',
      duration_minutes: 45,
      status: AppointmentStatus.AGENDADO,
      starts_at: at(9),
      ends_at: at(9, 45),
    });
    await prisma.service.update({
      where: { id: serviceA },
      data: { name: 'Novo nome', price: '99.00', duration_minutes: 60 },
    });
    expect(await api.detail(request(entityA), made.id)).toMatchObject({
      service_name: 'Corte',
      price: '35.00',
      duration_minutes: 45,
      ends_at: at(9, 45),
    });
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    await expect(
      pipe.transform(
        {
          ...body(),
          entity_id: entityB,
          ends_at: at(12),
          price_snapshot: '0.00',
        },
        { type: 'body', metatype: CreateAppointmentDTO },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects foreign or inactive Customer, Professional and Service', async () => {
    await expect(
      api.create(request(entityA), { ...body(), customer_id: customerB }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      api.create(request(entityA), {
        ...body(),
        customer_id: inactiveCustomer,
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      api.create(request(entityA), {
        ...body(),
        professional_profile_id: barberB,
      }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      api.create(request(entityA), {
        ...body(),
        professional_profile_id: receptionist,
      }),
    ).rejects.toMatchObject({ status: 400 });
    await prisma.entityMembership.update({
      where: {
        entity_id_profile_id: { entity_id: entityA, profile_id: barberA },
      },
      data: { status: 'inativo' },
    });
    await expect(api.create(request(entityA), body())).rejects.toMatchObject({
      status: 400,
    });
    await prisma.entityMembership.update({
      where: {
        entity_id_profile_id: { entity_id: entityA, profile_id: barberA },
      },
      data: { status: 'ativo' },
    });
    await expect(
      api.create(request(entityA), { ...body(), service_id: serviceB }),
    ).rejects.toMatchObject({ status: 404 });
    await prisma.service.update({
      where: { id: serviceA },
      data: { status: 'inativo' },
    });
    await expect(api.create(request(entityA), body())).rejects.toMatchObject({
      status: 400,
    });
  });

  it('enforces weekly hours, duration and blocks', async () => {
    await expect(
      api.create(request(entityA), body(at(8, 45))),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      api.create(request(entityA), body(at(11, 30))),
    ).rejects.toMatchObject({ status: 409 });
    await prisma.professionalWorkingHour.updateMany({
      where: { entity_id: entityA, profile_id: barberA },
      data: { start_minute: 10 * 60 },
    });
    await expect(
      api.create(request(entityA), body(at(9))),
    ).rejects.toMatchObject({ status: 409 });
    await prisma.professionalTimeBlock.create({
      data: {
        id: randomUUID(),
        entity_id: entityA,
        profile_id: barberA,
        starts_at: new Date(at(10)),
        ends_at: new Date(at(10, 30)),
      },
    });
    await expect(
      api.create(request(entityA), body(at(10))),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('rejects overlap, permits adjacency and releases canceled slots', async () => {
    const first = await api.create(request(entityA), body(at(9)));
    await expect(
      api.create(request(entityA), body(at(9, 15))),
    ).rejects.toMatchObject({ status: 409 });
    const adjacent = await api.create(request(entityA), body(at(9, 45)));
    expect(adjacent.starts_at).toBe(first.ends_at);
    const canceled = await api.cancel(request(entityA), first.id, {
      reason: 'Cliente pediu',
    });
    expect(canceled.status).toBe(AppointmentStatus.CANCELADO);
    expect(
      (await api.cancel(request(entityA), first.id, { reason: 'Outra razão' }))
        .cancellation_reason,
    ).toBe('Cliente pediu');
    expect((await api.create(request(entityA), body(at(9)))).starts_at).toBe(
      first.starts_at,
    );
  });

  it('calculates slots reais em passos de 15 minutos', async () => {
    let result = await api.availability(
      request(entityA),
      nextMonday,
      barberA,
      serviceA,
    );
    expect(result).toMatchObject({
      date: nextMonday,
      timezone: 'America/Sao_Paulo',
      duration_minutes: 45,
      slot_interval_minutes: 15,
    });
    expect(result.slots[0]).toEqual({ starts_at: at(9), ends_at: at(9, 45) });
    expect(result.slots[result.slots.length - 1]?.starts_at).toBe(at(11, 15));
    expect(result.slots.some((p) => p.starts_at === at(11, 30))).toBe(false);
    await prisma.entityBusinessHour.updateMany({
      where: { entity_id: entityA },
      data: { start_minute: 600 },
    });
    result = await api.availability(
      request(entityA),
      nextMonday,
      barberA,
      serviceA,
    );
    expect(result.slots[0]?.starts_at).toBe(at(10));
    await prisma.entityBusinessHour.updateMany({
      where: { entity_id: entityA },
      data: { start_minute: 540 },
    });
    await prisma.professionalWorkingHour.updateMany({
      where: { entity_id: entityA, profile_id: barberA },
      data: { start_minute: 600 },
    });
    result = await api.availability(
      request(entityA),
      nextMonday,
      barberA,
      serviceA,
    );
    expect(result.slots[0]?.starts_at).toBe(at(10));
    await prisma.professionalWorkingHour.updateMany({
      where: { entity_id: entityA, profile_id: barberA },
      data: { start_minute: 540 },
    });
    await prisma.professionalTimeBlock.create({
      data: {
        id: randomUUID(),
        entity_id: entityA,
        profile_id: barberA,
        starts_at: new Date(at(9, 15)),
        ends_at: new Date(at(9, 30)),
      },
    });
    result = await api.availability(
      request(entityA),
      nextMonday,
      barberA,
      serviceA,
    );
    expect(result.slots.some((p) => p.starts_at === at(9))).toBe(false);
    await api.create(request(entityA), body(at(10)));
    result = await api.availability(
      request(entityA),
      nextMonday,
      barberA,
      serviceA,
    );
    expect(result.slots.some((p) => p.starts_at === at(10))).toBe(false);
    await prisma.service.update({
      where: { id: serviceA },
      data: { duration_minutes: 60 },
    });
    result = await api.availability(
      request(entityA),
      nextMonday,
      barberA,
      serviceA,
    );
    expect(result.duration_minutes).toBe(60);
    expect(result.slots[result.slots.length - 1]?.starts_at).toBe(at(11));
  }, 15_000);

  it('lists and details only tenant data; barber sees own assignments', async () => {
    const own = await api.create(request(entityA), body(at(9)));
    await api.create(request(entityA), {
      ...body(at(9)),
      professional_profile_id: barberA2,
    });
    const { from, to } = range();
    expect((await api.list(request(entityA), from, to)).length).toBe(2);
    expect((await api.list(request(entityB), from, to)).length).toBe(0);
    await expect(api.detail(request(entityB), own.id)).rejects.toMatchObject({
      status: 404,
    });
    const barber = request(entityA, barberA, [MemberRole.BARBEIRO]);
    expect((await api.list(barber, from, to)).map((p) => p.id)).toEqual([
      own.id,
    ]);
    await expect(api.list(barber, from, to, barberA2)).rejects.toMatchObject({
      status: 403,
    });
    await expect(
      api.list(request(entityA, '', [MemberRole.BARBEIRO]), from, to),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      api.availability(barber, nextMonday, barberA2, serviceA),
    ).rejects.toMatchObject({ status: 403 });
    const foreign = (await api.list(request(entityA), from, to)).find(
      (p) => p.professional_profile_id === barberA2,
    );
    await expect(api.detail(barber, foreign.id)).rejects.toMatchObject({
      status: 403,
    });
    expect((await api.detail(barber, own.id)).id).toBe(own.id);
  });

  it('rejects invalid dates, ranges, notes and historical creation', async () => {
    await expect(
      api.availability(request(entityA), '2026-02-30', barberA, serviceA),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      api.create(request(entityA), {
        ...body(),
        starts_at: `${nextMonday}T09:00:00`,
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      api.create(request(entityA), {
        ...body(),
        starts_at: '2020-01-01T12:00:00Z',
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      api.create(request(entityA), { ...body(), notes: 'x'.repeat(1001) }),
    ).rejects.toMatchObject({ status: 400 });
    const { from, to } = range();
    await expect(api.list(request(entityA), to, from)).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      api.list(request(entityA), from, to, undefined, undefined, 'confirmado'),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('reagenda sem alterar snapshot e protege estados terminais', async () => {
    const first = await api.create(request(entityA), body(at(9)));
    const blocker = await api.create(request(entityA), body(at(10)));
    await expect(
      api.reschedule(request(entityA), first.id, { starts_at: at(10) }),
    ).rejects.toMatchObject({ status: 409 });
    await prisma.service.update({
      where: { id: serviceA },
      data: { price: '99.00', duration_minutes: 60 },
    });
    const moved = await api.reschedule(request(entityA), first.id, {
      starts_at: at(9, 45),
      professional_profile_id: barberA2,
    });
    expect(moved).toMatchObject({
      id: first.id,
      professional_profile_id: barberA2,
      price: '35.00',
      duration_minutes: 45,
      service_name: 'Corte',
      ends_at: at(10, 30),
    });
    const finished = await api.complete(request(entityA), blocker.id);
    expect(finished.status).toBe(AppointmentStatus.CONCLUIDO);
    await expect(
      api.cancel(request(entityA), blocker.id, {}),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      api.reschedule(request(entityA), blocker.id, { starts_at: at(11) }),
    ).rejects.toMatchObject({ status: 409 });
    await api.cancel(request(entityA), moved.id, {});
    await expect(
      api.complete(request(entityA), moved.id),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('prevents concurrent double booking with two database transactions', async () => {
    const results = await Promise.allSettled([
      api.create(request(entityA), body(at(9))),
      api.create(request(entityA), body(at(9))),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    const failure = results.find(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    expect(failure.reason).toMatchObject({ status: 409 });
    expect(
      await prisma.appointment.count({
        where: {
          entity_id: entityA,
          professional_profile_id: barberA,
          starts_at: new Date(at(9)),
        },
      }),
    ).toBe(1);
  }, 20_000);

  it('protects concurrent reschedule versus create for the same slot', async () => {
    const existing = await api.create(request(entityA), body(at(9)));
    const results = await Promise.allSettled([
      api.reschedule(request(entityA), existing.id, { starts_at: at(10) }),
      api.create(request(entityA), body(at(10))),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    const failure = results.find(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );
    expect(failure.reason).toMatchObject({ status: 409 });
    expect(
      await prisma.appointment.count({
        where: {
          entity_id: entityA,
          professional_profile_id: barberA,
          starts_at: new Date(at(10)),
          status: AppointmentStatus.AGENDADO,
        },
      }),
    ).toBe(1);
  }, 20_000);

  it('reserves writes for administrator and receptionist', () => {
    const guard = new RolesGuard(new Reflector());
    const context = (roles: MemberRole[]) =>
      ({
        // The guard reads metadata and does not invoke this handler.
        // eslint-disable-next-line @typescript-eslint/unbound-method
        getHandler: () => AppointmentController.prototype.create,
        getClass: () => AppointmentController,
        switchToHttp: () => ({
          getRequest: () => request(entityA, barberA, roles),
        }),
      }) as unknown as ExecutionContext;
    expect(guard.canActivate(context([MemberRole.ADMINISTRADOR]))).toBe(true);
    expect(guard.canActivate(context([MemberRole.RECEPCIONISTA]))).toBe(true);
    expect(() => guard.canActivate(context([MemberRole.BARBEIRO]))).toThrow();
    expect(() => guard.canActivate(context([MemberRole.CLIENTE]))).toThrow();
  });
});
