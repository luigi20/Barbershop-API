import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { IEmailService } from '@modules/email/service/abstract_class/iemail-service';
import { IMFACodeRepository } from '@modules/auth/mfa/shared/repositories/abstract_class/imfa-code-repository';
import { MFA_Code } from '@modules/auth/mfa/shared/models/mfa_code';
import { Generate_Code } from '@modules/utils/functions';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';

interface IMFARequest {
  email: string;
  context_id: string;
}

@Injectable()
export class MFARequestService {
  constructor(
    private readonly entity_repository: IEntityRepository,
    private readonly mfa_code_repository: IMFACodeRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly email_service: IEmailService,
  ) {}

  public async execute({ email, context_id }: IMFARequest): Promise<string> {
    const entity = await this.entity_repository.findByEmail(
      email.toLowerCase().trim(),
    );
    if (!entity) throw new AppError('Usuário não existe', 404);
    const identity_exists =
      await this.identity_repository.findByEntityIdAndContextId(
        entity._id,
        context_id,
      );
    if (!identity_exists) throw new AppError('Credenciais inválidas');
    const generate_code = await Generate_Code();
    const password_reset_tokens = new MFA_Code({
      entity_id: entity._id,
      code: generate_code,
      used: false,
      context_id: identity_exists.context_id,
    });
    await this.mfa_code_repository.create(password_reset_tokens);
    this.email_service.send(
      [email],
      'Codigo para ativar/desativar MFA',
      'Olá, usuário Everest. Seu código é ' + generate_code,
      process.env.FROM_EMAIL,
    );
    return 'Email foi enviado';
  }
}
