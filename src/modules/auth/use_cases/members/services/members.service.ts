import { Injectable } from '@nestjs/common';
import { IEntityMembershipRepository } from '@modules/auth/entity_membership/shared/repositories/abstract_class/ientitymembership-repository';
import { Entity_Membership } from '@modules/auth/entity_membership/shared/models/entity_membership';
import { IProfileRepository } from '@modules/auth/profile/shared/repositories/abstract_class/iprofile-repository';
import { IEntityRepository } from '@modules/auth/entity/shared/repositories/abstract_class/ientity-repository';
import { AppError } from '@modules/utils/app_error';

interface IMembersRequest {
  entity_id: string;
  identity_id: string;
}

@Injectable()
export class MembersService {
  constructor(
    private readonly entity_membership_repository: IEntityMembershipRepository,
    private readonly profile_repository: IProfileRepository,
    private readonly entity_repository: IEntityRepository,
  ) {}

  public async execute({
    entity_id,
    identity_id,
  }: IMembersRequest): Promise<Entity_Membership[]> {
    const entity = await this.entity_repository.findById(entity_id);
    if (!entity) throw new AppError('Empresa não existe', 404);
    const members =
      await this.entity_membership_repository.find_list_entity_id(entity_id);
    if (members.length === 0) return [];
    await Promise.all(
      members.map(async (member) => {
        const profile =
          await this.profile_repository.find_identity_id(identity_id);
        if (profile) {
          member.entity_name = entity.name;
          member.profile_name = profile.name;
          member.phone = profile.phone;
          member.photo = profile.photo;
        }
      }),
    );
    return members;
  }
}
