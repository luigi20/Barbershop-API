import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { AppError } from '@modules/utils/app_error';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { MFAConfirmService } from '../service/mfa_confirm.service';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { InMemoryMFACodeRepository } from '@modules/auth/mfa/shared/repositories/test/in-memory-mfa-code-repository';
import { makeMFACode } from '@modules/auth/mfa/shared/models/test/mfa-code-factory';

describe('Test in route MFA confirm', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let mfa_code_repository: InMemoryMFACodeRepository;

  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    mfa_code_repository = new InMemoryMFACodeRepository();
  });

  it('should not mfa confirm, because entity not exists', async () => {
    const mfaConfirmService = new MFAConfirmService(
      entity_repository,
      identity_repository,
      mfa_code_repository,
    );
    expect(
      mfaConfirmService.execute({
        email: 'luisfoco@gmail.com',
        mfa_code: '123',
        mfa_required: 'enabled',
        context_id: 'academia',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas', 400));
  });

  it('should not mfa confirm, because identity not exists', async () => {
    entity_repository.list_entity.push(makeEntity());
    const mfa_confirm_service = new MFAConfirmService(
      entity_repository,
      identity_repository,
      mfa_code_repository,
    );
    expect(
      mfa_confirm_service.execute({
        email: 'luisfoco@gmail.com',
        mfa_code: '123',
        mfa_required: 'enabled',
        context_id: 'academia',
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas', 400));
  });

  it('should not mfa confirm, because MFA is used', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    mfa_code_repository.list_MFA_Code.push(
      makeMFACode({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          used: true,
        },
      }),
    );
    const mfaConfirmService = new MFAConfirmService(
      entity_repository,
      identity_repository,
      mfa_code_repository,
    );
    expect(
      mfaConfirmService.execute({
        email: 'luisfoco@gmail.com',
        mfa_code: '123',
        mfa_required: 'enabled',
        context_id: 'academia',
      }),
    ).rejects.toThrow(new AppError('MFA inválido ou já usado', 404));
  });

    it('should not mfa confirm, because MFA is invalid', async () => {
      entity_repository.list_entity.push(makeEntity());
      identity_repository.list_identity.push(
        makeIdentity({
          props: {
            entity_id: entity_repository.list_entity[0]._id,
          },
        }),
      );
      mfa_code_repository.list_MFA_Code.push(
        makeMFACode({
          props: {
            entity_id: entity_repository.list_entity[0]._id,
            used: false,
          },
        }),
      );
      const mfaConfirmService = new MFAConfirmService(
        entity_repository,
        identity_repository,
        mfa_code_repository,
      );
      expect(
        mfaConfirmService.execute({
          email: 'luisfoco@gmail.com',
          mfa_code: '123',
          mfa_required: 'enabled',
          context_id: 'academia',
        }),
      ).rejects.toThrow(new AppError('Código do MFA inválido'));
    });
  
  it('should mfa confirm', async () => {
    entity_repository.list_entity.push(makeEntity());
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
        },
      }),
    );
    mfa_code_repository.list_MFA_Code.push(
      makeMFACode({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          used: false,
        },
      }),
    );
    const mfaConfirmService = new MFAConfirmService(
      entity_repository,
      identity_repository,
      mfa_code_repository,
    );
    const result = await mfaConfirmService.execute({
      email: 'luisfoco@gmail.com',
      mfa_code: '4234tuv',
      mfa_required: 'enabled',
      context_id: 'academia',
    });
    expect(result).toBe('MFA atualizado com sucesso');
    expect(entity_repository.list_entity).toHaveLength(1);
  });
});
