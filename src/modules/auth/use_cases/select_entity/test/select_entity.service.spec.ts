import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { AppError } from '@modules/utils/app_error';
import { InMemoryRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/test/in-memory-refresh-tokens-repository';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { InMemoryEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/test/in-memory-entitycustomer-repository';
import * as argon2 from 'argon2';
import { makeEntityMembershipCustomer } from '@modules/auth/entity_customer/shared/models/test/entity-customer-factory';
import { SelectEntityService } from '../service/select_entity.service';
import { InMemoryEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { makeEntityMembership } from '@modules/business/entity_membership/shared/models/test/entity-membership-factory';

jest.mock('argon2');
describe('Test in route select entity', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let refresh_token_repository: InMemoryRefreshTokensRepository;
  let entity_membership_repository: InMemoryEntityMembershipRepository;
  let entity_membercustomer_repository: InMemoryEntityCustomerRepository;
  let profile_repository: InMemoryProfileRepository;
  const jwt_service = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
  };
  beforeEach(() => {
    jest.clearAllMocks();
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    refresh_token_repository = new InMemoryRefreshTokensRepository();
    profile_repository = new InMemoryProfileRepository();
    entity_membership_repository = new InMemoryEntityMembershipRepository();
    entity_membercustomer_repository = new InMemoryEntityCustomerRepository();
  });

  it('should not signin, because token invalid or expired', async () => {
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockImplementation(() => {
        throw new AppError('Token inválido ou expirado', 401);
      }),
    };
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    expect(
      selectEntityService.execute({
        entity_id: '123',
        login_token: '14343',
      }),
    ).rejects.toThrow(new AppError('Token de login inválido ou expirado', 401));
  });

  it('should not signin, because token invalid', async () => {
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: 'entity-id',
        context_id: 'academia',
        type: 'mfa',
      }),
    };
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    expect(
      selectEntityService.execute({
        entity_id: '123',
        login_token: '14343',
      }),
    ).rejects.toThrow(new AppError('Token de login inválido', 401));
  });

  it('should not signin, because identity not exists', async () => {
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: 'entity-id',
        context_id: 'academia',
        type: 'challenge',
      }),
    };
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    expect(
      selectEntityService.execute({
        entity_id: '123',
        login_token: '14343',
      }),
    ).rejects.toThrow(new AppError('Identidade não encontrada', 404));
  });

  it('should not signin, because profile not exists', async () => {
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfocosp@.com',
        },
      }),
    );
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: '123',
        context_id: 'academia',
        type: 'challenge',
      }),
    };
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    expect(
      selectEntityService.execute({
        entity_id: '123',
        login_token: '14343',
      }),
    ).rejects.toThrow(new AppError('Perfil inválido', 401));
  });

  it('should not signin, because user not tenant', async () => {
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfocosp@.com',
        },
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
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: '123',
        context_id: 'academia',
        type: 'challenge',
        profile_id: '123',
      }),
    };
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    expect(
      selectEntityService.execute({
        entity_id: '123',
        login_token: '14343',
      }),
    ).rejects.toThrow(
      new AppError('Usuário não pertence a esta organização', 403),
    );
  });

  it('should signin, because is client and mfa not required', async () => {
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: '123',
        context_id: 'academia',
        type: 'challenge',
        profile_id: '123',
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfocosp@.com',
          mfa_required: false,
        },
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
    entity_membercustomer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
          name: 'Profit',
        },
      }),
    );
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    const result = await selectEntityService.execute({
      entity_id: '123',
      login_token: '14343',
    });
    expect(result.mfa_required).toBe(false);
    expect(result.access_token).toBeTruthy();
    expect(entity_membercustomer_repository.list_customer).toHaveLength(1);
  });

  it('should signin, because is client and mfa required', async () => {
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: '123',
        context_id: 'academia',
        type: 'challenge',
        profile_id: '123',
        mfa_pending: true,
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfocosp@.com',
          mfa_required: true,
        },
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
    entity_membercustomer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
          name: 'Profit',
        },
      }),
    );
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    const result = await selectEntityService.execute({
      entity_id: '123',
      login_token: '14343',
    });
    expect(result.mfa_required).toBe(true);
    expect(result.access_token).not.toBeTruthy();
    expect(entity_membercustomer_repository.list_customer).toHaveLength(1);
  });

  it('should signin, because is membership and mfa not required', async () => {
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: '123',
        context_id: 'academia',
        type: 'challenge',
        profile_id: '123',
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfocosp@.com',
          mfa_required: false,
        },
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
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    const result = await selectEntityService.execute({
      entity_id: '123',
      login_token: '14343',
    });
    expect(result.mfa_required).toBe(false);
    expect(result.access_token).toBeTruthy();
    expect(entity_membership_repository.list_membership).toHaveLength(1);
  });

  it('should signin, because is membership and mfa required', async () => {
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: '123',
        context_id: 'academia',
        type: 'challenge',
        profile_id: '123',
        mfa_pending: true,
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfocosp@.com',
          mfa_required: true,
        },
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
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    const result = await selectEntityService.execute({
      entity_id: '123',
      login_token: '14343',
    });
    expect(result.mfa_required).toBe(true);
    expect(result.access_token).not.toBeTruthy();
    expect(entity_membership_repository.list_membership).toHaveLength(1);
  });

  it('should signin, because is membership and client and mfa required', async () => {
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: '123',
        context_id: 'academia',
        type: 'challenge',
        profile_id: '123',
        mfa_pending: true,
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfocosp@.com',
          mfa_required: true,
        },
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
    entity_membercustomer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
          name: 'Profit',
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    const result = await selectEntityService.execute({
      entity_id: '123',
      login_token: '14343',
    });
    expect(result.mfa_required).toBe(true);
    expect(result.access_token).not.toBeTruthy();
    expect(entity_membership_repository.list_membership).toHaveLength(1);
  });

  it('should signin, because is membership and client and mfa not required', async () => {
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verify: jest.fn().mockReturnValue({
        sub: '123',
        context_id: 'academia',
        type: 'challenge',
        profile_id: '123',
        mfa_pending: false,
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfocosp@.com',
          mfa_required: false,
        },
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
    entity_membercustomer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
          name: 'Profit',
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );
    const selectEntityService = new SelectEntityService(
      identity_repository,
      profile_repository,
      entity_membership_repository,
      entity_membercustomer_repository,
      refresh_token_repository,
      jwt_service as any,
    );
    const result = await selectEntityService.execute({
      entity_id: '123',
      login_token: '14343',
    });
    expect(result.mfa_required).toBe(false);
    expect(result.access_token).toBeTruthy();
    expect(entity_membership_repository.list_membership).toHaveLength(1);
    expect(entity_membercustomer_repository.list_customer).toHaveLength(1);
  });
});
