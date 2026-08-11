import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { InMemoryPasswordResetTokensRepository } from '@modules/auth/password_reset_tokens/shared/repositories/test/in-memory-password-reset-tokens-repository';
import { AppError } from '@modules/utils/app_error';
import { PasswordResetRequestService } from '../service/password_reset_request.service';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';

describe('Test in route password reset request', () => {
  let identity_repository: InMemoryIdentityRepository;
  let password_reset_tokens_repository: InMemoryPasswordResetTokensRepository;
  const email_service = {
    send: jest.fn().mockReturnValue('fake-jwt-token'),
  };
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    identity_repository = new InMemoryIdentityRepository();
    password_reset_tokens_repository =
      new InMemoryPasswordResetTokensRepository();
  });

  it('should not passsword reset request, because identity not exists', async () => {
    const password_reset_tokens_service = new PasswordResetRequestService(
      identity_repository,
      password_reset_tokens_repository,
    );
    expect(
      password_reset_tokens_service.execute({
        email: 'luisfoco@gmail.com',
      }),
    ).rejects.toThrow(new AppError('Usuário não existe', 404));
  });

  it('should reset request', async () => {
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          email: 'luisfoco@gmail.com',
        },
      }),
    );
    const password_reset_tokens_service = new PasswordResetRequestService(
      identity_repository,
      password_reset_tokens_repository,
    );
    const result = await password_reset_tokens_service.execute({
      email: 'luisfoco@gmail.com',
    });
    expect(result).toBe('Email foi enviado');
    expect(identity_repository.list_identity).toHaveLength(1);
  });
});
