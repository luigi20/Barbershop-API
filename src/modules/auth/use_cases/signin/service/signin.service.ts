import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityCustomerRepository } from '@modules/business/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';
import { IEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
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

  public async execute({ email, password }: ISignInRequest): Promise<{
    login_token: string;
    requires_entity_selection: boolean;
    entities: entity_name[];
  }> {
    const normalizedEmail = email.toLowerCase().trim();
    // 1. Localiza a Identity
    const identity =
      await this.identity_repository.find_by_email(normalizedEmail);
    if (!identity || !identity.status)
      throw new AppError('Credenciais inválidas');
    if (identity.status.toLowerCase() !== 'ativo')
      throw new AppError('Usuário bloqueado', 401);
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
          entity_name: membership.entity_name,
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
        mfa_pending: identity.mfa_required,
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
