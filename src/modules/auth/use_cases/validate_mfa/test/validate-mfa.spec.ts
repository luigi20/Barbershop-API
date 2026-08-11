import { AppError } from '@modules/utils/app_error';
import { InMemoryEntityRepository } from '@modules/auth/entity/shared/repositories/test/in-memory-entity-repository';
import { InMemoryIdentityRepository } from '@modules/auth/identity/shared/repositories/test/in-memory-identity-repository';
import { makeEntity } from '@modules/auth/entity/shared/models/test/entity-factory';
import { makeIdentity } from '@modules/auth/identity/shared/models/test/identity-factory';
import { InMemoryMFACodeRepository } from '@modules/auth/mfa/shared/repositories/test/in-memory-mfa-code-repository';
import { ValidateMFAService } from '../services/validate-MFA-service';
import { makeMFACode } from '@modules/auth/mfa/shared/models/test/mfa-code-factory';
import { InMemoryRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/test/in-memory-refresh-tokens-repository';
import { InMemoryProfileRepository } from '@modules/auth/profile/shared/repositories/test/in-memory-profile-repository';
import { makeProfile } from '@modules/auth/profile/shared/models/test/profile-factory';
import * as argon2 from 'argon2';

jest.mock('argon2');
describe('Test in route validate mfa', () => {
  let entity_repository: InMemoryEntityRepository;
  let identity_repository: InMemoryIdentityRepository;
  let mfa_code_repository: InMemoryMFACodeRepository;
  let refresh_token_repository: InMemoryRefreshTokensRepository;
  let profile_repository: InMemoryProfileRepository;

  const jwt_service = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
    verify: jest.fn().mockResolvedValue({
      sub: 'entity-id',
      context_id: 'academia',
      type: 'mfa',
    }),
  };
  beforeEach(() => {
    // Populando os repositórios com dados iniciais
    entity_repository = new InMemoryEntityRepository();
    identity_repository = new InMemoryIdentityRepository();
    mfa_code_repository = new InMemoryMFACodeRepository();
    refresh_token_repository = new InMemoryRefreshTokensRepository();
    profile_repository = new InMemoryProfileRepository();
  });

  it('should not validate MFA, because entity not exists', async () => {
    (argon2.verify as jest.Mock).mockResolvedValue(false);
    const validateMFAService = new ValidateMFAService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      jwt_service as any,
      refresh_token_repository,
      profile_repository,
    );
    expect(
      validateMFAService.execute({
        context_id: 'academia',
        code: '13LvRY',
        entity_id: '12',
        mfa_token: null,
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas', 400));
  });

  it('should not validate MFA, because identity not exists', async () => {
    entity_repository.list_entity.push(
      makeEntity({
        id: '12',
      }),
    );
    const validateMFAService = new ValidateMFAService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      jwt_service as any,
      refresh_token_repository,
      profile_repository,
    );
    expect(
      validateMFAService.execute({
        context_id: 'academia',
        code: '12lfv',
        entity_id: '12',
        mfa_token: null,
      }),
    ).rejects.toThrow(new AppError('Credenciais inválidas', 400));
  });

  it('should not validate MFA, because MFA not validate', async () => {
    const jwt_service = {
      verify: jest.fn().mockResolvedValue({
        sub: 'entity-id',
        context_id: 'academia',
        type: 'mfa',
      }),
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '12',
      }),
    );
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
          context_id: 'academia',
          used: false,
          expires_at: new Date(),
        },
      }),
    );
    const validateMFAService = new ValidateMFAService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      jwt_service as any,
      refresh_token_repository,
      profile_repository,
    );
    expect(
      validateMFAService.execute({
        context_id: 'academia',
        code: '22232',
        entity_id: '12',
        mfa_token: null,
      }),
    ).rejects.toThrow(new AppError('MFA inválido', 400));
  });

  it('should not validate MFA, because MFA not validate', async () => {
    const jwt_service = {
      verify: jest.fn().mockResolvedValue({
        sub: 'entity-id',
        context_id: 'academia',
        type: 'mfa',
        mfa_pending: 'jfinjhfnv76',
      }),
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '12',
      }),
    );
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
          context_id: 'academia',
          used: false,
          expires_at: new Date(),
        },
      }),
    );
    const validateMFAService = new ValidateMFAService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      jwt_service as any,
      refresh_token_repository,
      profile_repository,
    );
    expect(
      validateMFAService.execute({
        context_id: 'academia',
        code: '22232',
        entity_id: '12',
        mfa_token: null,
      }),
    ).rejects.toThrow(new AppError('MFA inválido ou já usado', 400));
  });

  it('should not be validate MFA, because MFA and code informed are not equal', async () => {
    const jwt_service = {
      verify: jest.fn().mockResolvedValue({
        sub: 'entity-id',
        context_id: 'academia',
        type: 'mfa',
        mfa_pending: 'jfinjhfnv76',
      }),
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '12',
      }),
    );
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
          context_id: 'academia',
          used: false,
          code: 'hjhjyjyjy',
        },
      }),
    );
    const validateMFAService = new ValidateMFAService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      jwt_service as any,
      refresh_token_repository,
      profile_repository,
    );
    expect(
      validateMFAService.execute({
        context_id: 'academia',
        code: '4234tuv',
        entity_id: '12',
        mfa_token: 'mdkdnvdvhdvjh fv',
      }),
    ).rejects.toThrow(new AppError('Código do MFA inválido', 400));
  });

  it('should not validate MFA, because profile not exist', async () => {
    const jwt_service = {
      verify: jest.fn().mockResolvedValue({
        sub: 'entity-id',
        context_id: 'academia',
        type: 'mfa',
        mfa_pending: 'jfinjhfnv76',
      }),
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '12',
      }),
    );
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
          context_id: 'academia',
        },
      }),
    );
    const validateMFAService = new ValidateMFAService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      jwt_service as any,
      refresh_token_repository,
      profile_repository,
    );
    expect(
      validateMFAService.execute({
        context_id: 'academia',
        code: '4234tuv',
        entity_id: '12',
        mfa_token: 'mdkdnvdvhdvjh fv',
      }),
    ).rejects.toThrow(
      new AppError('Perfil não encontrado para este tenant', 404),
    );
  });

  it('should validate MFA', async () => {
    const jwt_service = {
      verify: jest.fn().mockResolvedValue({
        sub: 'entity-id',
        context_id: 'academia',
        type: 'mfa',
        mfa_pending: 'jfinjhfnv76',
      }),
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };
    entity_repository.list_entity.push(
      makeEntity({
        id: '12',
      }),
    );
    identity_repository.list_identity.push(
      makeIdentity({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
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
    mfa_code_repository.list_MFA_Code.push(
      makeMFACode({
        props: {
          entity_id: entity_repository.list_entity[0]._id,
          context_id: 'academia',
        },
      }),
    );
    const validateMFAService = new ValidateMFAService(
      entity_repository,
      mfa_code_repository,
      identity_repository,
      jwt_service as any,
      refresh_token_repository,
      profile_repository,
    );
    const result = await validateMFAService.execute({
      context_id: 'academia',
      code: '4234tuv',
      entity_id: '12',
      mfa_token: 'mdkdnvdvhdvjh fv',
    });
    expect(result.access_token).toBeTruthy();
    expect(result.mfa_required).toBe(false);
    expect(result.refresh_token).toBeTruthy();
    expect(entity_repository.list_entity).toHaveLength(1);
    expect(identity_repository.list_identity).toHaveLength(1);
  });
});
