import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IdentityProviderService } from './identity_provider.service';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { Identity } from '@modules/auth/identity/shared/models/identity';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { AppError } from '@modules/utils/app_error';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { entity_name } from '@modules/utils/types/types';
import { IEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { IEntityCustomerRepository } from '@modules/business/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';

export interface IRequest_Login_Social {
  provider: string;
  token: string;
}

export interface IResponse_Login_Social {
  login_token: string;
  mfa_required: boolean;
  entities: entity_name[];
}

@Injectable()
export class AuthSocialLoginService {
  constructor(
    private readonly identity_repository: IIdentityRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_repository: IEntityRepository,
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly entity_membercustomer_repository: IEntityCustomerRepository,
    private readonly jwt_service: JwtService,
    private readonly identity_provider_service: IdentityProviderService,
  ) {}

  async execute({
    provider,
    token,
  }: IRequest_Login_Social): Promise<IResponse_Login_Social> {
    const profile_provider = await this.identity_provider_service.validate(
      provider,
      token,
    );
    if (!profile_provider?.email)
      throw new AppError(
        'Não foi possível obter o e-mail da conta social',
        401,
      );
    let identity = await this.identity_repository.find_by_email(
      profile_provider.email,
    );
    if (!identity) {
      identity = new Identity({
        email: profile_provider.email,
        status: 'ativo',
        mfa_required: false,
        provider: profile_provider.type,
      });
      await this.identity_repository.create(identity);
      const profile = new Profile({
        identity_id: identity.id,
        name: `${profile_provider.name ?? ''} ${
          profile_provider.last_name ?? ''
        }`.trim(),
      });
      await this.profile_repository.create(profile);
    }
    if (identity.status.toLowerCase() !== 'ativo')
      throw new AppError('Usuário inativo', 403);
    const profile = await this.profile_repository.find_identity_id(identity.id);
    if (!profile) throw new AppError('Perfil não encontrado', 404);
    const memberships =
      await this.entity_membership_repository.find_list_profile_id(profile.id);
    const customers =
      await this.entity_membercustomer_repository.find_list_profile_id(
        profile.id,
      );
    const entity_ids = new Set<string>();
    for (const membership of memberships ?? []) {
      if (membership.status?.toLowerCase() === 'ativo')
        entity_ids.add(membership.entity_id);
    }
    for (const customer of customers ?? []) {
      if (customer.status?.toLowerCase() === 'ativo')
        entity_ids.add(customer.entity_id);
    }
    const entities: entity_name[] = [];
    for (const entity_id of entity_ids) {
      const entity = await this.entity_repository.findById(entity_id);
      if (!entity) continue;
      if (entity.status?.toLowerCase() !== 'ativo') continue;
      const membership = memberships?.find(
        (item) =>
          item.entity_id === entity_id &&
          item.status?.toLowerCase() === 'ativo',
      );
      const customer = customers?.find(
        (item) =>
          item.entity_id === entity_id &&
          item.status?.toLowerCase() === 'ativo',
      );
      const roles: string[] = [];
      if (membership) roles.push(...membership.roles);
      if (customer) roles.push('cliente');
      entities.push({
        id: entity._id,
        entity_name: entity.name,
        roles: [...new Set(roles)],
      });
    }
    /**
     * 9. Usuário autenticado pelo provider,
     * mas não possui nenhuma empresa vinculada.
     */
    if (entities.length === 0) {
      throw new AppError(
        'Usuário não possui nenhuma organização vinculada',
        403,
      );
    }

    /**
     * 10. Gera login_token
     *
     * Esse NÃO é access_token.
     *
     * Ele apenas representa uma autenticação parcialmente concluída.
     */
    const login_token = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        type: 'login',
        provider,
        iss: 'saas-auth',
      },
      {
        algorithm: 'RS256',
        expiresIn: '10m',
        keyid: 'v1',
      },
    );

    /**
     * 11. Informa se MFA será necessário.
     *
     * O MFA ainda será validado depois que
     * a Entity for selecionada.
     */
    return {
      login_token,
      mfa_required: identity.mfa_required,
      entities,
    };
  }
}
