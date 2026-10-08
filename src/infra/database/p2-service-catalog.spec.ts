import { randomInt, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { ServiceRepository } from '@modules/business/service/shared/repositories/service-repository';
import { ServiceMapper } from './mappers/ServiceMapper';
import { ServiceViewModel } from '@modules/business/service/shared/view-models/service-view-model';
import { ServiceCatalogService } from '@modules/business/use_cases/service/service-catalog.service';
import { ServiceCatalogController } from '@modules/business/use_cases/service/service-catalog.controller';
import { ServiceCreateDTO } from '@modules/business/use_cases/service/dto/service-create.dto';
import { ServiceUpdateDTO } from '@modules/business/use_cases/service/dto/service-update.dto';
import { AuthRequest } from '@modules/utils/types/types';
import { MemberRole, ServiceStatus } from '@modules/utils/enum';
import { validate } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@modules/auth/guards/roles_guards';
import { ExecutionContext } from '@nestjs/common';

describe('P2 Service catalog with isolated Prisma/PGlite', () => {
  let db: PGlite;
  let server: PGLiteSocketServer;
  let pool: Pool;
  let prisma: PrismaClient;
  let repository: ServiceRepository;
  let catalog: ServiceCatalogService;
  let controller: ServiceCatalogController;
  const entityA = randomUUID();
  const entityB = randomUUID();
  const body = {
    name: '  Corte  ',
    description: '  Corte clássico  ',
    price: '35.00',
    duration_minutes: 45,
  };
  const request = (entityId: string, roles = [MemberRole.ADMINISTRADOR]) =>
    ({ auth: { entity_id: entityId, roles } }) as AuthRequest;

  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(`
      CREATE TABLE "Entity" (id uuid PRIMARY KEY, type varchar NOT NULL, name varchar NOT NULL, document varchar, email varchar, phone varchar, photo varchar, status varchar NOT NULL, timezone varchar(100), created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "Service" (id uuid PRIMARY KEY, name varchar(100) NOT NULL);
    `);
    const migration = readFileSync(
      join(
        process.cwd(),
        'src/infra/database/prisma/migrations/20261001000000_service_catalog/migration.sql',
      ),
      'utf8',
    );
    await db.exec(migration);
    const port = randomInt(30000, 60000);
    server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' });
    await server.start();
    pool = new Pool({
      connectionString: `postgresql://test:test@127.0.0.1:${port}/test`,
      max: 2,
    });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    const now = new Date();
    for (const id of [entityA, entityB]) {
      await prisma.entity.create({
        data: {
          id,
          type: 'barbearia',
          name: id,
          status: 'ativo',
          created_at: now,
          updated_at: now,
        },
      });
    }
    repository = new ServiceRepository({
      getPrismaClient: () => prisma,
    } as PrismaService);
    catalog = new ServiceCatalogService(repository);
    controller = new ServiceCatalogController(catalog);
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
    if (server) await server.stop();
    if (db) await db.close();
  });

  beforeEach(async () => {
    await prisma.service.deleteMany();
  });

  it('creates under the authenticated Entity, trims text and defaults to ativo', async () => {
    const created = await controller.create(request(entityA), body);
    expect(created).toMatchObject({
      entity_id: entityA,
      name: 'Corte',
      description: 'Corte clássico',
      price: '35.00',
      duration_minutes: 45,
      status: ServiceStatus.ATIVO,
    });
    expect(
      (await prisma.service.findUnique({ where: { id: created.id } }))
        ?.entity_id,
    ).toBe(entityA);
  });

  it('does not accept entity_id from the browser DTO', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    await expect(
      pipe.transform(
        { ...body, entity_id: entityB },
        { type: 'body', metatype: ServiceCreateDTO },
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects a session without tenant context before writing', async () => {
    await expect(controller.create(request(''), body)).rejects.toMatchObject({
      status: 403,
    });
    expect(await prisma.service.count()).toBe(0);
  });

  it('stops the migration when legacy global Service rows exist', async () => {
    const legacyDb = await PGlite.create();
    try {
      await legacyDb.exec(`CREATE TABLE "Service" (id uuid PRIMARY KEY, name varchar(100) NOT NULL);
        INSERT INTO "Service" (id, name) VALUES ('${randomUUID()}', 'Legacy');`);
      const migration = readFileSync(
        join(
          process.cwd(),
          'src/infra/database/prisma/migrations/20261001000000_service_catalog/migration.sql',
        ),
        'utf8',
      );
      await expect(legacyDb.exec(migration)).rejects.toThrow();
      const rows = await legacyDb.query('SELECT name FROM "Service"');
      expect(rows.rows).toEqual([{ name: 'Legacy' }]);
    } finally {
      await legacyDb.close();
    }
  });

  it('lists only the current tenant, including inactive services', async () => {
    const a = await controller.create(request(entityA), body);
    await controller.update(request(entityA), a.id, {
      status: ServiceStatus.INATIVO,
    });
    await controller.create(request(entityB), body);
    const rows = await controller.list(request(entityA));
    expect(rows.map((row) => row.id)).toEqual([a.id]);
    expect(rows[0].status).toBe(ServiceStatus.INATIVO);
  });

  it('resolves list to detail with a stable ID', async () => {
    const created = await controller.create(request(entityA), body);
    const listed = (await controller.list(request(entityA)))[0];
    const detailed = await controller.detail(request(entityA), listed.id);
    expect(detailed.id).toBe(created.id);
    expect(detailed.created_at).toEqual(created.created_at);
  });

  it('returns 404 for a service belonging to another Entity', async () => {
    const b = await controller.create(request(entityB), body);
    await expect(
      controller.detail(request(entityA), b.id),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('rejects cross-tenant update and leaves the other service unchanged', async () => {
    const b = await controller.create(request(entityB), body);
    await expect(
      controller.update(request(entityA), b.id, { name: 'Alterado' }),
    ).rejects.toMatchObject({ status: 404 });
    expect((await controller.detail(request(entityB), b.id)).name).toBe(
      'Corte',
    );
  });

  it('updates current price and duration without changing ID, Entity or created_at', async () => {
    const original = await controller.create(request(entityA), body);
    const changed = await controller.update(request(entityA), original.id, {
      price: '40.50',
      duration_minutes: 60,
    });
    expect(changed).toMatchObject({
      id: original.id,
      entity_id: entityA,
      price: '40.50',
      duration_minutes: 60,
    });
    expect(changed.created_at).toEqual(original.created_at);
    expect(
      (
        await prisma.service.findUnique({ where: { id: original.id } })
      )?.price.toFixed(2),
    ).toBe('40.50');
  });

  it('deactivates and reactivates without deleting the row', async () => {
    const original = await controller.create(request(entityA), body);
    expect(
      (
        await controller.update(request(entityA), original.id, {
          status: ServiceStatus.INATIVO,
        })
      ).status,
    ).toBe(ServiceStatus.INATIVO);
    expect(
      (await prisma.service.findUnique({ where: { id: original.id } }))?.status,
    ).toBe(ServiceStatus.INATIVO);
    expect(
      (
        await controller.update(request(entityA), original.id, {
          status: ServiceStatus.ATIVO,
        })
      ).status,
    ).toBe(ServiceStatus.ATIVO);
  });

  it('rejects invalid price and duration through DTO and service', async () => {
    const invalid = Object.assign(new ServiceCreateDTO(), body, {
      price: 'NaN',
      duration_minutes: 0,
    });
    expect((await validate(invalid)).length).toBeGreaterThanOrEqual(2);
    await expect(catalog.create(entityA, invalid)).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      catalog.create(entityA, { ...body, price: '-1.00' }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      catalog.create(entityA, { ...body, duration_minutes: 0 }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects empty names and arbitrary status', async () => {
    await expect(
      catalog.create(entityA, { ...body, name: '  ' }),
    ).rejects.toMatchObject({ status: 400 });
    const created = await controller.create(request(entityA), body);
    const invalid = Object.assign(new ServiceUpdateDTO(), {
      status: 'pendente',
    });
    expect(await validate(invalid)).not.toHaveLength(0);
    await expect(
      catalog.update(entityA, created.id, invalid),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('preserves ID, tenant, decimal and timestamps through the mapper', async () => {
    const created = await controller.create(request(entityA), body);
    const row = await prisma.service.findUniqueOrThrow({
      where: { id: created.id },
    });
    const domain = ServiceMapper.toDomain(row);
    const raw = ServiceMapper.toPrisma(domain);
    expect(raw).toMatchObject({
      id: row.id,
      entity_id: entityA,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
    expect(raw.price.toFixed(2)).toBe('35.00');
    expect(ServiceViewModel.toHttp(domain).price).toBe('35.00');
  });

  it('writes using a supplied Prisma transaction client', async () => {
    const service = await catalog.create(entityA, body);
    await prisma.$transaction(async (tx) => {
      const found = await repository.findByIdAndEntity(service.id, entityA, tx);
      expect(found?.id).toBe(service.id);
      const updated = await repository.update(
        ServiceMapper.toDomain({
          ...(await tx.service.findUniqueOrThrow({
            where: { id: service.id },
          })),
          status: ServiceStatus.INATIVO,
        }),
        tx,
      );
      expect(updated?.status).toBe(ServiceStatus.INATIVO);
    });
  });

  it('reserves write routes for administrators', () => {
    const guard = new RolesGuard(new Reflector());
    const context = (method: 'create' | 'list', role: MemberRole) =>
      ({
        // The guard only reads decorator metadata; it never calls the handler.
        // eslint-disable-next-line @typescript-eslint/unbound-method
        getHandler: () => ServiceCatalogController.prototype[method],
        getClass: () => ServiceCatalogController,
        switchToHttp: () => ({ getRequest: () => request(entityA, [role]) }),
      }) as unknown as ExecutionContext;
    expect(guard.canActivate(context('create', MemberRole.ADMINISTRADOR))).toBe(
      true,
    );
    expect(() =>
      guard.canActivate(context('create', MemberRole.RECEPCIONISTA)),
    ).toThrow();
    expect(guard.canActivate(context('list', MemberRole.BARBEIRO))).toBe(true);
  });
});
