import { IEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';
import { IEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { Refresh_Tokens } from '@modules/auth/refresh_token/shared/models/refresh-tokens';
import { IRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/abstract_class/irefresh-tokens-repository';
import { AppError } from '@modules/utils/app_error';
import { Generate_Hash } from '@modules/utils/functions';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';

interface ISignInRequest {
  email: string;
  entity_id: string;
  password: string;
}

@Injectable()
export class SignInService {
  constructor(
    private readonly entity_membercustomer_repository: IEntityCustomerRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly refresh_token_repository: IRefreshTokensRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly jwt_service: JwtService,
  ) {}

  public async execute({
    email,
    password,
    entity_id,
  }: ISignInRequest): Promise<{
    access_token: string;
    mfa_required: boolean;
    refresh_token: string;
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    // 1. Localiza a conta de autenticação
    const identity =
      await this.identity_repository.find_by_email(normalizedEmail);
    if (!identity) throw new AppError('Credenciais inválidas');
    // 2. Valida a senha
    const validPassword = await argon2.verify(identity.password_hash, password);
    if (!validPassword) throw new AppError('Senha inválida');
    // 3. Localiza o Profile associado à Identity
    const profile = await this.profile_repository.find_identity_id(identity.id);
    if (!profile) throw new AppError('Perfil não encontrado', 404);
    // 4. Verifica se o Profile pertence à Entity
    const membership = await this.entity_membership_repository.find_one(
      entity_id,
      profile.id,
    );
    const member_customer =
      await this.entity_membercustomer_repository.find_one(
        entity_id,
        profile.id,
      );
    const isMember = membership && membership.status.toLowerCase() === 'ativo';
    const isCustomer =
      member_customer && member_customer.status.toLowerCase() === 'ativo';

    if (!isMember && !isCustomer)
      throw new AppError('Usuário não pertence a esta organização');
    // 5. MFA
    if (identity.mfa_required) {
      const access_token = this.jwt_service.sign(
        {
          sub: identity.id,
          profile_id: profile.id,
          entity_id: entity_id,
          role: isMember ? membership.role : 'cliente',
          mfa_pending: true,
          type: 'mfa',
          iss: 'saas-auth',
        },
        {
          expiresIn: '10m',
        },
      );
      return {
        access_token,
        mfa_required: true,
        refresh_token: '',
      };
    }
    // 6. Gera Access Token
    const access_token = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        entity_id: entity_id,
        role: isMember ? membership.role : 'cliente',
        type: 'access',
        iss: 'saas-auth',
      },
      {
        expiresIn: '1d',
      },
    );

    // 7. Gera Refresh Token
    const refresh_token = this.jwt_service.sign(
      {
        sub: identity.id,
        type: 'refresh',
        iss: 'saas-auth',
      },
      {
        expiresIn: '7d',
      },
    );
    // 8. Armazena apenas o hash do refresh token
    const token_hash = await Generate_Hash(refresh_token);
    const refreshToken = new Refresh_Tokens({
      identity_id: identity.id,
      token_hash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked_at: false,
    });
    await this.refresh_token_repository.create(refreshToken);
    // 9. Atualiza último login
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
}
