import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import argon2 from 'argon2';
import { Password_Reset_Tokens } from '@modules/auth/password_reset_tokens/shared/models/password-reset-tokens';
import { IPasswordResetTokensRepository } from '@modules/auth/password_reset_tokens/shared/repositories/abstract_class/ipassword-reset-tokens-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { IEmailService } from '@modules/email/service/abstract_class/iemail-service';

interface IPasswordResetRequest {
  email: string;
}

@Injectable()
export class PasswordResetRequestService {
  constructor(
    private readonly entity_repository: IEntityRepository,
    private readonly password_reset_tokens_repository: IPasswordResetTokensRepository,
    private readonly email_service: IEmailService,
  ) {}

  public async execute({ email }: IPasswordResetRequest): Promise<string> {
    const entity = await this.entity_repository.findByEmail(
      email.toLowerCase().trim(),
    );
    if (!entity) throw new AppError('Usuário não existe', 404);
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await argon2.hash(token);
    const password_reset_tokens = new Password_Reset_Tokens({
      entity_id: entity._id,
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
      used: false,
      token_hash: tokenHash,
    });
    await this.password_reset_tokens_repository.create(password_reset_tokens);
    this.email_service.send(
      [email],
      'Token para resetar senha',
      'Olá, usuário Everest. Seu token é ' + token,
      process.env.FROM_EMAIL,
    );
    return 'Email foi enviado';
  }
}
