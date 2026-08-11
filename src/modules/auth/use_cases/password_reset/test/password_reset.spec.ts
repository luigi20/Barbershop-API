import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { AppError } from '@modules/utils/app_error';
import { InMemoryPasswordResetTokensRepository } from '@modules/auth/password_reset_tokens/shared/repositories/test/in-memory-password-reset-tokens-repository';
import { PasswordResetService } from '../service/password_reset.service';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makePasswordResetTokens } from '@modules/auth/password_reset_tokens/shared/models/test/password-reset-tokens-factory';
import * as argon2 from 'argon2';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';

jest.mock('argon2');
describe('Test in route password reset', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let password_reset_tokens_repository: InMemoryPasswordResetTokensRepository;

  jest.mock('argon2');

  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    password_reset_tokens_repository =
      new InMemoryPasswordResetTokensRepository();
  });

  it('should not password reset, because password is invalid', async () => {
    const password_reset_tokens_service = new PasswordResetService(
      entity_repository,
      identity_repository,
      password_reset_tokens_repository,
    );
    expect(
      password_reset_tokens_service.execute({
        email: 'luisfoco@gmail.com',
        token: '123',
        new_password: '1234',
        context_id: 'academia',
      }),
    ).rejects.toThrow(new AppError('Senha inválida', 400));
  });

  it('should not password reset, because entity not exists', async () => {
    const password_reset_tokens_service = new PasswordResetService(
      entity_repository,
      identity_repository,
      password_reset_tokens_repository,
    );
    expect(
      password_reset_tokens_service.execute({
        email: 'luisfoco@gmail.com',
        token: '123',
        new_password: 'ccbdKCDCDUD"!!&1234',
        context_id: 'academia',
      }),
    ).rejects.toThrow(new AppError('Token inválido ou expirado', 400));
  });

  it('should not password reset, because token not exists', async () => {
    entity_repository.list_entity.push(makeEntity());
    const password_reset_tokens_service = new PasswordResetService(
      entity_repository,
      identity_repository,
      password_reset_tokens_repository,
    );
    expect(
      password_reset_tokens_service.execute({
        email: 'luisfoco@gmail.com',
        token: '123',
        new_password: 'ccbdKCDCDUD"!!&1234',
        context_id: 'academia',
      }),
    ).rejects.toThrow(new AppError('Token inválido ou expirado', 400));
  });

  it('should not password reset, because token is invalid', async () => {
    entity_repository.list_entity.push(makeEntity());
    password_reset_tokens_repository.list_password_reset_tokens.push(
      makePasswordResetTokens({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          used: false,
        },
      }),
    );
    (argon2.verify as jest.Mock).mockResolvedValue(false);
    const password_reset_tokens_service = new PasswordResetService(
      entity_repository,
      identity_repository,
      password_reset_tokens_repository,
    );
    expect(
      password_reset_tokens_service.execute({
        email: 'luisfoco@gmail.com',
        token: '123',
        new_password: 'ccbdKCDCDUD"!!&1234',
        context_id: 'academia',
      }),
    ).rejects.toThrow(new AppError('Token inválido ou expirado', 400));
  });

  it('should password reset', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    password_reset_tokens_repository.list_password_reset_tokens.push(
      makePasswordResetTokens({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          used: false,
        },
      }),
    );
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    const password_reset_tokens_service = new PasswordResetService(
      entity_repository,
      identity_repository,
      password_reset_tokens_repository,
    );
    const result = await password_reset_tokens_service.execute({
      email: 'luisfoco@gmail.com',
      token: '123',
      new_password: 'ccbdKCDCDUD"!!&1234',
      context_id: 'academia',
    });
    expect(result).toBe('Senha atualizada com sucesso');
    expect(entity_repository.list_entity).toHaveLength(1);
  });

  it('should not password reset, because identity not exists', async () => {
    entity_repository.list_entity.push(makeEntity());
    password_reset_tokens_repository.list_password_reset_tokens.push(
      makePasswordResetTokens({
        props: {
          used: false,
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    const password_reset_tokens_service = new PasswordResetService(
      entity_repository,
      identity_repository,
      password_reset_tokens_repository,
    );
    expect(
      password_reset_tokens_service.execute({
        email: 'luisfoco@gmail.com',
        token: '123',
        new_password: 'ccbdKCDCDUD"!!&1234',
        context_id: 'academia',
      }),
    ).rejects.toThrow(new AppError('Token inválido ou expirado', 400));
  });
});
