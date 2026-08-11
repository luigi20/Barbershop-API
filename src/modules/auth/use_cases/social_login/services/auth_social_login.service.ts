import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IdentityProviderService } from './identity_provider.service';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { Entity } from '@modules/auth/entity/shared/models/entity';
import { Identity } from '@modules/auth/identity/shared/models/identity';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import {
  Generate_Hash,
  generateValidRandomPassword,
} from '@modules/utils/functions';
import argon2 from 'argon2';
import { IRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/abstract_class/irefresh-tokens-repository';
import { Refresh_Tokens } from '@modules/auth/refresh_token/shared/models/refresh-tokens';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { AppError } from '@modules/utils/app_error';
import { Profile } from '@modules/auth/profile/shared/models/profile';

interface IRequest_Login_Social {
  context_id: string;
  provider: string;
  token: string;
}

@Injectable()
export class AuthSocialLoginService {
  constructor(
    private readonly entity_repository: IEntityRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly refresh_token_repository: IRefreshTokensRepository,
    private readonly jwt_service: JwtService,
    private readonly identity_provider_service: IdentityProviderService,
    private readonly profile_repository: IProfileRepository,
  ) {}

  async execute({
    context_id,
    provider,
    token,
  }: IRequest_Login_Social): Promise<{
    access_token: string;
    mfa_required: boolean;
    refresh_token: string;
  }> {
    const profile_provider = await this.identity_provider_service.validate(
      provider,
      token,
    );
    let create_identity: Identity = null;
    let create_entity = await this.entity_repository.findByEmail(
      profile_provider.email,
    );
    if (!create_entity) {
      create_entity = new Entity({
        email: profile_provider.email,
      });
      const password = await generateValidRandomPassword();
      const password_hash = await argon2.hash(password);
      await this.entity_repository.create(create_entity);
      create_identity = new Identity({
        context_id: context_id,
        entity_id: create_entity._id,
        is_active: true,
        mfa_required: false,
        password: password_hash,
        role: 'user',
      });
      await this.identity_repository.create(create_identity);
    }
    if (!create_identity)
      create_identity =
        await this.identity_repository.findByEntityIdAndContextId(
          create_entity._id,
          context_id,
        );
    const profile = new Profile({
      context_id: context_id,
      entity_id: create_entity._id,
      name: profile_provider?.name + ' ' + profile_provider?.last_name,
      tenant_id: 'default',
    });
    await this.profile_repository.create(profile);
    if (!create_identity.mfa_required) {
      const access_token = this.jwt_service.sign(
        {
          sub: create_entity._id,
          context_id: context_id,
          role: create_identity.role,
          tenant_id: profile.tenant_id,
          type: 'access',
          iss: 'saas-auth',
        },
        {
          algorithm: 'RS256',
          //expiresIn: '15m',
          expiresIn: '1d',
          keyid: 'v1',
        },
      );
      const refresh_token = this.jwt_service.sign(
        {
          sub: create_entity._id,
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
        context_id: create_identity.context_id,
        entity_id: create_entity._id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
        token_hash: token_hash,
      });
      await this.refresh_token_repository.create(refresh_tokens);
      return {
        access_token: access_token,
        mfa_required: false,
        refresh_token: refresh_token,
      };
    }
    const access_token = this.jwt_service.sign(
      {
        sub: create_entity._id,
        context_id: context_id,
        tenant_id: profile.tenant_id,
        mfa_pending: true,
        iss: 'saas-auth',
      },
      {
        expiresIn: '10m',
      },
    );
    return {
      access_token: access_token,
      mfa_required: true,
      refresh_token: '',
    };
  }
}
