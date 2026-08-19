import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { AppError } from '@modules/utils/app_error';
import { InMemoryEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { EntityCustomerGetOneService } from '../services/entity_customer_get_one.service';
import { makeEntityMembership } from '@modules/auth/entity_membership/shared/models/test/entity-membership-factory';
import { InMemoryEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/test/in-memory-entitycustomer-repository';
import { makeEntityMembershipCustomer } from '@modules/auth/entity_customer/shared/models/test/entity-customer-factory';

describe('Test in route get one customer', () => {
  let entity_repository: InMemoryEntityRepository;
  let profile_repository: InMemoryProfileRepository;
  let identity_repository: InMemoryIdentityRepository;
  let entity_customer_repository: InMemoryEntityCustomerRepository;

  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    profile_repository = new InMemoryProfileRepository();
    entity_customer_repository = new InMemoryEntityCustomerRepository();
    identity_repository = new InMemoryIdentityRepository();
  });

  it('should not get members, because user not permission', async () => {
    const entityCustomerGetOneService = new EntityCustomerGetOneService(
      entity_customer_repository,
      profile_repository,
      entity_repository,
    );
    expect(
      entityCustomerGetOneService.execute({
        entity_id: '343',
        entity_id_user: '34454',
        profile_id: '123',
        is_superuser: false,
      }),
    ).rejects.toThrow(
      new AppError(
        'Usuário não tem permissão de acessar dados de usuários de outra empresa',
        400,
      ),
    );
  });

  it('should not get members, because user not exists', async () => {
    const entityCustomerGetOneService = new EntityCustomerGetOneService(
      entity_customer_repository,
      profile_repository,
      entity_repository,
    );
    expect(
      entityCustomerGetOneService.execute({
        entity_id: '343',
        entity_id_user: '343',
        profile_id: '123',
        is_superuser: false,
      }),
    ).rejects.toThrow(new AppError('Usuário não existe', 404));
  });

  it('should one member', async () => {
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

    entity_repository.list_entity.push(
      makeEntity({
        id: '1234',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '1234',
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        id: '1234',
        props: {
          identity_id: identity_repository.list_identity[1].id,
        },
      }),
    );
    entity_customer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        id: '124',
        props: {
          entity_id: entity_repository.list_entity[1]._id,
          profile_id: profile_repository.list_profile[1].id,
        },
      }),
    );
    const entityCustomerGetOneService = new EntityCustomerGetOneService(
      entity_customer_repository,
      profile_repository,
      entity_repository,
    );
    const result = await entityCustomerGetOneService.execute({
      entity_id: '123',
      entity_id_user: '123',
      profile_id: '123',
      is_superuser: true,
    });
    expect(result).not.toBeNull();
  });
});
