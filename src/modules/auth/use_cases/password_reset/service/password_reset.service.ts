import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { IPasswordResetTokensRepository } from '@modules/auth/password_reset_tokens/shared/repositories/abstract_class/ipassword-reset-tokens-repository';
import { user_password_validator } from '@modules/utils/functions';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';

interface IPasswordReset {
  email: string;
  token: string;
  new_password: string;
  context_id: string;
}

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly entity_repository: IEntityRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly password_reset_tokens_repository: IPasswordResetTokensRepository,
  ) {}

  public async execute({
    email,
    token,
    new_password,
    context_id,
  }: IPasswordReset): Promise<string> {
    const password_validator = await user_password_validator();
    const errors = password_validator.validate(new_password, {
      list: true,
    });
    if (Array.isArray(errors) && errors.length > 0)
      throw new AppError('Senha inválida', 400);
    const entity_exists = await this.entity_repository.findByEmail(email);
    if (!entity_exists) throw new AppError('Token inválido ou expirado');
    const token_record = await this.password_reset_tokens_repository.find_one(
      entity_exists._id,
      false,
      new Date(),
    );
    if (!token_record) throw new AppError('Token inválido ou expirado');
    const token_valid = await argon2.verify(token_record.token_hash, token);
    if (!token_valid) throw new AppError('Token inválido ou expirado');
    const new_hash = await argon2.hash(new_password);
    const identity_exists =
      await this.identity_repository.findByEntityIdAndContextId(
        entity_exists._id,
        context_id,
      );
    if (!identity_exists) throw new AppError('Token inválido ou expirado');
    await this.identity_repository.update_password(
      identity_exists.id,
      new_hash,
    );
    await this.password_reset_tokens_repository.update_used(token_record.id);
    return 'Senha atualizada com sucesso';
  }
}
