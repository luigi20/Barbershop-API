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

describe('Test in route auth social login', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let refresh_token_repository: InMemoryRefreshTokensRepository;
  let profile_repository: InMemoryProfileRepository;
  const jwt_service = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
  };
  const identity_provider_service = {
    validate: jest.fn().mockReturnValue({
      id: randomUUID(),
      email: 'luis@focosp.com',
      name: 'Luis',
      last_name: 'Antonio',
      avatar: 'ddvmfjF',
    }),
  };
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    refresh_token_repository = new InMemoryRefreshTokensRepository();
    profile_repository = new InMemoryProfileRepository();
  });

  it('should auth social login with creation user', async () => {
    const auth_social_login_service = new AuthSocialLoginService(
      entity_repository,
      identity_repository,
      refresh_token_repository,
      jwt_service as any,
      identity_provider_service as any,
      profile_repository,
    );
    const result = await auth_social_login_service.execute({
      context_id: 'academia',
      provider: 'google',
      token: crypto.randomBytes(32).toString('hex'),
    });
    expect(result.mfa_required).toBe(false);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(identity_repository.list_identity[0].role).toBe('user');
    expect(entity_repository.list_entity[0].email).toBe('luis@focosp.com');
  });

  it('should auth social login without MFA', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        props: {
          email: 'luis@focosp.com',
        },
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          mfa_required: false,
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const auth_social_login_service = new AuthSocialLoginService(
      entity_repository,
      identity_repository,
      refresh_token_repository,
      jwt_service as any,
      identity_provider_service as any,
      profile_repository,
    );
    const result = await auth_social_login_service.execute({
      context_id: 'academia',
      provider: 'google',
      token: crypto.randomBytes(32).toString('hex'),
    });
    expect(result.mfa_required).toBe(false);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(identity_repository.list_identity[0].mfa_required).toBe(false);
    expect(entity_repository.list_entity[0].email).toBe('luis@focosp.com');
  });

  it('should auth social login with MFA', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        props: {
          email: 'luis@focosp.com',
        },
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          mfa_required: true,
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const auth_social_login_service = new AuthSocialLoginService(
      entity_repository,
      identity_repository,
      refresh_token_repository,
      jwt_service as any,
      identity_provider_service as any,
      profile_repository,
    );
    const result = await auth_social_login_service.execute({
      context_id: 'academia',
      provider: 'google',
      token: crypto.randomBytes(32).toString('hex'),
    });
    expect(result.mfa_required).toBe(true);
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
    expect(identity_repository.list_identity[0].mfa_required).toBe(true);
    expect(entity_repository.list_entity[0].email).toBe('luis@focosp.com');
  });
});
