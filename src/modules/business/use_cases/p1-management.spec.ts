import { AuthRequest } from '@modules/utils/types/types';
import { MemberRole, MembershipStatus } from '@modules/utils/enum';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeCustomer } from '../customer/shared/models/test/customer-factory';
import { makeEntityMembership } from '../entity_membership/shared/models/test/entity-membership-factory';
import { makeEntityMembershipCustomer } from '../entity_customer/shared/models/test/entity-customer-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { InMemoryCustomerRepository } from '../customer/shared/repositories/test/in-memory-customer-repository';
import { InMemoryEntityMembershipRepository } from '../entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { InMemoryEntityCustomerRepository } from '../entity_customer/shared/repositories/test/in-memory-entitycustomer-repository';
import { MeProfileService } from '@modules/auth/use_cases/me_profile/service/me_profile.service';
import { ChangeProfileService } from '@modules/auth/use_cases/change_profile/service/change_profile.service';
import { Profile_View_Model } from '@modules/auth/profile/shared/view-models/profile-view-model';
import { EntityMembershipGetAllService } from './entity_membership/get_all/services/entity_membership_get_all.service';
import { EntityMembershipGetOneService } from './entity_membership/get_one/services/entity_membership_get_one.service';
import { EntityMembershipUpdateService } from './entity_membership/update/services/entity_membership_update.service';
import { Entity_Membership_View_Model } from '../entity_membership/shared/view-models/entity-membership-view-model';
import { EntityCustomerGetAllService } from './entity_customer/get_all/services/entity_customer_get_all.service';
import { EntityCustomerGetOneService } from './entity_customer/get_one/services/entity_customer_get_one.service';
import { Entity_Customer_View_Model } from '../entity_customer/shared/view-models/entity-customer-view-model';
import { EntityGetOneController } from './entity/get_one/controller/entity_get_one.controller';
import { EntityUpdateController } from './entity/update/controller/entity_update.controller';
import { EntityGetOneService } from './entity/get_one/service/entity_get_one.service';
import { EntityUpdateService } from './entity/update/service/entity_update.service';
import { EntityUpdateDTO } from './entity/update/dto/entityUpdateDTO';
import { EntityCustomerCreateService } from './entity_customer/create/services/entity_customer_create.service';
import { InMemoryIdentityCredentialRepository } from '@modules/auth/identity_credential/shared/repositories/test/in-memory-identity-credential-repository';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { validate } from 'class-validator';
import { EntityCustomerUpdateDTO } from './entity_customer/update/dto/entity_customer_updateDTO';
import { CustomerStatus } from '@modules/utils/enum';
import { ManagementAppErrorFilter } from './management-app-error.filter';
import { AppError } from '@modules/utils/app_error';
import { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUniqueConflict } from './p1-unique-conflict';

describe('P1 management contracts', () => {
  const entityId = 'entity-a';
  const identityId = 'identity-a';
  const profileId = 'profile-a';
  const customerId = 'customer-a';

  function setup() {
    const identities = new InMemoryIdentityRepository();
    const profiles = new InMemoryProfileRepository();
    const entities = new InMemoryEntityRepository();
    const customers = new InMemoryCustomerRepository();
    const memberships = new InMemoryEntityMembershipRepository();
    const links = new InMemoryEntityCustomerRepository();
    const identity = makeIdentity({
      id: identityId,
      props: { email: 'person@example.com' },
    });
    const profile = makeProfile({
      id: profileId,
      props: { identity_id: identityId, name: 'Person' },
    });
    const customer = makeCustomer({
      id: customerId,
      props: { profile_id: profileId },
    });
    identities.list_identity.push(identity);
    profiles.list_profile.push(profile);
    entities.list_entity.push(makeEntity({ id: entityId }));
    customers.list_customer.push(customer);
    memberships.list_membership.push(
      makeEntityMembership({
        props: { entity_id: entityId, profile_id: profileId },
      }),
    );
    links.list_customer.push(
      makeEntityMembershipCustomer({
        props: { entity_id: entityId, customer_id: customerId },
      }),
    );
    return { identities, profiles, entities, customers, memberships, links };
  }

  it('reads email from Identity and updates only the authenticated Profile, including nullable fields', async () => {
    const data = setup();
    const other = makeProfile({ id: 'profile-b' });
    data.profiles.list_profile.push(other);
    const read = new MeProfileService(
      data.profiles,
      data.memberships,
      data.links,
      data.customers,
      data.identities,
    );
    const before = Profile_View_Model.toHttp(
      await read.execute({ profile_id: profileId, entity_id: entityId }),
    );
    expect(before.email).toBe('person@example.com');
    const update = new ChangeProfileService(data.profiles, data.identities);
    const changed = await update.execute({
      profile_id: profileId,
      name: 'Updated',
      phone: null,
      photo_url: null,
      birth_date: '2000-01-02',
    });
    expect(Profile_View_Model.toHttp(changed)).toMatchObject({
      id: profileId,
      email: 'person@example.com',
      name: 'Updated',
      phone: null,
      photo: null,
    });
    expect(changed.birth_date.toISOString().startsWith('2000-01-02')).toBe(
      true,
    );
    expect((await data.profiles.find_one(other.id))?.name).toBe(other.name);
    expect((await data.identities.find_by_id(identityId))?.email).toBe(
      'person@example.com',
    );
  });

  it('lists a member with the ID accepted by detail and stays inside one tenant', async () => {
    const data = setup();
    data.entities.list_entity.push(makeEntity({ id: 'entity-b' }));
    data.memberships.list_membership.push(
      makeEntityMembership({
        props: { entity_id: 'entity-b', profile_id: profileId },
      }),
    );
    const list = new EntityMembershipGetAllService(
      data.memberships,
      data.profiles,
      data.entities,
      data.identities,
    );
    const rows = await list.execute({
      entity_id: entityId,
      is_superuser: false,
    });
    expect(rows).toHaveLength(1);
    const publicRow = Entity_Membership_View_Model.toHttp(rows[0]);
    expect(publicRow).toMatchObject({
      entity_id: entityId,
      profile_id: profileId,
      identity_id: identityId,
      email: 'person@example.com',
    });
    const detail = new EntityMembershipGetOneService(
      data.memberships,
      data.profiles,
      data.entities,
      data.identities,
    );
    const found = await detail.execute({
      entity_id: entityId,
      entity_id_user: entityId,
      profile_id: publicRow.profile_id,
      is_superuser: false,
    });
    expect(Entity_Membership_View_Model.toHttp(found).profile_id).toBe(
      profileId,
    );
  });

  it('updates a member by the listed profile_id without changing global Identity', async () => {
    const data = setup();
    data.entities.list_entity.push(makeEntity({ id: 'entity-b' }));
    data.memberships.list_membership.push(
      makeEntityMembership({
        props: { entity_id: 'entity-b', profile_id: profileId },
      }),
    );
    const prisma = {
      getPrismaClient: () => ({
        $transaction: (fn: (tx: object) => Promise<void>) => fn({}),
      }),
    } as PrismaService;
    const service = new EntityMembershipUpdateService(
      data.memberships,
      data.profiles,
      data.entities,
      data.identities,
      prisma,
    );
    const updated = await service.execute({
      entity_id: entityId,
      profile_id: profileId,
      roles: [MemberRole.BARBEIRO],
      status: MembershipStatus.INATIVO,
      roles_auth: [MemberRole.ADMINISTRADOR],
    });
    expect(updated).toMatchObject({
      entity_id: entityId,
      profile_id: profileId,
      roles: [MemberRole.BARBEIRO],
      status: MembershipStatus.INATIVO,
      email: 'person@example.com',
    });
    expect(
      (await data.memberships.find_one('entity-b', profileId))?.status,
    ).toBe(MembershipStatus.ATIVO);
    expect((await data.identities.find_by_id(identityId))?.email).toBe(
      'person@example.com',
    );
  });

  it('lists a customer with the stable Customer ID accepted by detail', async () => {
    const data = setup();
    const list = new EntityCustomerGetAllService(
      data.links,
      data.profiles,
      data.entities,
      data.customers,
      data.identities,
    );
    const rows = await list.execute({
      entity_id: entityId,
      is_superuser: false,
    });
    const publicRow = Entity_Customer_View_Model.toHttp(rows[0]);
    expect(publicRow).toMatchObject({
      customer_id: customerId,
      profile_id: profileId,
      email: 'person@example.com',
    });
    const detail = new EntityCustomerGetOneService(
      data.links,
      data.profiles,
      data.entities,
      data.customers,
      data.identities,
    );
    const found = await detail.execute({
      entity_id: entityId,
      entity_id_user: entityId,
      customer_id: publicRow.customer_id,
      is_superuser: false,
    });
    expect(Entity_Customer_View_Model.toHttp(found).customer_id).toBe(
      customerId,
    );
    await expect(
      detail.execute({
        entity_id: 'entity-b',
        entity_id_user: entityId,
        customer_id: customerId,
        is_superuser: false,
      }),
    ).rejects.toBeDefined();
  });

  it('uses the tenant in the access token for current Entity routes', async () => {
    const entity = makeEntity({ id: entityId });
    const read = { execute: jest.fn().mockResolvedValue(entity) };
    const update = { execute: jest.fn().mockResolvedValue(entity) };
    const req = {
      auth: {
        entity_id: entityId,
        identity_id: identityId,
        profile_id: profileId,
        roles: [MemberRole.ADMINISTRADOR],
      },
    } as AuthRequest;
    await new EntityGetOneController(
      read as unknown as EntityGetOneService,
    ).Current(req);
    expect(read.execute).toHaveBeenCalledWith({ id: entityId });
    await new EntityUpdateController(
      update as unknown as EntityUpdateService,
    ).Current(req, { name: 'Updated' } as EntityUpdateDTO);
    expect(update.execute).toHaveBeenCalledTimes(1);
    const call = (
      update.execute.mock.calls as unknown as Array<[{ id: string }]>
    )[0][0];
    expect(call.id).toBe(entityId);
  });

  it('creates Customer for an existing Identity/Profile, then rejects a duplicate link', async () => {
    const data = setup();
    data.customers.list_customer.length = 0;
    data.links.list_customer.length = 0;
    const prisma = {
      getPrismaClient: () => ({
        $transaction: (fn: (tx: object) => Promise<void>) => fn({}),
      }),
    } as PrismaService;
    const credentials = new InMemoryIdentityCredentialRepository();
    const service = new EntityCustomerCreateService(
      data.links,
      data.profiles,
      data.entities,
      data.identities,
      prisma,
      credentials,
      data.customers,
    );
    const input = {
      entity_id: entityId,
      email: 'person@example.com',
      password: 'ValidPassword123!',
      name: 'Ignored for existing Profile',
      phone: '',
      photo: '',
      birth_date: '2000-01-02',
      mfa_required: false,
      notes: 'local',
    };
    const created = await service.execute(input);
    expect(created.customer_id).toBe(data.customers.list_customer[0]._id);
    expect(created.profile_id).toBe(profileId);
    expect(data.identities.list_identity).toHaveLength(1);
    expect(data.profiles.list_profile).toHaveLength(1);
    expect(credentials.list_identity_credential).toHaveLength(0);
    await expect(service.execute(input)).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(data.links.list_customer).toHaveLength(1);
  });

  it('reuses a Customer ID for a new tenant link without sharing local notes', async () => {
    const data = setup();
    data.entities.list_entity.push(makeEntity({ id: 'entity-b' }));
    const prisma = {
      getPrismaClient: () => ({
        $transaction: (fn: (tx: object) => Promise<void>) => fn({}),
      }),
    } as PrismaService;
    const service = new EntityCustomerCreateService(
      data.links,
      data.profiles,
      data.entities,
      data.identities,
      prisma,
      new InMemoryIdentityCredentialRepository(),
      data.customers,
    );
    const created = await service.execute({
      entity_id: 'entity-b',
      email: 'person@example.com',
      password: 'ValidPassword123!',
      name: 'Person',
      phone: '',
      photo: '',
      birth_date: '2000-01-02',
      mfa_required: false,
      notes: 'B only',
    });
    expect(created.customer_id).toBe(customerId);
    expect((await data.links.find_one(entityId, customerId))?.notes).toBe(
      'role',
    );
    expect((await data.links.find_one('entity-b', customerId))?.notes).toBe(
      'B only',
    );
  });

  it('validates stable IDs and local Customer status in the update DTO', async () => {
    const input = new EntityCustomerUpdateDTO();
    input.customer_id = 'not-a-uuid';
    input.status = 'unexpected' as CustomerStatus;
    expect((await validate(input)).length).toBeGreaterThan(0);
  });

  it('returns a business conflict as HTTP 409 on management routes', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    new ManagementAppErrorFilter().catch(new AppError('Duplicado', 409), host);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'Duplicado',
    });
  });

  it('recognizes a Prisma unique constraint race without inspecting its message', () => {
    const error = new Prisma.PrismaClientKnownRequestError('unique', {
      code: 'P2002',
      clientVersion: '7.9.1',
    });
    expect(isUniqueConflict(error)).toBe(true);
    expect(isUniqueConflict(new Error('unique'))).toBe(false);
  });
});
