import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { AppError } from '@modules/utils/app_error';
import { EntityCustomerGetAllService } from '../services/entity_customer_get_all.service';
import { InMemoryEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/test/in-memory-entitycustomer-repository';
import { makeEntityMembershipCustomer } from '@modules/auth/entity_customer/shared/models/test/entity-customer-factory';

describe('Test in route get all member customer', () => {
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

  it('should not get customers, because tenant not exists', async () => {
    const entityCustomerGetAllService = new EntityCustomerGetAllService(
      entity_customer_repository,
      profile_repository,
      entity_repository,
    );
    expect(
      entityCustomerGetAllService.execute({
        entity_id: '343',
        is_superuser: false,
      }),
    ).rejects.toThrow(new AppError('Empresa não existe', 404));
  });

  it('should not get customers, because count members equal 0', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    const entityCustomerGetAllService = new EntityCustomerGetAllService(
      entity_customer_repository,
      profile_repository,
      entity_repository,
    );
    const result = await entityCustomerGetAllService.execute({
      entity_id: '123',
      is_superuser: false,
    });
    expect(result.length).toBe(0);
  });

  it('should list customers in tenant', async () => {
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
    const entityCustomerGetAllService = new EntityCustomerGetAllService(
      entity_customer_repository,
      profile_repository,
      entity_repository,
    );
    const result = await entityCustomerGetAllService.execute({
      entity_id: '123',
      is_superuser: false,
    });
    expect(result.length).toBe(1);
  });

  it('should all customers', async () => {
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
    const entityCustomerGetAllService = new EntityCustomerGetAllService(
      entity_customer_repository,
      profile_repository,
      entity_repository,
    );
    const result = await entityCustomerGetAllService.execute({
      entity_id: '123',
      is_superuser: true,
    });
    expect(result.length).toBe(2);
  });
});
