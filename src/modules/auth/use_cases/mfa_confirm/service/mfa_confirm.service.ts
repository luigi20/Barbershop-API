import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IMFACodeRepository } from '@modules/auth/mfa/shared/repositories/abstract_class/imfa-code-repository';

interface IMFAConfirmRequest {
  email: string;
  mfa_code: string;
}

@Injectable()
export class MFAConfirmService {
  constructor(
    private readonly identity_repository: IIdentityRepository,
    private readonly mfa_code_repository: IMFACodeRepository,
  ) {}

  public async execute({
    email,
    mfa_code,
  }: IMFAConfirmRequest): Promise<string> {
    const identity = await this.identity_repository.find_by_email(
      email.toLowerCase().trim(),
    );
    if (!identity) throw new AppError('Credenciais inválidas');
    const mfa = await this.mfa_code_repository.find_one(
      identity.id,
      false,
      new Date(),
    );
    if (!mfa) throw new AppError('MFA inválido ou já usado', 404);
    if (mfa.code !== mfa_code) throw new AppError('Código do MFA inválido');
    mfa.used_at = true;
    await this.mfa_code_repository.update_used(mfa.id);
    return 'MFA atualizado com sucesso';
  }
}
