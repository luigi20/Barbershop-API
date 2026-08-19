import { Injectable } from '@nestjs/common';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { AppError } from '@modules/utils/app_error';
import { IEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { Entity_Membership } from '@modules/auth/entity_membership/shared/models/entity_membership';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { Identity } from '@modules/auth/identity/shared/models/identity';
import { userPasswordValidator } from '@modules/utils/functions';
import argon2 from 'argon2';
import { Profile } from '@modules/auth/profile/shared/models/profile';
import { PrismaService } from 'infra/database/prisma/prisma.service';

interface IMembersRequest {
  entity_id: string;
  email: string;
  password: string;
  mfa_required: boolean;
  name: string;
  phone: string;
  photo: string;
  birth_date: Date;
  roles: string[];
}

@Injectable()
export class EntityMembershipCreateService {
  constructor(
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_repository: IEntityRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly prisma: PrismaService,
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
    entity_id,
  }: IMembersRequest): Promise<Entity_Membership> {
    const password_validator = userPasswordValidator();
    const errors = password_validator.validate(password, { list: true });
    if (Array.isArray(errors) && errors.length > 0)
      throw new AppError('Senha inválida', 400);
    const info_entity =
      await this.entity_repository.findByIdSelectIdAndName(entity_id);
    if (!info_entity) throw new AppError('Empresa não existe', 404);
    const identity_exists = await this.identity_repository.find_by_email(email);
    let entity_membership: Entity_Membership = null;
    if (!identity_exists) {
      const password_hash = await argon2.hash(password);
      const identity = new Identity({
        email: email,
        mfa_required: mfa_required,
        status: 'ativo',
        is_superuser: false,
        password_hash: password_hash,
        provider: 'local',
      });
      const profile = new Profile({
        identity_id: identity.id,
        name: name,
        birth_date: birth_date,
        phone: phone,
        photo: photo,
        status: 'ativo',
      });
      entity_membership = new Entity_Membership({
        entity_id: entity_id,
        profile_id: profile.id,
        roles: roles,
        status: 'ativo',
        birth_date: birth_date,
        phone: phone,
        photo: photo,
        name: name,
        profile_name: profile.name,
        entity_name: info_entity.name,
      });
      try {
        await this.prisma.$transaction(async (tx) => {
          await this.identity_repository.create(identity, tx);
          await this.profile_repository.create(profile, tx);
          await this.entity_membership_repository.create(entity_membership, tx);
        });
      } catch (error) {
        throw new AppError(
          'Não foi possível concluir o cadastro. Tente novamente.',
          500,
        );
      }
    } else {
      const profile = await this.profile_repository.find_identity_id(
        identity_exists.id,
      );
      if (!profile) return;
      entity_membership = new Entity_Membership({
        entity_id: entity_id,
        profile_id: profile.id,
        roles: roles,
        status: 'ativo',
        birth_date: birth_date,
        phone: phone,
        photo: photo,
        name: name,
        profile_name: profile.name,
        entity_name: info_entity.name,
      });
      await this.entity_membership_repository.create(entity_membership);
    }
    return entity_membership;
  }
}
