import { assertMemberRoles } from '@modules/auth/security/request-security';
import { Injectable } from '@nestjs/common';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { AppError } from '@modules/utils/app_error';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { PrismaService } from 'infra/database/prisma/prisma.service';
import { IEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { Entity_Membership } from '@modules/business/entity_membership/shared/models/entity_membership';
import { MemberRole } from '@modules/utils/enum';

interface IMembersRequest {
  entity_id: string;
  identity_id?: string;
  profile_id?: string;
  roles: string[];
  status: string;
  roles_auth: MemberRole[];
}

@Injectable()
export class EntityMembershipUpdateService {
  constructor(
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_repository: IEntityRepository,
    private readonly identity_repository: IIdentityRepository,
    private readonly prisma: PrismaService,
  ) {}

  public async execute({
    roles,
    entity_id,
    status,
    roles_auth,
    identity_id,
    profile_id,
  }: IMembersRequest): Promise<Entity_Membership> {
    const info_entity =
      await this.entity_repository.findByIdSelectIdAndName(entity_id);
    if (!info_entity) throw new AppError('Empresa não existe', 404);
    if (!profile_id && !identity_id)
      throw new AppError('profile_id obrigatório', 400);
    const profile_exists = profile_id
      ? await this.profile_repository.find_one(profile_id)
      : await this.profile_repository.find_identity_id(identity_id);
    if (!profile_exists) throw new AppError('Perfil não existe', 404);
    const identity_exists = await this.identity_repository.find_by_id(
      profile_exists.identity_id,
    );
    if (!identity_exists) throw new AppError('Identidade não existe', 404);
    const entity_membership_exists =
      await this.entity_membership_repository.find_one(
        info_entity.id,
        profile_exists.id,
      );
    if (!entity_membership_exists)
      throw new AppError('Usuário não pertence a essa organização', 404);
    assertMemberRoles(roles_auth, roles, entity_membership_exists.roles);
    const entity_membership = new Entity_Membership({
      entity_id: entity_membership_exists.entity_id,
      profile_id: profile_exists.id,
      roles: [...new Set(roles)],
      status,
      created_at: entity_membership_exists.created_at,
      profile_name: profile_exists.name,
      phone: profile_exists.phone,
      photo: profile_exists.photo,
      birth_date: profile_exists.birth_date,
      entity_name: info_entity.name,
      identity_id: profile_exists.identity_id,
      email: identity_exists.email,
    });
    const prisma = this.prisma.getPrismaClient();
    try {
      await prisma.$transaction(async (tx) => {
        await this.entity_membership_repository.update(entity_membership, tx);
      });
    } catch (error) {
      throw new AppError(
        'Não foi possível concluir o cadastro. Tente novamente.',
        500,
      );
    }
    return entity_membership;
  }
}
