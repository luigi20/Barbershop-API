import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { AppointmentRepository } from '@modules/business/use_cases/appointment/appointment.repository';
import { AppointmentService } from '@modules/business/use_cases/appointment/appointment.service';
import { AppointmentController } from '@modules/business/use_cases/appointment/appointment.controller';
import { localCandidates } from '@modules/business/use_cases/appointment/appointment-time';
import { AuthRequest } from '@modules/utils/types/types';
import { MemberRole, AppointmentStatus } from '@modules/utils/enum';

const connectionString = process.env.P4_POSTGRES_TEST_DATABASE_URL;
const enabled =
  process.env.P4_DISPOSABLE_POSTGRES_TEST === '1' && Boolean(connectionString);

(enabled ? describe : describe.skip)(
  'P4 real PostgreSQL concurrency, disposable container only',
  () => {
    let pool: Pool;
    let prisma: PrismaClient;
    let api: AppointmentController;
    const schema = `p4_${randomUUID().replace(/-/g, '')}`;
    const entityId = randomUUID(),
      profileId = randomUUID(),
      customerId = randomUUID(),
      serviceId = randomUUID();
    const monday = (() => {
      const now = new Date();
      return new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + ((8 - now.getUTCDay()) % 7) + 14,
        ),
      )
        .toISOString()
        .slice(0, 10);
    })();
    const at = (hour: number) =>
      localCandidates(monday, hour * 60, 'America/Sao_Paulo')[0].toISOString();
    const request = {
      auth: {
        entity_id: entityId,
        profile_id: profileId,
        roles: [MemberRole.ADMINISTRADOR],
      },
    } as AuthRequest;
    const body = (hour: number) => ({
      customer_id: customerId,
      professional_profile_id: profileId,
      service_id: serviceId,
      starts_at: at(hour),
    });

    beforeAll(async () => {
      // Use only the explicitly configured disposable PostgreSQL test database.
      const bootstrap = new Pool({ connectionString, max: 1 });
      try {
        await bootstrap.query(`CREATE SCHEMA "${schema}"`);
      } finally {
        await bootstrap.end();
      }
      pool = new Pool({
        connectionString,
        max: 8,
        options: `-c search_path=${schema}`,
      });
      await pool.query(`
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
        await pool.query(
          readFileSync(
            join(
              process.cwd(),
              `src/infra/database/prisma/migrations/${migration}/migration.sql`,
            ),
            'utf8',
          ),
        );
      prisma = new PrismaClient({ adapter: new PrismaPg(pool, { schema }) });
      const now = new Date();
      await prisma.entity.create({
        data: {
          id: entityId,
          type: 'barbearia',
          name: 'Postgres test',
          status: 'ativo',
          timezone: 'America/Sao_Paulo',
          created_at: now,
          updated_at: now,
        },
      });
      await prisma.profile.create({
        data: {
          id: profileId,
          identity_id: randomUUID(),
          name: 'Barbeiro',
          created_at: now,
          updated_at: now,
        },
      });
      await prisma.entityMembership.create({
        data: {
          entity_id: entityId,
          profile_id: profileId,
          roles: ['barbeiro'],
          status: 'ativo',
          created_at: now,
          updated_at: now,
        },
      });
      await prisma.customer.create({
        data: { id: customerId, created_at: now, updated_at: now },
      });
      await prisma.entityCustomer.create({
        data: { entity_id: entityId, customer_id: customerId, status: 'ativo' },
      });
      await prisma.service.create({
        data: {
          id: serviceId,
          entity_id: entityId,
          name: 'Corte',
          price: '35.00',
          duration_minutes: 45,
          status: 'ativo',
          created_at: now,
          updated_at: now,
        },
      });
      await prisma.entityBusinessHour.create({
        data: {
          id: randomUUID(),
          entity_id: entityId,
          weekday: 1,
          start_minute: 540,
          end_minute: 720,
        },
      });
      await prisma.professionalWorkingHour.create({
        data: {
          id: randomUUID(),
          entity_id: entityId,
          profile_id: profileId,
          weekday: 1,
          start_minute: 540,
          end_minute: 720,
        },
      });
      api = new AppointmentController(
        new AppointmentService(
          new AppointmentRepository({
            getPrismaClient: () => prisma,
          } as PrismaService),
        ),
      );
    }, 30_000);

    afterAll(async () => {
      if (prisma) await prisma.$disconnect();
      if (pool) await pool.end();
    });

    beforeEach(async () => {
      await prisma.appointment.deleteMany();
    });

    it('holds a real row lock across independent PostgreSQL connections', async () => {
      const first = await pool.connect(),
        second = await pool.connect();
      try {
        await first.query('BEGIN');
        await second.query('BEGIN');
        await first.query(
          'SELECT profile_id FROM "EntityMembership" WHERE entity_id=$1 AND profile_id=$2 FOR UPDATE',
          [entityId, profileId],
        );
        let acquired = false;
        const pending = second
          .query(
            'SELECT profile_id FROM "EntityMembership" WHERE entity_id=$1 AND profile_id=$2 FOR UPDATE',
            [entityId, profileId],
          )
          .then(() => {
            acquired = true;
          });
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(acquired).toBe(false);
        await first.query('COMMIT');
        await pending;
        expect(acquired).toBe(true);
        await second.query('COMMIT');
      } finally {
        await first.query('ROLLBACK').catch(() => undefined);
        await second.query('ROLLBACK').catch(() => undefined);
        first.release();
        second.release();
      }
    });

    it('commits one of two concurrent creates and rejects the other', async () => {
      const results = await Promise.allSettled([
        api.create(request, body(9)),
        api.create(request, body(9)),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toMatchObject({ status: 409 });
      expect(
        await prisma.appointment.count({
          where: {
            entity_id: entityId,
            professional_profile_id: profileId,
            starts_at: new Date(at(9)),
          },
        }),
      ).toBe(1);
    }, 20_000);

    it('commits only one concurrent reschedule versus create', async () => {
      const existing = await api.create(request, body(9));
      const results = await Promise.allSettled([
        api.reschedule(request, existing.id, { starts_at: at(10) }),
        api.create(request, body(10)),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toMatchObject({ status: 409 });
      expect(
        await prisma.appointment.count({
          where: {
            entity_id: entityId,
            professional_profile_id: profileId,
            starts_at: new Date(at(10)),
            status: AppointmentStatus.AGENDADO,
          },
        }),
      ).toBe(1);
    }, 20_000);
  },
);
