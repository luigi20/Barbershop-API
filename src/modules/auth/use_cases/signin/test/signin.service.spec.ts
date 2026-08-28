import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { AppError } from '@modules/utils/app_error';
import { SignInService } from '../service/signin.service';
import { InMemoryRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/test/in-memory-refresh-tokens-repository';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import * as argon2 from 'argon2';
import { InMemoryEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { InMemoryEntityCustomerRepository } from '@modules/business/entity_customer/shared/repositories/test/in-memory-entitycustomer-repository';
import { makeEntityMembership } from '@modules/business/entity_membership/shared/models/test/entity-membership-factory';
import { makeEntityMembershipCustomer } from '@modules/business/entity_customer/shared/models/test/entity-customer-factory';
import { InMemoryIdentityCredentialRepository } from '@modules/auth/identity_credential/shared/repositories/test/in-memory-identity-credential-repository';
import { makeIdentityCredential } from '@modules/auth/identity_credential/shared/models/test/identity_credential-factory';
import { InMemoryCustomerRepository } from '@modules/business/customer/shared/repositories/test/in-memory-customer-repository';
import { makeCustomer } from '@modules/business/customer/shared/models/test/customer-factory';

jest.mock('argon2');
describe('Test in route signin', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let refresh_token_repository: InMemoryRefreshTokensRepository;
  let entity_membership_repository: InMemoryEntityMembershipRepository;
  let entity_membercustomer_repository: InMemoryEntityCustomerRepository;
  let profile_repository: InMemoryProfileRepository;
  let identity_credential_repository: InMemoryIdentityCredentialRepository;
  let customer_repository: InMemoryCustomerRepository;
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
    identity_credential_repository = new InMemoryIdentityCredentialRepository();
    customer_repository = new InMemoryCustomerRepository();
  });

  it('should not signin, because identity not exists', async () => {
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
      identity_credential_repository,
      customer_repository,
    );
    expect(
      signInService.execute({
        email: 'luisfoco@gmail.com',
        password: '1',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas'));
  });

  it('should not signin, because credential not exists', async () => {
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
      identity_credential_repository,
      customer_repository,
    );
    expect(
      signInService.execute({
        email: 'luisfoco@gmail.com',
        password: '123gghghhy6y6',
      }),
    ).rejects.toThrow(new AppError('Credencial não existe', 404));
  });

  it('should not signin, because password is invalid', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: 'academia',
      }),
    );
    identity_credential_repository.list_identity_credential.push(
      makeIdentityCredential({
        id: '123',
        props: {
          identity_id: '123',
        },
      }),
    );
    (argon2.verify as jest.Mock).mockResolvedValue(false);
    identity_repository.list_identity.push(
      makeIdentity({
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
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
      identity_credential_repository,
      customer_repository,
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
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
          status: 'inativo',
        },
      }),
    );
    identity_credential_repository.list_identity_credential.push(
      makeIdentityCredential({
        id: '123',
        props: {
          identity_id: '123',
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
      identity_credential_repository,
      customer_repository,
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
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
        },
      }),
    );
    identity_credential_repository.list_identity_credential.push(
      makeIdentityCredential({
        id: '123',
        props: {
          identity_id: '123',
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
      identity_credential_repository,
      customer_repository,
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
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
        },
      }),
    );
    identity_credential_repository.list_identity_credential.push(
      makeIdentityCredential({
        id: '123',
        props: {
          identity_id: '123',
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
      identity_credential_repository,
      customer_repository,
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
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
        },
      }),
    );
    identity_credential_repository.list_identity_credential.push(
      makeIdentityCredential({
        id: '123',
        props: {
          identity_id: '123',
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
    customer_repository.list_customer.push(
      makeCustomer({
        props: {
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );

    entity_membercustomer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          customer_id: customer_repository.list_customer[0]._id,
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
      identity_credential_repository,
      customer_repository,
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
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
        },
      }),
    );
    identity_credential_repository.list_identity_credential.push(
      makeIdentityCredential({
        id: '123',
        props: {
          identity_id: '123',
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
      identity_credential_repository,
      customer_repository,
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
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
        },
      }),
    );
    identity_credential_repository.list_identity_credential.push(
      makeIdentityCredential({
        id: '123',
        props: {
          identity_id: '123',
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
    customer_repository.list_customer.push(
      makeCustomer({
        props: {
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );

    entity_membercustomer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          customer_id: customer_repository.list_customer[0]._id,
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
      identity_credential_repository,
      customer_repository,
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
        id: '123',
        props: {
          email: 'luisfoco@gmail.com',
        },
      }),
    );
    identity_credential_repository.list_identity_credential.push(
      makeIdentityCredential({
        id: '123',
        props: {
          identity_id: '123',
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

    customer_repository.list_customer.push(
      makeCustomer({
        props: {
          profile_id: profile_repository.list_profile[0].id,
        },
      }),
    );
    entity_membercustomer_repository.list_customer.push(
      makeEntityMembershipCustomer({
        id: '123',
        props: {
          entity_id: entity_repository.list_entity[1]._id,
          customer_id: customer_repository.list_customer[0]._id,
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
      identity_credential_repository,
      customer_repository,
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
