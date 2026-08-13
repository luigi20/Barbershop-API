import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { InMemoryRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/test/in-memory-refresh-tokens-repository';
import { randomUUID } from 'crypto';
import { AuthSocialLoginService } from '../services/auth_social_login.service';
import crypto from 'crypto';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { AppError } from '@modules/utils/app_error';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { InMemoryEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { InMemoryEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/test/in-memory-entitycustomer-repository';
import { makeEntityMembership } from '@modules/auth/entity_membership/shared/models/test/entity-membership-factory';
import { makeEntityMembershipCustomer } from '@modules/auth/entity_customer/shared/models/test/entity-customer-factory';

describe('Test in route auth social login', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let refresh_token_repository: InMemoryRefreshTokensRepository;
  let profile_repository: InMemoryProfileRepository;
  let entity_membership_repository: InMemoryEntityMembershipRepository;
  let entity_customer_repository: InMemoryEntityCustomerRepository;
  const jwt_service = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
  };

  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    refresh_token_repository = new InMemoryRefreshTokensRepository();
    profile_repository = new InMemoryProfileRepository();
    entity_membership_repository = new InMemoryEntityMembershipRepository();
    entity_customer_repository = new InMemoryEntityCustomerRepository();
  });

  it('should not auth social login, because email is invalid', async () => {
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: null,
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    expect(
      auth_social_login_service.execute({
        provider: 'google',
        token: crypto.randomBytes(32).toString('hex'),
      }),
    ).rejects.toThrow(
      new AppError('Não foi possível obter o e-mail da conta social', 401),
    );
  });

  it('should not auth social login with user valid, because identity not active', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
          status: 'inativo',
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
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    expect(
      auth_social_login_service.execute({
        provider: 'google',
        token: crypto.randomBytes(32).toString('hex'),
      }),
    ).rejects.toThrow(new AppError('Usuário inativo', 403));
  });

  it('should not auth social login with user valid, because perfil not exists', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
        },
      }),
    );
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    expect(
      auth_social_login_service.execute({
        provider: 'google',
        token: crypto.randomBytes(32).toString('hex'),
      }),
    ).rejects.toThrow(new AppError('Perfil não encontrado', 404));
  });

  it('should not auth social login without user valid, because user not tenant', async () => {
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    expect(
      auth_social_login_service.execute({
        provider: 'google',
        token: crypto.randomBytes(32).toString('hex'),
      }),
    ).rejects.toThrow(
      new AppError('Usuário não possui nenhuma organização vinculada', 403),
    );
  });

  it('should not auth social login with user valid, because user not tenant', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
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
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    expect(
      auth_social_login_service.execute({
        provider: 'google',
        token: crypto.randomBytes(32).toString('hex'),
      }),
    ).rejects.toThrow(
      new AppError('Usuário não possui nenhuma organização vinculada', 403),
    );
  });

  it('should auth social login without MFA, because is membership', async () => {
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
        props: {
          email: 'luis@focosp.com',
          status: 'ativo',
        },
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          mfa_required: false,
          status: 'ativo',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          identity_id: identity_repository.list_identity[0].id,
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        id: '123',
        props: {
          profile_id: profile_repository.list_profile[0].id,
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    const result = await auth_social_login_service.execute({
      provider: 'google',
      token: crypto.randomBytes(32).toString('hex'),
    });
    expect(result.mfa_required).toBe(false);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(entity_membership_repository.list_membership).toHaveLength(1);
    expect(identity_repository.list_identity[0].mfa_required).toBe(false);
    expect(entity_repository.list_entity[0].email).toBe('luis@focosp.com');
    expect(result.entities[0].roles.length).toBe(1);
  });

  it('should auth social login without MFA, because is customer', async () => {
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
        props: {
          email: 'luis@focosp.com',
          status: 'ativo',
        },
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          mfa_required: false,
          status: 'ativo',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          identity_id: identity_repository.list_identity[0].id,
        },
      }),
    );
    entity_customer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        id: '123',
        props: {
          profile_id: profile_repository.list_profile[0].id,
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    const result = await auth_social_login_service.execute({
      provider: 'google',
      token: crypto.randomBytes(32).toString('hex'),
    });
    expect(result.mfa_required).toBe(false);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(identity_repository.list_identity[0].mfa_required).toBe(false);
    expect(entity_repository.list_entity[0].email).toBe('luis@focosp.com');
    expect(entity_customer_repository.list_customer).toHaveLength(1);
    expect(result.entities[0].roles.length).toBe(1);
  });

  it('should auth social login without MFA, because is customer and membership', async () => {
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
        props: {
          email: 'luis@focosp.com',
          status: 'ativo',
        },
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          mfa_required: false,
          status: 'ativo',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          identity_id: identity_repository.list_identity[0].id,
        },
      }),
    );
    entity_customer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        id: '123',
        props: {
          profile_id: profile_repository.list_profile[0].id,
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        id: '123',
        props: {
          profile_id: profile_repository.list_profile[0].id,
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    const result = await auth_social_login_service.execute({
      provider: 'google',
      token: crypto.randomBytes(32).toString('hex'),
    });
    expect(result.mfa_required).toBe(false);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(identity_repository.list_identity[0].mfa_required).toBe(false);
    expect(entity_repository.list_entity[0].email).toBe('luis@focosp.com');
    expect(entity_customer_repository.list_customer).toHaveLength(1);
    expect(result.entities[0].roles.length).toBe(2);
  });

  it('should auth social login with MFA, because is membership', async () => {
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
        props: {
          email: 'luis@focosp.com',
          status: 'ativo',
        },
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          mfa_required: true,
          status: 'ativo',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          identity_id: identity_repository.list_identity[0].id,
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        id: '123',
        props: {
          profile_id: profile_repository.list_profile[0].id,
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    const result = await auth_social_login_service.execute({
      provider: 'google',
      token: crypto.randomBytes(32).toString('hex'),
    });
    expect(result.mfa_required).toBe(true);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(entity_membership_repository.list_membership).toHaveLength(1);
    expect(identity_repository.list_identity[0].mfa_required).toBe(true);
    expect(entity_repository.list_entity[0].email).toBe('luis@focosp.com');
    expect(result.entities[0].roles.length).toBe(1);
  });

  it('should auth social login with MFA, because is customer', async () => {
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
        props: {
          email: 'luis@focosp.com',
          status: 'ativo',
        },
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          mfa_required: true,
          status: 'ativo',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          identity_id: identity_repository.list_identity[0].id,
        },
      }),
    );
    entity_customer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        id: '123',
        props: {
          profile_id: profile_repository.list_profile[0].id,
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    const result = await auth_social_login_service.execute({
      provider: 'google',
      token: crypto.randomBytes(32).toString('hex'),
    });
    expect(result.mfa_required).toBe(true);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(identity_repository.list_identity[0].mfa_required).toBe(true);
    expect(entity_repository.list_entity[0].email).toBe('luis@focosp.com');
    expect(entity_customer_repository.list_customer).toHaveLength(1);
    expect(result.entities[0].roles.length).toBe(1);
  });

  it('should auth social login with MFA, because is customer and membership', async () => {
    const identity_provider_service = {
      validate: jest.fn().mockReturnValue({
        id: randomUUID(),
        email: 'luisfoco@gmail.com',
        name: 'Luis',
        last_name: 'Antonio',
        avatar: 'ddvmfjF',
        type: 'google',
      }),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '123',
        props: {
          email: 'luis@focosp.com',
          status: 'ativo',
        },
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          mfa_required: true,
          status: 'ativo',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          identity_id: identity_repository.list_identity[0].id,
        },
      }),
    );
    entity_customer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        id: '123',
        props: {
          profile_id: profile_repository.list_profile[0].id,
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        id: '123',
        props: {
          profile_id: profile_repository.list_profile[0].id,
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const auth_social_login_service = new AuthSocialLoginService(
      identity_repository,
      profile_repository,
      entity_repository,
      entity_membership_repository,
      entity_customer_repository,
      jwt_service as any,
      identity_provider_service as any,
    );
    const result = await auth_social_login_service.execute({
      provider: 'google',
      token: crypto.randomBytes(32).toString('hex'),
    });
    expect(result.mfa_required).toBe(true);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(identity_repository.list_identity[0].mfa_required).toBe(true);
    expect(entity_repository.list_entity[0].email).toBe('luis@focosp.com');
    expect(entity_customer_repository.list_customer).toHaveLength(1);
    expect(result.entities[0].roles.length).toBe(2);
  });
});
