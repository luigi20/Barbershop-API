import { randomInt, randomUUID } from 'crypto';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { IdentityRepository } from '@modules/auth/identity/shared/repositories/identity-repository';
import { ProfileRepository } from '@modules/auth/profile/shared/repositories/profile-repository';
import { EntityRepository } from '@modules/auth/entity/shared/repositories/entity-repository';
import { CustomerRepository } from '@modules/business/customer/shared/repositories/customer-repository';
import { EntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/entitymembership-repository';
import { EntityCustomerRepository } from '@modules/business/entity_customer/shared/repositories/entitycustomer-repository';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeCustomer } from '@modules/business/customer/shared/models/test/customer-factory';
import { makeEntityMembership } from '@modules/business/entity_membership/shared/models/test/entity-membership-factory';
import { makeEntityMembershipCustomer } from '@modules/business/entity_customer/shared/models/test/entity-customer-factory';
import { EntityMembershipGetAllService } from '@modules/business/use_cases/entity_membership/get_all/services/entity_membership_get_all.service';
import { EntityMembershipGetOneService } from '@modules/business/use_cases/entity_membership/get_one/services/entity_membership_get_one.service';
import { EntityCustomerGetAllService } from '@modules/business/use_cases/entity_customer/get_all/services/entity_customer_get_all.service';
import { EntityCustomerGetOneService } from '@modules/business/use_cases/entity_customer/get_one/services/entity_customer_get_one.service';
import { Entity_Membership_View_Model } from '@modules/business/entity_membership/shared/view-models/entity-membership-view-model';
import { Entity_Customer_View_Model } from '@modules/business/entity_customer/shared/view-models/entity-customer-view-model';

describe('P1 list to detail with Prisma and isolated PGlite', () => {
  let db: PGlite;
  let server: PGLiteSocketServer;
  let pool: Pool;
  let prisma: PrismaClient;

  beforeAll(async () => {
    db = await PGlite.create();
    await db.exec(`
      CREATE TABLE "Identity" (id uuid PRIMARY KEY, email varchar UNIQUE NOT NULL, mfa_required boolean NOT NULL, status varchar NOT NULL, last_login_at timestamp, is_superuser boolean NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "Profile" (id uuid PRIMARY KEY, identity_id uuid UNIQUE NOT NULL, name varchar NOT NULL, phone varchar, photo varchar, birth_date timestamp, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "Entity" (id uuid PRIMARY KEY, type varchar NOT NULL, name varchar NOT NULL, document varchar, email varchar, phone varchar, photo varchar, status varchar NOT NULL, timezone varchar(100), created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "Customer" (id uuid PRIMARY KEY, profile_id uuid UNIQUE, created_at timestamp NOT NULL, updated_at timestamp NOT NULL);
      CREATE TABLE "EntityMembership" (entity_id uuid NOT NULL, profile_id uuid NOT NULL, roles varchar[] NOT NULL, status varchar NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL, UNIQUE(entity_id, profile_id));
      CREATE TABLE "EntityCustomer" (entity_id uuid NOT NULL, customer_id uuid NOT NULL, notes text, status varchar NOT NULL, created_at timestamp NOT NULL, updated_at timestamp NOT NULL, UNIQUE(entity_id, customer_id), UNIQUE(customer_id, entity_id));
    `);
    const port = randomInt(30000, 60000);
    server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' });
    await server.start();
    pool = new Pool({
      connectionString: `postgresql://test:test@127.0.0.1:${port}/test`,
      max: 2,
    });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
    if (server) await server.stop();
    if (db) await db.close();
  });

  it('returns stable list IDs that resolve tenant scoped detail', async () => {
    const wrapper = { getPrismaClient: () => prisma } as PrismaService;
    const identities = new IdentityRepository(wrapper);
    const profiles = new ProfileRepository(wrapper);
    const entities = new EntityRepository(wrapper);
    const customers = new CustomerRepository(wrapper);
    const memberships = new EntityMembershipRepository(wrapper);
    const links = new EntityCustomerRepository(wrapper);
    const identity = makeIdentity({
      id: randomUUID(),
      props: { email: 'p1@example.com' },
    });
    const profile = makeProfile({
      id: randomUUID(),
      props: { identity_id: identity.id },
    });
    const entityA = makeEntity({ id: randomUUID() });
    const entityB = makeEntity({ id: randomUUID() });
    const customer = makeCustomer({
      id: randomUUID(),
      props: { profile_id: profile.id },
    });
    await prisma.$transaction(async (tx) => {
      await identities.create(identity, tx);
      await profiles.create(profile, tx);
      await entities.create(entityA, tx);
      await entities.create(entityB, tx);
      await customers.create(customer, tx);
      await memberships.create(
        makeEntityMembership({
          props: { entity_id: entityA._id, profile_id: profile.id },
        }),
        tx,
      );
      await links.create(
        makeEntityMembershipCustomer({
          props: { entity_id: entityA._id, customer_id: customer._id },
        }),
        tx,
      );
    });

    const memberList = new EntityMembershipGetAllService(
      memberships,
      profiles,
      entities,
      identities,
    );
    const membersA = await memberList.execute({
      entity_id: entityA._id,
      is_superuser: false,
    });
    expect(membersA).toHaveLength(1);
    const memberRow = Entity_Membership_View_Model.toHttp(membersA[0]);
    expect(memberRow.email).toBe(identity.email);
    const memberDetail = new EntityMembershipGetOneService(
      memberships,
      profiles,
      entities,
      identities,
    );
    expect(
      (
        await memberDetail.execute({
          entity_id: entityA._id,
          entity_id_user: entityA._id,
          profile_id: memberRow.profile_id,
          is_superuser: false,
        })
      ).profile_id,
    ).toBe(profile.id);

    const customerList = new EntityCustomerGetAllService(
      links,
      profiles,
      entities,
      customers,
      identities,
    );
    const customersA = await customerList.execute({
      entity_id: entityA._id,
      is_superuser: false,
    });
    expect(customersA).toHaveLength(1);
    const customerRow = Entity_Customer_View_Model.toHttp(customersA[0]);
    expect(customerRow.customer_id).toBe(customer._id);
    const customerDetail = new EntityCustomerGetOneService(
      links,
      profiles,
      entities,
      customers,
      identities,
    );
    expect(
      (
        await customerDetail.execute({
          entity_id: entityA._id,
          entity_id_user: entityA._id,
          customer_id: customerRow.customer_id,
          is_superuser: false,
        })
      ).customer_id,
    ).toBe(customer._id);
    expect(
      await memberList.execute({ entity_id: entityB._id, is_superuser: false }),
    ).toHaveLength(0);
    expect(
      await customerList.execute({
        entity_id: entityB._id,
        is_superuser: false,
      }),
    ).toHaveLength(0);
  });
});
