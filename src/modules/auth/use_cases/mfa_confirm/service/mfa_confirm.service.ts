import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { IMFACodeRepository } from '@modules/auth/mfa/shared/repositories/abstract_class/imfa-code-repository';

interface IMFAConfirmRequest {
  email: string;
  mfa_code: string;
  mfa_required: 'enabled' | 'disabled';
  context_id: string;
}

@Injectable()
export class MFAConfirmService {
  constructor(
    private readonly entity_repository: IEntityRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly mfa_code_repository: IMFACodeRepository,
  ) {}

  public async execute({
    email,
    mfa_code,
    mfa_required,
    context_id,
  }: IMFAConfirmRequest): Promise<string> {
    const entity_exists = await this.entity_repository.findByEmail(
      email.toLowerCase().trim(),
    );
    if (!entity_exists) throw new AppError('Credenciais inválidas');
    const identity_exists =
      await this.identity_repository.findByEntityIdAndContextId(
        entity_exists._id,
        context_id,
      );
    if (!identity_exists) throw new AppError('Credenciais inválidas');
    const mfa = await this.mfa_code_repository.find_one(
      entity_exists._id,
      false,
      new Date(Date.now()),
      context_id,
    );
    if (!mfa) throw new AppError('MFA inválido ou já usado', 404);
    if (mfa.code !== mfa_code) throw new AppError('Código do MFA inválido');
    mfa.used = true;
    await this.mfa_code_repository.update_used(mfa.id);
    identity_exists.mfa_required = mfa_required === 'enabled' ? true : false;
    await this.identity_repository.update_mfa(
      identity_exists.id,
      identity_exists.mfa_required,
    );
    return 'MFA atualizado com sucesso';
  }
}
