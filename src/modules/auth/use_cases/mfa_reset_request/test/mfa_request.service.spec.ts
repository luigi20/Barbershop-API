import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { AppError } from '@modules/utils/app_error';
import { MFARequestService } from '../service/mfa_request.service';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { InMemoryMFACodeRepository } from '@modules/auth/mfa/shared/repositories/test/in-memory-mfa-code-repository';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';

describe('Test in route mfa request', () => {
  let entity_repository: InMemoryEntityRepository;
  let mfa_code_repository: InMemoryMFACodeRepository;
  let identity_repository: InMemoryIdentityRepository;
  const email_service = {
    send: jest.fn().mockReturnValue('fake-jwt-token'),
  };
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    mfa_code_repository = new InMemoryMFACodeRepository();
    identity_repository = new InMemoryIdentityRepository();
  });

  it('should not mfa request, because entity not exists', async () => {
    const mfa_request_service = new MFARequestService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      email_service,
    );
    expect(
      mfa_request_service.execute({
        email: 'luisfoco@gmail.com',
        context_id: 'academia',
      }),
    ).rejects.toThrow(new AppError('Usuário não existe', 404));
  });

  it('should not mfa request, because identity not exists', async () => {
    entity_repository.list_entity.push(makeEntity());
    const mfa_request_service = new MFARequestService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      email_service,
    );
    expect(
      mfa_request_service.execute({
        email: 'luisfoco@gmail.com',
        context_id: 'academia',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas', 404));
  });

  it('should mfa request', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const mfa_request_service = new MFARequestService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      email_service,
    );
    const result = await mfa_request_service.execute({
      email: 'luisfoco@gmail.com',
      context_id: 'academia',
    });
    expect(result).toBe('Email foi enviado');
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });
});
