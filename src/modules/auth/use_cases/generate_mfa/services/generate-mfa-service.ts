import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { MFA_Code } from '@modules/auth/mfa/shared/models/mfa_code';
import { IMFACodeRepository } from '@modules/auth/mfa/shared/repositories/abstract_class/imfa-code-repository';
import { AppError } from '@modules/utils/app_error';
import { Generate_Code } from '@modules/utils/functions';
import { Injectable } from '@nestjs/common';

interface IGenerateMFARequest {
  email: string;
  context_id: string;
}

@Injectable()
export class GenerateMFAService {
  constructor(
    private readonly entity_repository: IEntityRepository,
    private readonly mfa_code_repository: IMFACodeRepository,
    private readonly identity_repository: IIdentityRepository,
  ) {}

  async execute({ context_id, email }: IGenerateMFARequest): Promise<string> {
    const entity_exists = await this.entity_repository.findByEmail(email);
    if (!entity_exists) throw new AppError('Credenciais inválidas');
    const identity_exists =
      await this.identity_repository.findByEntityIdAndContextId(
        entity_exists._id,
        context_id,
      );
    if (!identity_exists) throw new AppError('Credenciais inválidas');
    const generate_code = await Generate_Code();
    const mfa = new MFA_Code({
      entity_id: entity_exists._id,
      code: generate_code,
      used: false,
      context_id: identity_exists.context_id,
    });
    await this.mfa_code_repository.create(mfa);
    // mandar email
    return 'Email enviado com Sucesso';
  }
}
