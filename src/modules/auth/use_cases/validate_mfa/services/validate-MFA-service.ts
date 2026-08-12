import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { IEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';
import { IEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IMFACodeRepository } from '@modules/auth/mfa/shared/repositories/abstract_class/imfa-code-repository';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { Refresh_Tokens } from '@modules/auth/refresh_token/shared/models/refresh-tokens';
import { IRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/abstract_class/irefresh-tokens-repository';
import { AppError } from '@modules/utils/app_error';
import { generateHash } from '@modules/utils/functions';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface IRequest {
  code: string;
  mfa_token: string;
}

interface IMFATokenPayload {
  sub: string;
  profile_id: string;
  type: string;
  mfa_pending: boolean;
  iss: string;
}

@Injectable()
export class ValidateMFAService {
  constructor(
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly entity_customer_repository: IEntityCustomerRepository,
    private readonly mfa_code_repository: IMFACodeRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly jwt_service: JwtService,
    private readonly refresh_token_repository: IRefreshTokensRepository,
    private readonly profile_repository: IProfileRepository,
  ) {}

  async execute({ code, mfa_token }: IRequest): Promise<{
    access_token: string;
    mfa_required: boolean;
    refresh_token: string;
  }> {
    // 1. Valida o MFA token
    let payload: IMFATokenPayload;
    try {
      payload = this.jwt_service.verify<IMFATokenPayload>(mfa_token);
    } catch {
      throw new AppError('MFA inválido ou expirado', 401);
    }
    if (payload.type !== 'mfa' || payload.mfa_pending !== true)
      throw new AppError('MFA inválido ou expirado', 401);
    // 2. Busca o código MFA da Identity
    const mfa = await this.mfa_code_repository.find_one_code_and_expires_at(
      payload.sub,
      false,
      new Date(),
    );
    if (!mfa) throw new AppError('MFA inválido ou expirado', 401);
    // 3. Valida o código
    if (mfa.code !== code) {
      mfa.attempts += 1;
      await this.mfa_code_repository.update(mfa);
      throw new AppError('Código do MFA inválido', 401);
    }
    // 4. Busca Identity
    const identity = await this.identity_repository.find_by_id(payload.sub);
    if (!identity) throw new AppError('Identidade não encontrada', 404);
    // 5. Busca Profile
    const profile = await this.profile_repository.find_identity_id(identity.id);
    if (!profile) throw new AppError('Perfil não encontrado', 404);
    // 6. Valida novamente o vínculo com o tenant
    const membership = await this.entity_membership_repository.find_one(
      payload.entity_id,
      profile.id,
    );
    const customer = await this.entity_customer_repository.find_one(
      payload.entity_id,
      profile.id,
    );
    const isMember = membership && membership.status.toLowerCase() === 'ativo';
    const isCustomer = customer && customer.status.toLowerCase() === 'ativo';
    if (!isMember && !isCustomer)
      throw new AppError('Usuário não pertence a esta organização', 403);
    // 7. Marca o código MFA como usado
    await this.mfa_code_repository.update_used(mfa.id);
    // 8. Monta os roles
    const roles: string[] = [];
    if (isMember) roles.push(membership.role);
    if (isCustomer) roles.push('cliente');
    // 9. Gera Access Token
    const access_token = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        entity_id: payload.entity_id,
        name: profile.name,
        photo: profile.photo,
        roles,
        type: 'access',
        iss: 'saas-auth',
      },
      {
        expiresIn: '1d',
      },
    );
    // 10. Gera Refresh Token
    const refresh_token = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        entity_id: payload.entity_id,
        type: 'refresh',
        iss: 'saas-auth',
      },
      {
        expiresIn: '7d',
      },
    );
    // 11. Armazena hash do Refresh Token
    const token_hash = generateHash(refresh_token);
    const refreshToken = new Refresh_Tokens({
      identity_id: identity.id,
      token_hash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked_at: false,
    });
    await this.refresh_token_repository.create(refreshToken);
    // 12. Atualiza último login
    await this.identity_repository.update_last_login_at(
      identity.id,
      new Date(),
    );
    return {
      access_token,
      mfa_required: false,
      refresh_token,
    };
  }
  /*
  async execute({ code, mfa_token, entity_id }: IRequest): Promise<{
    access_token: string;
    mfa_required: boolean;
    refresh_token: string;
  }> {
    const mfa = await this.mfa_code_repository.find_one_code_and_expires_at(
      mfa_token,
      false,
      new Date(),
    );
    if (!mfa) throw new AppError('MFA inválido ou expirado', 401);
    if (mfa.code !== code) {
      mfa.attempts = mfa.attempts + 1;
      await this.mfa_code_repository.update(mfa);
      throw new AppError('Código do MFA inválido', 401);
    }
    const identity = await this.identity_repository.find_by_id(mfa.identity_id);
    if (!identity) throw new AppError('Identidade não encontrada', 404);
    const profile = await this.profile_repository.find_identity_id(identity.id);
    if (!profile) throw new AppError('Perfil não encontrado', 404);
    const membership = await this.entity_membership_repository.find_one(
      entity_id,
      identity.id,
    );
    const membership_customer = await this.entity_customer_repository.find_one(
      entity_id,
      identity.id,
    );
    const isMember = membership && membership.status.toLowerCase() === 'ativo';
    const isCustomer =
      membership_customer &&
      membership_customer.status.toLowerCase() === 'ativo';
    if (!isMember && !isCustomer)
      throw new AppError('Usuário não pertence a esta organização');
    await this.mfa_code_repository.update_used(mfa.id);
    const access_token = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        entity_id: membership.entity_id,
        name: profile.name,
        photo: profile.photo,
        role: isMember ? membership.role : 'cliente',
        type: 'access',
        iss: 'saas-auth',
      },
      {
        expiresIn: '1d',
      },
    );
    const refresh_token = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        entity_id: membership.entity_id,
        type: 'refresh',
        iss: 'saas-auth',
      },
      {
        expiresIn: '7d',
      },
    );
    return {
      access_token,
      mfa_required: true,
      refresh_token,
    };
  }*/
}
