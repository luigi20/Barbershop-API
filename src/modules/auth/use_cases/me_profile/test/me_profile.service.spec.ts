import { AppError } from '@modules/utils/app_error';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import argon2 from 'argon2';
import { MeProfileService } from '../service/me_profile.service';
import { InMemoryEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { InMemoryEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/test/in-memory-entitycustomer-repository';
import { makeEntityMembership } from '@modules/auth/entity_membership/shared/models/test/entity-membership-factory';
import { makeEntityMembershipCustomer } from '@modules/auth/entity_customer/shared/models/test/entity-customer-factory';

describe('Test in route Me Profile', () => {
  let profile_repository: InMemoryProfileRepository;
  let entity_membership_repository: InMemoryEntityMembershipRepository;
  let entity_customer_repository: InMemoryEntityCustomerRepository;
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  beforeEach(() => {
    jest.clearAllMocks();
    // Populando os repositórios com dados iniciais
    profile_repository = new InMemoryProfileRepository();
    entity_membership_repository = new InMemoryEntityMembershipRepository();
    entity_customer_repository = new InMemoryEntityCustomerRepository();
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
  });

  it('should not get profile, because profile not exists', async () => {
    const me_profile_service = new MeProfileService(
      profile_repository,
      entity_membership_repository,
      entity_customer_repository,
    );
    expect(
      me_profile_service.execute({
        profile_id: 'academia',
        entity_id: '1',
      }),
    ).rejects.toThrow(new AppError('Perfil não existe', 404));
  });
  it('should not get profile, because user not exists', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        id: '123',
        props: {
          identity_id: identity_repository.list_identity[0].id,
        },
      }),
    );
    const me_profile_service = new MeProfileService(
      profile_repository,
      entity_membership_repository,
      entity_customer_repository,
    );
    expect(
      me_profile_service.execute({
        profile_id: '123',
        entity_id: '1',
      }),
    ).rejects.toThrow(
      new AppError('Usuário não pertence a esta organização', 403),
    );
  });

  it('should not get profile, because is membership', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        id: '123',
        props: {
          identity_id: identity_repository.list_identity[0].id,
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        id: '123',
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );
    const me_profile_service = new MeProfileService(
      profile_repository,
      entity_membership_repository,
      entity_customer_repository,
    );

    const result = await me_profile_service.execute({
      profile_id: '123',
      entity_id: '123',
    });
    expect(result).toEqual(profile_repository.list_profile[0]);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(entity_membership_repository.list_membership).toHaveLength(1);
    expect(entity_customer_repository.list_customer).toHaveLength(0);
    expect(result.roles.length).toEqual(1);
  });

  it('should not get profile, because is membercostumer', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        id: '123',
        props: {
          identity_id: identity_repository.list_identity[0].id,
        },
      }),
    );
    entity_customer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        id: '123',
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );
    const me_profile_service = new MeProfileService(
      profile_repository,
      entity_membership_repository,
      entity_customer_repository,
    );

    const result = await me_profile_service.execute({
      profile_id: '123',
      entity_id: '123',
    });
    expect(result).toEqual(profile_repository.list_profile[0]);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(entity_membership_repository.list_membership).toHaveLength(0);
    expect(entity_customer_repository.list_customer).toHaveLength(1);
    expect(result.roles[0]).toEqual('cliente');
  });

  it('should not get profile, because is membercostumer and membership', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        id: '123',
        props: {
          identity_id: identity_repository.list_identity[0].id,
        },
      }),
    );
    entity_customer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        id: '123',
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        id: '123',
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );
    const me_profile_service = new MeProfileService(
      profile_repository,
      entity_membership_repository,
      entity_customer_repository,
    );

    const result = await me_profile_service.execute({
      profile_id: '123',
      entity_id: '123',
    });

    expect(result).toEqual(profile_repository.list_profile[0]);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(entity_membership_repository.list_membership).toHaveLength(1);
    expect(entity_customer_repository.list_customer).toHaveLength(1);
    expect(result.roles.length).toEqual(2);
    console.log(result);
  });
  /*
  

  it('should get profile', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          password: await argon2.hash('123LLv!!@32mjnvhfh'),
          mfa_required: true,
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          context_id: 'academia',
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const change_profile_service = new MeProfileService(
      profile_repository,
      identity_repository,
    );
    const result = await change_profile_service.execute({
      context_id: 'academia',
      entity_id: entity_repository.list_entity[0]._id,
    });
    expect(result).toEqual(profile_repository.list_profile[0]);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });*/
});
