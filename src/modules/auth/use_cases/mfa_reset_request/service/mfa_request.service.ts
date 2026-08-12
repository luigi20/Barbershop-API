import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';
import { IMFACodeRepository } from '@modules/auth/mfa/shared/repositories/abstract_class/imfa-code-repository';
import { MFA_Code } from '@modules/auth/mfa/shared/models/mfa_code';
import { generateCode } from '@modules/utils/functions';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';

interface IMFARequest {
  email: string;
}

@Injectable()
export class MFARequestService {
  constructor(
    private readonly mfa_code_repository: IMFACodeRepository,
    private readonly identity_repository: IIdentityRepository,
  ) {}

  public async execute({ email }: IMFARequest): Promise<string> {
    const identity_exists = await this.identity_repository.find_by_email(email);
    if (!identity_exists) throw new AppError('Credenciais inválidas');
    const generate_code = generateCode();
    const mfa_code = new MFA_Code({
      code: generate_code,
      used_at: false,
      attempts: 0,
      identity_id: identity_exists.id,
      type: 'login',
    });
    await this.mfa_code_repository.create(mfa_code);
    /*this.email_service.send(
      [email],
      'Codigo para ativar/desativar MFA',
      'Olá, usuário Everest. Seu código é ' + generate_code,
      process.env.FROM_EMAIL,
    );*/
    return 'Email foi enviado';
  }
}
