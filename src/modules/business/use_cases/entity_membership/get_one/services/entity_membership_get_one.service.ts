import { Injectable, Optional } from '@nestjs/common';
import { IIdentityRepository } from '@modules/auth/identity/shared/repositories/abstract_class/iidentity-repository';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { AppError } from '@modules/utils/app_error';
import { IEntityMembershipRepository } from '@modules/business/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { Entity_Membership } from '@modules/business/entity_membership/shared/models/entity_membership';
interface IMembersRequest {
  entity_id: string;
  profile_id: string;
  is_superuser: boolean;
  entity_id_user: string;
}

@Injectable()
export class EntityMembershipGetOneService {
  constructor(
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_repository: IEntityRepository,
    @Optional() private readonly identity_repository?: IIdentityRepository,
  ) {}

  public async execute({
    entity_id,
    profile_id,
    entity_id_user,
    is_superuser,
  }: IMembersRequest): Promise<Entity_Membership> {
    if (!profile_id) throw new AppError('profile_id obrigatório', 400);
    if (!is_superuser && entity_id !== entity_id_user)
      throw new AppError(
        'Usuário não tem permissão de acessar dados de usuários de outra empresa',
        400,
      );
    const member = await this.entity_membership_repository.find_one(
      entity_id,
      profile_id,
    );
    if (!member) throw new AppError('Usuário não existe', 404);
    const profile = await this.profile_repository.find_one(member.profile_id);
    if (!profile) return;
    member.profile_name = profile.name;
    member.phone = profile.phone;
    member.photo = profile.photo;
    member.birth_date = profile.birth_date;
    member.identity_id = profile.identity_id;
    if (this.identity_repository)
      member.email = (
        await this.identity_repository.find_by_id(profile.identity_id)
      )?.email;
    const entity = await this.entity_repository.findByIdSelectIdAndName(
      member.entity_id,
    );
    if (entity) member.entity_name = entity.name;
    return member;
  }
}
