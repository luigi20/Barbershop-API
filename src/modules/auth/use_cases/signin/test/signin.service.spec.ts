import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { AppError } from '@modules/utils/app_error';
import { SignInService } from '../service/signin.service';
import argon2 from 'argon2';
import { InMemoryRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/test/in-memory-refresh-tokens-repository';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import { InMemoryEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/test/in-memory-entitymembership-repository';
import { InMemoryEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/test/in-memory-entitycustomer-repository';

describe('Test in route signup', () => {
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
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    refresh_token_repository = new InMemoryRefreshTokensRepository();
    profile_repository = new InMemoryProfileRepository();
  });

  it('should not signin, because entity not exists', async () => {
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      refresh_token_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    expect(
      signInService.execute({
        entity_id: 'academia',
        email: 'luisfoco@gmail.com',
        password: '1',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas'));
  });

  it('should not signin, because identity not exists', async () => {
    entity_repository.list_entity.push(makeEntity());
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      refresh_token_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    expect(
      signInService.execute({
        entity_id: 'academia',
        email: 'luisfoco@gmail.com',
        password: '1',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas'));
  });

  it('should not signin, because password is invalid', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: identity_repository.list_identity[0].email,
          password_hash: identity_repository.list_identity[0].password_hash,
        },
      }),
    );
    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      refresh_token_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    expect(
      signInService.execute({
        entity_id: 'academia',
        email: 'luisfoco@gmail.com',
        password: '123gghghhy6y6',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas'));
  });

  it('should not signin, because profile not exists', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: identity_repository.list_identity[0].email,
          password_hash: await argon2.hash('123LLv!!@32mjnvhfh'),
        },
      }),
    );

    const signInService = new SignInService(
      entity_membercustomer_repository,
      identity_repository,
      refresh_token_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    expect(
      signInService.execute({
        entity_id: 'academia',
        email: 'luisfoco@gmail.com',
        password: '123LLv!!@32mjnvhfh',
      }),
    ).rejects.toThrow(
      new AppError('Perfil não encontrado para este tenant', 404),
    );
  });

  it('should signin without mfa required', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: identity_repository.list_identity[0].email,
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
      refresh_token_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    const result = await signInService.execute({
      entity_id: 'academia',
      email: 'luisfoco@gmail.com',
      password: '123LLv!!@32mjnvhfh',
    });
    expect(result.mfa_required).toBe(false);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });

  it('should signin with mfa required', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          password_hash: await argon2.hash('123LLv!!@32mjnvhfh'),
          mfa_required: true,
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
      refresh_token_repository,
      profile_repository,
      entity_membership_repository,
      jwt_service as any,
    );
    const result = await signInService.execute({
      entity_id: 'academia',
      email: 'luisfoco@gmail.com',
      password: '123LLv!!@32mjnvhfh',
    });
    expect(result.mfa_required).toBe(true);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });
});
