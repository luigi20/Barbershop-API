import { randomInt, randomUUID } from 'crypto';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { ProfileRepository } from '@modules/auth/profile/shared/repositories/profile-repository';
import { CustomerRepository } from '@modules/business/customer/shared/repositories/customer-repository';
import { EntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/entitymembership-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { makeCustomer } from '@modules/business/customer/shared/models/test/customer-factory';
import { makeEntityMembership } from '@modules/business/entity_membership/shared/models/test/entity-membership-factory';

describe('P0 repositories against isolated in-memory PostgreSQL', () => {
  let db: PGlite;
  let server: PGLiteSocketServer;
  let pool: Pool;
  let prisma: PrismaClient;
  let profiles: ProfileRepository;
  let customers: CustomerRepository;
  let memberships: EntityMembershipRepository;

  beforeAll(async () => {
    // This database exists only in this Jest process; it never reads DATABASE_URL.
    db = await PGlite.create();
    await db.exec(`
      CREATE TABLE "Profile" (id uuid PRIMARY KEY, identity_id uuid UNIQUE NOT NULL, name varchar NOT NULL, phone varchar, photo varchar, birth_date timestamp, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "Customer" (id uuid PRIMARY KEY, profile_id uuid UNIQUE, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "EntityMembership" (entity_id uuid NOT NULL, profile_id uuid NOT NULL, roles varchar[] NOT NULL, status varchar NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL, UNIQUE(entity_id, profile_id));
    `);
    const port = randomInt(30000, 60000);
    server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' });
    await server.start();
    pool = new Pool({
      connectionString: `postgresql://test:test@127.0.0.1:${port}/test`,
      max: 2,
    });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    const wrapper = { getPrismaClient: () => prisma } as PrismaService;
    profiles = new ProfileRepository(wrapper);
    customers = new CustomerRepository(wrapper);
    memberships = new EntityMembershipRepository(wrapper);
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
    if (server) await server.stop();
    if (db) await db.close();
  });

  it('creates and updates Profile and Customer inside and outside transactions using stable IDs', async () => {
    const profile = makeProfile({
      id: randomUUID(),
      props: { identity_id: randomUUID(), name: 'Before' },
    });
    await profiles.create(profile);
    profile.name = 'After';
    await prisma.$transaction(async (tx) => profiles.update(profile, tx));
    const storedProfile = await profiles.find_one(profile.id);
    expect(storedProfile?.id).toBe(profile.id);
    expect(storedProfile?.name).toBe('After');
    expect(storedProfile?.identity_id).toBe(profile.identity_id);
    const customer = makeCustomer({
      id: randomUUID(),
      props: { profile_id: profile.id },
    });
    await prisma.$transaction(async (tx) => customers.create(customer, tx));
    expect((await customers.find_profile_id(profile.id))?._id).toBe(
      customer._id,
    );
  });

  it('updates only the matching Membership composite key', async () => {
    const entityA = randomUUID();
    const entityB = randomUUID();
    const profileId = randomUUID();
    const one = makeEntityMembership({
      props: { entity_id: entityA, profile_id: profileId, roles: ['barbeiro'] },
    });
    const two = makeEntityMembership({
      props: { entity_id: entityB, profile_id: profileId, roles: ['barbeiro'] },
    });
    await memberships.create(one);
    await memberships.create(two);
    one.roles = ['recepcionista'];
    await prisma.$transaction(async (tx) => memberships.update(one, tx));
    expect((await memberships.find_one(entityA, profileId))?.roles).toEqual([
      'recepcionista',
    ]);
    expect((await memberships.find_one(entityB, profileId))?.roles).toEqual([
      'barbeiro',
    ]);
  });
});
