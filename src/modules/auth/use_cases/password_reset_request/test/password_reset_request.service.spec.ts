import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { InMemoryPasswordResetTokensRepository } from '@modules/auth/password_reset_tokens/shared/repositories/test/in-memory-password-reset-tokens-repository';
import { AppError } from '@modules/utils/app_error';
import { PasswordResetRequestService } from '../service/password_reset_request.service';

describe('Test in route password reset request', () => {
  let entity_repository: InMemoryEntityRepository;
  let password_reset_tokens_repository: InMemoryPasswordResetTokensRepository;
  const email_service = {
    send: jest.fn().mockReturnValue('fake-jwt-token'),
  };
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    password_reset_tokens_repository =
      new InMemoryPasswordResetTokensRepository();
  });

  it('should not passsword reset request, because entity not exists', async () => {
    const password_reset_tokens_service = new PasswordResetRequestService(
      entity_repository,
      password_reset_tokens_repository,
      email_service,
    );
    expect(
      password_reset_tokens_service.execute({
        email: 'luisfoco@gmail.com',
      }),
    ).rejects.toThrow(new AppError('Usuário não existe', 404));
  });

  it('should reset request', async () => {
    entity_repository.list_entity.push(makeEntity());
    const password_reset_tokens_service = new PasswordResetRequestService(
      entity_repository,
      password_reset_tokens_repository,
      email_service,
    );
    const result = await password_reset_tokens_service.execute({
      email: 'luisfoco@gmail.com',
    });
    expect(result).toBe('Email foi enviado');
    expect(entity_repository.list_entity).toHaveLength(1);
  });
});
