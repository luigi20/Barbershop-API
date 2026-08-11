import { AppError } from '@modules/utils/app_error';
import { GenerateMFAService } from '../services/generate-mfa-service';
import { IMFACodeRepository } from '@modules/auth/mfa/shared/repositories/abstract_class/imfa-code-repository';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryMFACodeRepository } from '@modules/auth/mfa/shared/repositories/test/in-memory-mfa-code-repository';

describe('Test in route generate mfa', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let mfa_code_repository: IMFACodeRepository;
  const email_service = {
    send: jest.fn().mockReturnValue('fake-jwt-token'),
  };
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    mfa_code_repository = new InMemoryMFACodeRepository();
  });

  it('should not generate MFA, because entity not exists', async () => {
    const generateMFAService = new GenerateMFAService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      email_service,
    );
    expect(
      generateMFAService.execute({
        context_id: 'academia',
        email: 'luisfoco@gmail.com',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas', 400));
  });

  it('should not generate MFA, because identity not exists', async () => {
    entity_repository.list_entity.push(makeEntity());
    const generateMFAService = new GenerateMFAService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      email_service,
    );
    expect(
      generateMFAService.execute({
        context_id: 'academia',
        email: 'luisfoco@gmail.com',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas', 400));
  });

  it('should generate MFA', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    const generateMFAService = new GenerateMFAService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      email_service,
    );
    const result = await generateMFAService.execute({
      context_id: 'academia',
      email: 'luisfoco@gmail.com',
    });
    expect(result).toBe('Email enviado com Sucesso');
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });
 });
