import { randomInt, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { AvailabilityRepository } from '@modules/business/use_cases/availability/availability.repository';
import { AvailabilityService } from '@modules/business/use_cases/availability/availability.service';
import { AvailabilityController } from '@modules/business/use_cases/availability/availability.controller';
import {
  instant,
  validTimezone,
} from '@modules/business/use_cases/availability/availability.rules';
import { AuthRequest } from '@modules/utils/types/types';
import { MemberRole } from '@modules/utils/enum';
import { ExecutionContext, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { ReplaceHoursDTO } from '@modules/business/use_cases/availability/availability.dto';

describe('P3 Availability with isolated Prisma/PGlite', () => {
  let db: PGlite;
  let server: PGLiteSocketServer;
  let pool: Pool;
  let prisma: PrismaClient;
  let service: AvailabilityService;
  let controller: AvailabilityController;
  const entityA = randomUUID(),
    entityB = randomUUID();
  const barberA = randomUUID(),
    barberB = randomUUID(),
    receptionist = randomUUID();
  const monday = [
    { weekday: 1, start_time: '09:00', end_time: '12:00' },
    { weekday: 1, start_time: '14:00', end_time: '18:00' },
  ];
  const request = (id: string) =>
    ({
      auth: { entity_id: id, roles: [MemberRole.ADMINISTRADOR] },
    }) as AuthRequest;

  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(`
      CREATE TABLE "Entity" (id uuid PRIMARY KEY, type varchar NOT NULL, name varchar NOT NULL, document varchar, email varchar, phone varchar, photo varchar, status varchar NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "Profile" (id uuid PRIMARY KEY, identity_id uuid UNIQUE NOT NULL, name varchar NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "EntityMembership" (entity_id uuid NOT NULL, profile_id uuid NOT NULL, roles varchar[] NOT NULL, status varchar NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL, UNIQUE(entity_id,profile_id));
    `);
    await db.exec(
      readFileSync(
        join(
          process.cwd(),
          'src/infra/database/prisma/migrations/20261005000000_p3_availability/migration.sql',
        ),
        'utf8',
      ),
    );
    const port = randomInt(30000, 60000);
    server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' });
    await server.start();
    pool = new Pool({
      connectionString: `postgresql://test:test@127.0.0.1:${port}/test`,
      max: 2,
    });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    const now = new Date();
    for (const id of [entityA, entityB])
      await db.query(
        'INSERT INTO "Entity" (id,type,name,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6)',
        [id, 'barbearia', id, 'ativo', now, now],
      );
    for (const id of [barberA, barberB, receptionist])
      await db.query(
        'INSERT INTO "Profile" (id,identity_id,name,created_at,updated_at) VALUES ($1,$2,$3,$4,$5)',
        [id, randomUUID(), id, now, now],
      );
    for (const [entity, profile, roles] of [
      [entityA, barberA, ['barbeiro']],
      [entityB, barberB, ['barbeiro']],
      [entityA, receptionist, ['recepcionista']],
    ] as const)
      await db.query(
        'INSERT INTO "EntityMembership" (entity_id,profile_id,roles,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6)',
        [entity, profile, roles, 'ativo', now, now],
      );
    service = new AvailabilityService(
      new AvailabilityRepository({
        getPrismaClient: () => prisma,
      } as PrismaService),
    );
    controller = new AvailabilityController(service);
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
    if (server) await server.stop();
    if (db) await db.close();
  });

  beforeEach(async () => {
    await prisma.professionalTimeBlock.deleteMany();
    await prisma.professionalWorkingHour.deleteMany();
    await prisma.entityBusinessHour.deleteMany();
    await prisma.entity.updateMany({ data: { timezone: null } });
  });

  it('requires an explicit supported IANA timezone and keeps tenants separate', async () => {
    expect(await controller.timezone(request(entityA))).toEqual({
      timezone: null,
    });
    await expect(
      controller.replaceBusiness(request(entityA), { periods: monday }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      controller.setTimezone(request(entityA), { timezone: 'UTC-3' }),
    ).rejects.toMatchObject({ status: 400 });
    expect(validTimezone('America/Sao_Paulo')).toBe('America/Sao_Paulo');
    await controller.setTimezone(request(entityA), {
      timezone: 'America/Belem',
    });
    expect(await controller.timezone(request(entityA))).toEqual({
      timezone: 'America/Belem',
    });
    expect(await controller.timezone(request(entityB))).toEqual({
      timezone: null,
    });
  });

  it('persists multiple periods, stable IDs, isolation and atomic invalid replacement', async () => {
    await controller.setTimezone(request(entityA), {
      timezone: 'America/Sao_Paulo',
    });
    const first = await controller.replaceBusiness(request(entityA), {
      periods: monday,
    });
    expect(first.periods).toHaveLength(2);
    expect((await controller.business(request(entityB))).periods).toHaveLength(
      0,
    );
    const second = await controller.replaceBusiness(request(entityA), {
      periods: monday,
    });
    expect(second.periods.map((p) => p.id)).toEqual(
      first.periods.map((p) => p.id),
    );
    await expect(
      controller.replaceBusiness(request(entityA), {
        periods: [
          monday[0],
          { weekday: 1, start_time: '11:00', end_time: '17:00' },
        ],
      }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      controller.replaceBusiness(request(entityA), {
        periods: [{ weekday: 1, start_time: '12:00', end_time: '12:00' }],
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(
      (await controller.business(request(entityA))).periods.map((p) => p.id),
    ).toEqual(first.periods.map((p) => p.id));
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    await expect(
      pipe.transform(
        { periods: [...monday, { ...monday[0], entity_id: entityB }] },
        { type: 'body', metatype: ReplaceHoursDTO },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('enforces membership, barber role, containment and professional overlaps', async () => {
    await controller.setTimezone(request(entityA), {
      timezone: 'America/Sao_Paulo',
    });
    await controller.replaceBusiness(request(entityA), { periods: monday });
    await expect(
      controller.professional(request(entityA), barberB),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      controller.replaceProfessional(request(entityA), receptionist, {
        periods: [monday[0]],
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      controller.replaceProfessional(request(entityA), barberA, {
        periods: [{ weekday: 1, start_time: '08:00', end_time: '10:00' }],
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      controller.replaceProfessional(request(entityA), barberA, {
        periods: [
          monday[0],
          { weekday: 1, start_time: '11:00', end_time: '12:00' },
        ],
      }),
    ).rejects.toMatchObject({ status: 409 });
    const first = await controller.replaceProfessional(
      request(entityA),
      barberA,
      { periods: monday },
    );
    const second = await controller.replaceProfessional(
      request(entityA),
      barberA,
      { periods: monday },
    );
    expect(second.periods.map((p) => p.id)).toEqual(
      first.periods.map((p) => p.id),
    );
    await expect(
      controller.replaceBusiness(request(entityA), { periods: [monday[0]] }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await controller.business(request(entityA))).periods).toHaveLength(
      2,
    );
  });

  it('creates, updates, lists and removes UTC blocks within one tenant', async () => {
    await controller.setTimezone(request(entityA), {
      timezone: 'America/Sao_Paulo',
    });
    const input = {
      starts_at: '2026-10-15T14:00:00-03:00',
      ends_at: '2026-10-15T16:00:00-03:00',
      reason: 'Consulta',
    };
    const block = await controller.createBlock(
      request(entityA),
      barberA,
      input,
    );
    expect(block.starts_at).toBe('2026-10-15T17:00:00.000Z');
    expect(
      (
        await controller.blocks(
          request(entityA),
          barberA,
          '2026-10-15T00:00:00Z',
          '2026-10-16T00:00:00Z',
        )
      ).map((p) => p.id),
    ).toEqual([block.id]);
    await expect(
      controller.blocks(
        request(entityB),
        barberA,
        input.starts_at,
        input.ends_at,
      ),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      controller.updateBlock(request(entityB), barberB, block.id, input),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      controller.createBlock(request(entityA), barberA, {
        ...input,
        ends_at: input.starts_at,
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      controller.createBlock(request(entityA), barberA, input),
    ).rejects.toMatchObject({ status: 409 });
    const changed = await controller.updateBlock(
      request(entityA),
      barberA,
      block.id,
      { ...input, reason: 'Viagem' },
    );
    expect(changed.id).toBe(block.id);
    expect(changed.reason).toBe('Viagem');
    expect(
      await controller.removeBlock(request(entityA), barberA, block.id),
    ).toEqual({ id: block.id });
    expect(await prisma.professionalTimeBlock.count()).toBe(0);
    expect(instant('2026-10-15T14:00:00-03:00').toISOString()).toBe(
      '2026-10-15T17:00:00.000Z',
    );
    expect(() => instant('2026-10-15T14:00:00')).toThrow();
    expect(() => instant('2026-02-30T14:00:00Z')).toThrow();
  });

  it('allows an administrator to clear old hours after barber role is removed', async () => {
    await controller.setTimezone(request(entityA), {
      timezone: 'America/Sao_Paulo',
    });
    await controller.replaceBusiness(request(entityA), { periods: monday });
    await controller.replaceProfessional(request(entityA), barberA, {
      periods: [monday[0]],
    });
    const where = {
      entity_id_profile_id: { entity_id: entityA, profile_id: barberA },
    };
    await prisma.entityMembership.update({
      where,
      data: { roles: ['recepcionista'] },
    });
    try {
      expect(
        (await controller.professional(request(entityA), barberA)).periods,
      ).toHaveLength(1);
      await expect(
        controller.replaceProfessional(request(entityA), barberA, {
          periods: [monday[1]],
        }),
      ).rejects.toMatchObject({ status: 400 });
      expect(
        (
          await controller.replaceProfessional(request(entityA), barberA, {
            periods: [],
          })
        ).periods,
      ).toHaveLength(0);
    } finally {
      await prisma.entityMembership.update({
        where,
        data: { roles: ['barbeiro'] },
      });
    }
  });

  it('restricts configuration routes to administrators', () => {
    const guard = new RolesGuard(new Reflector());
    const context = (roles: MemberRole[]) =>
      ({
        // The guard reads decorator metadata without invoking this handler.
        // eslint-disable-next-line @typescript-eslint/unbound-method
        getHandler: () => AvailabilityController.prototype.replaceProfessional,
        getClass: () => AvailabilityController,
        switchToHttp: () => ({
          getRequest: () => ({ auth: { entity_id: entityA, roles } }),
        }),
      }) as unknown as ExecutionContext;
    expect(guard.canActivate(context([MemberRole.ADMINISTRADOR]))).toBe(true);
    expect(() => guard.canActivate(context([MemberRole.BARBEIRO]))).toThrow();
  });
});
