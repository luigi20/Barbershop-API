import { randomUUID } from 'crypto';
import { generateHash } from '@modules/utils/functions';
import { IRefreshTokensRepository } from '@modules/auth/refresh_token/shared/repositories/abstract_class/irefresh-tokens-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { ICustomerRepository } from '@modules/business/customer/shared/repositories/abstract_class/icustomer-repository';
import { Entity_Customer } from '@modules/business/entity_customer/shared/models/entity_customer';
import { IEntityCustomerRepository } from '@modules/business/entity_customer/shared/repositories/abstract_class/ientitycustomer-repository';
import { IEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { AppError } from '@modules/utils/app_error';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface IMFATokenPayload {
  sub: string;
  sid: string;
  jti: string;
  profile_id: string;
  entity_id: string;
  code: string;
  type: string;
  is_superuser: boolean;
  mfa_pending: boolean;
  iss: string;
  name: string;
  photo: string;
  roles: string[];
}

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly jwt_service: JwtService,
    private readonly identity_repository: IIdentityRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_customer_repository: IEntityCustomerRepository,
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly customer_repository: ICustomerRepository,
    private readonly refresh_repository: IRefreshTokensRepository,
    private readonly entity_repository: IEntityRepository,
  ) {}

  async execute(
    refresh_token: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    let payload: IMFATokenPayload;
    try {
      payload = this.jwt_service.verify<IMFATokenPayload>(refresh_token);
    } catch {
      throw new AppError('Token inválido ou expirado', 401);
    }
    if (payload?.type !== 'refresh') throw new AppError('Token inválido', 401);
    if (
      !payload.sid ||
      !payload.jti ||
      !payload.sub ||
      !payload.entity_id ||
      !payload.profile_id
    )
      throw new AppError('Sessao invalida; faca login novamente', 401);
    const now = new Date();
    const session = await this.refresh_repository.find_session(payload.sid);
    const previousHash = generateHash(refresh_token);
    if (
      !session ||
      session.identity_id !== payload.sub ||
      session.token_hash !== previousHash ||
      session.revoked_at ||
      session.expires_at <= now
    )
      throw new AppError('Sessao invalida ou revogada', 401);
    const entity = await this.entity_repository.findById(payload.entity_id);
    if (
      !entity ||
      !['ativo', 'pendente'].includes(entity.status?.toLowerCase())
    )
      throw new AppError('Empresa indisponivel', 403);
    const identity = await this.identity_repository.find_by_id(payload.sub);
    if (!identity) throw new AppError('Credenciais inválidas', 401);
    if (identity.status?.toLowerCase() !== 'ativo')
      throw new AppError('Identidade inativa', 401);
    const profile = await this.profile_repository.find_identity_id(identity.id);
    if (!profile) throw new AppError('Perfil não encontrado', 404);
    if (profile.id !== payload.profile_id)
      throw new AppError('Perfil invalido', 401);
    const membership = await this.entity_membership_repository.find_one(
      payload.entity_id,
      profile.id,
    );
    const customer_exists = await this.customer_repository.find_profile_id(
      profile.id,
    );
    let entity_customer: Entity_Customer = null;
    if (customer_exists)
      entity_customer = await this.entity_customer_repository.find_one(
        payload.entity_id,
        customer_exists._id,
      );
    const isMember = membership && membership.status.toLowerCase() === 'ativo';
    const isCustomer =
      entity_customer && entity_customer?.status?.toLowerCase() === 'ativo';
    if (!isMember && !isCustomer)
      throw new AppError('Usuário não pertence a esta organização', 403);
    let roles: string[] = [];
    if (isMember) roles = membership.roles.map((item) => item);
    if (isCustomer) roles.push('cliente');
    const access_token = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        entity_id: payload.entity_id,
        name: profile.name,
        photo: profile.photo,
        roles: roles,
        type: 'access',
        is_superuser: identity.is_superuser,
        iss: 'saas-auth',
      },
      {
        expiresIn: '15m',
      },
    );
    const expiresIn = Math.floor(
      (session.expires_at.getTime() - Date.now()) / 1000,
    );
    if (expiresIn <= 0) throw new AppError('Sessao expirada', 401);
    const nextToken = this.jwt_service.sign(
      {
        sub: identity.id,
        profile_id: profile.id,
        entity_id: payload.entity_id,
        type: 'refresh',
        sid: session.id,
        jti: randomUUID(),
        iss: 'saas-auth',
      },
      { expiresIn },
    );
    if (
      !(await this.refresh_repository.rotate(
        session.id,
        previousHash,
        generateHash(nextToken),
        new Date(),
      ))
    ) {
      throw new AppError('Refresh ja utilizado ou revogado', 401);
    }
    return { access_token, refresh_token: nextToken };
  }
}
