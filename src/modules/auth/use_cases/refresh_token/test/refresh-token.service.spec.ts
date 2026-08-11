import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { AppError } from '@modules/utils/app_error';
import { InMemoryRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/test/in-memory-refresh-tokens-repository';
import { RefreshTokenService } from '../service/refresh-token.service';
import { makeRefreshTokens } from '@modules/auth/refresh_token/shared/models/test/refresh-tokens-factory';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';

describe('Test in route Refresh Token', () => {
  let identity_repository: InMemoryIdentityRepository;
  let refresh_token_repository: InMemoryRefreshTokensRepository;
  let profile_repository: InMemoryProfileRepository;
  const jwt_service = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
    verifyAsync: jest.fn().mockResolvedValue({
      sub: 'entity-id',
      context_id: 'academia',
      type: 'mfa',
    }),
  };
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    identity_repository = new InMemoryIdentityRepository();
    refresh_token_repository = new InMemoryRefreshTokensRepository();
    profile_repository = new InMemoryProfileRepository();
  });

  it('should not send access token, because propriety type is not refresh', async () => {
    refresh_token_repository.list_refresh_tokens.push(makeRefreshTokens());
    const refresh_token_service = new RefreshTokenService(
      jwt_service as any,
      identity_repository,
      profile_repository,
    );
    expect(
      refresh_token_service.execute(
        '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHR2YWx1ZQ$7sH1QxYk6dJ6z9K8Yf5rW1qK9VwV8bTz1CkGm3nQp9I',
      ),
    ).rejects.toThrow(new AppError('Token inválido'));
  });

  it('should not send access token, because identity not exists', async () => {
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'entity-id',
        context_id: 'academia',
        type: 'refresh',
      }),
    };
    refresh_token_repository.list_refresh_tokens.push(makeRefreshTokens());
    const refresh_token_service = new RefreshTokenService(
      jwt_service as any,
      identity_repository,
      profile_repository,
    );
    expect(
      refresh_token_service.execute(
        '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHR2YWx1ZQ$7sH1QxYk6dJ6z9K8Yf5rW1qK9VwV8bTz1CkGm3nQp9I',
      ),
    ).rejects.toThrow(new AppError('Credenciais inválidas'));
  });

  it('should not access token, because profile not exists', async () => {
    identity_repository.list_identity.push(
      makeIdentity({
        id: '1234',
        props: {
          context_id: 'academia',
          entity_id: 'entity-id',
        },
      }),
    );
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'entity-id',
        context_id: 'academia',
        type: 'refresh',
      }),
    };
    refresh_token_repository.list_refresh_tokens.push(makeRefreshTokens());

    const refresh_token_service = new RefreshTokenService(
      jwt_service as any,
      identity_repository,
      profile_repository,
    );
    expect(
      refresh_token_service.execute(
        '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHR2YWx1ZQ$7sH1QxYk6dJ6z9K8Yf5rW1qK9VwV8bTz1CkGm3nQp9I',
      ),
    ).rejects.toThrow(
      new AppError('Perfil não encontrado para este tenant', 404),
    );
  });

  it('should send access token', async () => {
    identity_repository.list_identity.push(
      makeIdentity({
        id: '1234',
        props: {
          context_id: 'academia',
          entity_id: 'entity-id',
        },
      }),
    );
    profile_repository.list_profile.push(
      makeProfile({
        props: {
          entity_id: 'entity-id',
        },
      }),
    );
    const jwt_service = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'entity-id',
        context_id: 'academia',
        type: 'refresh',
      }),
    };
    refresh_token_repository.list_refresh_tokens.push(makeRefreshTokens());

    const refresh_token_service = new RefreshTokenService(
      jwt_service as any,
      identity_repository,
      profile_repository,
    );
    const result = await refresh_token_service.execute(
      '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHR2YWx1ZQ$7sH1QxYk6dJ6z9K8Yf5rW1qK9VwV8bTz1CkGm3nQp9I',
    );
    expect(result.access_token).toBeTruthy();
    expect(refresh_token_repository.list_refresh_tokens).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });
});
