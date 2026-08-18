import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { AppError } from '@modules/utils/app_error';
import { SignInService } from '../service/signin.service';
import { InMemoryRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/test/in-memory-refresh-tokens-repository';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { InMemoryEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { InMemoryEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/test/in-memory-entitycustomer-repository';
import * as argon2 from 'argon2';
import { makeEntityMembership } from '@modules/auth/entity_membership/shared/models/test/entity-membership-factory';
import { makeEntityMembershipCustomer } from '@modules/auth/entity_customer/shared/models/test/entity-customer-factory';

jest.mock('argon2');
describe('Test in route signin', () => {
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

  it('should not signin, because identity not exists', async () => {
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    expect(
      signInService.execute({
        email: 'luisfoco@gmail.com',
        password: '1',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas'));
  });
  it('should not signin, because password is invalid', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: 'academia',
      }),
    );
    (argon2.verify as jest.Mock).mockResolvedValue(false);
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          password_hash: '154trghtht',
          status: 'ativo',
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    expect(
      signInService.execute({
        email: 'luisfoco@gmail.com',
        password: '123gghghhy6y6',
      }),
    ).rejects.toThrow(new AppError('Senha inválida'));
  });

  it('should not signin, because status is not active', async () => {
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    entity_repository.list_entity.push(
      makeEntity({
        id: 'academia',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          password_hash: '123LLv!!@32mjnvhfh',
          status: 'inativo',
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    expect(
      signInService.execute({
        email: 'luisfoco@gmail.com',
        password: '123LLv!!@32mjnvhfh',
      }),
    ).rejects.toThrow(new AppError('Usuário bloqueado', 404));
  });

  it('should not signin, because profile not exists', async () => {
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    entity_repository.list_entity.push(
      makeEntity({
        id: 'academia',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          password_hash: '123LLv!!@32mjnvhfh',
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    expect(
      signInService.execute({
        email: 'luisfoco@gmail.com',
        password: '123LLv!!@32mjnvhfh',
      }),
    ).rejects.toThrow(new AppError('Perfil não encontrado', 404));
  });

  it('should not signin, because user not exists in organization', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: 'academia',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          password_hash: await argon2.hash('123LLv!!@32mjnvhfh'),
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
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    expect(
      signInService.execute({
        email: 'luisfoco@gmail.com',
        password: '123LLv!!@32mjnvhfh',
      }),
    ).rejects.toThrow(
      new AppError('Usuário não pertence a nenhuma organização', 403),
    );
  });

  it('should signin, because is client', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: 'academia',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          password_hash: await argon2.hash('123LLv!!@32mjnvhfh'),
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
    entity_membercustomer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
          name: 'Profit',
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    const result = await signInService.execute({
      email: 'luisfoco@gmail.com',
      password: '123LLv!!@32mjnvhfh',
    });
    expect(result.requires_entity_selection).toBe(false);
    expect(result.login_token).not.toBe(null);
    expect(identity_repository.list_identity).toHaveLength(1);
  });

  it('should signin, because is membership', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: 'academia',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          password_hash: await argon2.hash('123LLv!!@32mjnvhfh'),
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
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
          entity_name: 'Profit',
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    const result = await signInService.execute({
      email: 'luisfoco@gmail.com',
      password: '123LLv!!@32mjnvhfh',
    });
    expect(result.requires_entity_selection).toBe(false);
    expect(result.login_token).not.toBe(null);
    expect(entity_membership_repository.list_membership).toHaveLength(1);
  });

  it('should signin, because is membership and client in same organization', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: 'academia',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          password_hash: await argon2.hash('123LLv!!@32mjnvhfh'),
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
          entity_name: 'Profit',
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    const result = await signInService.execute({
      email: 'luisfoco@gmail.com',
      password: '123LLv!!@32mjnvhfh',
    });
    expect(result.requires_entity_selection).toBe(false);
    expect(result.login_token).not.toBe(null);
    expect(entity_membership_repository.list_membership).toHaveLength(1);
  });

  it('should signin, because is membership and client in different organizations', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: 'academia',
      }),
    );
    entity_repository.list_entity.push(
      makeEntity({
        id: 'farmacia',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
          password_hash: await argon2.hash('123LLv!!@32mjnvhfh'),
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
    entity_membercustomer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        props: {
          entity_id: entity_repository.list_entity[1]._id,
          profile_id: profile_repository.list_profile[0].id,
          name: 'Pague Menos',
        },
      }),
    );
    entity_membership_repository.list_membership.push(
      makeEntityMembership({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          profile_id: profile_repository.list_profile[0].id,
          entity_name: 'Profit',
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    const result = await signInService.execute({
      email: 'luisfoco@gmail.com',
      password: '123LLv!!@32mjnvhfh',
    });
    expect(result.requires_entity_selection).toBe(true);
    expect(result.login_token).not.toBe(null);
    expect(entity_membership_repository.list_membership).toHaveLength(1);
  });
});
