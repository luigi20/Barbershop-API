import { assertMemberRoles } from '@modules/auth/security/request-security';
import { MemberRole } from '@modules/utils/enum';
import { Injectable } from '@nestjs/common';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { AppError } from '@modules/utils/app_error';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { Identity } from '@modules/auth/identity/shared/models/identity';
import { userPasswordValidator } from '@modules/utils/functions';
import argon2 from 'argon2';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { IEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { Entity_Membership } from '@modules/business/entity_membership/shared/models/entity_membership';
import { Identity_Credential } from '@modules/auth/identity_credential/shared/models/identity_credential';
import { IIdentityCredentialRepository } from '@modules/auth/identity_credential/shared/repositories/abstract_class/iidentitycredential-repository';
import { isUniqueConflict } from '../../../p1-unique-conflict';

interface IMembersRequest {
  entity_id: string;
  email: string;
  password: string;
  mfa_required: boolean;
  name: string;
  phone: string;
  photo: string;
  birth_date: string;
  roles: string[];
  roles_auth: MemberRole[];
}

@Injectable()
export class EntityMembershipCreateService {
  constructor(
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_repository: IEntityRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly prisma: PrismaService,
    private readonly identity_credential_repository: IIdentityCredentialRepository,
  ) {}

  public async execute({
    birth_date,
    email,
    mfa_required,
    name,
    password,
    phone,
    photo,
    roles,
    roles_auth,
    entity_id,
  }: IMembersRequest): Promise<Entity_Membership> {
    assertMemberRoles(roles_auth, roles);
    const password_validator = userPasswordValidator();
    const errors = password_validator.validate(password, { list: true });
    if (Array.isArray(errors) && errors.length > 0)
      throw new AppError('Senha inválida', 400);
    const info_entity =
      await this.entity_repository.findByIdSelectIdAndName(entity_id);
    if (!info_entity) throw new AppError('Empresa não existe', 404);
    const identity_exists = await this.identity_repository.find_by_email(
      email.toLowerCase().trim(),
    );
    let entity_membership: Entity_Membership = null;
    if (!identity_exists) {
      const password_hash = await argon2.hash(password);
      const identity = new Identity({
        email: email.toLowerCase().trim(),
        mfa_required: mfa_required,
        status: 'ativo',
        is_superuser: false,
      });
      const identity_credential = new Identity_Credential({
        identity_id: identity.id,
        provider: 'local',
        password_hash: password_hash,
      });
      const profile = new Profile({
        identity_id: identity.id,
        name: name,
        birth_date: new Date(birth_date),
        phone: phone,
        photo: photo,
        status: 'ativo',
      });
      entity_membership = new Entity_Membership({
        entity_id: entity_id,
        profile_id: profile.id,
        roles: roles,
        status: 'ativo',
        birth_date: new Date(birth_date),
        phone: phone,
        photo: photo,
        name: name,
        profile_name: profile.name,
        entity_name: info_entity.name,
        identity_id: identity.id,
        email: identity.email,
      });
      const prisma = this.prisma.getPrismaClient();
      try {
        await prisma.$transaction(async (tx) => {
          await this.identity_repository.create(identity, tx);
          await this.profile_repository.create(profile, tx);
          await this.entity_membership_repository.create(entity_membership, tx);
          await this.identity_credential_repository.create(
            identity_credential,
            tx,
          );
        });
      } catch (error) {
        if (isUniqueConflict(error))
          throw new AppError('Membro já cadastrado', 409);
        throw new AppError(
          'Não foi possível concluir o cadastro. Tente novamente.',
          500,
        );
      }
    } else {
      const profile = await this.profile_repository.find_identity_id(
        identity_exists.id,
      );
      if (!profile) throw new AppError('Perfil nao existe', 404);
      const entity_membership_exists =
        await this.entity_membership_repository.find_one(entity_id, profile.id);
      assertMemberRoles(
        roles_auth,
        roles,
        entity_membership_exists?.roles ?? [],
      );
      if (entity_membership_exists)
        throw new AppError('Membro ja cadastrado', 409);
      entity_membership = new Entity_Membership({
        entity_id,
        profile_id: profile.id,
        roles: [...new Set(roles)],
        status: 'ativo',
        birth_date: profile.birth_date,
        phone: profile.phone,
        photo: profile.photo,
        profile_name: profile.name,
        entity_name: info_entity.name,
        identity_id: identity_exists.id,
        email: identity_exists.email,
      });
      try {
        await this.entity_membership_repository.create(entity_membership);
      } catch (error) {
        if (isUniqueConflict(error))
          throw new AppError('Membro já cadastrado', 409);
        throw error;
      }
    }
    return entity_membership;
  }
}
