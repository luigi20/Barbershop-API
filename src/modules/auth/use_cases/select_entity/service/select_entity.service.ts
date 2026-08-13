import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppError } from '@modules/utils/app_error';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { IEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';

import { generateHash } from '@modules/utils/functions';
import { IRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/abstract_class/irefresh-tokens-repository';
import { Refresh_Tokens } from '@modules/auth/refresh_token/shared/models/refresh-tokens';

export interface ISelectEntityRequest {
  login_token: string;
  entity_id: string;
}

interface ILoginTokenPayload {
  sub: string;
  profile_id: string;
  entity_id: string;
  code: string;
  type: string;
  mfa_pending: boolean;
  iss: string;
}

interface ISelectEntityResponse {
  mfa_required: boolean;
  mfa_token?: string;
  access_token?: string;
  refresh_token?: string;
}

@Injectable()
export class SelectEntityService {
  constructor(
    private readonly identity_repository: IIdentityRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly entity_customer_repository: IEntityCustomerRepository,
    private readonly refresh_token_repository: IRefreshTokensRepository,
    private readonly jwt_service: JwtService,
  ) {}

  async execute({
    login_token,
    entity_id,
  }: ISelectEntityRequest): Promise<ISelectEntityResponse> {
    let payload: ILoginTokenPayload;
    try {
      payload = this.jwt_service.verify<ILoginTokenPayload>(login_token);
    } catch {
      throw new AppError('Token de login inválido ou expirado', 401);
    }
    if (payload.type !== 'challenge')
      throw new AppError('Token de login inválido', 401);
    const identity = await this.identity_repository.find_by_id(payload.sub);
    if (!identity) throw new AppError('Identidade não encontrada', 404);
    const profile = await this.profile_repository.find_identity_id(identity.id);
    if (!profile || profile.id !== payload.profile_id)
      throw new AppError('Perfil inválido', 401);
    const membership = await this.entity_membership_repository.find_one(
      entity_id,
      profile.id,
    );
    const customer = await this.entity_customer_repository.find_one(
      entity_id,
      profile.id,
    );
    const isMember = membership && membership.status.toLowerCase() === 'ativo';
    const isCustomer = customer && customer.status.toLowerCase() === 'ativo';
    if (!isMember && !isCustomer)
      throw new AppError('Usuário não pertence a esta organização', 403);
    const roles = [
      ...(isMember ? membership.roles : []),
      ...(isCustomer ? ['cliente'] : []),
    ];
    const uniqueRoles = [...new Set(roles)];
    if (payload.mfa_pending) {
      const mfa_token = this.jwt_service.sign(
        {
          sub: identity.id,
          profile_id: profile.id,
          entity_id,
          roles: uniqueRoles,
          type: 'mfa',
          mfa_pending: true,
          iss: 'saas-auth',
        },
        {
          expiresIn: '10m',
        },
      );
      return {
        mfa_required: true,
        mfa_token,
      };
    }
    const access_token = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        entity_id,
        name: profile.name,
        photo: profile.photo,
        roles: uniqueRoles,
        type: 'access',
        iss: 'saas-auth',
      },
      {
        expiresIn: '15m',
      },
    );
    const refresh_token = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        entity_id,
        type: 'refresh',
        iss: 'saas-auth',
      },
      {
        expiresIn: '7d',
      },
    );
    const token_hash = generateHash(refresh_token);
    const refreshToken = new Refresh_Tokens({
      identity_id: identity.id,
      token_hash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked_at: false,
    });
    await this.refresh_token_repository.create(refreshToken);
    await this.identity_repository.update_last_login_at(
      identity.id,
      new Date(),
    );
    return {
      mfa_required: false,
      access_token,
      refresh_token,
    };
  }
}
