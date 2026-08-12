import { IEntityCustomerRepository } from '@modules/auth/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';
import { IEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { AppError } from '@modules/utils/app_error';
import { entity_name } from '@modules/utils/types/types';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';

interface ISignInRequest {
  email: string;
  password: string;
}

@Injectable()
export class SignInService {
  constructor(
    private readonly entity_membercustomer_repository: IEntityCustomerRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly jwt_service: JwtService,
  ) {}

  /*public async execute({ email, password }: ISignInRequest): Promise<{
    access_token: string;
    mfa_required: boolean;
    refresh_token: string;
  }> {
    const entity = await this.entity_repository.findById(entity_id);
    if (!entity) throw new AppError('Empresa não encontrada', 404);
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
          name: '',
          photo: '',
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

    // 7. Gera Refresh Token
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
    // 8. Armazena apenas o hash do refresh token
    const token_hash = generateHash(refresh_token);
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
  }*/

  public async execute({ email, password }: ISignInRequest): Promise<{
    login_token: string;
    requires_entity_selection: boolean;
    entities: entity_name[];
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    // 1. Localiza a Identity
    const identity =
      await this.identity_repository.find_by_email(normalizedEmail);
    if (!identity) throw new AppError('Credenciais inválidas');
    // 2. Valida a senha
    const validPassword = await argon2.verify(identity.password_hash, password);
    if (!validPassword) throw new AppError('Senha inválida');
    // 3. Localiza o Profile
    const profile = await this.profile_repository.find_identity_id(identity.id);
    if (!profile) throw new AppError('Perfil não encontrado', 404);
    // 4. Busca os vínculos dessa Identity
    const memberships =
      await this.entity_membership_repository.find_list_profile_id(profile.id);
    const customers =
      await this.entity_membercustomer_repository.find_list_profile_id(
        profile.id,
      );
    // 5. Monta a lista de empresas
    // 5. Agrupa por Entity
    const entitiesMap = new Map<string, entity_name>();
    for (const membership of memberships) {
      if (membership.status.toLowerCase() !== 'ativo') continue;
      const existing = entitiesMap.get(membership.entity_id);
      if (existing) {
        existing.roles.push(...membership.roles);
      } else {
        entitiesMap.set(membership.entity_id, {
          id: membership.entity_id,
          entity_name: membership.name,
          roles: membership.roles,
        });
      }
    }
    for (const customer of customers) {
      if (customer.status.toLowerCase() !== 'ativo') continue;
      const existing = entitiesMap.get(customer.entity_id);
      if (existing) {
        existing.roles.push('cliente');
      } else {
        entitiesMap.set(customer.entity_id, {
          id: customer.entity_id,
          entity_name: customer.name,
          roles: ['cliente'],
        });
      }
    }
    const entities = Array.from(entitiesMap.values());
    if (entities.length === 0)
      throw new AppError('Usuário não pertence a nenhuma organização', 403);
    // 6. Cria um token temporário para continuar o login
    const login_token = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        mfa_required: identity.mfa_required,
        type: 'challenge',
        iss: 'saas-auth',
      },
      {
        expiresIn: '10m',
      },
    );
    // 7. Se só existe uma empresa, o frontend pode seguir
    return {
      login_token,
      requires_entity_selection: entities.length > 1,
      entities,
    };
  }
}
