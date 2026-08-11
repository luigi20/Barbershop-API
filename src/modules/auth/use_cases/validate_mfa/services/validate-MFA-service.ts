import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IMFACodeRepository } from '@modules/auth/mfa/shared/repositories/abstract_class/imfa-code-repository';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { Refresh_Tokens } from '@modules/auth/refresh_token/shared/models/refresh-tokens';
import { IRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/abstract_class/irefresh-tokens-repository';
import { AppError } from '@modules/utils/app_error';
import { Generate_Hash } from '@modules/utils/functions';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface IRequest {
  entity_id: string;
  context_id: string;
  code: string;
  mfa_token: string;
}

@Injectable()
export class ValidateMFAService {
  constructor(
    private readonly entity_repository: IEntityRepository,
    private readonly mfa_code_repository: IMFACodeRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly jwt_service: JwtService,
    private readonly refresh_token_repository: IRefreshTokensRepository,
    private readonly profile_repository: IProfileRepository,
  ) {}

  async execute({ entity_id, context_id, code, mfa_token }: IRequest): Promise<{
    access_token: string;
    mfa_required: boolean;
    refresh_token: string;
  }> {
    const entity_exists = await this.entity_repository.findById(entity_id);
    if (!entity_exists) throw new AppError('Credenciais inválidas');
    const identity_exists =
      await this.identity_repository.findByEntityIdAndContextId(
        entity_id,
        context_id,
      );
    if (!identity_exists) throw new AppError('Credenciais inválidas');
    const payload = await this.jwt_service.verify(mfa_token);
    if (!payload.mfa_pending) throw new AppError('MFA inválido');
    const mfa = await this.mfa_code_repository.find_one(
      entity_id,
      false,
      new Date(Date.now()),
      context_id,
    );
    if (!mfa) throw new AppError('MFA inválido ou já usado', 404);
    if (mfa.code !== code) throw new AppError('Código do MFA inválido');
    const profile = await this.profile_repository.find_one(
      entity_exists._id,
      context_id,
    );
    if (!profile)
      throw new AppError('Perfil não encontrado para este tenant', 404);
    mfa.used = true;
    await this.mfa_code_repository.update_used(mfa.id);
    const access_token = this.jwt_service.sign(
      {
        sub: payload.sub,
        context_id: payload.context_id,
        role: payload.role,
        tenant_id: profile.tenant_id,
        type: 'access',
        iss: 'saas-auth',
      },
      {
        expiresIn: '1d',
        algorithm: 'RS256',
        keyid: 'v1',
      },
    );
    const refresh_token = this.jwt_service.sign(
      {
        sub: entity_exists._id,
        context_id: context_id,
        tenant_id: profile.tenant_id,
        type: 'refresh',
        iss: 'saas-auth',
      },
      {
        algorithm: 'RS256',
        expiresIn: '7d',
        keyid: 'v1',
      },
    );
    const token_hash = await Generate_Hash(refresh_token);
    const refresh_tokens = new Refresh_Tokens({
      context_id: identity_exists.context_id,
      entity_id: entity_exists._id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
      token_hash: token_hash,
    });
    await this.refresh_token_repository.create(refresh_tokens);
    return {
      access_token: access_token,
      mfa_required: identity_exists.mfa_required,
      refresh_token: refresh_token,
    };
  }
}
